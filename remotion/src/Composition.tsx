import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "./types";

// Power4-style easing helpers (matching cut-the-curve motion-doctrine)
const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, Math.min(1, t))));
const easeOutQuart = (t: number): number => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 4);
const easeInQuart = (t: number): number => Math.pow(Math.max(0, Math.min(1, t)), 4);
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const OversizedCursor: React.FC<{
  xPct: number;
  yPct: number;
  scale?: number;
  visible?: boolean;
}> = ({ xPct, yPct, scale = 1, visible = true }) => {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: `${xPct}%`,
        top: `${yPct}%`,
        width: 56,
        height: 56,
        transform: `translate(-21%, -14%) scale(${scale})`,
        transformOrigin: "21% 14%",
        zIndex: 50,
        pointerEvents: "none",
        filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.55))",
      }}
    >
      <svg viewBox="0 0 24 24" width="56" height="56" fill="none">
        <path
          d="M5.5 3.2L19.2 12.1L12.7 13.7L15.6 19.6L13.2 20.8L10.3 14.9L5.5 18.8V3.2Z"
          fill="#FFFFFF"
          stroke="#0b0b12"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/* --------------------------------------------------------------------------
 * ACT 1 (0 - 135 frames / 0s - 2.25s): Hook & Zoom-Through Exit
 * -------------------------------------------------------------------------- */
const Act1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  // Waterfall entry of two lines
  const l1 = easeOutExpo(clamp01(frame / 22));
  const l2 = easeOutExpo(clamp01((frame - 10) / 24));

  // Zoom-through exit (frames 112 -> 135): scale 1 -> 1.24, blur 0 -> 10px
  const exitT = clamp01((frame - 112) / 23);
  const exitEase = easeInQuart(exitT);
  const scale = 1 + exitEase * 0.24;
  const blur = exitT * 10;
  const opacity = 1 - clamp01((frame - 116) / 18) * 0.85;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: isVertical ? "0 64px" : "0 140px",
        transform: `scale(${scale})`,
        filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined,
        opacity,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1120 }}>
        <div
          style={{
            fontSize: isVertical ? 68 : 82,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            color: THEME.colors.textPrimary,
            transform: `translateY(${(1 - l1) * 32}px)`,
            opacity: l1,
          }}
        >
          Your script belongs to you.
        </div>
        <div
          style={{
            fontSize: isVertical ? 68 : 82,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.12,
            marginTop: 12,
            color: THEME.colors.textSecondary,
            transform: `translateY(${(1 - l2) * 32}px)`,
            opacity: l2,
          }}
        >
          Never on{" "}
          <span style={{ color: THEME.colors.stealthRed, fontStyle: "italic" }}>
            their
          </span>{" "}
          screen.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------------------
 * ACT 2 (123 - 320 frames / 2.05s - 5.33s): Real Stealth UI + Oversized Cursor Click
 * -------------------------------------------------------------------------- */
const Act2ProductClick: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  // Zoom-through entry (0 -> 28 frames): 0.76 -> 1.0, blur 10 -> 0
  const entryT = clamp01(frame / 28);
  const entryEase = easeOutExpo(entryT);
  const entryScale = 0.76 + entryEase * 0.24;
  const entryBlur = (1 - entryEase) * 10;
  const entryOpacity = 0.2 + entryEase * 0.8;

  // Oversized cursor enters from bottom off-screen (frames 34 -> 84) onto the "Start" button (82.5%, 7.5%)
  const moveT = clamp01((frame - 34) / 48);
  const moveEase = easeOutQuart(moveT);
  const cursorX = interpolate(moveEase, [0, 1], [62, 82.8]);
  const cursorY = interpolate(moveEase, [0, 1], [116, 7.6]);

  // Click at frame 88 (compress 6f, release 12f)
  const clickDown = clamp01((frame - 88) / 6);
  const clickUp = clamp01((frame - 94) / 12);
  const cursorScale =
    frame < 88
      ? 1
      : frame < 94
      ? 1 - clickDown * 0.18
      : 0.82 + easeOutQuart(clickUp) * 0.18;

  // Click ignites the floating HUD overlay at frame 94!
  const hudOnT = clamp01((frame - 94) / 22);
  const hudEase = easeOutExpo(hudOnT);

  // Subtle camera push after click (frames 94 -> 175)
  const camPush = 1 + easeInOutCubic(clamp01((frame - 94) / 75)) * 0.04;

  // Exit Cut-the-Curve LEFT (frames 176 -> 197)
  const exitT = clamp01((frame - 176) / 21);
  const exitX = -easeInQuart(exitT) * 240;
  const exitOp = 1 - clamp01((frame - 178) / 16);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        transform: `translateX(${exitX}px) scale(${entryScale * camPush})`,
        filter: entryBlur > 0.2 ? `blur(${entryBlur.toFixed(1)}px)` : undefined,
        opacity: entryOpacity * exitOp,
      }}
    >
      {/* Real Stealth Launcher Screenshot */}
      <div
        style={{
          position: "relative",
          width: isVertical ? "94%" : "78%",
          aspectRatio: "980 / 640",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.75)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Img
          src={staticFile("after_launcher.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Subtle click ripple on Start button */}
        {frame >= 90 && frame <= 116 && (
          <div
            style={{
              position: "absolute",
              left: "82.8%",
              top: "7.6%",
              width: 90,
              height: 90,
              borderRadius: 999,
              border: `2px solid ${THEME.colors.violetAccent}`,
              transform: `translate(-50%, -50%) scale(${0.3 + clamp01((frame - 90) / 24) * 1.4})`,
              opacity: 1 - clamp01((frame - 90) / 24),
              pointerEvents: "none",
            }}
          />
        )}

        {/* Oversized Cursor */}
        <OversizedCursor
          xPct={cursorX}
          yPct={cursorY}
          scale={cursorScale}
          visible={frame >= 32}
        />

        {/* Real Stealth Prompter HUD popping in cleanly after Start click */}
        {frame >= 94 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "10%",
              width: "76%",
              transform: `translate(-50%, ${(1 - hudEase) * 28}px) scale(${0.92 + hudEase * 0.08})`,
              opacity: hudEase,
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(124, 108, 255, 0.45)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.85), 0 0 32px rgba(124, 108, 255, 0.25)",
            }}
          >
            <Img
              src={staticFile("after_hud.png")}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------------------
 * ACT 3 (308 - 555 frames / 5.13s - 9.25s): Split-Screen Invisibility Proof
 * -------------------------------------------------------------------------- */
const Act3InvisibilitySplit: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  // Cut-the-curve entry from RIGHT (+240 -> 0) matching Act 2 exit
  const entryT = clamp01(frame / 22);
  const entryX = (1 - easeOutQuart(entryT)) * 240;
  const entryOp = 0.35 + clamp01(frame / 14) * 0.65;

  // Reveal wipe across screen (frames 42 -> 108), then hold for dramatic clarity!
  const shieldProgress = easeInOutCubic(clamp01((frame - 45) / 55));

  // Simulated prompter scroll on left side
  const scrollOffset = -(frame * 0.45);

  // Inverse zoom exit (frames 228 -> 247): 1 -> 0.84
  const exitT = clamp01((frame - 228) / 19);
  const exitScale = 1 - easeInQuart(exitT) * 0.16;
  const exitBlur = exitT * 10;
  const exitOp = 1 - clamp01((frame - 230) / 16);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: isVertical ? "48px 36px" : "44px 72px",
        transform: `translateX(${entryX}px) scale(${exitScale})`,
        filter: exitBlur > 0.2 ? `blur(${exitBlur.toFixed(1)}px)` : undefined,
        opacity: entryOp * exitOp,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        {/* LEFT: What YOU see */}
        <div
          style={{
            flex: 1,
            borderRadius: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(124, 108, 255, 0.35)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontFamily: THEME.typography.monoFamily, fontSize: 13, letterSpacing: "0.14em", color: THEME.colors.violetAccent }}>
              YOUR SCREEN
            </span>
            <span style={{ fontFamily: THEME.typography.monoFamily, fontSize: 12, color: THEME.colors.textMuted }}>
              VISIBLE TO YOU
            </span>
          </div>

          {/* Simulated Zoom / Slide underneath + Real HUD floating */}
          <div style={{ flex: 1, borderRadius: 12, background: "#12131d", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden", padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.28)" }}>
              Q4 Product Roadmap — Live Call
            </div>
            <div style={{ marginTop: 14, height: 10, width: "65%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
            <div style={{ marginTop: 10, height: 10, width: "48%", borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />

            {/* Real Stealth HUD floating on top */}
            <div
              style={{
                position: "absolute",
                inset: "18% 6% 10% 6%",
                borderRadius: 16,
                background: "rgba(11, 11, 18, 0.88)",
                border: "1px solid rgba(124, 108, 255, 0.5)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                padding: "20px 24px",
                overflow: "hidden",
              }}
            >
              <div style={{ transform: `translateY(${scrollOffset}px)`, fontSize: isVertical ? 22 : 24, lineHeight: 1.5, color: "#f4f4f8", fontWeight: 500 }}>
                “Thanks everyone for joining. Today we’re shipping a faster, cleaner architecture that cuts latency in half...”
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontFamily: THEME.typography.monoFamily,
                  fontSize: 11,
                  color: "#f4f4f8",
                }}
              >
                PLAYING · 2.5x · OP 85%
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: What AUDIENCE / OBS / ZOOM sees */}
        <div
          style={{
            flex: 1,
            borderRadius: 18,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontFamily: THEME.typography.monoFamily, fontSize: 13, letterSpacing: "0.14em", color: THEME.colors.emeraldAccent }}>
              OBS · ZOOM · MEET
            </span>
            <span style={{ fontFamily: THEME.typography.monoFamily, fontSize: 12, color: THEME.colors.emeraldAccent }}>
              {shieldProgress > 0.65 ? "100% CLEAN CAPTURE" : "EXCLUDING..."}
            </span>
          </div>

          <div style={{ flex: 1, borderRadius: 12, background: "#12131d", border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden", padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
              Q4 Product Roadmap — Live Call
            </div>
            <div style={{ marginTop: 14, height: 10, width: "65%", borderRadius: 6, background: "rgba(255,255,255,0.12)" }} />
            <div style={{ marginTop: 10, height: 10, width: "48%", borderRadius: 6, background: "rgba(255,255,255,0.09)" }} />

            {/* Prompter vanishes cleanly as shield activates! */}
            <div
              style={{
                position: "absolute",
                inset: "18% 6% 10% 6%",
                borderRadius: 16,
                background: "rgba(11, 11, 18, 0.88)",
                border: `1px dashed ${THEME.colors.stealthRed}`,
                opacity: 1 - shieldProgress,
                transform: `scale(${1 - shieldProgress * 0.04})`,
              }}
            />

            {shieldProgress > 0.7 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 18,
                  right: 18,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "rgba(16, 185, 129, 0.14)",
                  border: "1px solid rgba(16, 185, 129, 0.45)",
                  fontFamily: THEME.typography.monoFamily,
                  fontSize: 12,
                  color: THEME.colors.emeraldAccent,
                  opacity: clamp01((shieldProgress - 0.7) / 0.3),
                }}
              >
                WDA_EXCLUDEFROMCAPTURE = 0x11
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------------------
 * ACT 4 (544 - 720 frames / 9.06s - 12.0s): Inverse Zoom Payoff & End Card
 * -------------------------------------------------------------------------- */
const Act4EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  // Inverse zoom-through entry (1.24 -> 1.0, blur 10 -> 0)
  const entryT = clamp01(frame / 30);
  const entryEase = easeOutExpo(entryT);
  const scale = 1.24 - entryEase * 0.24;
  const blur = (1 - entryEase) * 10;
  const opacity = 0.2 + entryEase * 0.8;

  const ctaT = easeOutExpo(clamp01((frame - 24) / 24));

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined,
        opacity,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 48px" }}>
        <div
          style={{
            width: isVertical ? 112 : 120,
            height: isVertical ? 112 : 120,
            borderRadius: 28,
            boxShadow: "0 20px 60px rgba(124, 108, 255, 0.35)",
            overflow: "hidden",
          }}
        >
          <svg viewBox="0 0 512 512" width="100%" height="100%" fill="none">
            <defs>
              <radialGradient id="endCardGlow" cx="50%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#1d1a36" />
                <stop offset="100%" stopColor="#0b0b12" />
              </radialGradient>
            </defs>
            <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#endCardGlow)" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
            <path d="M256 88L310 202L424 256L310 310L256 424L202 310L88 256L202 202L256 88Z" stroke="#f4f4f8" strokeWidth="24" strokeLinejoin="round" />
            <path d="M226 208L312 256L226 304V208Z" fill="#7c6cff" />
          </svg>
        </div>
        <h1
          style={{
            marginTop: 28,
            marginBottom: 8,
            fontSize: isVertical ? 64 : 76,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: THEME.colors.textPrimary,
          }}
        >
          Stealth{" "}
          <span style={{ color: THEME.colors.violetAccent, fontStyle: "italic" }}>
            Prompter
          </span>
        </h1>
        <p
          style={{
            fontSize: isVertical ? 22 : 26,
            color: THEME.colors.textSecondary,
            margin: 0,
            opacity: ctaT,
            transform: `translateY(${(1 - ctaT) * 14}px)`,
          }}
        >
          Open-source invisible teleprompter for Windows.
        </p>

        <div
          style={{
            marginTop: 28,
            padding: "12px 28px",
            borderRadius: 999,
            background: "#f4f4f8",
            color: "#0b0b12",
            fontFamily: THEME.typography.monoFamily,
            fontSize: isVertical ? 16 : 18,
            fontWeight: 600,
            opacity: ctaT,
            transform: `translateY(${(1 - ctaT) * 18}px)`,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
          }}
        >
          github.com/getstealth/stealth
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------------------
 * MASTER COMPOSITION: Metallic Bezel + Red/Violet Dramatic Lighting + Floor Reflection
 * -------------------------------------------------------------------------- */
export const MainComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const isVertical = height > width;

  // Smooth slow camera drift on metallic bezel
  const tiltY = interpolate(frame, [0, durationInFrames], [-2.2, 2.2]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#07070c",
        color: THEME.colors.textPrimary,
        fontFamily: THEME.typography.fontFamily,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Dramatic Stealth Red + Violet Vertical Light Backdrop (Ref Image 2 atmosphere) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 55% 65% at 86% 35%, rgba(244, 63, 94, 0.34), transparent 68%), radial-gradient(ellipse 55% 55% at 16% 25%, rgba(124, 108, 255, 0.22), transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Reflective Studio Floor */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: isVertical ? "20%" : "17%",
          background:
            "linear-gradient(180deg, rgba(244, 63, 94, 0.14) 0%, rgba(124, 108, 255, 0.08) 38%, rgba(7, 7, 12, 0.98) 100%)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          pointerEvents: "none",
        }}
      />

      {/* Rounded Metallic Bezel Floating Display */}
      <div
        style={{
          position: "relative",
          width: isVertical ? "92%" : "88%",
          height: isVertical ? "74%" : "84%",
          borderRadius: 30,
          padding: 5,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.42) 0%, rgba(110,110,130,0.18) 45%, rgba(244,63,94,0.38) 100%)",
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.88), 0 0 70px rgba(244,63,94,0.16), 0 0 50px rgba(124,108,255,0.14)",
          transform: `perspective(1600px) rotateY(${tiltY}deg)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 25,
            backgroundColor: THEME.colors.background,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Sequence from={0} durationInFrames={135}>
            <Act1Hook />
          </Sequence>
          <Sequence from={123} durationInFrames={197}>
            <Act2ProductClick />
          </Sequence>
          <Sequence from={308} durationInFrames={247}>
            <Act3InvisibilitySplit />
          </Sequence>
          <Sequence from={544} durationInFrames={176}>
            <Act4EndCard />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
