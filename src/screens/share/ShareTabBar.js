// src/screens/share/ShareTabBar.js
// Reusable bottom tab bar shown on Share, QuestionnaireHub, and Studies screens.
// `active` is "code" | "questionnaire" | "studies".

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import {
  IconCode,
  IconQuestionnaire,
  IconStudies,
} from "./shareComponents";

const MUTED = "#a0b8d0";

export default function ShareTabBar({ active, navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme?.accent ?? "#4A7AB5";

  const tabs = [
    { key: "code", label: t.shareTabCode ?? "Code", Icon: IconCode, screen: "Share" },
    { key: "questionnaire", label: t.shareTabQuestionnaire ?? "Questionnaire", Icon: IconQuestionnaire, screen: "QuestionnaireHub" },
    { key: "studies", label: t.shareTabStudies ?? "Studies", Icon: IconStudies, screen: "Studies" },
  ];

  const handleTab = (tab) => {
    if (tab.key === active) return;
    // Use replace if available so tabs feel like siblings rather than stacked.
    if (typeof navigation.replace === "function") {
      navigation.replace(tab.screen);
    } else {
      navigation.navigate(tab.screen);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const color = isActive ? PRIMARY : MUTED;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.btn}
              onPress={() => handleTab(tab)}
              activeOpacity={0.7}
            >
              <tab.Icon color={color} size={24} />
              <Text
                style={[
                  styles.label,
                  { color, fontWeight: isActive ? "700" : "500" },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: "#a0b8d0",
  },
  bar: { flexDirection: "row", paddingTop: 6 },
  btn: { flex: 1, alignItems: "center", gap: 0 },
  label: { fontSize: 11 },
});
