// src/screens/auth/TermsScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize, Spacing, Radius } from "../../constants/theme";

export default function TermsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const s = makeStyles(theme);
  const sections = t.termsSections ?? [];

  return (
    <View style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.termsTitle ?? "Terms & Conditions"}</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {!!t.termsUpdated && (
          <Text style={s.updatedText}>{t.termsUpdated}</Text>
        )}
        {sections.map((section, idx) => (
          <View key={idx} style={s.card}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
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
    updatedText: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      fontStyle: "italic",
      marginBottom: Spacing.lg,
      textAlign: "center",
    },
    card: {
      backgroundColor: theme.bg ?? "#fff",
      borderLeftWidth: 4,
      borderLeftColor: theme.accent,
      borderRadius: Radius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: FontSize.md,
      fontWeight: "700",
      marginBottom: 8,
    },
    sectionBody: {
      color: theme.textSecondary,
      fontSize: FontSize.md,
      lineHeight: 22,
    },
  });
}
