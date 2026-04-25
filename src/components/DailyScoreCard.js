// src/components/DailyScoreCard.js
import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LangContext";
import {
  toFiveScaleRounded,
  scoreBandKey,
  scoreBandColor,
} from "../utils/score";

/**
 * Today's daily score card.
 *
 * Props:
 *   score: DailyScore document (or null while loading / not yet computed)
 *   loading: boolean
 */
export default function DailyScoreCard({ score, loading }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(theme);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!score) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>{t.scores?.notYetLogged ?? "No score yet today"}</Text>
      </View>
    );
  }

  const bandKey = scoreBandKey(score.compositeScore);
  const bandLabel = bandKey ? t.scores?.bands?.[bandKey] ?? bandKey : "";
  const compositeColor = scoreBandColor(score.compositeScore, theme.colors);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{t.scores?.todayTitle ?? "Today"}</Text>

      <View style={styles.compositeRow}>
        <Text style={[styles.compositeNumber, { color: compositeColor }]}>
          {score.compositeScore}
        </Text>
        <View style={styles.compositeMeta}>
          <Text style={[styles.bandLabel, { color: compositeColor }]}>
            {bandLabel}
          </Text>
          {typeof score.streakDay === "number" && score.streakDay > 0 && (
            <Text style={styles.streakLabel}>
              🔥 {t.scores?.streakDays?.replace("{n}", score.streakDay) ??
                `${score.streakDay} day streak`}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.componentsRow}>
        <ComponentDot
          label={t.scores?.components?.wellbeing ?? "Wellbeing"}
          score={score.wellbeingScore}
          theme={theme}
        />
        <ComponentDot
          label={t.scores?.components?.sleep ?? "Sleep"}
          score={score.sleepScore}
          theme={theme}
        />
        <ComponentDot
          label={t.scores?.components?.workout ?? "Workout"}
          score={score.workoutScore}
          theme={theme}
        />
        <ComponentDot
          label={t.scores?.components?.nutrition ?? "Nutrition"}
          score={score.nutritionScore}
          theme={theme}
        />
      </View>
    </View>
  );
}

/** Single component dot showing a 1–5 indicator + label. */
function ComponentDot({ label, score, theme }) {
  const styles = makeStyles(theme);
  const stars = toFiveScaleRounded(score);
  const color = scoreBandColor(score, theme.colors);

  return (
    <View style={styles.componentItem}>
      <View style={styles.dotsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  stars !== null && i <= stars ? color : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.componentLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    heading: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    compositeRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    compositeNumber: {
      fontSize: 56,
      fontWeight: "700",
      lineHeight: 60,
      marginRight: 16,
    },
    compositeMeta: {
      flex: 1,
    },
    bandLabel: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 4,
    },
    streakLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    componentsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    componentItem: {
      flex: 1,
      alignItems: "center",
    },
    dotsRow: {
      flexDirection: "row",
      gap: 3,
      marginBottom: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    componentLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    emptyText: {
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  });
