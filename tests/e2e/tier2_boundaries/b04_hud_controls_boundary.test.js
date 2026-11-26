import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { SCRIPTS_DIR, readTextSafe } from '../lib/paths.js';
import { execCargo, execPowershell } from '../lib/exec.js';
import { createSandbox } from '../lib/temp_sandbox.js';
import { launchCdpSession } from '../lib/cdp_browser.js';

describe('F4 — HUD Controls & Capture Exclusion Boundaries (Tier 2)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 1000, height: 350 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F4-T2-01: HUD opacity slider enforces min=10% and max=100% bounds', async () => {
    await cdp.openPage('hud.html', { width: 1000, height: 350, tauriMock: { windowLabel: 'prompter' } });

    const sliderInfo = await cdp.evaluate(() => {
      const slider = document.querySelector('input[type="range"]');
      if (!slider) return null;
      return {
        min: Number(slider.min),
        max: Number(slider.max),
      };
    });

    assert.ok(sliderInfo, 'HUD floating bar must include an opacity range slider');
    const validNormalized = sliderInfo.min === 0.1 && sliderInfo.max === 1;
    const validPercent = sliderInfo.min === 10 && sliderInfo.max === 100;
    assert.ok(
      validNormalized || validPercent,
      `Opacity slider must enforce 10%..100% (0.1..1 or 10..100), got min=${sliderInfo.min}, max=${sliderInfo.max}`
    );
  });

  it('F4-T2-02: Font size -/+ buttons clamp cleanly within safe bounds without NaN or <= 0', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: { windowLabel: 'prompter', settings: { font_size: 20 } },
    });

    const result = await cdp.evaluate(() => {
      const down = Array.from(document.querySelectorAll('button')).find((b) => /font.*down|smaller|decrease.*font/i.test(`${b.title} ${b.ariaLabel} ${b.textContent}`));
      const up = Array.from(document.querySelectorAll('button')).find((b) => /font.*up|larger|increase.*font/i.test(`${b.title} ${b.ariaLabel} ${b.textContent}`));
      if (!down || !up) return { missing: true };

      for (let i = 0; i < 40; i++) down.click();
      const textEl = document.querySelector('main .will-change-transform, main [style*="font-size"]');
      const minSize = textEl ? parseFloat(getComputedStyle(textEl).fontSize) : 0;

      for (let i = 0; i < 60; i++) up.click();
      const maxSize = textEl ? parseFloat(getComputedStyle(textEl).fontSize) : 0;

      return { missing: false, minSize, maxSize };
    });

    assert.equal(result.missing, false, 'HUD must provide Font -/+ buttons');
    assert.ok(result.minSize >= 8 && result.minSize <= 24, `Minimum font size clamped unexpectedly: ${result.minSize}px`);
    assert.ok(result.maxSize >= 64 && result.maxSize <= 160, `Maximum font size clamped unexpectedly: ${result.maxSize}px`);
  });

  it('F4-T2-03: Click-Through tooltip explicitly documents global scroll and opacity shortcuts', async () => {
    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: { windowLabel: 'prompter', settings: { click_through: true } },
    });

    const helpText = await cdp.evaluate(() => {
      const attrs = Array.from(document.querySelectorAll('[title], [aria-label], [data-tooltip]'))
        .map((el) => `${el.getAttribute('title') || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('data-tooltip') || ''}`)
        .join(' ');
      return `${document.body.innerText} ${attrs}`;
    });

    assert.match(helpText, /scroll/i, 'Click-through help/tooltip must document global scroll shortcut');
    assert.match(helpText, /opacity|transparen/i, 'Click-through help/tooltip must document global opacity shortcut');
  });

  it('F4-T2-04: Minimum HUD viewport (300x150) keeps essential controls inside viewport without overflow', async () => {
    await cdp.openPage('hud.html', { width: 300, height: 150, tauriMock: { windowLabel: 'prompter' } });

    const layout = await cdp.evaluate(() => {
      const playBtn = document.querySelector('button[title*="Play" i], button[aria-label*="Play" i]');
      const closeBtn = document.querySelector('button[title*="Close" i], button[title*="Hide" i], button[aria-label*="Close" i]');
      const playRect = playBtn ? playBtn.getBoundingClientRect() : null;
      const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
      return {
        playRect: playRect ? { right: playRect.right, bottom: playRect.bottom } : null,
        closeRect: closeRect ? { right: closeRect.right, bottom: closeRect.bottom } : null,
      };
    });

    assert.ok(layout.playRect && layout.playRect.right <= 302 && layout.playRect.bottom <= 152, 'Play button clipped at 300x150');
    assert.ok(layout.closeRect && layout.closeRect.right <= 302 && layout.closeRect.bottom <= 152, 'Close button clipped at 300x150');
  });

  it('F4-T2-05: prefers-reduced-motion collapses HUD transitions cleanly', async () => {
    await cdp.setReducedMotion(true);
    try {
      await cdp.openPage('hud.html', { width: 1000, height: 350, tauriMock: { windowLabel: 'prompter' } });
      const durations = await cdp.evaluate(() => {
        const els = Array.from(document.querySelectorAll('header, button, [data-testid="hud-control-bar"]'));
        return els.map((el) => parseFloat(getComputedStyle(el).transitionDuration) || 0);
      });
      const maxDur = Math.max(0, ...durations);
      assert.ok(maxDur <= 0.01, `Expected reduced motion to collapse HUD transitions <= 0.01s, got ${maxDur}s`);
    } finally {
      await cdp.setReducedMotion(false);
    }
  });

  it('F4-T2-06: Capture exclusion negative control (WDA_NONE leaks > 0 vs 0x11 = 0) & HWND/OS guards', async () => {
    const res = await execCargo(['test', '--lib', 'platform::']);
    assert.equal(res.status, 0, `Rust platform:: tests failed:\n${res.stdout}\n${res.stderr}`);

    const sandbox = createSandbox('stealth-b04-invis-');
    try {
      const reportPath = sandbox.makeTempFile('report.json', '');
      const psRes = await execPowershell(path.join(SCRIPTS_DIR, 'verify_invisibility.ps1'), [
        '-Canary',
        '-NonInteractive',
        '-ReportPath',
        reportPath,
      ]);
      assert.equal(psRes.status, 0);
      const report = JSON.parse(readTextSafe(reportPath).replace(/^\uFEFF/, ''));
      assert.ok(report.phases.control.canaryPixelsFound > 0, 'Negative control (WDA_NONE) must leak >0 canary pixels');
      assert.equal(report.phases.test.canaryPixelsFound, 0, 'WDA_EXCLUDEFROMCAPTURE must exclude all canary pixels');
    } finally {
      sandbox.cleanup();
    }
  });
});
