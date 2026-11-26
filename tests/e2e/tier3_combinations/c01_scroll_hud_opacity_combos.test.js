import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { extractTranslateY, parseCssColor } from '../lib/assertions.js';

const SCRIPT = {
  id: 'combo-script',
  title: 'Combo Presentation',
  content: Array.from({ length: 30 }, (_, i) => `Section ${i + 1}: Smooth reading and manual control integration test.`).join('\n\n'),
  last_position: 0,
  speed: 3.0,
  cues: [],
};

describe('Tier 3 Combinations — Scroll, HUD & Opacity (4 tests)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 1000, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('T3-01 (F3 x F4): Manual wheel scroll + auto-pause + smooth resume + Mirror mode (scaleX(-1))', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { mirror_mode: false, click_through: false, scroll_speed: 3.0 },
        scripts: [SCRIPT],
      },
    });

    // Enable Mirror via HUD button and Play
    const setupOk = await cdp.evaluate(() => {
      const mirrorBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        /mirror/i.test(`${b.title} ${b.ariaLabel} ${b.textContent}`)
      );
      const playBtn = document.querySelector('button[title*="Play" i], button[aria-label*="Play" i]');
      if (!mirrorBtn || !playBtn) return false;
      mirrorBtn.click();
      playBtn.click();
      return true;
    });
    assert.ok(setupOk, 'HUD must provide Mirror and Play controls');

    await new Promise((r) => setTimeout(r, 250));
    await cdp.dispatchWheel(500, 200, 0, 180);
    await new Promise((r) => setTimeout(r, 120));

    const afterWheel = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      const playBtn = document.querySelector('button[title*="Play" i], button[title*="Pause" i], button[aria-label*="Play" i], button[aria-label*="Pause" i]');
      return {
        transform: el ? getComputedStyle(el).transform : '',
        playTitle: playBtn ? (playBtn.getAttribute('title') || playBtn.getAttribute('aria-label') || '') : '',
      };
    });

    const m = afterWheel.transform.match(/^matrix\(([^)]+)\)$/);
    assert.ok(m, `Expected transform matrix in Mirror mode, got "${afterWheel.transform}"`);
    const parts = m[1].split(',').map(Number);
    assert.equal(parts[0], -1, 'Mirror mode scaleX(-1) must remain active');
    const yPaused = Math.abs(parts[5]);
    assert.ok(yPaused > 30, `Manual wheel scroll must advance Y, got ${yPaused}`);
    assert.match(afterWheel.playTitle, /play/i, 'Manual wheel must auto-pause playback');

    // Resume and confirm forward motion without jump
    await cdp.evaluate(() => {
      document.querySelector('button[title*="Play" i], button[aria-label*="Play" i]')?.click();
    });
    await new Promise((r) => setTimeout(r, 250));
    const yResumed = Math.abs(
      extractTranslateY(
        await cdp.evaluate(() => {
          const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
          return el ? getComputedStyle(el).transform : '';
        })
      )
    );
    assert.ok(yResumed > yPaused + 2, `Resumed Y (${yResumed}) must advance from paused manual Y (${yPaused})`);
  });

  it('T3-02 (F3 x F4): Background-only 10% opacity slider + global opacity shortcuts + click-through tooltip', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { window_opacity: 0.1, click_through: true },
        scripts: [SCRIPT],
      },
    });

    const initial = await cdp.evaluate(() => {
      const bgEl = document.querySelector('[data-hud-surface], [data-testid="hud-container"], .shadow-hud, div[style*="rgba("]');
      const textEl = document.querySelector('main .will-change-transform, main [data-testid="prompter-text"]');
      const tooltips = Array.from(document.querySelectorAll('[title], [aria-label]'))
        .map((e) => `${e.getAttribute('title') || ''} ${e.getAttribute('aria-label') || ''}`)
        .join(' ');
      return {
        bgColor: bgEl ? getComputedStyle(bgEl).backgroundColor : '',
        textOpacity: textEl ? getComputedStyle(textEl).opacity : '',
        helpText: `${document.body.innerText} ${tooltips}`,
      };
    });

    const parsedBg = parseCssColor(initial.bgColor);
    assert.ok(parsedBg && Math.abs(parsedBg.a - 0.1) <= 0.03, `Expected 10% background alpha, got "${initial.bgColor}"`);
    assert.equal(initial.textOpacity, '1', 'Foreground text opacity must remain 1 at 10% background');
    assert.match(initial.helpText, /scroll/i, 'Click-through help must mention global scroll shortcuts');
    assert.match(initial.helpText, /opacity|transparen/i, 'Click-through help must mention global opacity shortcuts');

    // Global opacity_up event while click_through: true
    await cdp.evaluate(() => {
      window.__STEALTH_TEST_HARNESS__.emitEvent('prompter:action', { type: 'opacity_up' });
    });
    await new Promise((r) => setTimeout(r, 120));

    const raisedBg = await cdp.evaluate(() => {
      const bgEl = document.querySelector('[data-hud-surface], [data-testid="hud-container"], .shadow-hud, div[style*="rgba("]');
      return bgEl ? getComputedStyle(bgEl).backgroundColor : '';
    });
    const parsedRaised = parseCssColor(raisedBg);
    assert.ok(parsedRaised && parsedRaised.a > 0.12, `Expected global opacity_up to increase alpha above 0.10, got "${raisedBg}"`);
  });

  it('T3-03 (F3 x F4 x F5): Click-through lock + hidden floating bar + persistent Play pill + Launcher lock sync', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: { windowLabel: 'prompter', settings: { click_through: false }, scripts: [SCRIPT] },
    });

    const hidBar = await cdp.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        /hide.*bar|collapse|minimize.*controls/i.test(`${b.title} ${b.ariaLabel} ${b.textContent}`)
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    assert.ok(hidBar, 'HUD must allow hiding floating control bar');
    await new Promise((r) => setTimeout(r, 120));

    const playPillVisible = await cdp.evaluate(() => {
      const pill = document.querySelector('[data-testid="persistent-play-pill"], button[title*="Play" i], button[aria-label*="Play" i]');
      const r = pill ? pill.getBoundingClientRect() : null;
      return Boolean(r && r.width > 0 && r.height > 0);
    });
    assert.ok(playPillVisible, 'Persistent Play pill must stay visible when bar is hidden');

    // Launcher lock badge when click_through is active
    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: { settings: { click_through: true }, scripts: [SCRIPT] },
    });
    const launcherLock = await cdp.evaluate(() => /locked|unlock|click-through/i.test(document.body.innerText));
    assert.ok(launcherLock, 'Launcher must surface lock/unlock state when click_through is enabled');
  });

  it('T3-04 (F3 x F4 x F5): "New script" authoring + XSS sanitization + RTL detection + progress retention', async () => {
    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: { scripts: [] },
    });

    const created = await cdp.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        /new\s*script/i.test(`${b.textContent} ${b.ariaLabel}`)
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    assert.ok(created, '"New script" pill CTA must open script authoring flow');

    // Verify HUD handles RTL script with HTML tags safely without XSS execution
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        scripts: [
          {
            id: 'rtl-xss',
            title: 'RTL Test',
            content: 'שלום עולם <img src=x onerror="window.__RTL_XSS=true"> <b>Stealth</b>',
            last_position: 45,
            speed: 2.5,
          },
        ],
      },
    });

    const hudCheck = await cdp.evaluate(() => {
      const textEl = document.querySelector('main .will-change-transform, main [data-testid="prompter-text"]');
      return {
        xssExecuted: Boolean(window.__RTL_XSS),
        dir: textEl ? (textEl.getAttribute('dir') || getComputedStyle(textEl).direction) : '',
        transform: textEl ? getComputedStyle(textEl).transform : '',
      };
    });

    assert.equal(hudCheck.xssExecuted, false, 'HTML tags in script content must never execute as raw HTML');
    assert.equal(hudCheck.dir, 'rtl', 'RTL Hebrew script content must activate RTL direction');
    assert.ok(Math.abs(extractTranslateY(hudCheck.transform)) >= 40, 'Retained last_position=45 must restore on HUD load');
  });
});
