// src/constants/theme.js
// Recover-style flat theme shape.
// Themes are flat objects with color keys at the top level.
// Spacing/Radius/FontSize are separate top-level exports.

export const lightTheme = {
  mode: "light",

  // Surfaces
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",

  // Text
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  // Accent (brand)
  accent: "#4A7AB5",
  accentDark: "#325481",
  accentLight: "#D9E4F2",
  accentBg: "#EEF3FA",

  // Borders & input
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",
  inputLine: "#CBD5E1",
  inputBg: "#FFFFFF",
  inputText: "#0F172A",
  inputPlaceholder: "#94A3B8",

  // Buttons
  buttonPrimary: "#4A7AB5",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondary: "#F1F5F9",
  buttonSecondaryText: "#1E293B",

  // Semantic
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",

  // Score scale
  score1: "#BFDBFE",
  score2: "#86EFAC",
  score3: "#FCD34D",
  score4: "#FCA5A5",
  score5: "#DC2626",

  // Gradient
  gradientStart: "#4A7AB5",
  gradientEnd: "#325481",

  shadow: "#000000",
};

export const darkTheme = {
  mode: "dark",

  bg: "#0B1220",
  surface: "#111827",
  surfaceAlt: "#1E293B",

  text: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#64748B",
  textInverse: "#0F172A",

  accent: "#4A7AB5",
  accentDark: "#325481",
  accentLight: "#3E679B",
  accentBg: "#1A2A3F",

  border: "#1F2937",
  borderStrong: "#334155",
  divider: "#1F2937",
  inputLine: "#334155",
  inputBg: "#1E293B",
  inputText: "#F8FAFC",
  inputPlaceholder: "#64748B",

  buttonPrimary: "#4A7AB5",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondary: "#1E293B",
  buttonSecondaryText: "#F1F5F9",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",

  score1: "#BFDBFE",
  score2: "#86EFAC",
  score3: "#FCD34D",
  score4: "#FCA5A5",
  score5: "#DC2626",

  gradientStart: "#3E679B",
  gradientEnd: "#325481",

  shadow: "#000000",
};

// ── Scales ─────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
};

export const Weight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export default { lightTheme, darkTheme, Spacing, Radius, FontSize, Weight, Shadows };