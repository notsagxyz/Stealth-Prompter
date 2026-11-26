import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DIST_DIR,
  GITHUB_DIR,
  SCRIPTS_DIR,
  SRC_TAURI_DIR,
  readJsonSafe,
  readTextSafe,
} from '../lib/paths.js';
import { execCargo, execPowershell } from '../lib/exec.js';
import { createSandbox } from '../lib/temp_sandbox.js';
import { parsePeExeInfo } from '../lib/media_probe.js';

describe('F8 — Capture Exclusion, Clippy & Release Build (Tier 1)', () => {
  it('F8-T1-01: cargo clippy --all-targets -- -D warnings exits 0', async () => {
    const res = await execCargo(['clippy', '--all-targets', '--', '-D', 'warnings'], { timeoutMs: 180000 });
    assert.equal(
      res.status,
      0,
      `cargo clippy failed (exit ${res.status}):\n${res.stdout}\n${res.stderr}`
    );
  });

  it('F8-T1-02: cargo test --lib exits 0 with all Rust unit tests passing', async () => {
    const res = await execCargo(['test', '--lib'], { timeoutMs: 180000 });
    assert.equal(
      res.status,
      0,
      `cargo test --lib failed (exit ${res.status}):\n${res.stdout}\n${res.stderr}`
    );
    assert.match(res.stdout, /test result: ok\./, 'cargo test --lib must report passing summary');
  });

  it('F8-T1-03: dist/ entrypoints & release Stealth.exe binary exist with valid PE header', () => {
    assert.ok(fs.existsSync(path.join(DIST_DIR, 'index.html')), 'dist/index.html must exist');
    assert.ok(fs.existsSync(path.join(DIST_DIR, 'hud.html')), 'dist/hud.html must exist');

    const conf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    assert.equal(conf.productName, 'Stealth');
    assert.equal(conf.identifier, 'com.stealth.desktop');

    const releaseCandidates = [
      path.join(SRC_TAURI_DIR, 'target', 'release', 'Stealth.exe'),
      path.join(SRC_TAURI_DIR, 'target', 'x86_64-pc-windows-gnu', 'release', 'Stealth.exe'),
    ];
    const exePath = releaseCandidates.find((p) => fs.existsSync(p));
    assert.ok(
      exePath,
      `Release binary Stealth.exe not found in target/release/ or target/x86_64-pc-windows-gnu/release/`
    );
    const pe = parsePeExeInfo(exePath);
    assert.ok(pe.validMz && pe.validPe, `Invalid PE executable header at ${exePath}`);
    assert.ok(pe.size > 2 * 1024 * 1024, `Release binary unexpectedly small (${pe.size} bytes)`);
  });

  it('F8-T1-04: verify_invisibility.ps1 -Canary -NonInteractive passes with 0 leaked pixels', async () => {
    const sandbox = createSandbox('stealth-f8-invis-');
    try {
      const reportPath = sandbox.makeTempFile('invis_report.json', '');
      const res = await execPowershell(path.join(SCRIPTS_DIR, 'verify_invisibility.ps1'), [
        '-Canary',
        '-NonInteractive',
        '-ReportPath',
        reportPath,
      ]);
      assert.equal(res.status, 0, `verify_invisibility.ps1 failed:\n${res.stdout}\n${res.stderr}`);
      const report = JSON.parse(readTextSafe(reportPath).replace(/^\uFEFF/, ''));
      assert.equal(report.status, 'PASS');
      assert.equal(report.phases.test.affinity, 17);
      assert.equal(report.phases.test.canaryPixelsFound, 0);
      assert.equal(report.phases.test.isExcludedFromCapture, true);
    } finally {
      sandbox.cleanup();
    }
  });

  it('F8-T1-05: scripts/obs_verification_guide.md complete in English for Stealth (OBS + Xbox Game Bar)', () => {
    const guidePath = path.join(SCRIPTS_DIR, 'obs_verification_guide.md');
    assert.ok(fs.existsSync(guidePath), 'scripts/obs_verification_guide.md must exist');
    const guide = readTextSafe(guidePath);
    assert.match(guide, /Stealth/, 'Guide must be branded for Stealth');
    assert.doesNotMatch(guide, /StealthPrompter|Teleprompter HUD/, 'Guide must not contain legacy names');
    assert.match(guide, /OBS\s*Studio/i, 'Guide must document OBS Studio verification');
    assert.match(guide, /Xbox\s*Game\s*Bar|Win\+G/i, 'Guide must document Xbox Game Bar verification');
  });

  it('F8-T1-06: .github/workflows/release.yml valid SemVer release pipeline with Stealth/stealthprompter & checksums', () => {
    const wfPath = path.join(GITHUB_DIR, 'workflows', 'release.yml');
    assert.ok(fs.existsSync(wfPath), '.github/workflows/release.yml must exist');
    const wf = readTextSafe(wfPath);
    assert.match(wf, /v\*/, 'release.yml must trigger on SemVer v* tags');
    assert.match(wf, /SHA256SUMS/i, 'release.yml must generate SHA256SUMS checksums');
    assert.match(wf, /Stealth/, 'release.yml must use Stealth naming');
    assert.doesNotMatch(wf, /StealthPrompter|stealth-prompter/, 'release.yml must not leak legacy brand names');
  });
});
