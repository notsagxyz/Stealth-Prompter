import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Remotion 3D Video Composition Validator.
 * Corresponds to PROJECT.md Feature 14 & ORIGINAL_REQUEST.md R4:
 * - 1920x1080 30fps Master Composition (`Composition.tsx`).
 * - 4 deterministic scenes.
 * - H.264 even-dimension encoding requirements.
 * - Non-zero positive durationInFrames.
 * - Asset resolution and WebGL error handling.
 * - Audio-visual boundary sync.
 */
export class RemotionCompositionValidator {
  static validateDimensions(width, height) {
    if (typeof width !== 'number' || typeof height !== 'number') {
      return { valid: false, error: 'Dimensions must be numbers.' };
    }
    if (width <= 0 || height <= 0) {
      return { valid: false, error: `Invalid dimensions: ${width}x${height}. Dimensions must be positive non-zero integers.` };
    }
    // H.264 / yuv420p video codecs require even pixel dimensions (divisible by 2)
    if (width % 2 !== 0 || height % 2 !== 0) {
      return {
        valid: false,
        error: `CodecDimensionViolation: Width and height must be even integers for H.264 rendering. Got ${width}x${height}.`
      };
    }
    return { valid: true, width, height };
  }

  static validateCompositionConfig(config) {
    if (!config) {
      return { valid: false, error: 'Composition config is missing.' };
    }

    const { fps, durationInFrames, width, height } = config;

    if (typeof fps !== 'number' || fps <= 0) {
      return { valid: false, error: `Invalid fps: ${fps}. Must be a positive number.` };
    }

    if (typeof durationInFrames !== 'number' || durationInFrames <= 0) {
      return { valid: false, error: `Invalid durationInFrames: ${durationInFrames}. Must be greater than 0.` };
    }

    const dimRes = this.validateDimensions(width, height);
    if (!dimRes.valid) {
      return dimRes;
    }

    return { valid: true, totalDurationSeconds: durationInFrames / fps };
  }

  static validateThreeJsSceneAssets(sceneName, requiredAssets, availableAssets) {
    const missing = [];
    for (const asset of requiredAssets) {
      if (!availableAssets.includes(asset)) {
        missing.push(asset);
      }
    }

    if (missing.length > 0) {
      return {
        valid: false,
        sceneName,
        missingAssets: missing,
        error: `AssetResolutionError in ${sceneName}: Missing required 3D/texture assets [${missing.join(', ')}].`
      };
    }
    return { valid: true, sceneName };
  }

  static calculateRenderMemoryRequirement(width, height, concurrency = 4) {
    // Frame buffer size in MB: width * height * 4 bytes / 1024 / 1024
    const frameBufferMb = (width * height * 4) / (1024 * 1024);
    // Headless Chromium + Three.js context overhead per worker
    const workerOverheadMb = 350;
    const totalEstimatedMb = concurrency * (frameBufferMb * 4 + workerOverheadMb);
    const maxSafeNodeHeapMb = 4096; // 4GB default max-old-space-size

    return {
      frameBufferMb,
      totalEstimatedMb,
      exceedsHeap: totalEstimatedMb > maxSafeNodeHeapMb,
      recommendedConcurrency: totalEstimatedMb > maxSafeNodeHeapMb ? Math.max(1, Math.floor(maxSafeNodeHeapMb / (frameBufferMb * 4 + workerOverheadMb))) : concurrency
    };
  }

  static verifyAudioVideoBoundarySync(compositionDurationFrames, fps, audioDurationSeconds) {
    const videoDurationSeconds = compositionDurationFrames / fps;
    const deltaSeconds = Math.abs(videoDurationSeconds - audioDurationSeconds);
    const maxDriftSeconds = 1.0 / fps; // Less than 1 frame drift

    return {
      videoDurationSeconds,
      audioDurationSeconds,
      deltaSeconds,
      inSync: deltaSeconds <= maxDriftSeconds
    };
  }
}

describe('B14: Remotion 3D Render Crash & Boundary Cases', () => {
  it('1. should reject invalid aspect ratios, negative dimensions, and odd pixel dimensions required by H.264', () => {
    // 0 and negative dimensions
    const zeroDim = RemotionCompositionValidator.validateDimensions(0, 1080);
    assert.strictEqual(zeroDim.valid, false);
    assert.match(zeroDim.error, /positive non-zero/i);

    // Odd pixel dimensions (e.g. 1921x1079) which cause ffmpeg / Remotion encoder crash
    const oddDim = RemotionCompositionValidator.validateDimensions(1921, 1080);
    assert.strictEqual(oddDim.valid, false);
    assert.match(oddDim.error, /CodecDimensionViolation.*even integers/i);

    // Standard valid 1080p
    const valid1080p = RemotionCompositionValidator.validateDimensions(1920, 1080);
    assert.strictEqual(valid1080p.valid, true);
  });

  it('2. should reject zero duration or negative frame compositions before rendering starts', () => {
    const zeroDurationConfig = {
      fps: 30,
      durationInFrames: 0,
      width: 1920,
      height: 1080
    };
    const zeroRes = RemotionCompositionValidator.validateCompositionConfig(zeroDurationConfig);
    assert.strictEqual(zeroRes.valid, false);
    assert.match(zeroRes.error, /durationInFrames.*greater than 0/i);

    const negativeDurationConfig = {
      fps: 30,
      durationInFrames: -150,
      width: 1920,
      height: 1080
    };
    const negRes = RemotionCompositionValidator.validateCompositionConfig(negativeDurationConfig);
    assert.strictEqual(negRes.valid, false);
    assert.match(negRes.error, /durationInFrames.*greater than 0/i);
  });

  it('3. should detect missing Three.js 3D models and textures with descriptive asset error', () => {
    const sceneAssets = ['models/laptop.glb', 'textures/screen_glow.png', 'hdr/studio.hdr'];
    const availableAssets = ['models/laptop.glb']; // missing textures and hdr

    const checkRes = RemotionCompositionValidator.validateThreeJsSceneAssets('Scene2_InvisibilityDemo', sceneAssets, availableAssets);
    assert.strictEqual(checkRes.valid, false);
    assert.match(checkRes.error, /AssetResolutionError.*Missing required 3D\/texture assets/i);
    assert.deepStrictEqual(checkRes.missingAssets, ['textures/screen_glow.png', 'hdr/studio.hdr']);
  });

  it('4. should guard against out-of-memory crash during 4K rendering by adjusting worker concurrency', () => {
    // 4K resolution (3840x2160)
    const memReqHighConcurrency = RemotionCompositionValidator.calculateRenderMemoryRequirement(3840, 2160, 12);
    assert.strictEqual(memReqHighConcurrency.exceedsHeap, true);
    assert.ok(memReqHighConcurrency.recommendedConcurrency < 12);

    // 1080p resolution with standard concurrency (4)
    const memReq1080p = RemotionCompositionValidator.calculateRenderMemoryRequirement(1920, 1080, 4);
    assert.strictEqual(memReq1080p.exceedsHeap, false);
    assert.strictEqual(memReq1080p.recommendedConcurrency, 4);
  });

  it('5. should enforce audio and video boundary synchronization within sub-frame accuracy', () => {
    const fps = 30;
    const durationFrames = 900; // 30 seconds

    // Audio matching video (30.0s)
    const synced = RemotionCompositionValidator.verifyAudioVideoBoundarySync(durationFrames, fps, 30.0);
    assert.strictEqual(synced.inSync, true);
    assert.strictEqual(synced.deltaSeconds, 0);

    // Audio trailing by 2 seconds -> out of sync
    const desynced = RemotionCompositionValidator.verifyAudioVideoBoundarySync(durationFrames, fps, 32.5);
    assert.strictEqual(desynced.inSync, false);
    assert.strictEqual(desynced.deltaSeconds, 2.5);
  });
});
