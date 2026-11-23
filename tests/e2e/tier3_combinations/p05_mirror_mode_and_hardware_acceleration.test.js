import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P05: Pairwise Combination — Mirror Mode & Hardware Acceleration
 * Features tested:
 * - F9: SolidJS Overlay HUD Prompter (Mirror Mode: Horizontal & Vertical Flip)
 * - Hardware Accelerated Scroll Engine (CSS transform3d & matrix composition)
 *
 * Verifies that horizontal and vertical optical mirror reflections (for beam-splitter glass)
 * correctly compose with 3D translation matrices without distorting scroll kinematics.
 */

class PrompterTransformEngine {
  constructor() {
    this.scrollY = 0;
    this.mirrorHorizontal = false;
    this.mirrorVertical = false;
  }

  setMirror(horizontal, vertical) {
    this.mirrorHorizontal = Boolean(horizontal);
    this.mirrorVertical = Boolean(vertical);
  }

  setScroll(y) {
    this.scrollY = Math.max(0, y);
  }

  // Generates CSS transform string used by SolidJS HUD renderer
  getCssTransform() {
    const scaleX = this.mirrorHorizontal ? -1 : 1;
    const scaleY = this.mirrorVertical ? -1 : 1;
    // GPU accelerated 3D translation with scale inversion
    return `translate3d(0px, -${this.scrollY}px, 0px) scale(${scaleX}, ${scaleY})`;
  }

  // Calculates 4x4 affine transformation matrix
  // [ sx   0   0   0 ]
  // [  0  sy   0 -ty ]
  // [  0   0   1   0 ]
  // [  0   0   0   1 ]
  getTransformationMatrix() {
    const sx = this.mirrorHorizontal ? -1 : 1;
    const sy = this.mirrorVertical ? -1 : 1;
    const ty = -this.scrollY;
    return [
      [sx, 0, 0, 0],
      [0, sy, 0, ty],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
  }

  // Maps physical window coordinates to script content coordinates
  mapScreenToContent(screenX, screenY, viewportWidth, viewportHeight) {
    let contentX = screenX;
    let contentY = screenY + this.scrollY;

    if (this.mirrorHorizontal) {
      contentX = viewportWidth - screenX;
    }
    if (this.mirrorVertical) {
      contentY = viewportHeight - screenY + this.scrollY;
    }

    return { contentX, contentY };
  }
}

describe('P05: Pairwise Mirror Mode & Hardware Acceleration', () => {
  it('should generate standard 3D translate transform in normal un-mirrored mode', () => {
    const engine = new PrompterTransformEngine();
    engine.setScroll(150);

    const css = engine.getCssTransform();
    assert.equal(css, 'translate3d(0px, -150px, 0px) scale(1, 1)');

    const matrix = engine.getTransformationMatrix();
    assert.deepEqual(matrix, [
      [1, 0, 0, 0],
      [0, 1, 0, -150],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]);
  });

  it('should compose scaleX(-1) and translate3d in horizontal mirror mode', () => {
    const engine = new PrompterTransformEngine();
    engine.setMirror(true, false);
    engine.setScroll(200);

    const css = engine.getCssTransform();
    assert.equal(css, 'translate3d(0px, -200px, 0px) scale(-1, 1)');

    const matrix = engine.getTransformationMatrix();
    assert.equal(matrix[0][0], -1, 'X axis must be inverted for teleprompter glass');
    assert.equal(matrix[1][1], 1, 'Y axis must remain normal');
    assert.equal(matrix[1][3], -200, 'Y translation must remain -200px');
  });

  it('should compose scaleY(-1) and translate3d in vertical mirror mode', () => {
    const engine = new PrompterTransformEngine();
    engine.setMirror(false, true);
    engine.setScroll(300);

    const css = engine.getCssTransform();
    assert.equal(css, 'translate3d(0px, -300px, 0px) scale(1, -1)');

    const matrix = engine.getTransformationMatrix();
    assert.equal(matrix[0][0], 1, 'X axis normal');
    assert.equal(matrix[1][1], -1, 'Y axis inverted');
    assert.equal(matrix[1][3], -300);
  });

  it('should compose dual mirror mode for specialized beam-splitters', () => {
    const engine = new PrompterTransformEngine();
    engine.setMirror(true, true);
    engine.setScroll(450);

    const css = engine.getCssTransform();
    assert.equal(css, 'translate3d(0px, -450px, 0px) scale(-1, -1)');

    const matrix = engine.getTransformationMatrix();
    assert.equal(matrix[0][0], -1);
    assert.equal(matrix[1][1], -1);
  });

  it('should maintain scroll velocity and distance invariance under all mirror configurations', () => {
    const modes = [
      { name: 'Normal', h: false, v: false },
      { name: 'Horizontal', h: true, v: false },
      { name: 'Vertical', h: false, v: true },
      { name: 'Dual', h: true, v: true }
    ];

    const targetDistance = 1000;
    const speed = 2.5;
    const stepPerFrame = speed * 1.5; // 3.75 px per frame at 60Hz baseline

    for (const mode of modes) {
      const engine = new PrompterTransformEngine();
      engine.setMirror(mode.h, mode.v);

      let frames = 0;
      let currentY = 0;

      while (currentY < targetDistance) {
        currentY += stepPerFrame;
        engine.setScroll(currentY);
        frames++;
      }

      // Exactly the same frames required for all modes
      assert.equal(frames, 267, `Mode ${mode.name} should take exactly 267 frames to cross 1000px`);
      assert.ok(engine.scrollY >= targetDistance);
    }
  });
});
