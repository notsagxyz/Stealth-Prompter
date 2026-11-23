import { THEME } from "../types";

export const glassCardStyle: React.CSSProperties = {
  backgroundColor: THEME.colors.surfaceGlass,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${THEME.colors.glassBorder}`,
  borderRadius: "16px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  color: THEME.colors.textPrimary,
};

export const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 14px",
  borderRadius: "9999px",
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  backgroundColor: "rgba(0, 240, 255, 0.1)",
  border: `1px solid ${THEME.colors.glassBorderActive}`,
  color: THEME.colors.cyanAccent,
};

export const codeBadgeStyle: React.CSSProperties = {
  fontFamily: THEME.typography.monoFamily,
  padding: "4px 10px",
  borderRadius: "8px",
  fontSize: "13px",
  backgroundColor: "rgba(14, 17, 26, 0.8)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  color: THEME.colors.cyanAccent,
};
