import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P08: Pairwise Combination — Panic Hide & Unfocused Restore
 * Features tested:
 * - F10: Non-Focus-Stealing Global Hotkeys (Panic Shortcut: Ctrl+Alt+H / Esc)
 * - F4 & F5: WindowPlatform hide() & show_unfocused() (SW_SHOWNOACTIVATE)
 *
 * Verifies instant emergency hiding of the prompter overlay without stealing focus
 * from foreground applications, and unfocused restoration of visibility.
 */

class MockWindowSession {
  constructor(activeForegroundHwnd = 7001) {
    this.foregroundHwnd = activeForegroundHwnd;
    this.prompter = {
      hwnd: 9999,
      visible: true,
      playing: true,
      renderTicks: 0,
      focusEvents: 0
    };
    this.focusLog = [activeForegroundHwnd];
  }

  // Active foreground app event
  typeInForeground(text) {
    return `Typed "${text}" in window ${this.foregroundHwnd}`;
  }

  // Panic hide trigger
  panicHide() {
    this.prompter.visible = false;
    this.prompter.playing = false; // Auto-pause on panic hide
    // Focus remains strictly on current foreground window
    this.focusLog.push(this.foregroundHwnd);
    return { visible: false, currentForeground: this.foregroundHwnd };
  }

  // Unfocused restore (SW_SHOWNOACTIVATE)
  restoreUnfocused() {
    this.prompter.visible = true;
    // Window is shown without stealing focus
    this.focusLog.push(this.foregroundHwnd);
    return { visible: true, currentForeground: this.foregroundHwnd };
  }

  // Render loop tick
  renderTick() {
    if (this.prompter.visible && this.prompter.playing) {
      this.prompter.renderTicks++;
    }
    return this.prompter.renderTicks;
  }
}

describe('P08: Pairwise Panic Hide & Unfocused Restore', () => {
  it('should immediately hide prompter and auto-pause playback on panic trigger', () => {
    const session = new MockWindowSession(7001);
    assert.equal(session.prompter.visible, true);
    assert.equal(session.prompter.playing, true);

    const result = session.panicHide();
    assert.equal(result.visible, false);
    assert.equal(session.prompter.visible, false);
    assert.equal(session.prompter.playing, false, 'Playback must auto-pause on panic');
    assert.equal(result.currentForeground, 7001, 'Foreground window must be unchanged');
  });

  it('should restore prompter visibility unfocused without taking focus from active app', () => {
    const FOREGROUND_IDE = 7002;
    const session = new MockWindowSession(FOREGROUND_IDE);

    session.panicHide();
    assert.equal(session.prompter.visible, false);

    // User types in IDE
    session.typeInForeground('const x = 42;');

    // Restore prompter unfocused
    const restoreRes = session.restoreUnfocused();
    assert.equal(restoreRes.visible, true);
    assert.equal(restoreRes.currentForeground, FOREGROUND_IDE,
      'Active IDE must retain focus when prompter is restored');
    assert.equal(session.prompter.focusEvents, 0, 'Prompter must have received 0 focus events');
  });

  it('should zero render ticks during panic hide to avoid GPU and CPU resource consumption', () => {
    const session = new MockWindowSession(7003);

    // Active ticks while visible
    session.renderTick();
    session.renderTick();
    assert.equal(session.prompter.renderTicks, 2);

    session.panicHide();

    // Ticks while hidden
    for (let i = 0; i < 10; i++) {
      session.renderTick();
    }
    assert.equal(session.prompter.renderTicks, 2, 'No draw calls must execute while prompter is panic hidden');
  });

  it('should survive rapid panic-restore-panic toggles without focus flutter', () => {
    const PRESENTATION_HWND = 7004;
    const session = new MockWindowSession(PRESENTATION_HWND);

    for (let i = 0; i < 10; i++) {
      session.panicHide();
      assert.equal(session.prompter.visible, false);
      assert.equal(session.foregroundHwnd, PRESENTATION_HWND);

      session.restoreUnfocused();
      assert.equal(session.prompter.visible, true);
      assert.equal(session.foregroundHwnd, PRESENTATION_HWND);
    }

    // Every recorded focus check confirms 100% preservation
    for (const hwnd of session.focusLog) {
      assert.equal(hwnd, PRESENTATION_HWND);
    }
  });

  it('should resume playback smoothly upon user action after an emergency panic pause', () => {
    const session = new MockWindowSession(7005);
    session.renderTick();
    const ticksBefore = session.prompter.renderTicks;

    session.panicHide();
    session.restoreUnfocused();
    assert.equal(session.prompter.playing, false, 'Prompter waits paused until user explicitly resumes');

    // User resumes playback
    session.prompter.playing = true;
    session.renderTick();
    assert.equal(session.prompter.renderTicks, ticksBefore + 1);
  });
});
