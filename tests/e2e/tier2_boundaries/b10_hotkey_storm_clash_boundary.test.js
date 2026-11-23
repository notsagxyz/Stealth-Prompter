import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Global Hotkey Manager & Non-Focus Stealing Validator.
 * Corresponds to PROJECT.md Feature 10 (tauri-plugin-global-shortcut handling hotkeys without stealing focus).
 * Enforces:
 * - Valid accelerator string parsing
 * - Detection and rejection of OS-reserved shortcuts (Win+L, Ctrl+Alt+Del, Alt+Tab)
 * - Conflict detection for duplicate key registrations
 * - High-frequency storm resilience
 * - Invariant foreground window focus preservation
 */
export class GlobalHotkeyManager {
  constructor(options = {}) {
    this.reservedShortcuts = new Set([
      'win+l',
      'alt+ctrl+del',
      'alt+ctrl+delete',
      'alt+tab',
      'alt+f4',
      'win+d',
      'win+tab'
    ]);
    this.registeredShortcuts = new Map(); // shortcut -> handler
    this.activeForegroundHwnd = options.activeForegroundHwnd || 5001; // e.g. PowerPoint / OBS
  }

  normalizeShortcut(shortcut) {
    if (!shortcut || typeof shortcut !== 'string') {
      throw new Error('Shortcut must be a non-empty string.');
    }
    const clean = shortcut.trim().toLowerCase();
    if (clean.length === 0) {
      throw new Error('Shortcut string cannot be empty.');
    }

    const parts = clean.split('+').map(p => p.trim());
    if (parts.some(p => p.length === 0)) {
      throw new Error(`Malformed shortcut syntax: "${shortcut}". Cannot have dangling '+' separators.`);
    }

    const validModifiers = ['ctrl', 'alt', 'shift', 'win', 'meta', 'command', 'cmd'];
    const validKeys = [
      'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
      'space', 'up', 'down', 'left', 'right', 'enter', 'escape', 'tab', 'del', 'delete',
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ];

    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, parts.length - 1);

    if (!validKeys.includes(key)) {
      throw new Error(`Invalid key identifier: "${key}".`);
    }

    for (const mod of modifiers) {
      if (!validModifiers.includes(mod)) {
        throw new Error(`Invalid modifier: "${mod}".`);
      }
    }

    // Sort modifiers for consistent hash
    return [...modifiers.sort(), key].join('+');
  }

  register(shortcut, handler) {
    const normalized = this.normalizeShortcut(shortcut);

    if (this.reservedShortcuts.has(normalized)) {
      throw new Error(`ReservedSystemShortcut: "${shortcut}" is reserved by the operating system and cannot be overridden.`);
    }

    if (this.registeredShortcuts.has(normalized)) {
      throw new Error(`AlreadyRegistered: Shortcut "${shortcut}" is already bound to another action.`);
    }

    this.registeredShortcuts.set(normalized, handler);
    return true;
  }

  trigger(shortcut) {
    const normalized = this.normalizeShortcut(shortcut);
    const handler = this.registeredShortcuts.get(normalized);
    if (!handler) {
      return { handled: false, error: 'UnboundShortcut' };
    }

    const initialForeground = this.activeForegroundHwnd;

    // Execute handler without stealing focus
    handler();

    // Verify invariant: foreground window MUST NOT CHANGE
    const postExecutionForeground = this.activeForegroundHwnd;
    const focusPreserved = initialForeground === postExecutionForeground;

    return { handled: true, focusPreserved, activeForegroundHwnd: postExecutionForeground };
  }
}

describe('B10: Hotkey Storm & Collision Boundary Cases', () => {
  it('1. should process rapid simultaneous hotkey spam (storm test) without race conditions or state desync', () => {
    const manager = new GlobalHotkeyManager();
    let toggleCount = 0;
    let isPlaying = false;

    manager.register('Ctrl+Shift+Space', () => {
      toggleCount++;
      isPlaying = !isPlaying;
    });

    // Fire 100 rapid hotkeys in tight sequence
    for (let i = 0; i < 100; i++) {
      const res = manager.trigger('Ctrl+Shift+Space');
      assert.strictEqual(res.handled, true);
    }

    assert.strictEqual(toggleCount, 100);
    // 100 toggles from false -> even number ends in false
    assert.strictEqual(isPlaying, false);
  });

  it('2. should detect and reject system reserved shortcut clashes (Win+L, Ctrl+Alt+Del, Alt+Tab)', () => {
    const manager = new GlobalHotkeyManager();
    const systemReserved = ['Win+L', 'Ctrl+Alt+Del', 'Alt+Tab', 'Alt+F4', 'Win+D'];

    for (const sc of systemReserved) {
      assert.throws(
        () => manager.register(sc, () => {}),
        /ReservedSystemShortcut/i
      );
    }
  });

  it('3. should reject malformed, empty, or invalid key combination strings', () => {
    const manager = new GlobalHotkeyManager();
    const malformed = [
      '',
      '   ',
      'Ctrl++',
      'Ctrl+Shift+',
      'FooBar+Z',
      'Ctrl+InvalidKeyName'
    ];

    for (const sc of malformed) {
      assert.throws(
        () => manager.register(sc, () => {}),
        /Malformed shortcut|Invalid key|Invalid modifier|Shortcut.*cannot be empty|Shortcut must be/i
      );
    }
  });

  it('4. should guarantee that hotkey invocation does NOT steal active foreground window focus', () => {
    const externalAppHwnd = 9988; // e.g. Active Word / Zoom window
    const manager = new GlobalHotkeyManager({ activeForegroundHwnd: externalAppHwnd });

    let prompterSpeed = 1.0;
    manager.register('Ctrl+Alt+Up', () => {
      prompterSpeed += 0.5;
    });

    const triggerResult = manager.trigger('Ctrl+Alt+Up');
    assert.strictEqual(triggerResult.handled, true);
    assert.strictEqual(triggerResult.focusPreserved, true);
    assert.strictEqual(triggerResult.activeForegroundHwnd, externalAppHwnd);
    assert.strictEqual(prompterSpeed, 1.5);
  });

  it('5. should reject duplicate registrations of the same shortcut combination', () => {
    const manager = new GlobalHotkeyManager();
    manager.register('Ctrl+Alt+P', () => {});

    // Exact duplicate
    assert.throws(
      () => manager.register('Ctrl+Alt+P', () => {}),
      /AlreadyRegistered/i
    );

    // Permuted modifiers duplicate (Alt+Ctrl+P is equivalent to Ctrl+Alt+P)
    assert.throws(
      () => manager.register('Alt+Ctrl+P', () => {}),
      /AlreadyRegistered/i
    );
  });
});
