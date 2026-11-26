import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  DIST_DIR,
  SRC_DIR,
  SRC_TAURI_DIR,
  readJsonSafe,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { contrastRatio } from '../lib/assertions.js';

describe('F5 — Launcher & Settings Boundaries (Tier 2)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 980, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F5-T2-01: Invalid/unknown accent_color falls back safely to Violet (#7c6cff)', async () => {
    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: { settings: { accent_color: 'neon-xss-;<script>' } },
    });

    const accent = await cdp.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()
    );
    assert.equal(accent, '#7c6cff', `Unknown accent_color must fall back to #7c6cff, got "${accent}"`);
  });

  it('F5-T2-02: prefers-reduced-motion: reduce disables launcher transitions', async () => {
    await cdp.setReducedMotion(true);
    try {
      await cdp.openPage('index.html', { width: 980, height: 640 });
      const maxDur = await cdp.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, a, div'));
        let max = 0;
        for (const el of els.slice(0, 60)) {
          const cs = getComputedStyle(el);
          max = Math.max(max, parseFloat(cs.transitionDuration) || 0, parseFloat(cs.animationDuration) || 0);
        }
        return max;
      });
      assert.ok(maxDur <= 0.01, `Expected reduced motion to disable transitions <= 0.01s, got ${maxDur}s`);
    } finally {
      await cdp.setReducedMotion(false);
    }
  });

  it('F5-T2-03: Null/missing snippet, XSS title escaping, and empty scripts [] handling', async () => {
    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: {
        scripts: [
          {
            id: 'xss-1',
            title: '<script>window.__XSS_PWNED=true</script> & Long '.repeat(5),
            content: '',
            last_position: 0,
            speed: 2.5,
          },
        ],
      },
    });

    const res = await cdp.evaluate(() => ({
      pwned: Boolean(window.__XSS_PWNED),
      errors: document.body.innerText.length,
      hasEscapedText: document.body.innerText.includes('<script>'),
    }));
    assert.equal(res.pwned, false, 'XSS payload in script title must never execute');
    assert.ok(res.errors > 0, 'Launcher must render cleanly without crashing on empty content/snippet');

    // Empty list []
    await cdp.openPage('index.html', { width: 980, height: 640, tauriMock: { scripts: [] } });
    const emptyText = await cdp.evaluate(() => document.body.innerText);
    assert.match(emptyText, /new\s*script/i, 'Empty state must still present "New script" CTA');
  });

  it('F5-T2-04: Minimum window bounds (minWidth x minHeight) have zero horizontal overflow', async () => {
    const conf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    const launcher = conf.app?.windows?.find((w) => w.label === 'launcher');
    const minW = launcher?.minWidth || 740;
    const minH = launcher?.minHeight || 480;

    await cdp.openPage('index.html', { width: minW, height: minH });
    const overflow = await cdp.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    assert.ok(
      overflow.scrollWidth <= overflow.innerWidth + 1,
      `Horizontal overflow at ${minW}x${minH}: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
    );
  });

  it('F5-T2-05: WCAG AA contrast across all 6 accent presets and muted text', () => {
    const bg = '#0b0b12';
    const text = '#f4f4f8';
    const muted = 'rgba(244, 244, 248, 0.55)';
    assert.ok(contrastRatio(text, bg) >= 4.5, 'Primary text contrast must be >= 4.5:1');
    assert.ok(contrastRatio(muted, bg) >= 4.5, 'Muted text contrast must be >= 4.5:1');

    const accents = ['#7c6cff', '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4'];
    for (const hex of accents) {
      // Accent used as UI indicator/large highlight against dark #0b0b12 must achieve >= 3.0:1
      const ratioDark = contrastRatio(hex, bg);
      assert.ok(ratioDark >= 3.0, `Accent ${hex} on ${bg} contrast ${ratioDark.toFixed(2)} < 3.0:1`);
    }
  });

  it('F5-T2-06: Keyboard-only navigation & zero "Show HUD" grep in src/ and dist/', async () => {
    const files = [
      ...walkFiles(SRC_DIR, { extensions: ['.ts', '.tsx', '.html'] }),
      ...walkFiles(DIST_DIR, { extensions: ['.js', '.html'] }),
    ];
    for (const f of files) {
      const txt = readTextSafe(f);
      assert.doesNotMatch(txt, /Show HUD/, `Forbidden "Show HUD" string found in ${f}`);
    }

    await cdp.openPage('index.html', { width: 980, height: 640 });
    let reached = 0;
    for (let i = 0; i < 6; i++) {
      await cdp.pressKey('Tab', 'Tab', 9);
      const isFocused = await cdp.evaluate(() => document.activeElement && document.activeElement !== document.body);
      if (isFocused) reached++;
    }
    assert.ok(reached >= 3, `Expected keyboard Tab navigation across Launcher controls, reached ${reached}`);
  });
});
