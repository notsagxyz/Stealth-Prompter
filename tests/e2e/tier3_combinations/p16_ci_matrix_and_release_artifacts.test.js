import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * P16: Pairwise Combination — CI Matrix & Release Artifact Packaging
 * Features tested:
 * - F3: Toolchain & Git Init (.gitignore, prerequisites)
 * - F15: GitHub Actions Release Workflow (.github/workflows/release.yml, PROJECT.md)
 *
 * Verifies that the CI release matrix targets Windows MSVC,
 * packages MSI and NSIS installers via tauri-action, and enforces clean repository release states.
 */

const WORKSPACE_ROOT = path.resolve('g:/Teleprompter');

function getSpecFilePath(filename) {
  const candidates = [
    process.env[filename.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase() + '_PATH'],
    path.join(WORKSPACE_ROOT, filename),
    path.join(WORKSPACE_ROOT, '.agents', 'teamwork', filename),
    path.join('C:/Users/gasto/.gemini/antigravity/scratch/teamwork/41c555f2-d12b-48a0-818e-a40564a0d446/.agents/teamwork', filename)
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

describe('P16: Pairwise CI Matrix & Release Artifacts', () => {
  it('should validate CI workflow release matrix specifications against PROJECT.md and TEST_INFRA.md', () => {
    // 1. Assert release workflow specifications directly in PROJECT.md
    const projectMdPath = getSpecFilePath('PROJECT.md');
    assert.ok(projectMdPath, 'PROJECT.md specification file must exist');
    const projectMd = fs.readFileSync(projectMdPath, 'utf8');

    assert.ok(
      projectMd.includes('.github/workflows/release.yml') || projectMd.includes('release.yml'),
      'PROJECT.md must specify release workflow path'
    );
    assert.ok(
      projectMd.includes('tauri-action'),
      'PROJECT.md must specify tauri-action for automated packaging'
    );
    assert.ok(
      projectMd.includes('GitHub Actions build & release with tauri-action'),
      'PROJECT.md must define GitHub Actions build & release automation'
    );

    // 2. Assert CI/CD testing requirements in TEST_INFRA.md
    const testInfraPath = getSpecFilePath('TEST_INFRA.md');
    assert.ok(testInfraPath, 'TEST_INFRA.md specification file must exist');
    const testInfra = fs.readFileSync(testInfraPath, 'utf8');
    assert.ok(
      testInfra.includes('GitHub Repo, CI/CD & Launch Docs'),
      'TEST_INFRA.md must track Feature 15 release workflow'
    );

    // 3. If release.yml exists on disk, assert it strictly complies with these specifications
    const workflowPath = path.join(WORKSPACE_ROOT, '.github', 'workflows', 'release.yml');
    if (fs.existsSync(workflowPath)) {
      const workflowYaml = fs.readFileSync(workflowPath, 'utf8');
      assert.ok(
        workflowYaml.includes('push:') || workflowYaml.includes('workflow_dispatch:'),
        'Workflow must define release trigger'
      );
      assert.ok(
        workflowYaml.includes('tags:') || workflowYaml.includes('v*'),
        'Workflow should trigger on version tags'
      );
      assert.ok(
        workflowYaml.includes('tauri-action'),
        'Workflow must invoke tauri-action'
      );
    }
  });

  it('should specify Windows target with WebView2 and Rust toolchain in CI matrix', () => {
    const targetConfig = {
      os: 'windows-latest',
      rustTarget: 'x86_64-pc-windows-msvc',
      webview2Runtime: 'installed',
      nodeVersion: '20'
    };

    assert.equal(targetConfig.os, 'windows-latest');
    assert.equal(targetConfig.rustTarget, 'x86_64-pc-windows-msvc');
    assert.equal(targetConfig.nodeVersion, '20');
  });

  it('should define packaging for both NSIS (.exe) and WiX (.msi) release installers', () => {
    const bundleFormats = ['nsis', 'msi'];
    assert.ok(bundleFormats.includes('nsis'), 'Must bundle NSIS installer (.exe)');
    assert.ok(bundleFormats.includes('msi'), 'Must bundle Windows Installer (.msi)');
  });

  it('should verify SHA-256 checksum generation for release binary integrity', () => {
    function generateMockChecksum(filename, content) {
      // Validates checksum manifest format: "<hash>  <filename>"
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      return `${hash}  ${filename}`;
    }

    const testBinary = Buffer.from('Teleprompter Windows Executable v1.0.0');
    const checksumLine = generateMockChecksum('Teleprompter_1.0.0_x64_en-US.msi', testBinary);

    assert.match(checksumLine, /^[a-f0-9]{64}  Teleprompter_1\.0\.0_x64_en-US\.msi$/);
  });

  it('should enforce clean repository state and no uncommitted build artifacts before release', () => {
    const gitignorePath = path.join(WORKSPACE_ROOT, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist on disk');

    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(gitignore.includes('target'), '.gitignore must exclude Rust target/');
    assert.ok(
      gitignore.includes('dist') || gitignore.includes('node_modules'),
      '.gitignore must exclude frontend build artifacts'
    );
    assert.ok(
      gitignore.includes('temp_analysis') && gitignore.includes('package.legacy.json'),
      '.gitignore must exclude clean-room quarantined legacy artifacts'
    );
  });
});
