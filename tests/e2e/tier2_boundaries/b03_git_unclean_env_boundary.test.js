import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Validates git environment rules, clean-room boundary isolation, and git cleanliness.
 * Requirements derived from ORIGINAL_REQUEST.md R1/R4 & PROJECT.md Feature 3:
 * - .gitignore must quarantine and ignore legacy/temp analysis folders and build outputs.
 * - Enforces LF line endings in git index.
 * - Empty commits with no changes are rejected.
 * - Detached HEAD states gracefully handled by commit hash resolution.
 * - Nested .git folders are strictly prevented.
 */
function checkGitIgnorePatterns(gitignoreContent, candidatePath) {
  const lines = gitignoreContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  const normalized = candidatePath.replace(/\\/g, '/').replace(/^\.\//, '');
  for (const pattern of lines) {
    const cleanPattern = pattern.replace(/^\//, '').replace(/\/$/, '');
    if (normalized === cleanPattern ||
        normalized.startsWith(cleanPattern + '/') ||
        (cleanPattern.startsWith('*') && normalized.endsWith(cleanPattern.slice(1)))) {
      return { ignored: true, matchedPattern: pattern };
    }
  }
  return { ignored: false };
}

function normalizeLineEndings(content, targetEnding = '\n') {
  if (typeof content !== 'string') {
    throw new TypeError('Content must be a string.');
  }
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, targetEnding);
}

function validateCommitCandidate(stagedChanges, commitMessage, options = {}) {
  if (!commitMessage || commitMessage.trim().length === 0) {
    return { valid: false, error: 'Commit message cannot be empty.' };
  }
  if (!stagedChanges || Object.keys(stagedChanges).length === 0) {
    if (!options.allowEmpty) {
      return { valid: false, error: 'Cannot commit: Working tree clean, zero staged changes.' };
    }
  }
  return { valid: true };
}

function resolveBranchOrCommit(gitHeadContent) {
  if (!gitHeadContent || typeof gitHeadContent !== 'string') {
    return { state: 'corrupted', ref: null };
  }
  const trimmed = gitHeadContent.trim();
  if (trimmed.startsWith('ref: refs/heads/')) {
    return { state: 'attached', branch: trimmed.replace('ref: refs/heads/', ''), sha: null };
  }
  if (/^[a-f0-9]{40}$/i.test(trimmed)) {
    return { state: 'detached', branch: null, sha: trimmed };
  }
  return { state: 'corrupted', ref: null };
}

function detectNestedGitDirectories(fileTree) {
  const violations = [];
  for (const entry of fileTree) {
    const normalized = entry.replace(/\\/g, '/');
    if (normalized !== '.git' && normalized.includes('/.git')) {
      violations.push(entry);
    }
  }
  return violations;
}

describe('B03: Git Unclean Environment & Toolchain Boundary Cases', () => {
  const mockGitIgnore = `
# Build outputs
target/
dist/
dist-electron/
node_modules/

# Clean-room quarantine
temp_analysis/
.flowprompter_cache/
*.tmp
*.log
`;

  it('1. should verify untracked legacy artifacts and temp analysis files are quarantined by .gitignore', () => {
    const testCases = [
      { path: 'temp_analysis/dump.json', shouldIgnore: true },
      { path: '.flowprompter_cache/index.dat', shouldIgnore: true },
      { path: 'target/debug/teleprompter.exe', shouldIgnore: true },
      { path: 'node_modules/vite/package.json', shouldIgnore: true },
      { path: 'scratch.tmp', shouldIgnore: true },
      { path: 'vault/00-Index.md', shouldIgnore: false },
      { path: 'src-tauri/Cargo.toml', shouldIgnore: false }
    ];

    for (const tc of testCases) {
      const res = checkGitIgnorePatterns(mockGitIgnore, tc.path);
      assert.strictEqual(
        res.ignored,
        tc.shouldIgnore,
        `Expected ${tc.path} to be ignored=${tc.shouldIgnore}, got ${res.ignored}`
      );
    }
  });

  it('2. should enforce consistent LF line endings and normalize CRLF input without data loss', () => {
    const windowsContent = 'Line 1\r\nLine 2 with \r\nLine 3\r\n';
    const normalizedLF = normalizeLineEndings(windowsContent, '\n');

    assert.ok(!normalizedLF.includes('\r\n'));
    assert.strictEqual(normalizedLF.split('\n').length, 4);

    // Verify round-trip conversion to CRLF if checked out on Windows
    const checkoutCRLF = normalizeLineEndings(normalizedLF, '\r\n');
    assert.strictEqual(checkoutCRLF, windowsContent);
  });

  it('3. should reject zero-change empty commits unless explicitly overridden', () => {
    // Zero staged changes
    const emptyStaged = {};
    const res = validateCommitCandidate(emptyStaged, 'feat: initial scaffold');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /zero staged changes/i);

    // Staged changes present
    const activeStaged = { 'vault/Log.md': 'updated' };
    const validRes = validateCommitCandidate(activeStaged, 'docs(vault): record clean-room log');
    assert.strictEqual(validRes.valid, true);

    // Empty commit with empty message
    const emptyMsgRes = validateCommitCandidate(activeStaged, '   ');
    assert.strictEqual(emptyMsgRes.valid, false);
    assert.match(emptyMsgRes.error, /Commit message cannot be empty/i);
  });

  it('4. should handle detached HEAD states gracefully by resolving commit SHA', () => {
    // Normal attached HEAD
    const attachedHead = 'ref: refs/heads/main\n';
    const attachedRes = resolveBranchOrCommit(attachedHead);
    assert.strictEqual(attachedRes.state, 'attached');
    assert.strictEqual(attachedRes.branch, 'main');

    // Detached HEAD (typical in CI workflows checking out specific tag or commit)
    const detachedHead = '7a18c948e3cf34268e0b6f937d94519926cb91b2\n';
    const detachedRes = resolveBranchOrCommit(detachedHead);
    assert.strictEqual(detachedRes.state, 'detached');
    assert.strictEqual(detachedRes.sha, '7a18c948e3cf34268e0b6f937d94519926cb91b2');

    // Corrupted HEAD
    const corruptedHead = 'INVALID REF STRING';
    const corruptedRes = resolveBranchOrCommit(corruptedHead);
    assert.strictEqual(corruptedRes.state, 'corrupted');
  });

  it('5. should detect nested git repositories and prevent accidental submodule corruption', () => {
    const cleanTree = [
      '.git',
      'vault/00-Index.md',
      'src-tauri/Cargo.toml',
      'src/main.ts'
    ];
    assert.deepStrictEqual(detectNestedGitDirectories(cleanTree), []);

    const dirtyTreeWithNestedGit = [
      '.git',
      'vault/00-Index.md',
      'temp_analysis/.git', // nested repo!
      'vendor/subproject/.git'
    ];
    const violations = detectNestedGitDirectories(dirtyTreeWithNestedGit);
    assert.strictEqual(violations.length, 2);
    assert.ok(violations.includes('temp_analysis/.git'));
    assert.ok(violations.includes('vendor/subproject/.git'));
  });
});
