import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { SRC_TAURI_DIR, readTextSafe } from '../lib/paths.js';
import { execCargo } from '../lib/exec.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { extractTranslateY } from '../lib/assertions.js';

const LONG_SCRIPT = {
  id: 'scroll-test-1',
  title: 'Long Scroll Script',
  content: Array.from({ length: 40 }, (_, i) => `Paragraph ${i + 1}: Delivering clear eye contact during live presentations with Stealth.`).join('\n\n'),
  last_position: 0,
  speed: 2.5,
  cues: [],
};

describe('F3 — Scroll Engine & Backend Global Controls (Tier 1)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 1000, height: 350 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F3-T1-01: Mouse wheel & touchpad scroll pauses auto-scroll and Play resumes smoothly from new Y', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { scroll_speed: 3.5, click_through: false, window_opacity: 0.75 },
        scripts: [LONG_SCRIPT],
      },
    });

    // Click Play button
    const playClicked = await cdp.evaluate(() => {
      const btn = document.querySelector('button[title*="Play" i], button[aria-label*="Play" i]');
      if (!btn) return false;
      btn.click();
      return true;
    });
    assert.ok(playClicked, 'Play button must exist on HUD');

    await new Promise((r) => setTimeout(r, 350));
    const yBeforeWheel = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      return el ? getComputedStyle(el).transform : '';
    });
    const tyBefore = Math.abs(extractTranslateY(yBeforeWheel));
    assert.ok(tyBefore > 5, `Expected auto-scroll to advance Y > 5px, got transform="${yBeforeWheel}"`);

    // Dispatch mouse wheel and fine touchpad wheel
    await cdp.dispatchWheel(500, 200, 0, 140);
    await cdp.dispatchWheel(500, 200, 0, 22);
    await new Promise((r) => setTimeout(r, 120));

    const afterWheel = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      const playBtn = document.querySelector('button[title*="Play" i], button[title*="Pause" i], button[aria-label*="Play" i], button[aria-label*="Pause" i]');
      return {
        transform: el ? getComputedStyle(el).transform : '',
        playTitle: playBtn ? (playBtn.getAttribute('title') || playBtn.getAttribute('aria-label') || '') : '',
      };
    });
    const tyAfterWheel = Math.abs(extractTranslateY(afterWheel.transform));
    assert.ok(
      tyAfterWheel > tyBefore + 30,
      `Expected manual wheel scroll to advance Y beyond ${tyBefore}px, got ${tyAfterWheel}px`
    );
    assert.match(
      afterWheel.playTitle,
      /play/i,
      `Expected auto-scroll to pause after manual wheel (button title should show Play, got "${afterWheel.playTitle}")`
    );

    // Wait 180ms while paused to confirm Y does not keep drifting
    await new Promise((r) => setTimeout(r, 180));
    const tyPaused = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      return el ? getComputedStyle(el).transform : '';
    });
    assert.ok(
      Math.abs(Math.abs(extractTranslateY(tyPaused)) - tyAfterWheel) < 2,
      'Scroll position must remain stationary while paused'
    );

    // Resume via Play and verify smooth forward progression from tyAfterWheel (no jump back)
    await cdp.evaluate(() => {
      const btn = document.querySelector('button[title*="Play" i], button[aria-label*="Play" i]');
      btn?.click();
    });
    await new Promise((r) => setTimeout(r, 250));
    const tyResumed = Math.abs(
      extractTranslateY(
        await cdp.evaluate(() => {
          const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
          return el ? getComputedStyle(el).transform : '';
        })
      )
    );
    assert.ok(
      tyResumed > tyAfterWheel + 2,
      `Expected Play to resume smoothly past ${tyAfterWheel}px, got ${tyResumed}px`
    );
  });

  it('F3-T1-02: Text drag manual scroll pauses auto-scroll and resumes smoothly', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { scroll_speed: 2.5, click_through: false },
        scripts: [LONG_SCRIPT],
      },
    });

    await cdp.evaluate(() => {
      document.querySelector('button[title*="Play" i], button[aria-label*="Play" i]')?.click();
    });
    await new Promise((r) => setTimeout(r, 200));

    const tyStart = Math.abs(
      extractTranslateY(
        await cdp.evaluate(() => {
          const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
          return el ? getComputedStyle(el).transform : '';
        })
      )
    );

    // Drag upward on script region to scroll down through text
    await cdp.drag(500, 260, 500, 110, 8);
    await new Promise((r) => setTimeout(r, 120));

    const afterDrag = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      const playBtn = document.querySelector('button[title*="Play" i], button[title*="Pause" i], button[aria-label*="Play" i], button[aria-label*="Pause" i]');
      return {
        transform: el ? getComputedStyle(el).transform : '',
        playTitle: playBtn ? (playBtn.getAttribute('title') || playBtn.getAttribute('aria-label') || '') : '',
      };
    });
    const tyAfterDrag = Math.abs(extractTranslateY(afterDrag.transform));
    assert.ok(
      tyAfterDrag > tyStart + 50,
      `Expected text drag to scroll forward past ${tyStart}px, got ${tyAfterDrag}px`
    );
    assert.match(afterDrag.playTitle, /play/i, 'Expected text drag to pause auto-scroll');
  });

  it('F3-T1-03: Background opacity 0.10..=1.0 range & Settings persistence in Rust backend', async () => {
    const modelsRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'models.rs'));
    assert.match(modelsRs, /0\.10|0\.1/, 'Settings model must enforce 0.10 (10%) minimum opacity');
    assert.doesNotMatch(
      modelsRs,
      /window_opacity\s*<\s*0\.05|clamp\(0\.05/,
      'Old 0.05 opacity floor must be replaced with 0.10'
    );

    const res = await execCargo(['test', '--lib', 'storage::']);
    assert.equal(res.status, 0, `Rust storage unit tests failed:\n${res.stdout}\n${res.stderr}`);
  });

  it('F3-T1-04: Global shortcut actions work in click-through mode without stealing focus', async () => {
    const shortcutsMod = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'shortcuts', 'mod.rs'));
    assert.match(shortcutsMod, /scroll_up/i, 'Global shortcuts must support scroll_up');
    assert.match(shortcutsMod, /scroll_down/i, 'Global shortcuts must support scroll_down');
    assert.match(shortcutsMod, /opacity_up/i, 'Global shortcuts must support opacity_up');
    assert.match(shortcutsMod, /opacity_down/i, 'Global shortcuts must support opacity_down');

    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { click_through: true, window_opacity: 0.5 },
        scripts: [LONG_SCRIPT],
      },
    });

    await cdp.evaluate(() => {
      window.__STEALTH_TEST_HARNESS__.emitEvent('prompter:action', { type: 'scroll_down' });
      window.__STEALTH_TEST_HARNESS__.emitEvent('prompter:action', { type: 'opacity_up' });
    });
    await new Promise((r) => setTimeout(r, 150));

    const state = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      const bgEl = document.querySelector('[data-hud-surface], [data-testid="hud-container"], .shadow-hud, div[style*="rgba("]');
      return {
        transform: el ? getComputedStyle(el).transform : '',
        bg: bgEl ? getComputedStyle(bgEl).backgroundColor : '',
      };
    });
    const ty = Math.abs(extractTranslateY(state.transform));
    assert.ok(ty > 5, `Expected global scroll_down action to scroll in click-through mode, got Y=${ty}`);
    assert.ok(!state.bg.includes('0.5)'), `Expected opacity_up event to raise background opacity above 0.5, got "${state.bg}"`);
  });

  it('F3-T1-05: Extended Settings fields (accent_color, 0.10..1.0 opacity, hotkeys) contracted in Rust', () => {
    const modelsRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'models.rs'));
    assert.match(modelsRs, /pub\s+accent_color\s*:\s*String/, 'Rust Settings must declare accent_color');
    assert.match(modelsRs, /pub\s+scroll_up\s*:\s*String/, 'Rust HotkeysSettings must declare scroll_up');
    assert.match(modelsRs, /pub\s+scroll_down\s*:\s*String/, 'Rust HotkeysSettings must declare scroll_down');
    assert.match(modelsRs, /pub\s+opacity_up\s*:\s*String/, 'Rust HotkeysSettings must declare opacity_up');
    assert.match(modelsRs, /pub\s+opacity_down\s*:\s*String/, 'Rust HotkeysSettings must declare opacity_down');
  });

  it('F3-T1-06: Frame-rate independent auto-scroll kinematics & Reset/Rewind behavior', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { scroll_speed: 3.0 },
        scripts: [LONG_SCRIPT],
      },
    });

    await cdp.evaluate(() => {
      document.querySelector('button[title*="Play" i], button[aria-label*="Play" i]')?.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const yPlaying = Math.abs(
      extractTranslateY(
        await cdp.evaluate(() => {
          const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
          return el ? getComputedStyle(el).transform : '';
        })
      )
    );
    assert.ok(yPlaying > 30, `Expected smooth auto-scroll advancement over 600ms, got ${yPlaying}px`);

    // Click Restart / Rewind
    const resetClicked = await cdp.evaluate(() => {
      const btn = document.querySelector(
        'button[title*="Restart" i], button[title*="Rewind" i], button[aria-label*="Restart" i], button[aria-label*="Rewind" i]'
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    assert.ok(resetClicked, 'Restart/Rewind button must exist on HUD');
    await new Promise((r) => setTimeout(r, 100));

    const yAfterReset = Math.abs(
      extractTranslateY(
        await cdp.evaluate(() => {
          const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
          return el ? getComputedStyle(el).transform : '';
        })
      )
    );
    assert.ok(yAfterReset < yPlaying, `Expected Restart/Rewind to reduce scroll offset from ${yPlaying}px, got ${yAfterReset}px`);
  });
});
