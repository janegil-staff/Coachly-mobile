// src/screens/questionnaires/RestqScreen.js
// RESTQ-Sport-36 — placeholder items. 36 questions, 4 per page.

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

const TOTAL = 36;
const PER_PAGE = 4;
const PAGES = Math.ceil(TOTAL / PER_PAGE);

function LikertRow({ value, onChange, color, t }) {
  const labels = [
    t.restqScale0 ?? "Never",
    t.restqScale1 ?? "Seldom",
    t.restqScale2 ?? "Sometimes",
    t.restqScale3 ?? "Often",
    t.restqScale4 ?? "More often",
    t.restqScale5 ?? "Very often",
    t.restqScale6 ?? "Always",
  ];
  return (
    <View style={likertStyles.wrap}>
      <View style={likertStyles.row}>
        {[0, 1, 2, 3, 4, 5, 6].map((n) => {
          const active = value === n;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => onChange(n)}
              style={[
                likertStyles.pill,
                active && { backgroundColor: color, borderColor: color },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  likertStyles.pillText,
                  active && { color: "#fff", fontWeight: "800" },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={likertStyles.labelRow}>
        <Text style={likertStyles.label}>{labels[0]}</Text>
        <Text style={likertStyles.label}>{labels[6]}</Text>
      </View>
    </View>
  );
}

const likertStyles = StyleSheet.create({
  wrap: { marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  pill: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#c5d8ee",
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 14, fontWeight: "600", color: "#666" },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  label: { fontSize: 11, color: "#888" },
});

export default function RestqScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent ?? "#4A7AB5";

  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState(Array(TOTAL).fill(null));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const setAnswer = (idx, val) =>
    setAnswers((prev) => prev.map((a, i) => (i === idx ? val : a)));

  const pageStart = page * PER_PAGE;
  const pageEnd = Math.min(pageStart + PER_PAGE, TOTAL);
  const pageAnswers = answers.slice(pageStart, pageEnd);
  const pageComplete = pageAnswers.every((a) => typeof a === "number");
  const allComplete = answers.every((a) => typeof a === "number");

  const submit = async () => {
    if (!allComplete || saving) return;
    setSaving(true);
    try {
      const doc = await questionnairesApi.submit({ type: "restq", answers });
      setResult(doc);
    } catch (e) {
      Alert.alert("Error", e?.message ?? "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const s = makeStyles(theme);

  if (result) {
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
          <Text style={s.headerTitle}>{t.restqTitle ?? "Recovery-Stress"}</Text>
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
            <Text style={s.resultTitle}>{t.restqSaved ?? "Saved"}</Text>
            <View
              style={{
                flexDirection: "row",
                gap: 24,
                marginTop: Spacing.xl,
                justifyContent: "center",
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={s.resultLabel}>{t.restqStress ?? "Stress"}</Text>
                <Text style={[s.resultScore, { color: "#DC2626" }]}>
                  {result.scores?.stress ?? "—"}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={s.resultLabel}>
                  {t.restqRecovery ?? "Recovery"}
                </Text>
                <Text style={[s.resultScore, { color: "#16A34A" }]}>
                  {result.scores?.recovery ?? "—"}
                </Text>
              </View>
            </View>
            <Text style={s.resultLabel}>{t.restqBalance ?? "Balance"}</Text>
            <Text style={[s.resultScore, { color: PRIMARY }]}>
              {result.scores?.balance >= 0 ? "+" : ""}
              {result.scores?.balance ?? "—"}
            </Text>
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
        <Text style={s.headerTitle}>{t.restqTitle ?? "Recovery-Stress"}</Text>
        <View style={s.headerBtn} />
      </View>

      <View style={s.progressBar}>
        <View
          style={[
            s.progressFill,
            {
              backgroundColor: PRIMARY,
              width: ((page + 1) / PAGES) * 100 + "%",
            },
          ]}
        />
      </View>
      <Text style={s.progressText}>
        {(t.restqPage ?? "Question") +
          " " +
          (pageStart + 1) +
          "–" +
          pageEnd +
          " " +
          (t.restqOf ?? "of") +
          " " +
          TOTAL}
      </Text>

      <ScrollView
        key={page}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        {answers.slice(pageStart, pageEnd).map((val, localIdx) => {
          const globalIdx = pageStart + localIdx;
          const itemKey = "restq_item_" + (globalIdx + 1);
          return (
            <View key={globalIdx} style={s.qCard}>
              <Text style={s.qNum}>{globalIdx + 1}.</Text>
              <Text style={s.qText}>
                {t[itemKey] ?? "Item " + (globalIdx + 1)}
              </Text>
              <LikertRow
                value={val}
                onChange={(v) => setAnswer(globalIdx, v)}
                color={PRIMARY}
                t={t}
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          style={[
            s.navBtn,
            { borderColor: PRIMARY },
            page === 0 && { opacity: 0.3 },
          ]}
        >
          <Text style={[s.navBtnText, { color: PRIMARY }]}>
            {t.restqPrev ?? "BACK"}
          </Text>
        </TouchableOpacity>
        {page < PAGES - 1 ? (
          <TouchableOpacity
            onPress={() => setPage((p) => Math.min(PAGES - 1, p + 1))}
            disabled={!pageComplete}
            style={[
              s.navBtn,
              { backgroundColor: PRIMARY, borderColor: PRIMARY },
              !pageComplete && { opacity: 0.4 },
            ]}
          >
            <Text style={[s.navBtnText, { color: "#fff" }]}>
              {t.restqNext ?? "NEXT"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={submit}
            disabled={!allComplete || saving}
            style={[
              s.navBtn,
              { backgroundColor: PRIMARY, borderColor: PRIMARY },
              (!allComplete || saving) && { opacity: 0.4 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[s.navBtnText, { color: "#fff" }]}>
                {t.restqSubmit ?? "SUBMIT"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    progressBar: {
      height: 3,
      backgroundColor: "#e8eef5",
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 2 },
    progressText: {
      textAlign: "center",
      fontSize: FontSize.xs,
      color: theme.textMuted,
      marginTop: 6,
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
    qNum: {
      color: theme.accent,
      fontSize: FontSize.xs,
      fontWeight: "800",
      marginBottom: 4,
    },
    qText: {
      color: theme.text,
      fontSize: FontSize.md,
      fontWeight: "500",
      lineHeight: 22,
    },
    footer: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: Spacing.lg,
      paddingTop: 12,
      backgroundColor: theme.bg ?? "#fff",
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    navBtn: {
      flex: 1,
      height: 50,
      borderRadius: Radius.md,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    resultContainer: {
      padding: Spacing.lg,
      paddingTop: Spacing.xl,
      alignItems: "center", // ← change to "stretch"
    },
    navBtnText: {
      fontSize: FontSize.md,
      fontWeight: "800",
      letterSpacing: 1.5,
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
      marginTop: Spacing.md,
    },
    resultScore: { fontSize: 36, fontWeight: "900", marginTop: 4 },
    saveBtn: {
      height: 56,
      borderRadius: Radius.md,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    saveBtnText: {
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "800",
      letterSpacing: 2,
    },
  });
}
