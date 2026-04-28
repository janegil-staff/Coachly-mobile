// src/screens/log/LogEntryScreen.js
// 6-step wizard:
//   Step 1: Rest day toggle
//   Step 2: Ratings
//   Step 3: Categories + duration per category (REQUIRED minutes)
//   Step 4: Exercises within picked categories (OPTIONAL)
//   Step 5: Weight
//   Step 6: Notes + review

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { useLogs } from "../../context/LogsContext";
import { useAuth } from "../../context/AuthContext";
import { authApi, exercisesApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";
import { getTranslatedCatalog } from "../../lib/exerciseCatalog";
import Rating from "../../components/Rating";
import {
  computeDailyScore,
  scoreColor,
  bucketScore,
  describeWorkoutScore,
} from "../../utils/score";

const CATEGORY_ORDER = ["strength", "cardio", "mobility", "recovery", "other"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function categoryLabel(cat, t) {
  return t[`category${cat.charAt(0).toUpperCase() + cat.slice(1)}`] ?? cat;
}

export default function LogEntryScreen({ navigation, route }) {
  const entryDate = route?.params?.date ?? today();

  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const { saveLog, getLogForDate, deleteLog } = useLogs();
  const { user, updateUser } = useAuth();
  const s = makeStyles(theme);

  const [step, setStep] = useState(1);
  const [isExisting, setIsExisting] = useState(false);

  // ── Form state ──
  const [isRestDay, setIsRestDay] = useState(false);
  const [categoryDurations, setCategoryDurations] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [effort, setEffort] = useState(3);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [notes, setNotes] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [saving, setSaving] = useState(false);

  const [myExercises, setMyExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Load library
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [customs, slugs] = await Promise.all([
          exercisesApi.listCustom().catch(() => []),
          exercisesApi.getSelection().catch(() => []),
        ]);
        if (cancelled) return;

        const catalog = getTranslatedCatalog(t);
        const catalogSelected = catalog
          .filter((c) => slugs.includes(c.slug))
          .map((c) => ({
            type: c.category,
            exerciseSlug: c.slug,
            exerciseId: null,
            name: c.name,
            _id: `catalog:${c.slug}`,
          }));
        const customItems = customs.map((c) => ({
          type: c.category,
          exerciseSlug: null,
          exerciseId: c._id,
          name: c.name,
          _id: c._id,
        }));

        setMyExercises([...catalogSelected, ...customItems]);
      } catch (err) {
        console.warn("Failed to load exercises", err);
      } finally {
        if (!cancelled) setLoadingExercises(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // Prefill from existing log
  useEffect(() => {
    const existing = getLogForDate ? getLogForDate(entryDate) : null;
    if (!existing) {
      setIsExisting(false);
      return;
    }
    setIsExisting(true);

    if (typeof existing.isRestDay === "boolean")
      setIsRestDay(existing.isRestDay);

    if (Array.isArray(existing.categoryDurations)) {
      setCategoryDurations(
        existing.categoryDurations.map((c) => ({
          type: c.type,
          durationMinutes: c.durationMinutes ?? 30,
        })),
      );
    } else if (
      Array.isArray(existing.workouts) &&
      existing.workouts.length > 0
    ) {
      const byType = {};
      for (const w of existing.workouts) {
        if (!w?.type) continue;
        if (w.durationMinutes != null) {
          byType[w.type] = Math.max(
            byType[w.type] ?? 0,
            w.durationMinutes ?? 0,
          );
        }
      }
      const durations = Object.entries(byType).map(
        ([type, durationMinutes]) => ({
          type,
          durationMinutes,
        }),
      );
      if (durations.length) setCategoryDurations(durations);
    }

    if (Array.isArray(existing.workouts)) {
      const exercises = existing.workouts
        .filter((w) => w.exerciseSlug || w.exerciseId || w.name)
        .map((w) => ({
          type: w.type,
          exerciseSlug: w.exerciseSlug ?? null,
          exerciseId: w.exerciseId ?? null,
          name: w.name ?? null,
          _id:
            w.exerciseId ??
            (w.exerciseSlug ? `catalog:${w.exerciseSlug}` : `legacy:${w.type}`),
        }));
      setWorkouts(exercises);
    }

    if (existing.effort != null) setEffort(existing.effort);
    if (existing.mood != null) setMood(existing.mood);
    if (existing.energy != null) setEnergy(existing.energy);
    if (existing.sleepQuality != null) setSleep(existing.sleepQuality);
    if (existing.soreness != null) setSoreness(existing.soreness);
    if (existing.note != null) setNotes(existing.note);
    if (existing.weightKg != null) setWeightKg(String(existing.weightKg));
  }, [entryDate]);

  useEffect(() => {
    const profileWeight = user?.clientProfile?.weightKg;
    if (profileWeight != null && profileWeight > 0 && !weightKg) {
      setWeightKg(String(profileWeight));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.clientProfile?.weightKg]);

  const totalSteps = isRestDay ? 4 : 6;
  const displayStep = isRestDay
    ? step === 1 ? 1
      : step === 2 ? 2
      : step === 5 ? 3
      : step === 6 ? 4
      : step
    : step;

  const totalDuration = categoryDurations.reduce(
    (sum, c) => sum + (c.durationMinutes || 0),
    0,
  );

  const score = useMemo(
    () => computeDailyScore({ isRestDay, effort, mood, energy }),
    [isRestDay, effort, mood, energy],
  );

  const hasCategory = (cat) => categoryDurations.some((c) => c.type === cat);

  const toggleCategory = (cat) => {
    if (hasCategory(cat)) {
      setCategoryDurations((prev) => prev.filter((c) => c.type !== cat));
      setWorkouts((prev) => prev.filter((w) => w.type !== cat));
    } else {
      setCategoryDurations((prev) => [
        ...prev,
        { type: cat, durationMinutes: 30 },
      ]);
    }
  };

  const updateDuration = (cat, durationMinutes) => {
    setCategoryDurations((prev) =>
      prev.map((c) => (c.type === cat ? { ...c, durationMinutes } : c)),
    );
  };

  const isLogged = (item) => workouts.some((w) => w._id === item._id);

  const toggleExercise = (item) => {
    if (isLogged(item)) {
      setWorkouts(workouts.filter((w) => w._id !== item._id));
    } else {
      setWorkouts([
        ...workouts,
        {
          type: item.type,
          exerciseSlug: item.exerciseSlug,
          exerciseId: item.exerciseId,
          name: item.name,
          _id: item._id,
        },
      ]);
    }
  };

  const groupedForStep4 = useMemo(() => {
    const map = {};
    for (const ex of myExercises) {
      if (!hasCategory(ex.type)) continue;
      (map[ex.type] ||= []).push(ex);
    }
    return CATEGORY_ORDER.filter((c) => hasCategory(c)).map((c) => ({
      category: c,
      items: map[c] ?? [],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myExercises, categoryDurations]);

  const canGoNext = () => {
    if (step === 3) {
      return (
        categoryDurations.length > 0 &&
        categoryDurations.every((c) => c.durationMinutes > 0)
      );
    }
    return true;
  };

  const goNext = () => {
    if (step === 2 && isRestDay) {
      setStep(5);
    } else if (step < 6) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step === 5 && isRestDay) {
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t.deleteEntry ?? "Delete entry?",
      t.deleteEntryConfirm ?? "This cannot be undone.",
      [
        { text: t.cancel ?? "Cancel", style: "cancel" },
        {
          text: t.delete ?? "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLog(entryDate);
              navigation.goBack();
            } catch (e) {
              Alert.alert(t.error ?? "Error", e?.message ?? "Could not delete");
            }
          },
        },
      ],
    );
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      date: entryDate,
      isRestDay,
      categoryDurations: isRestDay ? [] : categoryDurations,
      workouts: isRestDay
        ? []
        : workouts.map((w) => ({
            type: w.type,
            exerciseSlug: w.exerciseSlug ?? null,
            exerciseId: w.exerciseId ?? null,
            name: w.name ?? null,
          })),
      effort: isRestDay ? null : effort,
      mood,
      energy,
      soreness,
      sleepQuality: sleep,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      note: notes.trim(),
    };
    try {
      const res = await saveLog(payload);
      if (weightKg) {
        try {
          const updated = await authApi.updateProfile({
            weightKg: parseFloat(weightKg),
          });
          if (updated) updateUser(updated);
        } catch (_) {}
      }
      const backendScore = res && res.score && res.score.compositeScore;
      const bucket = bucketScore(backendScore);
      const desc = describeWorkoutScore({
        isRestDay,
        workouts: categoryDurations,
        effort,
      });
      const restLabel = t.restDay ?? "Rest day";
      const minutesLabel = t.minutes ?? "min";
      const ptsLabel = t.points ?? "pts";
      const line1 = isRestDay
        ? restLabel
        : `${totalDuration} ${minutesLabel} • ${desc.score} ${ptsLabel}`;
      const line2 =
        bucket != null
          ? (t.scoreLabel ?? "Score") + ": " + bucket + "/5"
          : null;
      const msg = line2 ? line1 + "\n" + line2 : line1;
      Alert.alert(t.saved ?? "Saved", msg, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert(t.error ?? "Error", (e && e.message) || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.bg}>
      {/* ── Header (matches Profile/Workouts pattern) ── */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={goBack} hitSlop={16} style={s.headerBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {displayStep}/{totalSteps} · {t.logEntryTitle ?? "Log training"}
        </Text>
        {isExisting ? (
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={16}
            style={s.headerBtn}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={s.headerBtn} />
        )}
      </View>

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
          {step === 1 && (
            <>
              <Text style={s.stepTitle}>{t.todayWasA ?? "Today was a…"}</Text>
              <View style={s.choiceRow}>
                <TouchableOpacity
                  style={[
                    s.choiceCard,
                    !isRestDay && {
                      borderColor: theme.accent,
                      backgroundColor: theme.accentBg,
                    },
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
                      {
                        color: !isRestDay ? theme.accent : theme.textSecondary,
                      },
                    ]}
                  >
                    {t.trainingDay ?? "Training day"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.choiceCard,
                    isRestDay && {
                      borderColor: theme.accent,
                      backgroundColor: theme.accentBg,
                    },
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
                      {
                        color: isRestDay ? theme.accent : theme.textSecondary,
                      },
                    ]}
                  >
                    {t.restDay ?? "Rest day"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <View
                style={[
                  s.scorePreview,
                  { borderColor: scoreColor(score, theme) },
                ]}
              >
                <Text style={s.scoreLabel}>
                  {t.todaysScore ?? "Today's score"}
                </Text>
                <Text
                  style={[s.scoreValue, { color: scoreColor(score, theme) }]}
                >
                  {score ?? "–"}
                </Text>
              </View>

              {!isRestDay && (
                <Rating
                  label={t.effort ?? "Effort"}
                  value={effort}
                  onChange={setEffort}
                  leftLabel={t.veryLight ?? "Very light"}
                  rightLabel={t.veryHard ?? "Very hard"}
                />
              )}
              <Rating
                label={t.mood ?? "Mood"}
                value={mood}
                onChange={setMood}
                leftLabel={t.bad ?? "Bad"}
                rightLabel={t.great ?? "Great"}
              />
              <Rating
                label={t.energy ?? "Energy"}
                value={energy}
                onChange={setEnergy}
                leftLabel={t.exhausted ?? "Exhausted"}
                rightLabel={t.energized ?? "Energized"}
              />
              <Rating
                label={t.sleepLastNight ?? "Sleep (last night)"}
                value={sleep}
                onChange={setSleep}
                leftLabel={t.poor ?? "Poor"}
                rightLabel={t.excellent ?? "Excellent"}
              />
              <Rating
                label={t.soreness ?? "Soreness"}
                value={soreness}
                onChange={setSoreness}
                leftLabel={t.none ?? "None"}
                rightLabel={t.verySore ?? "Very sore"}
              />
            </>
          )}

          {step === 3 && !isRestDay && (
            <>
              <Text style={s.stepTitle}>{t.workouts ?? "Workouts"}</Text>
              <Text style={s.stepHint}>
                {t.categoriesDurationHint ??
                  "Tap categories you trained, then set the time for each."}
              </Text>

              <View style={s.typeRow}>
                {CATEGORY_ORDER.map((cat) => {
                  const active = hasCategory(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        s.typeChip,
                        active && {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        },
                      ]}
                      onPress={() => toggleCategory(cat)}
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
                        {categoryLabel(cat, t)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {categoryDurations.map((c) => (
                <View key={c.type} style={s.workoutCard}>
                  <View style={s.workoutCardHeader}>
                    <Text style={s.workoutCardTitle}>
                      {categoryLabel(c.type, t)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleCategory(c.type)}
                      hitSlop={12}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={theme.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={s.durationRow}>
                    <TouchableOpacity
                      style={s.durationBtn}
                      onPress={() =>
                        updateDuration(
                          c.type,
                          Math.max(5, c.durationMinutes - 5),
                        )
                      }
                    >
                      <Ionicons name="remove" size={22} color={theme.accent} />
                    </TouchableOpacity>
                    <Text style={s.durationValue}>{c.durationMinutes}</Text>
                    <TouchableOpacity
                      style={s.durationBtn}
                      onPress={() =>
                        updateDuration(
                          c.type,
                          Math.min(300, c.durationMinutes + 5),
                        )
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
                          c.durationMinutes === mins && {
                            backgroundColor: theme.accent,
                            borderColor: theme.accent,
                          },
                        ]}
                        onPress={() => updateDuration(c.type, mins)}
                      >
                        <Text
                          style={[
                            s.presetText,
                            {
                              color:
                                c.durationMinutes === mins
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

              {categoryDurations.length > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>{t.totalLabel ?? "Total"}</Text>
                  <Text style={s.totalValue}>
                    {totalDuration} {t.minutes ?? "min"}
                  </Text>
                </View>
              )}

              {categoryDurations.length === 0 && (
                <View style={s.emptyHint}>
                  <Text style={s.emptyHintText}>
                    {t.pickAtLeastOneCategory ??
                      "Pick at least one category above."}
                  </Text>
                </View>
              )}
            </>
          )}

          {step === 4 && !isRestDay && (
            <>
              <Text style={s.stepTitle}>
                {t.specificExercises ?? "Specific exercises"}
              </Text>
              <Text style={s.stepHint}>
                {t.tapExercisesOptional ?? "Tap exercises you did (optional)."}
              </Text>

              {loadingExercises ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                  <ActivityIndicator color={theme.accent} />
                </View>
              ) : groupedForStep4.every((g) => g.items.length === 0) ? (
                <View style={s.emptyState}>
                  <Ionicons
                    name="list-outline"
                    size={44}
                    color={theme.textMuted}
                  />
                  <Text style={s.emptyTitle}>
                    {t.noExercisesYet ?? "No exercises in your library"}
                  </Text>
                  <Text style={s.emptyDesc}>
                    {t.setUpExercisesFirst ??
                      "Set up exercises for these categories — or just continue."}
                  </Text>
                  <TouchableOpacity
                    style={s.emptyBtn}
                    onPress={() => navigation.navigate("Workouts")}
                    activeOpacity={0.85}
                  >
                    <Text style={s.emptyBtnText}>
                      {t.goToWorkouts ?? "Set up exercises"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {groupedForStep4.map((group) => (
                    <View key={group.category} style={{ marginBottom: 14 }}>
                      <Text style={s.groupHeader}>
                        {categoryLabel(group.category, t)}
                      </Text>
                      {group.items.length === 0 ? (
                        <Text style={s.groupEmpty}>
                          {t.noExercisesInCategory ??
                            "No exercises in this category yet."}
                        </Text>
                      ) : (
                        group.items.map((ex) => (
                          <ExerciseRow
                            key={ex._id}
                            ex={ex}
                            isSelected={isLogged(ex)}
                            theme={theme}
                            s={s}
                            onPress={() => toggleExercise(ex)}
                          />
                        ))
                      )}
                    </View>
                  ))}

                  {workouts.length > 0 && (
                    <View style={s.totalRow}>
                      <Text style={s.totalLabel}>
                        {t.selectedCount ?? "Selected"}
                      </Text>
                      <Text style={s.totalValue}>{workouts.length}</Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {step === 5 && (
            <>
              <Text style={s.stepTitle}>{t.weightTitle ?? "Weight"}</Text>
              <Text style={s.stepHint}>
                {t.weightHint ?? "Optional — leave blank to skip today."}
              </Text>

              <View style={s.weightInputWrap}>
                <TextInput
                  value={weightKg}
                  onChangeText={(v) => {
                    const cleaned = v
                      .replace(/[^0-9.]/g, "")
                      .replace(/(\..*)\./g, "$1");
                    setWeightKg(cleaned);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={theme.textMuted}
                  style={s.weightInput}
                  maxLength={6}
                />
                <Text style={s.weightUnit}>kg</Text>
              </View>

              {!weightKg && (
                <TouchableOpacity
                  style={s.skipBtn}
                  onPress={() => setStep(6)}
                  activeOpacity={0.7}
                >
                  <Text style={s.skipBtnText}>
                    {t.skipWeight ?? "Skip — don't log weight today"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {step === 6 && (
            <>
              <Text style={s.stepTitle}>{t.notes ?? "Notes"}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  t.notesPlaceholder ?? "How was it? Anything to remember?"
                }
                placeholderTextColor={theme.textMuted}
                style={s.notesInput}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <View style={s.summaryCard}>
                <Text style={s.summaryTitle}>{t.summary ?? "Summary"}</Text>
                <SummaryRow
                  label={t.dateLabel ?? "Date"}
                  value={entryDate}
                  theme={theme}
                />
                <SummaryRow
                  label={t.typeLabel ?? "Type"}
                  value={
                    isRestDay
                      ? (t.restDay ?? "Rest day")
                      : (t.training ?? "Training")
                  }
                  theme={theme}
                />
                {!isRestDay && categoryDurations.length > 0 && (
                  <>
                    <View style={s.summaryDivider} />
                    {CATEGORY_ORDER.filter((c) => hasCategory(c)).map((cat) => {
                      const cd = categoryDurations.find((c) => c.type === cat);
                      const exercises = workouts.filter((w) => w.type === cat);
                      return (
                        <View key={cat} style={{ marginVertical: 4 }}>
                          <SummaryRow
                            label={categoryLabel(cat, t)}
                            value={`${cd?.durationMinutes ?? 0} ${
                              t.minutes ?? "min"
                            }`}
                            valueColor={theme.accent}
                            theme={theme}
                            bold
                          />
                          {exercises.map((ex) => (
                            <Text
                              key={ex._id}
                              style={{
                                color: theme.textMuted,
                                fontSize: FontSize.sm,
                                marginLeft: Spacing.md,
                                marginTop: 2,
                              }}
                            >
                              • {ex.name}
                            </Text>
                          ))}
                        </View>
                      );
                    })}
                    <View style={s.summaryDivider} />
                    <SummaryRow
                      label={t.totalLabel ?? "Total"}
                      value={`${totalDuration} ${t.minutes ?? "min"}`}
                      theme={theme}
                      bold
                    />
                  </>
                )}
                {!isRestDay && (
                  <SummaryRow
                    label={t.effort ?? "Effort"}
                    value={effort}
                    theme={theme}
                  />
                )}
                <SummaryRow
                  label={t.mood ?? "Mood"}
                  value={mood}
                  theme={theme}
                />
                <SummaryRow
                  label={t.energy ?? "Energy"}
                  value={energy}
                  theme={theme}
                />
                <SummaryRow
                  label={t.sleep ?? "Sleep"}
                  value={sleep}
                  theme={theme}
                />
                <SummaryRow
                  label={t.soreness ?? "Soreness"}
                  value={soreness}
                  theme={theme}
                />
                {weightKg && (
                  <SummaryRow
                    label={t.weight ?? "Weight"}
                    value={`${weightKg} kg`}
                    theme={theme}
                  />
                )}
                <View style={s.summaryDivider} />
                <SummaryRow
                  label={t.scoreLabel ?? "Score"}
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

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step < 6 ? (
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
              {saving ? (t.saving ?? "Saving…") : (t.save ?? "Save")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ExerciseRow({ ex, isSelected, theme, s, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.exRow,
        isSelected ? s.exRowSelected : s.exRowUnselected,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[s.exRowName, isSelected && { fontWeight: "700" }]}>
        {ex.name}
      </Text>
      <View
        style={[
          s.checkbox,
          isSelected && {
            backgroundColor: theme.accent,
            borderColor: theme.accent,
          },
        ]}
      >
        {isSelected && <Text style={s.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

function SummaryRow({ label, value, valueColor, bold, theme }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: theme.textSecondary, fontSize: FontSize.md }}>
        {label}
      </Text>
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

    // Header (matches Profile/Workouts)
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      backgroundColor: theme.accent,
    },
    headerBtn: { width: 40, alignItems: "center" },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "600",
      textAlign: "center",
    },

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

    emptyHint: { padding: Spacing.lg, alignItems: "center" },
    emptyHintText: { color: theme.textMuted, fontSize: FontSize.sm },

    groupHeader: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.accent,
      marginTop: 4,
      marginBottom: 8,
    },
    groupEmpty: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      fontStyle: "italic",
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    exRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: Radius.md,
      marginBottom: 6,
      borderWidth: 1,
      backgroundColor: theme.surface,
    },
    exRowSelected: { borderColor: theme.accent },
    exRowUnselected: { borderColor: theme.border },
    exRowName: {
      flex: 1,
      fontSize: FontSize.md,
      color: theme.text,
      fontWeight: "500",
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
    checkmark: { color: "#fff", fontSize: 14, fontWeight: "700" },

    emptyState: {
      alignItems: "center",
      paddingVertical: Spacing.xl * 1.5,
      paddingHorizontal: Spacing.lg,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: FontSize.md,
      fontWeight: "700",
      marginTop: Spacing.md,
    },
    emptyDesc: {
      color: theme.textSecondary,
      fontSize: FontSize.sm,
      textAlign: "center",
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    emptyBtn: {
      backgroundColor: theme.accent,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 12,
      borderRadius: Radius.md,
    },
    emptyBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "700" },

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

    weightInputWrap: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      gap: 12,
      marginTop: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    weightInput: {
      color: theme.accent,
      fontSize: 56,
      fontWeight: "800",
      textAlign: "center",
      minWidth: 160,
      padding: 0,
    },
    weightUnit: {
      color: theme.textSecondary,
      fontSize: FontSize.lg,
      fontWeight: "600",
    },
    skipBtn: {
      alignSelf: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    skipBtnText: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      textDecorationLine: "underline",
    },
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