// src/screens/share/shareStyles.js
// Theme-aware styles for the Share screen group.
//
// Use `makeShareStyles(theme)` from each screen so dark/light mode picks up
// the right surface and text colors. The legacy `styles` export (a flat
// light-theme stylesheet) is kept for backwards compatibility — prefer the
// factory in new code.

import { StyleSheet } from "react-native";
import { FontSize, Spacing } from "../../constants/theme";

export const TOTAL_SECONDS = 10 * 60;
export const SHARE_DOMAIN = "https://quptrain.com";

export function makeShareStyles(theme) {
  const t = theme || {};
  const SURFACE        = t.surface       ?? "#FFFFFF";
  const SURFACE_ALT    = t.surfaceAlt    ?? "#F1F5F9";
  const BORDER         = t.border        ?? "#E2E8F0";
  const BORDER_STRONG  = t.borderStrong  ?? "#CBD5E1";
  const TEXT_SECONDARY = t.textSecondary ?? "#475569";
  const TEXT_MUTED     = t.textMuted     ?? "#94A3B8";
  const ACCENT         = t.accent        ?? "#4A7AB5";
  const ACCENT_LIGHT   = t.accentLight   ?? "#D9E4F2";

  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      paddingBottom: Spacing.md,
      paddingHorizontal: Spacing.lg,
      flexDirection: "row",
      alignItems: "center",
    },
    headerBtn: { width: 40 },
    headerBack: { color: "#fff", fontSize: 28, lineHeight: 34 },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
    },

    codeCard: {
      backgroundColor: SURFACE,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 28,
      alignItems: "center",
      alignSelf: "center",
      borderWidth: 1.5,
      borderColor: ACCENT_LIGHT,
      shadowColor: ACCENT,
      shadowOpacity: 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      marginBottom: 10,
    },
    codeText: {
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 4,
      marginBottom: 10,
    },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    brandText: { fontSize: 13, color: TEXT_SECONDARY },

    infoCard: {
      backgroundColor: SURFACE,
      borderRadius: 14,
      width: "100%",
      padding: 12,
      alignItems: "center",
      alignSelf: "center",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: BORDER,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    description: {
      fontSize: FontSize.sm,
      color: TEXT_MUTED,
      textAlign: "center",
      marginBottom: 3,
      lineHeight: 18,
    },
    shareUrl: {
      fontSize: FontSize.sm,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 8,
    },

    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    toggleLabel: { fontSize: FontSize.sm, fontWeight: "600" },

    timerCard: {
      backgroundColor: SURFACE,
      borderRadius: 20,
      width: "100%",
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    timerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    timerLabel: { fontSize: FontSize.sm, fontWeight: "600" },
    divider: {
      width: "100%",
      height: 1,
      backgroundColor: BORDER,
      marginVertical: 14,
    },
    generateBtn: { paddingVertical: 2, marginTop: 4, marginBottom: 4 },
    generateText: {
      fontSize: FontSize.sm,
      fontWeight: "800",
      letterSpacing: 1.5,
    },

    // Tab bar styles (used by ShareTabBar)
    tabBarWrapper: {
      backgroundColor: SURFACE,
      paddingHorizontal: 16,
      paddingTop: 6,
      borderTopWidth: 1.5,
      borderTopColor: BORDER_STRONG,
    },
    tabBar: { flexDirection: "row", paddingTop: 6 },
    tabBtn: { flex: 1, alignItems: "center", gap: 0 },
    tabLabel: { fontSize: 11 },
  });
}

// ── Backwards-compat: legacy `styles` export ─────────────────────────────
// Some files may still `import { styles } from "./shareStyles"`. We keep
// a flat light-theme stylesheet so those imports don't break — but prefer
// `makeShareStyles(theme)` going forward.
export const styles = makeShareStyles({
  surface:       "#FFFFFF",
  surfaceAlt:    "#F1F5F9",
  border:        "#E2E8F0",
  borderStrong:  "#CBD5E1",
  text:          "#0F172A",
  textSecondary: "#475569",
  textMuted:     "#94A3B8",
  accent:        "#4A7AB5",
  accentLight:   "#D9E4F2",
});