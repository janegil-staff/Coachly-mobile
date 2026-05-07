// src/components/calendar/DayPreviewModal.js
// Read-only preview of a calendar day's logged data. Shown when user taps
// "Preview" in DayActionModal. Mirrors the data shape used elsewhere:
// categoryDurations is preferred; workouts is the legacy fallback.

import React, { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize } from "../../constants/theme";

const CATEGORY_ORDER = ["strength", "cardio", "mobility", "recovery", "other"];

function formatDateHeader(dateStr, t) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const weekdays = t.weekdays ?? [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const months = t.months ?? [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayIdx = (d.getDay() + 6) % 7;
  return `${weekdays[dayIdx]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function categoryLabel(cat, t) {
  if (!cat) return "";
  return t["category" + cat[0].toUpperCase() + cat.slice(1)] ?? cat;
}

// Score bucket colors — matches LogHistoryScreen's calendar
function scoreColor(bucket) {
  const map = {
    5: "#16A34A",
    4: "#84CC16",
    3: "#D97706",
    2: "#F97316",
    1: "#DC2626",
  };
  return map[bucket] ?? "#b3cde8";
}

function scoreLabel(bucket, t) {
  const labels = [
    null,
    t.scoreBad ?? "Bad",
    t.scorePoor ?? "Poor",
    t.scoreOk ?? "OK",
    t.scoreGood ?? "Good",
    t.scoreGreat ?? "Great",
  ];
  return labels[bucket];
}

function bucketScore(score0to100) {
  if (score0to100 == null) return null;
  if (score0to100 >= 80) return 5;
  if (score0to100 >= 60) return 4;
  if (score0to100 >= 40) return 3;
  if (score0to100 >= 20) return 2;
  return 1;
}

// Build workout rows: prefer categoryDurations, fallback to workouts.
// Names from workouts[] are merged in by category for display.
function buildWorkoutRows(log) {
  if (!log) return [];
  const fromCat = Array.isArray(log.categoryDurations)
    ? log.categoryDurations
    : [];
  const exercisesByCat = {};
  if (Array.isArray(log.workouts)) {
    for (const w of log.workouts) {
      if (!w?.type) continue;
      if (!w.name && !w.exerciseSlug && !w.exerciseId) continue;
      (exercisesByCat[w.type] ||= []).push(w.name ?? "");
    }
  }
  if (fromCat.length) {
    return [...fromCat]
      .sort(
        (a, b) =>
          CATEGORY_ORDER.indexOf(a.type) - CATEGORY_ORDER.indexOf(b.type),
      )
      .map((c) => ({
        category: c.type,
        durationMinutes: c.durationMinutes ?? 0,
        exercises: exercisesByCat[c.type] ?? [],
      }));
  }
  if (Array.isArray(log.workouts) && log.workouts.length > 0) {
    const byType = {};
    for (const w of log.workouts) {
      if (!w?.type) continue;
      byType[w.type] = (byType[w.type] ?? 0) + (w.durationMinutes ?? 0);
    }
    return Object.entries(byType)
      .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
      .map(([type, durationMinutes]) => ({
        category: type,
        durationMinutes,
        exercises: [],
      }));
  }
  return [];
}

export default function DayPreviewModal({
  visible,
  date,
  log,
  score,
  onEdit,
  onClose,
}) {
  const { theme } = useTheme();
  const { t } = useLang();

  const surface = theme.surface ?? "#fff";
  const text = theme.text ?? "#2d4a6e";
  const muted = theme.textMuted ?? "#7a9ab8";
  const accent = theme.accent ?? "#4a7ab5";
  const border = theme.border ?? "#dde5ee";
  const surfaceAlt = theme.surfaceAlt ?? "#eef2f7";

  const rows = useMemo(() => buildWorkoutRows(log), [log]);
  const totalMinutes = rows.reduce((s, r) => s + (r.durationMinutes || 0), 0);
  const bucket = bucketScore(score);

  // Stats to display — only show fields that have a value
  const statRows = useMemo(() => {
    if (!log) return [];
    const rows = [
      {
        key: "effort",
        label: t.effort ?? "Effort",
        value: log.effort,
        hideIfRest: true,
      },
      { key: "mood", label: t.mood ?? "Mood", value: log.mood },
      { key: "energy", label: t.energy ?? "Energy", value: log.energy },
      { key: "sleep", label: t.sleep ?? "Sleep", value: log.sleepQuality },
      { key: "soreness", label: t.soreness ?? "Soreness", value: log.soreness },
    ];
    return rows.filter(
      (r) => typeof r.value === "number" && !(r.hideIfRest && log.isRestDay),
    );
  }, [log, t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable
          style={[s.card, { backgroundColor: surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={[s.dateHeader, { color: text }]}>
                {formatDateHeader(date, t)}
              </Text>
              {bucket != null && (
                <View style={s.scoreRow}>
                  <View
                    style={[
                      s.scoreBadge,
                      { backgroundColor: scoreColor(bucket) },
                    ]}
                  >
                    <Text style={s.scoreBadgeText}>{bucket}</Text>
                  </View>
                  <Text style={[s.scoreLabelText, { color: muted }]}>
                    {scoreLabel(bucket, t)}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={s.body}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Rest day pill */}
            {log?.isRestDay && (
              <View style={[s.restPill, { backgroundColor: surfaceAlt }]}>
                <Ionicons name="bed" size={16} color={accent} />
                <Text style={[s.restPillText, { color: accent }]}>
                  {t.restDay ?? "Rest day"}
                </Text>
              </View>
            )}

            {/* Workouts */}
            {!log?.isRestDay && rows.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: muted }]}>
                  {(t.workouts ?? "Workouts").toUpperCase()}
                </Text>
                {rows.map((r) => (
                  <View key={r.category} style={s.workoutRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.workoutCat, { color: text }]}>
                        {categoryLabel(r.category, t)}
                      </Text>
                      {r.exercises.length > 0 && (
                        <View style={{ marginTop: 2 }}>
                          {r.exercises.map((name, idx) => (
                            <Text
                              key={idx}
                              style={[s.exerciseItem, { color: muted }]}
                              numberOfLines={1}
                            >
                              • {name}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={[s.workoutMinutes, { color: accent }]}>
                      {r.durationMinutes}
                      {t.minutesShort ?? "m"}
                    </Text>
                  </View>
                ))}
                {rows.length > 1 && (
                  <View style={[s.totalRow, { borderTopColor: border }]}>
                    <Text style={[s.totalLabel, { color: muted }]}>
                      {t.totalLabel ?? "Total"}
                    </Text>
                    <Text style={[s.totalValue, { color: accent }]}>
                      {totalMinutes}
                      {t.minutesShort ?? "m"}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Stats grid */}
            {statRows.length > 0 && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: muted }]}>
                  {(t.howIFelt ?? "How I felt").toUpperCase()}
                </Text>
                <View style={s.statsGrid}>
                  {statRows.map((row) => (
                    <View
                      key={row.key}
                      style={[s.statCell, { backgroundColor: surfaceAlt }]}
                    >
                      <Text style={[s.statLabel, { color: muted }]}>
                        {row.label}
                      </Text>
                      <Text style={[s.statValue, { color: text }]}>
                        {row.value}
                        <Text style={[s.statValueSuffix, { color: muted }]}>
                          /5
                        </Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Note */}
            {!!log?.note?.trim() && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: muted }]}>
                  {(t.note ?? "Note").toUpperCase()}
                </Text>
                <Text style={[s.noteText, { color: text }]}>{log.note}</Text>
              </View>
            )}

            {/* Empty state if no log */}
            {!log && (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Ionicons name="document-outline" size={32} color={muted} />
                <Text style={{ color: muted, marginTop: 8, fontSize: 13 }}>
                  {t.noEntryYet ?? "No entry for this day"}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[s.footer, { borderTopColor: border }]}>
            <TouchableOpacity
              style={s.btnGhost}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[s.btnGhostText, { color: muted }]}>
                {t.close ?? "Close"}
              </Text>
            </TouchableOpacity>
            {onEdit && (
              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: accent }]}
                onPress={onEdit}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={s.btnPrimaryText}>{t.edit ?? "Edit"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 30, 50, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  dateHeader: {
    fontSize: FontSize.lg ?? 18,
    fontWeight: "800",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  scoreBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  scoreLabelText: {
    fontSize: 13,
    fontWeight: "600",
  },
  closeBtn: {
    padding: 4,
    marginTop: -2,
  },
  body: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  restPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 16,
  },
  restPillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  workoutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  workoutCat: {
    fontSize: 14,
    fontWeight: "700",
  },
  workoutMinutes: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  exerciseItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCell: {
    flex: 1,
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statValueSuffix: {
    fontSize: 12,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: {
    fontSize: 15,
    fontWeight: "600",
  },
  btnPrimary: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
