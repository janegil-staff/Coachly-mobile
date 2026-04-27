// src/screens/workouts/WorkoutsScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { workoutsApi } from "../../services/api";
import { FontSize } from "../../constants/theme";

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(dateStr, t) {
  const d = new Date(dateStr);
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
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];
  return `${weekdays[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function exerciseSummary(workout) {
  const count = workout.exercises?.length ?? 0;
  return count;
}

// ── Workout card ────────────────────────────────────────────────────────

function WorkoutCard({ workout, onPress, t, theme, variant = "default" }) {
  const PRIMARY = theme.accent;
  const NAVY = "#1a2c3d";
  const MUTED = "#7a9ab8";
  const isToday = variant === "today";
  const isPast = variant === "past";
  const exCount = exerciseSummary(workout);

  return (
    <TouchableOpacity
      style={[
        card.root,
        isToday && { borderColor: PRIMARY, borderWidth: 2 },
        workout.completed && card.completed,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={card.headerRow}>
        <Text style={[card.title, { color: NAVY }]} numberOfLines={1}>
          {workout.title || (t.workouts?.untitled ?? "Workout")}
        </Text>
        {workout.completed && (
          <View style={[card.badge, { backgroundColor: "#16A34A" }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
            <Text style={card.badgeText}>{t.workouts?.done ?? "Done"}</Text>
          </View>
        )}
      </View>

      <Text style={[card.dateText, { color: isToday ? PRIMARY : MUTED }]}>
        {formatDate(workout.assignedDate, t)}
      </Text>

      <View style={card.metaRow}>
        <View style={card.metaItem}>
          <Ionicons name="barbell-outline" size={14} color={MUTED} />
          <Text style={[card.metaText, { color: MUTED }]}>
            {exCount}{" "}
            {exCount === 1
              ? (t.workouts?.exerciseSingular ?? "exercise")
              : (t.workouts?.exercisePlural ?? "exercises")}
          </Text>
        </View>
        {workout.clientRpe != null && (
          <View style={card.metaItem}>
            <Ionicons name="flame-outline" size={14} color={MUTED} />
            <Text style={[card.metaText, { color: MUTED }]}>
              RPE {workout.clientRpe}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  root: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8eef5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  completed: {
    opacity: 0.7,
    backgroundColor: "#f6faf7",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});

// ── Section header ──────────────────────────────────────────────────────

function SectionHeader({ label, count, theme }) {
  return (
    <View style={section.row}>
      <Text style={[section.label, { color: "#1a2c3d" }]}>{label}</Text>
      <Text style={[section.count, { color: "#7a9ab8" }]}>{count}</Text>
    </View>
  );
}

const section = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  count: {
    fontSize: 13,
    fontWeight: "600",
  },
});

// ── Main screen ─────────────────────────────────────────────────────────

export default function WorkoutsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const PRIMARY = theme.accent;

  const [data, setData] = useState({ today: [], upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await workoutsApi.listUpcoming();
      setData(result);
    } catch (err) {
      console.warn("[WorkoutsScreen] load failed:", err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Build a single flat list with section markers
  const items = [];
  if (data.today.length) {
    items.push({
      kind: "header",
      label: t.workouts?.todayTitle ?? "Today",
      count: data.today.length,
    });
    data.today.forEach((w) =>
      items.push({ kind: "workout", workout: w, variant: "today" }),
    );
  }
  if (data.upcoming.length) {
    items.push({
      kind: "header",
      label: t.workouts?.upcomingTitle ?? "Upcoming",
      count: data.upcoming.length,
    });
    data.upcoming.forEach((w) =>
      items.push({ kind: "workout", workout: w, variant: "default" }),
    );
  }
  if (data.past.length) {
    items.push({
      kind: "toggle",
      label: t.workouts?.pastTitle ?? "Past workouts",
      count: data.past.length,
      open: showPast,
    });
    if (showPast) {
      data.past.forEach((w) =>
        items.push({ kind: "workout", workout: w, variant: "past" }),
      );
    }
  }

  const empty =
    !loading &&
    !data.today.length &&
    !data.upcoming.length &&
    !data.past.length;

  return (
    <View style={[s.root, { backgroundColor: "#F0F4F8" }]}>
      <View
        style={[
          s.header,
          { backgroundColor: PRIMARY, paddingTop: insets.top + 10 },
        ]}
      >
        <View style={{ width: 40 }} />
        <Text style={s.headerTitle}>{t.workouts?.title ?? "Workouts"}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
      ) : empty ? (
        <View style={s.emptyWrap}>
          <Ionicons name="barbell-outline" size={48} color="#a0b8d0" />
          <Text style={s.emptyText}>
            {t.workouts?.noneAssigned ?? "No workouts assigned yet"}
          </Text>
          <Text style={s.emptyHint}>
            {t.workouts?.checkBackLater ?? "Your coach will add workouts here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) =>
            item.kind === "workout" ? item.workout._id : `${item.kind}-${i}`
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 32,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY}
            />
          }
          renderItem={({ item }) => {
            if (item.kind === "header") {
              return (
                <SectionHeader
                  label={item.label}
                  count={item.count}
                  theme={theme}
                />
              );
            }
            if (item.kind === "toggle") {
              return (
                <TouchableOpacity
                  style={section.row}
                  onPress={() => setShowPast((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={[section.label, { color: "#1a2c3d" }]}>
                    {item.label}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={[section.count, { color: "#7a9ab8" }]}>
                      {item.count}
                    </Text>
                    <Ionicons
                      name={item.open ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#7a9ab8"
                    />
                  </View>
                </TouchableOpacity>
              );
            }
            return (
              <WorkoutCard
                workout={item.workout}
                variant={item.variant}
                t={t}
                theme={theme}
                onPress={() =>
                  navigation.navigate("WorkoutDetail", { id: item.workout._id })
                }
              />
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a2c3d",
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: "#7a9ab8",
    textAlign: "center",
  },
});
