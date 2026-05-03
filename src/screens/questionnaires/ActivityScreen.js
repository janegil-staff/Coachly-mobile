// src/screens/questionnaires/ActivityScreen.js
// Yearly International Physical Activity Questionnaire (IPAQ-SF).
// 7 numeric items. Output: MET-minutes/week + low/moderate/high classification.

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { questionnairesApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";

const FIELDS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"];

function computeScore(answers) {
  const v = (k) => Number(answers[k] || 0);
  const cap = (n) => Math.min(n, 180);

  const vDays = v("q1"), vMin = v("q2");
  const mDays = v("q3"), mMin = v("q4");
  const wDays = v("q5"), wMin = v("q6");

  const vigMET = 8.0 * cap(vMin) * vDays;
  const modMET = 4.0 * cap(mMin) * mDays;
  const walkMET = 3.3 * cap(wMin) * wDays;
  const total = vigMET + modMET + walkMET;
  const totalDays = vDays + mDays + wDays;

  let key;
  if ((vDays >= 3 && total >= 1500) || (totalDays >= 7 && total >= 3000)) {
    key = "ipaq_resultHigh";
  } else if (
    (vDays >= 3 && vMin >= 20) ||
    ((mDays + wDays) >= 5 && (mMin >= 30 || wMin >= 30)) ||
    (totalDays >= 5 && total >= 600)
  ) {
    key = "ipaq_resultModerate";
  } else {
    key = "ipaq_resultLow";
  }

  return { score: Math.round(total), max: null, key };
}

function isComplete(a) {
  return FIELDS.every((k) => a[k] != null && a[k] !== "");
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

export default function ActivityScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  // Prefill the answers from the latest submission on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await questionnairesApi.list({ type: "ipaq", limit: 1 });
        if (!alive) return;
        const last = Array.isArray(list) ? list[0] : null;
        if (last && last.answers && typeof last.answers === "object") {
          setAnswers(last.answers);
        }
      } catch (e) {
        console.warn("[ipaq] prefill fetch failed:", e?.message ?? e);
      }
    })();
    return () => { alive = false; };
  }, []);

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
          type: "ipaq",
          answers,
          scores: score,
        });
      } catch (e) {
        console.warn("[IPAQ] save failed:", e?.message ?? e);
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
    const colorMap = {
      ipaq_resultLow: "#E84F6A",
      ipaq_resultModerate: "#F5820A",
      ipaq_resultHigh: "#3EC78C",
    };
    const iconMap = {
      ipaq_resultLow: "walk-outline",
      ipaq_resultModerate: "bicycle-outline",
      ipaq_resultHigh: "fitness",
    };
    const color = colorMap[result.key] ?? "#4A7AB5";
    const icon = iconMap[result.key] ?? "fitness-outline";
    const resultLabel = t[result.key] ?? result.key;

    return (
      <View style={s.safe}>
        <GradientHeader
          title={t.ipaq_title ?? "Activity check-in"}
          onBack={goBack}
          insets={insets}
          theme={theme}
        />
        <ScrollView ref={scrollRef} contentContainerStyle={s.resultContainer}>
          <View style={[s.resultBadge, { borderColor: color, backgroundColor: color + "18" }]}>
            <Ionicons name={icon} size={52} color={color} />
          </View>
          <Text style={s.resultTitle}>{resultLabel}</Text>

          <View style={s.scoresRow}>
            <View style={[s.scoreCard, { borderColor: color }]}>
              <Text style={[s.scoreValue, { color }]}>{result.score}</Text>
              <Text style={s.scoreLabel}>
                {t.ipaq_metMinutes ?? "MET-minutes/week"}
              </Text>
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />

          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: theme.accent, alignSelf: "stretch" }]}
            onPress={goBack}
          >
            <Text style={s.primaryBtnText}>{t.done ?? "Done"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.secondaryBtn, { alignSelf: "stretch" }]}
            onPress={reset}
          >
            <Text style={[s.secondaryBtnText, { color: theme.accent }]}>
              {t.retake ?? "Retake"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── QUESTIONS ─────────────────────────────────────────────────────────
  const NumField = ({ qKey, qText, hint, placeholder, allowDecimal = false }) => (
    <View style={s.qBlock}>
      <Text style={s.qText}>{qText}</Text>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      <TextInput
        style={s.textInput}
        value={answers[qKey] != null ? String(answers[qKey]) : ""}
        onChangeText={(v) =>
          setAnswer(
            qKey,
            allowDecimal
              ? v.replace(/[^0-9.,]/g, "").replace(",", ".")
              : v.replace(/[^0-9]/g, "")
          )
        }
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={allowDecimal ? "decimal-pad" : "number-pad"}
      />
    </View>
  );

  return (
    <View style={s.safe}>
      <GradientHeader
        title={t.ipaq_title ?? "Activity check-in"}
        onBack={goBack}
        insets={insets}
        theme={theme}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>
        <Image
          source={require("../../../assets/images/questionary3.png")}
          style={s.heroImage}
          resizeMode="contain"
        />

        <Text style={s.intro}>
          {t.ipaq_intro ?? "Reflect on your activity over the past 7 days."}
        </Text>

        <NumField
          qKey="q1"
          qText={t.ipaq_q1 ?? "On how many days did you do vigorous activity?"}
          hint={t.ipaq_q1_hint ?? "Days per week (0–7)"}
          placeholder="3"
        />
        <NumField
          qKey="q2"
          qText={t.ipaq_q2 ?? "How much time per day on those days?"}
          hint={t.ipaq_q2_hint ?? "Minutes per day"}
          placeholder="30"
        />
        <NumField
          qKey="q3"
          qText={t.ipaq_q3 ?? "On how many days did you do moderate activity?"}
          hint={t.ipaq_q3_hint ?? "Days per week (0–7). Do not include walking."}
          placeholder="3"
        />
        <NumField
          qKey="q4"
          qText={t.ipaq_q4 ?? "How much time per day on those days?"}
          hint={t.ipaq_q4_hint ?? "Minutes per day"}
          placeholder="30"
        />
        <NumField
          qKey="q5"
          qText={t.ipaq_q5 ?? "On how many days did you walk for at least 10 minutes?"}
          hint={t.ipaq_q5_hint ?? "Days per week (0–7)"}
          placeholder="5"
        />
        <NumField
          qKey="q6"
          qText={t.ipaq_q6 ?? "How much time per day on those days?"}
          hint={t.ipaq_q6_hint ?? "Minutes per day"}
          placeholder="30"
        />
        <NumField
          qKey="q7"
          qText={t.ipaq_q7 ?? "How much time did you spend sitting on a weekday?"}
          hint={t.ipaq_q7_hint ?? "Hours per day"}
          placeholder="6"
          allowDecimal
        />

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
    safe: { flex: 1, backgroundColor: theme.bg ?? "#F0F4F8" },
    heroImage: {
      width: "100%",
      height: 180,
      marginBottom: Spacing.lg,
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
      alignSelf: "center",
    },
    resultTitle: {
      fontSize: FontSize.xl,
      fontWeight: "800",
      color: theme.text ?? "#0f172a",
      textAlign: "center",
      marginBottom: Spacing.lg,
      alignSelf: "center",
    },
    scoresRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Spacing.md,
      marginBottom: Spacing.md,
      alignSelf: "center",
    },
    scoreCard: {
      borderWidth: 2,
      borderRadius: Radius.md ?? 12,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      alignItems: "center",
      minWidth: 200,
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