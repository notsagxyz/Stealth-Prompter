import React from "react";
import { THEME } from "../types";

export interface RealPrompterHUDProps {
  scrollOffset?: number;
  width?: number;
  height?: number;
  scale?: number;
  guideLine?: boolean;
}

export const RealPrompterHUD: React.FC<RealPrompterHUDProps> = ({
  scrollOffset = 0,
  width = 960,
  height = 280,
  scale = 1,
  guideLine = true,
}) => {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "rgba(10, 15, 29, 0.82)",
        backdropFilter: "blur(20px)",
        borderRadius: 16,
        border: "1px solid rgba(0, 240, 255, 0.35)",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 240, 255, 0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        fontFamily: THEME.typography.fontFamily,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {/* HUD Top Bar */}
      <div
        style={{
          height: 36,
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          borderBottom: "1px solid rgba(0, 240, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10B981", boxShadow: "0 0 8px #10B981" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#00F0FF", letterSpacing: "0.05em" }}>
            STEALTH HUD • 144Hz SMOOTH SCROLL
          </span>
        </div>

        {/* HUD Quick Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontFamily: THEME.typography.monoFamily }}>
          <span style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10B981", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(16, 185, 129, 0.4)" }}>
            INVISIBLE TO CAPTURE
          </span>
          <span style={{ backgroundColor: "rgba(0, 240, 255, 0.15)", color: "#00F0FF", padding: "2px 6px", borderRadius: 4 }}>
            SPEED: 3.0x
          </span>
          <span style={{ color: "#94A3B8" }}>
            Alt+Space: Pause | Alt+H: Hide
          </span>
        </div>
      </div>

      {/* Guide Line in Center */}
      {guideLine && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 20,
            right: 20,
            height: 2,
            backgroundColor: "rgba(0, 240, 255, 0.65)",
            boxShadow: "0 0 10px rgba(0, 240, 255, 0.8)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -12,
              top: -6,
              width: 0,
              height: 0,
              borderTop: "7px solid transparent",
              borderBottom: "7px solid transparent",
              borderLeft: "10px solid #00F0FF",
            }}
          />
        </div>
      )}

      {/* Scrolling Text Container */}
      <div
        style={{
          flex: 1,
          padding: "24px 36px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          position: "relative",
          maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
        }}
      >
        <div
          style={{
            transform: `translateY(${-scrollOffset}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            textAlign: "center",
          }}
        >
          <div style={{ color: "#10B981", fontSize: 13, fontWeight: 700, fontFamily: THEME.typography.monoFamily }}>
            [CUE: Look directly into camera lens — Smile naturally]
          </div>

          <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.4 }}>
            Today I'm thrilled to unveil <strong>Stealth Prompter</strong>.
          </p>

          <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: "#E2E8F0", lineHeight: 1.4 }}>
            The lightning-fast, open-source teleprompter that stays 100% invisible during screen shares.
          </p>

          <div style={{ color: "#00F0FF", fontSize: 13, fontWeight: 700, fontFamily: THEME.typography.monoFamily }}>
            [CUE: Click next slide on presentation]
          </div>

          <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: "#CBD5E1", lineHeight: 1.4 }}>
            Your audience sees your presentation in full clarity. Only you see your script.
          </p>

          <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: "#94A3B8", lineHeight: 1.4 }}>
            Zero leaked pixels. Zero awkward second monitors. Zero performance drops.
          </p>
        </div>
      </div>
    </div>
  );
};
