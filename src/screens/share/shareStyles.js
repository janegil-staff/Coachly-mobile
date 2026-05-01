// src/screens/share/shareStyles.js
import { StyleSheet } from "react-native";
import { FontSize, Spacing } from "../../constants/theme";

export const TOTAL_SECONDS = 10 * 60;
export const SHARE_DOMAIN = "https://quptrain.com";

export const styles = StyleSheet.create({
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
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: "#b3cde8",
    shadowColor: "#4A7AB5",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginBottom: 10,
  },
  codeText: { fontSize: 22, fontWeight: "800", letterSpacing: 4, marginBottom: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandText: { fontSize: 13, color: "#333" },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: "100%",
    padding: 12,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8eef5",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  description: {
    fontSize: FontSize.sm,
    color: "#888",
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
    backgroundColor: "#fff",
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
    backgroundColor: "#e8eef5",
    marginVertical: 14,
  },
  generateBtn: { paddingVertical: 2, marginTop: 4, marginBottom: 4 },
  generateText: { fontSize: FontSize.sm, fontWeight: "800", letterSpacing: 1.5 },

  // Tab bar styles
  tabBarWrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: "#a0b8d0",
  },
  tabBar: { flexDirection: "row", paddingTop: 6 },
  tabBtn: { flex: 1, alignItems: "center", gap: 0 },
  tabLabel: { fontSize: 11 },
});
