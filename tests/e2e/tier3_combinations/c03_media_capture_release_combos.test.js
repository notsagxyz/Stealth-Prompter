import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  ASSETS_DIR,
  DIST_DIR,
  REMOTION_DIR,
  SCRIPTS_DIR,
  SRC_TAURI_DIR,
  SRC_TAURI_ICONS_DIR,
  VAULT_DIR,
  readJsonSafe,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { execPowershell } from '../lib/exec.js';
import { createSandbox } from '../lib/temp_sandbox.js';
import { ffprobe, parseFrameRate, parseGifInfo, parsePeExeInfo } from '../lib/media_probe.js';

describe('Tier 3 Combinations — Media, Capture & Release (3 tests)', () => {
  it('T3-08 (F6 x F8): Master SVG -> tauri icon bundle -> tauri.conf.json -> release Stealth.exe & HTML favicons', () => {
    const svgs = walkFiles(ASSETS_DIR, { extensions: ['.svg'] });
    assert.ok(svgs.length >= 1, 'Master SVG must exist under assets/');

    const conf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    assert.ok(Array.isArray(conf.bundle?.icon) && conf.bundle.icon.length >= 4, 'bundle.icon must be configured');
    for (const rel of conf.bundle.icon) {
      assert.ok(fs.existsSync(path.join(SRC_TAURI_DIR, rel)), `Missing bundle icon ${rel}`);
    }
    assert.ok(fs.existsSync(path.join(SRC_TAURI_ICONS_DIR, 'icon.ico')));

    for (const htmlName of ['index.html', 'hud.html']) {
      const html = readTextSafe(path.join(DIST_DIR, htmlName));
      assert.match(html, /<link[^>]+rel=["'](?:shortcut\s+)?icon["']/i, `dist/${htmlName} missing favicon link`);
    }

    const exeCandidates = [
      path.join(SRC_TAURI_DIR, 'target', 'release', 'Stealth.exe'),
      path.join(SRC_TAURI_DIR, 'target', 'x86_64-pc-windows-gnu', 'release', 'Stealth.exe'),
    ];
    const exe = exeCandidates.find((p) => fs.existsSync(p));
    assert.ok(exe, 'Release binary Stealth.exe must exist');
    assert.ok(parsePeExeInfo(exe).validPe, 'Stealth.exe must be a valid Windows PE binary');
  });

  it('T3-09 (F2 x F6 x F7): Brand identity + ninja logo + video deliverables (1080p60, 9:16, GIF) + README embeds', async () => {
    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    assert.match(readme, /Stealth Prompter/);
    const gifMatch = readme.match(/(?:src=["']|\()([^)"']+\.gif)/i);
    assert.ok(gifMatch && fs.existsSync(path.resolve(PROJECT_ROOT, gifMatch[1])), 'README.md must embed existing .gif');
    assert.ok(parseGifInfo(path.resolve(PROJECT_ROOT, gifMatch[1])).validMagic);

    const mp4s = [
      ...walkFiles(path.join(REMOTION_DIR, 'out'), { extensions: ['.mp4'] }),
      ...walkFiles(path.join(VAULT_DIR, '06-Video'), { extensions: ['.mp4'] }),
    ];
    let ok16x9 = false;
    let ok9x16 = false;
    for (const m of mp4s) {
      const p = await ffprobe(m);
      const v = (p.streams || []).find((s) => s.codec_type === 'video');
      if (!v) continue;
      const fps = parseFrameRate(v.r_frame_rate || v.avg_frame_rate);
      if (v.width === 1920 && v.height === 1080 && fps >= 59.9) ok16x9 = true;
      if (v.width === 1080 && v.height === 1920 && fps >= 59.9) ok9x16 = true;
    }
    assert.ok(ok16x9 && ok9x16, 'Both 1080p60 and 9:16@60fps MP4s must exist');
  });

  it('T3-10 (F4 x F8): WDA_EXCLUDEFROMCAPTURE + verify_invisibility.ps1 + OBS/Xbox Game Bar guide', async () => {
    const sandbox = createSandbox('stealth-t3-10-');
    try {
      const reportPath = sandbox.makeTempFile('probe.json', '');
      const res = await execPowershell(path.join(SCRIPTS_DIR, 'verify_invisibility.ps1'), [
        '-Canary',
        '-NonInteractive',
        '-ReportPath',
        reportPath,
      ]);
      assert.equal(res.status, 0);
      const r = JSON.parse(readTextSafe(reportPath).replace(/^\uFEFF/, ''));
      assert.equal(r.status, 'PASS');
      assert.equal(r.phases.test.canaryPixelsFound, 0);

      const guide = readTextSafe(path.join(SCRIPTS_DIR, 'obs_verification_guide.md'));
      assert.match(guide, /OBS\s*Studio/i);
      assert.match(guide, /Xbox\s*Game\s*Bar|Win\+G/i);
      assert.match(guide, /Stealth/);
    } finally {
      sandbox.cleanup();
    }
  });
});
