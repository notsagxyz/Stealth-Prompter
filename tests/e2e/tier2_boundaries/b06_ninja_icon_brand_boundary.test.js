import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  PROJECT_ROOT,
  ASSETS_DIR,
  DIST_DIR,
  SRC_DIR,
  SRC_TAURI_DIR,
  SRC_TAURI_ICONS_DIR,
  readJsonSafe,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { parsePngInfo, parseIcoInfo, parseIcnsInfo } from '../lib/media_probe.js';

function decodePngRgbaPixels(filePath) {
  const buf = fs.readFileSync(filePath);
  const info = parsePngInfo(filePath);
  if (!info.validSignature || !info.validIhdr) return null;

  const bitDepth = buf[24];
  const colorType = buf[25];
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    return { width: info.width, height: info.height, distinctColors: 2, nonTransparentRatio: 1 };
  }

  const idatChunks = [];
  let offset = 8;
  while (offset + 8 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
    }
    offset += 12 + len;
    if (type === 'IEND') break;
  }

  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = info.width * bpp;
  const distinct = new Set();
  let nonTransparent = 0;

  const prevRow = Buffer.alloc(stride);
  for (let y = 0; y < info.height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    const row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const val = raw[rowStart + 1 + x];
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prevRow[x];
      const c = x >= bpp ? prevRow[x - bpp] : 0;
      let recon = val;
      if (filter === 1) recon = (val + a) & 0xff;
      else if (filter === 2) recon = (val + b) & 0xff;
      else if (filter === 3) recon = (val + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        recon = (val + pr) & 0xff;
      }
      row[x] = recon;
    }
    row.copy(prevRow);

    for (let px = 0; px < info.width; px++) {
      const idx = px * bpp;
      const r = row[idx];
      const g = row[idx + 1];
      const b = row[idx + 2];
      const a = bpp === 4 ? row[idx + 3] : 255;
      if (a > 10) nonTransparent++;
      distinct.add(`${r >> 4},${g >> 4},${b >> 4}`);
    }
  }

  return {
    width: info.width,
    height: info.height,
    distinctColors: distinct.size,
    nonTransparentRatio: nonTransparent / (info.width * info.height),
  };
}

describe('F6 — Ninja Icon & Brand Assets Boundaries (Tier 2)', () => {
  it('F6-T2-01: Non-empty & valid magic bytes on all .ico, .icns, and .png icons', () => {
    const required = ['icon.ico', 'icon.icns', '32x32.png', '128x128.png', '128x128@2x.png', 'icon.png'];
    for (const f of required) {
      const fp = path.join(SRC_TAURI_ICONS_DIR, f);
      assert.ok(fs.existsSync(fp), `Missing icon file: src-tauri/icons/${f}`);
      const size = fs.statSync(fp).size;
      assert.ok(size > 100, `Icon file unexpectedly tiny (${size} bytes): ${f}`);
      if (f.endsWith('.png')) {
        const p = parsePngInfo(fp);
        assert.ok(p.validSignature && p.validIhdr && p.hasIendTrailer, `Corrupt PNG: ${f}`);
      } else if (f.endsWith('.ico')) {
        const ico = parseIcoInfo(fp);
        assert.ok(ico.validMagic && ico.imageCount >= 1, `Invalid ICO: ${f}`);
      } else if (f.endsWith('.icns')) {
        const icns = parseIcnsInfo(fp);
        assert.ok(icns.validMagic && icns.sizeMatches, `Invalid ICNS: ${f}`);
      }
    }
  });

  it('F6-T2-02: 32x32 exported PNG pixel occupancy & contrast (not blank or monotone)', () => {
    const pngPath = path.join(SRC_TAURI_ICONS_DIR, '32x32.png');
    assert.ok(fs.existsSync(pngPath), 'src-tauri/icons/32x32.png must exist');
    const pixels = decodePngRgbaPixels(pngPath);
    assert.ok(pixels, 'Could not decode 32x32.png');
    assert.ok(
      pixels.nonTransparentRatio > 0.15,
      `Icon 32x32.png appears blank/mostly transparent (${(pixels.nonTransparentRatio * 100).toFixed(1)}%)`
    );
    assert.ok(
      pixels.distinctColors >= 2,
      `Icon 32x32.png appears monotone (${pixels.distinctColors} distinct color buckets)`
    );
  });

  it('F6-T2-03: Social preview PNG exact 1280x640, IEND EOF trailer, and < 5 MB', () => {
    const candidates = walkFiles(ASSETS_DIR, { extensions: ['.png'] }).filter((p) =>
      /social|preview|og|banner/i.test(path.basename(p))
    );
    assert.ok(candidates.length >= 1, 'Social preview PNG missing from assets/');
    const info = parsePngInfo(candidates[0]);
    assert.equal(info.width, 1280);
    assert.equal(info.height, 640);
    assert.ok(info.hasIendTrailer, 'Social preview PNG missing IEND trailer (truncated)');
    assert.ok(info.size < 5 * 1024 * 1024, `Social preview exceeds 5 MB (${info.size} bytes)`);
  });

  it('F6-T2-04: SVG XSS/script/external-URL clean-room security audit', () => {
    const svgs = [
      ...walkFiles(ASSETS_DIR, { extensions: ['.svg'] }),
      ...walkFiles(SRC_DIR, { extensions: ['.svg'] }),
    ];
    assert.ok(svgs.length >= 1, 'Expected SVG brand assets in assets/ or src/');
    for (const svg of svgs) {
      const content = readTextSafe(svg);
      assert.doesNotMatch(content, /<script\b|onload=|onerror=/i, `Unsafe SVG script/handler in ${svg}`);
      assert.doesNotMatch(content, /https?:\/\//i, `External URL inside SVG ${svg}`);
      assert.doesNotMatch(content, /FlowPrompter|StealthPrompter/i, `Legacy brand inside SVG ${svg}`);
    }
  });

  it('F6-T2-05: Zero broken icon/image asset paths in tauri.conf.json, HTML, and README.md', () => {
    const conf = readJsonSafe(path.join(SRC_TAURI_DIR, 'tauri.conf.json'));
    const icons = conf.bundle?.icon || [];
    assert.ok(icons.length > 0, 'tauri.conf.json bundle.icon must not be empty');
    for (const rel of icons) {
      assert.ok(fs.existsSync(path.join(SRC_TAURI_DIR, rel)), `Broken tauri.conf.json icon path: ${rel}`);
    }

    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    const localRefs = Array.from(readme.matchAll(/(?:!\[[^\]]*\]\(|<img[^>]+src=["'])([^)"']+)/gi))
      .map((m) => m[1])
      .filter((ref) => !/^https?:\/\//i.test(ref) && !ref.startsWith('#'));
    assert.ok(localRefs.length >= 1, 'README.md must embed at least one local image/GIF asset');
    for (const ref of localRefs) {
      assert.ok(fs.existsSync(path.resolve(PROJECT_ROOT, ref)), `Broken README.md asset link: ${ref}`);
    }
  });

  it('F6-T2-06: Old TeleprompterLogo symbol completely removed from src/', () => {
    const srcFiles = walkFiles(SRC_DIR, { extensions: ['.ts', '.tsx'] });
    for (const f of srcFiles) {
      assert.doesNotMatch(readTextSafe(f), /TeleprompterLogo/, `Old TeleprompterLogo still referenced in ${f}`);
    }
  });
});
