import React from "react";
import { Composition } from "remotion";
import { MainComposition } from "./Composition";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="LaunchVideo"
        component={MainComposition}
        durationInFrames={720}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="LaunchVideoVertical"
        component={MainComposition}
        durationInFrames={720}
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
