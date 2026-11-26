import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { COMPOSITION_CONFIG } from "../types";

export interface ThreeCanvasWrapperProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}

export const ThreeCanvasWrapper: React.FC<ThreeCanvasWrapperProps> = ({
  children,
  cameraPosition = [0, 0, 5],
  cameraFov = 50,
}) => {
  return (
    <ThreeCanvas
      width={COMPOSITION_CONFIG.width}
      height={COMPOSITION_CONFIG.height}
      camera={{
        fov: cameraFov,
        position: cameraPosition,
        near: 0.1,
        far: 1000,
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#e2e8f0" />
      <pointLight position={[0, -2, 2]} intensity={2.5} color="#7c6cff" />
      {children}
    </ThreeCanvas>
  );
};
