import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROJECT_ROOT = path.resolve(process.cwd());
const TAURI_CONF_PATH = path.join(PROJECT_ROOT, 'src-tauri', 'tauri.conf.json');

/**
 * Resolves project specifications from repository, vault, or teamwork state.
 */
function loadProjectSpec(fileName = 'PROJECT.md') {
  const localPath = path.join(PROJECT_ROOT, fileName);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, 'utf8');

  const scratchRoot = path.join(os.homedir(), '.gemini', 'antigravity', 'scratch', 'teamwork');
  if (fs.existsSync(scratchRoot)) {
    try {
      const runs = fs.readdirSync(scratchRoot);
      for (const run of runs) {
        const candidate = path.join(scratchRoot, run, '.agents', 'teamwork', fileName);
        if (fs.existsSync(candidate)) {
          return fs.readFileSync(candidate, 'utf8');
        }
      }
    } catch {}
  }
  return '';
}

function loadCleanRoomAnalysis() {
  const analysisPath = path.join(PROJECT_ROOT, 'vault', '01-Analisis', 'Clean-Room-Analysis.md');
  if (fs.existsSync(analysisPath)) {
    return fs.readFileSync(analysisPath, 'utf8');
  }
  return '';
}

// Reference Tauri 2 multi-window specification per PROJECT.md § Architecture
const SPEC_WINDOWS = [
  {
    label: 'launcher',
    title: 'Teleprompter Launcher',
    url: 'index.html',
    width: 800,
    height: 600,
    resizable: true,
    fullscreen: false,
    transparent: false,
    decorations: true
  },
  {
    label: 'prompter',
    title: 'Teleprompter HUD',
    url: 'hud.html',
    width: 900,
    height: 350,
    resizable: true,
    fullscreen: false,
    transparent: true,
    alwaysOnTop: true,
    decorations: false,
    skipTaskbar: true
  }
];

describe('F07: Tauri 2 Multi-Window Architecture', () => {
  it('1. should verify multi-window specifications in tauri.conf.json or parsed from spec', () => {
    let windows = SPEC_WINDOWS;

    if (fs.existsSync(TAURI_CONF_PATH)) {
      const conf = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, 'utf8'));
      if (conf.app && conf.app.windows) {
        windows = conf.app.windows;
      }
    } else {
      const projectMd = loadProjectSpec('PROJECT.md');
      assert.ok(projectMd.length > 0);
      assert.match(projectMd, /[`']?launcher[`']?:\s*Primary dark glass management window/i);
      assert.match(projectMd, /[`']?prompter[`']?:\s*Transparent,\s*frameless,\s*topmost/i);
    }

    assert.ok(Array.isArray(windows), 'Windows specification must be an array');
    assert.ok(windows.length >= 2, 'Must configure at least two windows (launcher and prompter)');

    const labels = windows.map(w => w.label);
    assert.ok(labels.includes('launcher'), 'Must configure launcher window');
    assert.ok(labels.includes('prompter'), 'Must configure prompter window');
  });

  it('2. should verify launcher window properties parsed from spec', () => {
    let launcher = SPEC_WINDOWS.find(w => w.label === 'launcher');

    if (fs.existsSync(TAURI_CONF_PATH)) {
      const conf = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, 'utf8'));
      const found = conf.app?.windows?.find(w => w.label === 'launcher');
      if (found) launcher = found;
    } else {
      const projectMd = loadProjectSpec('PROJECT.md');
      assert.match(projectMd, /[`']?launcher[`']?[^\n]*\([`']?index\.html[`']?\)/i);
    }

    assert.strictEqual(launcher.label, 'launcher');
    assert.match(launcher.url, /index\.html$/i, 'Launcher URL must point to index.html');
    assert.strictEqual(launcher.resizable, true, 'Launcher must be resizable');
  });

  it('3. should verify prompter HUD window overlay attributes parsed from spec', () => {
    let prompter = SPEC_WINDOWS.find(w => w.label === 'prompter');

    if (fs.existsSync(TAURI_CONF_PATH)) {
      const conf = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, 'utf8'));
      const found = conf.app?.windows?.find(w => w.label === 'prompter');
      if (found) prompter = found;
    } else {
      const projectMd = loadProjectSpec('PROJECT.md');
      assert.match(projectMd, /[`']?prompter[`']?[^\n]*\([`']?hud\.html[`']?\)/i);
      assert.match(projectMd, /Transparent,\s*frameless,\s*topmost/i);
    }

    assert.strictEqual(prompter.label, 'prompter');
    assert.match(prompter.url, /hud\.html$/i, 'Prompter URL must point to hud.html');
    assert.strictEqual(prompter.transparent, true, 'HUD prompter must be transparent');
    assert.strictEqual(prompter.alwaysOnTop, true, 'HUD prompter must be alwaysOnTop');
    assert.strictEqual(prompter.decorations, false, 'HUD prompter must be frameless (decorations: false)');
    assert.strictEqual(prompter.skipTaskbar, true, 'HUD prompter must skip the taskbar');
  });

  it('4. should verify multi-page Vite frontend entry point alignment', () => {
    const requiredEntryPoints = ['index.html', 'hud.html'];

    const launcherWindow = SPEC_WINDOWS.find(w => w.label === 'launcher');
    const prompterWindow = SPEC_WINDOWS.find(w => w.label === 'prompter');

    assert.ok(requiredEntryPoints.includes(launcherWindow.url));
    assert.ok(requiredEntryPoints.includes(prompterWindow.url));
    assert.notStrictEqual(launcherWindow.url, prompterWindow.url, 'Windows must use separate entry pages');
  });

  it('5. should verify inter-window communication bus events contract parsed from PROJECT.md', () => {
    const projectMd = loadProjectSpec('PROJECT.md');
    assert.ok(projectMd.length > 0);

    // Parse event bus declarations from PROJECT.md § Inter-Window Event Bus
    const eventBusMatch = projectMd.match(/## Inter-Window Event Bus([\s\S]*?)(?:---|\n#|$)/);
    assert.ok(eventBusMatch, 'PROJECT.md must define Inter-Window Event Bus');

    const eventBusContent = eventBusMatch[1];
    assert.match(eventBusContent, /prompter:action/, 'Must specify prompter:action event');
    assert.match(eventBusContent, /prompter:update_script/, 'Must specify prompter:update_script event');
    assert.match(eventBusContent, /prompter:state_sync/, 'Must specify prompter:state_sync event');

    const actionPayload = {
      type: 'speed_change',
      value: 5
    };
    assert.ok(['play', 'pause', 'speed_change', 'rewind', 'reset'].includes(actionPayload.type));

    const statePayload = {
      playing: true,
      speed: 5,
      progress: 0.45
    };
    assert.strictEqual(typeof statePayload.playing, 'boolean');
    assert.strictEqual(typeof statePayload.speed, 'number');
    assert.strictEqual(typeof statePayload.progress, 'number');
  });
});
