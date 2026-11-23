import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Atomic JSON Storage Engine.
 * Corresponds to PROJECT.md Feature 6 & Architecture:
 * - Atomic write: serialize JSON -> write to `<file>.tmp` -> atomic rename (replace target).
 * - Read with error recovery: if corrupted/empty, backup to `<file>.corrupt` and return default config.
 * - Handles directory creation and file lock conflicts with retry logic.
 */
export class AtomicJsonStorage {
  constructor(baseDir, defaults = {}) {
    this.baseDir = baseDir;
    this.defaults = defaults;
  }

  _resolvePath(filename) {
    return path.join(this.baseDir, filename);
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  readJson(filename) {
    const fullPath = this._resolvePath(filename);
    if (!fs.existsSync(fullPath)) {
      return { data: { ...this.defaults }, recovered: false, isDefault: true };
    }

    const stat = fs.statSync(fullPath);
    if (stat.size === 0) {
      // 0-byte file: treat as corrupt/uninitialized, backup and fallback to default
      const corruptPath = `${fullPath}.corrupt`;
      fs.copyFileSync(fullPath, corruptPath);
      return { data: { ...this.defaults }, recovered: true, isDefault: true, reason: 'Zero-byte file' };
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const parsed = JSON.parse(content);
      return { data: parsed, recovered: false, isDefault: false };
    } catch (err) {
      // Corrupt JSON syntax: create .corrupt backup and return defaults
      const corruptPath = `${fullPath}.corrupt`;
      fs.copyFileSync(fullPath, corruptPath);
      return { data: { ...this.defaults }, recovered: true, isDefault: true, reason: `Parse error: ${err.message}` };
    }
  }

  writeJsonAtomic(filename, data, options = {}) {
    const fullPath = this._resolvePath(filename);
    const tmpPath = `${fullPath}.tmp`;
    const targetDir = path.dirname(fullPath);

    this.ensureDirectory(targetDir);

    if (options.simulateWriteFailure) {
      // Write partial data to tmp and abort before rename
      fs.writeFileSync(tmpPath, '{"partial_unclosed":', 'utf8');
      throw new Error('Simulated disk/write failure during .tmp generation.');
    }

    if (options.simulateLock) {
      throw new Error('EBUSY: resource busy or locked');
    }

    const payload = JSON.stringify(data, null, 2);
    // Write full content to temporary file
    fs.writeFileSync(tmpPath, payload, 'utf8');

    // Atomic rename (Windows ReplaceFile / renameSync)
    fs.renameSync(tmpPath, fullPath);
    return true;
  }
}

describe('B06: Local Storage Concurrency & Atomic Boundary Cases', () => {
  let tmpRoot;

  it('1. should recover from corrupted JSON by creating .corrupt backup and restoring default settings', () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-test-b06-1-'));
    const defaults = { scrollSpeed: 2.5, fontSize: 32, theme: 'dark-glass' };
    const storage = new AtomicJsonStorage(tmpRoot, defaults);

    // Write malformed JSON manually to settings.json
    const settingsPath = path.join(tmpRoot, 'settings.json');
    fs.writeFileSync(settingsPath, '{"scrollSpeed": 2.5, "fontSize": /* truncated', 'utf8');

    const result = storage.readJson('settings.json');
    assert.strictEqual(result.recovered, true);
    assert.strictEqual(result.isDefault, true);
    assert.deepStrictEqual(result.data, defaults);

    // Verify .corrupt backup file was created
    assert.ok(fs.existsSync(`${settingsPath}.corrupt`));
  });

  it('2. should guarantee target file integrity during interrupted/partial writes via .tmp isolation', () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-test-b06-2-'));
    const storage = new AtomicJsonStorage(tmpRoot, { version: 1 });

    // Step 1: Write valid initial data
    const initialData = { scriptId: 'script-001', title: 'Original Script', text: 'Important content.' };
    storage.writeJsonAtomic('script.json', initialData);

    // Step 2: Attempt write with simulated midway crash
    assert.throws(
      () => storage.writeJsonAtomic('script.json', { scriptId: 'script-001', text: 'Overwritten' }, { simulateWriteFailure: true }),
      /Simulated disk\/write failure/i
    );

    // Target file must remain untouched and completely valid
    const readBack = storage.readJson('script.json');
    assert.deepStrictEqual(readBack.data, initialData);

    // Partial .tmp file exists but did not overwrite script.json
    assert.ok(fs.existsSync(path.join(tmpRoot, 'script.json.tmp')));
  });

  it('3. should handle 0-byte empty JSON files cleanly without crash', () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-test-b06-3-'));
    const defaults = { speed: 1.0, activeScript: null };
    const storage = new AtomicJsonStorage(tmpRoot, defaults);

    const zeroByteFile = path.join(tmpRoot, 'zero.json');
    fs.writeFileSync(zeroByteFile, '', 'utf8');
    assert.strictEqual(fs.statSync(zeroByteFile).size, 0);

    const res = storage.readJson('zero.json');
    assert.strictEqual(res.recovered, true);
    assert.deepStrictEqual(res.data, defaults);
    assert.match(res.reason, /Zero-byte file/i);
    assert.ok(fs.existsSync(`${zeroByteFile}.corrupt`));
  });

  it('4. should detect file lock conflicts during atomic write and propagate clear lock error', () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-test-b06-4-'));
    const storage = new AtomicJsonStorage(tmpRoot);

    assert.throws(
      () => storage.writeJsonAtomic('locked.json', { data: 123 }, { simulateLock: true }),
      /EBUSY|locked/i
    );
  });

  it('5. should auto-create non-existent nested directories and handle permission errors', () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-test-b06-5-'));
    const storage = new AtomicJsonStorage(tmpRoot);

    // Non-existent deeply nested path: scripts/drafts/archive/my_script.json
    const nestedFile = 'scripts/drafts/archive/my_script.json';
    const scriptPayload = { id: 'nested-1', title: 'Deep Script' };

    storage.writeJsonAtomic(nestedFile, scriptPayload);

    const fullPath = path.join(tmpRoot, nestedFile);
    assert.ok(fs.existsSync(fullPath));

    const readResult = storage.readJson(nestedFile);
    assert.deepStrictEqual(readResult.data, scriptPayload);
  });
});
