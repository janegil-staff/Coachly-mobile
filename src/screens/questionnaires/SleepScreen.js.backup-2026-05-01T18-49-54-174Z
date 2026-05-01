// src/screens/questionnaires/SleepScreen.js
// Monthly Pittsburgh Sleep Quality Index (PSQI).
// 9 questions, several sub-parts. Computes 7 component scores → global 0-21.
// Score >5 = poor sleep.

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { questionnairesApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";

// Frequency options used across q5*, q7, q8 (0-3)
const FREQ_OPTS = [0, 1, 2, 3];

// q6 quality options
const QUALITY_OPTS = [0, 1, 2, 3];

// q9 problem options
const PROBLEM_OPTS = [0, 1, 2, 3];

// q5 sub-items (b through h — q5a is asked separately as part of the latency calc)
const Q5_SUBITEMS = ["a", "b", "c", "d", "e", "f", "g", "h"];

// ── Scoring (mirrors questionnaireScoring.js on the dashboard side) ──
function parseTime(t) {
  if (!t || typeof t !== "string") return null;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function bandLatency(minutes, q5a) {
  let mScore;
  if (minutes <= 15)      mScore = 0;
  else if (minutes <= 30) mScore = 1;
  else if (minutes <= 60) mScore = 2;
  else                    mScore = 3;
  const sum = mScore + Number(q5a || 0);
  if (sum === 0) return 0;
  if (sum <= 2)  return 1;
  if (sum <= 4)  return 2;
  return 3;
}

function bandDuration(hours) {
  if (hours > 7)  return 0;
  if (hours > 6)  return 1;
  if (hours >= 5) return 2;
  return 3;
}

function bandEfficiency(hoursAsleep, hoursInBed) {
  if (!hoursInBed || hoursInBed <= 0) return 0;
  const pct = (hoursAsleep / hoursInBed) * 100;
  if (pct >= 85) return 0;
  if (pct >= 75) return 1;
  if (pct >= 65) return 2;
  return 3;
}

function bandDisturbances(items) {
  const sum = items.reduce((a, b) => a + Number(b || 0), 0);
  if (sum === 0)  return 0;
  if (sum <= 9)   return 1;
  if (sum <= 18)  return 2;
  return 3;
}

function bandDaytimeDysfunction(q8, q9) {
  const sum = Number(q8 || 0) + Number(q9 || 0);
  if (sum === 0) return 0;
  if (sum <= 2)  return 1;
  if (sum <= 4)  return 2;
  return 3;
}

function computeScore(answers) {
  // answers expected:
  //   q1: "23:00"  q2: number(min)   q3: "07:00"  q4: number(hours)
  //   q5a..q5h: 0-3 each   q6: 0-3   q7: 0-3   q8: 0-3   q9: 0-3
  const c1 = Number(answers.q6 || 0);
  const c2 = bandLatency(Number(answers.q2 || 0), answers.q5a);
  const c3 = bandDuration(Number(answers.q4 || 0));

  const bedTime = parseTime(answers.q1);
  const wakeTime = parseTime(answers.q3);
  let timeInBedHrs = 0;
  if (bedTime != null && wakeTime != null) {
    let diff = wakeTime - bedTime;
    if (diff < 0) diff += 24 * 60;
    timeInBedHrs = diff / 60;
  }
  const c4 = bandEfficiency(Number(answers.q4 || 0), timeInBedHrs);

  const c5 = bandDisturbances(
    Q5_SUBITEMS.slice(1).map((s) => answers[`q5${s}`])
  );

  const c6 = Number(answers.q7 || 0);
  const c7 = bandDaytimeDysfunction(answers.q8, answers.q9);

  const total = c1 + c2 + c3 + c4 + c5 + c6 + c7;
  const key = total > 5 ? "psqi_resultPoor" : "psqi_resultGood";
  return { score: total, max: 21, key, components: { c1, c2, c3, c4, c5, c6, c7 } };
}

// Did the user fill everything we need?
function isComplete(a) {
  if (!a.q1 || !parseTime(a.q1)) return false;
  if (a.q2 == null || a.q2 === "") return false;
  if (!a.q3 || !parseTime(a.q3)) return false;
  if (a.q4 == null || a.q4 === "") return false;
  for (const s of Q5_SUBITEMS) if (a[`q5${s}`] === undefined) return false;
  if (a.q6 === undefined) return false;
  if (a.q7 === undefined) return false;
  if (a.q8 === undefined) return false;
  if (a.q9 === undefined) return false;
  return true;
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

export default function SleepScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const s = makeStyles(theme);

  const setAnswer = (k, v) => setAnswers((prev) => ({ ...prev, [k]: v }));
  const goBack = () =>
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate("QuestionnaireHub");
  const allAnswered = isComplete(answers);

  const submit = async () => {
    if (!allAnswered || saving) return;
    setSaving(true);
    try {
      const score = computeScore(answers);
      let saved = null;
      try {
        saved = await questionnairesApi.submit({
          type: "psqi",
          answers,
          scores: score,
        });
      } catch (e) {
        console.warn("[PSQI] save failed:", e?.message ?? e);
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

  // Helpers for rendering the various option groups
  const FreqOptions = ({ qKey }) => (
    <View style={s.optRow}>
      {FREQ_OPTS.map((opt) => {
        const isActive = answers[qKey] === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              s.optBtn,
              {
                borderColor: isActive ? theme.accent : theme.border,
                backgroundColor: isActive ? theme.accent + "18" : "transparent",
              },
            ]}
            onPress={() => setAnswer(qKey, opt)}
          >
            <Text
              style={[
                s.optText,
                { color: isActive ? theme.accent : theme.textSecondary },
              ]}
            >
              {t[`psqi_freq${opt}`] ?? String(opt)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── RESULT ────────────────────────────────────────────────────────────
  if (result) {
    const isPoor = result.key === "psqi_resultPoor";
    const color = isPoor ? "#E84F6A" : "#3EC78C";
    const resultLabel = t[result.key] ?? result.key;

    return (
      <View style={s.safe}>
        <GradientHeader
          title={t.psqi_title ?? "Sleep quality"}
          onBack={goBack}
          insets={insets}
          theme={theme}
        />
        <ScrollView ref={scrollRef} contentContainerStyle={s.resultContainer}>
          <View style={[s.resultBadge, { borderColor: color, backgroundColor: color + "18" }]}>
            <Ionicons name={isPoor ? "moon" : "moon-outline"} size={52} color={color} />
          </View>
          <Text style={s.resultTitle}>{resultLabel}</Text>

          <View style={s.scoresRow}>
            <View style={[s.scoreCard, { borderColor: color }]}>
              <Text style={[s.scoreValue, { color }]}>{result.score}</Text>
              <Text style={s.scoreLabel}>
                {t.psqi_score ?? "Score"} / {result.max}
              </Text>
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />

          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: theme.accent }]} onPress={goBack}>
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
        title={t.psqi_title ?? "Sleep quality"}
        onBack={goBack}
        insets={insets}
        theme={theme}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>
        <Text style={s.intro}>
          {t.psqi_intro ?? "Reflect on your sleep over the past month."}
        </Text>

        {/* Q1 - bedtime */}
        <View style={s.qBlock}>
          <Text style={s.qText}>{t.psqi_q1 ?? "What time have you usually gone to bed?"}</Text>
          <Text style={s.hint}>{t.psqi_q1_hint ?? "Bedtime (e.g. 23:00)"}</Text>
          <TextInput
            style={s.textInput}
            value={answers.q1 ?? ""}
            onChangeText={(v) => setAnswer("q1", v)}
            placeholder="23:00"
            placeholderTextColor={theme.textMuted}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Q2 - latency in minutes */}
        <View style={s.qBlock}>
          <Text style={s.qText}>{t.psqi_q2 ?? "How long does it usually take you to fall asleep?"}</Text>
          <Text style={s.hint}>{t.psqi_q2_hint ?? "In minutes"}</Text>
          <TextInput
            style={s.textInput}
            value={answers.q2 != null ? String(answers.q2) : ""}
            onChangeText={(v) => setAnswer("q2", v.replace(/[^0-9]/g, ""))}
            placeholder="20"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
          />
        </View>

        {/* Q3 - wake time */}
        <View style={s.qBlock}>
          <Text style={s.qText}>{t.psqi_q3 ?? "What time have you usually gotten up?"}</Text>
          <Text style={s.hint}>{t.psqi_q3_hint ?? "Wake time (e.g. 07:00)"}</Text>
          <TextInput
            style={s.textInput}
            value={answers.q3 ?? ""}
            onChangeText={(v) => setAnswer("q3", v)}
            placeholder="07:00"
            placeholderTextColor={theme.textMuted}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Q4 - hours of sleep */}
        <View style={s.qBlock}>
          <Text style={s.qText}>{t.psqi_q4 ?? "How many hours of actual sleep did you get?"}</Text>
          <Text style={s.hint}>{t.psqi_q4_hint ?? "Hours of sleep, not time in bed"}</Text>
          <TextInput
            style={s.textInput}
            value={answers.q4 != null ? String(answers.q4) : ""}
            onChangeText={(v) => setAnswer("q4", v.replace(/[^0-9.,]/g, "").replace(",", "."))}
            placeholder="7"
            placeholderTextColor={theme.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Q5 - 8 sub-items */}
        <View style={s.qBlock}>
          <Text style={[s.qText, { marginBottom: Spacing.sm }]}>
            {t.psqi_q5_title ?? "How often have you had trouble sleeping because of..."}
          </Text>
          {Q5_SUBITEMS.map((sub) => (
            <View key={sub} style={s.subBlock}>
              <Text style={s.subText}>{t[`psqi_q5${sub}`] ?? sub}</Text>
              <FreqOptions qKey={`q5${sub}`} />
            </View>
          ))}
        </View>

        {/* Q6 - overall quality */}
        <View style={s.qBlock}>
          <Text style={s.qText}>{t.psqi_q6 ?? "How would you rate your sleep quality overall?"}</Text>
          <View style={s.optRow}>
            {QUALITY_OPTS.map((opt) => {
              const isActive = answers.q6 === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    s.optBtn,
                    {
                      borderColor: isActive ? theme.accent : theme.border,
                      backgroundColor: isActive ? theme.accent + "18" : "transparent",
                    },
                  ]}
                  onPress={() => setAnswer("q6", opt)}
                >
                  <Text style={[s.optText, { color: isActive ? theme.accent : theme.textSecondary }]}>
                    {t[`psqi_quality${opt}`] ?? String(opt)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Q7 - medication frequency */}
        <View style={s.qBlock}>
          <Text style={s.qText}>{t.psqi_q7 ?? "How often have you taken medicine to help you sleep?"}</Text>
          <FreqOptions qKey="q7" />
        </View>

        {/* Q8 - daytime sleepiness */}
        <View style={s.qBlock}>
          <Text style={s.qText}>{t.psqi_q8 ?? "How often have you had trouble staying awake?"}</Text>
          <FreqOptions qKey="q8" />
        </View>

        {/* Q9 - enthusiasm problem */}
        <View style={s.qBlock}>
          <Text style={s.qText}>{t.psqi_q9 ?? "How much of a problem has it been to keep up enthusiasm?"}</Text>
          <View style={s.optRow}>
            {PROBLEM_OPTS.map((opt) => {
              const isActive = answers.q9 === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    s.optBtn,
                    {
                      borderColor: isActive ? theme.accent : theme.border,
                      backgroundColor: isActive ? theme.accent + "18" : "transparent",
                    },
                  ]}
                  onPress={() => setAnswer("q9", opt)}
                >
                  <Text style={[s.optText, { color: isActive ? theme.accent : theme.textSecondary }]}>
                    {t[`psqi_problem${opt}`] ?? String(opt)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
  headerTitle: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700", flex: 1, textAlign: "center" },
});

function makeStyles(theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.bg ?? "#F0F4F8",
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
    qText: {
      fontSize: FontSize.md,
      lineHeight: 22,
      fontWeight: "600",
      color: theme.text ?? "#0f172a",
      marginBottom: 4,
    },
    hint: {
      fontSize: FontSize.xs,
      color: theme.textMuted ?? "#7a8a9b",
      marginBottom: Spacing.sm,
      fontStyle: "italic",
    },
    subBlock: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.bg ?? "#f0f4f8",
    },
    subText: {
      fontSize: FontSize.sm,
      color: theme.textSecondary ?? "#475569",
      marginBottom: 6,
    },
    textInput: {
      borderWidth: 1.5,
      borderColor: theme.border ?? "#e5e7eb",
      borderRadius: Radius.md ?? 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      fontSize: FontSize.md,
      color: theme.text ?? "#0f172a",
      backgroundColor: theme.surface ?? "#fff",
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
      alignItems: "center",
    },
    resultBadge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.lg,
    },
    resultTitle: {
      fontSize: FontSize.xl,
      fontWeight: "800",
      color: theme.text ?? "#0f172a",
      textAlign: "center",
      marginBottom: Spacing.lg,
    },
    scoresRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Spacing.md,
      marginBottom: Spacing.md,
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
