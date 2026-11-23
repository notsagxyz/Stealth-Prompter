import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { THEME } from "../types";
import { ThreeCanvasWrapper } from "../components/ThreeCanvasWrapper";
import { GlassCard3D } from "../components/GlassCard3D";
import { ParticleField3D } from "../components/ParticleField3D";
import { GlassBadge2D } from "../components/GlassBadge2D";

export const Scene3_Features: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12, 108, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotY = interpolate(frame, [0, 120], [-0.2, 0.2]);

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: THEME.colors.background,
        overflow: "hidden",
      }}
    >
      {/* 3D WebGL Multi-tiered Stack */}
      <ThreeCanvasWrapper cameraPosition={[0, 0, 5]} cameraFov={50}>
        <ParticleField3D count={90} spread={8} />

        <group rotation={[0.1, rotY, 0]}>
          {/* Top Tier: Prompter HUD */}
          <GlassCard3D position={[0, 0.8, 0.4]} width={3.2} height={1.2} depth={0.04} />

          {/* Middle Tier: Dark Glass Launcher */}
          <GlassCard3D position={[0, 0, 0]} width={3.6} height={1.4} depth={0.04} />

          {/* Base Tier: Rust Native Engine Core */}
          <GlassCard3D position={[0, -0.8, -0.4]} width={4.0} height={1.2} depth={0.04} />
        </group>
      </ThreeCanvasWrapper>

      {/* 2D Crisp DOM Overlay */}
      <AbsoluteFill
        style={{
          padding: "60px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: "center" }}>
          <GlassBadge2D
            label="TAURI 2 + RUST + SOLIDJS CORE"
            icon="⚡"
            variant="cyan"
            style={{ fontSize: "15px", padding: "10px 24px" }}
          />
          <h2
            style={{
              fontSize: "44px",
              fontWeight: 800,
              margin: "16px 0 6px 0",
              color: THEME.colors.textPrimary,
              letterSpacing: "-0.01em",
            }}
          >
            Engineered for Flawless Presentations
          </h2>
          <p style={{ fontSize: "20px", color: THEME.colors.textSecondary, margin: 0 }}>
            Under 40MB RAM. Zero focus stealing. 144Hz butter-smooth scrolling.
          </p>
        </div>

        {/* 3 Feature Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "28px",
            alignItems: "stretch",
          }}
        >
          {/* Feature 1: Memory Comparison */}
          <div
            style={{
              backgroundColor: "rgba(14, 17, 26, 0.8)",
              border: "1px solid rgba(0, 240, 255, 0.25)",
              borderRadius: "16px",
              padding: "24px",
              backdropFilter: "blur(16px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: THEME.colors.cyanAccent, textTransform: "uppercase" }}>
                📊 Memory Benchmark
              </div>
              <h3 style={{ fontSize: "22px", color: "#FFFFFF", margin: "8px 0 16px 0" }}>
                ~85% Less RAM
              </h3>
              {/* StealthPrompter Bar */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ color: THEME.colors.cyanAccent, fontWeight: 700 }}>StealthPrompter</span>
                  <span style={{ color: "#FFFFFF", fontWeight: 700 }}>38 MB</span>
                </div>
                <div style={{ width: "100%", height: "10px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "5px" }}>
                  <div style={{ width: "16%", height: "100%", backgroundColor: THEME.colors.cyanAccent, borderRadius: "5px" }} />
                </div>
              </div>
              {/* Electron Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ color: THEME.colors.dangerAccent }}>Electron Prompters</span>
                  <span style={{ color: THEME.colors.textMuted }}>240 MB</span>
                </div>
                <div style={{ width: "100%", height: "10px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "5px" }}>
                  <div style={{ width: "95%", height: "100%", backgroundColor: THEME.colors.dangerAccent, borderRadius: "5px" }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: THEME.colors.textMuted, marginTop: "16px" }}>
              Native Rust compilation • Zero Node.js runtime bloat
            </div>
          </div>

          {/* Feature 2: Non-Focus-Stealing Hotkeys */}
          <div
            style={{
              backgroundColor: "rgba(14, 17, 26, 0.8)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "16px",
              padding: "24px",
              backdropFilter: "blur(16px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: THEME.colors.emeraldAccent, textTransform: "uppercase" }}>
                🎯 Zero Focus Theft
              </div>
              <h3 style={{ fontSize: "22px", color: "#FFFFFF", margin: "8px 0 16px 0" }}>
                Global Hotkey Hooks
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: THEME.typography.monoFamily, backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "4px 8px", borderRadius: "6px", fontSize: "13px" }}>
                    Alt + Space
                  </span>
                  <span style={{ fontSize: "13px", color: THEME.colors.textSecondary }}>Play / Pause</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: THEME.typography.monoFamily, backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "4px 8px", borderRadius: "6px", fontSize: "13px" }}>
                    Alt + Up / Down
                  </span>
                  <span style={{ fontSize: "13px", color: THEME.colors.textSecondary }}>Speed Control</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: THEME.typography.monoFamily, backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "4px 8px", borderRadius: "6px", fontSize: "13px" }}>
                    Alt + H
                  </span>
                  <span style={{ fontSize: "13px", color: THEME.colors.textSecondary }}>Panic Hide</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: THEME.colors.emeraldAccent, marginTop: "16px", fontWeight: 600 }}>
              SW_SHOWNOACTIVATE • Keeps PowerPoint & IDE active
            </div>
          </div>

          {/* Feature 3: 144Hz Smooth Scrolling & Architecture */}
          <div
            style={{
              backgroundColor: "rgba(14, 17, 26, 0.8)",
              border: "1px solid rgba(0, 240, 255, 0.25)",
              borderRadius: "16px",
              padding: "24px",
              backdropFilter: "blur(16px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: THEME.colors.cyanAccent, textTransform: "uppercase" }}>
                📜 144Hz Hardware Scroll
              </div>
              <h3 style={{ fontSize: "22px", color: "#FFFFFF", margin: "8px 0 16px 0" }}>
                Zero Frame Drops
              </h3>
              <div style={{ fontSize: "14px", color: THEME.colors.textSecondary, lineHeight: "1.6" }}>
                <p style={{ margin: "6px 0" }}>• Fine-grained SolidJS direct DOM reactivity</p>
                <p style={{ margin: "6px 0" }}>• GPU CSS transforms with sub-pixel interpolation</p>
                <p style={{ margin: "6px 0" }}>• Cold boot startup &lt; 350ms</p>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: THEME.colors.textMuted, marginTop: "16px" }}>
              Mirror mode & click-through support included
            </div>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            padding: "16px 32px",
            borderRadius: "12px",
            backgroundColor: "rgba(14, 17, 26, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <span style={{ color: THEME.colors.textMuted, fontSize: "12px" }}>STARTUP TIME: </span>
            <span style={{ color: THEME.colors.cyanAccent, fontWeight: 700, fontSize: "14px" }}>&lt; 350 ms</span>
          </div>
          <div>
            <span style={{ color: THEME.colors.textMuted, fontSize: "12px" }}>CPU USAGE: </span>
            <span style={{ color: THEME.colors.emeraldAccent, fontWeight: 700, fontSize: "14px" }}>&lt; 2% in scroll</span>
          </div>
          <div>
            <span style={{ color: THEME.colors.textMuted, fontSize: "12px" }}>INSTALLER SIZE: </span>
            <span style={{ color: THEME.colors.cyanAccent, fontWeight: 700, fontSize: "14px" }}>~12 MB</span>
          </div>
          <div>
            <span style={{ color: THEME.colors.textMuted, fontSize: "12px" }}>NETWORK TELEMETRY: </span>
            <span style={{ color: THEME.colors.emeraldAccent, fontWeight: 700, fontSize: "14px" }}>ZERO (Offline)</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
