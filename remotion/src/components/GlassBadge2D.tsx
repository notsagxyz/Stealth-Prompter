import React from "react";
import { THEME } from "../types";

interface GlassBadge2DProps {
  label: string;
  icon?: string;
  variant?: "cyan" | "emerald" | "danger" | "warning";
  style?: React.CSSProperties;
}

export const GlassBadge2D: React.FC<GlassBadge2DProps> = ({
  label,
  icon,
  variant = "cyan",
  style,
}) => {
  const colorMap = {
    cyan: {
      color: THEME.colors.cyanAccent,
      bg: "rgba(0, 240, 255, 0.12)",
      border: "rgba(0, 240, 255, 0.4)",
    },
    emerald: {
      color: THEME.colors.emeraldAccent,
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.4)",
    },
    danger: {
      color: THEME.colors.dangerAccent,
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.4)",
    },
    warning: {
      color: THEME.colors.warningAccent,
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.4)",
    },
  };

  const currentVariant = colorMap[variant];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 14px",
        borderRadius: "9999px",
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        backgroundColor: currentVariant.bg,
        border: `1px solid ${currentVariant.border}`,
        color: currentVariant.color,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
        ...style,
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </div>
  );
};
