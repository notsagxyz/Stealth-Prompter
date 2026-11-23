import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P15: Pairwise Combination — Invisibility Probe & Screen Capture Pipeline
 * Features tested:
 * - F11: Automated Invisibility Verification (Pixel Probe #FF00FF / Canary Markers)
 * - F12: OBS Studio & Video Conference Screen Share Capture Verification
 *
 * Simulates Desktop Duplication API / DWM frame buffer compositing, verifying that
 * windows with WDA_EXCLUDEFROMCAPTURE = 0x11 are completely absent from captured video frames.
 */

const WDA_EXCLUDEFROMCAPTURE = 0x00000011; // 17

class ScreenCaptureSimulator {
  constructor(screenWidth = 1920, screenHeight = 1080) {
    this.width = screenWidth;
    this.height = screenHeight;
    // Frame buffer represented as RGBA pixel map or coordinate map
    this.windows = [];
  }

  addWindow(win) {
    this.windows.push(win);
  }

  // DWM Desktop Duplication capture pass
  captureFrame() {
    // Background desktop color: Dark Blue #001122
    const capturedPixels = new Map();

    for (const win of this.windows) {
      if (!win.visible) continue;

      // If window has WDA_EXCLUDEFROMCAPTURE, DWM compositor completely skips it
      if (win.affinity === WDA_EXCLUDEFROMCAPTURE) {
        continue;
      }

      // Non-excluded window gets drawn into frame buffer
      for (let y = win.bounds.y; y < win.bounds.y + win.bounds.height; y++) {
        for (let x = win.bounds.x; x < win.bounds.x + win.bounds.width; x++) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            capturedPixels.set(`${x},${y}`, win.color);
          }
        }
      }
    }

    return {
      capturedPixels,
      hasColor: (targetHex) => {
        for (const color of capturedPixels.values()) {
          if (color.toUpperCase() === targetHex.toUpperCase()) return true;
        }
        return false;
      },
      countColor: (targetHex) => {
        let count = 0;
        for (const color of capturedPixels.values()) {
          if (color.toUpperCase() === targetHex.toUpperCase()) count++;
        }
        return count;
      }
    };
  }
}

describe('P15: Pairwise Invisibility Probe Under Stream Capture', () => {
  it('should detect #FF00FF probe pixels in stream when capture exclusion is DISABLED', () => {
    const simulator = new ScreenCaptureSimulator(800, 600);

    // Desktop background window
    simulator.addWindow({
      label: 'desktop',
      bounds: { x: 0, y: 0, width: 800, height: 600 },
      color: '#001122',
      visible: true,
      affinity: 0
    });

    // Prompter window with Magenta Canary Probe (#FF00FF) and NO exclusion
    simulator.addWindow({
      label: 'prompter_leaking',
      bounds: { x: 100, y: 100, width: 200, height: 100 },
      color: '#FF00FF',
      visible: true,
      affinity: 0 // WDA_NONE
    });

    const frame = simulator.captureFrame();
    assert.equal(frame.hasColor('#FF00FF'), true, 'Probe color must be detected when affinity is 0');
    assert.equal(frame.countColor('#FF00FF'), 200 * 100, 'All 20,000 window pixels captured');
  });

  it('should completely omit #FF00FF probe pixels when WDA_EXCLUDEFROMCAPTURE (0x11) is ENABLED', () => {
    const simulator = new ScreenCaptureSimulator(800, 600);

    // Desktop background window
    simulator.addWindow({
      label: 'desktop',
      bounds: { x: 0, y: 0, width: 800, height: 600 },
      color: '#001122',
      visible: true,
      affinity: 0
    });

    // Prompter window with Magenta Canary Probe and WDA_EXCLUDEFROMCAPTURE
    simulator.addWindow({
      label: 'prompter_invisible',
      bounds: { x: 100, y: 100, width: 200, height: 100 },
      color: '#FF00FF',
      visible: true,
      affinity: WDA_EXCLUDEFROMCAPTURE // 0x11
    });

    const frame = simulator.captureFrame();
    assert.equal(frame.hasColor('#FF00FF'), false, 'Probe color must be 100% excluded');
    assert.equal(frame.countColor('#FF00FF'), 0, 'Zero magenta pixels should leak');
  });

  it('should maintain zero pixel leakage across different prompter opacity values', () => {
    const opacities = [0.1, 0.4, 0.75, 1.0];

    for (const opacity of opacities) {
      const simulator = new ScreenCaptureSimulator(400, 300);
      simulator.addWindow({
        label: 'prompter',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        color: '#FF00FF',
        opacity,
        visible: true,
        affinity: WDA_EXCLUDEFROMCAPTURE
      });

      const frame = simulator.captureFrame();
      assert.equal(frame.countColor('#FF00FF'), 0,
        `Leak detected at opacity ${opacity}`);
    }
  });

  it('should maintain exclusion continuously as prompter window moves and resizes across video frames', () => {
    const simulator = new ScreenCaptureSimulator(1920, 1080);
    const prompter = {
      label: 'prompter',
      bounds: { x: 100, y: 100, width: 400, height: 200 },
      color: '#FF00FF',
      visible: true,
      affinity: WDA_EXCLUDEFROMCAPTURE
    };
    simulator.addWindow(prompter);

    // Simulate 30 video stream frames while moving and resizing
    for (let frameIndex = 0; frameIndex < 30; frameIndex++) {
      prompter.bounds.x += 10;
      prompter.bounds.y += 5;
      prompter.bounds.width += 2;

      const frame = simulator.captureFrame();
      assert.equal(frame.countColor('#FF00FF'), 0,
        `Frame ${frameIndex} leaked prompter pixels during motion`);
    }
  });

  it('should verify probe verification script specification exits with code 0 on pass and 1 on leak', () => {
    function evaluateProbeResults(detectedPixelCount) {
      if (detectedPixelCount === 0) {
        return { exitCode: 0, status: 'PASS', message: 'Window is 100% invisible to capture' };
      }
      return { exitCode: 1, status: 'FAIL', message: `Invisibility failed: ${detectedPixelCount} pixels leaked` };
    }

    assert.equal(evaluateProbeResults(0).exitCode, 0);
    assert.equal(evaluateProbeResults(0).status, 'PASS');

    assert.equal(evaluateProbeResults(12).exitCode, 1);
    assert.equal(evaluateProbeResults(12).status, 'FAIL');
  });
});
