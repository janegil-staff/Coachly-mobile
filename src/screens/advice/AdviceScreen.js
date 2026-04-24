// src/screens/advice/AdviceScreen.js
// Coachly advice. Backed by AdviceContext (which reads from translations
// and syncs viewed/relevant state with the server via authApi).

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { useAdvice } from "../../context/AdviceContext";
import { FontSize, Spacing, Radius } from "../../constants/theme";

const CAT_ICONS = {
  training: "barbell-outline",
  recovery: "leaf-outline",
  nutrition: "nutrition-outline",
  sleep: "moon-outline",
  mindset: "bulb-outline",
  motivation: "flame-outline",
};

const STATUS_COLORS = {
  new: "#22C55E",
  viewed: "#9CA3AF",
  relevant: "#F97316",
};

export default function AdviceScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const { items, categories, markViewed, toggleRelevant, isViewed, isRelevant } =
    useAdvice();

  const [filter, setFilter] = useState("all"); // "all" | "relevant"
  const [modal, setModal] = useState(null);

  const openAdvice = (item) => {
    setModal(item);
    markViewed(item.id);
  };

  const statusOf = (id) => {
    if (isRelevant(id)) return "relevant";
    if (isViewed(id)) return "viewed";
    return "new";
  };

  const visible = items.filter((a) => {
    if (filter === "relevant") return isRelevant(a.id);
    return true;
  });

  const grouped = {};
  visible.forEach((a) => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });

  const catLabel = (c) => t["adviceCat_" + c] ?? c;

  const s = makeStyles(theme);

  return (
    <View style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.advice ?? "Tips"}</Text>
        <View style={s.headerBtn} />
      </View>

      {/* Toggle */}
      <View style={s.toggleRow}>
        {["all", "relevant"].map((f) => {
          const active = filter === f;
          const label = f === "all"
            ? (t.adviceAll ?? "ALL")
            : (t.adviceRelevant ?? "RELEVANT FOR ME");
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[s.toggleBtn, active && { backgroundColor: theme.accent }]}
            >
              <Text style={[s.toggleText, active && { color: "#fff" }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(grouped).length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="bulb-outline" size={44} color={theme.textMuted} />
            <Text style={[s.emptyText, { color: theme.textMuted }]}>
              {t.adviceEmpty ?? "No tips here yet."}
            </Text>
          </View>
        ) : (
          categories
            .filter((c) => grouped[c]?.length)
            .map((cat) => (
              <View key={cat}>
                <View style={s.catHeaderRow}>
                  <Ionicons name={CAT_ICONS[cat]} size={22} color={theme.accent} />
                  <Text style={[s.catHeader, { color: theme.accent }]}>
                    {catLabel(cat)}
                  </Text>
                </View>
                {grouped[cat].map((item) => {
                  const status = statusOf(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => openAdvice(item)}
                      activeOpacity={0.8}
                      style={[s.card, { backgroundColor: theme.bg ?? "#fff" }]}
                    >
                      <View
                        style={[s.badge, { backgroundColor: STATUS_COLORS[status] }]}
                      >
                        <Text style={s.badgeText}>
                          {status === "new"
                            ? (t.adviceNew ?? "New")
                            : status === "relevant"
                              ? (t.adviceRelevant2 ?? "Relevant")
                              : (t.adviceViewed ?? "Viewed")}
                        </Text>
                      </View>
                      <Text style={[s.cardTitle, { color: theme.text }]}>
                        {item.title}
                      </Text>
                      <Text style={[s.cardRead, { color: theme.accent }]}>
                        {t.readMore ?? "Read more"} →
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
        )}
      </ScrollView>

      {/* Detail modal */}
      {modal && (
        <Modal visible animationType="slide" transparent>
          <View style={s.overlay}>
            <View style={[s.sheet, { backgroundColor: theme.bg ?? "#fff" }]}>
              <View style={[s.sheetHeader, { borderBottomColor: theme.border }]}>
                <Text style={[s.sheetTitle, { color: theme.text }]}>
                  {modal.title}
                </Text>
                <TouchableOpacity onPress={() => setModal(null)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: Spacing.lg }}>
                <Text style={[s.sheetBody, { color: theme.text }]}>
                  {modal.body}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleRelevant(modal.id)}
                  style={[
                    s.relevantBtn,
                    {
                      backgroundColor: isRelevant(modal.id)
                        ? STATUS_COLORS.relevant
                        : theme.bg ?? "#fff",
                      borderColor: STATUS_COLORS.relevant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.relevantBtnText,
                      {
                        color: isRelevant(modal.id)
                          ? "#fff"
                          : STATUS_COLORS.relevant,
                      },
                    ]}
                  >
                    {isRelevant(modal.id)
                      ? "✓ " + (t.adviceMarkedRelevant ?? "Marked as relevant")
                      : "☆ " + (t.adviceMarkRelevant ?? "Mark as relevant for me")}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      backgroundColor: theme.accent,
    },
    headerBtn: { width: 40, alignItems: "center" },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
    },
    toggleRow: {
      flexDirection: "row",
      margin: Spacing.md,
      backgroundColor: theme.bg ?? "#fff",
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: Radius.full,
    },
    toggleText: {
      fontSize: FontSize.xs,
      fontWeight: "700",
      letterSpacing: 1,
      color: theme.textMuted,
    },
    catHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    catHeader: { fontSize: FontSize.lg, fontWeight: "800", letterSpacing: 0.3 },
    card: {
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      position: "relative",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    badge: {
      position: "absolute",
      top: 0,
      right: 0,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderBottomLeftRadius: Radius.md,
    },
    badgeText: { color: "#fff", fontSize: FontSize.xs, fontWeight: "700" },
    cardTitle: {
      fontSize: FontSize.md,
      fontWeight: "600",
      marginTop: 4,
      paddingRight: 70,
      lineHeight: 22,
    },
    cardRead: {
      fontSize: FontSize.sm,
      fontWeight: "600",
      marginTop: Spacing.sm,
    },
    empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: FontSize.sm, textAlign: "center" },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
      paddingBottom: 40,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      padding: Spacing.lg,
      borderBottomWidth: 1,
      gap: Spacing.md,
    },
    sheetTitle: {
      flex: 1,
      fontSize: FontSize.lg,
      fontWeight: "700",
      lineHeight: 26,
    },
    sheetBody: {
      fontSize: FontSize.md,
      lineHeight: 26,
      marginBottom: Spacing.xl,
    },
    relevantBtn: {
      borderRadius: Radius.md,
      borderWidth: 2,
      padding: Spacing.md,
      alignItems: "center",
      marginTop: Spacing.sm,
    },
    relevantBtnText: { fontSize: FontSize.md, fontWeight: "700" },
  });
}
