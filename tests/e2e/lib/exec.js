import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { PROJECT_ROOT, SRC_TAURI_DIR } from './paths.js';

let cachedWinLibsBin = undefined;

export function findWinLibsBin() {
  if (cachedWinLibsBin !== undefined) return cachedWinLibsBin;

  const candidates = [];
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const wingetPkgs = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
  if (fs.existsSync(wingetPkgs)) {
    try {
      for (const entry of fs.readdirSync(wingetPkgs, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name.toLowerCase().includes('winlibs')) {
          const bin = path.join(wingetPkgs, entry.name, 'mingw64', 'bin');
          if (fs.existsSync(path.join(bin, 'gcc.exe'))) {
            candidates.push(bin);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback check on C:\mingw64\bin or scoop/chocolatey
  for (const p of ['C:\\mingw64\\bin', 'C:\\msys64\\mingw64\\bin']) {
    if (fs.existsSync(path.join(p, 'gcc.exe'))) {
      candidates.push(p);
    }
  }

  cachedWinLibsBin = candidates.length > 0 ? candidates[0] : null;
  return cachedWinLibsBin;
}

export function execCommand(command, args = [], options = {}) {
  const {
    cwd = PROJECT_ROOT,
    env = process.env,
    timeoutMs = 120000,
    shell = false,
  } = options;

  return new Promise((resolve) => {
    const start = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(command, args, {
      cwd,
      env,
      shell,
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (process.platform === 'win32' && child.pid) {
          spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
        } else {
          child.kill('SIGKILL');
        }
      } catch {
        // ignore
      }
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        status: 1,
        stdout,
        stderr: stderr + '\n' + err.message,
        timedOut,
        durationMs: Date.now() - start,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        status: timedOut ? 124 : (code ?? 1),
        stdout,
        stderr,
        timedOut,
        durationMs: Date.now() - start,
      });
    });
  });
}

export async function execCargo(args = [], options = {}) {
  const winLibsBin = findWinLibsBin();
  const env = { ...process.env, ...(options.env || {}) };
  if (winLibsBin) {
    env.PATH = `${winLibsBin}${path.delimiter}${env.PATH || ''}`;
  }
  const hasManifest = args.some((a) => a === '--manifest-path' || a.startsWith('--manifest-path='));
  const finalArgs = hasManifest
    ? args
    : [args[0], '--manifest-path', path.join(SRC_TAURI_DIR, 'Cargo.toml'), ...args.slice(1)];

  return execCommand('cargo', finalArgs, {
    timeoutMs: 150000,
    ...options,
    env,
  });
}

export async function execPowershell(scriptPath, scriptArgs = [], options = {}) {
  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...scriptArgs];
  return execCommand('powershell.exe', args, {
    timeoutMs: 60000,
    ...options,
  });
}
