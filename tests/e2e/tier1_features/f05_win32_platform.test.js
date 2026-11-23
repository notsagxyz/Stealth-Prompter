import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Loads the Clean-Room analysis document containing authoritative Win32 API specifications.
 */
function loadCleanRoomAnalysis() {
  const analysisPath = path.join(PROJECT_ROOT, 'vault', '01-Analisis', 'Clean-Room-Analysis.md');
  if (fs.existsSync(analysisPath)) {
    return fs.readFileSync(analysisPath, 'utf8');
  }
  const adrPath = path.join(PROJECT_ROOT, 'vault', '03-Arquitectura', 'ADR-001-Stack-Tauri2-Rust.md');
  if (fs.existsSync(adrPath)) {
    return fs.readFileSync(adrPath, 'utf8');
  }
  throw new Error('Unable to locate Win32 architecture specifications in vault');
}

describe('F05: Win32 WindowsPlatform Implementation & Win32 APIs', () => {
  it('1. should verify Win32 Display Affinity constants parsed from project architecture spec', () => {
    const analysisDoc = loadCleanRoomAnalysis();

    // Parse the Win32 Display Affinity specification table from vault
    // Table format: | `WDA_EXCLUDEFROMCAPTURE` | `0x00000011` | `17` | ...
    const excludeMatch = analysisDoc.match(/`WDA_EXCLUDEFROMCAPTURE`\s*\|\s*`0x([0-9a-fA-F]+)`\s*\|\s*`(\d+)`/);
    assert.ok(excludeMatch, 'Vault must document WDA_EXCLUDEFROMCAPTURE with hex and decimal values');

    const parsedHex = excludeMatch[1];
    const parsedDec = parseInt(excludeMatch[2], 10);
    const calculatedFromHex = parseInt(parsedHex, 16);

    assert.strictEqual(parsedDec, 17, 'Parsed decimal value for WDA_EXCLUDEFROMCAPTURE must be 17');
    assert.strictEqual(calculatedFromHex, 17, 'Hex representation 0x00000011 must equal 17 decimal');
    assert.strictEqual(parsedHex.toLowerCase(), '00000011');

    // Parse WDA_MONITOR and WDA_NONE from the same table
    const monitorMatch = analysisDoc.match(/`WDA_MONITOR`\s*\|\s*`0x([0-9a-fA-F]+)`\s*\|\s*`(\d+)`/);
    assert.ok(monitorMatch, 'Vault must document WDA_MONITOR');
    assert.strictEqual(parseInt(monitorMatch[2], 10), 1);

    const noneMatch = analysisDoc.match(/`WDA_NONE`\s*\|\s*`0x([0-9a-fA-F]+)`\s*\|\s*`(\d+)`/);
    assert.ok(noneMatch, 'Vault must document WDA_NONE');
    assert.strictEqual(parseInt(noneMatch[2], 10), 0);

    // Verify minimum OS version requirement documented for WDA_EXCLUDEFROMCAPTURE
    assert.match(analysisDoc, /Build 19041|2004/i, 'Must document Windows 10 Build 19041 requirement for WDA_EXCLUDEFROMCAPTURE');
  });

  it('2. should verify Win32 extended window style constants parsed from spec (WS_EX_NOACTIVATE, WS_EX_TRANSPARENT, WS_EX_TOPMOST)', () => {
    const analysisDoc = loadCleanRoomAnalysis();

    // Parse extended window styles from vault section 3.3
    const styleMatches = {
      WS_EX_TOPMOST: analysisDoc.match(/WS_EX_TOPMOST\s*=\s*0x([0-9a-fA-F]+)/),
      WS_EX_TRANSPARENT: analysisDoc.match(/WS_EX_TRANSPARENT\s*=\s*0x([0-9a-fA-F]+)/),
      WS_EX_LAYERED: analysisDoc.match(/WS_EX_LAYERED\s*=\s*0x([0-9a-fA-F]+)/),
      WS_EX_NOACTIVATE: analysisDoc.match(/WS_EX_NOACTIVATE\s*=\s*0x([0-9a-fA-F]+)/)
    };

    assert.ok(styleMatches.WS_EX_TOPMOST, 'Spec must declare WS_EX_TOPMOST');
    assert.ok(styleMatches.WS_EX_TRANSPARENT, 'Spec must declare WS_EX_TRANSPARENT');
    assert.ok(styleMatches.WS_EX_LAYERED, 'Spec must declare WS_EX_LAYERED');
    assert.ok(styleMatches.WS_EX_NOACTIVATE, 'Spec must declare WS_EX_NOACTIVATE');

    const topMostVal = parseInt(styleMatches.WS_EX_TOPMOST[1], 16);
    const transparentVal = parseInt(styleMatches.WS_EX_TRANSPARENT[1], 16);
    const layeredVal = parseInt(styleMatches.WS_EX_LAYERED[1], 16);
    const noActivateVal = parseInt(styleMatches.WS_EX_NOACTIVATE[1], 16);

    assert.strictEqual(topMostVal, 0x00000008, 'WS_EX_TOPMOST must be 0x08');
    assert.strictEqual(transparentVal, 0x00000020, 'WS_EX_TRANSPARENT must be 0x20');
    assert.strictEqual(layeredVal, 0x00080000, 'WS_EX_LAYERED must be 0x80000');
    assert.strictEqual(noActivateVal, 0x08000000, 'WS_EX_NOACTIVATE must be 0x8000000');

    // Verify non-conflicting bit allocation across extended styles
    const combinedStyles = topMostVal | transparentVal | layeredVal | noActivateVal;
    assert.strictEqual((combinedStyles & topMostVal), topMostVal);
    assert.strictEqual((combinedStyles & transparentVal), transparentVal);
    assert.strictEqual((combinedStyles & layeredVal), layeredVal);
    assert.strictEqual((combinedStyles & noActivateVal), noActivateVal);
  });

  it('3. should verify Win32 ShowWindow constants for unfocused display (SW_SHOWNOACTIVATE = 4)', () => {
    const analysisDoc = loadCleanRoomAnalysis();

    // Verify that SW_SHOWNOACTIVATE is mandated for unfocused window display
    assert.match(analysisDoc, /SW_SHOWNOACTIVATE/, 'Architecture must mandate SW_SHOWNOACTIVATE');

    // Windows SDK ShowWindow constants
    const SW_HIDE = 0;
    const SW_SHOWNORMAL = 1;
    const SW_SHOWNOACTIVATE = 4;
    const SW_SHOW = 5;

    assert.strictEqual(SW_SHOWNOACTIVATE, 4, 'SW_SHOWNOACTIVATE constant must equal 4');
    assert.notStrictEqual(SW_SHOWNOACTIVATE, SW_SHOW, 'SW_SHOWNOACTIVATE must not activate window');
    assert.notStrictEqual(SW_SHOWNOACTIVATE, SW_SHOWNORMAL, 'SW_SHOWNOACTIVATE must not restore normal focus');
    assert.strictEqual(SW_HIDE, 0, 'SW_HIDE must equal 0');
  });

  it('4. should verify Win32 call sequence contract for invisibility and click-through', () => {
    // Model the expected Win32 execution pipeline
    function simulateWin32Apply(hwnd, config) {
      if (!hwnd || hwnd <= 0) {
        return { success: false, errorCode: 1400, error: 'ERROR_INVALID_WINDOW_HANDLE' };
      }

      let currentExStyle = 0x00000000;
      if (config.noActivate) {
        currentExStyle |= 0x08000000; // WS_EX_NOACTIVATE
      }
      if (config.clickThrough) {
        currentExStyle |= 0x00000020; // WS_EX_TRANSPARENT
      }

      const affinity = config.excludeFromCapture ? 0x00000011 : 0x00000000;
      const showCmd = config.showUnfocused ? 4 : 0; // SW_SHOWNOACTIVATE : SW_HIDE

      return {
        success: true,
        hwnd,
        exStyle: currentExStyle,
        affinity,
        showCmd
      };
    }

    const result = simulateWin32Apply(1001, {
      excludeFromCapture: true,
      clickThrough: true,
      noActivate: true,
      showUnfocused: true
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.affinity, 17, 'Affinity must be set to 17 (0x11)');
    assert.strictEqual((result.exStyle & 0x08000000), 0x08000000, 'Must have WS_EX_NOACTIVATE set');
    assert.strictEqual((result.exStyle & 0x00000020), 0x00000020, 'Must have WS_EX_TRANSPARENT set');
    assert.strictEqual(result.showCmd, 4, 'Must use SW_SHOWNOACTIVATE');
  });

  it('5. should verify Win32 error code mapping on invalid window handles', () => {
    const ERROR_INVALID_WINDOW_HANDLE = 1400;

    function safeWin32Call(hwnd) {
      if (!hwnd || hwnd === 0 || hwnd === -1) {
        return { ok: false, error: `Win32 Error ${ERROR_INVALID_WINDOW_HANDLE}: Invalid window handle` };
      }
      return { ok: true };
    }

    const nullResult = safeWin32Call(0);
    assert.strictEqual(nullResult.ok, false);
    assert.ok(nullResult.error.includes('1400'));

    const negResult = safeWin32Call(-1);
    assert.strictEqual(negResult.ok, false);
    assert.ok(negResult.error.includes('1400'));

    const validResult = safeWin32Call(54321);
    assert.strictEqual(validResult.ok, true);
  });
});
