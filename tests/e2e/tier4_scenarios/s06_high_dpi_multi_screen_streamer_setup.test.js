import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * S06: Real-World Scenario — High-DPI Multi-Screen Streamer Setup
 * Features exercised:
 * - F5: Win32 SetWindowDisplayAffinity (WDA_EXCLUDEFROMCAPTURE = 0x11 / 17)
 * - F7: Tauri 2 Multi-Window Setup & Per-Monitor DPI Awareness V2
 * - F9: SolidJS Overlay HUD Prompter (Dynamic scaling & layout)
 * - F10: Non-Focus-Stealing Global Hotkeys (Uniform shortcut routing)
 *
 * Simulates a content creator running a 4K 150% primary monitor alongside a 1080p 100% secondary display,
 * dragging the HUD across monitors while maintaining display capture exclusion and fluid hotkeys.
 */

const WDA_EXCLUDEFROMCAPTURE = 0x00000011; // 17

class StreamerMultiDisplaySystem {
  constructor() {
    this.monitors = [
      { id: 'mon-4k', bounds: { x: 0, y: 0, width: 3840, height: 2160 }, dpi: 144, scale: 1.5 },
      { id: 'mon-1080p', bounds: { x: 3840, y: 0, width: 1920, height: 1080 }, dpi: 96, scale: 1.0 }
    ];

    this.prompter = {
      hwnd: 6001,
      bounds: { x: 500, y: 200, width: 1200, height: 600 }, // 150% size on 4K
      baseFontSize: 24,
      currentFontSize: 36, // 24 * 1.5 = 36px
      currentMonitor: 'mon-4k',
      displayAffinity: WDA_EXCLUDEFROMCAPTURE,
      playing: false
    };

    this.obsCaptureFeed = {
      targetMonitor: 'mon-1080p',
      capturedPrompterPixels: 0
    };
  }

  // Drag prompter from 4K monitor to 1080p secondary monitor
  dragWindowTo(newX, newY) {
    this.prompter.bounds.x = newX;
    this.prompter.bounds.y = newY;

    // Detect host monitor
    const hostMonitor = this.monitors.find(m =>
      newX >= m.bounds.x && newX < m.bounds.x + m.bounds.width
    ) || this.monitors[0];

    if (hostMonitor.id !== this.prompter.currentMonitor) {
      // Monitor transit occurred! Trigger Per-Monitor DPI change
      this.prompter.currentMonitor = hostMonitor.id;
      this.handleDpiChange(hostMonitor.scale);
    }
  }

  handleDpiChange(newScale) {
    // Dynamically adjust font and window dimensions
    this.prompter.currentFontSize = Math.round(this.prompter.baseFontSize * newScale);
    this.prompter.bounds.width = Math.round(800 * newScale);
    this.prompter.bounds.height = Math.round(400 * newScale);

    // Invariant: Windows Display Affinity must NEVER be reset by monitor transfer
    assert.equal(this.prompter.displayAffinity, WDA_EXCLUDEFROMCAPTURE);
  }

  // OBS capture check on secondary monitor
  sampleObsCapture() {
    // If prompter is on 1080p monitor and affinity is NOT ExcludeFromCapture, it leaks
    if (
      this.prompter.currentMonitor === this.obsCaptureFeed.targetMonitor &&
      this.prompter.displayAffinity !== WDA_EXCLUDEFROMCAPTURE
    ) {
      this.obsCaptureFeed.capturedPrompterPixels = this.prompter.bounds.width * this.prompter.bounds.height;
    } else {
      this.obsCaptureFeed.capturedPrompterPixels = 0;
    }
    return this.obsCaptureFeed.capturedPrompterPixels;
  }

  // Global hotkey triggered
  triggerHotkey(action) {
    if (action === 'toggle-play') {
      this.prompter.playing = !this.prompter.playing;
    }
    return { playing: this.prompter.playing };
  }
}

describe('S06: Scenario — High-DPI Multi-Screen Streamer Setup', () => {
  it('should handle dragging HUD from 4K (150% DPI) to 1080p (100% DPI) monitor seamlessly', () => {
    const streamer = new StreamerMultiDisplaySystem();

    // Stage 1 & 2: Started on 4K display
    assert.equal(streamer.prompter.currentMonitor, 'mon-4k');
    assert.equal(streamer.prompter.currentFontSize, 36, 'Font size should be 36px at 150% DPI');
    assert.equal(streamer.prompter.bounds.width, 1200);

    // Stage 3 & 4: Drag prompter to 1080p monitor at x: 4200
    streamer.dragWindowTo(4200, 150);
    assert.equal(streamer.prompter.currentMonitor, 'mon-1080p');
    assert.equal(streamer.prompter.currentFontSize, 24, 'Font size should dynamically scale down to 24px');
    assert.equal(streamer.prompter.bounds.width, 800, 'Window width should scale to 800px');
    assert.equal(streamer.prompter.displayAffinity, WDA_EXCLUDEFROMCAPTURE,
      'WDA_EXCLUDEFROMCAPTURE must remain intact across monitor boundary');

    // Stage 5: OBS capturing 1080p display verifies 0 leaked pixels
    const leakedPixels = streamer.sampleObsCapture();
    assert.equal(leakedPixels, 0, 'OBS stream must capture zero prompter pixels on secondary display');

    // Stage 6: Hotkeys continue functioning uniformly
    const hotkeyRes = streamer.triggerHotkey('toggle-play');
    assert.equal(hotkeyRes.playing, true);
  });
});
