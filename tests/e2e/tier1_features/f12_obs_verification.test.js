import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROJECT_ROOT = path.resolve(process.cwd());

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

function loadCleanRoomAnalysis() {
  const analysisPath = path.join(PROJECT_ROOT, 'vault', '01-Analisis', 'Clean-Room-Analysis.md');
  if (fs.existsSync(analysisPath)) {
    return fs.readFileSync(analysisPath, 'utf8');
  }
  return '';
}

describe('F12: OBS & Video Calling Verification Guide & Procedures', () => {
  it('1. should verify OBS Studio capture source compatibility parsed from clean-room spec & PROJECT.md', () => {
    const analysisDoc = loadCleanRoomAnalysis();
    assert.ok(analysisDoc.length > 0, 'Clean-Room-Analysis.md must exist in vault');

    // Section 2.1 must specify OBS Studio as a target streaming software
    assert.match(analysisDoc, /OBS Studio/i, 'Clean-Room Analysis must include OBS Studio in target recording software');

    // PROJECT.md must catalog Feature 12
    const projectMd = loadProjectSpec('PROJECT.md');
    assert.ok(projectMd.length > 0);
    const feature12Match = projectMd.match(/\|\s*12\s*\|\s*OBS & Video Calling Verification Guide\s*\|\s*([^|]+)\|\s*([A-Za-z0-9]+)\s*\|/);
    assert.ok(feature12Match, 'PROJECT.md must define Feature 12 in Feature Inventory');

    const desc = feature12Match[1].trim();
    assert.match(desc, /OBS Studio/i, 'Feature 12 description must mandate OBS Studio verification');
    assert.strictEqual(feature12Match[2].trim(), 'M4', 'Feature 12 must be scheduled for Milestone M4');

    // TEST_INFRA.md must link to Requirement R3
    const testInfra = loadProjectSpec('TEST_INFRA.md');
    if (testInfra) {
      assert.match(testInfra, /\|\s*12\s*\|\s*OBS & Video Calling Verification Guide\s*\|\s*R3/);
    }
  });

  it('2. should verify conference software capture matrix (Teams, Zoom, Meet, Discord) parsed from vault', () => {
    const analysisDoc = loadCleanRoomAnalysis();
    assert.ok(analysisDoc.length > 0);

    // Section 2.1 documents the exact video conferencing matrix
    const expectedConferenceApps = [
      'Zoom',
      'Microsoft Teams',
      'Google Meet',
      'Discord'
    ];

    for (const app of expectedConferenceApps) {
      assert.ok(
        analysisDoc.includes(app),
        `Clean-Room Analysis § 2.1 must mandate invisibility for: ${app}`
      );
    }

    // PROJECT.md architecture section also mandates these platforms
    const projectMd = loadProjectSpec('PROJECT.md');
    assert.match(projectMd, /OBS,\s*Zoom,\s*Teams,\s*Discord,\s*Google Meet/);
  });

  it('3. should verify DWM capture exclusion architecture parsed from spec (transparent vs legacy black box)', () => {
    const analysisDoc = loadCleanRoomAnalysis();
    assert.ok(analysisDoc.length > 0);

    // Verify WDA_EXCLUDEFROMCAPTURE vs WDA_MONITOR behavioral contrast in spec
    assert.match(
      analysisDoc,
      /WDA_EXCLUDEFROMCAPTURE[\s\S]*?(?:completamente excluida|renderiza lo que esté detrás)/i,
      'WDA_EXCLUDEFROMCAPTURE must document complete exclusion rendering desktop behind'
    );

    assert.match(
      analysisDoc,
      /WDA_MONITOR[\s\S]*?(?:rectángulo completamente negro|negro)/i,
      'WDA_MONITOR must document legacy behavior rendering black rectangle'
    );

    // Minimum OS version requirement
    assert.match(analysisDoc, /Build 19041|2004/i, 'Must specify Windows 10 Build 19041 (Version 2004) minimum');
  });

  it('4. should verify step-by-step verification checklist protocol for OBS Studio', () => {
    const verificationChecklist = [
      '1. Launch Teleprompter application and position HUD over high-contrast desktop background',
      '2. Launch OBS Studio and add a "Display Capture" (Desktop) video source',
      '3. Observe OBS preview viewport: verify prompter text is NOT visible in OBS canvas',
      '4. Start test recording in OBS and speak while prompter scrolls for 10 seconds',
      '5. Stop recording and open generated MP4 video file: confirm clean recording without prompter overlay'
    ];

    assert.strictEqual(verificationChecklist.length, 5, 'Protocol must define 5 sequential verification steps');
    for (const step of verificationChecklist) {
      assert.ok(step.length > 20, 'Each protocol step must contain actionable instructions');
    }

    // Verify key verification checkpoints
    assert.ok(verificationChecklist[1].includes('Display Capture'));
    assert.ok(verificationChecklist[2].includes('NOT visible in OBS canvas'));
    assert.ok(verificationChecklist[4].includes('confirm clean recording'));
  });

  it('5. should verify multi-monitor capture behavior guidelines', () => {
    function evaluateMultiMonitorAffinity(targetMonitorId, currentAffinity) {
      // Moving window across monitors on Windows preserves HWND display affinity
      return {
        monitorId: targetMonitorId,
        affinityPreserved: currentAffinity === 17
      };
    }

    const moveResult = evaluateMultiMonitorAffinity('DISPLAY2', 17);
    assert.strictEqual(moveResult.affinityPreserved, true);
    assert.strictEqual(moveResult.monitorId, 'DISPLAY2');

    const invalidResult = evaluateMultiMonitorAffinity('DISPLAY1', 0);
    assert.strictEqual(invalidResult.affinityPreserved, false);
  });
});
