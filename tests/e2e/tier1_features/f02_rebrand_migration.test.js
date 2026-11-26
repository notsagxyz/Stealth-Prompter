import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  SRC_TAURI_DIR,
  VAULT_DIR,
  readJsonSafe,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { execCargo } from '../lib/exec.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { scanOldBrandLeaks } from '../lib/assertions.js';

describe('F2 — Rebrand to Stealth / Stealth Prompter & AppData Migration (Tier 1)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 980, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F2-T1-01: Naming & availability study in vault/02-Naming/ documents stealthprompter slug', () => {
    const namingDir = path.join(VAULT_DIR, '02-Naming');
    const mdFiles = walkFiles(namingDir, { extensions: ['.md'] });
    assert.ok(mdFiles.length >= 1, 'Expected naming study markdown files in vault/02-Naming/');

    const combined = mdFiles.map((f) => readTextSafe(f)).join('\n');
    assert.ok(/stealthprompter/i.test(combined), 'Naming study must evaluate the chosen stealthprompter slug');
    assert.ok(/github/i.test(combined), 'Naming study must cover GitHub availability');
    assert.ok(/twitter|x\.com|@stealthprompter/i.test(combined), 'Naming study must cover Twitter/X handle availability');
    assert.ok(/crates\.io|npm|domain/i.test(combined), 'Naming study must cover domain/package registry availability');
  });

  it('F2-T1-02: tauri.conf.json, package.json, Cargo.toml, and HTML titles updated to Stealth', () => {
    const tauriConf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    assert.equal(tauriConf.productName, 'Stealth', 'tauri.conf.json productName must be "Stealth"');
    assert.equal(tauriConf.identifier, 'com.stealth.desktop', 'tauri.conf.json identifier must be "com.stealth.desktop"');

    const launcherWin = tauriConf.app?.windows?.find((w) => w.label === 'launcher');
    const prompterWin = tauriConf.app?.windows?.find((w) => w.label === 'prompter');
    assert.equal(launcherWin?.title, 'Stealth', 'Launcher window title must be "Stealth"');
    assert.equal(prompterWin?.title, 'Stealth HUD', 'Prompter window title must be "Stealth HUD"');

    const pkg = readJsonSafe(path.join(PROJECT_ROOT, 'package.json'));
    assert.equal(pkg.name, 'stealthprompter', 'package.json name must use unified slug "stealthprompter"');

    const cargoToml = readTextSafe(path.join(SRC_TAURI_DIR, 'Cargo.toml'));
    assert.match(cargoToml, /name\s*=\s*"stealth(prompter)?"/, 'Cargo.toml package name must use stealth/stealthprompter');
    assert.doesNotMatch(cargoToml, /StealthPrompter|stealth-prompter/, 'Cargo.toml must not retain old StealthPrompter branding');

    const indexHtml = readTextSafe(path.join(PROJECT_ROOT, 'index.html'));
    const hudHtml = readTextSafe(path.join(PROJECT_ROOT, 'hud.html'));
    assert.match(indexHtml, /<title>\s*Stealth\s*<\/title>/i, 'index.html <title> must be "Stealth"');
    assert.match(hudHtml, /<title>\s*Stealth(\s+HUD)?\s*<\/title>/i, 'hud.html <title> must be Stealth / Stealth HUD');
  });

  it('F2-T1-03: Commercial "Stealth Prompter" in README/marketing vs in-app "Stealth" in rendered DOM', async () => {
    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    assert.match(readme, /Stealth Prompter/, 'README.md must use commercial product name "Stealth Prompter"');
    assert.match(readme, /stealthprompter/, 'README.md must use unified slug "stealthprompter"');

    await cdp.openPage('index.html', { width: 980, height: 640 });
    const launcherText = await cdp.evaluate(() => document.body.innerText);
    assert.ok(launcherText.includes('Stealth'), 'Rendered Launcher UI must display "Stealth"');
    assert.ok(!launcherText.includes('StealthPrompter'), 'Rendered Launcher UI must not contain "StealthPrompter"');

    await cdp.openPage('hud.html', { width: 1000, height: 350, tauriMock: { windowLabel: 'prompter' } });
    const hudText = await cdp.evaluate(() => document.body.innerText);
    assert.ok(!hudText.includes('StealthPrompter'), 'Rendered HUD UI must not contain "StealthPrompter"');
  });

  it('F2-T1-04: %APPDATA% startup migration from com.stealthprompter.desktop to com.stealth.desktop', async () => {
    const engineRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs'));
    assert.match(engineRs, /com\.stealth\.desktop/, 'storage/engine.rs must target com.stealth.desktop');
    assert.match(engineRs, /com\.stealthprompter\.desktop/, 'storage/engine.rs must implement migration from com.stealthprompter.desktop');

    const res = await execCargo(['test', '--lib', 'storage::engine::tests::']);
    assert.equal(res.status, 0, `cargo test storage::engine failed:\n${res.stdout}\n${res.stderr}`);
    assert.match(res.stdout, /migrat/i, 'Expected dedicated migration unit test(s) in storage::engine::tests');
  });

  it('F2-T1-05: Post-migration persistence contract writes atomically under com.stealth.desktop', async () => {
    const res = await execCargo(['test', '--lib', 'storage::engine::tests::test_atomic_write_and_read_settings']);
    assert.equal(res.status, 0, `Atomic persistence test failed:\n${res.stdout}\n${res.stderr}`);

    const engineRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs'));
    assert.match(engineRs, /app_data\.join\("com\.stealth\.desktop"\)/, 'default_path() must resolve to %APPDATA%\\com.stealth.desktop');
  });

  it('F2-T1-06: Repo-wide zero old-brand grep across active code, configs, CI, and marketing', () => {
    const leaks = scanOldBrandLeaks();
    assert.equal(
      leaks.length,
      0,
      `Found ${leaks.length} old-brand leak(s):\n${leaks.slice(0, 15).map((l) => `  ${l.file}:${l.line} [${l.match}] ${l.text}`).join('\n')}`
    );
  });
});
