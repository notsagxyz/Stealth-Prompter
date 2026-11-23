import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SCENE_TIMINGS, THEME } from "./types";
import { Scene1_Problem } from "./scenes/Scene1_Problem";
import { Scene2_InvisibilityShield } from "./scenes/Scene2_InvisibilityShield";
import { Scene3_Features } from "./scenes/Scene3_Features";
import { Scene4_OutroCTA } from "./scenes/Scene4_OutroCTA";

export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.colors.background,
        color: THEME.colors.textPrimary,
        fontFamily: THEME.typography.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Scene 1: The Problem (Frames 0 - 115) */}
      <Sequence from={SCENE_TIMINGS.scene1.from} durationInFrames={SCENE_TIMINGS.scene1.duration}>
        <Scene1_Problem />
      </Sequence>

      {/* Scene 2: The Invisibility Shield (Frames 110 - 230) */}
      <Sequence from={SCENE_TIMINGS.scene2.from} durationInFrames={SCENE_TIMINGS.scene2.duration}>
        <Scene2_InvisibilityShield />
      </Sequence>

      {/* Scene 3: Ultra-Smooth & Native Performance (Frames 225 - 345) */}
      <Sequence from={SCENE_TIMINGS.scene3.from} durationInFrames={SCENE_TIMINGS.scene3.duration}>
        <Scene3_Features />
      </Sequence>

      {/* Scene 4: Outro & Call to Action (Frames 340 - 450) */}
      <Sequence from={SCENE_TIMINGS.scene4.from} durationInFrames={SCENE_TIMINGS.scene4.duration}>
        <Scene4_OutroCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
