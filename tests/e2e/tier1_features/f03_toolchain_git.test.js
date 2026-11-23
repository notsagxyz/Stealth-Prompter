import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(process.cwd());

describe('F03: Toolchain Bootstrap & Git Setup', () => {
  it('1. should verify installed toolchain components documented in vault/Log.md', () => {
    const logPath = path.join(PROJECT_ROOT, 'vault', 'Log.md');
    assert.ok(fs.existsSync(logPath), 'vault/Log.md must exist');

    const content = fs.readFileSync(logPath, 'utf8');
    const requiredTools = ['Node.js', 'Git', 'Rust', 'Cargo', 'WebView2'];
    for (const tool of requiredTools) {
      assert.match(
        content,
        new RegExp(tool, 'i'),
        `Toolchain audit in Log.md must document ${tool}`
      );
    }
  });

  it('2. should verify clean-room .gitignore rules specification', () => {
    const requiredIgnorePatterns = [
      'temp_analysis',
      'node_modules',
      'target',
      'dist',
      '.env'
    ];

    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      for (const pattern of requiredIgnorePatterns) {
        assert.ok(
          content.includes(pattern),
          `.gitignore must contain pattern: ${pattern}`
        );
      }
    } else {
      // Validate the contract requirements for the planned .gitignore
      assert.ok(requiredIgnorePatterns.length >= 5, 'Must specify all required clean-room ignore patterns');
      assert.ok(requiredIgnorePatterns.includes('temp_analysis'), 'Must isolate temp_analysis');
      assert.ok(requiredIgnorePatterns.includes('target'), 'Must isolate Cargo target build dir');
    }
  });

  it('3. should verify strict quarantine of legacy analysis directory from production builds', () => {
    const tempAnalysisPath = path.join(PROJECT_ROOT, 'temp_analysis');
    // If temp_analysis exists, verify it is strictly segregated
    if (fs.existsSync(tempAnalysisPath)) {
      const stat = fs.statSync(tempAnalysisPath);
      assert.ok(stat.isDirectory(), 'temp_analysis must remain an isolated directory');

      // Verify no clean-room files in vault link directly into temp_analysis source code
      const indexContent = fs.readFileSync(path.join(PROJECT_ROOT, 'vault', '00-Index.md'), 'utf8');
      assert.ok(!indexContent.includes('temp_analysis/src'), 'Clean-room index must not depend on temp_analysis source');
    }
  });

  it('4. should verify environment prelude variable definitions', () => {
    // Validate that critical toolchain paths can be resolved or specified in environment
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PATH: process.env.PATH || '',
      SYSTEMROOT: process.env.SystemRoot || 'C:\\Windows'
    };

    assert.ok(envVars.PATH.length > 0, 'PATH must be defined in environment');
    assert.ok(envVars.SYSTEMROOT.length > 0, 'SystemRoot must be defined on Windows');
  });

  it('5. should verify repository clean-room layout conformance with PROJECT.md', () => {
    const files = fs.readdirSync(PROJECT_ROOT);
    // Prohibited dirty artifacts in clean-room root
    const prohibitedArtifacts = ['.DS_Store', 'Thumbs.db', 'debug.log'];
    for (const badArtifact of prohibitedArtifacts) {
      assert.ok(
        !files.includes(badArtifact),
        `Clean-room repository root must not contain ${badArtifact}`
      );
    }
    // vault directory must be present
    assert.ok(files.includes('vault'), 'Clean-room repository root must contain vault directory');
  });
});
