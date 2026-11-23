import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { THEME } from "../types";
import { LaptopDesktopMockup } from "../components/LaptopDesktopMockup";

export const Scene3_Features: React.FC = () => {
  const frame = useCurrentFrame();

  // Opacity transitions (fade in 0-10, fade out 110-120)
  const opacity = interpolate(frame, [0, 10, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calculate smooth text scroll offset over time
  const scrollOffset = frame * 1.8;

  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: THEME.colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 40px",
        fontFamily: THEME.typography.fontFamily,
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.5)",
            padding: "5px 16px",
            borderRadius: 20,
            color: "#10B981",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          👁️ LIVE SPLIT-SCREEN VERIFICATION
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 42,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
          }}
        >
          Presenter View vs. Audience View
        </h1>
        <p style={{ margin: "6px 0 0 0", fontSize: 17, color: "#94A3B8" }}>
          You read your script directly below the webcam. Zoom, Meet, Teams and OBS see only your presentation.
        </p>
      </div>

      {/* Side-by-Side Dual Display Showcase */}
      <div
        style={{
          width: 1720,
          height: 600,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
        }}
      >
        {/* Left: Presenter View */}
        <div style={{ height: "100%" }}>
          <LaptopDesktopMockup
            showPrompter={true}
            isAudienceView={false}
            prompterScrollOffset={scrollOffset}
            label="YOUR MONITOR (PRESENTER VIEW)"
            badgeColor="#00F0FF"
            sublabel="HUD floats right under your webcam"
          />
        </div>

        {/* Right: Audience View */}
        <div style={{ height: "100%" }}>
          <LaptopDesktopMockup
            showPrompter={false}
            isAudienceView={true}
            label="ZOOM / MEET / OBS (AUDIENCE VIEW)"
            badgeColor="#10B981"
            sublabel="Captured screen share is 100% clean"
          />
        </div>
      </div>

      {/* Bottom Technical Proof Callout */}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 16,
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          padding: "8px 24px",
          borderRadius: 24,
          border: "1px solid rgba(0, 240, 255, 0.3)",
          fontSize: 12,
          fontFamily: THEME.typography.monoFamily,
          color: "#E2E8F0",
        }}
      >
        <span style={{ color: "#00F0FF", fontWeight: 700 }}>API: Win32 DWM</span>
        <span>•</span>
        <span style={{ color: "#10B981", fontWeight: 700 }}>WDA_EXCLUDEFROMCAPTURE (0x11)</span>
        <span>•</span>
        <span style={{ color: "#CBD5E1" }}>Zero Canary Pixels Detected in OBS</span>
      </div>
    </AbsoluteFill>
  );
};
