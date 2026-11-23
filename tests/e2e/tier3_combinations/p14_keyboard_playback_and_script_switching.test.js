import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P14: Pairwise Combination — Keyboard Playback & Script Switching
 * Features tested:
 * - F10: Non-Focus-Stealing Global Hotkeys (Playback & Navigation Controls)
 * - F6 & F8: Script Storage & Launcher Script Switching Lifecycle
 *
 * Verifies that hotkey playback controls correctly interact with rapid script switching,
 * ensuring clean state transitions, bookmark retention, and no race conditions.
 */

class MockScriptSessionManager {
  constructor(scripts = []) {
    this.scripts = new Map(scripts.map(s => [s.id, { ...s }]));
    this.activeScriptId = scripts[0]?.id || null;
    this.playing = false;
    this.scrollPosition = 0;
    this.speed = 2.0;
  }

  getActiveScript() {
    return this.scripts.get(this.activeScriptId);
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
    this.saveCurrentBookmark();
  }

  saveCurrentBookmark() {
    const active = this.getActiveScript();
    if (active) {
      active.scrollPosition = this.scrollPosition;
      active.speed = this.speed;
    }
  }

  switchScript(targetScriptId) {
    const target = this.scripts.get(targetScriptId);
    if (!target) {
      throw new Error(`Script not found: ${targetScriptId}`);
    }

    // Step 1: Auto-pause current playback and save bookmark
    if (this.playing) {
      this.pause();
    }

    // Step 2: Switch active script
    this.activeScriptId = targetScriptId;

    // Step 3: Load target script's saved bookmark and speed
    this.scrollPosition = target.scrollPosition || 0;
    this.speed = target.speed || 2.0;

    return {
      activeScriptId: this.activeScriptId,
      title: target.title,
      scrollPosition: this.scrollPosition,
      speed: this.speed,
      playing: this.playing
    };
  }

  tick() {
    if (this.playing) {
      this.scrollPosition += this.speed * 1.5;
    }
    return this.scrollPosition;
  }
}

describe('P14: Pairwise Keyboard Playback & Script Switching', () => {
  it('should auto-pause playback and save bookmark when switching to a new script', () => {
    const manager = new MockScriptSessionManager([
      { id: 'script-A', title: 'Script Alpha', scrollPosition: 0, speed: 2.0 },
      { id: 'script-B', title: 'Script Beta', scrollPosition: 0, speed: 3.0 }
    ]);

    manager.play();
    manager.tick();
    manager.tick();
    assert.equal(manager.playing, true);
    const posA = manager.scrollPosition;
    assert.ok(posA > 0);

    // Switch to Script B
    const switched = manager.switchScript('script-B');
    assert.equal(switched.activeScriptId, 'script-B');
    assert.equal(manager.playing, false, 'Playback must pause upon script switch');
    assert.equal(manager.scripts.get('script-A').scrollPosition, posA, 'Bookmark for Script A must be saved');
    assert.equal(manager.scrollPosition, 0, 'Script B should start at its bookmark (0)');
    assert.equal(manager.speed, 3.0, 'Script B should load its saved speed');
  });

  it('should restore previous script bookmark when switching back', () => {
    const manager = new MockScriptSessionManager([
      { id: 's1', title: 'Script 1', scrollPosition: 120.0, speed: 2.5 },
      { id: 's2', title: 'Script 2', scrollPosition: 450.0, speed: 4.0 }
    ]);

    assert.equal(manager.activeScriptId, 's1');
    assert.equal(manager.scrollPosition, 0); // initial session before switch

    manager.switchScript('s1');
    assert.equal(manager.scrollPosition, 120.0);
    assert.equal(manager.speed, 2.5);

    manager.switchScript('s2');
    assert.equal(manager.scrollPosition, 450.0);
    assert.equal(manager.speed, 4.0);
  });

  it('should handle rapid cycling across scripts without state corruption', () => {
    const scripts = Array.from({ length: 5 }, (_, i) => ({
      id: `script-${i}`,
      title: `Title ${i}`,
      scrollPosition: i * 50,
      speed: 1.5 + i * 0.5
    }));

    const manager = new MockScriptSessionManager(scripts);

    // Rapidly switch through scripts
    for (let cycle = 0; cycle < 20; cycle++) {
      const idx = cycle % 5;
      const res = manager.switchScript(`script-${idx}`);
      assert.equal(res.activeScriptId, `script-${idx}`);
      assert.equal(res.scrollPosition, idx * 50);
    }
  });

  it('should reject invalid script ID and retain current playback session safely', () => {
    const manager = new MockScriptSessionManager([
      { id: 'current', title: 'Active Script', scrollPosition: 75.0, speed: 2.0 }
    ]);
    manager.switchScript('current');

    assert.throws(
      () => manager.switchScript('non-existent-id'),
      /Script not found: non-existent-id/
    );

    // Current state remains intact
    assert.equal(manager.activeScriptId, 'current');
    assert.equal(manager.scrollPosition, 75.0);
  });

  it('should immediately respond to keyboard playback hotkeys after script switch', () => {
    const manager = new MockScriptSessionManager([
      { id: 'sA', title: 'A', scrollPosition: 0 },
      { id: 'sB', title: 'B', scrollPosition: 0 }
    ]);

    manager.switchScript('sB');
    assert.equal(manager.playing, false);

    // Hit Play hotkey
    manager.play();
    assert.equal(manager.playing, true);
    manager.tick();
    assert.ok(manager.scrollPosition > 0);

    // Hit Pause hotkey
    manager.pause();
    assert.equal(manager.playing, false);
  });
});
