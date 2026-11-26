import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SCENE_TIMINGS, THEME } from "./types";
import { Scene1_Problem } from "./scenes/Scene1_Problem";
import { Scene2_InvisibilityShield } from "./scenes/Scene2_InvisibilityShield";
import { Scene3_Features } from "./scenes/Scene3_Features";
import { Scene4_OutroCTA } from "./scenes/Scene4_OutroCTA";

export const MainComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const isVertical = height > width;

  // Smooth camera float & subtle metallic sheen angle
  const floatY = Math.sin(frame / 45) * 6;
  const tiltY = interpolate(frame, [0, durationInFrames], [-2.5, 2.5]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.colors.background,
        color: THEME.colors.textPrimary,
        fontFamily: THEME.typography.fontFamily,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Dramatic Stealth Red + Violet studio backdrop with floor reflection */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 65% 50% at 82% 28%, rgba(244, 63, 94, 0.26), transparent 65%), radial-gradient(ellipse 60% 50% at 20% 25%, rgba(124, 108, 255, 0.22), transparent 65%)",
          pointerEvents: "none",
        }}
      />
      {/* Floor reflection plane */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: isVertical ? "22%" : "18%",
          background:
            "linear-gradient(180deg, rgba(244,63,94,0.09) 0%, rgba(124,108,255,0.06) 45%, rgba(11,11,18,0.95) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }}
      />

      {/* Rounded Metallic Bezel Floating Frame */}
      <div
        style={{
          position: "relative",
          width: isVertical ? "92%" : "88%",
          height: isVertical ? "74%" : "84%",
          borderRadius: "28px",
          padding: "4px",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(120,120,145,0.16) 45%, rgba(244,63,94,0.32) 100%)",
          boxShadow:
            "0 36px 90px rgba(0,0,0,0.85), 0 0 60px rgba(124,108,255,0.18), 0 18px 40px rgba(244,63,94,0.18)",
          transform: `perspective(1400px) translateY(${floatY}px) rotateY(${tiltY}deg)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "24px",
            backgroundColor: THEME.colors.background,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Sequence from={SCENE_TIMINGS.scene1.from} durationInFrames={SCENE_TIMINGS.scene1.duration}>
            <Scene1_Problem />
          </Sequence>
          <Sequence from={SCENE_TIMINGS.scene2.from} durationInFrames={SCENE_TIMINGS.scene2.duration}>
            <Scene2_InvisibilityShield />
          </Sequence>
          <Sequence from={SCENE_TIMINGS.scene3.from} durationInFrames={SCENE_TIMINGS.scene3.duration}>
            <Scene3_Features />
          </Sequence>
          <Sequence from={SCENE_TIMINGS.scene4.from} durationInFrames={SCENE_TIMINGS.scene4.duration}>
            <Scene4_OutroCTA />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
