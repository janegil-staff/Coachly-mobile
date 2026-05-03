// src/screens/share/ShareTabBar.js
// Reusable bottom tab bar shown on Share, QuestionnaireHub, and Studies.
// `active` is "code" | "questionnaire" | "studies".

import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { makeShareStyles } from "./shareStyles";
import {
  IconCode,
  IconQuestionnaire,
  IconStudies,
} from "./shareComponents";

export default function ShareTabBar({ active, navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => makeShareStyles(theme), [theme]);
  const PRIMARY = theme?.accent ?? "#4A7AB5";
  const MUTED = theme?.textMuted ?? "#a0b8d0";

  const tabs = [
    { key: "code", label: t.shareTabCode ?? "Code", Icon: IconCode, screen: "Share" },
    { key: "questionnaire", label: t.shareTabQuestionnaire ?? "Questionnaire", Icon: IconQuestionnaire, screen: "QuestionnaireHub" },
    { key: "studies", label: t.shareTabStudies ?? "Studies", Icon: IconStudies, screen: "Studies" },
  ];

  const handleTab = (tab) => {
    if (tab.key === active) return;
    if (typeof navigation.replace === "function") {
      navigation.replace(tab.screen);
    } else {
      navigation.navigate(tab.screen);
    }
  };

  return (
    <View style={styles.tabBarWrapper}>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const color = isActive ? PRIMARY : MUTED;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabBtn}
              onPress={() => handleTab(tab)}
              activeOpacity={0.7}
            >
              <tab.Icon color={color} size={24} />
              <Text
                style={[
                  styles.tabLabel,
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