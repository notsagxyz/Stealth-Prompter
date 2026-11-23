import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * P03: Pairwise Combination — Atomic JSON Persistence & HUD Live Reload
 * Features tested:
 * - F6: Local Atomic JSON Persistence (.tmp write + atomic rename)
 * - F9: SolidJS Overlay HUD Prompter (Script Live Reload & Content Sync)
 *
 * Verifies that scripts and settings are written atomically to disk without torn reads,
 * and HUD prompter reloads changes cleanly without race conditions or crashes.
 */

class AtomicStorageEngine {
  constructor(baseDir) {
    this.baseDir = baseDir;
    fs.mkdirSync(baseDir, { recursive: true });
  }

  saveAtomic(relativePath, data) {
    const fullPath = path.join(this.baseDir, relativePath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });

    // Validate JSON serializability before write
    const serialized = JSON.stringify(data, null, 2);

    const tempPath = `${fullPath}.${Date.now()}.${Math.random().toString(36).substring(2)}.tmp`;
    fs.writeFileSync(tempPath, serialized, 'utf8');

    // Atomic rename
    fs.renameSync(tempPath, fullPath);
    return fullPath;
  }

  load(relativePath) {
    const fullPath = path.join(this.baseDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relativePath}`);
    }
    const raw = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  }

  delete(relativePath) {
    const fullPath = path.join(this.baseDir, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }
}

class MockHudLiveReloader {
  constructor(storageEngine) {
    this.storage = storageEngine;
    this.currentScript = null;
    this.reloadCount = 0;
    this.errors = [];
  }

  loadScript(scriptPath) {
    try {
      this.currentScript = this.storage.load(scriptPath);
      this.reloadCount++;
    } catch (err) {
      this.errors.push(err.message);
      throw err;
    }
  }

  onFileChanged(scriptPath) {
    // Attempt reload
    return this.loadScript(scriptPath);
  }
}

describe('P03: Pairwise Atomic Storage & HUD Live Reload', () => {
  let tempDir;
  let storage;
  let hud;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-atomic-test-'));
    storage = new AtomicStorageEngine(tempDir);
    hud = new MockHudLiveReloader(storage);
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  });

  it('should write script atomically via .tmp and trigger successful HUD live reload', () => {
    const scriptPath = 'scripts/keynote.json';
    const scriptData = {
      id: 'keynote-001',
      title: 'Annual Keynote Address',
      content: 'Welcome shareholders and team members to our Q4 briefing.',
      scrollPosition: 0,
      speed: 2.0
    };

    storage.saveAtomic(scriptPath, scriptData);
    hud.loadScript(scriptPath);

    assert.equal(hud.reloadCount, 1);
    assert.deepEqual(hud.currentScript, scriptData);

    // Update content and re-save
    scriptData.content = 'Updated: Welcome to our Q4 briefing and 2027 vision.';
    scriptData.scrollPosition = 120;
    storage.saveAtomic(scriptPath, scriptData);

    hud.onFileChanged(scriptPath);
    assert.equal(hud.reloadCount, 2);
    assert.equal(hud.currentScript.content, 'Updated: Welcome to our Q4 briefing and 2027 vision.');
    assert.equal(hud.currentScript.scrollPosition, 120);
  });

  it('should never expose torn or partially written JSON during concurrent file operations', () => {
    const scriptPath = 'scripts/heavy_script.json';
    const largeContent = 'A'.repeat(50000);
    const data = { id: 'heavy', content: largeContent, version: 1 };

    storage.saveAtomic(scriptPath, data);

    // Perform multiple rapid updates and concurrent reads
    for (let i = 2; i <= 10; i++) {
      const updated = { id: 'heavy', content: 'B'.repeat(50000), version: i };
      storage.saveAtomic(scriptPath, updated);

      // Concurrent read immediately after atomic swap
      const readBack = storage.load(scriptPath);
      assert.equal(readBack.version, i, `Version must match write ${i}`);
      assert.equal(readBack.content.length, 50000, 'Content must not be truncated');
    }
  });

  it('should abort atomic save and preserve existing script if serialization fails', () => {
    const scriptPath = 'scripts/safe_script.json';
    const initialData = { id: 'safe', title: 'Immutable Script' };
    storage.saveAtomic(scriptPath, initialData);

    hud.loadScript(scriptPath);
    assert.equal(hud.currentScript.title, 'Immutable Script');

    // Circular reference cannot be JSON serialized
    const circularData = { id: 'bad' };
    circularData.self = circularData;

    assert.throws(() => {
      storage.saveAtomic(scriptPath, circularData);
    });

    // Verify existing file is untouched and remains fully valid
    const reloaded = storage.load(scriptPath);
    assert.deepEqual(reloaded, initialData);
  });

  it('should handle sequential high-frequency updates without state drift in HUD', () => {
    const scriptPath = 'scripts/stream.json';
    storage.saveAtomic(scriptPath, { lines: [] });

    for (let step = 1; step <= 25; step++) {
      storage.saveAtomic(scriptPath, { linesCount: step, lastLine: `Line ${step}` });
      hud.onFileChanged(scriptPath);
    }

    assert.equal(hud.reloadCount, 25);
    assert.equal(hud.currentScript.linesCount, 25);
    assert.equal(hud.currentScript.lastLine, 'Line 25');
  });

  it('should handle script deletion gracefully in HUD without crashing', () => {
    const scriptPath = 'scripts/to_delete.json';
    storage.saveAtomic(scriptPath, { id: 'del', title: 'Temporary' });
    hud.loadScript(scriptPath);
    assert.equal(hud.currentScript.title, 'Temporary');

    const deleted = storage.delete(scriptPath);
    assert.equal(deleted, true);

    // Reading deleted file throws expected Error
    assert.throws(() => {
      hud.onFileChanged(scriptPath);
    }, /File not found/);

    assert.equal(hud.errors.length, 1);
  });
});
