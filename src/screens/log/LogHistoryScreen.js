import DayActionModal from "../../components/calendar/DayActionModal";
import DayPreviewModal from "../../components/calendar/DayPreviewModal";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useLogs } from "../../context/LogsContext";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { scoresApi } from "../../services/api";
import { FontSize } from "../../constants/theme";

// ── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ["strength", "cardio", "mobility", "recovery", "other"];

function categoryLabel(cat, t) {
  if (!cat) return "";
  return t["category" + cat[0].toUpperCase() + cat.slice(1)] ?? cat;
}

function bucketScore(score0to100) {
  if (score0to100 == null) return null;
  if (score0to100 >= 80) return 5;
  if (score0to100 >= 60) return 4;
  if (score0to100 >= 40) return 3;
  if (score0to100 >= 20) return 2;
  return 1;
}

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

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function firstWeekday(y, m) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Chunk a flat array of 35–42 cells into weeks of exactly 7
function chunkIntoWeeks(cells) {
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function buildWorkoutRows(log) {
  if (!log) return [];
  const fromCategoryDurations = Array.isArray(log.categoryDurations)
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
  if (fromCategoryDurations.length) {
    const ordered = [...fromCategoryDurations].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.type) - CATEGORY_ORDER.indexOf(b.type),
    );
    return ordered.map((c) => ({
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

// ── Calendar tab ──────────────────────────────────────────────────────────

function CalendarTab({ logs, scoresByDate, loading, navigation, t, theme }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const PRIMARY = theme.accent;
  const HEADING = theme.text;
  const MUTED = theme.textMuted;
  const [actionDate, setActionDate] = useState(null);
  const [previewDate, setPreviewDate] = useState(null);

  const closeAll = () => {
    setActionDate(null);
    setPreviewDate(null);
  };

  const handleEdit = (dateStr) => {
    closeAll();
    navigation.navigate("Log", { date: dateStr });
  };

  const handlePreview = (dateStr) => {
    setActionDate(null);
    setPreviewDate(dateStr);
  };

  // Find the log + score for the currently-previewed date
  const previewLog = previewDate
    ? (logs.find((l) => l.date === previewDate) ?? null)
    : null;
  const previewScore = previewDate ? (scoresByDate[previewDate] ?? null) : null;
  const goBack = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const goForward = () => {
    if (year === now.getFullYear() && month === now.getMonth()) return;
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const totalDays = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);

  // Build cells: leading blanks for offset, then days 1..N, then trailing
  // blanks so total length is a multiple of 7. Trailing blanks make every
  // week row have exactly 7 children, which keeps `flex: 1` math clean.
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = chunkIntoWeeks(cells);

  const monthLogs = logs.filter((l) => {
    if (!l?.date) return false;
    const [ly, lm] = l.date.split("-").map(Number);
    return ly === year && lm === month + 1;
  });

  const totalLogged = monthLogs.length;
  const avgBucket = (() => {
    const buckets = monthLogs
      .map((l) => bucketScore(scoresByDate[l.date]))
      .filter((b) => b != null);
    if (!buckets.length) return null;
    return Math.round(buckets.reduce((a, b) => a + b, 0) / buckets.length);
  })();

  const today = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const months = t.monthsShort ?? [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const weekdays = t.weekdaysShort ?? [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  const countByScore = [1, 2, 3, 4, 5].map((s) => ({
    score: s,
    count: monthLogs.filter((l) => bucketScore(scoresByDate[l.date]) === s)
      .length,
    label: scoreLabel(s, t),
    color: scoreColor(s),
  }));

  const cardBg = theme.surface ?? "#fff";
  const cardBarBg = theme.surfaceAlt ?? "#e8eef5";
  const dayInactiveBorder = theme.borderStrong ?? "#a0b8d0";

  return (
    <View style={{ flex: 1 }}>
      {/* Month nav */}
      <View style={cal.monthNav}>
        <TouchableOpacity onPress={goBack} style={cal.navBtn}>
          <Text style={[cal.navArrow, { color: HEADING }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[cal.monthTitle, { color: HEADING }]}>
          {months[month]?.toUpperCase()} {year}
        </Text>
        <TouchableOpacity
          onPress={goForward}
          style={[cal.navBtn, isCurrentMonth && { opacity: 0.3 }]}
          disabled={isCurrentMonth}
        >
          <Text
            style={[cal.navArrow, { color: isCurrentMonth ? MUTED : HEADING }]}
          >
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calendar card */}
      <View style={[cal.card, { backgroundColor: cardBg }]}>
        <View style={cal.weekdayRow}>
          {weekdays.map((d, i) => (
            <Text key={i} style={[cal.weekdayLabel, { color: MUTED }]}>
              {d}
            </Text>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginVertical: 24 }} />
        ) : (
          <View>
            {weeks.map((week, wi) => (
              <View key={`w-${wi}`} style={cal.weekRow}>
                {week.map((day, di) => {
                  if (!day) {
                    return <View key={`e-${wi}-${di}`} style={cal.cell} />;
                  }
                  const dateStr = toDateStr(year, month, day);
                  const log = logs.find((l) => l.date === dateStr) ?? null;
                  const bucket = bucketScore(scoresByDate[dateStr]);
                  const isToday = dateStr === today;
                  const isFuture = dateStr > today;
                  const bg = bucket != null ? scoreColor(bucket) : undefined;
                  const highSoreness = log?.soreness >= 4;
                  const isRest = log?.isRestDay === true;
                  const hasNote = !!log?.note?.trim();
                  const highEffort = log?.effort > 4;
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      style={cal.cell}
                      activeOpacity={isFuture ? 1 : 0.7}
                      onPress={() => {
                        if (isFuture) return;
                        // If the day has data, show action modal. Empty days go straight to edit.
                        if (log) {
                          setActionDate(dateStr);
                        } else {
                          navigation.navigate("Log", { date: dateStr });
                        }
                      }}
                    >
                      <View
                        style={[
                          cal.cellInner,
                          { borderColor: theme.borderStrong ?? "#2d4a6e" },
                          isFuture && { borderWidth: 0 },
                          !isFuture &&
                            bucket == null && {
                              borderColor: dayInactiveBorder,
                              borderWidth: 2,
                            },
                          bg && { backgroundColor: bg, borderColor: bg },
                          isToday &&
                            bucket == null && {
                              borderColor: PRIMARY,
                              borderWidth: 2,
                            },
                        ]}
                      >
                        <Text
                          style={[
                            cal.cellText,
                            { color: bucket != null ? "#fff" : HEADING },
                            isToday &&
                              bucket == null && {
                                color: PRIMARY,
                                fontWeight: "800",
                              },
                          ]}
                        >
                          {day}
                        </Text>
                        {isRest && (
                          <View
                            style={[cal.restIcon, { backgroundColor: PRIMARY }]}
                          >
                            <Ionicons name="bed" size={12} color="#fff" />
                          </View>
                        )}
                        {!isRest && highEffort && (
                          <View style={cal.effortIcon}>
                            <Ionicons name="flash" size={11} color="#fff" />
                          </View>
                        )}
                        {highSoreness && <Text style={cal.soreIcon}>🔥</Text>}
                        {hasNote && (
                          <View
                            style={[cal.noteIcon, { backgroundColor: PRIMARY }]}
                          >
                            <Ionicons
                              name="chatbubble-ellipses"
                              size={10}
                              color="#fff"
                            />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        <DayActionModal
          visible={actionDate != null}
          date={actionDate}
          onEdit={() => handleEdit(actionDate)}
          onPreview={() => handlePreview(actionDate)}
          onCancel={closeAll}
        />

        <DayPreviewModal
          visible={previewDate != null}
          date={previewDate}
          log={previewLog}
          score={previewScore}
          onEdit={() => handleEdit(previewDate)}
          onClose={closeAll}
        />
      </View>

      {/* Legend */}
      <View
        style={[cal.card, { backgroundColor: cardBg, paddingVertical: 10 }]}
      >
        <View style={cal.legendRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={cal.legendItem}>
              <View
                style={[cal.legendDot, { backgroundColor: scoreColor(s) }]}
              />
              <Text style={[cal.legendLabel, { color: MUTED }]}>
                {scoreLabel(s, t)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Month summary */}
      <View style={[cal.card, { backgroundColor: cardBg }]}>
        <Text style={[cal.sectionTitle, { color: HEADING }]}>
          {t.monthSummary ?? "Month Summary"}
        </Text>
        <View style={cal.summaryRow}>
          <View style={cal.summaryItem}>
            <Text style={[cal.summaryValue, { color: PRIMARY }]}>
              {totalLogged}
            </Text>
            <Text style={[cal.summarySubLabel, { color: MUTED }]}>
              {t.daysLogged ?? "Days logged"}
            </Text>
          </View>
          <View style={[cal.divider, { backgroundColor: cardBarBg }]} />
          <View style={cal.summaryItem}>
            <Text
              style={[
                cal.summaryValue,
                { color: avgBucket != null ? scoreColor(avgBucket) : MUTED },
              ]}
            >
              {avgBucket != null ? scoreLabel(avgBucket, t) : "—"}
            </Text>
            <Text style={[cal.summarySubLabel, { color: MUTED }]}>
              {t.avgScore ?? "Avg. score"}
            </Text>
          </View>
          <View style={[cal.divider, { backgroundColor: cardBarBg }]} />
          <View style={cal.summaryItem}>
            <Text style={[cal.summaryValue, { color: PRIMARY }]}>
              {totalDays - totalLogged}
            </Text>
            <Text style={[cal.summarySubLabel, { color: MUTED }]}>
              {t.missing ?? "Missing"}
            </Text>
          </View>
        </View>
      </View>

      {/* Score breakdown */}
      <View style={[cal.card, { backgroundColor: cardBg, marginBottom: 40 }]}>
        <Text style={[cal.sectionTitle, { color: HEADING }]}>
          {t.scoreBreakdown ?? "Score Breakdown"}
        </Text>
        {countByScore.map(({ score, count, label, color }) => (
          <View key={score} style={cal.breakdownRow}>
            <View style={[cal.breakdownDot, { backgroundColor: color }]} />
            <Text style={[cal.breakdownLabel, { color: HEADING }]}>
              {label}
            </Text>
            <View style={[cal.breakdownBarBg, { backgroundColor: cardBarBg }]}>
              <View
                style={[
                  cal.breakdownBar,
                  {
                    backgroundColor: color,
                    width: totalLogged
                      ? `${Math.round((count / totalLogged) * 100)}%`
                      : "0%",
                  },
                ]}
              />
            </View>
            <Text style={[cal.breakdownCount, { color: MUTED }]}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 28, fontWeight: "300" },
  monthTitle: { fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  card: {
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  weekdayRow: { flexDirection: "row", marginBottom: 6 },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },

  // ── FIX: explicit week rows, flex:1 cells ──────────────────────────────
  // Previously: { flexDirection:"row", flexWrap:"wrap" } + width:"14.28%".
  // Android rounded each cell down, Sunday wrapped to its own row, dates
  // shifted. Now we render one weekRow per week and let flex:1 divide
  // space evenly — math is integer-clean on every device.
  weekRow: { flexDirection: "row" },
  cell: {
    flex: 1,
    aspectRatio: 1,
    paddingHorizontal: 7,
    paddingVertical: 5,
    minWidth: 0, // allow flex children to shrink below intrinsic content width
  },

  cellInner: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "visible",
  },
  cellText: { fontSize: 13, fontWeight: "600" },
  restIcon: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  effortIcon: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  soreIcon: { position: "absolute", bottom: -6, left: -6, fontSize: 13 },
  noteIcon: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 10 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summarySubLabel: { fontSize: 11, marginTop: 2 },
  divider: { width: 1, height: 40 },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { fontSize: 12, fontWeight: "500", width: 70 },
  breakdownBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownBar: { height: "100%", borderRadius: 4 },
  breakdownCount: {
    fontSize: 12,
    fontWeight: "600",
    width: 24,
    textAlign: "right",
  },
});

// ── Diary tab — grouped by month with day cards ───────────────────────────

function DiaryTab({ logs, scoresByDate, navigation, t, theme }) {
  const HEADING = theme.text;
  const MUTED = theme.textMuted;
  const cardBg = theme.surface ?? "#fff";

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
  const [collapsed, setCollapsed] = useState({});
  const toggle = (key) => setCollapsed((p) => ({ ...p, [key]: !p[key] }));

  const grouped = {};
  logs.forEach((log) => {
    if (!log.date) return;
    const key = log.date.slice(0, 7);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });

  const sections = Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const [y, m] = key.split("-").map(Number);
      const ml = grouped[key];
      const buckets = ml
        .map((l) => bucketScore(scoresByDate[l.date]))
        .filter((b) => b != null);
      const avg = buckets.length
        ? Math.round(buckets.reduce((a, b) => a + b, 0) / buckets.length)
        : null;
      return { key, year: y, month: m - 1, logs: ml, avg };
    });

  const shortDate = (dateStr) => {
    const d = new Date(dateStr);
    const mShort = (months[d.getMonth()] ?? "").slice(0, 3);
    return `${d.getDate()} ${mShort} '${String(d.getFullYear()).slice(2)}`;
  };

  return (
    <FlatList
      data={sections}
      keyExtractor={(item) => item.key}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Text style={{ color: theme.textMuted, fontSize: FontSize.md }}>
            {t.noRecords ?? "No entries yet"}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const pillBg =
          item.avg != null
            ? scoreColor(item.avg) + "33"
            : (theme.surfaceAlt ?? "#e8eef5");
        const pillText = item.avg != null ? scoreColor(item.avg) : HEADING;
        const isOpen = collapsed[item.key] !== false;
        return (
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={[diary.pill, { backgroundColor: pillBg }]}
              onPress={() => toggle(item.key)}
              activeOpacity={0.8}
            >
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={[diary.pillTitle, { color: pillText }]}>
                  {months[item.month]} {item.year}
                </Text>
                <Text style={[diary.pillSub, { color: pillText }]}>
                  {t.avgScore ?? "Avg. score"}:{" "}
                  {item.avg != null ? scoreLabel(item.avg, t) : "—"}
                </Text>
              </View>
              <Text
                style={{
                  color: pillText,
                  fontSize: 20,
                  opacity: 0.7,
                  marginLeft: 8,
                }}
              >
                {isOpen ? "›" : "‹"}
              </Text>
            </TouchableOpacity>

            {!isOpen &&
              item.logs.map((log) => {
                const bucket = bucketScore(scoresByDate[log.date]);
                const dotColor =
                  bucket != null ? scoreColor(bucket) : "#b3cde8";
                const rows = buildWorkoutRows(log);
                const totalMin = rows.reduce(
                  (s, r) => s + (r.durationMinutes || 0),
                  0,
                );
                return (
                  <TouchableOpacity
                    key={log.date}
                    style={[diary.dayCard, { backgroundColor: cardBg }]}
                    onPress={() =>
                      navigation.navigate("Log", { date: log.date })
                    }
                    activeOpacity={0.75}
                  >
                    <View
                      style={[diary.dayBadge, { backgroundColor: dotColor }]}
                    >
                      <Text style={diary.dayBadgeText}>
                        {new Date(log.date).getDate()}
                      </Text>
                      {log.isRestDay && (
                        <View
                          style={[
                            diary.dayBadgeIcon,
                            { backgroundColor: theme.accent },
                          ]}
                        >
                          <Ionicons name="bed" size={10} color="#fff" />
                        </View>
                      )}
                      {log.soreness >= 4 && (
                        <Text style={diary.dayBadgeSore}>🔥</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      {log.isRestDay ? (
                        <Text style={[diary.rowPrimary, { color: HEADING }]}>
                          {t.restDay ?? "Rest day"}
                        </Text>
                      ) : rows.length === 0 ? (
                        <Text style={[diary.rowPrimary, { color: HEADING }]}>
                          —
                        </Text>
                      ) : (
                        <>
                          {rows.map((r) => (
                            <View key={r.category} style={diary.workoutBlock}>
                              <View style={diary.workoutHeader}>
                                <Text
                                  style={[diary.workoutCat, { color: HEADING }]}
                                >
                                  {categoryLabel(r.category, t)}
                                </Text>
                                <Text
                                  style={[
                                    diary.workoutDuration,
                                    { color: theme.accent ?? "#4A7AB5" },
                                  ]}
                                >
                                  {r.durationMinutes}
                                  {t.minutesShort ?? "m"}
                                </Text>
                              </View>
                              {r.exercises.length > 0 && (
                                <View style={{ marginTop: 2 }}>
                                  {r.exercises.map((name, idx) => (
                                    <Text
                                      key={idx}
                                      style={[
                                        diary.exerciseItem,
                                        { color: MUTED },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      • {name}
                                    </Text>
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                          {rows.length > 1 && (
                            <Text
                              style={[
                                diary.totalLine,
                                { color: theme.accent ?? "#4A7AB5" },
                              ]}
                            >
                              {t.totalLabel ?? "Total"}: {totalMin}
                              {t.minutesShort ?? "m"}
                            </Text>
                          )}
                        </>
                      )}

                      <View style={diary.statsRow}>
                        {log.effort != null && (
                          <Stat
                            label={t.effort ?? "Effort"}
                            value={log.effort}
                            color={theme.text}
                          />
                        )}
                        {log.mood != null && (
                          <Stat
                            label={t.mood ?? "Mood"}
                            value={log.mood}
                            color={theme.text}
                          />
                        )}
                        {log.energy != null && (
                          <Stat
                            label={t.energy ?? "Energy"}
                            value={log.energy}
                            color={theme.text}
                          />
                        )}
                        {log.sleepQuality != null && (
                          <Stat
                            label={t.sleep ?? "Sleep"}
                            value={log.sleepQuality}
                            color={theme.text}
                          />
                        )}
                        {log.soreness != null && (
                          <Stat
                            label={t.soreness ?? "Sore"}
                            value={log.soreness}
                            color={theme.text}
                          />
                        )}
                      </View>
                      {!!log.note?.trim() && (
                        <Text
                          style={[
                            diary.note,
                            { color: theme.textSecondary ?? "#444" },
                          ]}
                          numberOfLines={2}
                        >
                          {log.note}
                        </Text>
                      )}
                    </View>

                    <View
                      style={{
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        minHeight: 52,
                      }}
                    >
                      <Text style={[diary.dateText, { color: MUTED }]}>
                        {shortDate(log.date)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={MUTED}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        );
      }}
    />
  );
}

function Stat({ label, value, color }) {
  return (
    <Text style={{ color: color ?? "#444", fontSize: 12, marginRight: 10 }}>
      <Text style={{ fontWeight: "700" }}>{label}:</Text> {value}/5
    </Text>
  );
}

const diary = StyleSheet.create({
  pill: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  pillTitle: { fontSize: 20, fontWeight: "800" },
  pillSub: { fontSize: 13, marginTop: 2, opacity: 0.8 },
  dayCard: {
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dayBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayBadgeText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  dayBadgeIcon: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeSore: { position: "absolute", bottom: -6, left: -6, fontSize: 13 },
  rowPrimary: { fontSize: 14, fontWeight: "700", marginBottom: 6 },

  workoutBlock: { marginBottom: 6 },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  workoutCat: { fontSize: 14, fontWeight: "700" },
  workoutDuration: { fontSize: 13, fontWeight: "700", marginLeft: 8 },
  exerciseItem: { fontSize: 12, lineHeight: 18 },
  totalLine: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 4,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 2,
    marginTop: 6,
  },
  note: { fontSize: 13, marginTop: 4, fontStyle: "italic" },
  dateText: { fontSize: 12, fontWeight: "500" },
});

// ── Main screen ───────────────────────────────────────────────────────────

export default function LogHistoryScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState(
    route?.params?.initialTab ?? "calendar",
  );
  const [scoresByDate, setScoresByDate] = useState({});
  const [scoresLoading, setScoresLoading] = useState(false);

  const { logs, loading: logsLoading, fetchLogs } = useLogs();
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent;

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
      setScoresLoading(true);
      scoresApi
        .list()
        .then((arr) => {
          const list = Array.isArray(arr) ? arr : [];
          const map = {};
          list.forEach((s) => {
            if (s?.date) map[s.date] = s.compositeScore;
          });
          setScoresByDate(map);
        })
        .catch((err) => {
          console.warn("[LogHistoryScreen] scores fetch failed:", err?.message);
          setScoresByDate({});
        })
        .finally(() => setScoresLoading(false));
    }, [fetchLogs]),
  );

  const s = makeStyles(theme);
  const loading = logsLoading || scoresLoading;

  return (
    <View
      style={[
        s.root,
        { backgroundColor: theme.surfaceAlt ?? theme.bg ?? "#F0F4F8" },
      ]}
    >
      <View
        style={[
          s.header,
          { backgroundColor: PRIMARY, paddingTop: insets.top + 10 },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.myDiary ?? "My Diary"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View
        style={[
          s.tabBar,
          {
            backgroundColor: theme.surface ?? "#fff",
            borderBottomColor: theme.border ?? "#e8eef5",
          },
        ]}
      >
        {["calendar", "diary"].map((tab) => {
          const isActive = activeTab === tab;
          const label =
            tab === "calendar"
              ? (t.calendar ?? "Calendar")
              : (t.diary ?? "Diary");
          return (
            <TouchableOpacity
              key={tab}
              style={[
                s.tab,
                {
                  backgroundColor: theme.surface ?? "#fff",
                  borderColor: theme.border ?? "#dde5ee",
                },
                isActive && {
                  borderColor: PRIMARY,
                  overflow: "hidden",
                  paddingVertical: 0,
                },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <View style={[s.tabActive, { backgroundColor: PRIMARY }]}>
                  <Text style={s.tabTextActive}>{label}</Text>
                </View>
              ) : (
                <Text
                  style={[s.tabText, { color: theme.textMuted ?? "#8fa8c8" }]}
                >
                  {label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === "calendar" && (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <CalendarTab
              logs={logs}
              scoresByDate={scoresByDate}
              loading={loading}
              navigation={navigation}
              t={t}
              theme={theme}
            />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === "diary" && (
        <DiaryTab
          logs={logs}
          scoresByDate={scoresByDate}
          navigation={navigation}
          t={t}
          theme={theme}
        />
      )}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    backBtn: { width: 40, padding: 8 },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "600",
      textAlign: "center",
    },
    tabBar: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
    },
    tab: {
      flex: 1,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      paddingVertical: 16,
    },
    tabActive: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
    },
    tabText: {
      fontSize: FontSize.sm,
      fontWeight: "600",
    },
    tabTextActive: { color: "#fff", fontWeight: "700" },
  });
}
