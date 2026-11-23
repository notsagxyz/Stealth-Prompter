import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../types";
import { ThreeCanvasWrapper } from "../components/ThreeCanvasWrapper";
import { ParticleField3D } from "../components/ParticleField3D";
import { StealthEmblem3D } from "../components/StealthEmblem3D";
import { GlassBadge2D } from "../components/GlassBadge2D";

export const Scene4_OutroCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scaleProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: THEME.colors.background,
        overflow: "hidden",
      }}
    >
      {/* 3D WebGL Layer with rotating StealthEmblem3D */}
      <ThreeCanvasWrapper cameraPosition={[0, 0, 5]} cameraFov={50}>
        <ParticleField3D count={150} spread={10} />
        <StealthEmblem3D scale={1.2} />
      </ThreeCanvasWrapper>

      {/* 2D Crisp DOM Overlay */}
      <AbsoluteFill
        style={{
          padding: "70px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        {/* Top Tagline */}
        <div>
          <GlassBadge2D
            label="100% OPEN SOURCE • MIT LICENSE"
            icon="⭐"
            variant="cyan"
            style={{ fontSize: "14px", padding: "8px 20px" }}
          />
        </div>

        {/* Center Brand Hero */}
        <div style={{ transform: `scale(${scaleProgress})` }}>
          <h1
            style={{
              fontSize: "76px",
              fontWeight: 900,
              letterSpacing: "0.06em",
              margin: "0 0 16px 0",
              background: "linear-gradient(135deg, #FFFFFF 30%, #00F0FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 10px 30px rgba(0, 240, 255, 0.4))",
            }}
          >
            StealthPrompter
          </h1>
          <p
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: THEME.colors.cyanAccent,
              margin: "0 0 16px 0",
              letterSpacing: "0.02em",
            }}
          >
            Invisible. Fast. Lightweight.
          </p>
          <p
            style={{
              fontSize: "20px",
              color: THEME.colors.textSecondary,
              maxWidth: "760px",
              margin: "0 auto",
              lineHeight: "1.5",
            }}
          >
            The open-source invisible teleprompter that stays hidden from screen sharing and recordings.
          </p>
        </div>

        {/* Badges & Call to Action */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            <GlassBadge2D label="Tauri 2 + Rust" variant="cyan" />
            <GlassBadge2D label="WDA_EXCLUDEFROMCAPTURE" variant="emerald" />
            <GlassBadge2D label="Zero Telemetry" variant="cyan" />
            <GlassBadge2D label="Windows 10 / 11 Native" variant="emerald" />
          </div>

          <div
            style={{
              padding: "16px 36px",
              borderRadius: "14px",
              backgroundColor: "rgba(14, 17, 26, 0.85)",
              border: "1px solid rgba(0, 240, 255, 0.5)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 10px 30px rgba(0, 240, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <span style={{ fontSize: "20px" }}>⭐</span>
            <span
              style={{
                fontFamily: THEME.typography.monoFamily,
                fontSize: "20px",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.02em",
              }}
            >
              github.com/StealthPrompter/stealth-prompter
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
