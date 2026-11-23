import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../types";

export const Scene1_Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Opacity transitions (fade in 0-10, fade out 105-115)
  const opacity = interpolate(frame, [0, 10, 105, 115], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slideUp = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const alertPulse = Math.sin(frame * 0.25) * 0.15 + 0.85;

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: THEME.colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 60px",
        fontFamily: THEME.typography.fontFamily,
      }}
    >
      {/* Scene Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
          transform: `translateY(${interpolate(slideUp, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            padding: "6px 16px",
            borderRadius: 20,
            color: "#EF4444",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.08em",
            marginBottom: 12,
          }}
        >
          ⚠️ THE SCREEN SHARE EMBARRASSMENT
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 48,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
          }}
        >
          Traditional Teleprompters Leak Your Script
        </h1>
        <p style={{ margin: "10px 0 0 0", fontSize: 20, color: "#94A3B8" }}>
          When you share your screen in Zoom, Teams or OBS, your notes are visible to everyone.
        </p>
      </div>

      {/* Simulated Screen Share Desktop with Leaked Prompter */}
      <div
        style={{
          width: 1280,
          height: 640,
          backgroundColor: "#0F172A",
          borderRadius: 16,
          border: "3px solid #10B981", // Zoom screen share border
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.2)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Zoom Screen Share Banner */}
        <div
          style={{
            height: 34,
            backgroundColor: "#10B981",
            color: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.05em",
          }}
        >
          <span>🔴 ZOOM SCREEN SHARING ACTIVE • YOU ARE SHARING YOUR SCREEN</span>
          <span>STOP SHARE [Alt+S]</span>
        </div>

        {/* Desktop Presentation Behind */}
        <div style={{ flex: 1, padding: 40, display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#090D1A" }}>
          <div>
            <span style={{ color: "#38BDF8", fontSize: 13, fontWeight: 700 }}>EXECUTIVE PRESENTATION 2026</span>
            <h2 style={{ fontSize: 42, color: "#FFFFFF", margin: "10px 0" }}>Quarterly Business Review</h2>
            <p style={{ fontSize: 18, color: "#94A3B8" }}>Confidential strategy slide deck presented live to stakeholders.</p>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ flex: 1, height: 120, backgroundColor: "#1E293B", borderRadius: 8, padding: 16 }}>
              <div style={{ color: "#94A3B8", fontSize: 13 }}>Revenue Target</div>
              <div style={{ color: "#38BDF8", fontSize: 28, fontWeight: 800, marginTop: 8 }}>$4.8M (+34%)</div>
            </div>
            <div style={{ flex: 1, height: 120, backgroundColor: "#1E293B", borderRadius: 8, padding: 16 }}>
              <div style={{ color: "#94A3B8", fontSize: 13 }}>New Accounts</div>
              <div style={{ color: "#10B981", fontSize: 28, fontWeight: 800, marginTop: 8 }}>+1,420 Active</div>
            </div>
            <div style={{ flex: 1, height: 120, backgroundColor: "#1E293B", borderRadius: 8, padding: 16 }}>
              <div style={{ color: "#94A3B8", fontSize: 13 }}>Retention Rate</div>
              <div style={{ color: "#A855F7", fontSize: 28, fontWeight: 800, marginTop: 8 }}>98.6%</div>
            </div>
          </div>
        </div>

        {/* Giant Leaked Teleprompter Window Sitting on Top */}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            width: 780,
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "2px solid #EF4444",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#EF4444" }}>
              GENERIC TELEPROMPTER APP (VISIBLE TO AUDIENCE)
            </span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Speed: 140 WPM</span>
          </div>

          <p style={{ margin: "0 0 10px 0", fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>
            "Good morning investors. Remember: don't mention Q3 churn numbers unless asked directly..."
          </p>
          <div style={{ color: "#F59E0B", fontSize: 13, fontWeight: 700, fontFamily: THEME.typography.monoFamily }}>
            [CUE: Pretend to be confident and look at the webcam]
          </div>

          {/* Red Warning Overlay Stamp */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(-6deg) scale(${alertPulse})`,
              backgroundColor: "rgba(239, 68, 68, 0.95)",
              color: "#FFFFFF",
              padding: "12px 32px",
              borderRadius: 8,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "0.08em",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
              textAlign: "center",
              border: "3px solid #FFFFFF",
            }}
          >
            ❌ YOUR AUDIENCE SEES THIS!
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
