import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P01: Pairwise Combination — Win32 Display Affinity & Prompter Transparency
 * Features tested:
 * - F5: Win32 SetWindowDisplayAffinity (WDA_EXCLUDEFROMCAPTURE = 0x00000011 / 17)
 * - F9: SolidJS Overlay HUD Prompter (Transparency, Opacity, Vibrancy)
 *
 * Validates that setting display affinity does not compromise or reset transparent/vibrancy
 * window attributes, and changing opacity/transparency maintains capture exclusion.
 */

// Simulated Win32 Window Platform Model adhering to WindowPlatform trait
class MockWin32WindowPlatform {
  constructor() {
    this.windows = new Map();
  }

  createWindow(hwnd, initialStyles = {}) {
    this.windows.set(hwnd, {
      hwnd,
      affinity: 'None', // 'None' | 'Monitor' | 'ExcludeFromCapture'
      affinityCode: 0,
      opacity: initialStyles.opacity ?? 1.0,
      isLayered: initialStyles.isLayered ?? true, // WS_EX_LAYERED
      vibrancy: initialStyles.vibrancy ?? 'None',
      vibrancyColor: null,
      visible: true
    });
    return this.windows.get(hwnd);
  }

  setDisplayAffinity(hwnd, affinity) {
    const win = this.windows.get(hwnd);
    if (!win || hwnd <= 0) {
      throw new Error(`Invalid HWND: ${hwnd}`);
    }
    win.affinity = affinity;
    if (affinity === 'ExcludeFromCapture') {
      win.affinityCode = 0x00000011; // 17 decimal
    } else if (affinity === 'Monitor') {
      win.affinityCode = 0x00000001;
    } else {
      win.affinityCode = 0x00000000;
    }
    // Retain layered window attributes
    return { success: true, affinity: win.affinity, affinityCode: win.affinityCode };
  }

  getDisplayAffinity(hwnd) {
    const win = this.windows.get(hwnd);
    if (!win || hwnd <= 0) {
      throw new Error(`Invalid HWND: ${hwnd}`);
    }
    return win.affinity;
  }

  setOpacity(hwnd, opacity) {
    const win = this.windows.get(hwnd);
    if (!win || hwnd <= 0) {
      throw new Error(`Invalid HWND: ${hwnd}`);
    }
    const clamped = Math.max(0.0, Math.min(1.0, opacity));
    win.opacity = clamped;
    // Opacity change must NOT reset display affinity
    return { success: true, opacity: win.opacity, affinity: win.affinity };
  }

  applyVibrancy(hwnd, effect, color = null) {
    const win = this.windows.get(hwnd);
    if (!win || hwnd <= 0) {
      throw new Error(`Invalid HWND: ${hwnd}`);
    }
    win.vibrancy = effect;
    win.vibrancyColor = color;
    return { success: true, vibrancy: win.vibrancy, affinity: win.affinity };
  }
}

describe('P01: Pairwise Affinity & Transparency Combinations', () => {
  it('should set ExcludeFromCapture (0x11) on transparent layered window without altering alpha', () => {
    const platform = new MockWin32WindowPlatform();
    const hwnd = 1001;
    platform.createWindow(hwnd, { opacity: 0.85, isLayered: true });

    const result = platform.setDisplayAffinity(hwnd, 'ExcludeFromCapture');
    assert.equal(result.success, true);
    assert.equal(result.affinityCode, 17); // 0x11

    const win = platform.windows.get(hwnd);
    assert.equal(win.opacity, 0.85, 'Window alpha opacity must be preserved');
    assert.equal(win.isLayered, true, 'WS_EX_LAYERED must remain set');
    assert.equal(platform.getDisplayAffinity(hwnd), 'ExcludeFromCapture');
  });

  it('should preserve WDA_EXCLUDEFROMCAPTURE when dynamically scrubbing HUD opacity', () => {
    const platform = new MockWin32WindowPlatform();
    const hwnd = 1002;
    platform.createWindow(hwnd, { opacity: 1.0 });
    platform.setDisplayAffinity(hwnd, 'ExcludeFromCapture');

    const testOpacities = [0.90, 0.75, 0.50, 0.25, 0.10, 0.95];
    for (const targetOpacity of testOpacities) {
      const res = platform.setOpacity(hwnd, targetOpacity);
      assert.equal(res.opacity, targetOpacity);
      assert.equal(res.affinity, 'ExcludeFromCapture');
      assert.equal(platform.getDisplayAffinity(hwnd), 'ExcludeFromCapture',
        `Affinity must remain ExcludeFromCapture at opacity ${targetOpacity}`);
    }
  });

  it('should maintain capture exclusion when applying vibrancy effects (Acrylic, Mica, Blur)', () => {
    const platform = new MockWin32WindowPlatform();
    const hwnd = 1003;
    platform.createWindow(hwnd, { opacity: 0.80 });
    platform.setDisplayAffinity(hwnd, 'ExcludeFromCapture');

    // Apply Mica
    let res = platform.applyVibrancy(hwnd, 'Mica');
    assert.equal(res.vibrancy, 'Mica');
    assert.equal(res.affinity, 'ExcludeFromCapture');

    // Apply Acrylic with dark tint
    res = platform.applyVibrancy(hwnd, 'Acrylic', { r: 18, g: 18, b: 24, a: 200 });
    assert.equal(res.vibrancy, 'Acrylic');
    assert.equal(res.affinity, 'ExcludeFromCapture');
    assert.deepEqual(platform.windows.get(hwnd).vibrancyColor, { r: 18, g: 18, b: 24, a: 200 });

    // Apply Blur
    res = platform.applyVibrancy(hwnd, 'Blur');
    assert.equal(res.vibrancy, 'Blur');
    assert.equal(platform.getDisplayAffinity(hwnd), 'ExcludeFromCapture');
  });

  it('should reject invalid HWND calls without mutating opacity or state', () => {
    const platform = new MockWin32WindowPlatform();
    const validHwnd = 1004;
    platform.createWindow(validHwnd, { opacity: 0.70 });
    platform.setDisplayAffinity(validHwnd, 'ExcludeFromCapture');

    assert.throws(() => platform.setDisplayAffinity(0, 'ExcludeFromCapture'), /Invalid HWND: 0/);
    assert.throws(() => platform.setDisplayAffinity(-1, 'ExcludeFromCapture'), /Invalid HWND: -1/);
    assert.throws(() => platform.setOpacity(9999, 0.5), /Invalid HWND: 9999/);

    // Existing valid window untouched
    const win = platform.windows.get(validHwnd);
    assert.equal(win.opacity, 0.70);
    assert.equal(win.affinity, 'ExcludeFromCapture');
  });

  it('should maintain consistent affinity state and alpha during rapid alternating affinity toggles', () => {
    const platform = new MockWin32WindowPlatform();
    const hwnd = 1005;
    platform.createWindow(hwnd, { opacity: 0.65 });

    for (let i = 0; i < 20; i++) {
      const mode = i % 2 === 0 ? 'ExcludeFromCapture' : 'None';
      platform.setDisplayAffinity(hwnd, mode);
      assert.equal(platform.getDisplayAffinity(hwnd), mode);
      assert.equal(platform.windows.get(hwnd).opacity, 0.65, 'Alpha must not drift');
    }
  });
});
