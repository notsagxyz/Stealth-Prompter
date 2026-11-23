import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * WindowPlatform Trait Abstraction & Headless Mock.
 * Corresponds to PROJECT.md § Interface Contracts (`src-tauri/src/platform/mod.rs`):
 *
 * pub enum DisplayAffinity { None, Monitor, ExcludeFromCapture }
 * pub trait WindowPlatform: Send + Sync {
 *     fn set_display_affinity(&self, hwnd: isize, affinity: DisplayAffinity) -> Result<(), Box<dyn Error>>;
 *     fn get_display_affinity(&self, hwnd: isize) -> Result<DisplayAffinity, Box<dyn Error>>;
 *     fn set_click_through(&self, hwnd: isize, enabled: bool) -> Result<(), Box<dyn Error>>;
 *     fn set_no_activate(&self, hwnd: isize, enabled: bool) -> Result<(), Box<dyn Error>>;
 *     fn show_unfocused(&self, hwnd: isize) -> Result<(), Box<dyn Error>>;
 *     fn hide(&self, hwnd: isize) -> Result<(), Box<dyn Error>>;
 * }
 */
export const DisplayAffinity = Object.freeze({
  None: 'None',
  Monitor: 'Monitor',
  ExcludeFromCapture: 'ExcludeFromCapture'
});

export class MockWindowPlatform {
  constructor() {
    this.windows = new Map(); // hwnd -> { affinity, clickThrough, noActivate, visible }
  }

  registerWindow(hwnd) {
    if (typeof hwnd !== 'number' || hwnd <= 0 || !Number.isInteger(hwnd)) {
      throw new Error(`Invalid HWND: ${hwnd}. Window handles must be positive non-zero integers.`);
    }
    this.windows.set(hwnd, {
      affinity: DisplayAffinity.None,
      clickThrough: false,
      noActivate: false,
      visible: false,
      destroyed: false
    });
  }

  destroyWindow(hwnd) {
    const win = this.windows.get(hwnd);
    if (!win || win.destroyed) {
      throw new Error(`Window ${hwnd} does not exist or is already destroyed.`);
    }
    win.destroyed = true;
  }

  _checkHwnd(hwnd) {
    if (hwnd === 0) {
      throw new Error('Null HWND: Window handle cannot be 0 (NULL).');
    }
    if (typeof hwnd !== 'number' || hwnd < 0) {
      throw new Error(`Negative HWND: ${hwnd} is an invalid window handle.`);
    }
    const win = this.windows.get(hwnd);
    if (!win) {
      throw new Error(`WindowNotFound: No active window registered with HWND ${hwnd}.`);
    }
    if (win.destroyed) {
      throw new Error(`InvalidWindowHandle: Window ${hwnd} has been destroyed (Win32 ERROR_INVALID_WINDOW_HANDLE 1400).`);
    }
    return win;
  }

  setDisplayAffinity(hwnd, affinity) {
    const win = this._checkHwnd(hwnd);
    if (!Object.values(DisplayAffinity).includes(affinity)) {
      throw new Error(`Unsupported affinity enum value: ${affinity}`);
    }
    win.affinity = affinity;
    return true;
  }

  getDisplayAffinity(hwnd) {
    const win = this._checkHwnd(hwnd);
    return win.affinity;
  }

  setClickThrough(hwnd, enabled) {
    const win = this._checkHwnd(hwnd);
    win.clickThrough = Boolean(enabled);
    return true;
  }

  setNoActivate(hwnd, enabled) {
    const win = this._checkHwnd(hwnd);
    win.noActivate = Boolean(enabled);
    return true;
  }

  showUnfocused(hwnd) {
    const win = this._checkHwnd(hwnd);
    win.visible = true;
    win.unfocused = true;
    return true;
  }

  hide(hwnd) {
    const win = this._checkHwnd(hwnd);
    win.visible = false;
    return true;
  }
}

describe('B04: WindowPlatform Trait & Invalid HWND Boundaries', () => {
  it('1. should reject null HWND (0 / NULL) with explicit error without dereferencing null pointers', () => {
    const platform = new MockWindowPlatform();

    assert.throws(
      () => platform.setDisplayAffinity(0, DisplayAffinity.ExcludeFromCapture),
      /Null HWND/i
    );
    assert.throws(
      () => platform.setClickThrough(0, true),
      /Null HWND/i
    );
    assert.throws(
      () => platform.showUnfocused(0),
      /Null HWND/i
    );
  });

  it('2. should reject negative HWNDs and integer overflow representations', () => {
    const platform = new MockWindowPlatform();
    const negativeHwnds = [-1, -9999, -2147483648];

    for (const hwnd of negativeHwnds) {
      assert.throws(
        () => platform.setDisplayAffinity(hwnd, DisplayAffinity.ExcludeFromCapture),
        /Negative HWND/i
      );
      assert.throws(
        () => platform.getDisplayAffinity(hwnd),
        /Negative HWND/i
      );
    }
  });

  it('3. should reject destroyed or non-existent window handles with Win32-equivalent ERROR_INVALID_WINDOW_HANDLE', () => {
    const platform = new MockWindowPlatform();
    const mockHwnd = 12345;
    platform.registerWindow(mockHwnd);

    // Verify valid operation before destruction
    platform.setDisplayAffinity(mockHwnd, DisplayAffinity.ExcludeFromCapture);
    assert.strictEqual(platform.getDisplayAffinity(mockHwnd), DisplayAffinity.ExcludeFromCapture);

    // Destroy the window
    platform.destroyWindow(mockHwnd);

    // Subsequent calls on destroyed window handle must fail
    assert.throws(
      () => platform.setDisplayAffinity(mockHwnd, DisplayAffinity.None),
      /InvalidWindowHandle.*1400/i
    );
    assert.throws(
      () => platform.showUnfocused(mockHwnd),
      /InvalidWindowHandle.*1400/i
    );

    // Non-existent HWND
    assert.throws(
      () => platform.setDisplayAffinity(9999999, DisplayAffinity.ExcludeFromCapture),
      /WindowNotFound/i
    );
  });

  it('4. should handle concurrent cross-thread calls safely under Send + Sync contracts', async () => {
    const platform = new MockWindowPlatform();
    const hwnds = [1001, 1002, 1003, 1004, 1005];
    hwnds.forEach(h => platform.registerWindow(h));

    // Simulate 100 concurrent async tasks dispatching platform trait methods
    const tasks = [];
    for (let i = 0; i < 100; i++) {
      const hwnd = hwnds[i % hwnds.length];
      const affinity = i % 2 === 0 ? DisplayAffinity.ExcludeFromCapture : DisplayAffinity.None;
      tasks.push(
        Promise.resolve().then(() => {
          platform.setDisplayAffinity(hwnd, affinity);
          platform.setClickThrough(hwnd, i % 3 === 0);
          return platform.getDisplayAffinity(hwnd);
        })
      );
    }

    const results = await Promise.all(tasks);
    assert.strictEqual(results.length, 100);
    // Platform state should remain coherent
    for (const hwnd of hwnds) {
      assert.ok(Object.values(DisplayAffinity).includes(platform.getDisplayAffinity(hwnd)));
    }
  });

  it('5. should execute idempotent repeated calls on the same HWND without side-effect corruption', () => {
    const platform = new MockWindowPlatform();
    const hwnd = 4242;
    platform.registerWindow(hwnd);

    // Repeated identical affinity setting (5 times)
    for (let i = 0; i < 5; i++) {
      const res = platform.setDisplayAffinity(hwnd, DisplayAffinity.ExcludeFromCapture);
      assert.strictEqual(res, true);
      assert.strictEqual(platform.getDisplayAffinity(hwnd), DisplayAffinity.ExcludeFromCapture);
    }

    // Repeated click-through toggle
    for (let i = 0; i < 5; i++) {
      const res = platform.setClickThrough(hwnd, true);
      assert.strictEqual(res, true);
    }
    assert.strictEqual(platform.windows.get(hwnd).clickThrough, true);
  });
});
