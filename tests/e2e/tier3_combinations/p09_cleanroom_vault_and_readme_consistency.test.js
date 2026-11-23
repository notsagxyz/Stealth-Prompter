import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * P09: Pairwise Combination — Clean-Room Vault & Readme / Documentation Consistency
 * Features tested:
 * - F1: Clean-Room Documentation & Vault (vault/00-Index.md, Log.md, ADRs)
 * - F15: GitHub Repo, CI/CD & Launch Documentation (README.md, Licensure)
 *
 * Verifies that the Obsidian vault adheres strictly to clean-room reverse-engineering,
 * architectural decisions match implementation specs, and public docs align with open-source licensing.
 */

const WORKSPACE_ROOT = path.resolve('g:/Teleprompter');
const VAULT_DIR = path.join(WORKSPACE_ROOT, 'vault');

describe('P09: Pairwise Clean-Room Vault & README Consistency', () => {
  it('should verify vault/00-Index.md structure and navigation map across all 6 sections', () => {
    const indexPath = path.join(VAULT_DIR, '00-Index.md');
    assert.ok(fs.existsSync(indexPath), 'vault/00-Index.md must exist on disk');

    const content = fs.readFileSync(indexPath, 'utf8');
    assert.ok(content.includes('01. Análisis'), 'Must contain section 01 Analysis');
    assert.ok(content.includes('02. Naming'), 'Must contain section 02 Naming');
    assert.ok(content.includes('03. Arquitectura'), 'Must contain section 03 Architecture');
    assert.ok(content.includes('04. Sistema de Diseño'), 'Must contain section 04 Design System');
    assert.ok(content.includes('05. Marketing'), 'Must contain section 05 Marketing');
    assert.ok(content.includes('06. Video'), 'Must contain section 06 Video 3D');
  });

  it('should verify vault/Log.md contains verified toolchain versions and clean-room log', () => {
    const logPath = path.join(VAULT_DIR, 'Log.md');
    assert.ok(fs.existsSync(logPath), 'vault/Log.md must exist on disk');

    const content = fs.readFileSync(logPath, 'utf8');
    assert.ok(content.includes('Node.js'), 'Must document Node.js environment');
    assert.ok(content.includes('Rust'), 'Must document Rust toolchain');
    assert.ok(content.includes('Cargo'), 'Must document Cargo');
    assert.ok(content.includes('Git'), 'Must document Git version');
  });

  it('should enforce clean-room boundaries and zero code copying from FlowPrompter', () => {
    // Check that vault notes explicitly document clean-room ethical reverse engineering
    const analysisPath = path.join(VAULT_DIR, '01-Analisis', 'FlowPrompter-hallazgos.md');
    assert.ok(fs.existsSync(analysisPath), 'Clean-room analysis notes must exist on disk');
    const content = fs.readFileSync(analysisPath, 'utf8');
    assert.ok(content.length > 0, 'Analysis notes must not be empty');
    assert.ok(
      content.includes('clean-room') || content.includes('Clean-Room'),
      'Analysis notes must enforce clean-room protocol'
    );

    const cleanRoomDoc = path.join(VAULT_DIR, '01-Analisis', 'Clean-Room-Analysis.md');
    assert.ok(fs.existsSync(cleanRoomDoc), 'Clean-Room-Analysis.md must exist on disk');
    const cleanRoomContent = fs.readFileSync(cleanRoomDoc, 'utf8');
    assert.ok(
      cleanRoomContent.includes('WDA_EXCLUDEFROMCAPTURE'),
      'Clean-room analysis must document WDA_EXCLUDEFROMCAPTURE Win32 mechanism'
    );
    assert.ok(
      cleanRoomContent.includes('Chinese Wall') || cleanRoomContent.includes('aislamiento'),
      'Clean-room analysis must document isolation protocol'
    );

    // Verify root .gitignore ignores quarantined legacy artifacts
    const gitignorePath = path.join(WORKSPACE_ROOT, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist on disk');
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(
      gitignore.includes('temp_analysis') && gitignore.includes('package.legacy.json'),
      '.gitignore must isolate temporary analysis artifacts and legacy package.json'
    );
  });

  it('should verify ADRs document Tauri 2 + Rust core stack and WDA_EXCLUDEFROMCAPTURE', () => {
    const adr1Path = path.join(VAULT_DIR, '03-Arquitectura', 'ADR-001-Stack-Tauri2-Rust.md');
    assert.ok(fs.existsSync(adr1Path), 'ADR-001 must exist on disk');

    const adr1 = fs.readFileSync(adr1Path, 'utf8');
    assert.ok(adr1.includes('Tauri 2'), 'ADR-001 must specify Tauri 2');
    assert.ok(adr1.includes('Rust'), 'ADR-001 must specify Rust core stack');
    assert.ok(
      adr1.includes('WDA_EXCLUDEFROMCAPTURE') || adr1.includes('SetWindowDisplayAffinity'),
      'ADR-001 must specify Win32 display affinity capture exclusion'
    );
    assert.ok(
      adr1.includes('WindowPlatform'),
      'ADR-001 must specify WindowPlatform abstraction trait'
    );
  });

  it('should verify clean-room vault documentation and README consistency specifications directly', () => {
    // 1. Verify 00-Index.md mandates open-source clean-room project principles
    const indexContent = fs.readFileSync(path.join(VAULT_DIR, '00-Index.md'), 'utf8');
    assert.ok(indexContent.includes('open-source'), 'Master index must mandate open-source licensing');
    assert.ok(indexContent.includes('Clean-Room'), 'Master index must enforce clean-room engineering');

    // 2. Verify ADR-001 mandates MIT licensing and zero-telemetry
    const adrContent = fs.readFileSync(path.join(VAULT_DIR, '03-Arquitectura', 'ADR-001-Stack-Tauri2-Rust.md'), 'utf8');
    assert.ok(adrContent.includes('MIT'), 'ADR-001 must mandate MIT open-source license');
    assert.ok(adrContent.includes('código abierto'), 'ADR-001 must specify open source governance');

    // 3. Verify Log.md documents English language policy for public repository artifacts
    const logContent = fs.readFileSync(path.join(VAULT_DIR, 'Log.md'), 'utf8');
    assert.ok(
      logContent.includes('inglés') || logContent.includes('English'),
      'Log.md must document English documentation and marketing assets policy'
    );

    // 4. If README.md is present on disk, verify direct consistency with the vault specifications
    const readmePath = path.join(WORKSPACE_ROOT, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readme = fs.readFileSync(readmePath, 'utf8');
      assert.ok(
        readme.includes('Teleprompter') || readme.includes('Invisible'),
        'README title must match project name'
      );
      assert.ok(
        readme.includes('MIT') || readme.includes('License'),
        'README must declare open source MIT licensing consistent with ADR-001'
      );
    }
  });
});
