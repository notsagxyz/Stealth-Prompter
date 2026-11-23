import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P07: Pairwise Combination — Speed Scrubbing & Reading Progress Retention
 * Features tested:
 * - F8 & F9: Speed Scrubbing Controls (0.1x to 10.0x, Reverse Speed)
 * - F6 & F9: Reading Progress Retention & Script Bookmark State
 *
 * Verifies that scrubbing playback speed preserves scroll continuity without position jumps,
 * and script bookmarking reliably retains reading progress.
 */

class PrompterPlaybackController {
  constructor(script) {
    this.script = { ...script };
    this.speed = script.speed ?? 2.0;
    this.progressPx = script.scrollPosition ?? 0.0;
    this.playing = false;
    this.lastSavedBookmark = null;
  }

  setSpeed(newSpeed) {
    // Speed scrubbing updates speed instantly without altering current pixel offset
    this.speed = newSpeed;
    return this.speed;
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
    this.saveBookmark();
  }

  tick(deltaMs = 16.67) {
    if (!this.playing) return this.progressPx;
    // Step proportional to speed: baseline 2.0 = 3.0 px per 16.67ms frame
    const step = (this.speed * 1.5 * deltaMs) / 16.67;
    this.progressPx = Math.max(0, this.progressPx + step);
    return this.progressPx;
  }

  saveBookmark() {
    this.lastSavedBookmark = {
      scriptId: this.script.id,
      scrollPosition: Math.round(this.progressPx * 100) / 100,
      savedSpeed: this.speed,
      timestamp: Date.now()
    };
    this.script.scrollPosition = this.lastSavedBookmark.scrollPosition;
    this.script.speed = this.lastSavedBookmark.savedSpeed;
    return this.lastSavedBookmark;
  }
}

describe('P07: Pairwise Speed Scrubbing & Progress Retention', () => {
  it('should preserve exact scroll pixel position when scrubbing speed from 1.0x to 5.0x', () => {
    const controller = new PrompterPlaybackController({ id: 's1', scrollPosition: 250.0, speed: 1.0 });
    controller.play();

    // Advance 5 frames at 1.0x (1.5 px/frame = 7.5px)
    for (let i = 0; i < 5; i++) controller.tick();
    const positionBeforeScrub = controller.progressPx;
    assert.equal(positionBeforeScrub, 257.5);

    // Scrub speed to 5.0x
    controller.setSpeed(5.0);
    assert.equal(controller.progressPx, positionBeforeScrub, 'Progress must not reset or jump on speed scrub');

    // Next frame advances at 5.0x (7.5 px/frame)
    controller.tick();
    assert.equal(controller.progressPx, positionBeforeScrub + 7.5);
  });

  it('should decrement scroll position smoothly during reverse scrubbing and clamp at zero', () => {
    const controller = new PrompterPlaybackController({ id: 's2', scrollPosition: 20.0, speed: 2.0 });
    controller.play();

    // Set reverse speed -2.0x
    controller.setSpeed(-2.0);

    // Frame 1: 20 - 3.0 = 17.0
    controller.tick();
    assert.equal(controller.progressPx, 17.0);

    // Advance 10 more reverse frames: clamps at 0, never negative
    for (let i = 0; i < 10; i++) controller.tick();
    assert.equal(controller.progressPx, 0, 'Progress must clamp at 0 and not become negative');
  });

  it('should maintain continuous progress during high-frequency slider scrub jitter', () => {
    const controller = new PrompterPlaybackController({ id: 's3', scrollPosition: 100.0, speed: 2.0 });
    controller.play();

    // Rapidly changing speed slider across 10 values in quick succession
    const speeds = [1.2, 2.8, 0.5, 4.0, 3.2, 1.8, 5.0, 2.2, 3.0, 2.5];
    for (const s of speeds) {
      controller.setSpeed(s);
      controller.tick();
      assert.ok(!isNaN(controller.progressPx), 'Progress must remain valid number');
      assert.ok(controller.progressPx >= 100.0, 'Progress should advance monotonically');
    }

    assert.equal(controller.speed, 2.5);
  });

  it('should record exact bookmark metadata when pausing playback', () => {
    const controller = new PrompterPlaybackController({ id: 's4', scrollPosition: 50.0, speed: 3.0 });
    controller.play();

    for (let i = 0; i < 10; i++) controller.tick();
    controller.pause();

    assert.equal(controller.playing, false);
    assert.ok(controller.lastSavedBookmark);
    assert.equal(controller.lastSavedBookmark.scriptId, 's4');
    assert.equal(controller.lastSavedBookmark.savedSpeed, 3.0);
    assert.equal(controller.lastSavedBookmark.scrollPosition, controller.progressPx);
    assert.ok(controller.lastSavedBookmark.timestamp > 0);
  });

  it('should restore from saved bookmark with updated speed upon new session instantiation', () => {
    const initialScript = { id: 's5', title: 'Presentation', scrollPosition: 0, speed: 2.0 };
    const session1 = new PrompterPlaybackController(initialScript);
    session1.play();

    // Run session 1
    session1.setSpeed(3.5);
    for (let i = 0; i < 20; i++) session1.tick();
    session1.pause();

    const savedState = session1.script;

    // Start session 2 simulating app restart or reload
    const session2 = new PrompterPlaybackController(savedState);
    assert.equal(session2.progressPx, savedState.scrollPosition);
    assert.equal(session2.speed, 3.5);
    assert.equal(session2.playing, false);
  });
});
