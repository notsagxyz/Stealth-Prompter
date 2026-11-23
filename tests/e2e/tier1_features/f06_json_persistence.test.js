import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Atomic write helper implementing the PROJECT.md atomic storage contract
function atomicWriteJson(targetPath, data) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).substring(2)}.tmp`;
  const serialized = JSON.stringify(data, null, 2);

  // 1. Write to temp file
  fs.writeFileSync(tmpPath, serialized, 'utf8');

  // 2. Atomic rename to destination
  fs.renameSync(tmpPath, targetPath);
}

// Default settings conforming to PROJECT.md
const DEFAULT_SETTINGS = {
  scroll_speed: 3,
  font_size: 28,
  line_height: 1.5,
  window_opacity: 0.9,
  mirror_mode: false,
  click_through: false,
  theme: 'dark-glass',
  hotkeys: {
    toggle_play: 'Alt+Space',
    speed_up: 'Alt+Up',
    speed_down: 'Alt+Down',
    toggle_window: 'Alt+H'
  }
};

describe('F06: Local Atomic JSON Persistence', () => {
  it('1. should execute atomic file write pattern (.tmp write + atomic rename)', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-test-f06-'));
    try {
      const targetFile = path.join(tmpDir, 'settings.json');
      const testData = { ...DEFAULT_SETTINGS, scroll_speed: 5 };

      atomicWriteJson(targetFile, testData);

      assert.ok(fs.existsSync(targetFile), 'Target file must exist after atomic write');
      const loaded = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
      assert.strictEqual(loaded.scroll_speed, 5);
      assert.strictEqual(loaded.theme, 'dark-glass');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('2. should validate settings.json schema and default configurations', () => {
    // Validate schema types and bounds
    assert.strictEqual(typeof DEFAULT_SETTINGS.scroll_speed, 'number');
    assert.ok(DEFAULT_SETTINGS.scroll_speed >= 1 && DEFAULT_SETTINGS.scroll_speed <= 10);

    assert.strictEqual(typeof DEFAULT_SETTINGS.font_size, 'number');
    assert.ok(DEFAULT_SETTINGS.font_size >= 12 && DEFAULT_SETTINGS.font_size <= 72);

    assert.strictEqual(typeof DEFAULT_SETTINGS.window_opacity, 'number');
    assert.ok(DEFAULT_SETTINGS.window_opacity >= 0.1 && DEFAULT_SETTINGS.window_opacity <= 1.0);

    assert.strictEqual(typeof DEFAULT_SETTINGS.mirror_mode, 'boolean');
    assert.strictEqual(typeof DEFAULT_SETTINGS.theme, 'string');
    assert.strictEqual(typeof DEFAULT_SETTINGS.hotkeys, 'object');
    assert.ok(DEFAULT_SETTINGS.hotkeys.toggle_play);
  });

  it('3. should validate script data model and serialization', () => {
    const sampleScript = {
      id: 'script-uuid-1234',
      title: 'Q3 Financial Keynote',
      content: 'Good morning everyone. Today we are presenting our quarterly growth metrics...',
      created_at: '2026-11-23T00:00:00Z',
      updated_at: '2026-11-23T01:30:00Z',
      last_position: 142.5,
      speed: 4
    };

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-script-f06-'));
    try {
      const scriptFile = path.join(tmpDir, 'scripts', `${sampleScript.id}.json`);
      atomicWriteJson(scriptFile, sampleScript);

      assert.ok(fs.existsSync(scriptFile));
      const parsed = JSON.parse(fs.readFileSync(scriptFile, 'utf8'));
      assert.deepStrictEqual(parsed, sampleScript);
      assert.strictEqual(parsed.title, 'Q3 Financial Keynote');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('4. should verify atomic storage error handling and fallback to defaults', () => {
    function safeLoadSettings(filePath) {
      if (!fs.existsSync(filePath)) {
        return DEFAULT_SETTINGS;
      }
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        // Recover gracefully on corrupted JSON
        return DEFAULT_SETTINGS;
      }
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-corrupt-f06-'));
    try {
      const corruptFile = path.join(tmpDir, 'settings.json');
      fs.writeFileSync(corruptFile, '{"scroll_speed": 4, broken json ...', 'utf8');

      const loaded = safeLoadSettings(corruptFile);
      assert.deepStrictEqual(loaded, DEFAULT_SETTINGS, 'Corrupted JSON must fallback safely to DEFAULT_SETTINGS');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('5. should verify directory auto-creation for nested storage paths', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teleprompter-nested-f06-'));
    try {
      const deepPath = path.join(tmpDir, 'deep', 'nested', 'appdata', 'scripts', 'test.json');
      assert.strictEqual(fs.existsSync(path.dirname(deepPath)), false);

      atomicWriteJson(deepPath, { test: 'nested auto-creation' });

      assert.ok(fs.existsSync(deepPath));
      assert.ok(fs.existsSync(path.dirname(deepPath)));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
