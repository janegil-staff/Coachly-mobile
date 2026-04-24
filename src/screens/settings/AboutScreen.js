// src/screens/settings/AboutScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize, Spacing, Radius } from "../../constants/theme";

export default function AboutScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const s = makeStyles(theme);
  const sections = t.aboutSections ?? [];

  return (
    <View style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.aboutTitle ?? "About"}</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.taglineBlock}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.tagline}>{t.aboutTagline ?? ""}</Text>
          <Text style={s.version}>
            {(t.aboutVersion ?? "Version") + " 1.0.0"}
          </Text>
        </View>

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
    taglineBlock: {
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: 16,
      marginBottom: Spacing.md,
    },
    tagline: {
      color: theme.accent,
      fontSize: FontSize.lg,
      fontWeight: "700",
      textAlign: "center",
    },
    version: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      marginTop: 4,
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
