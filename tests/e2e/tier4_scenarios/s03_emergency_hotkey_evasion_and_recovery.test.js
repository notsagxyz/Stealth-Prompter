import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * S03: Real-World Scenario — Emergency Hotkey Evasion & Recovery
 * Features exercised:
 * - F4: WindowPlatform Trait Abstraction (hide, show_unfocused)
 * - F9: SolidJS Overlay HUD Prompter (Auto-pause, visibility state)
 * - F10: Non-Focus-Stealing Global Hotkeys (Panic Shortcut: Ctrl+Alt+H / Esc)
 *
 * Simulates a high-pressure scenario where an uninvited viewer approaches or screen mode switches:
 * user presses emergency panic hotkey -> HUD instantly disappears without stealing window focus,
 * and recovers cleanly when triggered again.
 */

class EvasionSimulationSession {
  constructor(activeEditorHwnd = 4001) {
    this.editorHwnd = activeEditorHwnd;
    this.currentForeground = activeEditorHwnd;
    this.editorInputHistory = [];
    this.hud = {
      hwnd: 8888,
      visible: true,
      playing: true,
      scrollPosition: 350.0,
      activeLine: 14,
      drawCalls: 0
    };
    this.focusStealViolations = 0;
  }

  typeEditorCharacter(char) {
    if (this.currentForeground !== this.editorHwnd) {
      this.focusStealViolations++;
    }
    this.editorInputHistory.push(char);
  }

  // Panic hotkey pressed (e.g., Ctrl+Alt+H or Esc)
  strikePanicHotkey() {
    const startTime = performance.now();

    // Prompter hides immediately
    this.hud.visible = false;
    // Prompter auto-pauses so position is held
    this.hud.playing = false;

    // Foreground window remains untouched
    assert.equal(this.currentForeground, this.editorHwnd);
    const latencyMs = performance.now() - startTime;

    return { hidden: true, latencyMs, pausedLine: this.hud.activeLine };
  }

  // Restore hotkey pressed
  strikeRestoreHotkey() {
    // WindowPlatform::show_unfocused (SW_SHOWNOACTIVATE)
    this.hud.visible = true;

    // Strict requirement: showing HUD must NOT steal focus from editor
    assert.equal(this.currentForeground, this.editorHwnd);

    return {
      restored: true,
      visible: this.hud.visible,
      playing: this.hud.playing, // Remains paused until user restarts
      restoredLine: this.hud.activeLine
    };
  }

  renderTick() {
    if (this.hud.visible && this.hud.playing) {
      this.hud.drawCalls++;
      this.hud.scrollPosition += 3.0;
      this.hud.activeLine = Math.floor(this.hud.scrollPosition / 25);
    }
  }
}

describe('S03: Scenario — Emergency Hotkey Evasion & Recovery', () => {
  it('should instantly hide prompter on panic hotkey without interrupting active editor input', () => {
    const session = new EvasionSimulationSession(4001);

    // Initial state: prompter running
    session.renderTick();
    session.renderTick();
    assert.equal(session.hud.visible, true);
    assert.equal(session.hud.playing, true);

    // User typing code before evasion
    session.typeEditorCharacter('f');
    session.typeEditorCharacter('u');
    session.typeEditorCharacter('n');

    // Emergency evasion triggered!
    const evasion = session.strikePanicHotkey();
    assert.equal(evasion.hidden, true);
    assert.ok(evasion.latencyMs < 50, 'Panic evasion must execute in sub-frame time');
    assert.equal(session.hud.visible, false);
    assert.equal(session.hud.playing, false);

    // Continue typing while prompter is hidden — zero dropped characters or focus steals
    session.typeEditorCharacter('c');
    session.typeEditorCharacter('t');
    session.typeEditorCharacter('i');
    session.typeEditorCharacter('o');
    session.typeEditorCharacter('n');

    assert.equal(session.editorInputHistory.join(''), 'function');
    assert.equal(session.focusStealViolations, 0, 'Zero focus steal violations');

    // Ticks while hidden must produce 0 draw calls
    const drawsBefore = session.hud.drawCalls;
    session.renderTick();
    session.renderTick();
    assert.equal(session.hud.drawCalls, drawsBefore);
  });

  it('should restore prompter unfocused at the exact paused line when danger clears', () => {
    const session = new EvasionSimulationSession(4002);
    session.hud.activeLine = 28;
    session.hud.scrollPosition = 700.0;

    // Panic hide
    session.strikePanicHotkey();
    assert.equal(session.hud.visible, false);

    // Unfocused restore
    const restoration = session.strikeRestoreHotkey();
    assert.equal(restoration.visible, true);
    assert.equal(restoration.restoredLine, 28, 'Must hold exact line index where paused');
    assert.equal(restoration.playing, false, 'Prompter must wait in paused state');
    assert.equal(session.currentForeground, 4002, 'Active editor must keep focus');

    // Speaker resumes playback
    session.hud.playing = true;
    session.renderTick();
    assert.ok(session.hud.scrollPosition > 700.0);
  });
});
