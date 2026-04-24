// src/screens/home/HomeScreen.js
// Coachly Home — matches Recover's layout: blue header, stats list, 4-cell grid,
// pinned Log Today button. No data context yet — stats show placeholders until
// a LogsContext is wired up.

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize, Spacing, Radius } from "../../constants/theme";

const { width } = Dimensions.get("window");

function WaveBackground({ color }) {
  return (
    <Svg
      width={width}
      height={300}
      viewBox={`0 0 ${width} 300`}
      style={StyleSheet.absoluteFill}
    >
      <Path
        d={`M0 80 Q${width * 0.25} 20 ${width * 0.5} 80 Q${width * 0.75} 140 ${width} 80 L${width} 300 L0 300 Z`}
        fill={color}
        opacity="0.07"
      />
      <Path
        d={`M0 120 Q${width * 0.3} 60 ${width * 0.6} 120 Q${width * 0.85} 160 ${width} 100 L${width} 300 L0 300 Z`}
        fill={color}
        opacity="0.05"
      />
      <Path
        d={`M0 160 Q${width * 0.4} 100 ${width * 0.7} 150 Q${width * 0.9} 180 ${width} 130 L${width} 300 L0 300 Z`}
        fill={color}
        opacity="0.04"
      />
    </Svg>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  // TODO: wire up a LogsContext later — for now, placeholders.
  const stats = {
    sessionsLogged: 0,
    avgEffort: "–",
    avgMood: "–",
    avgEnergy: "–",
    topWorkout: "–",
  };
  const hasTodayLog = false;

  const statRows = [
    { labelKey: "sessionsLogged", value: stats.sessionsLogged, icon: "calendar-outline" },
    { labelKey: "avgEffort", value: stats.avgEffort, icon: "flash-outline" },
    { labelKey: "avgMood", value: stats.avgMood, icon: "happy-outline" },
    { labelKey: "avgEnergy", value: stats.avgEnergy, icon: "battery-charging-outline" },
    { labelKey: "topWorkout", value: stats.topWorkout, icon: "barbell-outline" },
  ];

  const menuItems = [
    { labelKey: "myDiary", screen: "History", icon: "book-outline" },
    { labelKey: "myData", screen: "MyData", icon: "stats-chart-outline" },
    { labelKey: "shareData", screen: "Share", icon: "share-social-outline" },
    { labelKey: "myWorkouts", screen: "Workouts", icon: "barbell-outline" },
  ];

  const s = makeStyles(theme, insets);

  return (
    <View style={s.safe}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={s.headerBtn}
          hitSlop={12}
        >
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.appName}>{t.appName}</Text>
          <Text style={s.tagline}>{t.tagline}</Text>
        </View>
        <View style={s.headerBtn} />
      </View>

      {/* Scroll */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionTitle}>{t.last30days}</Text>

        <View style={s.statsList}>
          {statRows.map((row) => (
            <View key={row.labelKey} style={s.statRow}>
              <Ionicons name={row.icon} size={28} color={theme.accent} />
              <Text style={s.statLabel}>{t[row.labelKey]}</Text>
              <Text style={s.statValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.gridWrap}>
          <WaveBackground color={theme.accent} />
          <View style={s.grid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.labelKey}
                style={s.gridCard}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.75}
              >
                <Ionicons name={item.icon} size={44} color={theme.accent} />
                <Text style={s.gridLabel}>{t[item.labelKey]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Log Today — pinned bottom */}
      <View
        style={[
          s.bottomWrap,
          { paddingBottom: (insets.bottom || 16) + Spacing.md },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Log")}
          activeOpacity={0.88}
          style={s.logBtnWrap}
        >
          <View style={[s.logBtnInner, { backgroundColor: theme.accent }]}>
            <Ionicons
              name={hasTodayLog ? "pencil" : "clipboard-outline"}
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 10 }}
            />
            <Text style={s.logBtnText}>
              {hasTodayLog ? t.editToday : t.logToday}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(t, insets = { top: 44 }) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.bg },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
      backgroundColor: t.accent,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: "hidden",
    },
    headerBtn: { width: 40, alignItems: "center" },
    headerCenter: { alignItems: "center", flex: 1 },
    appName: {
      color: "#FFFFFF",
      fontSize: FontSize.lg,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    tagline: {
      color: "rgba(255,255,255,0.75)",
      fontSize: FontSize.xs,
      letterSpacing: 0.8,
      marginTop: 3,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingTop: Spacing.xl },

    sectionTitle: {
      color: t.text,
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },

    statsList: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    statRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9 },
    statLabel: {
      flex: 1,
      color: t.text,
      fontSize: FontSize.md,
      marginLeft: Spacing.md,
    },
    statValue: {
      color: t.accent,
      fontSize: FontSize.lg,
      fontWeight: "700",
    },

    gridWrap: {
      position: "relative",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      marginTop: -Spacing.md,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
    gridCard: {
      width: (width - Spacing.lg * 2 - Spacing.md) / 2,
      backgroundColor: t.surface,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.accentBorder ?? t.border,
      shadowColor: t.accent,
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    gridLabel: {
      color: t.accent,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.4,
      textAlign: "center",
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },

    bottomWrap: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      backgroundColor: t.bg,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    logBtnWrap: {
      width: "100%",
      borderRadius: 10,
      overflow: "hidden",
    },
    logBtnInner: {
      flexDirection: "row",
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    logBtnText: {
      color: "#FFFFFF",
      fontSize: FontSize.sm,
      fontWeight: "800",
      letterSpacing: 2,
    },
  });
}
