import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pixel Invisibility Verification Probe Simulator.
 * Corresponds to PROJECT.md Feature 11 & Requirement R3:
 * - Uses magenta test probe `#FF00FF` (R: 255, G: 0, B: 255).
 * - Must differentiate between exact target color and near-magenta edge artifacts.
 * - Handles transparent/alpha channels.
 * - Handles 10-bit HDR frame buffer conversions.
 * - Handles off-screen display boundary clipping.
 * - Detects black frames / invalid capture streams.
 */
export class InvisibilityCaptureProbe {
  constructor(options = {}) {
    this.targetColor = { r: 255, g: 0, b: 255 }; // Pure Magenta #FF00FF
    this.tolerance = options.tolerance !== undefined ? options.tolerance : 0; // Strict tolerance for exact match
  }

  isTargetPixel(r, g, b, a = 255) {
    if (a === 0) {
      // Fully transparent pixel: not visible to capture
      return false;
    }
    const deltaR = Math.abs(r - this.targetColor.r);
    const deltaG = Math.abs(g - this.targetColor.g);
    const deltaB = Math.abs(b - this.targetColor.b);
    return deltaR <= this.tolerance && deltaG <= this.tolerance && deltaB <= this.tolerance;
  }

  scanFrameBuffer(buffer, width, height, bytesPerPixel = 4) {
    if (!buffer || buffer.length === 0) {
      throw new Error('EmptyBuffer: Frame buffer cannot be empty.');
    }

    const expectedSize = width * height * bytesPerPixel;
    if (buffer.length < expectedSize) {
      throw new Error(`BufferUnderflow: Expected at least ${expectedSize} bytes for ${width}x${height}x${bytesPerPixel}, got ${buffer.length}`);
    }

    let targetCount = 0;
    let nonBlackCount = 0;

    for (let i = 0; i < expectedSize; i += bytesPerPixel) {
      const r = buffer[i];
      const g = buffer[i + 1];
      const b = buffer[i + 2];
      const a = bytesPerPixel >= 4 ? buffer[i + 3] : 255;

      if (r > 0 || g > 0 || b > 0) {
        nonBlackCount++;
      }

      if (this.isTargetPixel(r, g, b, a)) {
        targetCount++;
      }
    }

    const isAllBlack = nonBlackCount === 0;
    return {
      targetPixelCount: targetCount,
      isAllBlack,
      isInvisible: targetCount === 0 && !isAllBlack,
      totalPixels: width * height
    };
  }

  clipRegion(region, screenWidth, screenHeight) {
    const left = Math.max(0, Math.min(region.x, screenWidth));
    const top = Math.max(0, Math.min(region.y, screenHeight));
    const right = Math.max(0, Math.min(region.x + region.width, screenWidth));
    const bottom = Math.max(0, Math.min(region.y + region.height, screenHeight));

    return {
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
      wasClipped: left !== region.x || top !== region.y || (right - left) !== region.width || (bottom - top) !== region.height
    };
  }

  convert10BitHdrTo8Bit(r10, g10, b10) {
    // 10-bit range is [0, 1023] -> map to [0, 255]
    const r8 = Math.round((Math.max(0, Math.min(r10, 1023)) / 1023) * 255);
    const g8 = Math.round((Math.max(0, Math.min(g10, 1023)) / 1023) * 255);
    const b8 = Math.round((Math.max(0, Math.min(b10, 1023)) / 1023) * 255);
    return { r: r8, g: g8, b: b8 };
  }
}

describe('B11: Capture Probe Edge Colors & Invisibility Boundary Cases', () => {
  const probe = new InvisibilityCaptureProbe();

  it('1. should distinguish between exact magenta (#FF00FF) and near-magenta edge colors (#FE00FE, #FF01FF)', () => {
    // Exact pure magenta
    assert.strictEqual(probe.isTargetPixel(255, 0, 255), true);

    // Near-magenta edge colors (sub-pixel antialiasing or compression artifacts)
    assert.strictEqual(probe.isTargetPixel(254, 0, 254), false); // #FE00FE
    assert.strictEqual(probe.isTargetPixel(255, 1, 255), false); // #FF01FF
    assert.strictEqual(probe.isTargetPixel(254, 1, 254), false); // #FE01FE
  });

  it('2. should ignore transparent and semi-transparent alpha-blended pixels in capture verification', () => {
    // Magenta RGB with alpha = 0 (completely transparent window background)
    assert.strictEqual(probe.isTargetPixel(255, 0, 255, 0), false);

    // Magenta with full opacity
    assert.strictEqual(probe.isTargetPixel(255, 0, 255, 255), true);
  });

  it('3. should normalize 10-bit HDR frame buffer pixels without gamut clipping errors', () => {
    // 10-bit HDR max values (1023, 0, 1023) -> 8-bit (255, 0, 255)
    const hdrMagenta = probe.convert10BitHdrTo8Bit(1023, 0, 1023);
    assert.strictEqual(hdrMagenta.r, 255);
    assert.strictEqual(hdrMagenta.g, 0);
    assert.strictEqual(hdrMagenta.b, 255);
    assert.strictEqual(probe.isTargetPixel(hdrMagenta.r, hdrMagenta.g, hdrMagenta.b), true);

    // 10-bit midpoint (512, 512, 512) -> ~128 gray
    const hdrMid = probe.convert10BitHdrTo8Bit(512, 512, 512);
    assert.strictEqual(hdrMid.r, 128);
    assert.strictEqual(probe.isTargetPixel(hdrMid.r, hdrMid.g, hdrMid.b), false);
  });

  it('4. should clip bounding box safely when window is positioned partially off-screen without array index out-of-bounds', () => {
    const screenWidth = 1920;
    const screenHeight = 1080;

    // Window hanging off the right edge: x: 1800, width: 400 (reaches 2200)
    const clippedRight = probe.clipRegion({ x: 1800, y: 100, width: 400, height: 300 }, screenWidth, screenHeight);
    assert.strictEqual(clippedRight.wasClipped, true);
    assert.strictEqual(clippedRight.x, 1800);
    assert.strictEqual(clippedRight.width, 120); // 1920 - 1800
    assert.strictEqual(clippedRight.height, 300);

    // Window hanging off the top-left edge: x: -100, y: -50
    const clippedTopLeft = probe.clipRegion({ x: -100, y: -50, width: 300, height: 200 }, screenWidth, screenHeight);
    assert.strictEqual(clippedTopLeft.wasClipped, true);
    assert.strictEqual(clippedTopLeft.x, 0);
    assert.strictEqual(clippedTopLeft.y, 0);
    assert.strictEqual(clippedTopLeft.width, 200);
    assert.strictEqual(clippedTopLeft.height, 150);
  });

  it('5. should reject all-black or empty frames as invalid capture streams rather than falsely asserting invisibility', () => {
    const width = 10;
    const height = 10;
    const allBlackBuffer = Buffer.alloc(width * height * 4, 0); // all zeros

    const result = probe.scanFrameBuffer(allBlackBuffer, width, height);
    assert.strictEqual(result.isAllBlack, true);
    // Crucial: Must NOT report isInvisible=true if the frame is completely black (display off / capture failed)
    assert.strictEqual(result.isInvisible, false);

    // Now test a valid desktop frame (desktop wallpaper with various non-black colors, no target magenta)
    const validDesktopBuffer = Buffer.alloc(width * height * 4);
    for (let i = 0; i < validDesktopBuffer.length; i += 4) {
      validDesktopBuffer[i] = 40;     // R
      validDesktopBuffer[i + 1] = 60; // G
      validDesktopBuffer[i + 2] = 80; // B
      validDesktopBuffer[i + 3] = 255;// A
    }
    const validResult = probe.scanFrameBuffer(validDesktopBuffer, width, height);
    assert.strictEqual(validResult.isAllBlack, false);
    assert.strictEqual(validResult.targetPixelCount, 0);
    assert.strictEqual(validResult.isInvisible, true); // Correctly confirmed invisible!
  });
});
