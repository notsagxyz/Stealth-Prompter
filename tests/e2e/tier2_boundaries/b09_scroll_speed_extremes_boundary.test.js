import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Prompter Auto-Scroll Engine Simulator.
 * Corresponds to PROJECT.md Feature 9 (HUD Prompter with 144Hz smooth scroll & speed controls).
 * Speed rules:
 * - Minimum speed: 0.0 (Paused)
 * - Maximum speed: 50.0x (clamped)
 * - Negative speeds support reverse scrolling or clamp depending on mode
 * - Sub-pixel precision delta-time calculation: position += speed * baseRate * (deltaTime / 1000)
 */
export class PrompterScrollEngine {
  constructor(options = {}) {
    this.speed = options.initialSpeed !== undefined ? options.initialSpeed : 1.0;
    this.maxSpeed = 50.0;
    this.minSpeed = 0.0;
    this.baseRate = 60.0; // 60 pixels per second at 1.0x
    this.position = 0.0;
    this.contentHeight = options.contentHeight || 2000.0;
    this.viewportHeight = options.viewportHeight || 600.0;
    this.maxScroll = Math.max(0, this.contentHeight - this.viewportHeight);
    this.allowReverse = options.allowReverse !== undefined ? options.allowReverse : true;
    this.isPlaying = false;
  }

  setSpeed(rawSpeed) {
    if (typeof rawSpeed !== 'number' || isNaN(rawSpeed)) {
      throw new Error(`Invalid speed value: ${rawSpeed}`);
    }

    if (rawSpeed < 0 && !this.allowReverse) {
      this.speed = 0.0;
      return this.speed;
    }

    // Clamp speed between -maxSpeed and maxSpeed
    if (rawSpeed > this.maxSpeed) {
      this.speed = this.maxSpeed;
    } else if (rawSpeed < -this.maxSpeed) {
      this.speed = -this.maxSpeed;
    } else {
      this.speed = rawSpeed;
    }
    return this.speed;
  }

  update(deltaTimeMs) {
    if (!this.isPlaying || this.speed === 0 || deltaTimeMs <= 0) {
      return this.position;
    }

    const deltaPixels = this.speed * this.baseRate * (deltaTimeMs / 1000.0);
    this.position += deltaPixels;

    // Clamp position within [0, maxScroll]
    if (this.position > this.maxScroll) {
      this.position = this.maxScroll;
      this.isPlaying = false; // End reached
    } else if (this.position < 0) {
      this.position = 0;
    }

    return this.position;
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }
}

describe('B09: Scroll Speed Extremes & Precision Boundary Cases', () => {
  it('1. should halt scroll progress without divide-by-zero errors when speed is set to 0 (Paused)', () => {
    const engine = new PrompterScrollEngine();
    engine.play();
    engine.setSpeed(0);

    const initialPos = engine.position;
    // Simulate 100 frames with speed = 0
    for (let i = 0; i < 100; i++) {
      const pos = engine.update(16.67); // ~60fps frame delta
      assert.strictEqual(pos, initialPos);
      assert.ok(!isNaN(pos));
    }
    assert.strictEqual(engine.position, 0);
  });

  it('2. should handle negative speed for reverse scrolling or clamp safely to 0', () => {
    // Mode A: Allow reverse
    const reverseEngine = new PrompterScrollEngine({ allowReverse: true });
    reverseEngine.position = 500; // Start midway
    reverseEngine.play();
    reverseEngine.setSpeed(-2.0); // 2x reverse speed

    // Update 500ms (0.5s * 2.0 * 60 = 60 pixels backwards)
    reverseEngine.update(500);
    assert.strictEqual(reverseEngine.position, 440);

    // Continue reversing past 0 -> should clamp at 0 without underflowing to negative
    reverseEngine.update(50000);
    assert.strictEqual(reverseEngine.position, 0);

    // Mode B: Disallow reverse -> clamps negative to 0
    const clampedEngine = new PrompterScrollEngine({ allowReverse: false });
    clampedEngine.setSpeed(-5.0);
    assert.strictEqual(clampedEngine.speed, 0.0);
  });

  it('3. should clamp extreme speed values to the maximum safe threshold (50x)', () => {
    const engine = new PrompterScrollEngine();

    // Extreme positive speeds
    engine.setSpeed(1000.0);
    assert.strictEqual(engine.speed, 50.0);

    engine.setSpeed(999999.99);
    assert.strictEqual(engine.speed, 50.0);

    // Extreme negative speeds
    engine.setSpeed(-500.0);
    assert.strictEqual(engine.speed, -50.0);
  });

  it('4. should maintain floating-point precision and avoid drift across sub-pixel increments', () => {
    const engine = new PrompterScrollEngine({ initialSpeed: 0.1 }); // 0.1x very slow scroll
    engine.play();

    // Advance 60 frames of exactly 16.666666666666668ms (1 second total)
    const frameDelta = 1000.0 / 60.0;
    for (let frame = 0; frame < 60; frame++) {
      engine.update(frameDelta);
      assert.ok(!isNaN(engine.position));
      assert.ok(isFinite(engine.position));
    }

    // At 0.1x speed, baseRate 60px/s, in 1s total moved = 6px
    const expected = 6.0;
    const diff = Math.abs(engine.position - expected);
    assert.ok(diff < 0.0001, `Position was ${engine.position}, expected ${expected} (diff: ${diff})`);
  });

  it('5. should gracefully stop auto-scroll at end of script without bouncing or NaN overflow', () => {
    const engine = new PrompterScrollEngine({ contentHeight: 1000, viewportHeight: 600 });
    // maxScroll is 1000 - 600 = 400
    assert.strictEqual(engine.maxScroll, 400);

    engine.setSpeed(50.0); // Maximum speed
    engine.play();

    // Advance far beyond the end
    engine.update(10000); // 10 seconds at 50x

    assert.strictEqual(engine.position, 400);
    assert.strictEqual(engine.isPlaying, false); // Automatically halted
    assert.ok(!isNaN(engine.position));
  });
});
