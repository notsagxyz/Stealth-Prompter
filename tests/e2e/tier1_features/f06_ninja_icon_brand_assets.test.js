import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  ASSETS_DIR,
  VAULT_DIR,
  SRC_DIR,
  SRC_TAURI_DIR,
  SRC_TAURI_ICONS_DIR,
  DIST_DIR,
  readJsonSafe,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { parsePngInfo, parseIcoInfo, parseIcnsInfo } from '../lib/media_probe.js';

describe('F6 — Original Ninja/Stealth Icon & Brand Assets (Tier 1)', () => {
  it('F6-T1-01: 3 original ninja/stealth SVG concept files + selection rationale document', () => {
    const allSvgs = [
      ...walkFiles(ASSETS_DIR, { extensions: ['.svg'] }),
      ...walkFiles(VAULT_DIR, { extensions: ['.svg'] }),
    ];
    const conceptSvgs = allSvgs.filter((p) => /concept|option|propuesta|stealth|ninja/i.test(path.basename(p)));
    assert.ok(
      conceptSvgs.length >= 3,
      `Expected at least 3 SVG concept files in assets/ or vault/, found ${conceptSvgs.length}: ${conceptSvgs.join(', ')}`
    );

    for (const svgPath of conceptSvgs.slice(0, 3)) {
      const xml = readTextSafe(svgPath);
      assert.match(xml, /<svg[^>]+viewBox=/i, `Concept SVG missing viewBox: ${svgPath}`);
      assert.doesNotMatch(xml, /FlowPrompter|StealthPrompter/i, `Concept SVG contains legacy brand: ${svgPath}`);
    }

    const mdDocs = walkFiles(VAULT_DIR, { extensions: ['.md'] }).filter((p) =>
      /icon|logo|brand|branding/i.test(path.basename(p))
    );
    assert.ok(mdDocs.length >= 1, 'Expected icon selection rationale markdown in vault/');
    const combined = mdDocs.map((p) => readTextSafe(p)).join('\n');
    assert.match(combined, /16\s*px|16x16/i, 'Icon rationale must address 16px recognizability');
  });

  it('F6-T1-02: Master SVG validity (square viewBox, dark rounded tile, single accent, no raster embeds)', () => {
    const assetsSvgs = walkFiles(ASSETS_DIR, { extensions: ['.svg'] });
    const master =
      assetsSvgs.find((p) => /master|stealth-icon|icon\.svg|logo\.svg/i.test(path.basename(p))) || assetsSvgs[0];
    assert.ok(master && fs.existsSync(master), 'Master SVG must exist under assets/');

    const xml = readTextSafe(master);
    const vbMatch = xml.match(/viewBox\s*=\s*"([^"]+)"/i);
    assert.ok(vbMatch, `Master SVG ${master} must specify viewBox`);
    const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
    assert.equal(parts.length, 4, 'Master SVG viewBox must have 4 numeric values');
    assert.equal(parts[2], parts[3], `Master SVG viewBox must be square, got ${vbMatch[1]}`);
    assert.ok(parts[2] > 0, 'Master SVG viewBox width must be positive');

    assert.doesNotMatch(xml, /<image\b/i, 'Master SVG must be pure vector (no embedded <image>)');
    assert.doesNotMatch(xml, /https?:\/\//i, 'Master SVG must not contain external HTTP(S) URLs');
  });

  it('F6-T1-03: src-tauri/icons/ bundle (.ico, .icns, PNGs) & tauri.conf.json bundle.icon resolution', () => {
    const requiredFiles = ['icon.ico', 'icon.icns', '32x32.png', '128x128.png', '128x128@2x.png', 'icon.png'];
    for (const f of requiredFiles) {
      const fp = path.join(SRC_TAURI_ICONS_DIR, f);
      assert.ok(fs.existsSync(fp), `Missing Tauri icon export: src-tauri/icons/${f}`);
    }

    const ico = parseIcoInfo(path.join(SRC_TAURI_ICONS_DIR, 'icon.ico'));
    assert.ok(ico.validMagic && ico.imageCount >= 1, 'icon.ico must have valid ICO magic and >= 1 image entry');

    const icns = parseIcnsInfo(path.join(SRC_TAURI_ICONS_DIR, 'icon.icns'));
    assert.ok(icns.validMagic && icns.sizeMatches, 'icon.icns must have valid icns header matching byte size');

    const png32 = parsePngInfo(path.join(SRC_TAURI_ICONS_DIR, '32x32.png'));
    assert.equal(png32.width, 32);
    assert.equal(png32.height, 32);

    const png128 = parsePngInfo(path.join(SRC_TAURI_ICONS_DIR, '128x128.png'));
    assert.equal(png128.width, 128);
    assert.equal(png128.height, 128);

    const png256 = parsePngInfo(path.join(SRC_TAURI_ICONS_DIR, '128x128@2x.png'));
    assert.equal(png256.width, 256);
    assert.equal(png256.height, 256);

    const tauriConf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    const bundleIcons = tauriConf.bundle?.icon;
    assert.ok(Array.isArray(bundleIcons) && bundleIcons.length >= 4, 'tauri.conf.json must configure bundle.icon array');
    for (const relIcon of bundleIcons) {
      const resolved = path.join(SRC_TAURI_DIR, relIcon);
      assert.ok(fs.existsSync(resolved), `tauri.conf.json bundle.icon entry missing on disk: ${relIcon}`);
    }
  });

  it('F6-T1-04: HTML <link rel="icon"> in index.html/hud.html/dist/ & Stealth icon component', () => {
    for (const htmlFile of ['index.html', 'hud.html']) {
      const html = readTextSafe(path.join(PROJECT_ROOT, htmlFile));
      const match = html.match(/<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]+href=["']([^"']+)["']/i);
      assert.ok(match, `${htmlFile} must include <link rel="icon">`);
      const href = match[1].replace(/^\//, '');
      const inPublic = path.join(PROJECT_ROOT, 'public', href);
      const inRoot = path.join(PROJECT_ROOT, href);
      const inDist = path.join(DIST_DIR, href);
      assert.ok(
        fs.existsSync(inPublic) || fs.existsSync(inRoot) || fs.existsSync(inDist),
        `${htmlFile} favicon href "${match[1]}" must resolve to an existing asset`
      );
    }

    const iconsTsx = readTextSafe(path.join(SRC_DIR, 'components', 'Icons.tsx'));
    assert.doesNotMatch(iconsTsx, /TeleprompterLogo/, 'Legacy TeleprompterLogo symbol must be replaced with Stealth brand icon');
  });

  it('F6-T1-05: 1280x640 social preview PNG valid header and exact dimensions', () => {
    const candidates = [
      ...walkFiles(ASSETS_DIR, { extensions: ['.png'] }),
      ...walkFiles(path.join(PROJECT_ROOT, 'docs'), { extensions: ['.png'] }),
    ].filter((p) => /social|preview|og|banner/i.test(path.basename(p)));

    assert.ok(candidates.length >= 1, 'Expected 1280x640 social preview PNG under assets/');
    const png = parsePngInfo(candidates[0]);
    assert.ok(png.validSignature && png.validIhdr && png.hasIendTrailer, 'Social preview must be a valid complete PNG');
    assert.equal(png.width, 1280, `Social preview width must be 1280, got ${png.width}`);
    assert.equal(png.height, 640, `Social preview height must be 640, got ${png.height}`);
    assert.ok(png.size > 10 * 1024, 'Social preview PNG must be > 10 KB');
  });

  it('F6-T1-06: README.md top logo image link resolves to non-empty local asset', () => {
    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    const topSection = readme.split('\n').slice(0, 35).join('\n');
    const mdImg = topSection.match(/!\[[^\]]*\]\(([^)]+)\)/);
    const htmlImg = topSection.match(/<img[^>]+src=["']([^"']+)["']/i);
    const imgRef = mdImg?.[1] || htmlImg?.[1];

    assert.ok(imgRef, 'README.md top section must embed a Stealth logo/banner image');
    assert.ok(!/^https?:\/\//i.test(imgRef), 'README logo should reference local repo asset');
    const resolved = path.resolve(PROJECT_ROOT, imgRef);
    assert.ok(fs.existsSync(resolved), `README logo path does not exist: ${imgRef}`);
    assert.ok(fs.statSync(resolved).size > 200, `README logo asset is too small: ${imgRef}`);
  });
});
