import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Window Geometry and Display Metrics Validator.
 * Corresponds to PROJECT.md Feature 7 (Tauri 2 Multi-Window Setup: Launcher & Transparent HUD Prompter).
 * Handles:
 * - Minimum and maximum window dimensions
 * - Virtual screen boundary calculations across multi-monitor setups
 * - Off-screen coordinate clamping
 * - Negative dimension rejection
 */
export class DisplayMetricsValidator {
  constructor(monitors = []) {
    // Default virtual desktop setup: primary 1920x1080 (DPI 1.0), secondary 2560x1440 (DPI 1.25) at x: 1920, y: 0
    this.monitors = monitors.length > 0 ? monitors : [
      { id: 'mon-1', x: 0, y: 0, width: 1920, height: 1080, scaleFactor: 1.0 },
      { id: 'mon-2', x: 1920, y: 0, width: 2560, height: 1440, scaleFactor: 1.25 }
    ];
    this.minWindowSize = { width: 200, height: 100 };
  }

  getVirtualDesktopBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const m of this.monitors) {
      if (m.x < minX) minX = m.x;
      if (m.y < minY) minY = m.y;
      if (m.x + m.width > maxX) maxX = m.x + m.width;
      if (m.y + m.height > maxY) maxY = m.y + m.height;
    }
    return { minX, minY, maxX, maxY, totalWidth: maxX - minX, totalHeight: maxY - minY };
  }

  validateWindowDimensions(width, height) {
    if (typeof width !== 'number' || typeof height !== 'number') {
      return { valid: false, error: 'Dimensions must be numeric values.' };
    }
    if (width < 0 || height < 0) {
      return { valid: false, error: `Negative dimensions are invalid: ${width}x${height}.` };
    }
    if (width === 0 || height === 0) {
      return { valid: false, error: `Zero-size window is invalid: ${width}x${height}. Window must be at least ${this.minWindowSize.width}x${this.minWindowSize.height}.` };
    }
    if (width < this.minWindowSize.width || height < this.minWindowSize.height) {
      return {
        valid: true,
        clamped: true,
        width: Math.max(width, this.minWindowSize.width),
        height: Math.max(height, this.minWindowSize.height)
      };
    }
    return { valid: true, clamped: false, width, height };
  }

  clampCoordinatesToVirtualDesktop(x, y, width, height) {
    const vBounds = this.getVirtualDesktopBounds();
    let clampedX = x;
    let clampedY = y;

    // Window must have at least 50px visible on a screen
    const minVisible = 50;
    if (clampedX + width < vBounds.minX + minVisible) {
      clampedX = vBounds.minX;
    } else if (clampedX > vBounds.maxX - minVisible) {
      clampedX = vBounds.maxX - width;
    }

    if (clampedY + height < vBounds.minY + minVisible) {
      clampedY = vBounds.minY;
    } else if (clampedY > vBounds.maxY - minVisible) {
      clampedY = vBounds.maxY - height;
    }

    const wasClamped = clampedX !== x || clampedY !== y;
    return { x: clampedX, y: clampedY, wasClamped };
  }

  getDpiScaleForWindow(x, y) {
    // Find monitor containing the top-left coordinate
    for (const m of this.monitors) {
      if (x >= m.x && x < m.x + m.width && y >= m.y && y < m.y + m.height) {
        return m.scaleFactor;
      }
    }
    // Fallback to primary monitor scale
    return this.monitors[0]?.scaleFactor || 1.0;
  }
}

describe('B07: Tauri Display Metrics & Geometry Boundary Cases', () => {
  const validator = new DisplayMetricsValidator();

  it('1. should reject 0-size window dimensions and enforce minimum HUD overlay bounds', () => {
    const zeroWidth = validator.validateWindowDimensions(0, 600);
    assert.strictEqual(zeroWidth.valid, false);
    assert.match(zeroWidth.error, /Zero-size window/i);

    const zeroHeight = validator.validateWindowDimensions(800, 0);
    assert.strictEqual(zeroHeight.valid, false);
    assert.match(zeroHeight.error, /Zero-size window/i);

    // Sub-minimum bounds clamped
    const tiny = validator.validateWindowDimensions(50, 50);
    assert.strictEqual(tiny.valid, true);
    assert.strictEqual(tiny.clamped, true);
    assert.strictEqual(tiny.width, 200);
    assert.strictEqual(tiny.height, 100);
  });

  it('2. should reject negative window dimensions in geometry validation', () => {
    const negativeDim1 = validator.validateWindowDimensions(-800, 600);
    assert.strictEqual(negativeDim1.valid, false);
    assert.match(negativeDim1.error, /Negative dimensions/i);

    const negativeDim2 = validator.validateWindowDimensions(800, -600);
    assert.strictEqual(negativeDim2.valid, false);
    assert.match(negativeDim2.error, /Negative dimensions/i);
  });

  it('3. should clamp extreme off-screen coordinates into virtual desktop boundaries', () => {
    const windowSize = { width: 800, height: 600 };

    // Far negative coordinate (e.g. -999999)
    const farNegative = validator.clampCoordinatesToVirtualDesktop(-999999, -999999, windowSize.width, windowSize.height);
    assert.strictEqual(farNegative.wasClamped, true);
    assert.strictEqual(farNegative.x, 0);
    assert.strictEqual(farNegative.y, 0);

    // Far positive coordinate (e.g. 999999)
    const farPositive = validator.clampCoordinatesToVirtualDesktop(999999, 999999, windowSize.width, windowSize.height);
    assert.strictEqual(farPositive.wasClamped, true);
    const bounds = validator.getVirtualDesktopBounds();
    assert.strictEqual(farPositive.x, bounds.maxX - windowSize.width);
    assert.strictEqual(farPositive.y, bounds.maxY - windowSize.height);
  });

  it('4. should calculate correct per-monitor DPI scaling across multi-monitor virtual screen boundary', () => {
    // Coordinate on Monitor 1 (0 to 1920)
    const dpiMon1 = validator.getDpiScaleForWindow(500, 300);
    assert.strictEqual(dpiMon1, 1.0);

    // Coordinate on Monitor 2 (1920 to 4480)
    const dpiMon2 = validator.getDpiScaleForWindow(2200, 400);
    assert.strictEqual(dpiMon2, 1.25);

    // Virtual boundary point (x: 1920 exactly)
    const dpiBoundary = validator.getDpiScaleForWindow(1920, 0);
    assert.strictEqual(dpiBoundary, 1.25);
  });

  it('5. should enforce frameless transparent HUD mode restrictions against invalid window state transitions', () => {
    // Prompter window specification in tauri.conf.json requires:
    // { transparent: true, decorations: false, alwaysOnTop: true, skipTaskbar: true }
    const prompterWindowConfig = {
      label: 'prompter',
      transparent: true,
      decorations: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: true
    };

    // Validating state transitions
    function validateWindowStateTransition(currentConfig, targetState) {
      if (targetState === 'fullscreen') {
        // Transparent overlay HUD cannot enter exclusive fullscreen because it would occlude desktop glass
        return { allowed: false, reason: 'HUD overlay is locked to floating transparent glass.' };
      }
      if (targetState === 'minimized') {
        // Prompter is hidden via visibility toggle, not minimized to taskbar
        return { allowed: false, reason: 'Prompter window has skipTaskbar=true; use hide/show instead.' };
      }
      return { allowed: true };
    }

    const fsResult = validateWindowStateTransition(prompterWindowConfig, 'fullscreen');
    assert.strictEqual(fsResult.allowed, false);
    assert.match(fsResult.reason, /HUD overlay is locked/i);

    const minResult = validateWindowStateTransition(prompterWindowConfig, 'minimized');
    assert.strictEqual(minResult.allowed, false);
    assert.match(minResult.reason, /skipTaskbar/i);
  });
});
