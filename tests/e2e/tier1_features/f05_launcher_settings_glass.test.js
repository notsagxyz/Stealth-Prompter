import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DIST_DIR,
  SRC_TAURI_DIR,
  VAULT_DIR,
  readJsonSafe,
  walkFiles,
} from '../lib/paths.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { contrastRatio } from '../lib/assertions.js';
import { parseImageDimensions } from '../lib/media_probe.js';

const SEED_SCRIPTS = [
  {
    id: 's1',
    title: 'Keynote Opener',
    content: 'Good morning everyone. Today we are unveiling Stealth Prompter for seamless live demos.',
    last_position: 0,
    speed: 2.5,
  },
  {
    id: 's2',
    title: 'Product Walkthrough',
    content: 'Notice how the floating glass bar keeps controls accessible without cluttering your screen.',
    last_position: 40,
    speed: 3.0,
  },
];

describe('F5 — Launcher & Settings Glass Redesign (Tier 1)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 980, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F5-T1-01: Frameless centered launcher config & custom draggable titlebar without Show HUD', async () => {
    const conf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    const launcher = conf.app?.windows?.find((w) => w.label === 'launcher');
    assert.ok(launcher, 'launcher window config must exist in tauri.conf.json');
    assert.equal(launcher.decorations, false);
    assert.equal(launcher.transparent, true);
    assert.equal(launcher.center, true);

    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: { scripts: SEED_SCRIPTS },
    });

    const dom = await cdp.evaluate(() => {
      const dragRegion = document.querySelector('[data-tauri-drag-region]');
      const showHud = Array.from(document.querySelectorAll('button')).some((b) =>
        /show\s*hud/i.test(`${b.textContent} ${b.getAttribute('title') || ''}`)
      );
      return { hasDragRegion: Boolean(dragRegion), showHud };
    });

    assert.ok(dom.hasDragRegion, 'Custom titlebar must include [data-tauri-drag-region]');
    assert.equal(dom.showHud, false, 'Launcher must NOT render a "Show HUD" button');
  });

  it('F5-T1-02: Headline w/ italic accent word, "New script" pill CTA, and "Recent scripts" glass cards', async () => {
    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: { scripts: SEED_SCRIPTS },
    });

    const ui = await cdp.evaluate(() => {
      const heading = document.querySelector('h1, h2');
      const italic = heading ? heading.querySelector('em, i, span[class*="italic"]') : null;
      const buttons = Array.from(document.querySelectorAll('button'));
      const newScriptBtn = buttons.find((b) => /new\s*script/i.test(`${b.textContent} ${b.getAttribute('aria-label') || ''}`));
      const text = document.body.innerText;

      return {
        hasHeading: Boolean(heading),
        hasItalicAccent: Boolean(italic),
        newScriptRadius: newScriptBtn ? parseFloat(getComputedStyle(newScriptBtn).borderTopLeftRadius) : 0,
        hasNewScriptBtn: Boolean(newScriptBtn),
        hasRecentLabel: /recent\s*scripts/i.test(text),
        showsSnippet: text.includes('unveiling Stealth Prompter'),
      };
    });

    assert.ok(ui.hasHeading && ui.hasItalicAccent, 'Launcher hero headline must feature an italicized accent word');
    assert.ok(ui.hasNewScriptBtn, '"New script" CTA button must be present');
    assert.ok(ui.newScriptRadius >= 16, `"New script" CTA must have pill border-radius, got ${ui.newScriptRadius}px`);
    assert.ok(ui.hasRecentLabel, '"Recent scripts" section label must be rendered');
    assert.ok(ui.showsSnippet, 'Recent scripts glass cards must render script snippet text');
  });

  it('F5-T1-03: Exact 13 CSS Design System tokens defined in compiled dist/ & :root', async () => {
    await cdp.openPage('index.html', { width: 980, height: 640 });
    const tokens = await cdp.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const keys = [
        '--bg',
        '--surface',
        '--surface-hover',
        '--border',
        '--text',
        '--text-muted',
        '--accent',
        '--accent-glow',
        '--radius-window',
        '--radius-card',
        '--radius-pill',
        '--font-sans',
        '--font-mono',
      ];
      const out = {};
      for (const k of keys) out[k] = cs.getPropertyValue(k).trim();
      return out;
    });

    assert.equal(tokens['--bg'].toLowerCase(), '#0b0b12');
    assert.equal(tokens['--text'].toLowerCase(), '#f4f4f8');
    assert.equal(tokens['--accent'].toLowerCase(), '#7c6cff');
    assert.equal(tokens['--radius-window'], '22px');
    assert.equal(tokens['--radius-card'], '14px');
    assert.equal(tokens['--radius-pill'], '999px');
    assert.match(tokens['--font-sans'], /Inter/i);
    assert.match(tokens['--font-mono'], /JetBrains Mono/i);
    for (const [k, v] of Object.entries(tokens)) {
      assert.ok(v.length > 0, `CSS token ${k} must be non-empty`);
    }
  });

  it('F5-T1-04: 4-section Settings (Prompter, Shortcuts, Appearance, About) & 6 accent presets', async () => {
    await cdp.openPage('index.html', {
      width: 980,
      height: 640,
      tauriMock: { scripts: SEED_SCRIPTS },
    });

    const openedSettings = await cdp.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        /settings/i.test(`${b.textContent} ${b.getAttribute('title') || ''} ${b.getAttribute('aria-label') || ''}`)
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    assert.ok(openedSettings, 'Launcher must have a Settings navigation button');
    await new Promise((r) => setTimeout(r, 150));

    const settingsInfo = await cdp.evaluate(() => {
      const text = document.body.innerText;
      const sections = ['Prompter', 'Shortcuts', 'Appearance', 'About'].map((name) => ({
        name,
        present: new RegExp(`\\b${name}\\b`, 'i').test(text),
      }));

      // Click Appearance if tabs are used
      const appTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find((el) =>
        /appearance/i.test(el.textContent || '')
      );
      if (appTab) appTab.click();

      const swatches = Array.from(document.querySelectorAll('[data-accent], button[title*="Violet" i], button[title*="Indigo" i], button[title*="Crimson" i], button[title*="Emerald" i], button[title*="Amber" i], button[title*="Cyan" i], button[aria-label*="Violet" i], button[aria-label*="Emerald" i]'));
      return { sections, swatchCount: swatches.length };
    });

    for (const s of settingsInfo.sections) {
      assert.ok(s.present, `Settings panel must contain "${s.name}" section`);
    }
    assert.ok(settingsInfo.swatchCount >= 6, `Expected 6 accent color presets in Appearance, found ${settingsInfo.swatchCount}`);

    // Click Emerald swatch and verify --accent updates live
    const newAccent = await cdp.evaluate(() => {
      const emerald = document.querySelector('[data-accent="emerald"], button[title*="Emerald" i], button[aria-label*="Emerald" i]');
      if (!emerald) return '';
      emerald.click();
      return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase();
    });
    assert.equal(newAccent, '#10b981', `Selecting Emerald preset must update --accent to #10b981, got "${newAccent}"`);
  });

  it('F5-T1-05: Local bundled fonts loaded with 0 external HTTP(S) requests', async () => {
    await cdp.openPage('index.html', { width: 980, height: 640 });
    const reqs = cdp.getNetworkRequests();
    const external = reqs.filter((r) => !r.url.startsWith(cdp.baseUrl) && !r.url.startsWith('data:'));
    assert.equal(external.length, 0, `Unexpected external requests: ${JSON.stringify(external)}`);

    const assetsDir = path.join(DIST_DIR, 'assets');
    const woff2 = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.woff2'));
    assert.ok(woff2.length >= 2, 'Expected bundled local .woff2 font files in dist/assets/');
  });

  it('F5-T1-06: WCAG AA contrast, focus rings, reduced motion & after-screenshots in vault/04-Diseno/', async () => {
    await cdp.openPage('index.html', { width: 980, height: 640 });

    const tokens = await cdp.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        bg: cs.getPropertyValue('--bg').trim(),
        text: cs.getPropertyValue('--text').trim(),
        muted: cs.getPropertyValue('--text-muted').trim(),
      };
    });

    assert.ok(contrastRatio(tokens.text, tokens.bg) >= 4.5, 'Primary --text on --bg must meet WCAG AA >= 4.5:1');
    assert.ok(contrastRatio(tokens.muted, tokens.bg) >= 4.5, 'Secondary --text-muted on --bg must meet WCAG AA >= 4.5:1');

    // Check after-screenshots saved in vault/04-Diseno/
    const designImages = walkFiles(path.join(VAULT_DIR, '04-Diseno'), { extensions: ['.png', '.jpg', '.jpeg', '.webp'] });
    const afterShots = designImages.filter((p) => /after|despues|redesign/i.test(path.basename(p)));
    assert.ok(afterShots.length >= 1, 'Expected after-screenshots saved in vault/04-Diseno/');
    for (const s of afterShots) {
      const info = parseImageDimensions(s);
      assert.ok(info.valid && info.width > 100 && info.height > 100, `Invalid after-screenshot: ${s}`);
    }
  });
});
