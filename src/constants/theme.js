// src/constants/theme.js
// Theme constants — palette, spacing, radius, typography.
// Mirrors Recover exactly for visual continuity across KBB Medic apps.

const palette = {
  // Primary brand (Recover blue)
  brand500: "#4A7AB5",
  brand600: "#3E679B",
  brand700: "#325481",
  brand100: "#D9E4F2",
  brand50: "#EEF3FA",

  // Neutrals
  white: "#FFFFFF",
  black: "#000000",

  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  // Semantic
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",

  // Score scale (used by calendar, wellbeing, etc.)
  score1: "#BFDBFE", // light blue
  score2: "#86EFAC", // green
  score3: "#FCD34D", // amber
  score4: "#FCA5A5", // salmon
  score5: "#DC2626", // dark red
};

export const lightTheme = {
  mode: "light",

  colors: {
    // Primary
    primary: palette.brand500,
    primaryDark: palette.brand700,
    primaryLight: palette.brand100,
    primaryBg: palette.brand50,

    // Surfaces
    background: palette.gray50,
    surface: palette.white,
    surfaceAlt: palette.gray100,
    card: palette.white,

    // Text
    text: palette.gray900,
    textSecondary: palette.gray600,
    textMuted: palette.gray400,
    textInverse: palette.white,

    // Borders
    border: palette.gray200,
    borderStrong: palette.gray300,
    divider: palette.gray100,

    // Semantic
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    info: palette.info,

    // Inputs
    inputBg: palette.white,
    inputBorder: palette.gray300,
    inputText: palette.gray900,
    inputPlaceholder: palette.gray400,

    // Buttons
    buttonPrimary: palette.brand500,
    buttonPrimaryText: palette.white,
    buttonSecondary: palette.gray100,
    buttonSecondaryText: palette.gray800,
    buttonDisabled: palette.gray200,
    buttonDisabledText: palette.gray400,

    // Score scale
    score1: palette.score1,
    score2: palette.score2,
    score3: palette.score3,
    score4: palette.score4,
    score5: palette.score5,

    // Gradient endpoints (for LinearGradient headers)
    gradientStart: palette.brand500,
    gradientEnd: palette.brand700,

    // Shadow color
    shadow: palette.black,
  },
};

export const darkTheme = {
  mode: "dark",

  colors: {
    // Primary
    primary: palette.brand500,
    primaryDark: palette.brand700,
    primaryLight: palette.brand600,
    primaryBg: "#1A2A3F",

    // Surfaces
    background: "#0B1220",
    surface: "#111827",
    surfaceAlt: "#1E293B",
    card: "#111827",

    // Text
    text: palette.gray50,
    textSecondary: palette.gray300,
    textMuted: palette.gray500,
    textInverse: palette.gray900,

    // Borders
    border: "#1F2937",
    borderStrong: palette.gray700,
    divider: "#1F2937",

    // Semantic
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    info: palette.info,

    // Inputs
    inputBg: "#1E293B",
    inputBorder: palette.gray700,
    inputText: palette.gray50,
    inputPlaceholder: palette.gray500,

    // Buttons
    buttonPrimary: palette.brand500,
    buttonPrimaryText: palette.white,
    buttonSecondary: "#1E293B",
    buttonSecondaryText: palette.gray100,
    buttonDisabled: palette.gray800,
    buttonDisabledText: palette.gray600,

    // Score scale (keep same — the colors work on both backgrounds)
    score1: palette.score1,
    score2: palette.score2,
    score3: palette.score3,
    score4: palette.score4,
    score5: palette.score5,

    // Gradients
    gradientStart: palette.brand600,
    gradientEnd: palette.brand700,

    shadow: palette.black,
  },
};

// Shared (non-color) theme values — same in light and dark
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const typography = {
  // Font sizes
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,

  // Weights
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",

  // Line heights (multipliers)
  lineTight: 1.2,
  lineBase: 1.4,
  lineRelaxed: 1.6,
};

export const shadows = {
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

// Default export for convenience — ThemeContext uses these
export default { lightTheme, darkTheme, spacing, radius, typography, shadows };