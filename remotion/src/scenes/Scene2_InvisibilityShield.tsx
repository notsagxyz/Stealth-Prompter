import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { THEME } from "../types";
import { ThreeCanvasWrapper } from "../components/ThreeCanvasWrapper";
import { GlassCard3D } from "../components/GlassCard3D";
import { ParticleField3D } from "../components/ParticleField3D";
import { GlassBadge2D } from "../components/GlassBadge2D";

export const Scene2_InvisibilityShield: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12, 108, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotationY = interpolate(frame, [0, 120], [-0.15, 0.15]);
  const scanlineY = interpolate(frame % 45, [0, 45], [-1.1, 1.1]);

  const shieldGeo = useMemo(() => new THREE.ConeGeometry(0.8, 1.2, 6, 1, true), []);

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: THEME.colors.background,
        overflow: "hidden",
      }}
    >
      {/* 3D WebGL Layer */}
      <ThreeCanvasWrapper cameraPosition={[0, 0, 5]} cameraFov={50}>
        <ParticleField3D count={100} spread={8} />

        {/* 3D Glass Prompter HUD Plane */}
        <group rotation={[0.05, rotationY, 0]}>
          <GlassCard3D width={3.6} height={2.2} depth={0.06} />

          {/* Laser scanning beam */}
          <mesh position={[0, scanlineY, 0.05]}>
            <boxGeometry args={[3.4, 0.04, 0.02]} />
            <meshBasicMaterial color="#00F0FF" transparent opacity={0.9} />
          </mesh>
        </group>

        {/* Procedural rotating shield wireframe */}
        <mesh geometry={shieldGeo} position={[0, -0.1, -1.2]} rotation={[Math.PI, frame * 0.03, 0]}>
          <meshStandardMaterial
            wireframe
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={0.8}
          />
        </mesh>
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
        {/* Top Header Badge */}
        <div style={{ textAlign: "center" }}>
          <GlassBadge2D
            label="WINDOWS DWM ENGINE: WDA_EXCLUDEFROMCAPTURE (0x00000011)"
            icon="🛡️"
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
            True Hardware-Accelerated Invisibility
          </h2>
          <p
            style={{
              fontSize: "20px",
              color: THEME.colors.textSecondary,
              margin: 0,
            }}
          >
            Desktop Window Manager excludes window surface directly at the OS composition layer.
          </p>
        </div>

        {/* Center Split Comparison View */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            height: "460px",
            alignItems: "stretch",
          }}
        >
          {/* Left Panel: Speaker's View (Prompter Visible) */}
          <div
            style={{
              position: "relative",
              borderRadius: "16px",
              backgroundColor: "rgba(14, 17, 26, 0.75)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              backdropFilter: "blur(16px)",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: THEME.colors.cyanAccent,
                  textTransform: "uppercase",
                }}
              >
                👁 Speaker's Screen View
              </span>
              <span
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0, 240, 255, 0.15)",
                  color: THEME.colors.cyanAccent,
                  fontWeight: 600,
                }}
              >
                HUD OVERLAY VISIBLE
              </span>
            </div>

            {/* Simulated teleprompter script lines scrolling */}
            <div
              style={{
                fontSize: "20px",
                lineHeight: "1.6",
                color: THEME.colors.textPrimary,
                fontFamily: THEME.typography.fontFamily,
                transform: `translateY(-${(frame * 1.4) % 120}px)`,
                maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                padding: "20px 0",
              }}
            >
              <p style={{ margin: "12px 0", color: THEME.colors.textSecondary }}>
                "Good morning everyone. Today we are announcing..."
              </p>
              <p style={{ margin: "12px 0", color: "#FFFFFF", fontWeight: 700 }}>
                "StealthPrompter: The open-source invisible teleprompter..."
              </p>
              <p style={{ margin: "12px 0", color: THEME.colors.textSecondary }}>
                "Zero focus stealing. 144Hz butter-smooth scrolling..."
              </p>
              <p style={{ margin: "12px 0", color: THEME.colors.textSecondary }}>
                "Direct camera eye contact without anyone noticing."
              </p>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: THEME.colors.textMuted,
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "12px",
              }}
            >
              Mounted right in front of webcam • 100% natural gaze
            </div>
          </div>

          {/* Right Panel: Audience / OBS View (Prompter 100% Invisible) */}
          <div
            style={{
              position: "relative",
              borderRadius: "16px",
              backgroundColor: "rgba(14, 17, 26, 0.75)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              backdropFilter: "blur(16px)",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: THEME.colors.emeraldAccent,
                  textTransform: "uppercase",
                }}
              >
                📹 Audience / OBS Screen Share
              </span>
              <span
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: THEME.colors.emeraldAccent,
                  fontWeight: 600,
                }}
              >
                100% INVISIBLE
              </span>
            </div>

            {/* Pristine desktop background representation */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  border: "2px dashed rgba(16, 185, 129, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  marginBottom: "16px",
                }}
              >
                ✨
              </div>
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: THEME.colors.emeraldAccent,
                  margin: "0 0 8px 0",
                }}
              >
                Clean Capture Stream
              </h3>
              <p style={{ fontSize: "15px", color: THEME.colors.textSecondary, margin: 0, maxWidth: "320px" }}>
                Zero prompter bleed-through. The capture API renders only what is behind the prompter.
              </p>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: THEME.colors.emeraldAccent,
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "12px",
                fontWeight: 600,
              }}
            >
              ✅ Zoom • MS Teams • OBS Studio • Google Meet • Discord
            </div>
          </div>
        </div>

        {/* Bottom Technology Verification Strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            fontFamily: THEME.typography.monoFamily,
            fontSize: "13px",
            color: THEME.colors.cyanAccent,
          }}
        >
          <span>SetWindowDisplayAffinity(hwnd, 0x11)</span>
          <span>•</span>
          <span>DXGI Desktop Duplication Excluded</span>
          <span>•</span>
          <span>Windows Graphics Capture Verified</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
