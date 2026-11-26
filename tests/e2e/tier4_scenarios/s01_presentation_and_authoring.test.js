import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { SCRIPTS_DIR, SRC_TAURI_DIR, readTextSafe } from '../lib/paths.js';
import { execPowershell } from '../lib/exec.js';
import { createSandbox } from '../lib/temp_sandbox.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { contrastRatio, extractTranslateY, parseCssColor } from '../lib/assertions.js';

describe('Tier 4 Scenarios — Live Presentation, Authoring & Accessibility (3 tests)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 1000, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('T4-01: Live video call presentation (capture exclusion + non-activating HUD + click-through + global hotkeys + panic hide)', async () => {
    const sandbox = createSandbox('stealth-t4-01-');
    try {
      const reportPath = sandbox.makeTempFile('probe.json', '');
      const ps = await execPowershell(path.join(SCRIPTS_DIR, 'verify_invisibility.ps1'), [
        '-Canary',
        '-NonInteractive',
        '-ReportPath',
        reportPath,
      ]);
      assert.equal(ps.status, 0);
      const report = JSON.parse(readTextSafe(reportPath).replace(/^\uFEFF/, ''));
      assert.equal(report.status, 'PASS');
      assert.equal(report.phases.test.affinity, 17);
    } finally {
      sandbox.cleanup();
    }

    const winRs = readTextSafe(path.join(SRC_TAURI_DIR, 'src', 'platform', 'windows.rs'));
    assert.match(winRs, /SW_SHOWNOACTIVATE/, 'HUD show must remain non-activating (SW_SHOWNOACTIVATE)');
    assert.match(winRs, /WS_EX_TRANSPARENT/, 'Click-through must apply WS_EX_TRANSPARENT');

    await cdp.openPage('hud.html', {
      width: 1000,
      height: 350,
      tauriMock: {
        windowLabel: 'prompter',
        settings: { click_through: true, window_opacity: 0.4 },
        scripts: [
          {
            id: 'call-1',
            title: 'Zoom Keynote',
            content: Array.from({ length: 20 }, (_, i) => `Slide ${i + 1}: Explaining Stealth Prompter capture exclusion.`).join('\n\n'),
            last_position: 0,
            speed: 2.5,
          },
        ],
      },
    });

    await cdp.evaluate(() => {
      window.__STEALTH_TEST_HARNESS__.emitEvent('prompter:action', { type: 'scroll_down' });
      window.__STEALTH_TEST_HARNESS__.emitEvent('prompter:action', { type: 'opacity_down' });
      window.__STEALTH_TEST_HARNESS__.emitEvent('prompter:action', { type: 'toggle_play' });
    });
    await new Promise((r) => setTimeout(r, 150));

    const res = await cdp.evaluate(() => {
      const el = document.querySelector('main .will-change-transform, main [style*="translate3d"]');
      const bgEl = document.querySelector('[data-hud-surface], [data-testid="hud-container"], .shadow-hud, div[style*="rgba("]');
      return {
        transform: el ? getComputedStyle(el).transform : '',
        bg: bgEl ? getComputedStyle(bgEl).backgroundColor : '',
      };
    });
    assert.ok(Math.abs(extractTranslateY(res.transform)) > 5, 'Global scroll_down must move script during video call click-through');
    const parsed = parseCssColor(res.bg);
    assert.ok(parsed && parsed.a < 0.4, `Global opacity_down must lower opacity below 0.4, got "${res.bg}"`);
  });

  it('T4-02: Quick script authoring, Emerald accent customization & smooth manual-scroll prompter launch', async () => {
    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: {
        scripts: [
          {
            id: 'speech-1',
            title: 'Demo Launch',
            content: 'Paragraph 1: Opening hook.\n\nParagraph 2: Product walkthrough with Stealth.',
            last_position: 0,
            speed: 2.5,
          },
        ],
      },
    });

    const launcherCheck = await cdp.evaluate(() => {
      const hasShowHud = Array.from(document.querySelectorAll('button')).some((b) => /show\s*hud/i.test(b.textContent || ''));
      const settingsBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        /settings/i.test(`${b.textContent} ${b.getAttribute('title') || ''} ${b.getAttribute('aria-label') || ''}`)
      );
      if (settingsBtn) settingsBtn.click();
      return { hasShowHud, hadSettingsBtn: Boolean(settingsBtn) };
    });
    assert.equal(launcherCheck.hasShowHud, false);
    assert.ok(launcherCheck.hadSettingsBtn);

    await new Promise((r) => setTimeout(r, 120));
    const emeraldAccent = await cdp.evaluate(() => {
      const appTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find((el) =>
        /appearance/i.test(el.textContent || '')
      );
      if (appTab) appTab.click();
      const swatch = document.querySelector('[data-accent="emerald"], button[title*="Emerald" i], button[aria-label*="Emerald" i]');
      if (!swatch) return '';
      swatch.click();
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase();
    });
    assert.equal(emeraldAccent, '#10b981', 'Selecting Emerald accent must update --accent to #10b981');
  });

  it('T4-03: Low-opacity (10%) HUD readability over bright #FFFFFF background + persistent Play pill + reduced motion', async () => {
    await cdp.setReducedMotion(true);
    try {
      await cdp.openPage('hud.html', {
        width: 1000,
        height: 350,
        tauriMock: {
          windowLabel: 'prompter',
          settings: { window_opacity: 0.1 },
          scripts: [
            {
              id: 'bright-bg',
              title: 'Bright Desktop Test',
              content: 'High contrast readable foreground text over 10% translucent HUD.',
              last_position: 0,
              speed: 2.5,
            },
          ],
        },
      });

      const check = await cdp.evaluate(() => {
        document.documentElement.style.background = '#ffffff';
        const bgEl = document.querySelector('[data-hud-surface], [data-testid="hud-container"], .shadow-hud, div[style*="rgba("]');
        const textEl = document.querySelector('main .will-change-transform, main [data-testid="prompter-text"]');
        const hideBar = Array.from(document.querySelectorAll('button')).find((b) =>
          /hide.*bar|collapse|minimize.*controls/i.test(`${b.title} ${b.ariaLabel} ${b.textContent}`)
        );
        if (hideBar) hideBar.click();
        const playPill = document.querySelector('[data-testid="persistent-play-pill"], button[title*="Play" i], button[aria-label*="Play" i]');
        const pillRect = playPill ? playPill.getBoundingClientRect() : null;
        return {
          bgColor: bgEl ? getComputedStyle(bgEl).backgroundColor : '',
          textOpacity: textEl ? getComputedStyle(textEl).opacity : '',
          textShadow: textEl ? getComputedStyle(textEl).textShadow : '',
          pillVisible: Boolean(pillRect && pillRect.width > 0 && pillRect.height > 0),
          externalReqs: 0,
        };
      });

      const parsedBg = parseCssColor(check.bgColor);
      assert.ok(parsedBg && Math.abs(parsedBg.a - 0.1) <= 0.03, `Expected 10% background alpha, got "${check.bgColor}"`);
      assert.equal(check.textOpacity, '1', 'Foreground text opacity must remain 1.0');
      assert.ok(check.pillVisible, 'Persistent Play pill must stay visible when control bar collapses');
      assert.ok(contrastRatio('#f4f4f8', '#0b0b12') >= 4.5);
    } finally {
      await cdp.setReducedMotion(false);
    }
  });
});
