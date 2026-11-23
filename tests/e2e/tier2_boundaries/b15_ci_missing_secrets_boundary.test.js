import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * CI/CD Pipeline & GitHub Release Validator.
 * Corresponds to PROJECT.md Feature 15 & ORIGINAL_REQUEST.md R4:
 * - Handles builds without signing keys (e.g. pull requests from community forks).
 * - Enforces Windows-runner requirement for Windows display affinity tests.
 * - Strict Semantic Versioning (SemVer 2.0.0) validation on git release tags.
 * - Enforces non-empty CHANGELOG entry for targeted release tag.
 * - Verifies binary artifact existence and non-zero size before release asset upload.
 */
export class CiPipelineValidator {
  static evaluateSigningStep(isForkedPr, secrets = {}) {
    const hasSigningKey = Boolean(secrets.TAURI_SIGNING_PRIVATE_KEY && secrets.TAURI_SIGNING_KEY_PASSWORD);

    if (isForkedPr || !hasSigningKey) {
      return {
        canSign: false,
        action: 'skip_signing',
        message: 'Signing secrets absent or PR is a community fork. Building unsigned verification artifacts.'
      };
    }

    return {
      canSign: true,
      action: 'sign_bundle',
      message: 'Private signing key authenticated. Proceeding with signed production installer generation.'
    };
  }

  static validateCiRunnerPlatform(runnerOs, testTier) {
    const isWindows = runnerOs.toLowerCase().includes('windows');
    // Tier 1 and 2 Win32 affinity tests require Windows API or platform mock
    if (!isWindows) {
      return {
        supported: false,
        error: `IncompatibleRunnerOs: Native Windows Display Affinity verification requires a Windows runner (windows-latest). Detected: ${runnerOs}.`
      };
    }
    return { supported: true, runnerOs };
  }

  static validateSemverTag(tag) {
    if (!tag || typeof tag !== 'string') {
      return { valid: false, error: 'Tag cannot be empty.' };
    }

    // Standard SemVer 2.0.0 with optional 'v' prefix: v1.2.3, 1.2.3, v1.0.0-rc.1, etc.
    const semverRegex = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

    if (!semverRegex.test(tag.trim())) {
      return { valid: false, error: `InvalidSemverTag: "${tag}" does not adhere to Semantic Versioning (X.Y.Z).` };
    }

    const clean = tag.startsWith('v') ? tag.slice(1) : tag;
    return { valid: true, cleanVersion: clean };
  }

  static validateChangelogReleaseNotes(changelogContent, targetVersion) {
    if (!changelogContent || changelogContent.trim().length === 0) {
      return { valid: false, error: 'CHANGELOG.md is empty.' };
    }

    const versionPattern = new RegExp(`##\\s+\\[?${targetVersion}\\]?`, 'i');
    const match = changelogContent.match(versionPattern);
    if (!match) {
      return {
        valid: false,
        error: `MissingReleaseNotes: No changelog section found matching version ${targetVersion} in CHANGELOG.md.`
      };
    }

    const sectionStart = match.index;
    const subContent = changelogContent.slice(sectionStart);
    const nextHeaderMatch = subContent.slice(1).search(/\n##\s+/);
    const sectionBody = nextHeaderMatch !== -1 ? subContent.slice(0, nextHeaderMatch + 1) : subContent;

    // Discard header line and check for bullet points
    const linesAfterHeader = sectionBody.split('\n').slice(1).join('\n');
    const bulletRegex = /^\s*[-*]\s+\w+/m;
    if (!bulletRegex.test(linesAfterHeader)) {
      return {
        valid: false,
        error: `EmptyReleaseNotes: Section for version ${targetVersion} contains no release notes or bullet points.`
      };
    }

    return { valid: true, targetVersion };
  }

  static validateReleaseArtifacts(artifacts) {
    if (!artifacts || artifacts.length === 0) {
      return { valid: false, error: 'Zero release artifacts provided for upload.' };
    }

    for (const art of artifacts) {
      if (!art.name || !art.sizeBytes || art.sizeBytes <= 0) {
        return {
          valid: false,
          error: `CorruptArtifact: "${art.name || 'unnamed'}" is missing or 0 bytes (${art.sizeBytes || 0} bytes).`
        };
      }
    }

    return { valid: true, artifactCount: artifacts.length };
  }
}

describe('B15: CI/CD Pipeline & GitHub Release Boundary Cases', () => {
  it('1. should gracefully skip signing step on PR builds without secrets while continuing build & test', () => {
    // Forked PR from external contributor
    const prResult = CiPipelineValidator.evaluateSigningStep(true, {});
    assert.strictEqual(prResult.canSign, false);
    assert.strictEqual(prResult.action, 'skip_signing');
    assert.match(prResult.message, /Building unsigned verification artifacts/i);

    // Main repo build with full release secrets
    const releaseResult = CiPipelineValidator.evaluateSigningStep(false, {
      TAURI_SIGNING_PRIVATE_KEY: 'mock-key',
      TAURI_SIGNING_KEY_PASSWORD: 'mock-password'
    });
    assert.strictEqual(releaseResult.canSign, true);
    assert.strictEqual(releaseResult.action, 'sign_bundle');
  });

  it('2. should reject non-Windows CI runners for native Windows display affinity verification jobs', () => {
    // Ubuntu runner
    const linuxRes = CiPipelineValidator.validateCiRunnerPlatform('ubuntu-latest', 'Tier 2');
    assert.strictEqual(linuxRes.supported, false);
    assert.match(linuxRes.error, /IncompatibleRunnerOs.*windows-latest/i);

    // macOS runner
    const macRes = CiPipelineValidator.validateCiRunnerPlatform('macos-latest', 'Tier 2');
    assert.strictEqual(macRes.supported, false);
    assert.match(macRes.error, /IncompatibleRunnerOs.*windows-latest/i);

    // Windows runner
    const winRes = CiPipelineValidator.validateCiRunnerPlatform('windows-2022', 'Tier 2');
    assert.strictEqual(winRes.supported, true);
  });

  it('3. should reject invalid SemVer git tags during automated release triggers', () => {
    const invalidTags = [
      'v1',
      'alpha-release',
      '1.0',
      'v1.2.3.4',
      'beta..2',
      'release-2026',
      ''
    ];

    for (const tag of invalidTags) {
      const res = CiPipelineValidator.validateSemverTag(tag);
      assert.strictEqual(res.valid, false);
      assert.match(res.error, /InvalidSemverTag|Tag cannot be empty/i);
    }

    // Valid semver tags
    const validTags = ['v1.0.0', '2.0.54', 'v0.1.0-beta.1', '1.0.0+build123'];
    for (const tag of validTags) {
      const res = CiPipelineValidator.validateSemverTag(tag);
      assert.strictEqual(res.valid, true);
    }
  });

  it('4. should reject release publishing if CHANGELOG.md is missing or release notes section is empty', () => {
    // Missing targeted version section
    const changelogMissing = '# Changelog\n\n## [0.9.0] - 2026-10-01\n- Old release';
    const missingRes = CiPipelineValidator.validateChangelogReleaseNotes(changelogMissing, '1.0.0');
    assert.strictEqual(missingRes.valid, false);
    assert.match(missingRes.error, /MissingReleaseNotes.*1.0.0/i);

    // Header exists but empty bullet points
    const changelogEmpty = '# Changelog\n\n## [1.0.0] - 2026-11-23\n\n## [0.9.0] - 2026-10-01\n- Old release';
    const emptyRes = CiPipelineValidator.validateChangelogReleaseNotes(changelogEmpty, '1.0.0');
    assert.strictEqual(emptyRes.valid, false);
    assert.match(emptyRes.error, /EmptyReleaseNotes.*1.0.0/i);

    // Compliant changelog
    const validChangelog = '# Changelog\n\n## [1.0.0] - 2026-11-23\n- Initial release with Tauri 2 and invisible HUD prompter.';
    const validRes = CiPipelineValidator.validateChangelogReleaseNotes(validChangelog, '1.0.0');
    assert.strictEqual(validRes.valid, true);
  });

  it('5. should reject release asset upload if output binary is 0 bytes or corrupted', () => {
    // 0-byte corrupt artifact
    const corruptArtifacts = [
      { name: 'teleprompter_x64_en-US.msi', sizeBytes: 8500000 },
      { name: 'teleprompter.exe', sizeBytes: 0 } // Corrupted 0-byte build output
    ];

    const corruptRes = CiPipelineValidator.validateReleaseArtifacts(corruptArtifacts);
    assert.strictEqual(corruptRes.valid, false);
    assert.match(corruptRes.error, /CorruptArtifact.*0 bytes/i);

    // Empty list
    const emptyRes = CiPipelineValidator.validateReleaseArtifacts([]);
    assert.strictEqual(emptyRes.valid, false);

    // Valid artifacts list
    const validArtifacts = [
      { name: 'teleprompter_x64_en-US.msi', sizeBytes: 8500000 },
      { name: 'teleprompter.exe', sizeBytes: 9200000 },
      { name: 'teleprompter.exe.sig', sizeBytes: 512 }
    ];
    const validRes = CiPipelineValidator.validateReleaseArtifacts(validArtifacts);
    assert.strictEqual(validRes.valid, true);
    assert.strictEqual(validRes.artifactCount, 3);
  });
});
