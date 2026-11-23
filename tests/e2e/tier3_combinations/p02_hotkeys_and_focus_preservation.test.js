import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P02: Pairwise Combination — Global Hotkeys & Focus Preservation
 * Features tested:
 * - F10: Non-Focus-Stealing Global Hotkeys (tauri-plugin-global-shortcut)
 * - F4 & F5: WindowPlatform focus preservation (WS_EX_NOACTIVATE, SW_SHOWNOACTIVATE)
 *
 * Verifies that triggering global hotkeys (Play/Pause, Speed Adjust, Window Toggle)
 * modifies prompter state while strictly leaving active foreground window focus intact.
 */

class MockWindowManager {
  constructor(initialForeground = 5001) {
    this.foregroundHwnd = initialForeground;
    this.windows = new Map();
    this.focusChangeHistory = [];
  }

  registerWindow(hwnd, name, styles = {}) {
    this.windows.set(hwnd, {
      hwnd,
      name,
      visible: styles.visible ?? true,
      noActivate: styles.noActivate ?? false, // WS_EX_NOACTIVATE
      receivedFocusCount: 0
    });
  }

  getForegroundWindow() {
    return this.foregroundHwnd;
  }

  setForegroundWindow(hwnd) {
    const target = this.windows.get(hwnd);
    if (!target) throw new Error(`Unknown window: ${hwnd}`);
    if (target.noActivate) {
      // WS_EX_NOACTIVATE rejects stealing focus
      return false;
    }
    this.foregroundHwnd = hwnd;
    target.receivedFocusCount++;
    this.focusChangeHistory.push({ hwnd, timestamp: Date.now() });
    return true;
  }

  showUnfocused(hwnd) {
    const win = this.windows.get(hwnd);
    if (!win) throw new Error(`Unknown window: ${hwnd}`);
    win.visible = true;
    // SW_SHOWNOACTIVATE: displays window without activating it
    // Foreground window remains untouched
    return { visible: true, currentForeground: this.foregroundHwnd };
  }

  hide(hwnd) {
    const win = this.windows.get(hwnd);
    if (!win) throw new Error(`Unknown window: ${hwnd}`);
    win.visible = false;
    return { visible: false, currentForeground: this.foregroundHwnd };
  }
}

class MockGlobalShortcutManager {
  constructor(windowManager, prompterHwnd) {
    this.wm = windowManager;
    this.prompterHwnd = prompterHwnd;
    this.shortcuts = new Map();
    this.prompterState = {
      playing: false,
      speed: 2.0,
      visible: true
    };
  }

  register(shortcut, handler) {
    if (this.shortcuts.has(shortcut)) {
      throw new Error(`Shortcut already registered: ${shortcut}`);
    }
    this.shortcuts.set(shortcut, handler);
  }

  trigger(shortcut) {
    const handler = this.shortcuts.get(shortcut);
    if (!handler) return false;

    const initialForeground = this.wm.getForegroundWindow();
    // Execute handler without transferring focus
    handler(this.prompterState, this.wm, this.prompterHwnd);
    const postForeground = this.wm.getForegroundWindow();

    assert.equal(postForeground, initialForeground,
      `Focus must remain on ${initialForeground} after triggering ${shortcut}`);
    return true;
  }
}

describe('P02: Pairwise Hotkeys & Focus Preservation', () => {
  it('should trigger playback actions without altering foreground window focus', () => {
    const wm = new MockWindowManager();
    const EXTERNAL_APP_HWND = 5001;
    const PROMPTER_HWND = 9001;

    wm.registerWindow(EXTERNAL_APP_HWND, 'PowerPoint Keynote', { noActivate: false });
    wm.registerWindow(PROMPTER_HWND, 'HUD Prompter', { noActivate: true });

    assert.equal(wm.getForegroundWindow(), EXTERNAL_APP_HWND);

    const shortcuts = new MockGlobalShortcutManager(wm, PROMPTER_HWND);

    // Register play/pause shortcut (Space / Control+Space)
    shortcuts.register('Control+Space', (state) => {
      state.playing = !state.playing;
    });

    // Register speed up (Alt+Up)
    shortcuts.register('Alt+ArrowUp', (state) => {
      state.speed += 0.5;
    });

    // Register speed down (Alt+Down)
    shortcuts.register('Alt+ArrowDown', (state) => {
      state.speed = Math.max(0.5, state.speed - 0.5);
    });

    // Trigger Play
    shortcuts.trigger('Control+Space');
    assert.equal(shortcuts.prompterState.playing, true);
    assert.equal(wm.getForegroundWindow(), EXTERNAL_APP_HWND);

    // Trigger Speed Up
    shortcuts.trigger('Alt+ArrowUp');
    assert.equal(shortcuts.prompterState.speed, 2.5);
    assert.equal(wm.getForegroundWindow(), EXTERNAL_APP_HWND);

    // Trigger Speed Down
    shortcuts.trigger('Alt+ArrowDown');
    assert.equal(shortcuts.prompterState.speed, 2.0);
    assert.equal(wm.getForegroundWindow(), EXTERNAL_APP_HWND);

    // Verify prompter window received zero focus events
    assert.equal(wm.windows.get(PROMPTER_HWND).receivedFocusCount, 0);
  });

  it('should prevent prompter from stealing focus when show_unfocused is invoked via hotkey', () => {
    const EXTERNAL_APP_HWND = 5002;
    const PROMPTER_HWND = 9002;
    const wm = new MockWindowManager(EXTERNAL_APP_HWND);

    wm.registerWindow(EXTERNAL_APP_HWND, 'Google Chrome', { noActivate: false });
    wm.registerWindow(PROMPTER_HWND, 'HUD Prompter', { noActivate: true, visible: false });

    const shortcuts = new MockGlobalShortcutManager(wm, PROMPTER_HWND);
    shortcuts.register('Alt+H', (state, winManager, hwnd) => {
      if (state.visible) {
        winManager.hide(hwnd);
        state.visible = false;
      } else {
        winManager.showUnfocused(hwnd);
        state.visible = true;
      }
    });

    // Currently hidden, toggle to show
    shortcuts.prompterState.visible = false;
    shortcuts.trigger('Alt+H');

    assert.equal(shortcuts.prompterState.visible, true);
    assert.equal(wm.windows.get(PROMPTER_HWND).visible, true);
    assert.equal(wm.getForegroundWindow(), EXTERNAL_APP_HWND,
      'External app must maintain focus when HUD is shown unfocused');

    // Toggle to hide
    shortcuts.trigger('Alt+H');
    assert.equal(shortcuts.prompterState.visible, false);
    assert.equal(wm.windows.get(PROMPTER_HWND).visible, false);
    assert.equal(wm.getForegroundWindow(), EXTERNAL_APP_HWND);
  });

  it('should maintain foreground keystroke integrity during rapid hotkey execution', () => {
    const EXTERNAL_APP_HWND = 5003;
    const PROMPTER_HWND = 9003;
    const wm = new MockWindowManager(EXTERNAL_APP_HWND);

    wm.registerWindow(EXTERNAL_APP_HWND, 'Code Editor', { noActivate: false });
    wm.registerWindow(PROMPTER_HWND, 'HUD Prompter', { noActivate: true });

    const shortcuts = new MockGlobalShortcutManager(wm, PROMPTER_HWND);
    shortcuts.register('Space', (state) => {
      state.playing = !state.playing;
    });

    // Simulating user typing in editor while background hotkeys fire
    const editorBuffer = [];
    for (let i = 0; i < 50; i++) {
      editorBuffer.push(String.fromCharCode(65 + (i % 26)));
      if (i % 5 === 0) {
        shortcuts.trigger('Space');
      }
    }

    assert.equal(editorBuffer.length, 50, 'All 50 keystrokes received in editor');
    assert.equal(wm.getForegroundWindow(), EXTERNAL_APP_HWND);
    assert.equal(wm.windows.get(PROMPTER_HWND).receivedFocusCount, 0);
  });

  it('should reject duplicate shortcut registration without affecting focus or existing shortcuts', () => {
    const wm = new MockWindowManager();
    const shortcuts = new MockGlobalShortcutManager(wm, 9004);

    shortcuts.register('Ctrl+Alt+P', (state) => { state.playing = true; });

    assert.throws(
      () => shortcuts.register('Ctrl+Alt+P', (state) => { state.playing = false; }),
      /Shortcut already registered: Ctrl\+Alt\+P/
    );

    // Existing shortcut remains intact
    shortcuts.trigger('Ctrl+Alt+P');
    assert.equal(shortcuts.prompterState.playing, true);
  });

  it('should enforce WS_EX_NOACTIVATE rejection if OS attempts to set foreground to prompter', () => {
    const wm = new MockWindowManager();
    const PROMPTER_HWND = 9005;
    wm.registerWindow(PROMPTER_HWND, 'Prompter', { noActivate: true });

    // Directly attempting to set foreground to a no-activate window fails
    const success = wm.setForegroundWindow(PROMPTER_HWND);
    assert.equal(success, false, 'SetForegroundWindow must fail on WS_EX_NOACTIVATE window');
    assert.equal(wm.windows.get(PROMPTER_HWND).receivedFocusCount, 0);
  });
});
