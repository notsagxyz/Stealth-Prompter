import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DIST_DIR,
  GITHUB_DIR,
  SCRIPTS_DIR,
  SRC_DIR,
  SRC_TAURI_DIR,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { execPowershell } from '../lib/exec.js';
import { createSandbox } from '../lib/temp_sandbox.js';
import { scanOldBrandLeaks } from '../lib/assertions.js';

describe('F8 — Capture, Clippy & Release Boundaries (Tier 2)', () => {
  it('F8-T2-01: Repo-wide zero old-brand grep across CI, scripts, marketing, README, and config', () => {
    const leaks = scanOldBrandLeaks();
    assert.equal(
      leaks.length,
      0,
      `Found ${leaks.length} old-brand leak(s):\n${leaks.slice(0, 15).map((l) => `  ${l.file}:${l.line} [${l.match}] ${l.text}`).join('\n')}`
    );
  });

  it('F8-T2-02: Invisibility probe differential (control WDA_NONE > 0 vs test WDA_EXCLUDEFROMCAPTURE === 0)', async () => {
    const sandbox = createSandbox('stealth-b08-diff-');
    try {
      const reportPath = sandbox.makeTempFile('diff_report.json', '');
      const res = await execPowershell(path.join(SCRIPTS_DIR, 'verify_invisibility.ps1'), [
        '-Canary',
        '-NonInteractive',
        '-ReportPath',
        reportPath,
      ]);
      assert.equal(res.status, 0);
      const report = JSON.parse(readTextSafe(reportPath).replace(/^\uFEFF/, ''));
      assert.ok(
        report.phases.control.canaryPixelsFound > 0 && report.phases.test.canaryPixelsFound === 0,
        `Differential failed: control=${report.phases.control.canaryPixelsFound}, test=${report.phases.test.canaryPixelsFound}`
      );
    } finally {
      sandbox.cleanup();
    }
  });

  it('F8-T2-03: Invalid verify_invisibility.ps1 CLI args rejected cleanly without hanging', async () => {
    const scriptPath = path.join(SCRIPTS_DIR, 'verify_invisibility.ps1');
    const badHex = await execPowershell(scriptPath, ['-CanaryHex', 'INVALID', '-NonInteractive'], { timeoutMs: 20000 });
    assert.notEqual(badHex.status, 0, 'Invalid -CanaryHex must fail with non-zero exit code');
    assert.equal(badHex.timedOut, false, 'Invalid -CanaryHex must not hang');

    const badEngine = await execPowershell(scriptPath, ['-Engine', 'BogusEngine', '-NonInteractive'], { timeoutMs: 20000 });
    assert.notEqual(badEngine.status, 0, 'Invalid -Engine must fail with non-zero exit code');
    assert.equal(badEngine.timedOut, false, 'Invalid -Engine must not hang');
  });

  it('F8-T2-04: Settings::default() offline_only=true, telemetry_enabled=false & zero outbound analytics URLs', () => {
    const modelsRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'models.rs'));
    assert.match(modelsRs, /offline_only:\s*true/, 'Rust Settings::default() must set offline_only: true');
    assert.match(modelsRs, /telemetry_enabled:\s*false/, 'Rust Settings::default() must set telemetry_enabled: false');

    const analyticsRegex = /(google-analytics\.com|googletagmanager\.com|mixpanel\.com|segment\.io|sentry\.io|posthog\.com|amplitude\.com)/i;
    const files = [
      ...walkFiles(SRC_DIR, { extensions: ['.ts', '.tsx', '.js'] }),
      ...walkFiles(DIST_DIR, { extensions: ['.js', '.html'] }),
    ];
    for (const f of files) {
      assert.doesNotMatch(readTextSafe(f), analyticsRegex, `Unexpected analytics/telemetry URL in ${f}`);
    }
  });

  it('F8-T2-05: .github/workflows/release.yml SemVer v* trigger & SHA256SUMS integrity', () => {
    const wfPath = path.join(GITHUB_DIR, 'workflows', 'release.yml');
    assert.ok(fs.existsSync(wfPath));
    const wf = readTextSafe(wfPath);
    assert.match(wf, /tags:\s*[\r\n]+\s*-\s*['"]?v\*['"]?/, 'release.yml must trigger on v* SemVer tags');
    assert.match(wf, /SHA256SUMS/i, 'release.yml must produce SHA256SUMS');
    assert.match(wf, /tauri-action/, 'release.yml must invoke tauri-apps/tauri-action');
  });

  it('F8-T2-06: obs_verification_guide.md requires both OBS Studio and Xbox Game Bar sections', () => {
    const guide = readTextSafe(path.join(SCRIPTS_DIR, 'obs_verification_guide.md'));
    assert.match(guide, /OBS\s*Studio/i);
    assert.match(guide, /Xbox\s*Game\s*Bar|Win\+G/i);
    assert.match(guide, /WDA_EXCLUDEFROMCAPTURE/i);
    assert.doesNotMatch(guide, /StealthPrompter|Teleprompter HUD/);
  });
});
