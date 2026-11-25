import React from "react";
import { Composition } from "remotion";
import { MainComposition } from "./Composition";
import { COMPOSITION_CONFIG } from "./types";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="LaunchVideo"
        component={MainComposition}
        durationInFrames={COMPOSITION_CONFIG.totalFrames}
        fps={COMPOSITION_CONFIG.fps}
        width={COMPOSITION_CONFIG.width}
        height={COMPOSITION_CONFIG.height}
      />
      <Composition
        id="StealthLaunch"
        component={MainComposition}
        durationInFrames={COMPOSITION_CONFIG.totalFrames}
        fps={COMPOSITION_CONFIG.fps}
        width={COMPOSITION_CONFIG.width}
        height={COMPOSITION_CONFIG.height}
      />
    </>
  );
};
