import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * OBS Studio & Screen Capture Integration Validator.
 * Corresponds to PROJECT.md Feature 12 (OBS & Video Calling Verification Guide).
 * Handles:
 * - OBS installation detection across common Windows paths
 * - Scene collection JSON schema parsing and error recovery
 * - Virtual camera device availability checks
 * - Stream health monitoring (zero FPS / frame freeze detection)
 * - Window title matching resilience
 */
export class ObsVerificationValidator {
  constructor(options = {}) {
    this.installedPaths = options.installedPaths || [];
    this.virtualCameraBusy = options.virtualCameraBusy || false;
  }

  detectObsInstallation(candidatePaths) {
    const pathsToCheck = candidatePaths || [
      'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe',
      'C:\\Program Files (x86)\\obs-studio\\bin\\32bit\\obs32.exe'
    ];

    for (const p of pathsToCheck) {
      if (this.installedPaths.includes(p)) {
        return { installed: true, executablePath: p };
      }
    }
    return {
      installed: false,
      guidance: 'OBS Studio is not installed in standard directories. Please install OBS Studio 30+ or specify OBS_PATH environment variable.'
    };
  }

  validateSceneCollectionJson(rawJson) {
    if (!rawJson || rawJson.trim().length === 0) {
      return { valid: false, error: 'Empty OBS scene configuration file.' };
    }

    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      return { valid: false, error: `Malformed OBS scene JSON: ${e.message}` };
    }

    if (!parsed.sources || !Array.isArray(parsed.sources)) {
      return { valid: false, error: 'Invalid OBS scene collection schema: missing "sources" array.' };
    }

    const captureSources = parsed.sources.filter(s =>
      s.id === 'window_capture' || s.id === 'monitor_capture' || s.id === 'game_capture'
    );

    return {
      valid: true,
      captureSourceCount: captureSources.length,
      sceneName: parsed.name || 'Untitled'
    };
  }

  checkVirtualCameraDevice() {
    if (this.virtualCameraBusy) {
      return {
        available: false,
        error: 'DeviceBusy: OBS Virtual Camera is currently locked or in use by another video conference process (Zoom/Teams).'
      };
    }
    return { available: true, deviceName: 'OBS Virtual Camera' };
  }

  detectFrozenStream(frames, fpsThreshold = 1.0) {
    if (!frames || frames.length < 2) {
      return { healthy: false, error: 'Insufficient frames to analyze stream health.' };
    }

    let identicalCount = 0;
    for (let i = 1; i < frames.length; i++) {
      if (frames[i].hash === frames[i - 1].hash) {
        identicalCount++;
      }
    }

    const freezeRatio = identicalCount / (frames.length - 1);
    if (freezeRatio >= 0.95) {
      return {
        healthy: false,
        isFrozen: true,
        freezeRatio,
        error: `StreamCaptureStalled: Capture output is frozen at 0 FPS across ${frames.length} consecutive sample frames.`
      };
    }

    return { healthy: true, isFrozen: false, freezeRatio };
  }

  matchWindowTitle(targetPattern, currentWindowTitle) {
    // E.g. target: "Teleprompter HUD", window title might be "Teleprompter HUD - Script 1 [Playing]"
    if (!currentWindowTitle || typeof currentWindowTitle !== 'string') {
      return false;
    }
    const regex = new RegExp(targetPattern, 'i');
    return regex.test(currentWindowTitle);
  }
}

describe('B12: OBS Studio Verification & Configuration Boundary Cases', () => {
  it('1. should detect missing OBS installation and emit actionable guidance without crashing', () => {
    // Empty candidate list simulating environment where OBS is not yet installed
    const validator = new ObsVerificationValidator({ installedPaths: [] });
    const result = validator.detectObsInstallation();

    assert.strictEqual(result.installed, false);
    assert.match(result.guidance, /OBS Studio is not installed/i);
    assert.match(result.guidance, /OBS_PATH/i);
  });

  it('2. should handle corrupted or truncated OBS scene JSON configuration with clear validation error', () => {
    const validator = new ObsVerificationValidator();

    // Corrupted syntax
    const corruptedJson = '{"name": "Teleprompter Verification", "sources": [ { "id": "window_capture"';
    const syntaxRes = validator.validateSceneCollectionJson(corruptedJson);
    assert.strictEqual(syntaxRes.valid, false);
    assert.match(syntaxRes.error, /Malformed OBS scene JSON/i);

    // Schema missing sources array
    const invalidSchemaJson = JSON.stringify({ name: 'Empty Scene' });
    const schemaRes = validator.validateSceneCollectionJson(invalidSchemaJson);
    assert.strictEqual(schemaRes.valid, false);
    assert.match(schemaRes.error, /missing "sources" array/i);
  });

  it('3. should detect virtual camera device lock and return busy status gracefully', () => {
    const busyValidator = new ObsVerificationValidator({ virtualCameraBusy: true });
    const busyRes = busyValidator.checkVirtualCameraDevice();
    assert.strictEqual(busyRes.available, false);
    assert.match(busyRes.error, /DeviceBusy.*OBS Virtual Camera/i);

    const readyValidator = new ObsVerificationValidator({ virtualCameraBusy: false });
    const readyRes = readyValidator.checkVirtualCameraDevice();
    assert.strictEqual(readyRes.available, true);
    assert.strictEqual(readyRes.deviceName, 'OBS Virtual Camera');
  });

  it('4. should detect zero-FPS frozen capture streams and prevent indefinite test hanging', () => {
    const validator = new ObsVerificationValidator();

    // Sequence of 10 identical frames (hash 'frame-deadbeef')
    const frozenFrames = Array(10).fill({ hash: 'frame-deadbeef', timestamp: 1000 });
    const freezeResult = validator.detectFrozenStream(frozenFrames);

    assert.strictEqual(freezeResult.healthy, false);
    assert.strictEqual(freezeResult.isFrozen, true);
    assert.match(freezeResult.error, /StreamCaptureStalled.*0 FPS/i);

    // Dynamic active stream
    const activeFrames = Array(10).fill(null).map((_, i) => ({ hash: `frame-${i}`, timestamp: 1000 + i * 33 }));
    const activeResult = validator.detectFrozenStream(activeFrames);
    assert.strictEqual(activeResult.healthy, true);
    assert.strictEqual(activeResult.isFrozen, false);
  });

  it('5. should match capture window targets even when window title dynamically appends status or script name', () => {
    const validator = new ObsVerificationValidator();
    const baseTarget = 'Teleprompter HUD';

    // Various dynamic titles during active presentation
    const dynamicTitles = [
      'Teleprompter HUD',
      'Teleprompter HUD - Keynote Rehearsal',
      'Teleprompter HUD - [Paused] (Speed: 2.0x)',
      'teleprompter hud - script 001'
    ];

    for (const title of dynamicTitles) {
      assert.strictEqual(
        validator.matchWindowTitle(baseTarget, title),
        true,
        `Expected "${title}" to match base target "${baseTarget}"`
      );
    }

    // Different window should not match
    assert.strictEqual(validator.matchWindowTitle(baseTarget, 'Chrome - Google Search'), false);
  });
});
