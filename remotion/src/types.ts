export const COMPOSITION_CONFIG = {
  id: "LaunchVideo",
  width: 1920,
  height: 1080,
  fps: 30,
  totalFrames: 450, // 15.0 seconds
} as const;

export const SCENE_TIMINGS = {
  scene1: { from: 0, duration: 115 },    // The Problem (0s - 3.83s)
  scene2: { from: 110, duration: 120 },  // Invisibility Shield (3.67s - 7.67s)
  scene3: { from: 225, duration: 120 },  // Ultra-Smooth & Native (7.50s - 11.50s)
  scene4: { from: 340, duration: 110 },  // Outro & CTA (11.33s - 15.00s)
} as const;

export const THEME = {
  colors: {
    background: "#090A0F",
    surfaceDark: "#0E111A",
    surfaceGlass: "rgba(18, 20, 29, 0.70)",
    glassBorder: "rgba(0, 240, 255, 0.25)",
    glassBorderActive: "rgba(0, 240, 255, 0.80)",
    cyanAccent: "#00F0FF",
    emeraldAccent: "#10B981",
    dangerAccent: "#EF4444",
    warningAccent: "#F59E0B",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    monoFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
} as const;

export interface SceneProps {
  durationInFrames: number;
}
