// src/screens/questionnaires/StressScreen.js
// Monthly Perceived Stress Scale (PSS-10): 10 items, 0-4 frequency scale.
// Items 4, 5, 7, 8 are reverse-scored.
// Total 0-40. Cutoffs: 0-13 low, 14-26 moderate, 27-40 high.

import React, { useRef, useState } from "react";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { questionnairesApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";

// PSS-10 items 4, 5, 7, 8 are reverse-scored
const REVERSE_ITEMS = new Set([4, 5, 7, 8]);

// 5-point Likert: 0=Never ... 4=Very often
const OPTIONS = [0, 1, 2, 3, 4];

// 10 items
const QUESTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

function computeScore(answers) {
  let total = 0;
  for (const q of QUESTIONS) {
    const raw = Number(answers[q]);
    if (Number.isNaN(raw)) return null;
    total += REVERSE_ITEMS.has(q) ? 4 - raw : raw;
  }
  let key;
  if (total <= 13) key = "pss10_resultLow";
  else if (total <= 26) key = "pss10_resultModerate";
  else key = "pss10_resultHigh";
  return { score: total, max: 40, key };
}

function getResultColor(key) {
  return (
    {
      pss10_resultLow: "#3EC78C",
      pss10_resultModerate: "#F5820A",
      pss10_resultHigh: "#E84F6A",
    }[key] || "#4A7AB5"
  );
}

function GradientHeader({ title, onBack, insets, theme }) {
  return (
    <LinearGradient
      colors={[theme.accent, theme.accentDark ?? "#2D4A6E"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}
    >
      <TouchableOpacity onPress={onBack} style={ss.headerBtn}>
        <Text style={ss.headerBack}>‹</Text>
      </TouchableOpacity>
      <Text style={ss.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </LinearGradient>
  );
}

export default function StressScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const s = makeStyles(theme);

  const setAnswer = (q, value) =>
    setAnswers((prev) => ({ ...prev, [q]: value }));

  const allAnswered = QUESTIONS.every((q) => answers[q] !== undefined);
  const answeredCount = Object.keys(answers).length;
  const goBack = () =>
    navigation.canGoBack()
      ? navigation.goBack()
      : navigation.navigate("QuestionnaireHub");

  const submit = async () => {
    if (!allAnswered || saving) return;
    setSaving(true);
    try {
      const score = computeScore(answers);
      let saved = null;
      try {
        saved = await questionnairesApi.submit({
          type: "pss10",
          answers,
          scores: score,
        });
      } catch (e) {
        console.warn("[PSS-10] save failed:", e?.message ?? e);
      }
      setResult(saved?.scores ?? score);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      Alert.alert(t.error ?? "Error", e?.message ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
  };

  // ── RESULT ────────────────────────────────────────────────────────────
  if (result) {
    const color = getResultColor(result.key);
    const resultLabel = t[result.key] ?? result.key;

    return (
      <View style={s.safe}>
        <GradientHeader
          title={t.pss10_title ?? "Stress check-in"}
          onBack={goBack}
          insets={insets}
          theme={theme}
        />
        <ScrollView ref={scrollRef} contentContainerStyle={s.resultContainer}>
          <View
            style={[
              s.resultBadge,
              { borderColor: color, backgroundColor: color + "18" },
            ]}
          >
            <Ionicons name="pulse" size={52} color={color} />
          </View>
          <Text style={s.resultTitle}>{resultLabel}</Text>

          <View style={s.scoresRow}>
            <View style={[s.scoreCard, { borderColor: color }]}>
              <Text style={[s.scoreValue, { color }]}>{result.score}</Text>
              <Text style={s.scoreLabel}>
                {t.pss10_score ?? "Score"} / {result.max}
              </Text>
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />

          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: theme.accent }]}
            onPress={goBack}
          >
            <Text style={s.primaryBtnText}>{t.done ?? "Done"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={reset}>
            <Text style={[s.secondaryBtnText, { color: theme.accent }]}>
              {t.retake ?? "Retake"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── QUESTIONS ─────────────────────────────────────────────────────────
  return (
    <View style={s.safe}>
      <GradientHeader
        title={t.pss10_title ?? "Stress check-in"}
        onBack={goBack}
        insets={insets}
        theme={theme}
      />

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View
          style={[
            s.progressFill,
            {
              width: `${(answeredCount / QUESTIONS.length) * 100}%`,
              backgroundColor: theme.accent,
            },
          ]}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        <Text style={s.intro}>
          {t.pss10_intro ?? "Reflect on your past month."}
        </Text>

        {QUESTIONS.map((q) => {
          const qText = t[`pss10_q${q}`] ?? `Question ${q}`;
          const chosen = answers[q];
          return (
            <View key={q} style={s.qBlock}>
              <Text style={s.qNum}>{q}.</Text>
              <Text style={s.qText}>{qText}</Text>
              <View style={s.optRow}>
                {OPTIONS.map((opt) => {
                  const optLabel = t[`pss10_opt${opt}`] ?? String(opt);
                  const isActive = chosen === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        s.optBtn,
                        {
                          borderColor: isActive ? theme.accent : theme.border,
                          backgroundColor: isActive
                            ? theme.accent + "18"
                            : "transparent",
                        },
                      ]}
                      onPress={() => setAnswer(q, opt)}
                    >
                      <Text
                        style={[
                          s.optText,
                          {
                            color: isActive
                              ? theme.accent
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {optLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={[
            s.primaryBtn,
            {
              backgroundColor: allAnswered ? theme.accent : theme.border,
              marginTop: Spacing.lg,
            },
          ]}
          disabled={!allAnswered || saving}
          onPress={submit}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.primaryBtnText}>{t.save ?? "Save"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerBtn: { width: 40 },
  headerBack: { color: "#fff", fontSize: 28, lineHeight: 34 },
  headerTitle: {
    color: "#fff",
    fontSize: FontSize.lg,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
});

function makeStyles(theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.bg ?? "#F0F4F8",
    },
    progressTrack: {
      height: 4,
      backgroundColor: theme.border ?? "#e5e7eb",
    },
    progressFill: {
      height: 4,
    },
    intro: {
      fontSize: FontSize.sm,
      color: theme.textSecondary ?? "#475569",
      lineHeight: 21,
      marginBottom: Spacing.lg,
    },
    qBlock: {
      marginBottom: Spacing.lg,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border ?? "#e5e7eb",
    },
    qNum: {
      fontSize: FontSize.sm,
      fontWeight: "800",
      color: theme.accent,
      marginBottom: 4,
    },
    qText: {
      fontSize: FontSize.md,
      lineHeight: 22,
      color: theme.text ?? "#0f172a",
      marginBottom: Spacing.md,
    },
    optRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    optBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Radius.full ?? 999,
      borderWidth: 1.5,
    },
    optText: {
      fontSize: FontSize.sm,
      fontWeight: "600",
    },
    primaryBtn: {
      height: 50,
      borderRadius: Radius.md ?? 12,
      justifyContent: "center",
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    secondaryBtn: {
      height: 44,
      justifyContent: "center",
      alignItems: "center",
      marginTop: Spacing.sm,
    },
    secondaryBtnText: {
      fontSize: FontSize.md,
      fontWeight: "700",
    },
    resultContainer: {
      padding: Spacing.lg,
      paddingTop: Spacing.xl,
      alignItems: "stretch",
    },
    resultBadge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.lg,
      alignSelf: "center", // ← add
    },
    resultTitle: {
      fontSize: FontSize.xl,
      fontWeight: "800",
      color: theme.text ?? "#0f172a",
      textAlign: "center",
      marginBottom: Spacing.lg,
      alignSelf: "center", // ← add
    },
    scoresRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Spacing.md,
      marginBottom: Spacing.md,
      alignSelf: "center", // ← add
    },
    scoreCard: {
      borderWidth: 2,
      borderRadius: Radius.md ?? 12,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      alignItems: "center",
      minWidth: 140,
    },
    scoreValue: {
      fontSize: 36,
      fontWeight: "900",
    },
    scoreLabel: {
      fontSize: FontSize.xs,
      color: theme.textMuted ?? "#7a8a9b",
      marginTop: 4,
      textAlign: "center",
    },
  });
}
