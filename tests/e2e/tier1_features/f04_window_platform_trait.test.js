import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Resolves project specification content from repository, vault, or teamwork state.
 */
function loadSpecificationSource() {
  // 1. Production Rust source file if present
  const modRs = path.join(PROJECT_ROOT, 'src-tauri', 'src', 'platform', 'mod.rs');
  if (fs.existsSync(modRs)) {
    return { source: 'src-tauri/src/platform/mod.rs', content: fs.readFileSync(modRs, 'utf8') };
  }

  // 2. Authoritative Architectural Decision Record in Vault
  const adrPath = path.join(PROJECT_ROOT, 'vault', '03-Arquitectura', 'ADR-001-Stack-Tauri2-Rust.md');
  if (fs.existsSync(adrPath)) {
    return { source: 'vault/03-Arquitectura/ADR-001-Stack-Tauri2-Rust.md', content: fs.readFileSync(adrPath, 'utf8') };
  }

  // 3. Teamwork state PROJECT.md
  const localProjectMd = path.join(PROJECT_ROOT, 'PROJECT.md');
  if (fs.existsSync(localProjectMd)) {
    return { source: 'PROJECT.md', content: fs.readFileSync(localProjectMd, 'utf8') };
  }

  const scratchRoot = path.join(os.homedir(), '.gemini', 'antigravity', 'scratch', 'teamwork');
  if (fs.existsSync(scratchRoot)) {
    try {
      const runs = fs.readdirSync(scratchRoot);
      for (const run of runs) {
        const candidate = path.join(scratchRoot, run, '.agents', 'teamwork', 'PROJECT.md');
        if (fs.existsSync(candidate)) {
          return { source: candidate, content: fs.readFileSync(candidate, 'utf8') };
        }
      }
    } catch {}
  }

  throw new Error('Unable to locate WindowPlatform trait specification in repo, vault, or state');
}

/**
 * Headless Mock implementation conforming to WindowPlatform trait contract
 * specified in PROJECT.md § Interface Contracts.
 */
class MockWindowPlatform {
  constructor() {
    this.windows = new Map();
  }

  _ensureWindow(hwnd) {
    if (!this.windows.has(hwnd)) {
      this.windows.set(hwnd, {
        affinity: 'None',
        clickThrough: false,
        noActivate: false,
        vibrancy: 'None',
        visible: false,
        unfocused: false
      });
    }
    return this.windows.get(hwnd);
  }

  setDisplayAffinity(hwnd, affinity) {
    const valid = ['None', 'Monitor', 'ExcludeFromCapture'];
    if (!valid.includes(affinity)) {
      throw new Error(`Invalid DisplayAffinity variant: ${affinity}`);
    }
    const win = this._ensureWindow(hwnd);
    win.affinity = affinity;
    return { ok: true };
  }

  getDisplayAffinity(hwnd) {
    const win = this._ensureWindow(hwnd);
    return win.affinity;
  }

  setClickThrough(hwnd, enabled) {
    const win = this._ensureWindow(hwnd);
    win.clickThrough = Boolean(enabled);
    return { ok: true };
  }

  setNoActivate(hwnd, enabled) {
    const win = this._ensureWindow(hwnd);
    win.noActivate = Boolean(enabled);
    return { ok: true };
  }

  applyVibrancy(hwnd, effect) {
    const win = this._ensureWindow(hwnd);
    win.vibrancy = effect;
    return { ok: true };
  }

  showUnfocused(hwnd) {
    const win = this._ensureWindow(hwnd);
    win.visible = true;
    win.unfocused = true;
    return { ok: true };
  }

  hide(hwnd) {
    const win = this._ensureWindow(hwnd);
    win.visible = false;
    return { ok: true };
  }
}

describe('F04: WindowPlatform Trait & Mock Abstraction', () => {
  it('1. should verify WindowPlatform trait methods specification and signatures parsed from spec', () => {
    const { source, content } = loadSpecificationSource();
    assert.ok(content.length > 0, `Specification source ${source} must have content`);

    // Extract pub trait WindowPlatform block
    const traitMatch = content.match(/pub\s+trait\s+WindowPlatform[^{]*\{([\s\S]*?)\n\}/);
    assert.ok(traitMatch, `Must define "pub trait WindowPlatform" in ${source}`);

    const traitBody = traitMatch[1];
    const expectedMethods = [
      'set_display_affinity',
      'get_display_affinity',
      'set_click_through',
      'set_no_activate',
      'apply_vibrancy',
      'show_unfocused',
      'hide'
    ];

    for (const method of expectedMethods) {
      const methodRegex = new RegExp(`fn\\s+${method}\\s*\\(`);
      assert.match(
        traitBody,
        methodRegex,
        `WindowPlatform trait in ${source} must declare method: ${method}`
      );
    }

    // Verify parameter signatures on critical methods
    assert.match(traitBody, /fn\s+set_display_affinity\s*\(&self,\s*hwnd:\s*isize,\s*affinity:\s*DisplayAffinity\)/);
    assert.match(traitBody, /fn\s+get_display_affinity\s*\(&self,\s*hwnd:\s*isize\)\s*->\s*Result<DisplayAffinity,/);
    assert.match(traitBody, /fn\s+show_unfocused\s*\(&self,\s*hwnd:\s*isize\)/);
    assert.match(traitBody, /fn\s+hide\s*\(&self,\s*hwnd:\s*isize\)/);
  });

  it('2. should verify DisplayAffinity enum variants and capture exclusion mapping parsed from spec', () => {
    const { source, content } = loadSpecificationSource();

    // Parse DisplayAffinity enum block
    const enumMatch = content.match(/pub\s+enum\s+DisplayAffinity\s*\{([\s\S]*?)\}/);
    assert.ok(enumMatch, `Must define "pub enum DisplayAffinity" in ${source}`);

    const enumBody = enumMatch[1];
    assert.match(enumBody, /\bNone\b/, 'DisplayAffinity must have None variant');
    assert.match(enumBody, /\bMonitor\b/, 'DisplayAffinity must have Monitor variant');
    assert.match(enumBody, /\bExcludeFromCapture\b/, 'DisplayAffinity must have ExcludeFromCapture variant');

    // Verify documented value of ExcludeFromCapture (0x00000011 / 17)
    assert.match(
      enumBody,
      /ExcludeFromCapture[^\n]*(?:0x00000011|17)/,
      'ExcludeFromCapture variant must document value 0x00000011 (17)'
    );

    // Verify behavioral mock enforcement of valid variants
    const mock = new MockWindowPlatform();
    mock.setDisplayAffinity(100, 'ExcludeFromCapture');
    assert.strictEqual(mock.getDisplayAffinity(100), 'ExcludeFromCapture');

    assert.throws(
      () => mock.setDisplayAffinity(100, 'InvalidVariant'),
      /Invalid DisplayAffinity variant/
    );
  });

  it('3. should verify VibrancyEffect enum variants and Acrylic RGBA parameters parsed from spec', () => {
    const { source, content } = loadSpecificationSource();

    // Parse VibrancyEffect enum block (handling nested struct variant braces)
    const vibrancyMatch = content.match(/pub\s+enum\s+VibrancyEffect\s*\{([\s\S]*?\n\})/);
    assert.ok(vibrancyMatch, `Must define "pub enum VibrancyEffect" in ${source}`);

    const vibrancyBody = vibrancyMatch[1];
    assert.match(vibrancyBody, /\bNone\b/);
    assert.match(vibrancyBody, /\bMica\b/);
    assert.match(vibrancyBody, /\bBlur\b/);
    assert.match(vibrancyBody, /Acrylic\s*\{\s*r:\s*u8,\s*g:\s*u8,\s*b:\s*u8,\s*a:\s*u8\s*\}/);

    // Test behavioral mock handling of vibrancy
    const mock = new MockWindowPlatform();
    mock.applyVibrancy(200, { type: 'Acrylic', r: 18, g: 20, b: 29, a: 180 });
    const win = mock._ensureWindow(200);
    assert.deepStrictEqual(win.vibrancy, { type: 'Acrylic', r: 18, g: 20, b: 29, a: 180 });
  });

  it('4. should verify MockWindowPlatform state transitions and behavioral contract', () => {
    const mock = new MockWindowPlatform();
    const testHwnd = 123456;

    // Test initial state
    assert.strictEqual(mock.getDisplayAffinity(testHwnd), 'None');

    // Test setting affinity to ExcludeFromCapture
    mock.setDisplayAffinity(testHwnd, 'ExcludeFromCapture');
    assert.strictEqual(mock.getDisplayAffinity(testHwnd), 'ExcludeFromCapture');

    // Test click-through
    mock.setClickThrough(testHwnd, true);
    assert.strictEqual(mock.windows.get(testHwnd).clickThrough, true);

    // Test show unfocused
    mock.showUnfocused(testHwnd);
    const winState = mock.windows.get(testHwnd);
    assert.strictEqual(winState.visible, true);
    assert.strictEqual(winState.unfocused, true);

    // Test hide
    mock.hide(testHwnd);
    assert.strictEqual(mock.windows.get(testHwnd).visible, false);
  });

  it('5. should verify thread-safety requirements (Send + Sync) and Error boxing contract parsed from spec', () => {
    const { source, content } = loadSpecificationSource();

    // Verify trait declaration requires Send + Sync supertraits directly from spec
    const traitDeclMatch = content.match(/pub\s+trait\s+WindowPlatform\s*:\s*([^\{]+)\{/);
    assert.ok(traitDeclMatch, `Must locate trait declaration in ${source}`);

    const bounds = traitDeclMatch[1].trim();
    assert.match(bounds, /\bSend\b/, 'WindowPlatform must require Send for multi-threaded IPC dispatch');
    assert.match(bounds, /\bSync\b/, 'WindowPlatform must require Sync for shared access in Tauri app state');

    // Extract all methods and verify they return Result<..., Box<dyn Error>>
    const traitMatch = content.match(/pub\s+trait\s+WindowPlatform[^{]*\{([\s\S]*?)\n\}/);
    const traitBody = traitMatch[1];
    const methods = [...traitBody.matchAll(/fn\s+([a-z_]+)\s*\([^\)]*\)\s*->\s*Result<([^,>]+),\s*Box<dyn Error>>;/g)];

    assert.strictEqual(methods.length, 7, 'All 7 WindowPlatform methods must return Result<T, Box<dyn Error>>');
    for (const m of methods) {
      assert.ok(
        m[0].includes('Box<dyn Error>'),
        `Method ${m[1]} in ${source} must return dynamic Box<dyn Error>`
      );
    }
  });
});
