// src/screens/questionnaires/GoalsScreen.js
// Monthly Goal Check-in: 5 items, 1-5 agreement scale.
// Self-contained — follows the same pattern as HooperScreen.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { questionnairesApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";

const QUESTIONS = [
  { id: 0, qKey: "goalsQ1", reverse: false },
  { id: 1, qKey: "goalsQ2", reverse: false },
  { id: 2, qKey: "goalsQ3", reverse: false },
  { id: 3, qKey: "goalsQ4", reverse: true }, // "barriers in the way" — high = bad
  { id: 4, qKey: "goalsQ5", reverse: false },
];

function Scale({ value, onChange, color }) {
  return (
    <View style={scaleStyles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value === n;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[
              scaleStyles.pill,
              active && { backgroundColor: color, borderColor: color },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                scaleStyles.pillText,
                active && { color: "#fff", fontWeight: "800" },
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const scaleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  pill: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#c5d8ee",
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 16, fontWeight: "600", color: "#666" },
});

function computeScore(answers) {
  const adjusted = QUESTIONS.map((q) => {
    const v = answers[q.id];
    return q.reverse ? 6 - v : v;
  });
  const avg = adjusted.reduce((a, b) => a + b, 0) / adjusted.length;
  let status;
  if (avg <= 2.0) status = "stalled";
  else if (avg <= 3.0) status = "drifting";
  else if (avg <= 4.0) status = "ontrack";
  else status = "strong";
  return { avg: Number(avg.toFixed(1)), status };
}

export default function GoalsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent ?? "#4A7AB5";

  const [answers, setAnswers] = useState([null, null, null, null, null]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const setAnswer = (id, val) =>
    setAnswers((prev) => prev.map((a, i) => (i === id ? val : a)));

  const allAnswered = answers.every((a) => typeof a === "number");

  useEffect(() => {
    questionnairesApi
      .latest("goals")
      .then((doc) => {
        console.log("[Goals] latest doc on mount:", JSON.stringify(doc));
        if (doc?.answers && Array.isArray(doc.answers)) {
          setAnswers(doc.answers);
        }
      })
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!allAnswered || saving) return;
    setSaving(true);
    try {
      const score = computeScore(answers);
      console.log("[Goals] computed locally:", JSON.stringify(score));
      let saved = null;
      try {
        saved = await questionnairesApi.submit({
          type: "goals",
          answers,
          scores: score,
        });
        console.log("[Goals] backend returned:", JSON.stringify(saved));
      } catch (e) {
        console.warn(
          "[Goals] save failed (showing result locally):",
          e?.message ?? e,
        );
      }
      setResult(saved ?? { scores: score });
    } catch (e) {
      Alert.alert(t.error ?? "Error", e?.message ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const s = makeStyles(theme);

  if (result) {
    const score = result.scores ?? result.score ?? {};
    const avg = score.avg ?? "—";
    const status = score.status ?? "ontrack";
    const statusKey = "goalsStatus_" + status;

    return (
      <View
        style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}
      >
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
          <Text style={s.headerTitle}>{t.goalsTitle ?? "Goal Check-in"}</Text>
          <View style={s.headerBtn} />
        </View>
        <View
          style={{ flex: 1, padding: Spacing.lg, justifyContent: "center" }}
        >
          <View style={s.resultCard}>
            <Ionicons
              name="checkmark-circle"
              size={56}
              color={PRIMARY}
              style={{ alignSelf: "center" }}
            />
            <Text style={s.resultTitle}>{t.goalsDone ?? "Done!"}</Text>
            <Text style={s.resultLabel}>{t.goalsResult ?? "Your score"}</Text>
            <Text style={[s.resultScore, { color: PRIMARY }]}>{avg} / 5</Text>
            <Text style={s.resultStatus}>{t[statusKey] ?? ""}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                s.saveBtn,
                { backgroundColor: PRIMARY, marginTop: Spacing.xl },
              ]}
            >
              <Text style={s.saveBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
        <Text style={s.headerTitle}>{t.goalsTitle ?? "Goal Check-in"}</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        <Image
          source={require("../../../assets/images/questionary1.png")}
          style={s.heroImage}
          resizeMode="cover"
        />
        <Text style={s.intro}>
          {t.goalsDesc ?? "A short monthly look at your training goals."}
        </Text>

        {QUESTIONS.map((q) => (
          <View key={q.id} style={s.qCard}>
            <Text style={s.qText}>{t[q.qKey] ?? `Question ${q.id + 1}`}</Text>
            <Scale
              value={answers[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
              color={PRIMARY}
            />
            <View style={s.scaleLabels}>
              <Text style={s.scaleLabel}>
                {t.goalsScale1 ?? "Strongly disagree"}
              </Text>
              <Text style={s.scaleLabel}>
                {t.goalsScale5 ?? "Strongly agree"}
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={submit}
          disabled={!allAnswered || saving}
          style={[
            s.saveBtn,
            { backgroundColor: PRIMARY },
            (!allAnswered || saving) && { opacity: 0.4 },
          ]}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.saveBtnText}>{t.goalsSave ?? "SAVE"}</Text>
          )}
        </TouchableOpacity>
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
    },
    headerBtn: { width: 40, alignItems: "center" },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
    },
    heroImage: {
      width: "100%",
      height: 180,
      borderRadius: Radius.lg,
      marginBottom: Spacing.md,
    },
    intro: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      lineHeight: 20,
      marginBottom: Spacing.md,
      fontStyle: "italic",
    },
    qCard: {
      backgroundColor: theme.bg ?? "#fff",
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    qText: {
      color: theme.text,
      fontSize: FontSize.md,
      fontWeight: "600",
      lineHeight: 22,
    },
    scaleLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    scaleLabel: {
      fontSize: FontSize.xs,
      color: theme.textMuted,
      flexShrink: 1,
      maxWidth: "45%",
    },
    saveBtn: {
      height: 56,
      borderRadius: Radius.md,
      justifyContent: "center",
      alignItems: "center",
      marginTop: Spacing.md,
      alignSelf: "stretch",
      paddingHorizontal: 24,
    },
    saveBtnText: {
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "800",
      letterSpacing: 2,
    },
    resultCard: {
      backgroundColor: theme.bg ?? "#fff",
      borderRadius: Radius.lg,
      padding: Spacing.xl,
      alignItems: "center",
    },
    resultTitle: {
      color: theme.text,
      fontSize: FontSize.xl,
      fontWeight: "800",
      marginTop: Spacing.md,
    },
    resultLabel: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      marginTop: Spacing.lg,
    },
    resultScore: { fontSize: 40, fontWeight: "900", marginTop: 4 },
    resultStatus: {
      color: theme.textSecondary,
      fontSize: FontSize.md,
      fontWeight: "600",
      marginTop: Spacing.sm,
      textAlign: "center",
    },
  });
}