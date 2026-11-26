import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  DIST_DIR,
  VAULT_DIR,
  readJsonSafe,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { launchCdpSession } from '../lib/cdp_browser.js';
import { parseImageDimensions } from '../lib/media_probe.js';

describe('F1 — Dependencies & Design Docs (Tier 1)', () => {
  let cdp;

  before(async () => {
    cdp = await launchCdpSession({ width: 1000, height: 700 });
  });

  after(async () => {
    if (cdp) await cdp.close();
  });

  it('F1-T1-01: Required npm dependencies installed in package.json and node_modules', () => {
    const pkg = readJsonSafe(path.join(PROJECT_ROOT, 'package.json'));
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const required = [
      '@fontsource/inter',
      '@fontsource/jetbrains-mono',
      'lucide-solid',
      '@tauri-apps/cli',
      '@resvg/resvg-js',
    ];

    for (const dep of required) {
      assert.ok(allDeps[dep], `Expected "${dep}" to be declared in package.json dependencies/devDependencies`);
      const modPath = path.join(PROJECT_ROOT, 'node_modules', ...dep.split('/'));
      assert.ok(fs.existsSync(modPath), `Expected "${dep}" to be installed under node_modules/${dep}`);
    }
  });

  it('F1-T1-02: Design-System.md & Referencias-Visuales.md document all 13 CSS tokens and 6 accents', () => {
    const designDir = path.join(VAULT_DIR, '04-Diseno');
    const dsPath = path.join(designDir, 'Design-System.md');
    const refPath = path.join(designDir, 'Referencias-Visuales.md');

    assert.ok(fs.existsSync(dsPath), 'vault/04-Diseno/Design-System.md must exist');
    assert.ok(fs.existsSync(refPath), 'vault/04-Diseno/Referencias-Visuales.md must exist');

    const ds = readTextSafe(dsPath);
    const ref = readTextSafe(refPath);
    assert.ok(ds.length > 300, 'Design-System.md must not be a stub');
    assert.ok(ref.length > 200, 'Referencias-Visuales.md must not be a stub');

    const requiredTokens = [
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
    for (const token of requiredTokens) {
      assert.ok(ds.includes(token), `Design-System.md missing token ${token}`);
    }

    const requiredAccents = ['#7c6cff', '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4'];
    for (const hex of requiredAccents) {
      assert.ok(ds.toLowerCase().includes(hex), `Design-System.md missing accent preset ${hex}`);
    }
  });

  it('F1-T1-03: Before-screenshots preserved in vault/04-Diseno/ with valid dimensions', () => {
    const designDir = path.join(VAULT_DIR, '04-Diseno');
    const images = walkFiles(designDir, { extensions: ['.png', '.jpg', '.jpeg', '.webp'] });
    const beforeImages = images.filter((p) => /before|antes|baseline/i.test(path.basename(p)));

    assert.ok(
      beforeImages.length >= 2,
      `Expected at least 2 before-screenshots in vault/04-Diseno/, found ${beforeImages.length}`
    );

    for (const imgPath of beforeImages) {
      const info = parseImageDimensions(imgPath);
      assert.ok(info.valid, `Invalid image header: ${imgPath}`);
      assert.ok(info.width > 100 && info.height > 100, `Screenshot ${imgPath} too small (${info.width}x${info.height})`);
    }
  });

  it('F1-T1-04: Local .woff2 fonts bundled in dist/assets/ and loaded in document.fonts', async () => {
    const assetsDir = path.join(DIST_DIR, 'assets');
    assert.ok(fs.existsSync(assetsDir), 'dist/assets/ must exist');
    const woff2Files = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.woff2'));
    assert.ok(
      woff2Files.some((f) => /inter/i.test(f)),
      `Expected Inter .woff2 font bundle in dist/assets/, found: ${woff2Files.join(', ')}`
    );
    assert.ok(
      woff2Files.some((f) => /jetbrains/i.test(f)),
      `Expected JetBrains Mono .woff2 font bundle in dist/assets/, found: ${woff2Files.join(', ')}`
    );

    await cdp.openPage('index.html', { width: 980, height: 640 });
    const loadedFamilies = await cdp.evaluate(async () => {
      await document.fonts.ready;
      return Array.from(document.fonts)
        .filter((f) => f.status === 'loaded')
        .map((f) => f.family.replace(/['"]/g, ''));
    });

    assert.ok(
      loadedFamilies.some((f) => /inter/i.test(f)),
      `Expected Inter loaded in document.fonts, got: ${JSON.stringify(loadedFamilies)}`
    );
    assert.ok(
      loadedFamilies.some((f) => /jetbrains/i.test(f)),
      `Expected JetBrains Mono loaded in document.fonts, got: ${JSON.stringify(loadedFamilies)}`
    );
  });

  it('F1-T1-05: Zero external CDN requests at runtime on Launcher and HUD', async () => {
    for (const page of ['index.html', 'hud.html']) {
      await cdp.openPage(page);
      const reqs = cdp.getNetworkRequests();
      const external = reqs.filter(
        (r) => !r.url.startsWith(cdp.baseUrl) && !r.url.startsWith('data:') && !r.url.startsWith('blob:')
      );
      assert.deepEqual(
        external,
        [],
        `Expected 0 external network requests on ${page}, got: ${JSON.stringify(external)}`
      );
    }
  });

  it('F1-T1-06: CSS root tokens & inline Lucide SVG icons active in rendered DOM', async () => {
    await cdp.openPage('index.html', { width: 980, height: 640 });
    const result = await cdp.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const tokens = {
        bg: style.getPropertyValue('--bg').trim().toLowerCase(),
        accent: style.getPropertyValue('--accent').trim().toLowerCase(),
        radiusWindow: style.getPropertyValue('--radius-window').trim(),
        radiusCard: style.getPropertyValue('--radius-card').trim(),
        radiusPill: style.getPropertyValue('--radius-pill').trim(),
      };
      const svgs = Array.from(document.querySelectorAll('button svg, header svg'));
      const nonZeroSvgs = svgs.filter((svg) => {
        const rect = svg.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      return { tokens, svgCount: nonZeroSvgs.length };
    });

    assert.equal(result.tokens.bg, '#0b0b12', 'Expected --bg root token to be #0b0b12');
    assert.equal(result.tokens.accent, '#7c6cff', 'Expected --accent default root token to be #7c6cff');
    assert.equal(result.tokens.radiusWindow, '22px', 'Expected --radius-window to be 22px');
    assert.equal(result.tokens.radiusCard, '14px', 'Expected --radius-card to be 14px');
    assert.equal(result.tokens.radiusPill, '999px', 'Expected --radius-pill to be 999px');
    assert.ok(result.svgCount >= 3, `Expected visible inline SVG icons in Launcher, found ${result.svgCount}`);
  });
});
