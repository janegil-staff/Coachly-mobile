// src/screens/questionnaires/HooperScreen.js
// Hooper Index: 4 items rated 1-7. All on one screen.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { questionnairesApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";

// One scale per question. min-max labels differ per item.
const QUESTIONS = [
  { id: 0, qKey: "hooperQSleep",    lowKey: "hooperScale1",         highKey: "hooperScale7" },
  { id: 1, qKey: "hooperQFatigue",  lowKey: "hooperScaleFatigue1",  highKey: "hooperScaleFatigue7" },
  { id: 2, qKey: "hooperQStress",   lowKey: "hooperScaleStress1",   highKey: "hooperScaleStress7" },
  { id: 3, qKey: "hooperQSoreness", lowKey: "hooperScaleSoreness1", highKey: "hooperScaleSoreness7" },
];

function Scale({ value, onChange, color }) {
  return (
    <View style={scaleStyles.row}>
      {[1, 2, 3, 4, 5, 6, 7].map((n) => {
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
            <Text style={[scaleStyles.pillText, active && { color: "#fff", fontWeight: "800" }]}>
              {n}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const scaleStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 6, marginTop: 8 },
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

export default function HooperScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent ?? "#4A7AB5";

  const [answers, setAnswers] = useState([null, null, null, null]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const setAnswer = (id, val) =>
    setAnswers((prev) => prev.map((a, i) => (i === id ? val : a)));

  const allAnswered = answers.every((a) => typeof a === "number");

  const submit = async () => {
    if (!allAnswered || saving) return;
    setSaving(true);
    try {
      const doc = await questionnairesApi.submit({ type: "hooper", answers });
      setResult(doc);
    } catch (e) {
      Alert.alert("Error", e?.message ?? "Could not save check-in.");
    } finally {
      setSaving(false);
    }
  };

  const s = makeStyles(theme);

  if (result) {
    const statusKey = "hooperStatus_" + (result.scores?.status ?? "normal");
    return (
      <View style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
        <View style={[s.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: PRIMARY }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t.hooperTitle ?? "Daily Check-in"}</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={{ flex: 1, padding: Spacing.lg, justifyContent: "center" }}>
          <View style={s.resultCard}>
            <Ionicons name="checkmark-circle" size={56} color={PRIMARY} style={{ alignSelf: "center" }} />
            <Text style={s.resultTitle}>{t.hooperDone ?? "Done!"}</Text>
            <Text style={s.resultLabel}>{t.hooperResult ?? "Your score"}</Text>
            <Text style={[s.resultScore, { color: PRIMARY }]}>{result.scores?.total ?? "—"} / 28</Text>
            <Text style={s.resultStatus}>{t[statusKey] ?? ""}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[s.saveBtn, { backgroundColor: PRIMARY, marginTop: Spacing.xl }]}
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
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: PRIMARY }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.hooperTitle ?? "Daily Check-in"}</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>
        {QUESTIONS.map((q) => (
          <View key={q.id} style={s.qCard}>
            <Text style={s.qText}>{t[q.qKey]}</Text>
            <Scale value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} color={PRIMARY} />
            <View style={s.scaleLabels}>
              <Text style={s.scaleLabel}>{t[q.lowKey]}</Text>
              <Text style={s.scaleLabel}>{t[q.highKey]}</Text>
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
            <Text style={s.saveBtnText}>{t.hooperSave ?? "SAVE CHECK-IN"}</Text>
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
    qText: { color: theme.text, fontSize: FontSize.md, fontWeight: "600", lineHeight: 22 },
    scaleLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    scaleLabel: { fontSize: FontSize.xs, color: theme.textMuted },
    saveBtn: {
      height: 56,
      borderRadius: Radius.md,
      justifyContent: "center",
      alignItems: "center",
      marginTop: Spacing.md,
    },
    saveBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "800", letterSpacing: 2 },
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
    resultLabel: { color: theme.textMuted, fontSize: FontSize.sm, marginTop: Spacing.lg },
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
