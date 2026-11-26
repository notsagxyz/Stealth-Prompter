import React from "react";
import { RealPrompterHUD } from "./RealPrompterHUD";

export interface LaptopDesktopMockupProps {
  showPrompter?: boolean;
  isAudienceView?: boolean;
  prompterScrollOffset?: number;
  label?: string;
  badgeColor?: string;
  sublabel?: string;
}

export const LaptopDesktopMockup: React.FC<LaptopDesktopMockupProps> = ({
  showPrompter = true,
  isAudienceView = false,
  prompterScrollOffset = 0,
  label = "PRESENTER VIEW",
  badgeColor = "#7c6cff",
  sublabel = "What you see on your monitor",
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#05070E",
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        border: `2px solid ${badgeColor}40`,
        overflow: "hidden",
        position: "relative",
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px ${badgeColor}20`,
      }}
    >
      {/* Top Monitor Bezel with Camera */}
      <div
        style={{
          height: 38,
          backgroundColor: "#0D111A",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 20,
        }}
      >
        {/* View Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: `${badgeColor}20`,
              border: `1px solid ${badgeColor}`,
              color: badgeColor,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </div>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>{sublabel}</span>
        </div>

        {/* Center Webcam indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            padding: "3px 10px",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10B981", boxShadow: "0 0 6px #10B981" }} />
          <span style={{ fontSize: 10, color: "#CBD5E1", fontWeight: 600 }}>Webcam Lens (Eye Level)</span>
        </div>

        {/* Status Callout */}
        <div style={{ fontSize: 11, color: isAudienceView ? "#10B981" : "#7c6cff", fontWeight: 700 }}>
          {isAudienceView ? "🛡️ 100% INVISIBLE" : "👁️ PROMPTER ACTIVE"}
        </div>
      </div>

      {/* Main Desktop Screen Area (e.g. PowerPoint Presentation) */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#0A0D16",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: 24,
          overflow: "hidden",
        }}
      >
        {/* Background Presentation Slide Content */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#0F172A",
            borderRadius: 12,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: 36,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundImage: "radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.12), transparent 40%)",
          }}
        >
          {/* Slide Header */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ color: "#38BDF8", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em" }}>
                SLIDE 04 / 24
              </span>
              <span style={{ color: "#64748B" }}>•</span>
              <span style={{ color: "#94A3B8", fontSize: 13 }}>Q4 Engineering Strategy</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.02em" }}>
              Accelerating Open Source Systems
            </h1>
            <p style={{ margin: "8px 0 0 0", fontSize: 18, color: "#94A3B8" }}>
              High-performance native architectures without Chromium / Electron bloat.
            </p>
          </div>

          {/* Slide Graphic Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.5)", padding: 18, borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#38BDF8" }}>85% Faster</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Sub-350ms cold boot via Rust</div>
            </div>
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.5)", padding: 18, borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#34D399" }}>38 MB RAM</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Zero memory leaks during 144Hz scroll</div>
            </div>
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.5)", padding: 18, borderRadius: 10, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#F472B6" }}>0 Leaks</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>DWM hardware surface exclusion</div>
            </div>
          </div>
        </div>

        {/* Floating Teleprompter HUD (ONLY visible if showPrompter is TRUE and isAudienceView is FALSE) */}
        {showPrompter && !isAudienceView && (
          <div
            style={{
              position: "absolute",
              top: 36,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 30,
            }}
          >
            <RealPrompterHUD
              width={820}
              height={220}
              scrollOffset={prompterScrollOffset}
            />
          </div>
        )}

        {/* If Audience View: Show a clear confirmation stamp */}
        {isAudienceView && (
          <div
            style={{
              position: "absolute",
              top: 48,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "2px dashed #10B981",
              borderRadius: 12,
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 0 30px rgba(16, 185, 129, 0.25)",
            }}
          >
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#10B981" }}>
                TELEPROMPTER IS 100% EXCLUDED FROM CAPTURE
              </div>
              <div style={{ fontSize: 11, color: "#A7F3D0" }}>
                Zoom, Meet, Teams and OBS capture the slides with zero prompt overlay.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
