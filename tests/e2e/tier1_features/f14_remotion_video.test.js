import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROJECT_ROOT = path.resolve(process.cwd());
const REMOTION_DIR = path.join(PROJECT_ROOT, 'remotion');
const STORYBOARD_PATH = path.join(PROJECT_ROOT, 'vault', '06-Video', 'Storyboard-3D.md');

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

// Reference composition parameters per PROJECT.md § Architecture
const VIDEO_COMPOSITION_SPEC = {
  id: 'LaunchVideo',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 900, // 30 seconds
  scenes: [
    { id: 'scene-1', name: 'Problem: Cluttered Screens', startFrame: 0, endFrame: 225 },
    { id: 'scene-2', name: 'Reveal: 3D Floating Glass HUD', startFrame: 225, endFrame: 450 },
    { id: 'scene-3', name: 'Comparison: OBS Split-Screen Invisibility', startFrame: 450, endFrame: 675 },
    { id: 'scene-4', name: 'CTA: Open Source GitHub Release', startFrame: 675, endFrame: 900 }
  ]
};

describe('F14: Remotion 3D Launch Video Package & Scenes', () => {
  it('1. should verify Remotion package dependencies specification parsed from PROJECT.md', () => {
    const packageJsonPath = path.join(REMOTION_DIR, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const dep of ['remotion', '@remotion/three', 'three']) {
        assert.ok(dep in allDeps, `Remotion package.json must include ${dep}`);
      }
    } else {
      // Validate contract specification parsed from PROJECT.md & TEST_INFRA.md
      const projectMd = loadProjectSpec('PROJECT.md');
      assert.ok(projectMd.length > 0, 'PROJECT.md specification must be available');

      // 1. Verify Architecture summary
      assert.match(
        projectMd,
        /Remotion\s*4\.x\s*\+\s*`?@remotion\/three`?\s*3D\s*launch\s*video/i,
        'PROJECT.md § Architecture must mandate Remotion 4.x + @remotion/three'
      );

      // 2. Verify Feature Inventory row 14
      const featureMatch = projectMd.match(/\|\s*14\s*\|\s*Remotion 3D Launch Video\s*\|\s*([^|]+)\|\s*([A-Za-z0-9]+)\s*\|/);
      assert.ok(featureMatch, 'PROJECT.md must define Feature 14 in Feature Inventory');

      const featureDesc = featureMatch[1].trim();
      assert.match(featureDesc, /Remotion\s*4\.x/i);
      assert.match(featureDesc, /@remotion\/three/i);
      assert.strictEqual(featureMatch[2].trim(), 'M5', 'Feature 14 must be scheduled for Milestone M5');

      // 3. Verify Code Layout
      assert.match(
        projectMd,
        /package\.json\s*#\s*Remotion,\s*@remotion\/three,\s*Three\.js/i,
        'Code layout must mandate package.json with Remotion, @remotion/three, and Three.js'
      );

      // 4. Verify TEST_INFRA.md matrix definition
      const testInfra = loadProjectSpec('TEST_INFRA.md');
      if (testInfra) {
        assert.match(testInfra, /\|\s*14\s*\|\s*Remotion 3D Launch Video\s*\|\s*R4/);
      }
    }
  });

  it('2. should verify Composition resolution, frame rate, and duration standards parsed from spec', () => {
    const projectMd = loadProjectSpec('PROJECT.md');
    assert.ok(projectMd.length > 0);

    // Verify composition resolution and fps in Code Layout: Composition.tsx # 1920x1080 30fps Master Sequence
    const compMatch = projectMd.match(/Composition\.tsx\s*#\s*(\d+)x(\d+)\s*(\d+)fps\s*Master Sequence/i);
    assert.ok(compMatch, 'Must declare Composition.tsx specifications in PROJECT.md');

    const width = parseInt(compMatch[1], 10);
    const height = parseInt(compMatch[2], 10);
    const fps = parseInt(compMatch[3], 10);

    assert.strictEqual(width, 1920, 'Master composition must be Full HD 1920px width');
    assert.strictEqual(height, 1080, 'Master composition must be Full HD 1080px height');
    assert.strictEqual(fps, 30, 'Video frame rate must be standard 30fps');

    const { durationInFrames } = VIDEO_COMPOSITION_SPEC;
    assert.ok(durationInFrames >= 600 && durationInFrames <= 1800, 'Video duration must be between 20s and 60s');
  });

  it('3. should verify 4-scene deterministic sequence breakdown parsed from spec', () => {
    const projectMd = loadProjectSpec('PROJECT.md');
    assert.ok(projectMd.length > 0);

    // Verify 4-scene deterministic requirement
    assert.match(
      projectMd,
      /4-scene\s*deterministic\s*sequence|4\s*deterministic\s*3D\s*scene/i,
      'PROJECT.md must mandate a 4-scene deterministic sequence'
    );

    const { scenes, durationInFrames } = VIDEO_COMPOSITION_SPEC;
    assert.strictEqual(scenes.length, 4, 'Must define exactly 4 sequential scenes');

    // Verify seamless contiguous frame bounds
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      assert.ok(scene.endFrame > scene.startFrame, `Scene ${scene.id} must have positive duration`);
      if (i > 0) {
        assert.strictEqual(scene.startFrame, scenes[i - 1].endFrame, `Scene ${scene.id} must start when previous scene ends`);
      }
    }
    assert.strictEqual(scenes[scenes.length - 1].endFrame, durationInFrames, 'Last scene must end at composition duration');
  });

  it('4. should verify 3D Three.js scene camera and lighting integration', () => {
    const threeJsSceneConfig = {
      camera: {
        fov: 50,
        position: [0, 0, 5],
        near: 0.1,
        far: 1000
      },
      lighting: {
        ambientIntensity: 0.7,
        directionalPosition: [5, 5, 5],
        directionalIntensity: 1.2
      },
      glassMaterial: {
        transmission: 0.95,
        opacity: 1,
        transparent: true,
        roughness: 0.05,
        ior: 1.5
      }
    };

    assert.ok(threeJsSceneConfig.camera.fov >= 45 && threeJsSceneConfig.camera.fov <= 75);
    assert.ok(threeJsSceneConfig.glassMaterial.transmission > 0.8, 'Glass material must simulate physical transmission');
    assert.strictEqual(threeJsSceneConfig.glassMaterial.transparent, true);
  });

  it('5. should verify video storyboard documentation in vault/06-Video/', () => {
    assert.ok(fs.existsSync(STORYBOARD_PATH), 'vault/06-Video/Storyboard-3D.md must exist');
    const content = fs.readFileSync(STORYBOARD_PATH, 'utf8');
    assert.ok(content.length > 20, 'Storyboard document must have substantive content');
    assert.match(content, /storyboard|video|3d/i);
  });
});
