import { THEME } from "../types";

export const glassCardStyle: React.CSSProperties = {
  backgroundColor: THEME.colors.surfaceGlass,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${THEME.colors.glassBorder}`,
  borderRadius: "16px",
  boxShadow: "0 20px 44px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
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
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  backgroundColor: "rgba(124, 108, 255, 0.14)",
  border: `1px solid ${THEME.colors.glassBorderActive}`,
  color: THEME.colors.violetAccent,
};

export const codeBadgeStyle: React.CSSProperties = {
  fontFamily: THEME.typography.monoFamily,
  padding: "4px 10px",
  borderRadius: "8px",
  fontSize: "13px",
  backgroundColor: "rgba(11, 11, 18, 0.85)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  color: THEME.colors.violetAccent,
};
