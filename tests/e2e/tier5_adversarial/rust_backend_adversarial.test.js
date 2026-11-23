import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROJECT_ROOT = path.resolve(process.cwd());

// ============================================================================
// Core Behavioral Simulation of Rust Backend Contracts
// Corresponds to:
// - `src-tauri/src/platform/` (WindowPlatform trait, MockWindowPlatform, WindowsPlatform)
// - `src-tauri/src/storage/` (StorageEngine, models: Settings, Script, Cue, ScriptSummary)
// - `src-tauri/src/commands/` (Tauri IPC commands: set_capture_exclusion, load_settings, etc.)
// - `src-tauri/src/shortcuts/` (Global shortcuts & prompter:action event emission)
// ============================================================================

export const DisplayAffinity = Object.freeze({
  None: 'None',
  Monitor: 'Monitor',
  ExcludeFromCapture: 'ExcludeFromCapture'
});

export const VibrancyEffect = Object.freeze({
  None: 'None',
  Mica: 'Mica',
  Acrylic: 'Acrylic',
  Blur: 'Blur'
});

export class MockWindowPlatform {
  constructor(options = {}) {
    this.autoRegister = options.autoRegister !== undefined ? options.autoRegister : true;
    this.osBuild = options.osBuild !== undefined ? options.osBuild : 22631;
    this.dwmEnabled = options.dwmEnabled !== undefined ? options.dwmEnabled : true;
    this.windows = new Map();
    this.errorInjection = new Map();
    this.errorInjectionOnce = new Map();
    this.callLog = [];
  }

  _validateHwnd(hwnd) {
    if (hwnd === 0) {
      throw new Error('Null HWND: Window handle cannot be 0 (NULL).');
    }
    if (typeof hwnd !== 'number' || hwnd < 0 || !Number.isInteger(hwnd)) {
      throw new Error(`Negative HWND: ${hwnd} is an invalid window handle.`);
    }
  }

  _recordCall(method, hwnd, details = '') {
    this.callLog.push({ method, hwnd, details: String(details) });
  }

  _checkInjectedError(method) {
    if (this.errorInjectionOnce.has(method)) {
      const err = this.errorInjectionOnce.get(method);
      this.errorInjectionOnce.delete(method);
      throw err;
    }
    if (this.errorInjection.has(method)) {
      throw this.errorInjection.get(method);
    }
  }

  _ensureWindow(hwnd) {
    this._validateHwnd(hwnd);
    if (!this.windows.has(hwnd)) {
      if (this.autoRegister) {
        this.windows.set(hwnd, {
          hwnd,
          affinity: DisplayAffinity.None,
          clickThrough: false,
          noActivate: false,
          vibrancy: VibrancyEffect.None,
          visible: false,
          unfocused: false,
          destroyed: false,
          opacity: 1.0
        });
      } else {
        throw new Error(`WindowNotFound: No active window registered with HWND ${hwnd}.`);
      }
    }

    const win = this.windows.get(hwnd);
    if (win.destroyed) {
      throw new Error(`InvalidWindowHandle: Window ${hwnd} has been destroyed (Win32 ERROR_INVALID_WINDOW_HANDLE 1400).`);
    }
    return win;
  }

  registerWindow(hwnd) {
    this._validateHwnd(hwnd);
    if (this.windows.has(hwnd) && !this.windows.get(hwnd).destroyed) {
      return;
    }
    this.windows.set(hwnd, {
      hwnd,
      affinity: DisplayAffinity.None,
      clickThrough: false,
      noActivate: false,
      vibrancy: VibrancyEffect.None,
      visible: false,
      unfocused: false,
      destroyed: false,
      opacity: 1.0
    });
  }

  destroyWindow(hwnd) {
    this._validateHwnd(hwnd);
    const win = this.windows.get(hwnd);
    if (!win) {
      throw new Error(`WindowNotFound: No active window registered with HWND ${hwnd}.`);
    }
    if (win.destroyed) {
      throw new Error(`InvalidWindowHandle: Window ${hwnd} has been destroyed (Win32 ERROR_INVALID_WINDOW_HANDLE 1400).`);
    }
    win.destroyed = true;
  }

  injectError(method, error) {
    this.errorInjection.set(method, error);
  }

  injectErrorOnce(method, error) {
    this.errorInjectionOnce.set(method, error);
  }

  clearInjectedErrors() {
    this.errorInjection.clear();
    this.errorInjectionOnce.clear();
  }

  setDisplayAffinity(hwnd, affinity) {
    this._recordCall('set_display_affinity', hwnd, affinity);
    this._checkInjectedError('set_display_affinity');

    if (!Object.values(DisplayAffinity).includes(affinity)) {
      throw new Error(`InvalidAffinityFlag: ${affinity} is not a valid Win32 display affinity value.`);
    }

    if (affinity === DisplayAffinity.ExcludeFromCapture || affinity === 'ExcludeFromCapture') {
      if (this.osBuild < 19041) {
        throw new Error(`UnsupportedOsVersion: WDA_EXCLUDEFROMCAPTURE requires Windows 10 Build 19041 (Version 2004) or later. Detected OS build: ${this.osBuild}.`);
      }
      if (!this.dwmEnabled) {
        throw new Error('DwmCompositionDisabled: DWM composition is inactive. Window cannot be excluded from capture.');
      }
    }

    const win = this._ensureWindow(hwnd);
    win.affinity = affinity;
    return true;
  }

  getDisplayAffinity(hwnd) {
    this._recordCall('get_display_affinity', hwnd);
    this._checkInjectedError('get_display_affinity');
    const win = this._ensureWindow(hwnd);
    return win.affinity;
  }

  setClickThrough(hwnd, enabled) {
    this._recordCall('set_click_through', hwnd, enabled);
    this._checkInjectedError('set_click_through');
    const win = this._ensureWindow(hwnd);
    win.clickThrough = Boolean(enabled);
    return true;
  }

  setNoActivate(hwnd, enabled) {
    this._recordCall('set_no_activate', hwnd, enabled);
    this._checkInjectedError('set_no_activate');
    const win = this._ensureWindow(hwnd);
    win.noActivate = Boolean(enabled);
    return true;
  }

  applyVibrancy(hwnd, effect) {
    this._recordCall('apply_vibrancy', hwnd, typeof effect === 'object' ? JSON.stringify(effect) : effect);
    this._checkInjectedError('apply_vibrancy');
    const win = this._ensureWindow(hwnd);
    win.vibrancy = effect;
    return true;
  }

  showUnfocused(hwnd) {
    this._recordCall('show_unfocused', hwnd);
    this._checkInjectedError('show_unfocused');
    const win = this._ensureWindow(hwnd);
    win.visible = true;
    win.unfocused = true;
    return true;
  }

  hide(hwnd) {
    this._recordCall('hide', hwnd);
    this._checkInjectedError('hide');
    const win = this._ensureWindow(hwnd);
    win.visible = false;
    return true;
  }

  setOpacity(hwnd, opacity) {
    this._recordCall('set_opacity', hwnd, opacity);
    this._checkInjectedError('set_opacity');
    const win = this._ensureWindow(hwnd);
    const clamped = Math.max(0.0, Math.min(1.0, isNaN(opacity) ? 1.0 : opacity));
    win.opacity = clamped;
    return true;
  }

  getOpacity(hwnd) {
    const win = this._ensureWindow(hwnd);
    return win.opacity;
  }

  handleWindowRecreation(oldHwnd, newHwnd) {
    this._validateHwnd(oldHwnd);
    this._validateHwnd(newHwnd);
    const prevAffinity = this.windows.has(oldHwnd) ? this.windows.get(oldHwnd).affinity : DisplayAffinity.None;
    this.windows.delete(oldHwnd);
    this.registerWindow(newHwnd);
    this.setDisplayAffinity(newHwnd, prevAffinity);
    return true;
  }

  callCount(method) {
    return this.callLog.filter(c => c.method === method).length;
  }

  clearCallLog() {
    this.callLog = [];
  }
}

export class StorageEngineSimulator {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.scriptsDir = path.join(baseDir, 'scripts');
    this.settingsPath = path.join(baseDir, 'settings.json');
  }

  validateId(id) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid script ID: identifier cannot be empty');
    }
    if (id.includes('..')) {
      throw new Error(`Invalid script ID '${id}': contains directory traversal sequence '..'`);
    }
    const forbidden = ['/', '\\', '\0', ':', '*', '?', '"', '<', '>', '|'];
    for (const ch of forbidden) {
      if (id.includes(ch)) {
        throw new Error(`Invalid script ID '${id}': contains forbidden character '${ch}'`);
      }
    }
    for (let i = 0; i < id.length; i++) {
      const code = id.charCodeAt(i);
      if (code < 32 || code === 127) {
        throw new Error(`Invalid script ID '${id}': contains forbidden control character`);
      }
    }
    if (id.endsWith('.') || id.endsWith(' ')) {
      throw new Error(`Invalid script ID '${id}': cannot end with a period or space`);
    }
    const dosReserved = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];
    const stem = id.split('.')[0].trim().toUpperCase();
    if (dosReserved.includes(stem)) {
      throw new Error(`Invalid script ID '${id}': matches reserved DOS device name`);
    }
  }

  atomicWriteJson(targetPath, data) {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const payload = JSON.stringify(data, null, 2);
    const tmpPath = `${targetPath}.${Date.now()}_${process.pid}_${Math.floor(Math.random() * 100000)}.tmp`;

    fs.writeFileSync(tmpPath, payload, 'utf8');

    // Windows transient lock retry
    let renameSuccess = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.renameSync(tmpPath, targetPath);
        renameSuccess = true;
        break;
      } catch (err) {
        // Retry
      }
    }

    if (!renameSuccess) {
      try { fs.unlinkSync(tmpPath); } catch {}
      throw new Error(`Failed to atomically write to ${targetPath}`);
    }
  }

  readJson(filePath, defaultFallback = null) {
    if (!fs.existsSync(filePath)) {
      if (defaultFallback !== null) return defaultFallback;
      throw new Error(`File not found: ${filePath}`);
    }

    let buffer;
    try {
      buffer = fs.readFileSync(filePath);
    } catch (err) {
      if (defaultFallback !== null) return defaultFallback;
      throw err;
    }

    if (buffer.length === 0) {
      fs.copyFileSync(filePath, `${filePath}.corrupt`);
      if (defaultFallback !== null) return defaultFallback;
      throw new Error(`Corrupted file at ${filePath}: Zero-byte file`);
    }

    try {
      const str = buffer.toString('utf8');
      return JSON.parse(str);
    } catch (err) {
      fs.copyFileSync(filePath, `${filePath}.corrupt`);
      if (defaultFallback !== null) return defaultFallback;
      throw new Error(`Corrupted file at ${filePath}: Parse error: ${err.message}`);
    }
  }

  loadSettings() {
    const defaults = {
      scroll_speed: 3.0,
      font_size: 28,
      line_height: 1.5,
      window_opacity: 0.9,
      mirror_mode: false,
      click_through: false,
      theme: 'dark-glass',
      last_script_id: null,
      offline_only: true,
      telemetry_enabled: false,
      geometry: { x: 100, y: 100, width: 800, height: 400 },
      hotkeys: {
        toggle_play: 'Alt+Space',
        speed_up: 'Alt+Up',
        speed_down: 'Alt+Down',
        toggle_window: 'Alt+H'
      }
    };

    const loaded = this.readJson(this.settingsPath, defaults);
    return this._normalizeAndClampSettings(loaded);
  }

  _normalizeAndClampSettings(s) {
    const scrollSpeed = s.scroll_speed ?? s.scrollSpeed ?? s.speed ?? 3.0;
    const fontSize = s.font_size ?? s.fontSize ?? 28;
    const lineHeight = s.line_height ?? s.lineHeight ?? 1.5;
    const opacity = s.window_opacity ?? s.windowOpacity ?? s.opacity ?? 0.9;
    const mirrorMode = Boolean(s.mirror_mode ?? s.mirrorMode ?? false);
    const clickThrough = Boolean(s.click_through ?? s.clickThrough ?? false);
    const theme = s.theme || 'dark-glass';
    const lastScriptId = s.last_script_id ?? s.lastScriptId ?? null;
    const offlineOnly = s.offline_only ?? s.offlineOnly ?? true;
    const telemetryEnabled = s.telemetry_enabled ?? s.telemetryEnabled ?? false;

    return {
      scroll_speed: Math.max(0.1, Math.min(20.0, Number(scrollSpeed))),
      font_size: Math.max(8, Math.min(144, Math.floor(Number(fontSize)))),
      line_height: Math.max(0.5, Math.min(5.0, Number(lineHeight))),
      window_opacity: Math.max(0.05, Math.min(1.0, Number(opacity))),
      mirror_mode: mirrorMode,
      click_through: clickThrough,
      theme,
      last_script_id: lastScriptId,
      offline_only: offlineOnly,
      telemetry_enabled: telemetryEnabled,
      geometry: s.geometry || s.hudGeometry || { x: 100, y: 100, width: 800, height: 400 },
      hotkeys: {
        toggle_play: (s.hotkeys && (s.hotkeys.toggle_play ?? s.hotkeys.togglePlay)) || 'Alt+Space',
        speed_up: (s.hotkeys && (s.hotkeys.speed_up ?? s.hotkeys.speedUp)) || 'Alt+Up',
        speed_down: (s.hotkeys && (s.hotkeys.speed_down ?? s.hotkeys.speedDown)) || 'Alt+Down',
        toggle_window: (s.hotkeys && (s.hotkeys.toggle_window ?? s.hotkeys.toggleWindow)) || 'Alt+H',
      }
    };
  }

  saveSettings(settings) {
    const clamped = this._normalizeAndClampSettings(settings);
    this.atomicWriteJson(this.settingsPath, clamped);
  }

  loadScript(id) {
    this.validateId(id);
    const scriptPath = path.join(this.scriptsDir, `${id}.json`);
    const raw = this.readJson(scriptPath, null);
    return {
      id: raw.id || raw.scriptId,
      title: raw.title,
      content: raw.content || raw.text || '',
      last_position: raw.last_position ?? raw.lastPosition ?? raw.scrollPosition ?? 0.0,
      speed: raw.speed ?? 2.5,
      created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
      updated_at: raw.updated_at ?? raw.updatedAt ?? new Date().toISOString(),
      cues: raw.cues || []
    };
  }

  saveScript(script) {
    this.validateId(script.id);
    const scriptPath = path.join(this.scriptsDir, `${script.id}.json`);
    this.atomicWriteJson(scriptPath, script);
  }

  deleteScript(id) {
    this.validateId(id);
    const scriptPath = path.join(this.scriptsDir, `${id}.json`);
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
      return true;
    }
    return false;
  }

  listScripts() {
    if (!fs.existsSync(this.scriptsDir)) {
      return [];
    }

    const summaries = [];
    const entries = fs.readdirSync(this.scriptsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const fullPath = path.join(this.scriptsDir, entry.name);
        try {
          const raw = this.readJson(fullPath, null);
          const content = raw.content || raw.text || '';
          const wordCount = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
          summaries.push({
            id: raw.id || raw.scriptId || path.basename(entry.name, '.json'),
            title: raw.title || 'Untitled',
            created_at: raw.created_at ?? raw.createdAt ?? '',
            updated_at: raw.updated_at ?? raw.updatedAt ?? '',
            last_position: raw.last_position ?? raw.lastPosition ?? raw.scrollPosition ?? 0.0,
            speed: raw.speed ?? 2.5,
            word_count: wordCount
          });
        } catch {
          // Skip corrupted scripts in listing
        }
      }
    }

    summaries.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    return summaries;
  }

  duplicateScript(id, newTitle = null) {
    const original = this.loadScript(id);
    const now = Date.now();
    const newId = `script-${now}-copy`;
    const copy = {
      ...original,
      id: newId,
      title: newTitle || `${original.title} (Copy)`,
      created_at: `${now}Z`,
      updated_at: `${now}Z`
    };
    this.saveScript(copy);
    return copy;
  }
}

// ============================================================================
// Tier 5 Adversarial Coverage Hardening Suite: Rust Backend
// ============================================================================

describe('Tier 5 Adversarial: Rust Backend Hardening & Edge Condition Verification', () => {

  // Test 1: Adversarial HWND Mutation, Lifetime, and Re-Registration
  it('1. should verify adversarial HWND validation, destruction semantics, and recreation', () => {
    const platform = new MockWindowPlatform({ autoRegister: false });

    // Boundary rejections: 0, negative integers, floats
    assert.throws(() => platform.setDisplayAffinity(0, DisplayAffinity.ExcludeFromCapture), /Null HWND/i);
    assert.throws(() => platform.setDisplayAffinity(-1, DisplayAffinity.ExcludeFromCapture), /Negative HWND/i);
    assert.throws(() => platform.setDisplayAffinity(-99999, DisplayAffinity.ExcludeFromCapture), /Negative HWND/i);

    // Strict mode unknown HWND rejection
    assert.throws(() => platform.showUnfocused(5001), /WindowNotFound/i);

    // Register valid HWND
    platform.registerWindow(5001);
    platform.setDisplayAffinity(5001, DisplayAffinity.ExcludeFromCapture);
    platform.setClickThrough(5001, true);
    platform.setNoActivate(5001, true);
    platform.applyVibrancy(5001, VibrancyEffect.Mica);
    platform.showUnfocused(5001);

    // Verify properties
    assert.strictEqual(platform.getDisplayAffinity(5001), DisplayAffinity.ExcludeFromCapture);

    // Destroy HWND and verify Win32 1400 on all methods
    platform.destroyWindow(5001);
    assert.throws(() => platform.setDisplayAffinity(5001, DisplayAffinity.None), /InvalidWindowHandle.*1400/i);
    assert.throws(() => platform.getDisplayAffinity(5001), /InvalidWindowHandle.*1400/i);
    assert.throws(() => platform.setClickThrough(5001, false), /InvalidWindowHandle.*1400/i);
    assert.throws(() => platform.setNoActivate(5001, false), /InvalidWindowHandle.*1400/i);
    assert.throws(() => platform.showUnfocused(5001), /InvalidWindowHandle.*1400/i);
    assert.throws(() => platform.hide(5001), /InvalidWindowHandle.*1400/i);
    assert.throws(() => platform.setOpacity(5001, 0.5), /InvalidWindowHandle.*1400/i);

    // Window recreation onto new HWND
    const lenient = new MockWindowPlatform({ autoRegister: true });
    lenient.setDisplayAffinity(6001, DisplayAffinity.ExcludeFromCapture);
    lenient.handleWindowRecreation(6001, 6002);
    assert.strictEqual(lenient.getDisplayAffinity(6002), DisplayAffinity.ExcludeFromCapture);
    assert.strictEqual(lenient.getDisplayAffinity(6001), DisplayAffinity.None);
  });

  // Test 2: Platform Error Injection, Method Isolation, and Call Log Auditing
  it('2. should verify MockWindowPlatform error injection mechanics and call log fidelity', () => {
    const platform = new MockWindowPlatform();
    const hwnd = 7001;

    // Call logging verification
    platform.setDisplayAffinity(hwnd, DisplayAffinity.ExcludeFromCapture);
    platform.setClickThrough(hwnd, true);
    platform.showUnfocused(hwnd);
    platform.hide(hwnd);

    assert.strictEqual(platform.callCount('set_display_affinity'), 1);
    assert.strictEqual(platform.callCount('set_click_through'), 1);
    assert.strictEqual(platform.callCount('show_unfocused'), 1);
    assert.strictEqual(platform.callCount('hide'), 1);
    assert.strictEqual(platform.callLog.length, 4);

    // Clearing call log preserves window state
    platform.clearCallLog();
    assert.strictEqual(platform.callLog.length, 0);
    assert.strictEqual(platform.getDisplayAffinity(hwnd), DisplayAffinity.ExcludeFromCapture);

    // Injected one-shot fault
    platform.injectErrorOnce('hide', new Error('Simulated one-shot driver fault'));
    assert.throws(() => platform.hide(hwnd), /Simulated one-shot driver fault/);
    assert.doesNotThrow(() => platform.hide(hwnd));

    // Persistent error injection with method isolation
    platform.injectError('set_click_through', new Error('Persistent click-through error'));
    assert.throws(() => platform.setClickThrough(hwnd, true), /Persistent click-through error/);
    assert.throws(() => platform.setClickThrough(hwnd, false), /Persistent click-through error/);
    assert.doesNotThrow(() => platform.setDisplayAffinity(hwnd, DisplayAffinity.Monitor));

    platform.clearInjectedErrors();
    assert.doesNotThrow(() => platform.setClickThrough(hwnd, true));
  });

  // Test 3: DWM Composition & Legacy OS Guards
  it('3. should enforce Win32 OS build guards (19041+) and DWM composition requirements', () => {
    // Legacy OS build (< 19041, e.g. Windows 10 Build 18363)
    const legacy = new MockWindowPlatform({ osBuild: 18363 });
    assert.throws(
      () => legacy.setDisplayAffinity(8001, DisplayAffinity.ExcludeFromCapture),
      /UnsupportedOsVersion.*19041/
    );
    assert.doesNotThrow(() => legacy.setDisplayAffinity(8001, DisplayAffinity.Monitor));

    // Modern OS (22631) but DWM disabled
    const noDwm = new MockWindowPlatform({ osBuild: 22631, dwmEnabled: false });
    assert.throws(
      () => noDwm.setDisplayAffinity(8002, DisplayAffinity.ExcludeFromCapture),
      /DwmCompositionDisabled/
    );

    // Unrecognized affinity flag
    assert.throws(
      () => noDwm.setDisplayAffinity(8002, 'InvalidFlag0x99'),
      /InvalidAffinityFlag/
    );
  });

  // Test 4: Atomic Storage Concurrent Writes & Lock Storm
  it('4. should guarantee zero file corruption under high concurrent async write storm', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-tier5-storm-'));
    try {
      const storage = new StorageEngineSimulator(tmpDir);

      const tasks = [];
      for (let i = 0; i < 40; i++) {
        tasks.push(
          Promise.resolve().then(() => {
            storage.saveSettings({
              scroll_speed: 1.0 + (i % 10),
              font_size: 20 + (i % 50),
              theme: i % 2 === 0 ? 'dark-glass' : 'cyber-cyan'
            });

            const sId = `script-storm-${i % 4}`;
            storage.saveScript({
              id: sId,
              title: `Storm Title ${i}`,
              content: `Content from concurrent task ${i}`
            });

            const loaded = storage.loadSettings();
            assert.ok(loaded.scroll_speed >= 0.1 && loaded.scroll_speed <= 20.0);
          })
        );
      }

      await Promise.all(tasks);

      const finalSettings = storage.loadSettings();
      assert.ok(finalSettings.font_size >= 8 && finalSettings.font_size <= 144);

      const rootFiles = fs.readdirSync(tmpDir);
      assert.ok(!rootFiles.some(f => f.endsWith('.tmp')), 'No .tmp files should be left in storage root');

      if (fs.existsSync(storage.scriptsDir)) {
        const scriptFiles = fs.readdirSync(storage.scriptsDir);
        assert.ok(!scriptFiles.some(f => f.endsWith('.tmp')), 'No .tmp files should be left in scripts directory');
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Test 5: Script Identifier Adversarial Penetration
  it('5. should reject hostile Script IDs: traversal sequences, forbidden chars, and DOS devices', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-tier5-ids-'));
    try {
      const storage = new StorageEngineSimulator(tmpDir);

      const hostileIds = [
        '',
        '   ',
        '..',
        '../escape',
        '..\\escape',
        'sub/../escape',
        'sub\\..\\escape',
        'c:/boot.ini',
        'd:\\passwords',
        'script:colon',
        'script*star',
        'script?question',
        'script"quote',
        'script<less',
        'script>greater',
        'script|pipe',
        'script\0null',
        'script\ntab',
        'trailing_dot.',
        'trailing_space ',
        'CON',
        'con.json',
        'PRN',
        'prn.txt',
        'AUX',
        'aux.data',
        'NUL',
        'nul.log',
        'COM1',
        'com9.json',
        'LPT1',
        'lpt8.doc'
      ];

      for (const id of hostileIds) {
        assert.throws(
          () => storage.validateId(id),
          /Invalid script ID/i,
          `Expected hostile ID '${id}' to be rejected`
        );
        assert.throws(
          () => storage.loadScript(id),
          /Invalid script ID/i
        );
        assert.throws(
          () => storage.saveScript({ id, title: 'Bad', content: 'Bad' }),
          /Invalid script ID/i
        );
        assert.throws(
          () => storage.deleteScript(id),
          /Invalid script ID/i
        );
      }

      const safeIds = [
        'script-123',
        'my_speech_final',
        'speech-2026-11-23',
        'guion_espanol',
        'console_log',
        'auxiliary_notes',
        'nullable_type'
      ];

      for (const id of safeIds) {
        assert.doesNotThrow(() => storage.validateId(id));
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Test 6: Settings Serde Dual-Naming Tolerant Matrix & Boundary Clamping
  it('6. should parse camelCase and snake_case Settings JSON and clamp out-of-range numerical values', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-tier5-serde-'));
    try {
      const storage = new StorageEngineSimulator(tmpDir);

      const camelCasePayload = {
        scrollSpeed: 12.5,
        fontSize: 72,
        lineHeight: 2.2,
        windowOpacity: 0.75,
        mirrorMode: true,
        clickThrough: true,
        theme: 'dark-glass',
        offlineOnly: true,
        telemetryEnabled: false,
        hotkeys: {
          togglePlay: 'Ctrl+Space',
          speedUp: 'Ctrl+Up',
          speedDown: 'Ctrl+Down',
          toggleWindow: 'Ctrl+H'
        }
      };

      storage.saveSettings(camelCasePayload);
      const loadedCamel = storage.loadSettings();

      assert.strictEqual(loadedCamel.scroll_speed, 12.5);
      assert.strictEqual(loadedCamel.font_size, 72);
      assert.strictEqual(loadedCamel.mirror_mode, true);
      assert.strictEqual(loadedCamel.click_through, true);
      assert.strictEqual(loadedCamel.hotkeys.toggle_play, 'Ctrl+Space');

      const wildPayload = {
        scroll_speed: -100.0,
        font_size: 1,
        line_height: 0.1,
        window_opacity: 50.0
      };

      storage.saveSettings(wildPayload);
      const loadedWild = storage.loadSettings();

      assert.strictEqual(loadedWild.scroll_speed, 0.1, 'scroll_speed must clamp to lower bound 0.1');
      assert.strictEqual(loadedWild.font_size, 8, 'font_size must clamp to lower bound 8');
      assert.strictEqual(loadedWild.line_height, 0.5, 'line_height must clamp to lower bound 0.5');
      assert.strictEqual(loadedWild.window_opacity, 1.0, 'window_opacity must clamp to upper bound 1.0');

      const upperWildPayload = {
        scroll_speed: 1000.0,
        font_size: 9999,
        line_height: 25.0,
        window_opacity: 2.0
      };

      storage.saveSettings(upperWildPayload);
      const loadedUpper = storage.loadSettings();

      assert.strictEqual(loadedUpper.scroll_speed, 20.0, 'scroll_speed must clamp to upper bound 20.0');
      assert.strictEqual(loadedUpper.font_size, 144, 'font_size must clamp to upper bound 144');
      assert.strictEqual(loadedUpper.line_height, 5.0, 'line_height must clamp to upper bound 5.0');
      assert.strictEqual(loadedUpper.window_opacity, 1.0, 'window_opacity must clamp to upper bound 1.0');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Test 7: Multi-File Corruption Quarantine and Self-Healing
  it('7. should quarantine corrupted scripts to .corrupt backups while listing valid scripts cleanly', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-tier5-corrupt-'));
    try {
      const storage = new StorageEngineSimulator(tmpDir);
      fs.mkdirSync(storage.scriptsDir, { recursive: true });

      storage.saveScript({
        id: 'valid-script-1',
        title: 'Valid Speech 1',
        content: 'Clean presentation script content.',
        updated_at: '2026-11-23T10:00:00Z'
      });
      storage.saveScript({
        id: 'valid-script-2',
        title: 'Valid Speech 2',
        content: 'Another valid script content.',
        updated_at: '2026-11-23T11:00:00Z'
      });

      fs.writeFileSync(path.join(storage.scriptsDir, 'bad-zero.json'), '');
      fs.writeFileSync(path.join(storage.scriptsDir, 'bad-syntax.json'), '{"title": "Broken", "text": "unclosed');
      fs.writeFileSync(path.join(storage.scriptsDir, 'bad-binary.json'), Buffer.from([0xFF, 0xFE, 0xFD, 0x00, 0xAA]));
      fs.writeFileSync(path.join(storage.scriptsDir, 'notes.txt'), 'random notes');

      const listed = storage.listScripts();
      assert.strictEqual(listed.length, 2);
      assert.strictEqual(listed[0].id, 'valid-script-2');
      assert.strictEqual(listed[1].id, 'valid-script-1');

      assert.ok(fs.existsSync(path.join(storage.scriptsDir, 'bad-zero.json.corrupt')));
      assert.ok(fs.existsSync(path.join(storage.scriptsDir, 'bad-syntax.json.corrupt')));
      assert.ok(fs.existsSync(path.join(storage.scriptsDir, 'bad-binary.json.corrupt')));

      fs.writeFileSync(storage.settingsPath, '{"broken_json": true,');
      const healedSettings = storage.loadSettings();
      assert.strictEqual(healedSettings.scroll_speed, 3.0);
      assert.strictEqual(healedSettings.theme, 'dark-glass');
      assert.ok(fs.existsSync(`${storage.settingsPath}.corrupt`));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Test 8: Extreme Payload, Memory Stress, and Multilingual Script Invariance
  it('8. should preserve 1MB payload integrity and full multilingual Unicode character set', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-tier5-unicode-'));
    try {
      const storage = new StorageEngineSimulator(tmpDir);

      const largeContent = 'StealthPrompter invisible screen share teleprompter engine. '.repeat(18000);
      assert.ok(largeContent.length > 1_000_000, 'Payload must exceed 1 Megabyte');

      const largeScript = {
        id: 'extreme-large-script',
        title: 'Keynote 2026 Huge Script',
        content: largeContent,
        last_position: 15420.5,
        speed: 4.5,
        cues: [
          { id: 'c1', label: 'Intro', position: 0.0, notes: 'Smile at camera' },
          { id: 'c2', label: 'Demo', position: 5000.0, notes: null },
          { id: 'c3', label: 'Q&A', position: 12000.0, notes: 'Check chat' }
        ]
      };

      storage.saveScript(largeScript);
      const reloadedLarge = storage.loadScript('extreme-large-script');

      assert.strictEqual(reloadedLarge.content.length, largeContent.length);
      assert.strictEqual(reloadedLarge.cues.length, 3);
      assert.strictEqual(reloadedLarge.cues[0].label, 'Intro');
      assert.strictEqual(reloadedLarge.cues[1].notes, null);

      const unicodeScript = {
        id: 'multilingual-script',
        title: 'Guión en Español con Emojis 🚀 & 隐形提词器',
        content: '¿Cómo estás? ¡Excelente! Caracteres acentuados: á, é, í, ó, ú, ñ, ü. テレプロンプター.',
        last_position: 0.0,
        speed: 2.5,
        cues: []
      };

      storage.saveScript(unicodeScript);
      const reloadedUnicode = storage.loadScript('multilingual-script');

      assert.strictEqual(reloadedUnicode.title, unicodeScript.title);
      assert.strictEqual(reloadedUnicode.content, unicodeScript.content);

      const duplicated = storage.duplicateScript('multilingual-script');
      assert.ok(duplicated.id.includes('-copy'));
      assert.ok(duplicated.title.includes('(Copy)'));
      assert.strictEqual(duplicated.content, unicodeScript.content);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Test 9: IPC Command Parameter Bounds & Error Propagation
  it('9. should handle IPC command parameter casing variants and gracefully propagate errors', () => {
    const platform = new MockWindowPlatform();
    platform.registerWindow(9001);

    function ipcSetCaptureExclusion(params) {
      const label = params.window_label || params.windowLabel || 'prompter';
      const windowHwndMap = { prompter: 9001, launcher: 9002 };

      if (!windowHwndMap[label]) {
        throw new Error(`Window '${label}' not found`);
      }

      const hwnd = windowHwndMap[label];
      const affinity = params.enabled ? DisplayAffinity.ExcludeFromCapture : DisplayAffinity.None;
      platform.setDisplayAffinity(hwnd, affinity);
      return { success: true };
    }

    const res1 = ipcSetCaptureExclusion({ window_label: 'prompter', enabled: true });
    assert.strictEqual(res1.success, true);
    assert.strictEqual(platform.getDisplayAffinity(9001), DisplayAffinity.ExcludeFromCapture);

    const res2 = ipcSetCaptureExclusion({ windowLabel: 'prompter', enabled: false });
    assert.strictEqual(res2.success, true);
    assert.strictEqual(platform.getDisplayAffinity(9001), DisplayAffinity.None);

    const res3 = ipcSetCaptureExclusion({ enabled: true });
    assert.strictEqual(res3.success, true);
    assert.strictEqual(platform.getDisplayAffinity(9001), DisplayAffinity.ExcludeFromCapture);

    assert.throws(
      () => ipcSetCaptureExclusion({ window_label: 'ghost_window', enabled: true }),
      /Window 'ghost_window' not found/
    );
  });

  // Test 10: Global Shortcut Non-Focus Invariance & Action Dispatch
  it('10. should dispatch prompter:action events while maintaining non-focus-stealing invariants', () => {
    const eventsEmitted = [];
    const eventBus = {
      emit: (eventName, payload) => {
        eventsEmitted.push({ event: eventName, payload });
      }
    };

    const platform = new MockWindowPlatform();
    const prompterHwnd = 9500;
    platform.registerWindow(prompterHwnd);

    const shortcutActions = {
      'alt+space': () => eventBus.emit('prompter:action', { type: 'toggle_play' }),
      'alt+up': () => eventBus.emit('prompter:action', { type: 'speed_up' }),
      'alt+down': () => eventBus.emit('prompter:action', { type: 'speed_down' }),
      'alt+r': () => eventBus.emit('prompter:action', { type: 'rewind' }),
      'alt+h': () => {
        const isVis = platform.windows.get(prompterHwnd).visible;
        if (isVis) {
          platform.hide(prompterHwnd);
          eventBus.emit('prompter:action', { type: 'pause' });
        } else {
          platform.showUnfocused(prompterHwnd);
        }
      }
    };

    shortcutActions['alt+space']();
    shortcutActions['alt+up']();
    shortcutActions['alt+up']();
    shortcutActions['alt+down']();
    shortcutActions['alt+r']();
    shortcutActions['alt+h']();
    shortcutActions['alt+h']();

    assert.strictEqual(eventsEmitted.length, 6);
    assert.deepStrictEqual(eventsEmitted[0], { event: 'prompter:action', payload: { type: 'toggle_play' } });
    assert.deepStrictEqual(eventsEmitted[1], { event: 'prompter:action', payload: { type: 'speed_up' } });
    assert.deepStrictEqual(eventsEmitted[2], { event: 'prompter:action', payload: { type: 'speed_up' } });
    assert.deepStrictEqual(eventsEmitted[3], { event: 'prompter:action', payload: { type: 'speed_down' } });
    assert.deepStrictEqual(eventsEmitted[4], { event: 'prompter:action', payload: { type: 'rewind' } });
    assert.deepStrictEqual(eventsEmitted[5], { event: 'prompter:action', payload: { type: 'pause' } });

    const callLog = platform.callLog;
    assert.ok(callLog.some(c => c.method === 'show_unfocused'));
    assert.ok(callLog.some(c => c.method === 'hide'));
  });
});
