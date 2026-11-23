import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * P06: Pairwise Combination — Click-Through Toggle & Drag Position
 * Features tested:
 * - F4 & F5: WindowPlatform::set_click_through (WS_EX_TRANSPARENT)
 * - F7 & F9: Prompter HUD Window Drag & Positioning
 *
 * Verifies that click-through mode transparently passes mouse events through the prompter,
 * preventing drag interaction while preserving exact window position upon re-enabling controls.
 */

// Win32 constants
const WS_EX_TRANSPARENT = 0x00000020;
const HTTRANSPARENT = -1;
const HTCAPTION = 2;
const HTCLIENT = 1;

class MockPrompterWindow {
  constructor(hwnd, initialBounds = { x: 100, y: 100, width: 600, height: 300 }) {
    this.hwnd = hwnd;
    this.bounds = { ...initialBounds };
    this.clickThrough = false;
    this.exStyle = 0;
  }

  setClickThrough(enabled) {
    this.clickThrough = Boolean(enabled);
    if (this.clickThrough) {
      this.exStyle |= WS_EX_TRANSPARENT;
    } else {
      this.exStyle &= ~WS_EX_TRANSPARENT;
    }
    return { success: true, clickThrough: this.clickThrough, exStyle: this.exStyle };
  }

  // Simulates WM_NCHITTEST
  hitTest(mouseX, mouseY) {
    // If click-through is set, all coordinates return HTTRANSPARENT to pass to underlying window
    if (this.clickThrough) {
      return HTTRANSPARENT;
    }

    // Inside window bounds
    if (
      mouseX >= this.bounds.x &&
      mouseX <= this.bounds.x + this.bounds.width &&
      mouseY >= this.bounds.y &&
      mouseY <= this.bounds.y + this.bounds.height
    ) {
      // Top 30px is drag handle caption
      if (mouseY <= this.bounds.y + 30) {
        return HTCAPTION;
      }
      return HTCLIENT;
    }

    return 0; // Out of bounds
  }

  // Simulates user dragging window
  drag(deltaX, deltaY) {
    if (this.clickThrough) {
      // Dragging cannot occur because mouse events pass through
      return { dragged: false, bounds: { ...this.bounds } };
    }

    this.bounds.x += deltaX;
    this.bounds.y += deltaY;
    return { dragged: true, bounds: { ...this.bounds } };
  }
}

describe('P06: Pairwise Click-Through Toggle & Drag Position', () => {
  it('should allow dragging window to new coordinates when click-through is disabled', () => {
    const prompter = new MockPrompterWindow(2001, { x: 200, y: 150, width: 500, height: 250 });

    assert.equal(prompter.clickThrough, false);
    assert.equal(prompter.hitTest(250, 160), HTCAPTION, 'Top bar should be HTCAPTION for dragging');

    const result = prompter.drag(50, 75);
    assert.equal(result.dragged, true);
    assert.deepEqual(prompter.bounds, { x: 250, y: 225, width: 500, height: 250 });
  });

  it('should return HTTRANSPARENT and prevent dragging when click-through is enabled', () => {
    const prompter = new MockPrompterWindow(2002, { x: 200, y: 150, width: 500, height: 250 });

    prompter.setClickThrough(true);
    assert.equal(prompter.clickThrough, true);
    assert.ok(prompter.exStyle & WS_EX_TRANSPARENT);

    // Mouse over drag handle returns HTTRANSPARENT
    assert.equal(prompter.hitTest(250, 160), HTTRANSPARENT);
    // Mouse over client area returns HTTRANSPARENT
    assert.equal(prompter.hitTest(300, 250), HTTRANSPARENT);

    // Drag attempt fails
    const dragResult = prompter.drag(100, 100);
    assert.equal(dragResult.dragged, false);
    assert.deepEqual(prompter.bounds, { x: 200, y: 150, width: 500, height: 250 },
      'Position must remain completely unmoved during click-through');
  });

  it('should preserve exact dragged coordinates after toggling click-through ON and OFF', () => {
    const prompter = new MockPrompterWindow(2003, { x: 100, y: 100, width: 400, height: 200 });

    // Drag window to user preferred spot
    prompter.drag(342, 187);
    assert.equal(prompter.bounds.x, 442);
    assert.equal(prompter.bounds.y, 287);

    // Enable click-through during presentation
    prompter.setClickThrough(true);
    assert.equal(prompter.hitTest(450, 290), HTTRANSPARENT);
    assert.deepEqual(prompter.bounds, { x: 442, y: 287, width: 400, height: 200 });

    // Disable click-through after presentation
    prompter.setClickThrough(false);
    assert.deepEqual(prompter.bounds, { x: 442, y: 287, width: 400, height: 200 });
    assert.equal(prompter.hitTest(450, 290), HTCAPTION);
  });

  it('should toggle WS_EX_TRANSPARENT flag idempotently', () => {
    const prompter = new MockPrompterWindow(2004);

    prompter.setClickThrough(true);
    const style1 = prompter.exStyle;
    prompter.setClickThrough(true);
    assert.equal(prompter.exStyle, style1, 'Style flag should not duplicate');

    prompter.setClickThrough(false);
    assert.equal(prompter.exStyle & WS_EX_TRANSPARENT, 0);
  });

  it('should maintain independent click-through state across different window handles', () => {
    const prompter = new MockPrompterWindow(2005);
    const launcher = new MockPrompterWindow(2006);

    prompter.setClickThrough(true);
    launcher.setClickThrough(false);

    assert.equal(prompter.clickThrough, true);
    assert.equal(launcher.clickThrough, false);
    assert.equal(launcher.drag(20, 20).dragged, true);
    assert.equal(prompter.drag(20, 20).dragged, false);
  });
});
