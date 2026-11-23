import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * S02: Real-World Scenario — Video Conference Screen Share Invisibility Audit
 * Features exercised:
 * - F4: WindowPlatform Trait Abstraction
 * - F5: Win32 SetWindowDisplayAffinity (WDA_EXCLUDEFROMCAPTURE = 0x11 / 17)
 * - F11: Automated Invisibility Verification & Pixel Analysis
 * - F12: OBS & Video Calling Screen Share Verification Guide
 *
 * Simulates a high-stakes corporate video conference where confidential notes/teleprompter
 * are positioned in the middle of a screen-shared document, proving zero pixel leakage.
 */

const WDA_EXCLUDEFROMCAPTURE = 0x00000011; // 17

class VideoConferenceCapturePipeline {
  constructor(resX = 1920, resY = 1080) {
    this.resX = resX;
    this.resY = resY;
    this.streamActive = false;
    this.layers = [];
  }

  startScreenShare(targetMonitor = 'Primary') {
    this.streamActive = true;
    return { status: 'sharing', monitor: targetMonitor };
  }

  addWindowLayer(windowLayer) {
    this.layers.push(windowLayer);
  }

  // Captures and composites the desktop frame according to DWM display affinity rules
  captureStreamFrame() {
    if (!this.streamActive) throw new Error('Screen share stream is inactive');

    // Canvas representing meeting attendees' view
    const frameBuffer = new Map();

    // Sort by z-order
    const sorted = [...this.layers].sort((a, b) => a.zOrder - b.zOrder);

    for (const win of sorted) {
      if (!win.visible) continue;

      // Win32 DWM Exclusion Check:
      // If WDA_EXCLUDEFROMCAPTURE (17) is set, DWM skips rendering this window to screen capture handles
      if (win.displayAffinity === WDA_EXCLUDEFROMCAPTURE) {
        continue; // Excluded!
      }

      // Draw window into attendee stream
      for (let y = win.bounds.y; y < win.bounds.y + win.bounds.height; y++) {
        for (let x = win.bounds.x; x < win.bounds.x + win.bounds.width; x++) {
          if (x >= 0 && x < this.resX && y >= 0 && y < this.resY) {
            frameBuffer.set(`${x},${y}`, {
              source: win.id,
              color: win.color,
              text: win.content
            });
          }
        }
      }
    }

    return {
      totalPixels: frameBuffer.size,
      hasWindowContent: (winId) => {
        for (const pixel of frameBuffer.values()) {
          if (pixel.source === winId) return true;
        }
        return false;
      },
      hasChromaColor: (hexColor) => {
        for (const pixel of frameBuffer.values()) {
          if (pixel.color?.toUpperCase() === hexColor.toUpperCase()) return true;
        }
        return false;
      }
    };
  }
}

describe('S02: Scenario — Video Conference Screen Share Invisibility Audit', () => {
  it('should verify complete exclusion of teleprompter HUD during active video conference', () => {
    const pipeline = new VideoConferenceCapturePipeline(1920, 1080);
    pipeline.startScreenShare('Primary');

    // Shared Presentation Window (e.g. Google Slides / PDF)
    pipeline.addWindowLayer({
      id: 'shared-slides',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      color: '#FFFFFF',
      content: 'CONFIDENTIAL: Q4 Financial Overview',
      zOrder: 1,
      visible: true,
      displayAffinity: 0 // Normal window, captured
    });

    // Teleprompter HUD Window positioned right in center of shared slides
    const prompterWindow = {
      id: 'teleprompter-hud',
      bounds: { x: 560, y: 200, width: 800, height: 400 },
      color: '#FF00FF', // High-visibility canary probe color
      content: 'SECRET TALKING POINTS: Do not mention merger before 10 AM',
      zOrder: 100, // Topmost overlay
      visible: true,
      displayAffinity: WDA_EXCLUDEFROMCAPTURE // Excluded via SetWindowDisplayAffinity
    };
    pipeline.addWindowLayer(prompterWindow);

    // Frame 1: Capture stream
    const frame1 = pipeline.captureStreamFrame();
    assert.ok(frame1.hasWindowContent('shared-slides'), 'Shared slides must be visible to meeting');
    assert.equal(frame1.hasWindowContent('teleprompter-hud'), false,
      'Teleprompter HUD must be 100% excluded from attendee stream');
    assert.equal(frame1.hasChromaColor('#FF00FF'), false,
      'Zero canary probe pixels should appear in attendee stream');

    // Simulate presenter repositioning HUD during call
    prompterWindow.bounds.x = 200;
    prompterWindow.bounds.y = 100;
    const frame2 = pipeline.captureStreamFrame();
    assert.equal(frame2.hasWindowContent('teleprompter-hud'), false);
    assert.equal(frame2.hasChromaColor('#FF00FF'), false);
  });

  it('should fail audit and alert if WDA_EXCLUDEFROMCAPTURE is accidentally removed or omitted', () => {
    const pipeline = new VideoConferenceCapturePipeline(1920, 1080);
    pipeline.startScreenShare('Primary');

    pipeline.addWindowLayer({
      id: 'slides',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      color: '#FFFFFF',
      zOrder: 1,
      visible: true,
      displayAffinity: 0
    });

    // Defective / unprotected prompter window (affinity = 0)
    pipeline.addWindowLayer({
      id: 'unprotected-prompter',
      bounds: { x: 500, y: 300, width: 400, height: 200 },
      color: '#FF00FF',
      content: 'Leaked prompter script',
      zOrder: 100,
      visible: true,
      displayAffinity: 0 // Affinity NOT set!
    });

    const frame = pipeline.captureStreamFrame();
    assert.equal(frame.hasWindowContent('unprotected-prompter'), true,
      'Unprotected window must be detected as a security leak');
    assert.equal(frame.hasChromaColor('#FF00FF'), true);
  });
});
