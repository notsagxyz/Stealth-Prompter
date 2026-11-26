import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { SRC_TAURI_DIR, readTextSafe } from '../lib/paths.js';
import { execCargo } from '../lib/exec.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { extractTranslateY } from '../lib/assertions.js';

const LONG_SCRIPT = {
  id: 'boundary-scroll',
  title: 'Boundary Script',
  content: Array.from({ length: 30 }, (_, i) => `Line ${i + 1}: Testing scroll clamping boundaries in Stealth.`).join('\n\n'),
  last_position: 0,
  speed: 2.5,
  cues: [],
};

const SHORT_SCRIPT = {
  id: 'short-scroll',
  title: 'Short Script',
  content: 'Line 1\nLine 2\nLine 3',
  last_position: 0,
  speed: 2.5,
  cues: [],
};

describe('F3 — Scroll Engine & Hotkeys Boundaries (Tier 2)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 1000, height: 350 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F3-T2-01: Opacity clamping (9% / -0.5 -> 10%, 10% -> 10%, 100% -> 100%, 101% -> 100%, NaN fallback)', async () => {
    const modelsRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'storage', 'models.rs'));
    assert.match(modelsRs, /clamp\(\s*0\.10?\s*,\s*1\.0\s*\)/, 'Rust Settings::clamp() must enforce window_opacity.clamp(0.10, 1.0)');

    const res = await execCargo(['test', '--lib', 'storage::engine::tests::test_settings_clamp']);
    assert.equal(res.status, 0, `Rust clamp test failed:\n${res.stdout}\n${res.stderr}`);
  });

  it('F3-T2-02: Scroll top clamping (scrollY = 0 with upward negative wheel/drag/rewind)', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: { windowLabel: 'prompter', scripts: [LONG_SCRIPT] },
    });

    await cdp.dispatchWheel(500, 200, 0, -600);
    await cdp.drag(500, 120, 500, 300, 6);
    await cdp.evaluate(() => {
      window.__STEALTH_TEST_HARNESS__.emitEvent('prompter:action', { type: 'scroll_up' });
      window.__STEALTH_TEST_HARNESS__.emitEvent('prompter:action', { type: 'rewind' });
    });
    await new Promise((r) => setTimeout(r, 120));

    const transform = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      return el ? getComputedStyle(el).transform : '';
    });
    const ty = extractTranslateY(transform);
    assert.ok(!Number.isNaN(ty), `Transform Y must not be NaN, got "${transform}"`);
    assert.ok(ty <= 0 && Math.abs(ty) <= 1, `Expected scroll top clamped at 0, got Y=${ty}`);
  });

  it('F3-T2-03: Scroll bottom clamping (maxScroll ceiling on short script with huge downward delta)', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: { windowLabel: 'prompter', scripts: [SHORT_SCRIPT] },
    });

    await cdp.dispatchWheel(500, 200, 0, 50000);
    await cdp.dispatchWheel(500, 200, 0, 50000);
    await new Promise((r) => setTimeout(r, 120));

    const metrics = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      const cs = el ? getComputedStyle(el) : null;
      return {
        transform: cs ? cs.transform : '',
        scrollHeight: el ? el.scrollHeight : 0,
      };
    });
    const ty = Math.abs(extractTranslateY(metrics.transform));
    assert.ok(Number.isFinite(ty), `Scroll Y must stay finite, got "${metrics.transform}"`);
    assert.ok(
      ty <= Math.max(metrics.scrollHeight + 400, 1500),
      `Expected scroll bottom clamped reasonably, got Y=${ty} for 3-line script`
    );
  });

  it('F3-T2-04: Manual wheel & drag in Mirror mode retains scaleX(-1) and scrolls downward cleanly', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { mirror_mode: true, click_through: false },
        scripts: [LONG_SCRIPT],
      },
    });

    await cdp.dispatchWheel(500, 200, 0, 160);
    await new Promise((r) => setTimeout(r, 120));

    const transform = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      return el ? getComputedStyle(el).transform : '';
    });
    // matrix(-1, 0, 0, 1, 0, -ty) has first element -1
    const m = transform.match(/^matrix\(([^)]+)\)$/);
    assert.ok(m, `Expected 2D/3D transform matrix in Mirror mode, got "${transform}"`);
    const parts = m[1].split(',').map(Number);
    assert.equal(parts[0], -1, `Expected horizontal mirror scaleX(-1), got matrix[0]=${parts[0]}`);
    assert.ok(Math.abs(parts[5]) > 20, `Expected manual wheel scroll to advance Y in Mirror mode, got Y=${parts[5]}`);
  });

  it('F3-T2-05: Rapid wheel/drag/play storm stability (zero NaN or runaway drift)', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: { windowLabel: 'prompter', scripts: [LONG_SCRIPT] },
    });

    for (let i = 0; i < 12; i++) {
      await cdp.dispatchWheel(500, 200, 0, i % 2 === 0 ? 45 : -15);
      if (i % 3 === 0) {
        await cdp.evaluate(() => {
          document.querySelector('button[title*="Play" i], button[title*="Pause" i], button[aria-label*="Play" i], button[aria-label*="Pause" i]')?.click();
        });
      }
    }
    await new Promise((r) => setTimeout(r, 150));

    const transform = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      return el ? getComputedStyle(el).transform : '';
    });
    assert.ok(!/nan/i.test(transform), `Transform must never contain NaN after rapid input storm: "${transform}"`);
    const ty = extractTranslateY(transform);
    assert.ok(Number.isFinite(ty), `Scroll Y must remain finite after rapid storm, got ${ty}`);
  });

  it('F3-T2-06: Pointer & wheel ignored on HUD DOM when click_through: true', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { click_through: true },
        scripts: [LONG_SCRIPT],
      },
    });

    const pe = await cdp.evaluate(() => {
      const root = document.querySelector('#root > div, body > div');
      return root ? getComputedStyle(root).pointerEvents : '';
    });
    assert.equal(pe, 'none', 'HUD root must set pointer-events: none when click_through is enabled');
  });
});
