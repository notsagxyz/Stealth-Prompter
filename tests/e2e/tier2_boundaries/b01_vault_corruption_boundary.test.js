import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Validates a vault document according to clean-room vault specifications.
 * Requirements derived from ORIGINAL_REQUEST.md R1 & PROJECT.md Feature 1:
 * - Documents must be non-empty Markdown (.md) files.
 * - Must contain valid frontmatter or title headers.
 * - Non-markdown or binary artifacts are strictly prohibited in clean-room vault.
 * - Text must be valid UTF-8 without illegal control characters or null bytes.
 * - Log.md must have chronological section headers and clean-room attestations.
 */
function validateVaultNote(filePath, content) {
  const ext = path.extname(filePath);
  if (ext.toLowerCase() !== '.md') {
    return { valid: false, error: `Invalid file extension: ${ext}. Vault must only contain Markdown files.` };
  }

  if (!content || content.length === 0) {
    return { valid: false, error: 'Empty file: Vault documents must not be 0 bytes.' };
  }

  if (content.includes('\0')) {
    return { valid: false, error: 'Null byte detected: Document contains illegal binary control characters.' };
  }

  // Check for malformed frontmatter if frontmatter starts
  if (content.startsWith('---')) {
    const secondDelim = content.indexOf('---', 3);
    if (secondDelim === -1) {
      return { valid: false, error: 'Malformed frontmatter: Unclosed YAML delimiter (---).' };
    }
  } else if (!content.trim().startsWith('#')) {
    return { valid: false, error: 'Missing header: Document must begin with YAML frontmatter or a markdown header (#).' };
  }

  return { valid: true };
}

function validateLogStructure(content) {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Log.md is empty.' };
  }
  const dateHeaderRegex = /##\s+\d{4}-\d{2}-\d{2}/;
  if (!dateHeaderRegex.test(content)) {
    return { valid: false, error: 'Missing required chronological date header (## YYYY-MM-DD).' };
  }
  const cleanRoomAttestationRegex = /clean[- ]room/i;
  if (!cleanRoomAttestationRegex.test(content)) {
    return { valid: false, error: 'Missing clean-room protocol compliance attestation in log entries.' };
  }
  return { valid: true };
}

describe('B01: Vault Corruption & Boundary Edge Cases', () => {
  let tmpDir;

  it('1. should reject 0-byte empty vault notes as invalid/corrupted', () => {
    const emptyResult = validateVaultNote('vault/01-Analisis/empty_note.md', '');
    assert.strictEqual(emptyResult.valid, false);
    assert.match(emptyResult.error, /Empty file/i);

    const whitespaceResult = validateVaultNote('vault/01-Analisis/whitespace.md', '   \n  \t  ');
    assert.strictEqual(whitespaceResult.valid, false);
    assert.match(whitespaceResult.error, /Missing header/i);
  });

  it('2. should reject notes with missing headers or unclosed YAML frontmatter delimiters', () => {
    const malformedYaml = '---\ntitle: Broken Note\ndate: 2026-11-23\nSome body text without closing delimiter';
    const result = validateVaultNote('vault/03-Arquitectura/ADR-corrupted.md', malformedYaml);
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /Malformed frontmatter/i);

    const noHeader = 'Plain body text without title or frontmatter.';
    const noHeaderResult = validateVaultNote('vault/03-Arquitectura/no-header.md', noHeader);
    assert.strictEqual(noHeaderResult.valid, false);
    assert.match(noHeaderResult.error, /Missing header/i);
  });

  it('3. should reject non-markdown artifacts injected into vault directory', () => {
    const forbiddenFiles = [
      'vault/01-Analisis/dump.bin',
      'vault/01-Analisis/temp.exe',
      'vault/01-Analisis/lib.dll',
      'vault/01-Analisis/preview.png',
      'vault/01-Analisis/cache.tmp'
    ];

    for (const filePath of forbiddenFiles) {
      const result = validateVaultNote(filePath, 'Binary or foreign artifact content');
      assert.strictEqual(result.valid, false);
      assert.match(result.error, /Invalid file extension/i);
    }
  });

  it('4. should handle unicode boundary conditions, null bytes, and RTL bidirectional characters', () => {
    // Null byte injection
    const nullByteContent = '# Note with null byte\0injection attempt';
    const nullResult = validateVaultNote('vault/02-Naming/null.md', nullByteContent);
    assert.strictEqual(nullResult.valid, false);
    assert.match(nullResult.error, /Null byte/i);

    // RTL character U+202E (Right-to-Left Override) & astral symbols
    const rtlContent = '# Unicode Test Note\n' +
      'Contains RTL override \u202E reversed text \u202C and emoji \u{1F680}\u{1F512} and Chinese \u6E05\u5BA4\u5DE5\u7A0B.';
    const rtlResult = validateVaultNote('vault/02-Naming/unicode.md', rtlContent);
    assert.strictEqual(rtlResult.valid, true);

    // Verify round-trip encoding integrity without loss
    const buffer = Buffer.from(rtlContent, 'utf8');
    const decoded = buffer.toString('utf8');
    assert.strictEqual(decoded, rtlContent);
  });

  it('5. should reject Log.md when chronological date sections or clean-room attestations are missing', () => {
    // Log without date header
    const missingDateLog = '# Engineering Log\nSome unstructured thoughts without date headers.';
    const logResult1 = validateLogStructure(missingDateLog);
    assert.strictEqual(logResult1.valid, false);
    assert.match(logResult1.error, /Missing required chronological date header/i);

    // Log with date but missing clean-room attestation
    const missingAttestationLog = '# Engineering Log\n## 2026-11-23\n- Built new component.';
    const logResult2 = validateLogStructure(missingAttestationLog);
    assert.strictEqual(logResult2.valid, false);
    assert.match(logResult2.error, /Missing clean-room protocol/i);

    // Valid compliant Log structure
    const validLog = '# Engineering Log\n## 2026-11-23\n- Strictly followed clean-room engineering protocol with zero FlowPrompter source copying.';
    const validResult = validateLogStructure(validLog);
    assert.strictEqual(validResult.valid, true);
  });
});
