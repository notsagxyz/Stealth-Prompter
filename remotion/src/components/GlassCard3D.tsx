import React, { useMemo } from "react";
import * as THREE from "three";

interface GlassCard3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
}

export const GlassCard3D: React.FC<GlassCard3DProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  width = 3.2,
  height = 1.8,
  depth = 0.08,
}) => {
  const boxGeometry = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(boxGeometry), [boxGeometry]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Physical glass panel */}
      <mesh geometry={boxGeometry}>
        <meshPhysicalMaterial
          transmission={0.95}
          opacity={1.0}
          transparent={true}
          roughness={0.05}
          ior={1.5}
          color="#12141D"
        />
      </mesh>

      {/* Cyber cyan glowing edge border */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#00F0FF" linewidth={2} transparent opacity={0.8} />
      </lineSegments>
    </group>
  );
};
