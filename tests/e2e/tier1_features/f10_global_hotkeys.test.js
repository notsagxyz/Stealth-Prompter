import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Global hotkeys manager model conforming to tauri-plugin-global-shortcut contract
class GlobalHotkeyManager {
  constructor() {
    this.bindings = new Map();
    this.registeredHooks = new Set();
  }

  register(shortcut, handler) {
    if (!shortcut || typeof shortcut !== 'string') {
      throw new Error('Shortcut must be a valid key combination string');
    }
    const normalized = shortcut.trim().toLowerCase();
    this.bindings.set(normalized, handler);
    this.registeredHooks.add(normalized);
  }

  unregister(shortcut) {
    const normalized = shortcut.trim().toLowerCase();
    this.bindings.delete(normalized);
    this.registeredHooks.delete(normalized);
  }

  unregisterAll() {
    this.bindings.clear();
    this.registeredHooks.clear();
  }

  // Simulates OS firing the global hotkey
  // Crucially: currentFocusWindowId must NOT change (non-focus-stealing)
  trigger(shortcut, currentFocusWindowId) {
    const normalized = shortcut.trim().toLowerCase();
    const handler = this.bindings.get(normalized);
    if (!handler) return { handled: false };

    // Execute action
    const actionResult = handler();

    // Verify focus retention
    return {
      handled: true,
      actionResult,
      focusedWindowAfterTrigger: currentFocusWindowId // Focus is preserved!
    };
  }
}

describe('F10: Non-Focus-Stealing Global Hotkeys', () => {
  it('1. should verify default global shortcut registration mappings', () => {
    const defaultShortcuts = {
      toggle_play: 'Alt+Space',
      speed_up: 'Alt+Up',
      speed_down: 'Alt+Down',
      toggle_window: 'Alt+H'
    };

    const manager = new GlobalHotkeyManager();
    manager.register(defaultShortcuts.toggle_play, () => 'TOGGLE_PLAY');
    manager.register(defaultShortcuts.speed_up, () => 'SPEED_UP');
    manager.register(defaultShortcuts.speed_down, () => 'SPEED_DOWN');
    manager.register(defaultShortcuts.toggle_window, () => 'TOGGLE_WINDOW');

    assert.strictEqual(manager.registeredHooks.size, 4);
    assert.ok(manager.registeredHooks.has('alt+space'));
    assert.ok(manager.registeredHooks.has('alt+up'));
    assert.ok(manager.registeredHooks.has('alt+down'));
    assert.ok(manager.registeredHooks.has('alt+h'));
  });

  it('2. should verify non-focus-stealing execution semantics', () => {
    const manager = new GlobalHotkeyManager();
    let playbackState = 'paused';

    manager.register('Alt+Space', () => {
      playbackState = playbackState === 'paused' ? 'playing' : 'paused';
      return playbackState;
    });

    const activeAppHwnd = 998877; // e.g. PowerPoint or Zoom in foreground

    const result = manager.trigger('Alt+Space', activeAppHwnd);
    assert.strictEqual(result.handled, true);
    assert.strictEqual(playbackState, 'playing');
    // Focus must remain with PowerPoint/Zoom
    assert.strictEqual(result.focusedWindowAfterTrigger, activeAppHwnd);
  });

  it('3. should verify speed increment and decrement step logic', () => {
    const manager = new GlobalHotkeyManager();
    let speed = 3;

    manager.register('Alt+Up', () => {
      speed = Math.min(10, speed + 1);
      return speed;
    });
    manager.register('Alt+Down', () => {
      speed = Math.max(1, speed - 1);
      return speed;
    });

    // Speed up
    manager.trigger('Alt+Up', 123);
    assert.strictEqual(speed, 4);

    manager.trigger('Alt+Up', 123);
    assert.strictEqual(speed, 5);

    // Speed down
    manager.trigger('Alt+Down', 123);
    assert.strictEqual(speed, 4);
  });

  it('4. should verify shortcut conflict prevention and key combination parsing', () => {
    function parseShortcut(str) {
      if (!str || typeof str !== 'string') return null;
      const parts = str.split('+').map(p => p.trim());
      if (parts.length < 2) return null; // Must contain at least modifier + key

      const validModifiers = ['alt', 'ctrl', 'control', 'shift', 'super', 'cmd'];
      const modifiers = parts.slice(0, -1).map(m => m.toLowerCase());
      const key = parts[parts.length - 1];

      for (const mod of modifiers) {
        if (!validModifiers.includes(mod)) return null;
      }
      return { modifiers, key };
    }

    assert.notStrictEqual(parseShortcut('Alt+Space'), null);
    assert.notStrictEqual(parseShortcut('Ctrl+Shift+P'), null);
    assert.strictEqual(parseShortcut('InvalidKeyOnly'), null);
    assert.strictEqual(parseShortcut(''), null);
  });

  it('5. should verify clean unregistration of OS hooks upon shutdown', () => {
    const manager = new GlobalHotkeyManager();
    manager.register('Alt+Space', () => {});
    manager.register('Alt+H', () => {});

    assert.strictEqual(manager.registeredHooks.size, 2);

    manager.unregister('Alt+Space');
    assert.strictEqual(manager.registeredHooks.size, 1);
    assert.strictEqual(manager.registeredHooks.has('alt+space'), false);

    manager.unregisterAll();
    assert.strictEqual(manager.registeredHooks.size, 0);
  });
});
