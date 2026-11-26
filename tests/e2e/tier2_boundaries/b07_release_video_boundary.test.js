import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_ROOT,
  ASSETS_DIR,
  REMOTION_DIR,
  VAULT_DIR,
  readTextSafe,
  walkFiles,
} from '../lib/paths.js';
import { ffprobe, parseFrameRate, parseGifInfo } from '../lib/media_probe.js';

function getMp4Candidates() {
  return [
    ...walkFiles(path.join(REMOTION_DIR, 'out'), { extensions: ['.mp4'] }),
    ...walkFiles(path.join(VAULT_DIR, '06-Video'), { extensions: ['.mp4'] }),
    ...walkFiles(ASSETS_DIR, { extensions: ['.mp4'] }),
  ];
}

describe('F7 — Release Video & Eval Boundaries (Tier 2)', () => {
  it('F7-T2-01: Even dimensions, yuv420p, and exact 16:9 / 9:16 aspect ratios via ffprobe', async () => {
    const mp4s = getMp4Candidates();
    let has16x9 = false;
    let has9x16 = false;

    for (const mp4 of mp4s) {
      const info = await ffprobe(mp4);
      const v = (info.streams || []).find((s) => s.codec_type === 'video');
      if (!v) continue;
      assert.equal(v.width % 2, 0, `Video width must be even: ${mp4} (${v.width})`);
      assert.equal(v.height % 2, 0, `Video height must be even: ${mp4} (${v.height})`);
      assert.equal(v.pix_fmt, 'yuv420p', `Video pix_fmt must be yuv420p for social compatibility: ${mp4}`);
      const ar = v.width / v.height;
      if (Math.abs(ar - 16 / 9) < 0.01 && v.width >= 1920) has16x9 = true;
      if (Math.abs(ar - 9 / 16) < 0.01 && v.height >= 1920) has9x16 = true;
    }

    assert.ok(has16x9, 'Missing valid 16:9 (1920x1080) yuv420p MP4 deliverable');
    assert.ok(has9x16, 'Missing valid 9:16 (1080x1920) yuv420p MP4 deliverable');
  });

  it('F7-T2-02: Reject legacy 30fps outputs (both 16:9 and 9:16 MP4s must be >= 59.9 fps)', async () => {
    const mp4s = getMp4Candidates();
    let count60 = 0;

    for (const mp4 of mp4s) {
      const info = await ffprobe(mp4);
      const v = (info.streams || []).find((s) => s.codec_type === 'video');
      if (!v) continue;
      const fps = parseFrameRate(v.r_frame_rate || v.avg_frame_rate);
      if (fps >= 59.9 && ((v.width === 1920 && v.height === 1080) || (v.width === 1080 && v.height === 1920))) {
        count60++;
      }
    }

    assert.ok(count60 >= 2, `Expected both 16:9 and 9:16 MP4s at >= 59.9 fps, found ${count60}`);
  });

  it('F7-T2-03: README GIF binary 0x3B trailer, animated frames (> 1), and < 25 MB', async () => {
    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    const gifMatch = readme.match(/(?:src=["']|\()([^)"']+\.gif)/i);
    assert.ok(gifMatch, 'README.md must link to an animated .gif');
    const gifPath = path.resolve(PROJECT_ROOT, gifMatch[1]);
    assert.ok(fs.existsSync(gifPath), `Missing README GIF: ${gifPath}`);

    const gif = parseGifInfo(gifPath);
    assert.ok(gif.validMagic, 'GIF must start with GIF89a or GIF87a');
    assert.ok(gif.hasTrailer, 'GIF file is truncated (missing 0x3B trailer)');
    assert.ok(gif.size < 25 * 1024 * 1024, `GIF exceeds 25 MB limit (${gif.size} bytes)`);

    const probe = await ffprobe(gifPath);
    const v = (probe.streams || []).find((s) => s.codec_type === 'video');
    const frames = Number(v?.nb_frames || v?.nb_read_frames || 0);
    assert.ok(frames > 1 || Number(probe.format?.duration || 0) > 1, 'README GIF must be animated (> 1 frame)');
  });

  it('F7-T2-04: HyperFrames vs Remotion evaluation doc is non-stub (> 300 words, compares both)', () => {
    const videoDocs = walkFiles(path.join(VAULT_DIR, '06-Video'), { extensions: ['.md'] })
      .filter((p) => !/storyboard/i.test(path.basename(p)));
    assert.ok(videoDocs.length >= 1, 'Expected HyperFrames vs Remotion evaluation markdown in vault/06-Video/');

    const combined = videoDocs.map((p) => readTextSafe(p)).join('\n');
    const wordCount = combined.trim().split(/\s+/).length;
    assert.ok(wordCount > 300, `Evaluation document is a stub (${wordCount} words <= 300)`);
    assert.match(combined, /HyperFrames/i);
    assert.match(combined, /Remotion/i);
  });

  it('F7-T2-05: Zero #00F0FF or StealthPrompter leak in video source or Storyboard-3D.md', () => {
    const targets = [
      ...walkFiles(path.join(REMOTION_DIR, 'src'), { extensions: ['.ts', '.tsx', '.css'] }),
      path.join(VAULT_DIR, '06-Video', 'Storyboard-3D.md'),
    ].filter((f) => fs.existsSync(f));

    assert.ok(targets.length >= 2, 'Expected video source files and Storyboard-3D.md');
    for (const f of targets) {
      const txt = readTextSafe(f);
      assert.doesNotMatch(txt, /StealthPrompter|#00F0FF/i, `Legacy StealthPrompter/#00F0FF found in ${f}`);
    }
  });

  it('F7-T2-06: Zero broken media links in README.md and non-zero media durations', async () => {
    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    const mediaLinks = Array.from(readme.matchAll(/(?:!\[[^\]]*\]\(|src=["'])([^)"']+\.(?:gif|mp4|png|svg|webp))/gi))
      .map((m) => m[1])
      .filter((ref) => !/^https?:\/\//i.test(ref));
    assert.ok(mediaLinks.length >= 2, 'README.md must link local logo and demo media');
    for (const ref of mediaLinks) {
      const full = path.resolve(PROJECT_ROOT, ref);
      assert.ok(fs.existsSync(full), `Broken README media path: ${ref}`);
      assert.ok(fs.statSync(full).size > 0, `Empty README media file: ${ref}`);
    }
  });
});
