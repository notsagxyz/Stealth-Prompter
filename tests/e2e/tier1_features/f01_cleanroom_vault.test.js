import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(process.cwd());
const VAULT_DIR = path.join(PROJECT_ROOT, 'vault');

describe('F01: Clean-Room Documentation & Obsidian Vault', () => {
  it('1. should verify 00-Index.md exists with valid YAML frontmatter and navigation sections', () => {
    const indexPath = path.join(VAULT_DIR, '00-Index.md');
    assert.ok(fs.existsSync(indexPath), 'vault/00-Index.md must exist');

    const content = fs.readFileSync(indexPath, 'utf8');
    assert.ok(content.startsWith('---'), '00-Index.md must start with YAML frontmatter delimiter');
    const secondDelim = content.indexOf('---', 3);
    assert.ok(secondDelim > 3, '00-Index.md must have a closing YAML frontmatter delimiter');

    const frontmatter = content.substring(3, secondDelim);
    assert.match(frontmatter, /title:/i, 'Frontmatter must specify title');
    assert.match(frontmatter, /tags:/i, 'Frontmatter must specify tags');

    // Verify all 6 core navigation sections are linked
    const expectedSections = [
      '01-Analisis',
      '02-Naming',
      '03-Arquitectura',
      '04-Diseno',
      '05-Marketing',
      '06-Video'
    ];
    for (const section of expectedSections) {
      assert.ok(
        content.includes(section),
        `00-Index.md must reference navigation section: ${section}`
      );
    }
  });

  it('2. should verify Log.md contains chronological engineering log and environment audit', () => {
    const logPath = path.join(VAULT_DIR, 'Log.md');
    assert.ok(fs.existsSync(logPath), 'vault/Log.md must exist');

    const content = fs.readFileSync(logPath, 'utf8');
    assert.ok(content.length > 50, 'Log.md must contain detailed engineering log content');

    // Must have date headers e.g. [2026-11-22] or ## [YYYY-MM-DD]
    const dateHeaderPattern = /\[\d{4}-\d{2}-\d{2}\]|##\s+\[?\d{4}-\d{2}-\d{2}\]?/;
    assert.match(content, dateHeaderPattern, 'Log.md must contain chronological date headers');

    // Must document toolchain / environment or completed tasks
    assert.match(content, /(- \[[x ]\]|toolchain|node|rust|git)/i, 'Log.md must track progress or environment status');
  });

  it('3. should verify clean-room reverse engineering compliance in 01-Analisis', () => {
    const analisisDir = path.join(VAULT_DIR, '01-Analisis');
    assert.ok(fs.existsSync(analisisDir), 'vault/01-Analisis directory must exist');

    const files = fs.readdirSync(analisisDir).filter(f => f.endsWith('.md'));
    assert.ok(files.length >= 1, '01-Analisis must contain at least one analysis note');

    // Check content of first note for clean-room adherence
    const primaryFile = path.join(analisisDir, files[0]);
    const content = fs.readFileSync(primaryFile, 'utf8');
    assert.match(content, /clean[- ]room/i, 'Analysis notes must document clean-room engineering methodology');
  });

  it('4. should verify architectural decision records in 03-Arquitectura', () => {
    const arqDir = path.join(VAULT_DIR, '03-Arquitectura');
    assert.ok(fs.existsSync(arqDir), 'vault/03-Arquitectura directory must exist');

    const adrFiles = fs.readdirSync(arqDir).filter(f => f.startsWith('ADR-') && f.endsWith('.md'));
    assert.ok(adrFiles.length >= 1, '03-Arquitectura must contain at least one ADR');

    const adr001Path = path.join(arqDir, adrFiles[0]);
    const adrContent = fs.readFileSync(adr001Path, 'utf8');
    assert.match(adrContent, /Tauri/i, 'ADR-001 must justify Tauri 2 architecture');
    assert.match(adrContent, /Rust/i, 'ADR-001 must specify Rust backend');
  });

  it('5. should verify complete vault taxonomy structure across all 6 subdirectories', () => {
    const requiredDirs = [
      '01-Analisis',
      '02-Naming',
      '03-Arquitectura',
      '04-Diseno',
      '05-Marketing',
      '06-Video'
    ];

    for (const dirName of requiredDirs) {
      const dirPath = path.join(VAULT_DIR, dirName);
      assert.ok(fs.existsSync(dirPath), `Vault subdirectory ${dirName} must exist`);
      const stat = fs.statSync(dirPath);
      assert.ok(stat.isDirectory(), `${dirName} must be a directory`);

      const mdFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      assert.ok(mdFiles.length >= 1, `${dirName} must contain at least one markdown document`);
    }
  });
});
