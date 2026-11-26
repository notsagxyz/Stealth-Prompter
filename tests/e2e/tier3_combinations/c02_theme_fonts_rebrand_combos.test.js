import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  SRC_TAURI_DIR,
  SRC_TAURI_ICONS_DIR,
  GITHUB_DIR,
  readJsonSafe,
  readTextSafe,
} from '../lib/paths.js';
import { execCargo } from '../lib/exec.js';
import { launchCdpSession } from '../lib/cdp_browser.js';

describe('Tier 3 Combinations — Theme, Fonts & Rebrand (3 tests)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 980, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('T3-05 (F1 x F4 x F5): Crimson accent preset + local @fontsource + prefers-reduced-motion across Launcher & HUD', async () => {
    await cdp.setReducedMotion(true);
    try {
      await cdp.openPage('index.html', {
        width: 980,
        height: 640,
        tauriMock: { settings: { accent_color: 'crimson' } },
      });

      const launcherState = await cdp.evaluate(async () => {
        await document.fonts.ready;
        const cs = getComputedStyle(document.documentElement);
        return {
          accent: cs.getPropertyValue('--accent').trim().toLowerCase(),
          loadedFonts: Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => f.family),
        };
      });
      assert.equal(launcherState.accent, '#f43f5e', 'Crimson preset must set --accent to #f43f5e on Launcher');
      assert.ok(launcherState.loadedFonts.some((f) => /inter/i.test(f)), 'Local Inter font must load');
      assert.equal(
        cdp.getNetworkRequests().filter((r) => !r.url.startsWith(cdp.baseUrl) && !r.url.startsWith('data:')).length,
        0
      );

      await cdp.openPage('hud.html', {
        width: 1000,
        height: 350,
        tauriMock: { windowLabel: 'prompter', settings: { accent_color: 'crimson' } },
      });
      const hudAccent = await cdp.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()
      );
      assert.equal(hudAccent, '#f43f5e', 'Crimson preset must sync to HUD --accent token');
    } finally {
      await cdp.setReducedMotion(false);
    }
  });

  it('T3-06 (F2 x F5): Legacy %APPDATA% migration + Launcher "Recent scripts" glass cards & Violet default', async () => {
    const res = await execCargo(['test', '--lib', 'migrat']);
    assert.equal(res.status, 0, `Migration unit tests failed:\n${res.stdout}\n${res.stderr}`);
    assert.doesNotMatch(res.stdout, /0 passed; 0 failed/, 'Migration test must exist and pass');

    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: {
        settings: { scroll_speed: 4.2 }, // no accent_color -> Violet default
        scripts: [
          { id: 'mig-1', title: 'Migrated Keynote', content: 'Welcome back from legacy AppData migration.', speed: 4.2 },
        ],
      },
    });

    const ui = await cdp.evaluate(() => ({
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase(),
      body: document.body.innerText,
    }));
    assert.equal(ui.accent, '#7c6cff', 'Default accent after migration must be Violet #7c6cff');
    assert.ok(ui.body.includes('Migrated Keynote'), 'Migrated script title must render in Launcher');
    assert.ok(ui.body.includes('Welcome back from legacy AppData migration'), 'Script snippet must render on glass card');
  });

  it('T3-07 (F2 x F6 x F8): Rebrand (Stealth/Stealth Prompter/stealthprompter) + Ninja Icon + README + CI release.yml parity', () => {
    const tauriConf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    const pkg = readJsonSafe(path.join(PROJECT_ROOT, 'package.json'));
    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    const releaseYml = readTextSafe(path.join(GITHUB_DIR, 'workflows', 'release.yml'));

    assert.equal(tauriConf.productName, 'Stealth');
    assert.equal(tauriConf.identifier, 'com.stealth.desktop');
    assert.equal(pkg.name, 'stealthprompter');
    assert.match(readme, /Stealth Prompter/);
    assert.match(readme, /stealthprompter/);
    assert.match(releaseYml, /Stealth/);
    assert.doesNotMatch(releaseYml, /StealthPrompter|stealth-prompter/);
    assert.ok(fs.existsSync(path.join(SRC_TAURI_ICONS_DIR, 'icon.icns')), 'Exported icon.icns must exist');
  });
});
