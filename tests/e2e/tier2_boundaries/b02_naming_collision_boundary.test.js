import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Validates candidate project and package names across target ecosystems:
 * - GitHub repo names: 1-100 characters, alphanumeric, hyphens, dots, underscores (cannot start with hyphen).
 * - Crates.io package names: 1-64 characters, ASCII alphanumeric, hyphens, underscores (must start with letter, cannot use reserved words).
 * - npm package names: 1-214 characters, lowercase only, URL-safe characters, no leading dot or underscore.
 * - Twitter/X handles: 1-15 characters, alphanumeric and underscore only.
 * Requirements derived from ORIGINAL_REQUEST.md R1 & PROJECT.md Feature 2.
 */
function validateCandidateName(name, platform) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name must be a non-empty string.' };
  }

  // Check homoglyph / non-ASCII Cyrillic/Greek lookalikes
  const isAscii = /^[\x20-\x7E]+$/.test(name);
  if (!isAscii) {
    return { valid: false, error: `Name "${name}" contains non-ASCII or homoglyph characters.` };
  }

  // Platform specific rules
  switch (platform) {
    case 'crates.io': {
      if (name.length < 1 || name.length > 64) {
        return { valid: false, error: `Crates.io name must be between 1 and 64 characters (got ${name.length}).` };
      }
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
        return { valid: false, error: 'Crates.io name must start with an ASCII letter and contain only alphanumeric, hyphen, or underscore.' };
      }
      const reserved = ['test', 'std', 'core', 'alloc', 'proc_macro'];
      if (reserved.includes(name.toLowerCase())) {
        return { valid: false, error: `Crates.io name "${name}" is a reserved crate name.` };
      }
      return { valid: true };
    }
    case 'npm': {
      if (name.length < 1 || name.length > 214) {
        return { valid: false, error: `npm name must be between 1 and 214 characters (got ${name.length}).` };
      }
      if (name !== name.toLowerCase()) {
        return { valid: false, error: 'npm package names cannot contain uppercase letters.' };
      }
      if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) {
        return { valid: false, error: 'npm name contains invalid characters or starts with punctuation.' };
      }
      return { valid: true };
    }
    case 'github': {
      if (name.length < 1 || name.length > 100) {
        return { valid: false, error: `GitHub repository name must be between 1 and 100 characters (got ${name.length}).` };
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(name) || name.startsWith('-') || name.startsWith('.')) {
        return { valid: false, error: 'GitHub repository name contains invalid characters or starts with a hyphen/dot.' };
      }
      return { valid: true };
    }
    case 'twitter': {
      if (name.length < 1 || name.length > 15) {
        return { valid: false, error: `Twitter/X handle must be between 1 and 15 characters (got ${name.length}).` };
      }
      if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        return { valid: false, error: 'Twitter/X handle can only contain letters, numbers, and underscores.' };
      }
      return { valid: true };
    }
    default:
      return { valid: false, error: `Unknown platform: ${platform}` };
  }
}

/**
 * Filters candidates against registered taken handles and collision matrix.
 */
function selectTopAvailableCandidates(candidates, takenRegistry) {
  const available = [];
  for (const candidate of candidates) {
    const norm = candidate.toLowerCase().replace(/[-_]/g, '');
    const isTaken = takenRegistry.some(taken => taken.toLowerCase().replace(/[-_]/g, '') === norm);
    if (!isTaken) {
      available.push(candidate);
    }
  }
  return available.slice(0, 3);
}

describe('B02: Naming Collision & Boundary Edge Cases', () => {
  it('1. should reject candidate names with illegal special characters and command/path injection', () => {
    const maliciousNames = [
      'teleprompter<script>',
      'prompt/../../etc/passwd',
      'ghost;rm -rf /',
      'prompter" OR "1"="1',
      'ghost prompter', // space
      'tele@prompter',
      '#teleprompter'
    ];

    for (const name of maliciousNames) {
      const resCrates = validateCandidateName(name, 'crates.io');
      assert.strictEqual(resCrates.valid, false);

      const resNpm = validateCandidateName(name, 'npm');
      assert.strictEqual(resNpm.valid, false);

      const resGh = validateCandidateName(name, 'github');
      assert.strictEqual(resGh.valid, false);
    }
  });

  it('2. should enforce exact boundary limits for maximum name length per platform', () => {
    // Crates.io: max 64 chars
    const cratesValid64 = 'a'.repeat(64);
    const cratesInvalid65 = 'a'.repeat(65);
    assert.strictEqual(validateCandidateName(cratesValid64, 'crates.io').valid, true);
    assert.strictEqual(validateCandidateName(cratesInvalid65, 'crates.io').valid, false);

    // GitHub: max 100 chars
    const ghValid100 = 'a'.repeat(100);
    const ghInvalid101 = 'a'.repeat(101);
    assert.strictEqual(validateCandidateName(ghValid100, 'github').valid, true);
    assert.strictEqual(validateCandidateName(ghInvalid101, 'github').valid, false);

    // Twitter/X: max 15 chars
    const twValid15 = 'a'.repeat(15);
    const twInvalid16 = 'a'.repeat(16);
    assert.strictEqual(validateCandidateName(twValid15, 'twitter').valid, true);
    assert.strictEqual(validateCandidateName(twInvalid16, 'twitter').valid, false);
  });

  it('3. should detect taken handle collisions and eliminate collided candidates from top 3', () => {
    const candidates = [
      'FlowPrompter',      // Taken
      'TelePrompter',      // Taken
      'VanishPrompt',      // Available
      'GhostPrompter',     // Available
      'PhantomText',       // Available
      'SpecterPrompter'    // Available
    ];

    const takenRegistry = ['flowprompter', 'teleprompter', 'flow-prompter', 'tele_prompter'];

    const top3 = selectTopAvailableCandidates(candidates, takenRegistry);
    assert.strictEqual(top3.length, 3);
    assert.deepStrictEqual(top3, ['VanishPrompt', 'GhostPrompter', 'PhantomText']);
    assert.ok(!top3.includes('FlowPrompter'));
    assert.ok(!top3.includes('TelePrompter'));
  });

  it('4. should detect homoglyph attacks and reject visually disguised unicode lookalikes', () => {
    // Cyrillic small 'о' (U+043E) looks identical to Latin 'o' (U+006F)
    const homoglyphName = 'Gh\u043EstPrompter'; // Looks like GhostPrompter
    const result = validateCandidateName(homoglyphName, 'crates.io');
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /non-ASCII or homoglyph/i);

    // Greek small 'α' (U+03B1) vs Latin 'a'
    const greekName = 'V\u03B1nishPrompt';
    const resultGreek = validateCandidateName(greekName, 'npm');
    assert.strictEqual(resultGreek.valid, false);
    assert.match(resultGreek.error, /non-ASCII or homoglyph/i);
  });

  it('5. should enforce case sensitivity policies and prevent hyphen/underscore/case collision confusion', () => {
    // npm strictly forbids uppercase
    const mixedCaseNpm = 'GhostPrompter';
    const npmResult = validateCandidateName(mixedCaseNpm, 'npm');
    assert.strictEqual(npmResult.valid, false);
    assert.match(npmResult.error, /cannot contain uppercase/i);

    // Crates.io collision: Crates considers `foo-bar` and `foo_bar` to be identical packages
    const takenRegistry = ['ghost_prompter'];
    const candidates = ['ghost-prompter', 'GhostPrompter', 'VanishPrompter'];
    const available = selectTopAvailableCandidates(candidates, takenRegistry);

    // Both ghost-prompter and GhostPrompter collide with ghost_prompter under normalized rules
    assert.deepStrictEqual(available, ['VanishPrompter']);
  });
});
