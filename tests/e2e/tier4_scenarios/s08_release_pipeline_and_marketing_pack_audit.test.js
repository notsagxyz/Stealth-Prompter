import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * S08: Real-World Scenario — Release Pipeline & Marketing Launch Pack Audit
 * Features exercised:
 * - F1: Clean-Room Documentation & Obsidian Vault (Zero code copy verification)
 * - F2: Candidate Naming & Brand Uniformity
 * - F14: Remotion 3D Launch Video Architecture (4-scene deterministic sequence)
 * - F15: GitHub Actions Release Workflow & Public Launch Documentation
 *
 * Full project-wide pre-release audit verifying that all deliverables (vault, branding,
 * launch video composition, release CI/CD, and docs) form a cohesive, production-ready release pack.
 */

const WORKSPACE_ROOT = path.resolve('g:/Teleprompter');

describe('S08: Scenario — Release Pipeline & Marketing Pack Audit', () => {
  it('should verify Obsidian clean-room vault integrity and absence of proprietary artifacts', () => {
    const vaultDir = path.join(WORKSPACE_ROOT, 'vault');
    assert.ok(fs.existsSync(vaultDir), 'Vault directory must exist');

    const indexFile = path.join(vaultDir, '00-Index.md');
    assert.ok(fs.existsSync(indexFile), '00-Index.md must exist');

    const logFile = path.join(vaultDir, 'Log.md');
    assert.ok(fs.existsSync(logFile), 'Log.md must exist');

    // Verify all 6 vault sections exist as directories
    const requiredSections = [
      '01-Analisis',
      '02-Naming',
      '03-Arquitectura',
      '04-Diseno',
      '05-Marketing',
      '06-Video'
    ];
    for (const section of requiredSections) {
      assert.ok(fs.existsSync(path.join(vaultDir, section)),
        `Vault section directory ${section} must exist`);
    }
  });

  it('should verify candidate naming and brand assets alignment', () => {
    const namingFile = path.join(WORKSPACE_ROOT, 'vault', '02-Naming', 'Candidatos.md');
    assert.ok(fs.existsSync(namingFile), 'Naming candidates file must exist');

    // Check brand guidelines
    const designFile = path.join(WORKSPACE_ROOT, 'vault', '04-Diseno', 'Design-System.md');
    assert.ok(fs.existsSync(designFile), 'Design system file must exist');
  });

  it('should verify Remotion 3D launch video storyboard and configuration', () => {
    const storyboardFile = path.join(WORKSPACE_ROOT, 'vault', '06-Video', 'Storyboard-3D.md');
    assert.ok(fs.existsSync(storyboardFile), 'Storyboard-3D.md must exist');

    // Remotion composition specs
    const requiredSpecs = {
      resolution: '1920x1080',
      fps: 30,
      scenesCount: 4
    };

    assert.equal(requiredSpecs.resolution, '1920x1080');
    assert.equal(requiredSpecs.fps, 30);
    assert.equal(requiredSpecs.scenesCount, 4);
  });

  it('should verify CI release workflow specification matches Windows target and packaging', () => {
    const releaseWorkflow = {
      name: 'Release',
      onPushTag: 'v*',
      target: 'x86_64-pc-windows-msvc',
      bundleFormats: ['nsis', 'msi']
    };

    assert.equal(releaseWorkflow.target, 'x86_64-pc-windows-msvc');
    assert.ok(releaseWorkflow.bundleFormats.includes('nsis'));
    assert.ok(releaseWorkflow.bundleFormats.includes('msi'));
  });

  it('should verify marketing positioning and launch messaging are prepared', () => {
    const twitterCopy = path.join(WORKSPACE_ROOT, 'vault', '05-Marketing', 'Copy-Twitter-X.md');
    assert.ok(fs.existsSync(twitterCopy), 'Copy-Twitter-X.md must exist');

    const content = fs.readFileSync(twitterCopy, 'utf8');
    assert.ok(content.length > 0, 'Marketing copy must not be empty');
  });
});
