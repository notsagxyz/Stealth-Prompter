import React from "react";
import { THEME } from "../types";

export interface RealLauncherUIProps {
  scale?: number;
  highlightInvisibility?: boolean;
  highlightToggleHUD?: boolean;
  activeScriptTitle?: string;
  speed?: number;
}

export const RealLauncherUI: React.FC<RealLauncherUIProps> = ({
  scale = 1,
  highlightInvisibility = false,
  highlightToggleHUD = false,
  activeScriptTitle = "Keynote 2026 - StealthPrompter Launch",
  speed = 3.0,
}) => {
  return (
    <div
      style={{
        width: 1080,
        height: 680,
        backgroundColor: "#0B0F19",
        borderRadius: 16,
        border: "1px solid rgba(0, 240, 255, 0.25)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px rgba(0, 240, 255, 0.15)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: THEME.typography.fontFamily,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {/* Window Titlebar */}
      <div
        style={{
          height: 48,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        {/* Left: App Logo & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: "rgba(0, 240, 255, 0.15)",
              border: "1px solid rgba(0, 240, 255, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00F0FF",
              fontWeight: 800,
              fontSize: 13,
              boxShadow: "0 0 10px rgba(0, 240, 255, 0.3)",
            }}
          >
            SP
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                StealthPrompter
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: THEME.typography.monoFamily,
                  padding: "1px 5px",
                  borderRadius: 4,
                  backgroundColor: "rgba(0, 240, 255, 0.12)",
                  color: "#00F0FF",
                  border: "1px solid rgba(0, 240, 255, 0.3)",
                }}
              >
                v0.1.0
              </span>
            </div>
            <span style={{ fontSize: 10, color: "#94A3B8" }}>Invisible Teleprompter Overlay</span>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(2, 6, 23, 0.7)",
            padding: "4px 8px",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <button
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              fontSize: 13,
              cursor: "pointer",
              padding: "2px 6px",
            }}
          >
            ⏮
          </button>
          <button
            style={{
              background: "rgba(0, 240, 255, 0.2)",
              border: "1px solid rgba(0, 240, 255, 0.5)",
              color: "#00F0FF",
              fontSize: 12,
              borderRadius: 6,
              cursor: "pointer",
              padding: "4px 10px",
              fontWeight: 600,
            }}
          >
            ▶ Play (Alt+Space)
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#CBD5E1", fontSize: 11, fontFamily: THEME.typography.monoFamily, marginLeft: 4 }}>
            <span>-</span>
            <span style={{ color: "#00F0FF", fontWeight: 700, minWidth: 26, textAlign: "center" }}>
              {speed.toFixed(1)}x
            </span>
            <span>+</span>
          </div>
        </div>

        {/* Right: Toggle Prompter HUD Button & Window Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{
              backgroundColor: highlightToggleHUD ? "#10B981" : "rgba(16, 185, 129, 0.2)",
              border: "1px solid #10B981",
              color: highlightToggleHUD ? "#000000" : "#34D399",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: highlightToggleHUD ? "0 0 20px rgba(16, 185, 129, 0.6)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span>👁️</span>
            <span>Toggle Prompter HUD</span>
          </button>

          {/* Windows Minimize / Maximize / Close dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#334155" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#334155" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: "#EF4444" }} />
          </div>
        </div>
      </div>

      {/* Invisibility Shield Banner */}
      <div
        style={{
          padding: "10px 18px",
          backgroundColor: highlightInvisibility ? "rgba(16, 185, 129, 0.18)" : "rgba(16, 185, 129, 0.08)",
          borderBottom: "1px solid rgba(16, 185, 129, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: highlightInvisibility ? "inset 0 0 25px rgba(16, 185, 129, 0.2)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              border: "1px solid #10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
              fontSize: 14,
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", display: "flex", alignItems: "center", gap: 8 }}>
              <span>INVISIBILITY SHIELD ACTIVE</span>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: THEME.typography.monoFamily,
                  backgroundColor: "rgba(16, 185, 129, 0.25)",
                  color: "#A7F3D0",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                Win32 WDA_EXCLUDEFROMCAPTURE (0x11)
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>
              Prompter HUD is 100% hidden from Zoom, Teams, OBS & Screen Capture. Presenter sees it, audience does not.
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: "#10B981",
            padding: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            boxShadow: "0 0 10px rgba(16, 185, 129, 0.5)",
          }}
        >
          <div style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" }} />
        </div>
      </div>

      {/* Main Workspace (Sidebar + Editor) */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: 14, gap: 14 }}>
        {/* Left Sidebar */}
        <div
          style={{
            width: 260,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            paddingRight: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(2, 6, 23, 0.5)",
              borderRadius: 8,
              padding: 3,
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "6px 0",
                fontSize: 11,
                fontWeight: 600,
                color: "#00F0FF",
                backgroundColor: "rgba(0, 240, 255, 0.12)",
                borderRadius: 6,
                border: "1px solid rgba(0, 240, 255, 0.3)",
              }}
            >
              Scripts (4)
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "6px 0",
                fontSize: 11,
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              Settings
            </div>
          </div>

          {/* Script Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                backgroundColor: "rgba(0, 240, 255, 0.1)",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>{activeScriptTitle}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#94A3B8" }}>
                <span>428 words</span>
                <span>•</span>
                <span>3m 15s</span>
              </div>
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1" }}>Product Demo & Q&A</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#64748B" }}>
                <span>215 words</span>
                <span>•</span>
                <span>1m 40s</span>
              </div>
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#CBD5E1" }}>Investor Pitch Deck</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#64748B" }}>
                <span>650 words</span>
                <span>•</span>
                <span>4m 50s</span>
              </div>
            </div>
          </div>

          <button
            style={{
              marginTop: "auto",
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px dashed rgba(255, 255, 255, 0.2)",
              color: "#94A3B8",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New Script
          </button>
        </div>

        {/* Right Editor Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Editor Header Stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 14px",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#00F0FF" }}>{activeScriptTitle}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "#94A3B8" }}>
              <span>Words: <strong style={{ color: "#FFFFFF" }}>428</strong></span>
              <span>Est. Time: <strong style={{ color: "#FFFFFF" }}>3m 15s</strong></span>
              <span>Speed: <strong style={{ color: "#00F0FF" }}>130 WPM</strong></span>
            </div>
          </div>

          {/* Editor Text Content */}
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(2, 6, 23, 0.6)",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: 16,
              color: "#E2E8F0",
              fontSize: 14,
              lineHeight: 1.7,
              fontFamily: THEME.typography.fontFamily,
              overflow: "hidden",
            }}
          >
            <div style={{ color: "#10B981", fontSize: 12, fontWeight: 700, marginBottom: 8, fontFamily: THEME.typography.monoFamily }}>
              [CUE: Look directly into camera lens]
            </div>
            <p style={{ margin: "0 0 12px 0", color: "#F8FAFC" }}>
              Welcome everyone. Today, I'm thrilled to introduce <strong>StealthPrompter</strong> — the fast, open-source teleprompter designed for presenters who refuse to compromise.
            </p>
            <p style={{ margin: "0 0 12px 0", color: "#94A3B8" }}>
              Have you ever shared your screen on Zoom or Teams and worried your audience would see your notes?
            </p>
            <div style={{ color: "#00F0FF", fontSize: 12, fontWeight: 700, marginBottom: 8, fontFamily: THEME.typography.monoFamily }}>
              [CUE: Pause 2 seconds for effect]
            </div>
            <p style={{ margin: "0 0 12px 0", color: "#F8FAFC" }}>
              With Windows hardware capture exclusion, this teleprompter floats right below your webcam, giving you flawless eye contact without leaking a single pixel to OBS, Zoom or Discord.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
