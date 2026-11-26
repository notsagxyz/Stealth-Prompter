import React, { useMemo } from "react";
import * as THREE from "three";
import { useLoader, useThree } from "@react-three/fiber";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const easeOutQuart = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

/** Generates a crisp Windows 11 Desktop + Live Call Window CanvasTexture */
function createWindowsDesktopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  // Windows 11 dark bloom wallpaper
  const bg = ctx.createRadialGradient(640, 320, 40, 640, 360, 760);
  bg.addColorStop(0, "#1d2642");
  bg.addColorStop(0.5, "#0f1322");
  bg.addColorStop(1, "#080a12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  // Subtle desktop icons on left
  const icons = ["Recycle Bin", "Slides.pptx", "OBS Studio"];
  icons.forEach((label, idx) => {
    const y = 38 + idx * 82;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.roundRect(34, y, 36, 36, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(244,244,248,0.75)";
    ctx.font = "500 12px Inter, Segoe UI, sans-serif";
    ctx.fillText(label, 24, y + 52);
  });

  // Main Presentation / Video Call Window on Windows
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 32;
  ctx.fillStyle = "#141622";
  ctx.beginPath();
  ctx.roundRect(170, 56, 980, 570, 14);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(170, 56, 980, 570, 14);
  ctx.stroke();

  // Windows titlebar
  ctx.fillStyle = "#1b1e2e";
  ctx.beginPath();
  ctx.roundRect(170, 56, 980, 40, [14, 14, 0, 0]);
  ctx.fill();

  ctx.fillStyle = "#e4e4ef";
  ctx.font = "600 14px Inter, Segoe UI, sans-serif";
  ctx.fillText("Zoom / Teams — Q4 Product Keynote (Screen Share Active)", 194, 81);

  // Windows minimize / maximize / close glyphs
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(1042, 75, 12, 2);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1080, 70, 10, 10);
  ctx.beginPath();
  ctx.moveTo(1116, 70);
  ctx.lineTo(1126, 80);
  ctx.moveTo(1126, 70);
  ctx.lineTo(1116, 80);
  ctx.stroke();

  // Slide content inside the Windows app
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px Inter, Segoe UI, sans-serif";
  ctx.fillText("Q4 Architecture & Latency", 220, 168);
  ctx.fillStyle = "rgba(244,244,248,0.6)";
  ctx.font = "400 20px Inter, Segoe UI, sans-serif";
  ctx.fillText("Clean desktop capture — zero notes exposed to your audience.", 220, 206);

  // Slide chart bars
  const bars = [0.42, 0.65, 0.88, 0.96];
  bars.forEach((h, i) => {
    const bx = 225 + i * 145;
    const bh = h * 220;
    ctx.fillStyle = i === 3 ? "#7c6cff" : "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.roundRect(bx, 500 - bh, 86, bh, 10);
    ctx.fill();
  });

  // Participant tiles on right of call window
  for (let p = 0; p < 3; p++) {
    const py = 128 + p * 140;
    ctx.fillStyle = "#1d2030";
    ctx.beginPath();
    ctx.roundRect(875, py, 240, 122, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(124,108,255,0.35)";
    ctx.beginPath();
    ctx.arc(995, py + 52, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 13px Inter, Segoe UI, sans-serif";
    ctx.fillText(["Alex (PM)", "Sarah (Design)", "David (Eng)"][p], 956, py + 102);
  }

  // Windows 11 Taskbar at bottom
  ctx.fillStyle = "rgba(15, 17, 26, 0.94)";
  ctx.fillRect(0, 672, 1280, 48);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(0, 672);
  ctx.lineTo(1280, 672);
  ctx.stroke();

  // Centered Win11 start + pinned icons
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(590, 686, 8, 8);
  ctx.fillRect(600, 686, 8, 8);
  ctx.fillRect(590, 696, 8, 8);
  ctx.fillRect(600, 696, 8, 8);

  for (let ic = 1; ic <= 4; ic++) {
    ctx.fillStyle = ic === 2 ? "#7c6cff" : "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.roundRect(600 + ic * 34, 685, 22, 22, 5);
    ctx.fill();
  }

  // Clock on bottom right
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "500 12px Segoe UI, sans-serif";
  ctx.fillText("10:42 AM", 1208, 700);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Smooth 3D Camera Controller driven deterministically by Remotion frame */
const CameraRig: React.FC<{ isVertical: boolean }> = ({ isVertical }) => {
  const frame = useCurrentFrame();
  const { camera } = useThree();

  // Timeline (720 frames = 12s @ 60fps):
  // 0..120 (0-2s): Hook wide sweep in 3D space approaching Station 1 (x=0)
  // 120..300 (2-5s): Orbit around Station 1 (Stealth Launcher 3D plane) + zoom toward Start button
  // 300..360 (5-6s): Lateral camera pan from Station 1 (x=0) to Station 2 (x=8.5, Windows Screen)
  // 360..540 (6-9s): Orbit left-to-right across Station 2 showing 3D Z-depth (Prompter floating in front of Windows, then vanishing!)
  // 540..590 (9-9.8s): Lateral pan to Station 3 (x=17, 3D Stealth Emblem End Card)
  // 590..720 (9.8-12s): Settle hero shot of 3D Stealth Emblem

  const zDist = isVertical ? 6.8 : 4.8;

  let posX = 0;
  let posY = 0.25;
  let posZ = zDist;
  let lookX = 0;
  let lookY = 0;
  let lookZ = 0;

  if (frame < 120) {
    const t = easeInOutCubic(frame / 120);
    posX = lerp(-4.2, -1.6, t);
    posY = lerp(1.8, 0.35, t);
    posZ = lerp(zDist + 2.8, zDist + 0.3, t);
    lookX = lerp(-1.2, 0, t);
    lookY = lerp(0.4, 0.05, t);
  } else if (frame < 300) {
    // Orbit side-to-side around Launcher 3D plane, gently leaning toward Start button
    const t = easeInOutCubic((frame - 120) / 180);
    posX = lerp(-1.6, 1.85, t);
    posY = lerp(0.35, 0.65, t);
    posZ = lerp(zDist + 0.3, zDist - 0.55, t);
    lookX = lerp(0, 0.7, t);
    lookY = lerp(0.05, 0.35, t);
  } else if (frame < 360) {
    // Lateral sweep from Station 1 (x=0) to Station 2 (x=8.5)
    const t = easeInOutCubic((frame - 300) / 60);
    posX = lerp(1.85, 6.4, t);
    posY = lerp(0.65, 0.45, t);
    posZ = lerp(zDist - 0.55, zDist + 0.5, t);
    lookX = lerp(0.7, 8.5, t);
    lookY = lerp(0.35, 0.0, t);
  } else if (frame < 540) {
    // Orbit across Windows Screen + Floating Prompter (left -> right) to show 3D Z-separation & disappearance
    const t = easeInOutCubic((frame - 360) / 180);
    posX = lerp(6.4, 10.7, t);
    posY = lerp(0.45, 0.2, t);
    posZ = lerp(zDist + 0.5, zDist + 0.2, t);
    lookX = 8.5;
    lookY = 0;
  } else if (frame < 595) {
    // Lateral sweep to Station 3 (x=17, 3D Emblem)
    const t = easeInOutCubic((frame - 540) / 55);
    posX = lerp(10.7, 17.0, t);
    posY = lerp(0.2, 0.15, t);
    posZ = lerp(zDist + 0.2, zDist - 0.3, t);
    lookX = lerp(8.5, 17.0, t);
    lookY = 0;
  } else {
    const t = easeOutQuart((frame - 595) / 125);
    posX = lerp(17.0, 17.35, t);
    posY = lerp(0.15, 0.05, t);
    posZ = lerp(zDist - 0.3, zDist - 0.5, t);
    lookX = 17.0;
    lookY = 0;
  }

  camera.position.set(posX, posY, posZ);
  camera.lookAt(lookX, lookY, lookZ);
  return null;
};

/** 3D Shuriken + Play Emblem for End Card (Station 3) */
const StealthEmblem3D: React.FC = () => {
  const frame = useCurrentFrame();
  const rotY = (frame - 540) * 0.015;

  const shurikenShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 1.3);
    s.lineTo(0.36, 0.36);
    s.lineTo(1.3, 0);
    s.lineTo(0.36, -0.36);
    s.lineTo(0, -1.3);
    s.lineTo(-0.36, -0.36);
    s.lineTo(-1.3, 0);
    s.lineTo(-0.36, 0.36);
    s.closePath();

    const hole = new THREE.Path();
    hole.moveTo(0, 0.88);
    hole.lineTo(-0.24, 0.24);
    hole.lineTo(-0.88, 0);
    hole.lineTo(-0.24, -0.24);
    hole.lineTo(0, -0.88);
    hole.lineTo(0.24, -0.24);
    hole.lineTo(0.88, 0);
    hole.lineTo(0.24, 0.24);
    hole.closePath();
    s.holes.push(hole);
    return s;
  }, []);

  const playShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.22, -0.32);
    s.lineTo(0.38, 0);
    s.lineTo(-0.22, 0.32);
    s.closePath();
    return s;
  }, []);

  return (
    <group position={[17.0, 0.25, 0]} rotation={[0, rotY * 0.5, 0]}>
      {/* Dark glass rounded tile behind emblem */}
      <mesh position={[0, 0, -0.14]}>
        <boxGeometry args={[2.9, 2.9, 0.16]} />
        <meshStandardMaterial color="#12121e" metalness={0.75} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <extrudeGeometry args={[shurikenShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 }]} />
        <meshStandardMaterial color="#f4f4f8" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[0.04, 0, 0.02]}>
        <extrudeGeometry args={[playShape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }]} />
        <meshStandardMaterial color="#7c6cff" emissive="#7c6cff" emissiveIntensity={0.65} metalness={0.3} roughness={0.2} />
      </mesh>
    </group>
  );
};

export const StealthScene3D: React.FC<{ isVertical: boolean }> = ({ isVertical }) => {
  const frame = useCurrentFrame();

  const launcherTex = useLoader(THREE.TextureLoader, staticFile("after_launcher.png"));
  const hudTex = useLoader(THREE.TextureLoader, staticFile("after_hud.png"));
  launcherTex.colorSpace = THREE.SRGBColorSpace;
  hudTex.colorSpace = THREE.SRGBColorSpace;

  const windowsTex = useMemo(() => createWindowsDesktopTexture(), []);

  // Station 1: Cursor centered EXACTLY on the "Start" pill button in after_launcher.png
  // Start button center in 980x640 image: u = 0.838, v = 0.075 (from top)
  // On 3D plane (width=4.9, height=3.2):
  const startLocalX = (0.838 - 0.5) * 4.9; // +1.656
  const startLocalY = (0.5 - 0.075) * 3.2; // +1.360

  const cursorMoveT = easeOutQuart((frame - 140) / 55);
  const curX = lerp(0.4, startLocalX, cursorMoveT);
  const curY = lerp(-2.2, startLocalY, cursorMoveT);
  const clickT = frame >= 208 && frame <= 224 ? Math.sin(((frame - 208) / 16) * Math.PI) : 0;
  const cursorScale = 1 - clickT * 0.22;

  // After clicking Start (frame 211 / 3.52s), mini HUD preview lifts out in 3D at Station 1
  const s1HudT = easeOutQuart((frame - 214) / 28);

  // Station 2: Prompter HUD floats at z = +0.58 in front of Windows Screen (z = 0),
  // then vanishes at frame 387 (6.45s) when "What they see" triggers!
  const vanishT = clamp01((frame - 387) / 22);
  const hudOpacity = 1 - easeInOutCubic(vanishT);

  return (
    <>
      <color attach="background" args={["#07070c"]} />
      <fog attach="fog" args={["#07070c", 9, 24]} />

      <CameraRig isVertical={isVertical} />

      {/* Studio 3-Point + Rim Lighting (Blender look) */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 7, 6]} intensity={1.35} color="#ffffff" />
      <pointLight position={[5, 1.8, 3]} intensity={16} distance={16} color="#f43f5e" />
      <pointLight position={[-4, 2.2, 3]} intensity={16} distance={16} color="#7c6cff" />
      <pointLight position={[12, 2.0, 3]} intensity={14} distance={16} color="#7c6cff" />
      <pointLight position={[19, 2.0, 3]} intensity={14} distance={16} color="#f43f5e" />

      {/* Reflective Studio Floor + Subtle Architectural Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.5, -2.05, 0]}>
        <planeGeometry args={[48, 28]} />
        <meshStandardMaterial color="#0a0a11" metalness={0.85} roughness={0.22} />
      </mesh>
      <gridHelper args={[48, 48, "#252242", "#141422"]} position={[8.5, -2.04, 0]} />

      {/* Subtle glowing vertical studio light pillars in background */}
      {[-3.8, 3.8, 12.6, 21.2].map((px, i) => (
        <mesh key={px} position={[px, 1.2, -3.4]}>
          <boxGeometry args={[0.12, 7.2, 0.12]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#7c6cff" : "#f43f5e"}
            emissive={i % 2 === 0 ? "#7c6cff" : "#f43f5e"}
            emissiveIntensity={1.6}
          />
        </mesh>
      ))}

      {/* ================= STATION 1: Real Stealth Launcher 3D Plane (x = 0) ================= */}
      <group position={[0, 0.05, 0]}>
        {/* Beveled dark metallic frame */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[5.06, 3.36, 0.1]} />
          <meshStandardMaterial color="#1d1e2b" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Real Launcher UI Texture */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[4.9, 3.2]} />
          <meshBasicMaterial map={launcherTex} toneMapped={false} />
        </mesh>

        {/* Oversized 3D Cursor landing centered on "Start" */}
        {frame >= 135 && frame < 320 && (
          <group position={[curX, curY, 0.14]} scale={[cursorScale, cursorScale, 1]}>
            <mesh position={[0.09, -0.11, 0]}>
              <coneGeometry args={[0.11, 0.28, 3]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
            </mesh>
          </group>
        )}

        {/* Click ripple centered on Start */}
        {frame >= 208 && frame <= 238 && (
          <mesh position={[startLocalX, startLocalY, 0.08]} scale={[0.4 + ((frame - 208) / 30) * 1.4, 0.4 + ((frame - 208) / 30) * 1.4, 1]}>
            <ringGeometry args={[0.14, 0.19, 32]} />
            <meshBasicMaterial color="#7c6cff" transparent opacity={1 - (frame - 208) / 30} />
          </mesh>
        )}

        {/* Floating HUD Preview lifting in 3D after clicking Start */}
        {frame >= 214 && (
          <group position={[0, -0.55 + s1HudT * 0.12, 0.35 * s1HudT]} scale={[0.72 + s1HudT * 0.06, 0.72 + s1HudT * 0.06, 1]}>
            <mesh position={[0, 0, -0.02]}>
              <boxGeometry args={[4.12, 1.48, 0.04]} />
              <meshStandardMaterial color="#7c6cff" metalness={0.6} roughness={0.25} transparent opacity={s1HudT * 0.55} />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[4.04, 1.41]} />
              <meshBasicMaterial map={hudTex} transparent opacity={s1HudT} toneMapped={false} />
            </mesh>
          </group>
        )}
      </group>

      {/* ================= STATION 2: Windows Desktop + Floating 3D Prompter (x = 8.5) ================= */}
      <group position={[8.5, 0.05, 0]}>
        {/* Windows 11 Display Plane */}
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[5.56, 3.18, 0.1]} />
          <meshStandardMaterial color="#1f2130" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[5.4, 3.04]} />
          <meshBasicMaterial map={windowsTex} toneMapped={false} />
        </mesh>

        {/* Floating Stealth Prompter HUD physically in front (z = +0.58) — vanishes for "What they see"! */}
        {hudOpacity > 0.01 && (
          <group position={[0, -0.1, 0.58]}>
            <mesh position={[0, 0, -0.02]}>
              <boxGeometry args={[4.28, 1.54, 0.03]} />
              <meshStandardMaterial color="#7c6cff" transparent opacity={hudOpacity * 0.45} />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[4.2, 1.47]} />
              <meshBasicMaterial map={hudTex} transparent opacity={hudOpacity} toneMapped={false} />
            </mesh>
          </group>
        )}
      </group>

      {/* ================= STATION 3: 3D Ninja Emblem End Card (x = 17.0) ================= */}
      <StealthEmblem3D />
    </>
  );
};
