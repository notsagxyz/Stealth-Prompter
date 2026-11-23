import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { THEME } from "../types";
import { ThreeCanvasWrapper } from "../components/ThreeCanvasWrapper";
import { GlassBadge2D } from "../components/GlassBadge2D";
import { ParticleField3D } from "../components/ParticleField3D";

export const Scene1_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Opacity transitions (fade in 0-12, fade out 103-115)
  const opacity = interpolate(frame, [0, 12, 103, 115], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const jitterX = Math.sin(frame * 0.8) * 0.03;
  const jitterY = Math.cos(frame * 0.9) * 0.03;

  const monitorGeo = useMemo(() => new THREE.BoxGeometry(4.2, 2.4, 0.1), []);
  const monitorEdgesGeo = useMemo(() => new THREE.EdgesGeometry(monitorGeo), [monitorGeo]);

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: THEME.colors.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 3D WebGL Layer */}
      <ThreeCanvasWrapper cameraPosition={[0, 0, 5]} cameraFov={50}>
        <ParticleField3D count={80} spread={8} />

        {/* Tilted virtual monitor mesh floating in space with chaotic shake */}
        <group position={[jitterX, jitterY, 0]} rotation={[0.1, -0.15, 0]}>
          <mesh geometry={monitorGeo}>
            <meshStandardMaterial color="#1a1c26" roughness={0.3} metalness={0.7} />
          </mesh>
          <lineSegments geometry={monitorEdgesGeo}>
            <lineBasicMaterial color="#EF4444" linewidth={2} />
          </lineSegments>
        </group>

        {/* 3 Floating warning panels in 3D */}
        <mesh position={[-1.8, 1.2, 0.4]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[1.8, 0.5, 0.05]} />
          <meshStandardMaterial color="#7F1D1D" roughness={0.4} />
        </mesh>
        <mesh position={[1.8, 0.8, 0.6]} rotation={[0, -0.2, 0]}>
          <boxGeometry args={[2.0, 0.5, 0.05]} />
          <meshStandardMaterial color="#7F1D1D" roughness={0.4} />
        </mesh>
        <mesh position={[0, -1.3, 0.5]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[2.2, 0.5, 0.05]} />
          <meshStandardMaterial color="#991B1B" roughness={0.4} />
        </mesh>
      </ThreeCanvasWrapper>

      {/* 2D Crisp DOM Overlay */}
      <AbsoluteFill
        style={{
          padding: "80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        {/* Top Warning Banner */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <GlassBadge2D
            label="SCREEN SHARE ACTIVE: ENTIRE DISPLAY"
            icon="⚠"
            variant="warning"
            style={{ fontSize: "14px", padding: "8px 18px" }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: THEME.colors.dangerAccent,
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "0.08em",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: THEME.colors.dangerAccent,
                boxShadow: "0 0 10px #EF4444",
              }}
            />
            LIVE ON ZOOM / OBS / TEAMS
          </div>
        </div>

        {/* Center Warning Cards */}
        <div style={{ position: "relative", width: "100%", height: "400px" }}>
          {/* Card 1 */}
          <div
            style={{
              position: "absolute",
              top: "40px",
              left: "140px",
              padding: "16px 24px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              backdropFilter: "blur(12px)",
              color: "#FCA5A5",
              fontWeight: 600,
              fontSize: "16px",
              transform: `translateY(${Math.sin(frame * 0.1) * 6}px)`,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            }}
          >
            ⚠ PRIVATE NOTES EXPOSED TO AUDIENCE
          </div>

          {/* Card 2 */}
          <div
            style={{
              position: "absolute",
              top: "120px",
              right: "160px",
              padding: "16px 24px",
              borderRadius: "12px",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.5)",
              backdropFilter: "blur(12px)",
              color: "#FDE68A",
              fontWeight: 600,
              fontSize: "16px",
              transform: `translateY(${Math.cos(frame * 0.12) * 6}px)`,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            }}
          >
            ⚠ EYE CONTACT LOST: LOOKING AT 2ND MONITOR
          </div>

          {/* Card 3 */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "35%",
              padding: "16px 24px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.6)",
              backdropFilter: "blur(12px)",
              color: "#FCA5A5",
              fontWeight: 600,
              fontSize: "16px",
              transform: `translateY(${Math.sin(frame * 0.15) * 8}px)`,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            }}
          >
            ⚠ CLUNKY PROMPTER OVERLAYS BREAK FOCUS
          </div>
        </div>

        {/* Bottom Headline */}
        <div style={{ textAlign: "center", transform: `scale(${titleProgress})` }}>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: "0 0 12px 0",
              color: THEME.colors.textPrimary,
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            The Screen Share Dilemma
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: THEME.colors.textSecondary,
              margin: 0,
              fontWeight: 400,
            }}
          >
            Clunky floating notes. Awkward side glances. Accidental leaks.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
