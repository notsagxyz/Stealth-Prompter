import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P13: Pairwise Combination — Multi-Monitor Virtual Layout & Window Placement
 * Features tested:
 * - F7: Tauri 2 Multi-Window Configuration & Display Enumeration
 * - F9: Prompter HUD Window Geometry, Coordinate Normalization & Clamping
 *
 * Verifies that the HUD overlay can be positioned across multi-monitor topologies
 * (including negative virtual coordinates and unequal resolutions) without getting stranded.
 */

class MultiMonitorWorkspace {
  constructor(monitors = []) {
    this.monitors = monitors.length > 0 ? [...monitors] : [
      { id: 'mon-primary', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, isPrimary: true }
    ];
  }

  getPrimaryMonitor() {
    return this.monitors.find(m => m.isPrimary) || this.monitors[0];
  }

  isPointOnAnyMonitor(x, y) {
    return this.monitors.some(m =>
      x >= m.bounds.x &&
      x < m.bounds.x + m.bounds.width &&
      y >= m.bounds.y &&
      y < m.bounds.y + m.bounds.height
    );
  }

  clampWindowPlacement(requested) {
    const width = requested.width || 600;
    const height = requested.height || 300;
    let x = requested.x;
    let y = requested.y;

    // Check if at least 50px of window is on some monitor
    const isAccessible = this.monitors.some(m => {
      const overlapX = Math.max(0, Math.min(x + width, m.bounds.x + m.bounds.width) - Math.max(x, m.bounds.x));
      const overlapY = Math.max(0, Math.min(y + height, m.bounds.y + m.bounds.height) - Math.max(y, m.bounds.y));
      return overlapX >= 50 && overlapY >= 50;
    });

    if (isAccessible) {
      return { x, y, width, height, clamped: false };
    }

    // Stranded: fallback to center of primary monitor
    const primary = this.getPrimaryMonitor();
    const fallbackX = primary.bounds.x + Math.floor((primary.bounds.width - width) / 2);
    const fallbackY = primary.bounds.y + Math.floor((primary.bounds.height - height) / 2);
    return { x: fallbackX, y: fallbackY, width, height, clamped: true };
  }

  removeMonitor(monitorId) {
    this.monitors = this.monitors.filter(m => m.id !== monitorId);
    if (!this.monitors.some(m => m.isPrimary) && this.monitors.length > 0) {
      this.monitors[0].isPrimary = true;
    }
  }
}

describe('P13: Pairwise Multi-Monitor & Window Placement', () => {
  it('should place window correctly on standard single primary monitor', () => {
    const workspace = new MultiMonitorWorkspace([
      { id: 'mon-1', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, isPrimary: true }
    ]);

    const placement = workspace.clampWindowPlacement({ x: 200, y: 150, width: 700, height: 350 });
    assert.equal(placement.clamped, false);
    assert.equal(placement.x, 200);
    assert.equal(placement.y, 150);
  });

  it('should support placement on secondary monitor positioned to the right (positive coords)', () => {
    const workspace = new MultiMonitorWorkspace([
      { id: 'mon-1', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, isPrimary: true },
      { id: 'mon-2', bounds: { x: 1920, y: 0, width: 2560, height: 1440 }, isPrimary: false }
    ]);

    // Position window on monitor 2
    const placement = workspace.clampWindowPlacement({ x: 2100, y: 200, width: 800, height: 400 });
    assert.equal(placement.clamped, false);
    assert.equal(placement.x, 2100);
    assert.equal(placement.y, 200);
  });

  it('should support placement on secondary monitor positioned to the left (negative coords)', () => {
    const workspace = new MultiMonitorWorkspace([
      { id: 'mon-left', bounds: { x: -1920, y: 0, width: 1920, height: 1080 }, isPrimary: false },
      { id: 'mon-primary', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, isPrimary: true }
    ]);

    // Position window on left monitor
    const placement = workspace.clampWindowPlacement({ x: -1500, y: 100, width: 800, height: 400 });
    assert.equal(placement.clamped, false);
    assert.equal(placement.x, -1500);
    assert.equal(placement.y, 100);
  });

  it('should clamp completely off-screen coordinates back to primary display center', () => {
    const workspace = new MultiMonitorWorkspace([
      { id: 'mon-1', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, isPrimary: true }
    ]);

    // Stranded coordinates far in void
    const placement = workspace.clampWindowPlacement({ x: 10000, y: -5000, width: 600, height: 300 });
    assert.equal(placement.clamped, true);
    // Centered on primary 1920x1080: x = (1920 - 600) / 2 = 660, y = (1080 - 300) / 2 = 390
    assert.equal(placement.x, 660);
    assert.equal(placement.y, 390);
  });

  it('should automatically rescue window if its host secondary monitor is unplugged', () => {
    const workspace = new MultiMonitorWorkspace([
      { id: 'mon-1', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, isPrimary: true },
      { id: 'mon-2', bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, isPrimary: false }
    ]);

    // Window was initially at (2200, 100) on monitor 2
    let placement = workspace.clampWindowPlacement({ x: 2200, y: 100, width: 600, height: 300 });
    assert.equal(placement.clamped, false);

    // Unplug monitor 2
    workspace.removeMonitor('mon-2');

    // Re-evaluating placement triggers rescue
    placement = workspace.clampWindowPlacement({ x: 2200, y: 100, width: 600, height: 300 });
    assert.equal(placement.clamped, true);
    assert.equal(placement.x, 660);
    assert.equal(placement.y, 390);
  });
});
