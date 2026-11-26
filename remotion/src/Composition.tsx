import React, { Suspense } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { StealthScene3D } from "./StealthScene3D";
import { THEME } from "./types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const MainComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  // Clean HUD/title overlays synced to the 3D camera stops
  // 0..115: Opening Hook
  const hookOp = clamp01(frame / 18) * (1 - clamp01((frame - 92) / 20));
  // 145..295: Launcher caption
  const s1Op = clamp01((frame - 145) / 18) * (1 - clamp01((frame - 280) / 18));
  // 345..420: "YOUR SCREEN" (with Prompter visible)
  const yourScreenOp = clamp01((frame - 340) / 16) * (1 - clamp01((frame - 392) / 16));
  // 395..535: "WHAT THEY SEE" (only clean Windows screen!)
  const theirScreenOp = clamp01((frame - 398) / 18) * (1 - clamp01((frame - 520) / 18));
  // 590..720: End card title
  const endOp = clamp01((frame - 590) / 22);
  const endY = interpolate(endOp, [0, 1], [18, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#07070c", fontFamily: THEME.typography.fontFamily }}>
      {/* Procedural Soundtrack & Synced SFX */}
      <Audio src={staticFile("stealth-audio.wav")} />

      {/* Fullscreen Real Three.js 3D Blender-style Scene */}
      <ThreeCanvas width={width} height={height} camera={{ fov: 44, near: 0.1, far: 100 }}>
        <Suspense fallback={null}>
          <StealthScene3D isVertical={isVertical} />
        </Suspense>
      </ThreeCanvas>

      {/* Minimalist Typography Overlays */}
      {hookOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: isVertical ? "14%" : "10%",
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: hookOp,
            padding: "0 48px",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: isVertical ? 54 : 62, fontWeight: 700, letterSpacing: "-0.04em", color: "#f4f4f8" }}>
            Your script.{" "}
            <span style={{ color: "#f43f5e", fontStyle: "italic" }}>Never</span> on their screen.
          </div>
        </div>
      )}

      {s1Op > 0.01 && (
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "10%" : "7%",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: s1Op,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(11,11,18,0.78)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontFamily: THEME.typography.monoFamily,
              fontSize: 15,
              color: "#f4f4f8",
            }}
          >
            CLICK START → FLOATING INVISIBLE PROMPTER
          </div>
        </div>
      )}

      {yourScreenOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: isVertical ? "12%" : "8%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: yourScreenOp,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              padding: "6px 18px",
              borderRadius: 999,
              background: "rgba(124, 108, 255, 0.2)",
              border: "1px solid rgba(124, 108, 255, 0.65)",
              fontFamily: THEME.typography.monoFamily,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "#f4f4f8",
            }}
          >
            YOUR WINDOWS SCREEN
          </span>
        </div>
      )}

      {theirScreenOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: isVertical ? "12%" : "8%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: theirScreenOp,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              padding: "6px 18px",
              borderRadius: 999,
              background: "rgba(16, 185, 129, 0.18)",
              border: "1px solid rgba(16, 185, 129, 0.65)",
              fontFamily: THEME.typography.monoFamily,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "#10b981",
            }}
          >
            WHAT THEY SEE · ONLY WINDOWS
          </span>
          <span style={{ fontSize: 15, color: "rgba(244,244,248,0.7)", fontFamily: THEME.typography.monoFamily }}>
            WDA_EXCLUDEFROMCAPTURE · HIDDEN IN OBS, ZOOM &amp; MEET
          </span>
        </div>
      )}

      {endOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            bottom: isVertical ? "15%" : "11%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            opacity: endOp,
            transform: `translateY(${endY}px)`,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: isVertical ? 52 : 60, fontWeight: 700, letterSpacing: "-0.04em", color: "#f4f4f8" }}>
            Stealth <span style={{ color: "#7c6cff", fontStyle: "italic" }}>Prompter</span>
          </div>
          <div
            style={{
              marginTop: 14,
              padding: "10px 24px",
              borderRadius: 999,
              background: "#f4f4f8",
              color: "#0b0b12",
              fontFamily: THEME.typography.monoFamily,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            github.com/getstealth/stealth
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
