import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export function createSandbox(prefix = 'stealth-e2e-') {
  const id = crypto.randomBytes(6).toString('hex');
  const root = path.join(os.tmpdir(), `${prefix}${id}`);
  const appDataDir = path.join(root, 'AppData', 'Roaming');
  const legacyDir = path.join(appDataDir, 'com.stealthprompter.desktop');
  const targetDir = path.join(appDataDir, 'com.stealth.desktop');

  fs.mkdirSync(appDataDir, { recursive: true });

  return {
    root,
    appDataDir,
    legacyDir,
    targetDir,
    env: {
      APPDATA: appDataDir,
      USERPROFILE: root,
    },
    makeTempFile(name, content = '') {
      const p = path.join(root, name);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, content, 'utf8');
      return p;
    },
    seedLegacy({ settings = null, scripts = {} } = {}) {
      fs.mkdirSync(legacyDir, { recursive: true });
      if (settings !== null) {
        const val = typeof settings === 'string' ? settings : JSON.stringify(settings, null, 2);
        fs.writeFileSync(path.join(legacyDir, 'settings.json'), val, 'utf8');
      }
      const entries = Object.entries(scripts);
      if (entries.length > 0) {
        const scriptsDir = path.join(legacyDir, 'scripts');
        fs.mkdirSync(scriptsDir, { recursive: true });
        for (const [sid, data] of entries) {
          const val = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          fs.writeFileSync(path.join(scriptsDir, `${sid}.json`), val, 'utf8');
        }
      }
    },
    seedTarget({ settings = null, scripts = {} } = {}) {
      fs.mkdirSync(targetDir, { recursive: true });
      if (settings !== null) {
        const val = typeof settings === 'string' ? settings : JSON.stringify(settings, null, 2);
        fs.writeFileSync(path.join(targetDir, 'settings.json'), val, 'utf8');
      }
      const entries = Object.entries(scripts);
      if (entries.length > 0) {
        const scriptsDir = path.join(targetDir, 'scripts');
        fs.mkdirSync(scriptsDir, { recursive: true });
        for (const [sid, data] of entries) {
          const val = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          fs.writeFileSync(path.join(scriptsDir, `${sid}.json`), val, 'utf8');
        }
      }
    },
    cleanup() {
      try {
        fs.rmSync(root, { recursive: true, force: true });
      } catch {
        // best effort cleanup
      }
    },
  };
}
