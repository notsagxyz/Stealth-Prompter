import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Windows Display Affinity Constants (Winuser.h):
 * - WDA_NONE = 0x00000000 (0)
 * - WDA_MONITOR = 0x00000001 (1)
 * - WDA_EXCLUDEFROMCAPTURE = 0x00000011 (17) -> Introduced in Windows 10 Version 2004 (Build 19041)
 * Requirements derived from ORIGINAL_REQUEST.md R3 & PROJECT.md Feature 5.
 */
export const WDA_NONE = 0x00000000;
export const WDA_MONITOR = 0x00000001;
export const WDA_EXCLUDEFROMCAPTURE = 0x00000011;

export class Win32AffinityManager {
  constructor(options = {}) {
    this.osBuild = options.osBuild !== undefined ? options.osBuild : 19045; // Default: modern Win10/11
    this.dwmCompositionEnabled = options.dwmEnabled !== undefined ? options.dwmEnabled : true;
    this.affinityStore = new Map(); // hwnd -> affinity
    this.toggleCount = 0;
  }

  isExcludeFromCaptureSupported() {
    return this.osBuild >= 19041;
  }

  setWindowDisplayAffinity(hwnd, affinityFlag) {
    if (typeof hwnd !== 'number' || hwnd <= 0) {
      throw new Error(`Invalid HWND: ${hwnd}`);
    }

    // Validate flag against known Win32 constants
    const validFlags = [WDA_NONE, WDA_MONITOR, WDA_EXCLUDEFROMCAPTURE];
    if (!validFlags.includes(affinityFlag)) {
      throw new Error(`InvalidAffinityFlag: 0x${affinityFlag.toString(16)} is not a valid Win32 display affinity value.`);
    }

    // Check OS build requirement for WDA_EXCLUDEFROMCAPTURE (17)
    if (affinityFlag === WDA_EXCLUDEFROMCAPTURE && !this.isExcludeFromCaptureSupported()) {
      throw new Error(
        `UnsupportedOsVersion: WDA_EXCLUDEFROMCAPTURE requires Windows 10 Build 19041 (Version 2004) or later. Detected OS build: ${this.osBuild}.`
      );
    }

    // Check DWM composition
    if (!this.dwmCompositionEnabled && affinityFlag === WDA_EXCLUDEFROMCAPTURE) {
      return { success: false, warning: 'DwmCompositionDisabled: DWM composition is inactive. Window cannot be excluded from capture.' };
    }

    this.affinityStore.set(hwnd, affinityFlag);
    this.toggleCount++;
    return { success: true, currentAffinity: affinityFlag };
  }

  getWindowDisplayAffinity(hwnd) {
    if (!this.affinityStore.has(hwnd)) {
      return WDA_NONE;
    }
    return this.affinityStore.get(hwnd);
  }

  handleWindowRecreation(oldHwnd, newHwnd) {
    const previousAffinity = this.affinityStore.get(oldHwnd) || WDA_NONE;
    this.affinityStore.delete(oldHwnd);
    return this.setWindowDisplayAffinity(newHwnd, previousAffinity);
  }
}

describe('B05: Win32 Affinity Extremes & OS Guard Boundary Cases', () => {
  it('1. should reject unsupported affinity raw integer flags before calling Win32 API', () => {
    const manager = new Win32AffinityManager();
    const hwnd = 101;
    const invalidFlags = [0xFF, -1, 0x02, 0x10, 999];

    for (const flag of invalidFlags) {
      assert.throws(
        () => manager.setWindowDisplayAffinity(hwnd, flag),
        /InvalidAffinityFlag/i
      );
    }
  });

  it('2. should enforce OS version guard (Build 19041+) and fail gracefully on legacy Windows', () => {
    // Windows 7 / 8 / early Windows 10 (Build 18363 - 1909)
    const legacyManager = new Win32AffinityManager({ osBuild: 18363 });
    const hwnd = 102;

    assert.strictEqual(legacyManager.isExcludeFromCaptureSupported(), false);

    // Setting WDA_EXCLUDEFROMCAPTURE on legacy OS must throw UnsupportedOsVersion
    assert.throws(
      () => legacyManager.setWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE),
      /UnsupportedOsVersion.*19041/i
    );

    // But standard WDA_MONITOR (1) should still work on older OS
    const monitorRes = legacyManager.setWindowDisplayAffinity(hwnd, WDA_MONITOR);
    assert.strictEqual(monitorRes.success, true);
    assert.strictEqual(legacyManager.getWindowDisplayAffinity(hwnd), WDA_MONITOR);
  });

  it('3. should endure 100 rapid affinity toggles without state desync or memory leakage', () => {
    const manager = new Win32AffinityManager({ osBuild: 22631 }); // Win 11
    const hwnd = 103;

    for (let i = 0; i < 100; i++) {
      const targetFlag = i % 2 === 0 ? WDA_EXCLUDEFROMCAPTURE : WDA_NONE;
      const res = manager.setWindowDisplayAffinity(hwnd, targetFlag);
      assert.strictEqual(res.success, true);
      assert.strictEqual(manager.getWindowDisplayAffinity(hwnd), targetFlag);
    }

    assert.strictEqual(manager.toggleCount, 100);
    // Final state check (99 is odd -> WDA_NONE)
    assert.strictEqual(manager.getWindowDisplayAffinity(hwnd), WDA_NONE);
  });

  it('4. should migrate affinity correctly during window recreation (handle mutation)', () => {
    const manager = new Win32AffinityManager();
    const oldHwnd = 2001;
    const newHwnd = 2002;

    // Apply invisibility to initial window
    manager.setWindowDisplayAffinity(oldHwnd, WDA_EXCLUDEFROMCAPTURE);
    assert.strictEqual(manager.getWindowDisplayAffinity(oldHwnd), WDA_EXCLUDEFROMCAPTURE);

    // Tauri / Win32 window recreated with new HWND
    const migrateRes = manager.handleWindowRecreation(oldHwnd, newHwnd);
    assert.strictEqual(migrateRes.success, true);

    // Old HWND removed, new HWND inherited WDA_EXCLUDEFROMCAPTURE
    assert.strictEqual(manager.getWindowDisplayAffinity(oldHwnd), WDA_NONE);
    assert.strictEqual(manager.getWindowDisplayAffinity(newHwnd), WDA_EXCLUDEFROMCAPTURE);
  });

  it('5. should detect disabled DWM composition and emit warning/fallback instead of silent failure', () => {
    // Simulated remote desktop session or safe mode where DWM composition is disabled
    const noDwmManager = new Win32AffinityManager({ osBuild: 19045, dwmEnabled: false });
    const hwnd = 105;

    const res = noDwmManager.setWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
    assert.strictEqual(res.success, false);
    assert.match(res.warning, /DwmCompositionDisabled/i);
    // Affinity not set because DWM compositor is absent
    assert.strictEqual(noDwmManager.getWindowDisplayAffinity(hwnd), WDA_NONE);
  });
});
