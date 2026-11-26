export const COMPOSITION_CONFIG = {
  id: "LaunchVideo",
  width: 1920,
  height: 1080,
  fps: 60,
  totalFrames: 720, // 12.0 seconds at 60fps
} as const;

export const VERTICAL_CONFIG = {
  id: "LaunchVideoVertical",
  width: 1080,
  height: 1920,
  fps: 60,
  totalFrames: 720, // 12.0 seconds at 60fps
} as const;

export const SCENE_TIMINGS = {
  scene1: { from: 0, duration: 185 },    // The Problem (0s - 3.08s)
  scene2: { from: 175, duration: 195 },  // Invisibility Shield (2.92s - 6.17s)
  scene3: { from: 365, duration: 185 },  // Ultra-Smooth & Native (6.08s - 9.17s)
  scene4: { from: 545, duration: 175 },  // Outro & CTA (9.08s - 12.00s)
} as const;

export const THEME = {
  colors: {
    background: "#0b0b12",
    surfaceDark: "#11111c",
    surfaceGlass: "rgba(255, 255, 255, 0.04)",
    glassBorder: "rgba(124, 108, 255, 0.28)",
    glassBorderActive: "rgba(124, 108, 255, 0.85)",
    cyanAccent: "#7c6cff",
    violetAccent: "#7c6cff",
    stealthRed: "#f43f5e",
    emeraldAccent: "#10B981",
    dangerAccent: "#f43f5e",
    warningAccent: "#F59E0B",
    textPrimary: "#f4f4f8",
    textSecondary: "rgba(244, 244, 248, 0.72)",
    textMuted: "rgba(244, 244, 248, 0.45)",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    monoFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
} as const;

export interface SceneProps {
  durationInFrames: number;
}
