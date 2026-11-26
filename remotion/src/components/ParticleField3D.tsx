import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";

interface ParticleField3DProps {
  count?: number;
  spread?: number;
}

export const ParticleField3D: React.FC<ParticleField3DProps> = ({
  count = 150,
  spread = 10,
}) => {
  const frame = useCurrentFrame();

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cyan = new THREE.Color("#7c6cff");
    const emerald = new THREE.Color("#10B981");

    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random generation based on index
      const seed1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const seed2 = Math.sin(i * 39.346 + 11.135) * 23421.631;
      const seed3 = Math.sin(i * 73.156 + 54.331) * 65342.123;

      const r1 = seed1 - Math.floor(seed1);
      const r2 = seed2 - Math.floor(seed2);
      const r3 = seed3 - Math.floor(seed3);

      pos[i * 3] = (r1 - 0.5) * spread * 2;
      pos[i * 3 + 1] = (r2 - 0.5) * spread;
      pos[i * 3 + 2] = (r3 - 0.5) * spread;

      const mixed = r3 > 0.4 ? cyan : emerald;
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }

    return { positions: pos, colors: col };
  }, [count, spread]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  const rotationY = frame * 0.005;
  const rotationX = Math.sin(frame * 0.002) * 0.1;

  return (
    <points geometry={geometry} rotation={[rotationX, rotationY, 0]}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
