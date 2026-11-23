import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../types";

export const Scene4_OutroCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Opacity transitions (fade in 0-10, stays visible)
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const pulse = Math.sin(frame * 0.2) * 0.05 + 1;

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: THEME.colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 60px",
        fontFamily: THEME.typography.fontFamily,
      }}
    >
      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
          transform: `scale(${interpolate(scale, [0, 1], [0.95, 1])})`,
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
            marginBottom: 12,
          }}
        >
          🚀 OPEN SOURCE & 100% PRIVATE
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 48,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
          }}
        >
          Built for Presenters, Engineers & Creators
        </h1>
        <p style={{ margin: "10px 0 0 0", fontSize: 20, color: "#94A3B8" }}>
          Never get caught looking at notes again. Free and open source on GitHub.
        </p>
      </div>

      {/* 4 Performance Bento Cards */}
      <div
        style={{
          width: 1280,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 20,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            borderRadius: 14,
            padding: 24,
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, color: "#00F0FF" }}>5.0 MB</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginTop: 4 }}>Lightweight Binary</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Native Rust • 95% smaller than Electron</div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 14,
            padding: 24,
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, color: "#10B981" }}>38 MB</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginTop: 4 }}>Idle Memory</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>SolidJS zero-VDOM 144Hz scroll</div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: 14,
            padding: 24,
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, color: "#F59E0B" }}>100%</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginTop: 4 }}>Offline & Local</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Zero telemetry • No cloud sync</div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: 14,
            padding: 24,
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, color: "#A855F7" }}>0ms</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginTop: 4 }}>Focus Stealing</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Global hotkeys with WS_EX_NOACTIVATE</div>
        </div>
      </div>

      {/* GitHub Call to Action Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          backgroundColor: "rgba(2, 6, 23, 0.9)",
          border: "2px solid rgba(0, 240, 255, 0.5)",
          borderRadius: 20,
          padding: "18px 40px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 240, 255, 0.25)",
          transform: `scale(${pulse})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              color: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 22,
            }}
          >
            ★
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>
              Star on GitHub • StealthPrompter
            </span>
            <span style={{ fontSize: 13, color: "#00F0FF", fontFamily: THEME.typography.monoFamily }}>
              github.com/stealthprompter/stealthprompter
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#10B981",
            color: "#000000",
            padding: "10px 24px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.05em",
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.5)",
          }}
        >
          DOWNLOAD RELEASE (WIN 10 / 11)
        </div>
      </div>
    </AbsoluteFill>
  );
};
