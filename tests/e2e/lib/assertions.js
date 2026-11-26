import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  SRC_DIR,
  SRC_TAURI_DIR,
  GITHUB_DIR,
  SCRIPTS_DIR,
  REMOTION_DIR,
  VAULT_DIR,
  walkFiles,
} from './paths.js';

export function parseCssColor(cssStr) {
  if (!cssStr || typeof cssStr !== 'string') return null;
  const s = cssStr.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  const hexMatch = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgbMatch = s.match(/^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1,
    };
  }
  return null;
}

export function compositeOver(fg, bg) {
  const a = fg.a ?? 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

export function relativeLuminance({ r, g, b }) {
  const chan = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}

export function contrastRatio(fgInput, bgInput) {
  const bgRaw = typeof bgInput === 'string' ? parseCssColor(bgInput) : bgInput;
  const fgRaw = typeof fgInput === 'string' ? parseCssColor(fgInput) : fgInput;
  if (!bgRaw || !fgRaw) return 0;
  const fg = (fgRaw.a ?? 1) < 1 ? compositeOver(fgRaw, bgRaw) : fgRaw;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bgRaw);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

export function extractTranslateY(transformStr) {
  if (!transformStr || transformStr === 'none') return 0;
  // matrix(a, b, c, d, tx, ty) or matrix3d(...)
  const m2d = transformStr.match(/^matrix\(([^)]+)\)$/);
  if (m2d) {
    const parts = m2d[1].split(',').map((n) => Number(n.trim()));
    return parts.length === 6 ? parts[5] : NaN;
  }
  const m3d = transformStr.match(/^matrix3d\(([^)]+)\)$/);
  if (m3d) {
    const parts = m3d[1].split(',').map((n) => Number(n.trim()));
    return parts.length === 16 ? parts[13] : NaN;
  }
  const t3d = transformStr.match(/translate3d\(\s*[^,]+,\s*([^,]+),/);
  if (t3d) return parseFloat(t3d[1]);
  return NaN;
}

export function scanOldBrandLeaks() {
  const textExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html', '.json',
    '.rs', '.toml', '.md', '.yml', '.yaml', '.ps1', '.svg',
  ];

  const candidateFiles = [
    path.join(PROJECT_ROOT, 'package.json'),
    path.join(PROJECT_ROOT, 'index.html'),
    path.join(PROJECT_ROOT, 'hud.html'),
    path.join(PROJECT_ROOT, 'README.md'),
    ...walkFiles(SRC_DIR, { extensions: textExtensions }),
    ...walkFiles(path.join(SRC_TAURI_DIR, 'src'), { extensions: textExtensions }),
    path.join(SRC_TAURI_DIR, 'Cargo.toml'),
    path.join(SRC_TAURI_DIR, 'tauri.conf.json'),
    ...walkFiles(GITHUB_DIR, { extensions: textExtensions }),
    ...walkFiles(SCRIPTS_DIR, { extensions: textExtensions }),
    ...walkFiles(REMOTION_DIR, { extensions: textExtensions }),
    ...walkFiles(path.join(VAULT_DIR, '05-Marketing'), { extensions: textExtensions }),
    ...walkFiles(path.join(VAULT_DIR, '06-Video'), { extensions: textExtensions }),
    ...walkFiles(path.join(VAULT_DIR, '02-Naming'), { extensions: textExtensions }),
  ].filter((f) => fs.existsSync(f));

  const leaks = [];
  const storageEnginePath = path.resolve(SRC_TAURI_DIR, 'src', 'storage', 'engine.rs');

  for (const filePath of candidateFiles) {
    const resolved = path.resolve(filePath);
    const rel = path.relative(PROJECT_ROOT, resolved).replace(/\\/g, '/');
    const content = fs.readFileSync(resolved, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      // Allow historical/comparison mention of FlowPrompter only if explicitly discussing competitors?
      // ORIGINAL_REQUEST R4 & Acceptance Criteria: "No queda ninguna referencia al nombre anterior en código, tauri.conf.json, Cargo.toml, package.json, CI, vault ni marketing"
      // Check StealthPrompter (PascalCase / camelCase) and stealth-prompter
      if (/StealthPrompter|stealth-prompter/i.test(line)) {
        // Note: lowercase slug `stealthprompter` has no hyphen and is allowed; `StealthPrompter` (case-sensitive) and `stealth-prompter` are forbidden!
        const hasUpperBrand = /StealthPrompter/.test(line);
        const hasHyphenBrand = /stealth-prompter/i.test(line);
        if (hasUpperBrand || hasHyphenBrand) {
          leaks.push({ file: rel, line: idx + 1, match: hasUpperBrand ? 'StealthPrompter' : 'stealth-prompter', text: line.trim() });
        }
      }

      if (/com\.stealthprompter\.desktop/i.test(line)) {
        // Strictly allowlisted ONLY inside storage/engine.rs for legacy migration source
        if (resolved !== storageEnginePath) {
          leaks.push({ file: rel, line: idx + 1, match: 'com.stealthprompter.desktop', text: line.trim() });
        }
      }
    });
  }

  return leaks;
}
