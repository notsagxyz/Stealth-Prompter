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

function findDeliverableMp4s() {
  const dirs = [
    path.join(REMOTION_DIR, 'out'),
    path.join(VAULT_DIR, '06-Video'),
    ASSETS_DIR,
  ];
  const files = [];
  for (const d of dirs) {
    files.push(...walkFiles(d, { extensions: ['.mp4'] }));
  }
  return files;
}

describe('F7 — Release Video & HyperFrames/Remotion Evaluation (Tier 1)', () => {
  it('F7-T1-01: HyperFrames vs Remotion evaluation doc & updated Storyboard-3D.md in vault/06-Video/', () => {
    const videoDir = path.join(VAULT_DIR, '06-Video');
    const docs = walkFiles(videoDir, { extensions: ['.md'] });
    const combined = docs.map((d) => readTextSafe(d)).join('\n');

    assert.match(combined, /HyperFrames/i, 'vault/06-Video/ must document HyperFrames evaluation');
    assert.match(combined, /Remotion/i, 'vault/06-Video/ must document Remotion evaluation');

    const storyboardPath = path.join(videoDir, 'Storyboard-3D.md');
    assert.ok(fs.existsSync(storyboardPath), 'vault/06-Video/Storyboard-3D.md must exist');
    const sb = readTextSafe(storyboardPath);
    assert.match(sb, /Stealth\s+Prompter/i, 'Storyboard-3D.md must be updated to Stealth Prompter');
    assert.doesNotMatch(sb, /StealthPrompter|#00F0FF/i, 'Storyboard-3D.md must not retain old StealthPrompter/#00F0FF specs');
    assert.match(sb, /60\s*fps/i, 'Storyboard-3D.md must specify 60fps');
  });

  it('F7-T1-02: Horizontal 1920x1080 @ 60fps H.264 MP4 deliverable verified via ffprobe', async () => {
    const mp4s = findDeliverableMp4s();
    let match1080p60 = null;

    for (const mp4 of mp4s) {
      const info = await ffprobe(mp4);
      const vStream = (info.streams || []).find((s) => s.codec_type === 'video');
      if (!vStream) continue;
      const fps = parseFrameRate(vStream.r_frame_rate || vStream.avg_frame_rate);
      if (vStream.width === 1920 && vStream.height === 1080 && fps >= 59.9) {
        match1080p60 = { file: mp4, vStream, format: info.format, fps };
        break;
      }
    }

    assert.ok(
      match1080p60,
      `Expected a rendered 1920x1080 @ 60fps H.264 MP4 in remotion/out/ or assets/ or vault/06-Video/. Found MP4s: ${mp4s.join(', ') || 'none'}`
    );
    assert.equal(match1080p60.vStream.codec_name, 'h264');
    assert.ok(Number(match1080p60.format?.duration || 0) >= 8, 'Horizontal release video must be >= 8s');
  });

  it('F7-T1-03: Vertical 1080x1920 (9:16) @ 60fps H.264 MP4 deliverable verified via ffprobe', async () => {
    const mp4s = findDeliverableMp4s();
    let matchVertical = null;

    for (const mp4 of mp4s) {
      const info = await ffprobe(mp4);
      const vStream = (info.streams || []).find((s) => s.codec_type === 'video');
      if (!vStream) continue;
      const fps = parseFrameRate(vStream.r_frame_rate || vStream.avg_frame_rate);
      if (vStream.width === 1080 && vStream.height === 1920 && fps >= 59.9) {
        matchVertical = { file: mp4, vStream, format: info.format, fps };
        break;
      }
    }

    assert.ok(
      matchVertical,
      `Expected a rendered 1080x1920 (9:16) @ 60fps H.264 MP4. Found MP4s: ${mp4s.join(', ') || 'none'}`
    );
    assert.equal(matchVertical.vStream.codec_name, 'h264');
  });

  it('F7-T1-04: Short README .gif deliverable (GIF89a/87a, valid dims/duration) & linked in README.md', async () => {
    const readme = readTextSafe(path.join(PROJECT_ROOT, 'README.md'));
    const gifLinks = Array.from(readme.matchAll(/(?:src=["']|\()([^)"']+\.gif)/gi)).map((m) => m[1]);
    assert.ok(gifLinks.length >= 1, 'README.md must link to a demo .gif file');

    const resolved = path.resolve(PROJECT_ROOT, gifLinks[0]);
    assert.ok(fs.existsSync(resolved), `Linked README GIF does not exist on disk: ${gifLinks[0]}`);

    const gifHeader = parseGifInfo(resolved);
    assert.ok(gifHeader.validMagic, `Invalid GIF header in ${gifLinks[0]}`);
    assert.ok(gifHeader.width >= 480, `GIF width must be >= 480px, got ${gifHeader.width}`);
    assert.ok(gifHeader.size > 50 * 1024 && gifHeader.size <= 25 * 1024 * 1024, `GIF size out of bounds: ${gifHeader.size}`);

    const probe = await ffprobe(resolved);
    const dur = Number(probe.format?.duration || 0);
    assert.ok(dur >= 1.5 && dur <= 30, `GIF duration must be 1.5s..30s, got ${dur}s`);
  });

  it('F7-T1-05: Video composition root config registers 16:9 (1920x1080) & 9:16 (1080x1920) at 60fps', () => {
    const rootTsx = path.join(REMOTION_DIR, 'src', 'Root.tsx');
    assert.ok(fs.existsSync(rootTsx), 'remotion/src/Root.tsx must exist');
    const content = readTextSafe(rootTsx);
    assert.match(content, /1920/, 'Root.tsx must configure 1920 dimension');
    assert.match(content, /1080/, 'Root.tsx must configure 1080 dimension');
    assert.match(content, /fps=\{?60\}?/, 'Root.tsx must configure 60 fps');
  });

  it('F7-T1-06: Video source files use Stealth / Stealth Prompter & new palette (zero StealthPrompter/#00F0FF)', () => {
    const videoFiles = walkFiles(path.join(REMOTION_DIR, 'src'), { extensions: ['.ts', '.tsx', '.css'] });
    assert.ok(videoFiles.length >= 1, 'remotion/src/ must contain video source files');
    const combined = videoFiles.map((f) => readTextSafe(f)).join('\n');
    assert.match(combined, /Stealth/, 'Video source must reference Stealth');
    assert.doesNotMatch(combined, /StealthPrompter|#00F0FF/i, 'Video source must not contain StealthPrompter or #00F0FF');
  });
});
