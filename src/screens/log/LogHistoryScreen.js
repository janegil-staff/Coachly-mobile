// src/screens/log/LogHistoryScreen.js
// Coachly fitness diary — Calendar + Diary tabs with score-colored cells.

import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import { FontSize, Spacing, Radius } from "../../constants/theme";

// ── Helpers ────────────────────────────────────────────────────────────────

// Bucket backend 0-100 composite score into UI 1-5
function bucketScore(score0to100) {
  if (score0to100 == null) return null;
  if (score0to100 >= 80) return 5;
  if (score0to100 >= 60) return 4;
  if (score0to100 >= 40) return 3;
  if (score0to100 >= 20) return 2;
  return 1;
}

// Score colors — 5 = green (best), 1 = red (worst)
function scoreColor(bucket) {
  const map = {
    5: "#16A34A", // green
    4: "#84CC16", // lime
    3: "#D97706", // amber
    2: "#F97316", // orange
    1: "#DC2626", // red
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
  return d === 0 ? 6 : d - 1; // Mon=0..Sun=6
}

function toDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ── Calendar tab ──────────────────────────────────────────────────────────

function CalendarTab({ logs, scoresByDate, loading, navigation, t, theme }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const PRIMARY = theme.accent;
  const NAVY = "#1a2c3d";
  const MUTED = "#7a9ab8";

  const goBack = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const goForward = () => {
    if (year === now.getFullYear() && month === now.getMonth()) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const totalDays = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

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
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const weekdays = t.weekdaysShort ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const countByScore = [1, 2, 3, 4, 5].map((s) => ({
    score: s,
    count: monthLogs.filter((l) => bucketScore(scoresByDate[l.date]) === s).length,
    label: scoreLabel(s, t),
    color: scoreColor(s),
  }));

  return (
    <View style={{ flex: 1 }}>
      {/* Month nav */}
      <View style={cal.monthNav}>
        <TouchableOpacity onPress={goBack} style={cal.navBtn}>
          <Text style={[cal.navArrow, { color: NAVY }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[cal.monthTitle, { color: NAVY }]}>
          {months[month]?.toUpperCase()} {year}
        </Text>
        <TouchableOpacity
          onPress={goForward}
          style={[cal.navBtn, isCurrentMonth && { opacity: 0.3 }]}
          disabled={isCurrentMonth}
        >
          <Text style={[cal.navArrow, { color: isCurrentMonth ? "#ccc" : NAVY }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar card */}
      <View style={cal.card}>
        <View style={cal.weekdayRow}>
          {weekdays.map((d, i) => (
            <Text key={i} style={[cal.weekdayLabel, { color: MUTED }]}>{d}</Text>
          ))}
        </View>
        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginVertical: 24 }} />
        ) : (
          <View style={cal.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={cal.cell} />;
              const dateStr = toDateStr(year, month, day);
              const log = logs.find((l) => l.date === dateStr) ?? null;
              const bucket = bucketScore(scoresByDate[dateStr]);
              const isToday = dateStr === today;
              const isFuture = dateStr > today;
              const bg = bucket != null ? scoreColor(bucket) : undefined;
              const highSoreness = log?.soreness >= 4;
              const isRest = log?.isRestDay === true;
              const hasNote = !!log?.note?.trim();

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={cal.cell}
                  activeOpacity={isFuture ? 1 : 0.7}
                  onPress={() => !isFuture && navigation.navigate("Log", { date: dateStr })}
                >
                  <View
                    style={[
                      cal.cellInner,
                      isFuture && { borderWidth: 0 },
                      !isFuture && bucket == null && { borderColor: "#a0b8d0", borderWidth: 2 },
                      bg && { backgroundColor: bg, borderColor: bg },
                      isToday && bucket == null && { borderColor: PRIMARY, borderWidth: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        cal.cellText,
                        { color: bucket != null ? "#fff" : NAVY },
                        isToday && bucket == null && { color: PRIMARY, fontWeight: "800" },
                      ]}
                    >
                      {day}
                    </Text>
                    {isRest && (
                      <View style={cal.restIcon}>
                        <Ionicons name="bed" size={12} color="#fff" />
                      </View>
                    )}
                    {highSoreness && <Text style={cal.soreIcon}>🔥</Text>}
                    {hasNote && (
                      <View style={cal.noteIcon}>
                        <Ionicons name="chatbubble-ellipses" size={10} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={[cal.card, { paddingVertical: 10 }]}>
        <View style={cal.legendRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={cal.legendItem}>
              <View style={[cal.legendDot, { backgroundColor: scoreColor(s) }]} />
              <Text style={[cal.legendLabel, { color: MUTED }]}>{scoreLabel(s, t)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Month summary */}
      <View style={cal.card}>
        <Text style={[cal.sectionTitle, { color: NAVY }]}>
          {t.monthSummary ?? "Month Summary"}
        </Text>
        <View style={cal.summaryRow}>
          <View style={cal.summaryItem}>
            <Text style={[cal.summaryValue, { color: PRIMARY }]}>{totalLogged}</Text>
            <Text style={[cal.summarySubLabel, { color: MUTED }]}>
              {t.daysLogged ?? "Days logged"}
            </Text>
          </View>
          <View style={cal.divider} />
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
          <View style={cal.divider} />
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
      <View style={[cal.card, { marginBottom: 40 }]}>
        <Text style={[cal.sectionTitle, { color: NAVY }]}>
          {t.scoreBreakdown ?? "Score Breakdown"}
        </Text>
        {countByScore.map(({ score, count, label, color }) => (
          <View key={score} style={cal.breakdownRow}>
            <View style={[cal.breakdownDot, { backgroundColor: color }]} />
            <Text style={[cal.breakdownLabel, { color: NAVY }]}>{label}</Text>
            <View style={cal.breakdownBarBg}>
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
    backgroundColor: "#fff",
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
  weekdayLabel: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  cellInner: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2d4a6e",
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
    backgroundColor: "#4A7AB5",
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
    backgroundColor: "#4A7AB5",
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
  divider: { width: 1, height: 40, backgroundColor: "#e8eef5" },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { fontSize: 12, fontWeight: "500", width: 70 },
  breakdownBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: "#e8eef5" },
  breakdownBar: { height: "100%", borderRadius: 4 },
  breakdownCount: { fontSize: 12, fontWeight: "600", width: 24, textAlign: "right" },
});

// ── Diary tab — grouped by month with day cards ───────────────────────────

function DiaryTab({ logs, scoresByDate, navigation, t, theme }) {
  const NAVY = "#1a2c3d";
  const MUTED = "#7a9ab8";
  const months = t.months ?? [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
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

  const workoutSummary = (log) => {
    if (log.isRestDay) return t.restDay ?? "Rest day";
    if (!log.workouts?.length) return "—";
    return log.workouts
      .map((w) => `${t["category" + w.type[0].toUpperCase() + w.type.slice(1)] ?? w.type} ${w.durationMinutes}m`)
      .join(", ");
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
        const pillBg = item.avg != null ? scoreColor(item.avg) + "33" : "#e8eef5";
        const pillText = item.avg != null ? scoreColor(item.avg) : NAVY;
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
              <Text style={{ color: pillText, fontSize: 20, opacity: 0.7, marginLeft: 8 }}>
                {isOpen ? "›" : "‹"}
              </Text>
            </TouchableOpacity>

            {!isOpen &&
              item.logs.map((log) => {
                const bucket = bucketScore(scoresByDate[log.date]);
                const dotColor = bucket != null ? scoreColor(bucket) : "#b3cde8";
                return (
                  <TouchableOpacity
                    key={log.date}
                    style={diary.dayCard}
                    onPress={() => navigation.navigate("Log", { date: log.date })}
                    activeOpacity={0.75}
                  >
                    <View style={[diary.dayBadge, { backgroundColor: dotColor }]}>
                      <Text style={diary.dayBadgeText}>
                        {new Date(log.date).getDate()}
                      </Text>
                      {log.isRestDay && (
                        <View style={diary.dayBadgeIcon}>
                          <Ionicons name="bed" size={10} color="#fff" />
                        </View>
                      )}
                      {log.soreness >= 4 && (
                        <Text style={diary.dayBadgeSore}>🔥</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[diary.rowPrimary, { color: NAVY }]}>
                        {workoutSummary(log)}
                      </Text>
                      <View style={diary.statsRow}>
                        {log.effort != null && <Stat label={t.effort ?? "Effort"} value={log.effort} />}
                        {log.mood != null && <Stat label={t.mood ?? "Mood"} value={log.mood} />}
                        {log.energy != null && <Stat label={t.energy ?? "Energy"} value={log.energy} />}
                        {log.sleepQuality != null && <Stat label={t.sleep ?? "Sleep"} value={log.sleepQuality} />}
                        {log.soreness != null && <Stat label={t.soreness ?? "Sore"} value={log.soreness} />}
                      </View>
                      {!!log.note?.trim() && (
                        <Text
                          style={[diary.note, { color: "#444" }]}
                          numberOfLines={2}
                        >
                          {log.note}
                        </Text>
                      )}
                    </View>

                    <View style={{ alignItems: "flex-end", justifyContent: "space-between", minHeight: 52 }}>
                      <Text style={[diary.dateText, { color: MUTED }]}>
                        {shortDate(log.date)}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={MUTED} />
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

function Stat({ label, value }) {
  return (
    <Text style={{ color: "#444", fontSize: 12, marginRight: 10 }}>
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
    backgroundColor: "#fff",
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
    backgroundColor: "#4A7AB5",
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeSore: { position: "absolute", bottom: -6, left: -6, fontSize: 13 },
  rowPrimary: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", rowGap: 2 },
  note: { fontSize: 13, marginTop: 4, fontStyle: "italic" },
  dateText: { fontSize: 12, fontWeight: "500" },
});

// ── Main screen ───────────────────────────────────────────────────────────

export default function LogHistoryScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab ?? "calendar");
  const [scoresByDate, setScoresByDate] = useState({});
  const [scoresLoading, setScoresLoading] = useState(false);

  const { logs, loading: logsLoading, fetchLogs } = useLogs();
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent;

  // Fetch logs + scores on focus
  useFocusEffect(
    useCallback(() => {
      fetchLogs();
      setScoresLoading(true);
      scoresApi
        .list()
        .then((res) => {
          // API returns either { scores: [...] } or a plain array — handle both.
          const arr = Array.isArray(res) ? res : Array.isArray(res?.scores) ? res.scores : [];
          const map = {};
          arr.forEach((s) => {
            if (s?.date) map[s.date] = s.compositeScore;
          });
          setScoresByDate(map);
        })
        .catch(() => setScoresByDate({}))
        .finally(() => setScoresLoading(false));
    }, [fetchLogs])
  );

  const s = makeStyles(theme);
  const loading = logsLoading || scoresLoading;

  return (
    <View style={[s.root, { backgroundColor: "#F0F4F8" }]}>
      <View style={[s.header, { backgroundColor: PRIMARY, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.myDiary ?? "My Diary"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.tabBar}>
        {["calendar", "diary"].map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === "calendar"
            ? (t.calendar ?? "Calendar")
            : (t.diary ?? "Diary");
          return (
            <TouchableOpacity
              key={tab}
              style={[
                s.tab,
                isActive && { borderColor: PRIMARY, overflow: "hidden", paddingVertical: 0 },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <View style={[s.tabActive, { backgroundColor: PRIMARY }]}>
                  <Text style={s.tabTextActive}>{label}</Text>
                </View>
              ) : (
                <Text style={s.tabText}>{label}</Text>
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
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: theme.border ?? "#e8eef5",
    },
    tab: {
      flex: 1,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: theme.border ?? "#dde5ee",
      paddingVertical: 16,
    },
    tabActive: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
    },
    tabText: {
      color: theme.textMuted ?? "#8fa8c8",
      fontSize: FontSize.sm,
      fontWeight: "600",
    },
    tabTextActive: { color: "#fff", fontWeight: "700" },
  });
}
