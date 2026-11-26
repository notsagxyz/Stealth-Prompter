import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";

interface StealthEmblem3DProps {
  scale?: number;
}

export const StealthEmblem3D: React.FC<StealthEmblem3DProps> = ({ scale = 1 }) => {
  const frame = useCurrentFrame();

  const rotationY = frame * 0.025;
  const bobbingY = Math.sin(frame * 0.05) * 0.08;

  // Outer HUD frame geometry (a flattened ring/box frame)
  const outerFrameGeo = useMemo(() => new THREE.BoxGeometry(2.4, 1.8, 0.15), []);
  const outerEdgesGeo = useMemo(() => new THREE.EdgesGeometry(outerFrameGeo), [outerFrameGeo]);

  // 3 floating script line bars
  const barGeos = useMemo(
    () => [
      new THREE.BoxGeometry(1.6, 0.14, 0.08),
      new THREE.BoxGeometry(1.2, 0.14, 0.08),
      new THREE.BoxGeometry(1.4, 0.14, 0.08),
    ],
    []
  );

  return (
    <group position={[0, bobbingY, 0]} rotation={[0.1, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* Outer HUD glass chassis */}
      <mesh geometry={outerFrameGeo}>
        <meshPhysicalMaterial
          transmission={0.9}
          opacity={0.8}
          transparent
          roughness={0.1}
          metalness={0.4}
          color="#0E111A"
        />
      </mesh>

      {/* Cyber cyan beveled edges */}
      <lineSegments geometry={outerEdgesGeo}>
        <lineBasicMaterial color="#7c6cff" linewidth={2} />
      </lineSegments>

      {/* Script bar 1 (Top) */}
      <mesh geometry={barGeos[0]} position={[0, 0.45, 0.1]}>
        <meshStandardMaterial
          color="#7c6cff"
          emissive="#7c6cff"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Script bar 2 (Middle - Cloaking/Fading) */}
      <mesh geometry={barGeos[1]} position={[-0.2, 0, 0.1]}>
        <meshStandardMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={0.4}
          transparent
          opacity={0.7 + Math.sin(frame * 0.1) * 0.25}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Script bar 3 (Bottom) */}
      <mesh geometry={barGeos[2]} position={[0.1, -0.45, 0.1]}>
        <meshStandardMaterial
          color="#7c6cff"
          emissive="#7c6cff"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
};
