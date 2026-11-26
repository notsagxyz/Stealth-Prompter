import fs from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 44100;
const DURATION_SEC = 12.0;
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION_SEC);

const left = new Float32Array(NUM_SAMPLES);
const right = new Float32Array(NUM_SAMPLES);

// Deterministic PRNG for clean noise (whooshes)
let seed = 133742;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
}

// 1. Subtle cinematic dark-ambient pad (D minor chord: D2=73.42, A2=110, F3=174.61, A3=220, C4=261.63)
const padFreqs = [73.42, 110.0, 174.61, 220.0, 261.63];
for (let i = 0; i < NUM_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  const fadeIn = Math.min(1, t / 1.2);
  const fadeOut = Math.min(1, Math.max(0, (DURATION_SEC - t) / 1.4));
  const env = fadeIn * fadeOut;

  let sigL = 0;
  let sigR = 0;
  for (let k = 0; k < padFreqs.length; k++) {
    const f = padFreqs[k];
    const detune = 1 + (k % 2 === 0 ? 0.0025 : -0.0025);
    const v = Math.sin(2 * Math.PI * f * t) * 0.55 + Math.sin(2 * Math.PI * f * detune * t) * 0.45;
    const weight = k === 0 ? 0.085 : 0.032;
    sigL += v * weight * (k % 2 === 0 ? 0.9 : 1.0);
    sigR += v * weight * (k % 2 === 0 ? 1.0 : 0.9);
  }
  left[i] += sigL * env;
  right[i] += sigR * env;
}

// Helper: add filtered noise whoosh at centerTime
function addWhoosh(centerTime, dur, gain = 0.22, pan = 0) {
  const startIdx = Math.max(0, Math.floor((centerTime - dur / 2) * SAMPLE_RATE));
  const endIdx = Math.min(NUM_SAMPLES - 1, Math.floor((centerTime + dur / 2) * SAMPLE_RATE));
  let lp = 0;
  for (let i = startIdx; i <= endIdx; i++) {
    const u = (i - startIdx) / Math.max(1, endIdx - startIdx);
    const env = Math.sin(Math.PI * u) ** 2;
    const cutoff = 0.04 + 0.22 * Math.sin(Math.PI * u);
    lp = lp + cutoff * (rand() - lp);
    const s = lp * env * gain;
    left[i] += s * (1 - Math.max(0, pan) * 0.4);
    right[i] += s * (1 + Math.min(0, pan) * 0.4);
  }
}

// Helper: add crisp mechanical UI click
function addClick(timeSec, gain = 0.48) {
  const startIdx = Math.max(0, Math.floor(timeSec * SAMPLE_RATE));
  const len = Math.floor(0.06 * SAMPLE_RATE);
  for (let k = 0; k < len && startIdx + k < NUM_SAMPLES; k++) {
    const dt = k / SAMPLE_RATE;
    const env = Math.exp(-dt * 110);
    const body = Math.sin(2 * Math.PI * (1450 - dt * 9000) * dt) * 0.65;
    const snap = Math.sin(2 * Math.PI * 3200 * dt) * Math.exp(-dt * 240) * 0.35;
    const s = (body + snap) * env * gain;
    left[startIdx + k] += s;
    right[startIdx + k] += s;
  }
}

// Helper: add clean harmonic chime / pulse
function addChime(timeSec, freqs, dur = 1.6, gain = 0.14) {
  const startIdx = Math.max(0, Math.floor(timeSec * SAMPLE_RATE));
  const len = Math.floor(dur * SAMPLE_RATE);
  for (let k = 0; k < len && startIdx + k < NUM_SAMPLES; k++) {
    const dt = k / SAMPLE_RATE;
    const env = Math.min(1, dt / 0.025) * Math.exp(-dt * 2.4);
    let s = 0;
    for (let j = 0; j < freqs.length; j++) {
      s += Math.sin(2 * Math.PI * freqs[j] * dt) * (1 / freqs.length);
    }
    left[startIdx + k] += s * env * gain;
    right[startIdx + k] += s * env * gain * 0.96;
  }
}

// Synced SFX cues (12.0s @ 60fps):
// 2.05s: Zoom-through transition into 3D Launcher
addWhoosh(2.05, 0.55, 0.24, -0.2);
// 3.52s (frame ~211): Cursor clicks Start button!
addClick(3.52, 0.55);
// 5.15s: Camera sweeps laterally to Windows Screen + Floating Prompter
addWhoosh(5.15, 0.65, 0.26, 0.25);
// 6.45s: Prompter vanishes on "What they see" (WDA_EXCLUDEFROMCAPTURE)
addChime(6.45, [587.33, 880.0], 0.9, 0.16);
// 9.10s: Inverse zoom to End Card
addWhoosh(9.10, 0.6, 0.24, 0);
addChime(9.25, [293.66, 440.0, 587.33, 659.25], 2.4, 0.18);

// Soft limiter + 16-bit PCM WAV write
const outPath = path.resolve("remotion/public/stealth-audio.wav");
const dataBytes = NUM_SAMPLES * 2 * 2;
const buf = Buffer.alloc(44 + dataBytes);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + dataBytes, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(2, 22); // stereo
buf.writeUInt32LE(SAMPLE_RATE, 24);
buf.writeUInt32LE(SAMPLE_RATE * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(dataBytes, 40);

for (let i = 0; i < NUM_SAMPLES; i++) {
  const l = Math.max(-0.95, Math.min(0.95, Math.tanh(left[i])));
  const r = Math.max(-0.95, Math.min(0.95, Math.tanh(right[i])));
  buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
}

fs.writeFileSync(outPath, buf);
console.log(`Generated ${outPath} (${(buf.length / 1024).toFixed(1)} KB, ${DURATION_SEC}s)`);
