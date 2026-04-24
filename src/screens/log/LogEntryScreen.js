// src/screens/log/LogEntryScreen.js
// 4-step wizard: Rest toggle → Workouts (multi) → Ratings → Notes + review.

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize, Spacing, Radius } from "../../constants/theme";
import Rating from "../../components/Rating";
import { computeDailyScore, scoreColor } from "../../utils/score";

const WORKOUT_TYPES = ["strength", "cardio", "mobility", "recovery", "other"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function LogEntryScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const s = makeStyles(theme);

  const [step, setStep] = useState(1);

  // Form state
  const [isRestDay, setIsRestDay] = useState(false);
  // workouts: [{ type: "strength", durationMinutes: 30 }, ...]
  const [workouts, setWorkouts] = useState([]);
  const [effort, setEffort] = useState(3);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const totalSteps = isRestDay ? 3 : 4;
  const displayStep = isRestDay ? (step === 1 ? 1 : step - 1) : step;

  const totalDuration = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

  const score = useMemo(
    () => computeDailyScore({ isRestDay, effort, mood, energy }),
    [isRestDay, effort, mood, energy]
  );

  const hasWorkout = (type) => workouts.some((w) => w.type === type);

  const toggleWorkout = (type) => {
    if (hasWorkout(type)) {
      setWorkouts(workouts.filter((w) => w.type !== type));
    } else {
      setWorkouts([...workouts, { type, durationMinutes: 30 }]);
    }
  };

  const updateDuration = (type, durationMinutes) => {
    setWorkouts(
      workouts.map((w) => (w.type === type ? { ...w, durationMinutes } : w))
    );
  };

  const canGoNext = () => {
    if (step === 2) {
      return workouts.length > 0 && workouts.every((w) => w.durationMinutes > 0);
    }
    return true;
  };

  const goNext = () => {
    if (step === 1 && isRestDay) {
      setStep(3);
    } else if (step < 4) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step === 3 && isRestDay) {
      setStep(1);
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const save = async () => {
    setSaving(true);
    const entry = {
      date: today(),
      isRestDay,
      workouts: isRestDay ? [] : workouts,
      totalDuration: isRestDay ? 0 : totalDuration,
      effort: isRestDay ? null : effort,
      mood,
      energy,
      sleep,
      soreness,
      notes: notes.trim(),
      score,
    };
    try {
      // TODO: wire to backend
      Alert.alert("Saved", `Today's score: ${score ?? "–"}`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Error", e?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const workoutLabel = (type) =>
    t[`category${type.charAt(0).toUpperCase() + type.slice(1)}`] ?? type;

  return (
    <View style={[s.bg, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} hitSlop={16} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {displayStep}/{totalSteps} · {t.logEntryTitle ?? "Log training"}
        </Text>
        <View style={s.backBtn} />
      </View>

      {/* Progress */}
      <View style={s.progressTrack}>
        <View
          style={[
            s.progressFill,
            {
              width: `${(displayStep / totalSteps) * 100}%`,
              backgroundColor: theme.accent,
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1 — Rest day toggle */}
          {step === 1 && (
            <>
              <Text style={s.stepTitle}>Today was a…</Text>
              <View style={s.choiceRow}>
                <TouchableOpacity
                  style={[
                    s.choiceCard,
                    !isRestDay && { borderColor: theme.accent, backgroundColor: theme.accentBg },
                  ]}
                  onPress={() => setIsRestDay(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="barbell-outline"
                    size={44}
                    color={!isRestDay ? theme.accent : theme.textMuted}
                  />
                  <Text
                    style={[
                      s.choiceLabel,
                      { color: !isRestDay ? theme.accent : theme.textSecondary },
                    ]}
                  >
                    Training day
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.choiceCard,
                    isRestDay && { borderColor: theme.accent, backgroundColor: theme.accentBg },
                  ]}
                  onPress={() => setIsRestDay(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="bed-outline"
                    size={44}
                    color={isRestDay ? theme.accent : theme.textMuted}
                  />
                  <Text
                    style={[
                      s.choiceLabel,
                      { color: isRestDay ? theme.accent : theme.textSecondary },
                    ]}
                  >
                    Rest day
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 2 — Workouts (multi-select + per-item duration) */}
          {step === 2 && !isRestDay && (
            <>
              <Text style={s.stepTitle}>{t.workouts ?? "Workouts"}</Text>
              <Text style={s.stepHint}>Tap to add or remove. Set duration for each.</Text>

              <View style={s.typeRow}>
                {WORKOUT_TYPES.map((type) => {
                  const active = hasWorkout(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        s.typeChip,
                        active && { backgroundColor: theme.accent, borderColor: theme.accent },
                      ]}
                      onPress={() => toggleWorkout(type)}
                      activeOpacity={0.8}
                    >
                      {active && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color="#fff"
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          s.typeChipText,
                          { color: active ? "#fff" : theme.text },
                        ]}
                      >
                        {workoutLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Per-workout duration cards */}
              {workouts.map((w) => (
                <View key={w.type} style={s.workoutCard}>
                  <View style={s.workoutCardHeader}>
                    <Text style={s.workoutCardTitle}>{workoutLabel(w.type)}</Text>
                    <TouchableOpacity
                      onPress={() => toggleWorkout(w.type)}
                      hitSlop={12}
                    >
                      <Ionicons name="close-circle" size={22} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={s.durationRow}>
                    <TouchableOpacity
                      style={s.durationBtn}
                      onPress={() =>
                        updateDuration(w.type, Math.max(5, w.durationMinutes - 5))
                      }
                    >
                      <Ionicons name="remove" size={22} color={theme.accent} />
                    </TouchableOpacity>
                    <Text style={s.durationValue}>{w.durationMinutes}</Text>
                    <TouchableOpacity
                      style={s.durationBtn}
                      onPress={() =>
                        updateDuration(w.type, Math.min(300, w.durationMinutes + 5))
                      }
                    >
                      <Ionicons name="add" size={22} color={theme.accent} />
                    </TouchableOpacity>
                  </View>

                  <View style={s.presets}>
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        style={[
                          s.presetChip,
                          w.durationMinutes === mins && {
                            backgroundColor: theme.accent,
                            borderColor: theme.accent,
                          },
                        ]}
                        onPress={() => updateDuration(w.type, mins)}
                      >
                        <Text
                          style={[
                            s.presetText,
                            {
                              color:
                                w.durationMinutes === mins
                                  ? "#fff"
                                  : theme.textSecondary,
                            },
                          ]}
                        >
                          {mins}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {workouts.length > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Total</Text>
                  <Text style={s.totalValue}>{totalDuration} min</Text>
                </View>
              )}

              {workouts.length === 0 && (
                <View style={s.emptyHint}>
                  <Text style={s.emptyHintText}>
                    Pick at least one workout above.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Step 3 — Ratings */}
          {step === 3 && (
            <>
              <View style={[s.scorePreview, { borderColor: scoreColor(score, theme) }]}>
                <Text style={s.scoreLabel}>Today's score</Text>
                <Text style={[s.scoreValue, { color: scoreColor(score, theme) }]}>
                  {score ?? "–"}
                </Text>
              </View>

              {!isRestDay && (
                <Rating
                  label={t.effort ?? "Effort"}
                  value={effort}
                  onChange={setEffort}
                  leftLabel="Very light"
                  rightLabel="Very hard"
                />
              )}
              <Rating
                label={t.mood ?? "Mood"}
                value={mood}
                onChange={setMood}
                leftLabel="Bad"
                rightLabel="Great"
              />
              <Rating
                label={t.energy ?? "Energy"}
                value={energy}
                onChange={setEnergy}
                leftLabel="Exhausted"
                rightLabel="Energized"
              />
              <Rating
                label="Sleep (last night)"
                value={sleep}
                onChange={setSleep}
                leftLabel="Poor"
                rightLabel="Excellent"
              />
              <Rating
                label="Soreness"
                value={soreness}
                onChange={setSoreness}
                leftLabel="None"
                rightLabel="Very sore"
              />
            </>
          )}

          {/* Step 4 — Notes + review */}
          {step === 4 && (
            <>
              <Text style={s.stepTitle}>{t.notes ?? "Notes"}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="How was it? Anything to remember?"
                placeholderTextColor={theme.textMuted}
                style={s.notesInput}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <View style={s.summaryCard}>
                <Text style={s.summaryTitle}>Summary</Text>
                <SummaryRow label="Date" value={today()} theme={theme} />
                <SummaryRow
                  label="Type"
                  value={isRestDay ? "Rest day" : "Training"}
                  theme={theme}
                />
                {!isRestDay && workouts.map((w) => (
                  <SummaryRow
                    key={w.type}
                    label={workoutLabel(w.type)}
                    value={`${w.durationMinutes} min`}
                    theme={theme}
                  />
                ))}
                {!isRestDay && workouts.length > 0 && (
                  <>
                    <View style={s.summaryDivider} />
                    <SummaryRow
                      label="Total"
                      value={`${totalDuration} min`}
                      theme={theme}
                      bold
                    />
                    <SummaryRow label="Effort" value={effort} theme={theme} />
                  </>
                )}
                <SummaryRow label="Mood" value={mood} theme={theme} />
                <SummaryRow label="Energy" value={energy} theme={theme} />
                <SummaryRow label="Sleep" value={sleep} theme={theme} />
                <SummaryRow label="Soreness" value={soreness} theme={theme} />
                <View style={s.summaryDivider} />
                <SummaryRow
                  label="Score"
                  value={score ?? "–"}
                  valueColor={scoreColor(score, theme)}
                  theme={theme}
                  bold
                />
              </View>
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step < 4 ? (
          <TouchableOpacity
            style={[s.primaryBtn, !canGoNext() && s.primaryBtnDisabled]}
            onPress={canGoNext() ? goNext : undefined}
            activeOpacity={canGoNext() ? 0.85 : 1}
          >
            <Text style={s.primaryBtnText}>{t.continue ?? "Continue"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.primaryBtn, saving && s.primaryBtnDisabled]}
            onPress={!saving ? save : undefined}
            activeOpacity={saving ? 1 : 0.85}
          >
            <Text style={s.primaryBtnText}>
              {saving ? "Saving…" : (t.save ?? "Save")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SummaryRow({ label, value, valueColor, bold, theme }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ color: theme.textSecondary, fontSize: FontSize.md }}>{label}</Text>
      <Text
        style={{
          color: valueColor ?? theme.text,
          fontSize: FontSize.md,
          fontWeight: bold ? "800" : "600",
        }}
      >
        {String(value)}
      </Text>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    bg: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      height: 52,
    },
    backBtn: { width: 44, padding: 8 },
    headerTitle: { color: theme.text, fontSize: FontSize.md, fontWeight: "600" },
    progressTrack: { height: 3, backgroundColor: theme.border },
    progressFill: { height: "100%" },
    scroll: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    stepTitle: {
      color: theme.text,
      fontSize: FontSize.lg,
      fontWeight: "700",
      marginBottom: 4,
    },
    stepHint: {
      color: theme.textSecondary,
      fontSize: FontSize.sm,
      marginBottom: Spacing.md,
    },

    choiceRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
    choiceCard: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: Radius.lg,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
    },
    choiceLabel: { fontSize: FontSize.md, fontWeight: "700" },

    typeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: Spacing.md,
    },
    typeChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: Radius.full,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    typeChipText: { fontSize: FontSize.sm, fontWeight: "600" },

    workoutCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    workoutCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    workoutCardTitle: {
      color: theme.text,
      fontSize: FontSize.md,
      fontWeight: "700",
    },

    durationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xl,
      marginVertical: Spacing.sm,
    },
    durationBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    durationValue: {
      color: theme.accent,
      fontSize: FontSize.xxxl,
      fontWeight: "800",
      minWidth: 70,
      textAlign: "center",
    },
    presets: {
      flexDirection: "row",
      gap: 6,
      justifyContent: "center",
      marginTop: Spacing.sm,
    },
    presetChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    presetText: { fontSize: FontSize.xs, fontWeight: "600" },

    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    totalLabel: {
      color: theme.textSecondary,
      fontSize: FontSize.md,
      fontWeight: "600",
    },
    totalValue: {
      color: theme.accent,
      fontSize: FontSize.xl,
      fontWeight: "800",
    },

    emptyHint: {
      padding: Spacing.lg,
      alignItems: "center",
    },
    emptyHintText: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
    },

    scorePreview: {
      alignItems: "center",
      paddingVertical: Spacing.lg,
      marginBottom: Spacing.lg,
      borderRadius: Radius.lg,
      borderWidth: 2,
      backgroundColor: theme.surface,
    },
    scoreLabel: {
      color: theme.textSecondary,
      fontSize: FontSize.sm,
      fontWeight: "600",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    scoreValue: { fontSize: 56, fontWeight: "900", marginTop: 4 },

    notesInput: {
      minHeight: 120,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: Radius.md,
      padding: Spacing.md,
      color: theme.text,
      fontSize: FontSize.md,
      backgroundColor: theme.surface,
      marginBottom: Spacing.lg,
    },

    summaryCard: {
      backgroundColor: theme.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
    },
    summaryTitle: {
      color: theme.text,
      fontSize: FontSize.md,
      fontWeight: "700",
      marginBottom: Spacing.sm,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.sm,
    },

    footer: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      backgroundColor: theme.bg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    primaryBtn: {
      height: 52,
      borderRadius: Radius.md,
      backgroundColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnDisabled: { opacity: 0.4 },
    primaryBtnText: {
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
  });
}
