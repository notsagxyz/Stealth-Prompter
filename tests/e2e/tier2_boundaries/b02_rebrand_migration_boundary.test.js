import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { SRC_TAURI_DIR, readTextSafe } from '../lib/paths.js';
import { execCargo } from '../lib/exec.js';
import { scanOldBrandLeaks } from '../lib/assertions.js';

describe('F2 — Rebrand & Migration Boundaries (Tier 2)', () => {
  it('F2-T2-01: Migration handles missing legacy %APPDATA% directory cleanly', async () => {
    const engineRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs'));
    assert.match(engineRs, /com\.stealthprompter\.desktop/, 'Migration logic must reference legacy com.stealthprompter.desktop');
    const res = await execCargo(['test', '--lib', 'storage::engine::tests::']);
    assert.equal(res.status, 0, `cargo test storage::engine failed:\n${res.stdout}\n${res.stderr}`);
    assert.match(res.stdout, /migrat/i, 'Expected migration boundary tests covering missing legacy directory');
  });

  it('F2-T2-02: Migration does NOT overwrite existing com.stealth.desktop target directory', async () => {
    const engineRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs'));
    assert.match(engineRs, /com\.stealth\.desktop/, 'Target dir com.stealth.desktop must be configured');
    assert.match(engineRs, /migrat/i, 'Migration function must exist in storage/engine.rs');
    const res = await execCargo(['test', '--lib', 'migrat']);
    assert.equal(res.status, 0, `Migration unit tests failed:\n${res.stdout}\n${res.stderr}`);
    assert.doesNotMatch(res.stdout, /0 passed; 0 failed/, 'At least 1 migration test must execute and pass');
  });

  it('F2-T2-03: Corrupt legacy settings.json recovery preserves valid scripts during migration', async () => {
    const res = await execCargo(['test', '--lib', 'storage::engine::tests::test_corruption_recovery']);
    assert.equal(res.status, 0, `Corrupt recovery test failed:\n${res.stdout}\n${res.stderr}`);
    const engineRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs'));
    assert.match(engineRs, /migrat/i, 'Migration must exist alongside corruption recovery');
  });

  it('F2-T2-04: Empty legacy directory / missing scripts subfolder handled without NotFound panic', async () => {
    const engineRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs'));
    assert.match(engineRs, /com\.stealth\.desktop/, 'storage/engine.rs must use com.stealth.desktop');
    assert.match(engineRs, /migrat/i, 'storage/engine.rs must implement safe migration');
    const res = await execCargo(['test', '--lib', 'storage::engine::tests::']);
    assert.equal(res.status, 0, `cargo test failed:\n${res.stdout}\n${res.stderr}`);
  });

  it('F2-T2-05: Migration idempotency across multiple startups', async () => {
    const engineRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs'));
    assert.match(engineRs, /migrat/i, 'Migration helper must exist in storage/engine.rs');
    const res = await execCargo(['test', '--lib', 'migrat']);
    assert.equal(res.status, 0, `Migration idempotency test failed:\n${res.stdout}\n${res.stderr}`);
    assert.doesNotMatch(res.stdout, /0 passed; 0 failed/, 'Expected migration test execution');
  });

  it('F2-T2-06: Strict zero-old-brand sweep (StealthPrompter, stealth-prompter, com.stealthprompter.desktop)', () => {
    const leaks = scanOldBrandLeaks();
    assert.equal(
      leaks.length,
      0,
      `Found ${leaks.length} old-brand leak(s) outside allowlist:\n${leaks.slice(0, 15).map((l) => `  ${l.file}:${l.line} [${l.match}] ${l.text}`).join('\n')}`
    );
  });
});
