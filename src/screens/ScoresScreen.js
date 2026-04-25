// src/screens/ScoresScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";

import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LangContext";
import DailyScoreCard from "../components/DailyScoreCard";
import {
  toFiveScaleRounded,
  scoreBandColor,
} from "../utils/score";

export default function ScoresScreen() {
  const { theme } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(theme);

  const [todayScore, setTodayScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScores = useCallback(async () => {
    try {
      // Today's score
      const todayRes = await axios.get("/api/scores/today");
      setTodayScore(todayRes.data?.data ?? null);

      // Last 30 days
      const to = new Date().toISOString().slice(0, 10);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const from = fromDate.toISOString().slice(0, 10);

      const histRes = await axios.get(`/api/scores?from=${from}&to=${to}`);
      // Sort newest first for the list
      const list = (histRes.data?.data ?? []).slice().reverse();
      setHistory(list);
    } catch (err) {
      console.warn("[ScoresScreen] load failed:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const onRefresh = () => {
    setRefreshing(true);
    loadScores();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => <HistoryRow item={item} theme={theme} />}
        ListHeaderComponent={
          <>
            <DailyScoreCard score={todayScore} loading={false} />
            {history.length > 0 && (
              <Text style={styles.sectionHeading}>
                {t.scores?.recent ?? "Recent"}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t.scores?.noHistory ?? "No score history yet"}
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

function HistoryRow({ item, theme }) {
  const styles = makeStyles(theme);
  const stars = toFiveScaleRounded(item.compositeScore);
  const color = scoreBandColor(item.compositeScore, theme.colors);

  // Format date as "Mon 24 Apr"
  const d = new Date(item.date);
  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <View style={styles.row}>
      <Text style={styles.rowDate}>{dateLabel}</Text>
      <View style={styles.rowDots}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.rowDot,
              {
                backgroundColor:
                  stars !== null && i <= stars ? color : theme.colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.rowScore, { color }]}>{item.compositeScore}</Text>
    </View>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    rowDate: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
    },
    rowDots: {
      flexDirection: "row",
      gap: 3,
      marginRight: 16,
    },
    rowDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    rowScore: {
      fontSize: 16,
      fontWeight: "600",
      minWidth: 32,
      textAlign: "right",
    },
    emptyText: {
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
    },
  });
