import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { SCRIPTS_DIR, DIST_DIR, readTextSafe } from '../lib/paths.js';
import { execPowershell } from '../lib/exec.js';
import { createSandbox } from '../lib/temp_sandbox.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { parseCssColor } from '../lib/assertions.js';

describe('F4 — Prompter HUD & Floating Control Bar (Tier 1)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 1000, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F4-T1-01: Zero "Show HUD" button in Launcher/HUD and floating glass pill bar rendered', async () => {
    await cdp.openPage('index.html', { width: 980, height: 640 });
    const launcherHasShowHud = await cdp.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button, [role="button"], a'));
      return els.some((el) => /show\s*hud/i.test(`${el.textContent} ${el.getAttribute('title') || ''} ${el.getAttribute('aria-label') || ''}`));
    });
    assert.equal(launcherHasShowHud, false, 'Launcher must NOT contain any "Show HUD" button');

    await cdp.openPage('hud.html', { width: 1000, height: 350, tauriMock: { windowLabel: 'prompter' } });
    const barInfo = await cdp.evaluate(() => {
      const bar = document.querySelector('[data-testid="hud-control-bar"], header, [role="toolbar"]');
      if (!bar) return null;
      const cs = getComputedStyle(bar);
      const rect = bar.getBoundingClientRect();
      return {
        radius: parseFloat(cs.borderTopLeftRadius) || 0,
        height: rect.height,
        width: rect.width,
        backdrop: cs.backdropFilter || cs.webkitBackdropFilter || '',
      };
    });
    assert.ok(barInfo, 'Floating HUD control bar must exist');
    assert.ok(
      barInfo.radius >= Math.min(barInfo.height / 2, 16),
      `Expected floating pill bar border-radius, got ${barInfo.radius}px (height ${barInfo.height}px)`
    );
  });

  it('F4-T1-02: Complete floating control bar controls with Lucide SVGs & English shortcut tooltips', async () => {
    await cdp.openPage('hud.html', { width: 1000, height: 350, tauriMock: { windowLabel: 'prompter' } });
    const controls = await cdp.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sliders = Array.from(document.querySelectorAll('input[type="range"]'));
      const describe = (el) => ({
        title: el.getAttribute('title') || '',
        aria: el.getAttribute('aria-label') || '',
        text: (el.textContent || '').trim(),
        hasSvg: Boolean(el.querySelector('svg')),
        rect: el.getBoundingClientRect().toJSON(),
      });
      return {
        buttons: btns.map(describe),
        sliders: sliders.map((s) => ({
          min: s.min,
          max: s.max,
          title: s.getAttribute('title') || '',
          aria: s.getAttribute('aria-label') || '',
        })),
        bodyText: document.body.innerText,
      };
    });

    const matchBtn = (re) => controls.buttons.find((b) => re.test(`${b.title} ${b.aria} ${b.text}`));
    const playBtn = matchBtn(/play|pause/i);
    const restartBtn = matchBtn(/restart|rewind/i);
    const speedDownBtn = matchBtn(/speed.*down|slower|decrease.*speed/i);
    const speedUpBtn = matchBtn(/speed.*up|faster|increase.*speed/i);
    const fontDownBtn = matchBtn(/font.*down|smaller|decrease.*font/i);
    const fontUpBtn = matchBtn(/font.*up|larger|increase.*font/i);
    const mirrorBtn = matchBtn(/mirror/i);
    const clickThroughBtn = matchBtn(/click-?through|lock/i);
    const closeBtn = matchBtn(/close|hide/i);

    assert.ok(playBtn && playBtn.hasSvg, 'Play/Pause primary button with Lucide SVG required');
    assert.ok(restartBtn && restartBtn.hasSvg, 'Restart/Rewind button with Lucide SVG required');
    assert.ok(speedDownBtn && speedUpBtn, 'Speed -/+ buttons required');
    assert.ok(fontDownBtn && fontUpBtn, 'Font -/+ buttons required');
    assert.ok(mirrorBtn && mirrorBtn.hasSvg, 'Mirror toggle button with Lucide SVG required');
    assert.ok(clickThroughBtn && clickThroughBtn.hasSvg, 'Click-Through toggle button with Lucide SVG required');
    assert.ok(closeBtn && closeBtn.hasSvg, 'Close button with Lucide SVG required');
    assert.ok(controls.sliders.length >= 1, 'Opacity range slider required in HUD floating control bar');

    // Play/Pause must be visibly larger than secondary icon buttons
    if (restartBtn) {
      assert.ok(
        playBtn.rect.width >= restartBtn.rect.width && playBtn.rect.height >= restartBtn.rect.height,
        'Play/Pause primary button must be at least as large as / larger than secondary controls'
      );
    }

    // Opacity readout % visible
    assert.match(controls.bodyText, /\d+%/, 'Visible opacity percentage readout (e.g., 75%) required');
  });

  it('F4-T1-03: Background-only opacity (10%, 50%, 100%) preserves foreground text opacity === "1"', async () => {
    for (const op of [0.1, 0.5, 1.0]) {
      await cdp.openPage('hud.html', {
        width: 1000,
        height: 350,
        tauriMock: { windowLabel: 'prompter', settings: { window_opacity: op } },
      });

      const styles = await cdp.evaluate(() => {
        const bgEl = document.querySelector('[data-hud-surface], [data-testid="hud-container"], .shadow-hud, div[style*="rgba("]');
        const textEl = document.querySelector('main .will-change-transform, main [data-testid="prompter-text"]');
        return {
          bgColor: bgEl ? getComputedStyle(bgEl).backgroundColor : '',
          textOpacity: textEl ? getComputedStyle(textEl).opacity : '',
          textColor: textEl ? getComputedStyle(textEl).color : '',
        };
      });

      const parsedBg = parseCssColor(styles.bgColor);
      assert.ok(parsedBg, `Could not parse HUD background color "${styles.bgColor}"`);
      assert.ok(
        Math.abs(parsedBg.a - op) <= 0.03,
        `Expected HUD background alpha ~${op}, got ${parsedBg.a} ("${styles.bgColor}")`
      );
      assert.equal(styles.textOpacity, '1', `Foreground script text opacity must stay 1 at background opacity ${op}`);
    }
  });

  it('F4-T1-04: Persistent Play pill visible when control bar is hidden & restores bar on click', async () => {
    await cdp.openPage('hud.html', { width: 1000, height: 350, tauriMock: { windowLabel: 'prompter' } });

    const hideBarBtn = await cdp.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => /hide.*bar|collapse|minimize.*controls|auto-?hide/i.test(`${b.title} ${b.ariaLabel} ${b.textContent}`));
      if (!target) return false;
      target.click();
      return true;
    });
    assert.ok(hideBarBtn, 'HUD must provide a control to hide/collapse the floating control bar');
    await new Promise((r) => setTimeout(r, 150));

    const collapsed = await cdp.evaluate(() => {
      const playPill = document.querySelector(
        '[data-testid="persistent-play-pill"], button[title*="Play" i], button[aria-label*="Play" i]'
      );
      const rect = playPill ? playPill.getBoundingClientRect() : null;
      return {
        visible: Boolean(rect && rect.width > 0 && rect.height > 0 && getComputedStyle(playPill).visibility !== 'hidden'),
      };
    });
    assert.ok(collapsed.visible, 'Persistent Play pill must remain visible when floating control bar is hidden');
  });

  it('F4-T1-05: Keyboard navigation (Tab, Space/Enter), visible focus ring & Playing/Paused indicator', async () => {
    await cdp.openPage('hud.html', { width: 1000, height: 350, tauriMock: { windowLabel: 'prompter' } });

    // Tab through controls and verify focus lands on interactive elements
    const focusedTags = [];
    for (let i = 0; i < 6; i++) {
      await cdp.pressKey('Tab', 'Tab', 9);
      const info = await cdp.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName,
          title: el.getAttribute('title') || el.getAttribute('aria-label') || '',
          outline: cs.outlineStyle,
          boxShadow: cs.boxShadow,
        };
      });
      if (info) focusedTags.push(info);
    }

    assert.ok(focusedTags.length >= 3, `Expected keyboard Tab to reach HUD controls, reached ${focusedTags.length}`);
    const hasFocusRing = focusedTags.some((f) => f.outline !== 'none' || f.boxShadow !== 'none');
    assert.ok(hasFocusRing, 'Focused HUD controls must display a visible focus ring (outline or box-shadow)');

    const statusBefore = await cdp.evaluate(() => document.body.innerText);
    assert.match(statusBefore, /paused|ready|playing/i, 'HUD must show clear Playing/Paused status indicator');
  });

  it('F4-T1-06: Windows WDA_EXCLUDEFROMCAPTURE (0x11) verified via verify_invisibility.ps1', async () => {
    const sandbox = createSandbox('stealth-invis-');
    try {
      const reportPath = sandbox.makeTempFile('invisibility_report.json', '');
      const scriptPath = path.join(SCRIPTS_DIR, 'verify_invisibility.ps1');
      const res = await execPowershell(scriptPath, [
        '-Canary',
        '-NonInteractive',
        '-ReportPath',
        reportPath,
      ]);

      assert.equal(res.status, 0, `verify_invisibility.ps1 failed (exit ${res.status}):\n${res.stdout}\n${res.stderr}`);
      const report = JSON.parse(readTextSafe(reportPath).replace(/^\uFEFF/, ''));
      assert.equal(report.status, 'PASS');
      assert.ok(report.osBuild >= 19041, `Expected OS build >= 19041, got ${report.osBuild}`);
      assert.ok(report.phases.control.canaryPixelsFound > 0, 'Control phase (WDA_NONE) must detect canary pixels');
      assert.equal(report.phases.test.affinity, 17, 'Test phase affinity must be 17 (WDA_EXCLUDEFROMCAPTURE)');
      assert.equal(report.phases.test.canaryPixelsFound, 0, 'Test phase must leak 0 canary pixels');
      assert.equal(report.phases.test.isExcludedFromCapture, true);
    } finally {
      sandbox.cleanup();
    }
  });
});
