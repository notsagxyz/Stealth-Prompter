import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../types";
import { RealLauncherUI } from "../components/RealLauncherUI";

export const Scene2_InvisibilityShield: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Opacity transitions (fade in 0-10, fade out 110-120)
  const opacity = interpolate(frame, [0, 10, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 90 },
  });

  // Simulated click on "Toggle Prompter HUD" at frame 60
  const isHUDToggled = frame >= 60;
  const isShieldGlowing = frame >= 25;

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: THEME.colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 40px",
        fontFamily: THEME.typography.fontFamily,
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(0, 240, 255, 0.12)",
            border: "1px solid rgba(0, 240, 255, 0.4)",
            padding: "6px 18px",
            borderRadius: 20,
            color: "#00F0FF",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          🛡️ INTRODUCING STEALTH PROMPTER
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 44,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
          }}
        >
          Hardware-Level Invisibility. Zero Leaked Pixels.
        </h1>
        <p style={{ margin: "8px 0 0 0", fontSize: 18, color: "#94A3B8" }}>
          Built with Tauri 2 and native Windows Win32 APIs. Present with complete confidence.
        </p>
      </div>

      {/* The Real Stealth Launcher Window */}
      <div
        style={{
          transform: `scale(${interpolate(scale, [0, 1], [0.94, 1])})`,
          transition: "transform 0.3s ease",
          position: "relative",
        }}
      >
        <RealLauncherUI
          highlightInvisibility={isShieldGlowing}
          highlightToggleHUD={isHUDToggled}
          speed={3.0}
        />

        {/* Feature Pointer: Invisibility Callout */}
        {isShieldGlowing && (
          <div
            style={{
              position: "absolute",
              top: 55,
              right: -60,
              backgroundColor: "rgba(16, 185, 129, 0.95)",
              color: "#000000",
              fontWeight: 800,
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 8,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transform: "rotate(3deg)",
            }}
          >
            <span>✨</span>
            <span>DWM Exclude From Capture Active</span>
          </div>
        )}

        {/* Feature Pointer: HUD Toggle Callout */}
        {isHUDToggled && (
          <div
            style={{
              position: "absolute",
              top: -15,
              right: 140,
              backgroundColor: "#00F0FF",
              color: "#000000",
              fontWeight: 800,
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 8,
              boxShadow: "0 10px 25px rgba(0, 240, 255, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🚀</span>
            <span>HUD Launched (Always-on-Top & Click-through)</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
