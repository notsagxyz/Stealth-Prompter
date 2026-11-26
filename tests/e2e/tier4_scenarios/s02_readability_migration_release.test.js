import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  ASSETS_DIR,
  DIST_DIR,
  GITHUB_DIR,
  REMOTION_DIR,
  SCRIPTS_DIR,
  SRC_TAURI_DIR,
  SRC_TAURI_ICONS_DIR,
  VAULT_DIR,
  readJsonSafe,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { execCargo } from '../lib/exec.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { ffprobe, parseFrameRate, parseGifInfo, parsePeExeInfo, parsePngInfo } from '../lib/media_probe.js';
import { scanOldBrandLeaks } from '../lib/assertions.js';

describe('Tier 4 Scenarios — Release Readiness, Migration & Mirror Rig (3 tests)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 1000, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('T4-04: Full open-source public release package readiness (build, icons, social preview, videos, README, CI)', async () => {
    // 1. Config & binaries
    const tauriConf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    assert.equal(tauriConf.productName, 'Stealth');
    assert.equal(tauriConf.identifier, 'com.stealth.desktop');
    assert.ok(fs.existsSync(path.join(DIST_DIR, 'index.html')) && fs.existsSync(path.join(DIST_DIR, 'hud.html')));

    const exe = [
      path.join(SRC_TAURI_DIR, 'target', 'release', 'Stealth.exe'),
      path.join(SRC_TAURI_DIR, 'target', 'x86_64-pc-windows-gnu', 'release', 'Stealth.exe'),
    ].find((p) => fs.existsSync(p));
    assert.ok(exe && parsePeExeInfo(exe).validPe, 'Valid release Stealth.exe binary required');

    // 2. Icons & 1280x640 social preview
    assert.ok(fs.existsSync(path.join(SRC_TAURI_ICONS_DIR, 'icon.ico')));
    assert.ok(fs.existsSync(path.join(SRC_TAURI_ICONS_DIR, 'icon.icns')));
    const socialPng = walkFiles(ASSETS_DIR, { extensions: ['.png'] }).find((p) => /social|preview|og/i.test(path.basename(p)));
    assert.ok(socialPng, '1280x640 social preview PNG required');
    const spInfo = parsePngInfo(socialPng);
    assert.equal(spInfo.width, 1280);
    assert.equal(spInfo.height, 640);

    // 3. Video deliverables & README GIF
    const mp4s = walkFiles(path.join(REMOTION_DIR, 'out'), { extensions: ['.mp4'] });
    let has1080p60 = false;
    let hasVertical60 = false;
    for (const m of mp4s) {
      const p = await ffprobe(m);
      const v = (p.streams || []).find((s) => s.codec_type === 'video');
      if (!v) continue;
      const fps = parseFrameRate(v.r_frame_rate || v.avg_frame_rate);
      if (v.width === 1920 && v.height === 1080 && fps >= 59.9) has1080p60 = true;
      if (v.width === 1080 && v.height === 1920 && fps >= 59.9) hasVertical60 = true;
    }
    assert.ok(has1080p60 && hasVertical60, 'Both 1920x1080@60fps and 1080x1920@60fps MP4 deliverables required');

    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    const gifMatch = readme.match(/(?:src=["']|\()([^)"']+\.gif)/i);
    assert.ok(gifMatch && parseGifInfo(path.resolve(PROJECT_ROOT, gifMatch[1])).validMagic, 'Valid README GIF required');

    // 4. CI, marketing & OBS/Xbox Game Bar guide + zero old brand leaks
    assert.ok(fs.existsSync(path.join(GITHUB_DIR, 'workflows', 'release.yml')));
    const marketingFiles = walkFiles(path.join(VAULT_DIR, '05-Marketing'), { extensions: ['.md'] });
    assert.ok(marketingFiles.length >= 1, 'Marketing copy must exist in vault/05-Marketing/');
    const guide = readTextSafe(path.join(SCRIPTS_DIR, 'obs_verification_guide.md'));
    assert.match(guide, /OBS\s*Studio/i);
    assert.match(guide, /Xbox\s*Game\s*Bar|Win\+G/i);
    assert.equal(scanOldBrandLeaks().length, 0, 'Zero old-brand leaks allowed in release package');
  });

  it('T4-05: Existing user upgrade & %APPDATA% migration continuity (lockout reset + preserved scripts + Violet default)', async () => {
    const engineRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs'));
    assert.match(engineRs, /com\.stealthprompter\.desktop/);
    assert.match(engineRs, /com\.stealth\.desktop/);

    const libRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'lib.rs'));
    assert.match(libRs, /click_through\s*=\s*false/, 'Cold boot must reset click_through to false to prevent lockout');

    const res = await execCargo(['test', '--lib', 'migrat']);
    assert.equal(res.status, 0, `Migration test failed:\n${res.stdout}\n${res.stderr}`);
    assert.doesNotMatch(res.stdout, /0 passed; 0 failed/, 'Expected migration tests to pass');

    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: {
        settings: { scroll_speed: 4.2, window_opacity: 0.65, click_through: false },
        scripts: [
          { id: 'u1', title: 'Upgraded Talk 1', content: 'First migrated script snippet.' },
          { id: 'u2', title: 'Upgraded Talk 2', content: 'Second migrated script snippet.' },
        ],
      },
    });
    const text = await cdp.evaluate(() => document.body.innerText);
    assert.ok(text.includes('Upgraded Talk 1') && text.includes('Upgraded Talk 2'));
    assert.ok(text.includes('First migrated script snippet'));
  });

  it('T4-06: Hardware beam-splitter mirror rig (mirror: true, 72px font) + click-through recovery + manual rewind', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { mirror_mode: true, font_size: 72, scroll_speed: 0.6, click_through: false },
        scripts: [
          {
            id: 'mirror-rig',
            title: 'Beam Splitter Rig',
            content: Array.from({ length: 15 }, (_, i) => `Cue ${i + 1}: Reading cleanly off beam-splitter mirror glass.`).join('\n\n'),
            last_position: 120,
            speed: 0.6,
          },
        ],
      },
    });

    const rig = await cdp.evaluate(() => {
      const textEl = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      const bar = document.querySelector('[data-testid="hud-control-bar"], header, [role="toolbar"]');
      return {
        textTransform: textEl ? getComputedStyle(textEl).transform : '',
        fontSize: textEl ? parseFloat(getComputedStyle(textEl).fontSize) : 0,
        barTransform: bar ? getComputedStyle(bar).transform : 'none',
      };
    });

    const m = rig.textTransform.match(/^matrix\(([^)]+)\)$/);
    assert.ok(m, `Expected mirror transform matrix on text, got "${rig.textTransform}"`);
    assert.equal(m[1].split(',').map(Number)[0], -1, 'Text must be horizontally flipped (scaleX(-1))');
    assert.equal(rig.fontSize, 72, 'Font size must match configured 72px');
    assert.ok(!rig.barTransform.startsWith('matrix(-1'), 'HUD control bar itself must NOT be mirrored');

    // Manual drag rewind and verify smooth recovery
    await cdp.drag(500, 140, 500, 260, 6);
    await new Promise((r) => setTimeout(r, 120));
    const afterRewind = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      return el ? getComputedStyle(el).transform : '';
    });
    assert.ok(!/nan/i.test(afterRewind), 'Mirror rig transform must remain valid after manual drag rewind');
  });
});
