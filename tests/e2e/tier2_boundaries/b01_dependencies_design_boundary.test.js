import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  DIST_DIR,
  SRC_DIR,
  VAULT_DIR,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { parseImageDimensions } from '../lib/media_probe.js';

describe('F1 — Dependencies & Design Docs Boundaries (Tier 2)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 980, height: 640 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F1-T2-01: Offline browser mode renders local fonts and UI with zero console errors', async () => {
    await cdp.setOffline(true);
    try {
      await cdp.openPage('index.html', { width: 980, height: 640 });
      const loaded = await cdp.evaluate(async () => {
        await document.fonts.ready;
        return Array.from(document.fonts)
          .filter((f) => f.status === 'loaded')
          .map((f) => f.family.replace(/['"]/g, ''));
      });
      assert.ok(loaded.some((f) => /inter/i.test(f)), 'Inter font must load offline from local bundle');
      assert.equal(cdp.getConsoleErrors().length, 0, `Offline mode console errors: ${cdp.getConsoleErrors().join('; ')}`);
    } finally {
      await cdp.setOffline(false);
    }
  });

  it('F1-T2-02: Zero-byte / corrupt / tiny vault screenshot rejection guard', () => {
    const designDir = path.join(VAULT_DIR, '04-Diseno');
    const images = walkFiles(designDir, { extensions: ['.png', '.jpg', '.jpeg', '.webp'] });
    assert.ok(images.length >= 2, 'vault/04-Diseno/ must contain screenshot artifacts');
    for (const img of images) {
      const info = parseImageDimensions(img);
      assert.ok(info.size > 1024, `Screenshot artifact unexpectedly small/empty: ${img} (${info.size} bytes)`);
      assert.ok(info.valid, `Corrupt or mismatched screenshot header: ${img}`);
      assert.ok(info.width > 100 && info.height > 100, `Tiny placeholder screenshot rejected: ${img} (${info.width}x${info.height})`);
    }
  });

  it('F1-T2-03: CSS token drift guard between Design-System.md and compiled dist/', async () => {
    const ds = readTextSafe(path.join(VAULT_DIR, '04-Diseno', 'Design-System.md'));
    await cdp.openPage('index.html', { width: 980, height: 640 });
    const rootTokens = await cdp.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        bg: cs.getPropertyValue('--bg').trim().toLowerCase(),
        accent: cs.getPropertyValue('--accent').trim().toLowerCase(),
        radiusWindow: cs.getPropertyValue('--radius-window').trim(),
        radiusCard: cs.getPropertyValue('--radius-card').trim(),
        radiusPill: cs.getPropertyValue('--radius-pill').trim(),
      };
    });

    assert.ok(ds.toLowerCase().includes(rootTokens.bg || 'MISSING'), `--bg "${rootTokens.bg}" drifted from Design-System.md`);
    assert.ok(ds.toLowerCase().includes(rootTokens.accent || 'MISSING'), `--accent "${rootTokens.accent}" drifted from Design-System.md`);
    assert.equal(rootTokens.radiusWindow, '22px');
    assert.equal(rootTokens.radiusCard, '14px');
    assert.equal(rootTokens.radiusPill, '999px');
  });

  it('F1-T2-04: External CDN URL negative regex across html, src/, and dist/', () => {
    const cdnRegex = /(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)/i;
    const filesToScan = [
      path.join(PROJECT_ROOT, 'index.html'),
      path.join(PROJECT_ROOT, 'hud.html'),
      ...walkFiles(SRC_DIR, { extensions: ['.ts', '.tsx', '.css', '.html'] }),
      ...walkFiles(DIST_DIR, { extensions: ['.html', '.css', '.js'] }),
    ].filter((f) => fs.existsSync(f));

    const hits = [];
    for (const f of filesToScan) {
      const txt = readTextSafe(f);
      if (cdnRegex.test(txt)) {
        hits.push(path.relative(PROJECT_ROOT, f));
      }
    }
    assert.deepEqual(hits, [], `Found forbidden external CDN URLs in: ${hits.join(', ')}`);
  });

  it('F1-T2-05: Font weight coverage boundary (Inter 400/500/600 & JetBrains Mono 400/500)', async () => {
    await cdp.openPage('index.html', { width: 980, height: 640 });
    const faces = await cdp.evaluate(async () => {
      await document.fonts.ready;
      return Array.from(document.fonts).map((f) => ({
        family: f.family.replace(/['"]/g, ''),
        weight: String(f.weight),
        status: f.status,
      }));
    });

    const interWeights = new Set(faces.filter((f) => /inter/i.test(f.family)).map((f) => f.weight));
    const monoWeights = new Set(faces.filter((f) => /jetbrains/i.test(f.family)).map((f) => f.weight));

    for (const w of ['400', '500', '600']) {
      assert.ok(interWeights.has(w), `Expected Inter font-weight ${w} bundled, found: ${Array.from(interWeights).join(', ')}`);
    }
    assert.ok(monoWeights.has('400') || monoWeights.has('500'), `Expected JetBrains Mono weights bundled, found: ${Array.from(monoWeights).join(', ')}`);
  });

  it('F1-T2-06: Design docs & vault/Log.md UTF-8 structural integrity boundary', () => {
    const mdFiles = [
      ...walkFiles(path.join(VAULT_DIR, '04-Diseno'), { extensions: ['.md'] }),
      path.join(VAULT_DIR, 'Log.md'),
    ];
    for (const f of mdFiles) {
      assert.ok(fs.existsSync(f), `Missing vault markdown: ${f}`);
      const buf = fs.readFileSync(f);
      assert.ok(!buf.includes(0x00), `NUL byte detected in ${f}`);
      const txt = buf.toString('utf8');
      assert.ok(txt.trim().length > 50, `Markdown file too short: ${f}`);
      assert.match(txt, /^#/m, `Expected markdown heading in ${f}`);
    }
    const logTxt = readTextSafe(path.join(VAULT_DIR, 'Log.md'));
    assert.match(logTxt, /Stealth|Design-System|fontsource/i, 'vault/Log.md must document Stealth/design progress');
  });
});
