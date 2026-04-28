// src/screens/home/MyDataScreen.js
// "My Data" / Stats screen — summary numbers + 6 chart cards.
// Charts come in via subsequent layers; this is the shell.

import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { useLogs } from "../../context/LogsContext";
import { scoresApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";
import {
  summaryNumbers, radarPoints, trendSeries, heatmapCells,
  weeklyVolume, categoryBreakdown, weightSeries,
} from "../../utils/stats";
import RadarChart   from "../../components/charts/RadarChart";
import TrendChart   from "../../components/charts/TrendChart";
import HeatmapChart from "../../components/charts/HeatmapChart";
import BarChart     from "../../components/charts/BarChart";
import DonutChart   from "../../components/charts/DonutChart";

function SummaryCard({ theme, t, summary }) {
  const items = [
    { key: "sessions",  label: t.sessionsLogged ?? "Sessions",  value: summary.sessions },
    {
      key: "hours",
      label: t.totalHours ?? "Hours",
      value: (summary.minutes / 60).toFixed(1),
    },
    { key: "restDays",  label: t.restDays ?? "Rest days",       value: summary.restDays },
    {
      key: "avgEffort",
      label: t.avgEffort ?? "Avg effort",
      value: summary.avgEffort != null ? summary.avgEffort.toFixed(1) : "–",
    },
  ];
  return (
    <View style={[s.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[s.cardKicker, { color: theme.textMuted }]}>
        {(t.last30days ?? "Last 30 days").toUpperCase()}
      </Text>
      <View style={s.summaryGrid}>
        {items.map((it) => (
          <View key={it.key} style={s.summaryCell}>
            <Text style={[s.summaryValue, { color: theme.accent }]}>
              {it.value}
            </Text>
            <Text style={[s.summaryLabel, { color: theme.textMuted }]} numberOfLines={1}>
              {it.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ChartCard({ theme, t, title, subtitle, height = 220, children }) {
  return (
    <View style={[s.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[s.cardKicker, { color: theme.textMuted }]}>
        {title.toUpperCase()}
      </Text>
      {subtitle ? (
        <Text style={[s.cardSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      ) : null}
      <View style={[s.chartArea, { height }]}>
        {children ?? (
          <Text style={[s.placeholder, { color: theme.textMuted }]}>
            Chart coming soon
          </Text>
        )}
      </View>
    </View>
  );
}

export default function MyDataScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const { logs, loading, fetchLogs } = useLogs();
  const [scoresByDate, setScoresByDate] = useState({});

  useEffect(() => {
    if (fetchLogs) fetchLogs();
    scoresApi.list().then((arr) => {
      const map = {};
      (Array.isArray(arr) ? arr : []).forEach((sc) => {
        if (sc && sc.date) map[sc.date] = sc.compositeScore;
      });
      setScoresByDate(map);
    }).catch(() => setScoresByDate({}));
  }, [fetchLogs]);

  const summary = useMemo(() => summaryNumbers(logs || [], 30), [logs]);
  const radar   = useMemo(() => radarPoints(logs || [], 14), [logs]);
  const trends  = useMemo(() => [
    { key: "effort", label: t.effort ?? "Effort", color: "#4A7AB5",
      data: trendSeries(logs || [], "effort", 90) },
    { key: "mood",   label: t.mood ?? "Mood",     color: "#10B981",
      data: trendSeries(logs || [], "mood", 90) },
    { key: "energy", label: t.energy ?? "Energy", color: "#F59E0B",
      data: trendSeries(logs || [], "energy", 90) },
    { key: "sleep",  label: t.sleep ?? "Sleep",   color: "#8B5CF6",
      data: trendSeries(logs || [], "sleep", 90) },
  ], [logs, t]);
  const heatmap = useMemo(() => heatmapCells(logs || [], scoresByDate, 26), [logs, scoresByDate]);
  const weekly  = useMemo(() => weeklyVolume(logs || [], 12).map((w) => ({
    ...w,
    label: w.weekStart.slice(5), // MM-DD
  })), [logs]);
  const cats    = useMemo(() => categoryBreakdown(logs || [], 30), [logs]);
  const weight  = useMemo(() => weightSeries(logs || [], 90), [logs]);

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <View style={[s.header, { backgroundColor: theme.accent, paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.myData ?? "My Data"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: (insets.bottom || 12) + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {loading && !logs ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : (
          <>
            <SummaryCard theme={theme} t={t} summary={summary} />

            <ChartCard theme={theme} t={t}
              title={t.balance ?? "Balance"}
              subtitle={t.last14days ?? "Average across the last 14 days"}
              height={340}>
              <RadarChart
                axes={radar}
                accentColor={theme.accent}
                textColor={theme.text}
                mutedColor={theme.textMuted}
                gridColor={theme.border}
              />
            </ChartCard>

            <ChartCard theme={theme} t={t}
              title={t.trends ?? "Trends"}
              subtitle={t.last90days ?? "Effort, mood, energy, sleep over time"}
              height={260}>
              <TrendChart series={trends} theme={theme} />
            </ChartCard>

            <ChartCard theme={theme} t={t}
              title={t.heatmap ?? "Heatmap"}
              subtitle={t.last26weeks ?? "Daily intensity, last 6 months"}
              height={220}>
              <HeatmapChart cells={heatmap.cells} weeks={heatmap.weeks} theme={theme} />
            </ChartCard>

            <ChartCard theme={theme} t={t}
              title={t.weeklyVolume ?? "Weekly volume"}
              subtitle={t.last12weeks ?? "Total minutes per week"}
              height={240}>
              <BarChart data={weekly} theme={theme} valueKey="minutes" />
            </ChartCard>

            <ChartCard theme={theme} t={t}
              title={t.categoryMix ?? "Category mix"}
              subtitle={t.last30days ?? "Strength / cardio / mobility / recovery"}
              height={300}>
              <DonutChart slices={cats} theme={theme} totalLabel={(t.totalHours ?? "HOURS").toUpperCase()} />
            </ChartCard>

            <ChartCard theme={theme} t={t}
              title={t.weight ?? "Weight"}
              subtitle={t.last90days ?? "Last 90 days"}
              height={240}>
              <TrendChart
                series={[{ key: "weight", label: t.weight ?? "Weight", color: theme.accent, data: weight }]}
                theme={theme}
                yMin={Math.min(...weight.map((p) => p.y), 50) - 2}
                yMax={Math.max(...weight.map((p) => p.y), 100) + 2}
                yTicks={[]}
              />
            </ChartCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: FontSize.lg, fontWeight: "700", letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.md },
  loadingWrap: { paddingVertical: 80, alignItems: "center" },
  summaryCard: { borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1 },
  cardKicker: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  summaryGrid: { flexDirection: "row", marginTop: Spacing.md, gap: Spacing.md },
  summaryCell: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.4, marginTop: 2 },
  chartCard: { borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1 },
  chartArea: { marginTop: Spacing.md, alignItems: "center", justifyContent: "center" },
  placeholder: { fontSize: 13, fontStyle: "italic" },
});
