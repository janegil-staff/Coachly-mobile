// src/screens/studies/StudiesScreen.js
// Placeholder Studies tab — coming soon. Same chrome as Share/Questionnaire so
// the bottom tab bar lines up across all three.

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize, Spacing, Radius } from "../../constants/theme";
import ShareTabBar from "../share/ShareTabBar";

export default function StudiesScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent ?? "#4A7AB5";

  const s = makeStyles(theme);

  return (
    <View style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: PRIMARY }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.shareTabStudies ?? "Studies"}</Text>
        <View style={s.headerBtn} />
      </View>

      <View style={s.body}>
        <View style={[s.iconCircle, { backgroundColor: PRIMARY + "1F" }]}>
          <Ionicons name="school-outline" size={48} color={PRIMARY} />
        </View>
        <Text style={s.title}>{t.comingSoon ?? "Coming soon"}</Text>
        <Text style={s.body2}>
          {t.studiesComingSoon ?? "Studies feature is coming soon."}
        </Text>
      </View>

      <ShareTabBar active="studies" navigation={navigation} />
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
    },
    headerBtn: { width: 40, alignItems: "center" },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
    },
    body: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.xl,
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
    },
    title: {
      color: theme.text,
      fontSize: FontSize.xl,
      fontWeight: "700",
      marginBottom: Spacing.sm,
    },
    body2: {
      color: theme.textMuted,
      fontSize: FontSize.md,
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
