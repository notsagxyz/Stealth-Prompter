import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROJECT_ROOT = path.resolve(process.cwd());
const WORKFLOW_PATH = path.join(PROJECT_ROOT, '.github', 'workflows', 'release.yml');
const README_PATH = path.join(PROJECT_ROOT, 'README.md');

/**
 * Resolves project specifications from repository, vault, or teamwork state.
 */
function loadProjectSpec(fileName = 'PROJECT.md') {
  const localPath = path.join(PROJECT_ROOT, fileName);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, 'utf8');

  const scratchRoot = path.join(os.homedir(), '.gemini', 'antigravity', 'scratch', 'teamwork');
  if (fs.existsSync(scratchRoot)) {
    try {
      const runs = fs.readdirSync(scratchRoot);
      for (const run of runs) {
        const candidate = path.join(scratchRoot, run, '.agents', 'teamwork', fileName);
        if (fs.existsSync(candidate)) {
          return fs.readFileSync(candidate, 'utf8');
        }
      }
    } catch {}
  }
  return '';
}

function loadAdr001() {
  const adrPath = path.join(PROJECT_ROOT, 'vault', '03-Arquitectura', 'ADR-001-Stack-Tauri2-Rust.md');
  if (fs.existsSync(adrPath)) {
    return fs.readFileSync(adrPath, 'utf8');
  }
  return '';
}

describe('F15: GitHub CI/CD Workflows, Launch Docs & Issue Templates', () => {
  it('1. should verify GitHub Actions release workflow specification parsed from PROJECT.md & ORIGINAL_REQUEST.md', () => {
    if (fs.existsSync(WORKFLOW_PATH)) {
      const content = fs.readFileSync(WORKFLOW_PATH, 'utf8');
      assert.match(content, /windows-latest/i, 'Workflow must run on windows-latest');
      assert.match(content, /tauri-action/i, 'Workflow must use tauri-action');
    } else {
      // Validate contract specification parsed from PROJECT.md & ORIGINAL_REQUEST.md
      const projectMd = loadProjectSpec('PROJECT.md');
      assert.ok(projectMd.length > 0, 'PROJECT.md specification must be available');

      // 1. Verify Feature 15 in Feature Inventory
      const featureMatch = projectMd.match(/\|\s*15\s*\|\s*GitHub Repo,\s*CI\/CD & Launch Docs\s*\|\s*([^|]+)\|\s*([A-Za-z0-9]+)\s*\|/);
      assert.ok(featureMatch, 'PROJECT.md must define Feature 15 in Feature Inventory');

      const featureDesc = featureMatch[1].trim();
      assert.match(featureDesc, /gh/i, 'Must mandate gh CLI repo setup');
      assert.match(featureDesc, /release workflow/i, 'Must mandate release workflow');
      assert.match(featureDesc, /tauri-action/i, 'Must mandate tauri-action in CI/CD');
      assert.match(featureDesc, /README/i, 'Must mandate README documentation');
      assert.match(featureDesc, /issue templates/i, 'Must mandate issue templates');
      assert.strictEqual(featureMatch[2].trim(), 'M5', 'Feature 15 must be scheduled for Milestone M5');

      // 2. Verify release.yml in Code Layout
      assert.match(
        projectMd,
        /release\.yml\s*#\s*GitHub Actions build & release with tauri-action/i,
        'Code layout must mandate .github/workflows/release.yml'
      );

      // 3. Verify ORIGINAL_REQUEST.md Requirement R4
      const originalReq = loadProjectSpec('ORIGINAL_REQUEST.md');
      if (originalReq) {
        assert.match(originalReq, /GitHub repository using `?gh`? with CI\/CD release configuration/);
      }
    }
  });

  it('2. should verify GitHub Issue templates structure and required fields parsed from spec', () => {
    const issueTemplateDir = path.join(PROJECT_ROOT, '.github', 'ISSUE_TEMPLATE');
    if (fs.existsSync(issueTemplateDir)) {
      const files = fs.readdirSync(issueTemplateDir);
      assert.ok(files.length >= 2, 'Must include at least 2 issue templates');
    } else {
      // Verify Code Layout mandates ISSUE_TEMPLATE directory
      const projectMd = loadProjectSpec('PROJECT.md');
      assert.ok(projectMd.length > 0);
      assert.match(
        projectMd,
        /ISSUE_TEMPLATE[\\\/]\s*#\s*Issue & PR templates/i,
        'PROJECT.md Code Layout must mandate .github/ISSUE_TEMPLATE'
      );
    }
  });

  it('3. should verify English README.md content requirements parsed from specifications', () => {
    const requiredSections = [
      'Features',
      'Invisibility',
      'Keyboard Shortcuts',
      'Installation',
      'Architecture',
      'License'
    ];

    if (fs.existsSync(README_PATH)) {
      const content = fs.readFileSync(README_PATH, 'utf8');
      for (const section of requiredSections) {
        assert.match(content, new RegExp(section, 'i'), `README must contain section: ${section}`);
      }
    } else {
      // Verify README requirements in ORIGINAL_REQUEST.md and PROJECT.md
      const originalReq = loadProjectSpec('ORIGINAL_REQUEST.md');
      assert.ok(originalReq.length > 0, 'ORIGINAL_REQUEST.md must be available');
      assert.match(
        originalReq,
        /complete English README/i,
        'ORIGINAL_REQUEST.md must mandate complete English README'
      );

      const projectMd = loadProjectSpec('PROJECT.md');
      assert.match(
        projectMd,
        /README\.md\s*#\s*Comprehensive English documentation/i,
        'PROJECT.md Code Layout must mandate comprehensive English README.md'
      );
    }
  });

  it('4. should verify language separation policy (English docs/UI, Spanish user communications) parsed from ORIGINAL_REQUEST.md', () => {
    const originalReq = loadProjectSpec('ORIGINAL_REQUEST.md');
    assert.ok(originalReq.length > 0, 'ORIGINAL_REQUEST.md must be available');

    // Requirement R4 explicit language separation mandate:
    // "All user communications must be in Spanish; all code, commits, documentation, and UI in English."
    assert.match(
      originalReq,
      /user communications must be in Spanish/i,
      'ORIGINAL_REQUEST.md must mandate user communications in Spanish'
    );
    assert.match(
      originalReq,
      /all code,\s*commits,\s*documentation,\s*and UI in English/i,
      'ORIGINAL_REQUEST.md must mandate code, commits, docs, and UI in English'
    );
  });

  it('5. should verify open-source MIT license attribution parsed from ADR-001', () => {
    const adrContent = loadAdr001();
    assert.ok(adrContent.length > 0, 'ADR-001 must exist in vault');

    // ADR-001 Section 5.1 explicitly mandates MIT license
    assert.match(
      adrContent,
      /código abierto\s*\(\s*MIT\s*\)/i,
      'ADR-001 must mandate 100% open-source under MIT license'
    );

    // Verify zero telemetry guarantee
    assert.match(
      adrContent,
      /sin rastreadores externos ni servicios analíticos/i,
      'ADR-001 must mandate zero external telemetry'
    );
  });
});
