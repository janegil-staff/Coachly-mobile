// src/screens/questionnaires/QuestionnaireHubScreen.js
// Landing for the Questionnaire tab: shows Hooper (daily) and RESTQ (periodic).

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { questionnairesApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";
import ShareTabBar from "../share/ShareTabBar";

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function QuestionnaireHubScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent ?? "#4A7AB5";

  const [loading, setLoading] = useState(true);
  const [latestHooper, setLatestHooper] = useState(null);
  const [latestRestq, setLatestRestq] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, r] = await Promise.all([
        questionnairesApi.latest("hooper").catch(() => null),
        questionnairesApi.latest("restq").catch(() => null),
      ]);
      setLatestHooper(h);
      setLatestRestq(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const s = makeStyles(theme);

  const Card = ({ titleKey, subtitleKey, descKey, startKey, lastDate, onPress, icon }) => (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.cardHeader}>
        <View style={[s.iconCircle, { backgroundColor: PRIMARY + "22" }]}>
          <Ionicons name={icon} size={26} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{t[titleKey]}</Text>
          <Text style={s.cardSubtitle}>{t[subtitleKey]}</Text>
        </View>
      </View>
      <Text style={s.cardDesc}>{t[descKey]}</Text>
      <View style={s.cardFooter}>
        <Text style={s.cardMeta}>
          {lastDate
            ? (t.hooperLastDone ?? "Last completed") + ": " + formatDate(lastDate)
            : (t.hooperNever ?? "Not completed yet")}
        </Text>
        <View style={[s.startBtn, { backgroundColor: PRIMARY }]}>
          <Text style={s.startBtnText}>{t[startKey]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: PRIMARY }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.questionnaires ?? "Questionnaires"}</Text>
        <View style={s.headerBtn} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>
          <Card
            titleKey="hooperTitle"
            subtitleKey="hooperSubtitle"
            descKey="hooperDesc"
            startKey="hooperStart"
            lastDate={latestHooper?.date}
            onPress={() => navigation.navigate("Hooper")}
            icon="pulse"
          />
          <Card
            titleKey="restqTitle"
            subtitleKey="restqSubtitle"
            descKey="restqDesc"
            startKey="restqStart"
            lastDate={latestRestq?.date}
            onPress={() => navigation.navigate("Restq")}
            icon="clipboard-outline"
          />
        </ScrollView>
      )}

      <ShareTabBar active="questionnaire" navigation={navigation} />
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
    card: {
      backgroundColor: theme.bg ?? "#fff",
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: Spacing.md,
    },
    iconCircle: {
      width: 48, height: 48, borderRadius: 24,
      justifyContent: "center", alignItems: "center",
    },
    cardTitle: { color: theme.text, fontSize: FontSize.lg, fontWeight: "700" },
    cardSubtitle: { color: theme.textMuted, fontSize: FontSize.sm, marginTop: 2 },
    cardDesc: {
      color: theme.textSecondary,
      fontSize: FontSize.sm,
      lineHeight: 20,
      marginBottom: Spacing.md,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardMeta: { color: theme.textMuted, fontSize: FontSize.xs, flex: 1 },
    startBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: Radius.md,
    },
    startBtnText: {
      color: "#fff",
      fontSize: FontSize.xs,
      fontWeight: "800",
      letterSpacing: 1,
    },
  });
}