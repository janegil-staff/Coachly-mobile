// src/screens/questionnaires/QuestionnaireHubScreen.js
// Landing for the Questionnaire tab.

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
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Pull a displayable score (e.g. "3.4 / 5") from a saved questionnaire doc.
 * Different questionnaire types store scores differently:
 *   - Hooper: { total: 12, status: "normal" }
 *   - Restq:  { stress, recovery, balance }
 *   - Goals & co.: { avg: 3.4, status: "ontrack" }
 */
function formatScore(doc) {
  if (!doc?.scores) return null;
  const sc = doc.scores;
  if (typeof sc.avg === "number") return `${sc.avg} / 5`;
  if (typeof sc.total === "number") return `${sc.total} / 28`;
  if (typeof sc.balance === "number") {
    return `${sc.balance >= 0 ? "+" : ""}${sc.balance}`;
  }
  return null;
}

export default function QuestionnaireHubScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent ?? "#4A7AB5";

  const [loading, setLoading] = useState(true);
  const [latestHooper, setLatestHooper] = useState(null);
  const [latestRestq, setLatestRestq] = useState(null);
  const [latestGoals, setLatestGoals] = useState(null);
  const [latestStress, setLatestStress] = useState(null);
  const [latestSleep, setLatestSleep] = useState(null);
  const [latestActivity, setLatestActivity] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const [pss, psqi, ipaq] = await Promise.all([
            questionnairesApi.list({ type: "pss10", limit: 1 }),
            questionnairesApi.list({ type: "psqi", limit: 1 }),
            questionnairesApi.list({ type: "ipaq", limit: 1 }),
          ]);
          if (!alive) return;
          setLatestStress(pss?.[0] ?? null);
          setLatestSleep(psqi?.[0] ?? null);
          setLatestActivity(ipaq?.[0] ?? null);
        } catch (e) {
          console.warn("Hub fetch failed:", e?.message ?? e);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, r, g] = await Promise.all([
        questionnairesApi.latest("hooper").catch(() => null),
        questionnairesApi.latest("restq").catch(() => null),
        questionnairesApi.latest("goals").catch(() => null),
      ]);
      setLatestHooper(h);
      setLatestRestq(r);
      setLatestGoals(g);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const s = makeStyles(theme);

  const Card = ({
    titleKey,
    subtitleKey,
    descKey,
    startKey,
    lastDoc,
    onPress,
    icon,
  }) => {
    const lastDate = lastDoc?.date;
    const scoreLabel = formatScore(lastDoc);
    const completedLabel = lastDate
      ? (t.hooperLastDone ?? "Last completed") + ": " + formatDate(lastDate)
      : (t.hooperNever ?? "Not completed yet");

    return (
      <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
        <View style={s.cardHeader}>
          <View style={[s.iconCircle, { backgroundColor: PRIMARY + "22" }]}>
            <Ionicons name={icon} size={26} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{t[titleKey]}</Text>
            <Text style={s.cardSubtitle}>{t[subtitleKey]}</Text>
          </View>
          {scoreLabel ? (
            <View style={[s.scoreBadge, { borderColor: PRIMARY }]}>
              <Text style={[s.scoreBadgeText, { color: PRIMARY }]}>
                {scoreLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={s.cardDesc}>{t[descKey]}</Text>
        <View style={s.cardFooter}>
          <Text style={s.cardMeta}>{completedLabel}</Text>
          <View style={[s.startBtn, { backgroundColor: PRIMARY }]}>
            <Text style={s.startBtnText}>{t[startKey]}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
      <View
        style={[
          s.header,
          { paddingTop: insets.top + Spacing.sm, backgroundColor: PRIMARY },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.headerBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {t.questionnaires ?? "Questionnaires"}
        </Text>
        <View style={s.headerBtn} />
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
        >
          {/* Hooper and RESTQ commented out — re-enable by uncommenting:
          <Card
            titleKey="hooperTitle"
            subtitleKey="hooperSubtitle"
            descKey="hooperDesc"
            startKey="hooperStart"
            lastDoc={latestHooper}
            onPress={() => navigation.navigate("Hooper")}
            icon="pulse"
          />
          <Card
            titleKey="restqTitle"
            subtitleKey="restqSubtitle"
            descKey="restqDesc"
            startKey="restqStart"
            lastDoc={latestRestq}
            onPress={() => navigation.navigate("Restq")}
            icon="clipboard-outline"
          />
          */}
          <Card
            titleKey="goalsTitle"
            subtitleKey="goalsSubtitle"
            descKey="goalsDesc"
            startKey="goalsStart"
            lastDoc={latestGoals}
            onPress={() => navigation.navigate("Goals")}
            icon="flag-outline"
          />
          <Card
            titleKey="pss10_title"
            subtitleKey="pss10_subtitle"
            descKey="pss10_intro"
            startKey="goalsStart"
            lastDoc={latestStress}
            onPress={() => navigation.navigate("Stress")}
            icon="pulse-outline"
          />

          <Card
            titleKey="psqi_title"
            subtitleKey="psqi_subtitle"
            descKey="psqi_intro"
            startKey="goalsStart"
            lastDoc={latestSleep}
            onPress={() => navigation.navigate("Sleep")}
            icon="moon-outline"
          />

          <Card
            titleKey="ipaq_title"
            subtitleKey="ipaq_subtitle"
            descKey="ipaq_intro"
            startKey="goalsStart"
            lastDoc={latestActivity}
            onPress={() => navigation.navigate("Activity")}
            icon="walk-outline"
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
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    cardTitle: { color: theme.text, fontSize: FontSize.lg, fontWeight: "700" },
    cardSubtitle: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      marginTop: 2,
    },
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
    scoreBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1.5,
    },
    scoreBadgeText: {
      fontSize: FontSize.xs,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
  });
}
