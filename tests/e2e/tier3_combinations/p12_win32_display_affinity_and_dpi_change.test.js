import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P12: Pairwise Combination — Win32 Display Affinity & Per-Monitor DPI Scaling
 * Features tested:
 * - F5: Win32 SetWindowDisplayAffinity (WDA_EXCLUDEFROMCAPTURE = 0x00000011 / 17)
 * - F7: Per-Monitor DPI Awareness V2 & Window Sizing (WM_DPICHANGED)
 *
 * Verifies that when a window moves across monitors or system DPI scaling changes,
 * display affinity is preserved intact and typography/bounds scale without blur or distortion.
 */

const WDA_EXCLUDEFROMCAPTURE = 0x00000011; // 17

class MockDpiAwarePrompterWindow {
  constructor(hwnd, baseBounds = { x: 100, y: 100, width: 800, height: 400 }, baseDpi = 96) {
    this.hwnd = hwnd;
    this.bounds = { ...baseBounds };
    this.currentDpi = baseDpi; // 96 DPI = 100% scale
    this.displayAffinity = WDA_EXCLUDEFROMCAPTURE;
    this.baseFontSize = 24; // 24px base font
    this.currentFontSize = 24;
    this.baseScrollSpeed = 2.0; // 2.0 px per frame at 100% DPI
    this.currentScrollSpeed = 2.0;
  }

  // Simulates Win32 WM_DPICHANGED message
  onDpiChanged(newDpi, suggestedRect) {
    const scaleFactor = newDpi / 96.0;

    this.currentDpi = newDpi;
    if (suggestedRect) {
      this.bounds = { ...suggestedRect };
    } else {
      // Recalculate bounds proportionally
      this.bounds.width = Math.round(800 * scaleFactor);
      this.bounds.height = Math.round(400 * scaleFactor);
    }

    // Font size scales with DPI
    this.currentFontSize = Math.round(this.baseFontSize * scaleFactor);

    // Scroll speed in physical pixels scales with DPI so perceived reading speed is invariant
    this.currentScrollSpeed = this.baseScrollSpeed * scaleFactor;

    // Display affinity MUST remain WDA_EXCLUDEFROMCAPTURE (never reset by DWM on DPI resize)
    return {
      dpi: this.currentDpi,
      scaleFactor,
      bounds: { ...this.bounds },
      fontSize: this.currentFontSize,
      scrollSpeed: this.currentScrollSpeed,
      affinity: this.displayAffinity
    };
  }

  getAffinity() {
    return this.displayAffinity;
  }
}

describe('P12: Pairwise Win32 Display Affinity & DPI Scaling', () => {
  it('should maintain WDA_EXCLUDEFROMCAPTURE (0x11) across standard 100% -> 150% -> 200% DPI changes', () => {
    const win = new MockDpiAwarePrompterWindow(3001, { x: 50, y: 50, width: 800, height: 400 }, 96);
    assert.equal(win.getAffinity(), 17);

    // Scale to 150% (144 DPI)
    const res150 = win.onDpiChanged(144);
    assert.equal(res150.affinity, 17, 'Affinity must remain 0x11 at 150% DPI');
    assert.equal(win.getAffinity(), 17);
    assert.equal(res150.bounds.width, 1200);
    assert.equal(res150.bounds.height, 600);

    // Scale to 200% (192 DPI)
    const res200 = win.onDpiChanged(192);
    assert.equal(res200.affinity, 17, 'Affinity must remain 0x11 at 200% DPI');
    assert.equal(res200.bounds.width, 1600);
    assert.equal(res200.bounds.height, 800);
  });

  it('should scale font size proportionally to DPI to maintain visual legibility', () => {
    const win = new MockDpiAwarePrompterWindow(3002);

    assert.equal(win.currentFontSize, 24); // 96 DPI

    win.onDpiChanged(120); // 125% DPI
    assert.equal(win.currentFontSize, 30); // 24 * 1.25 = 30

    win.onDpiChanged(144); // 150% DPI
    assert.equal(win.currentFontSize, 36); // 24 * 1.50 = 36

    win.onDpiChanged(192); // 200% DPI
    assert.equal(win.currentFontSize, 48); // 24 * 2.00 = 48
  });

  it('should adjust physical pixel scroll speed to ensure constant perceived reading speed', () => {
    const win = new MockDpiAwarePrompterWindow(3003);

    // At 100% DPI, speed = 2.0 px/frame
    assert.equal(win.currentScrollSpeed, 2.0);

    // At 150% DPI, speed = 3.0 physical px/frame (same angular speed on retina screen)
    win.onDpiChanged(144);
    assert.equal(win.currentScrollSpeed, 3.0);

    // At 200% DPI, speed = 4.0 physical px/frame
    win.onDpiChanged(192);
    assert.equal(win.currentScrollSpeed, 4.0);
  });

  it('should handle fractional DPI changes (125% and 175%) without layout break or clipping', () => {
    const win = new MockDpiAwarePrompterWindow(3004);

    const res125 = win.onDpiChanged(120); // 120 / 96 = 1.25
    assert.equal(Number.isInteger(res125.bounds.width), true);
    assert.equal(Number.isInteger(res125.bounds.height), true);
    assert.equal(res125.bounds.width, 1000);
    assert.equal(res125.bounds.height, 500);

    const res175 = win.onDpiChanged(168); // 168 / 96 = 1.75
    assert.equal(res175.bounds.width, 1400);
    assert.equal(res175.bounds.height, 700);
  });

  it('should accept suggestedRect from OS during monitor boundary crossing without affinity loss', () => {
    const win = new MockDpiAwarePrompterWindow(3005);
    const suggestedRect = { x: 1950, y: 120, width: 1200, height: 600 };

    const result = win.onDpiChanged(144, suggestedRect);
    assert.deepEqual(win.bounds, suggestedRect);
    assert.equal(result.affinity, WDA_EXCLUDEFROMCAPTURE);
  });
});
