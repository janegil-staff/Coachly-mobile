// src/screens/settings/PersonalSettingsScreen.js
//
// Personal settings for Coachly.
// Currently exposes:
//   - Daily reminder toggle  (local push via expo-notifications)
//   - Time picker            (when reminders are on)
//   - Theme picker           (Light / Dark / System)
//
// Mirrors the Recover app's PersonalSettingsScreen pattern.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize, Spacing } from "../../constants/theme";
import {
  enableReminder,
  disableReminder,
  getSavedReminderTime,
  getSavedReminderEnabled,
} from "../../hooks/useReminder";

// ─────────────────────────────────────────────── helpers

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// ─────────────────────────────────────────────── ToggleRow

function ToggleRow({ label, subtitle, value, onValueChange, theme, last, extra }) {
  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.border,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
        {extra}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ─────────────────────────────────────────────── ThemeRow

function ThemeRow({ mode, setMode, theme, t, last }) {
  const OPTIONS = [
    { key: "light",  icon: "sunny-outline", label: t.themeLight  ?? "Light"  },
    { key: "dark",   icon: "moon-outline",  label: t.themeDark   ?? "Dark"   },
    { key: "system", icon: "phone-portrait-outline", label: t.themeSystem ?? "System" },
  ];

  return (
    <View
      style={[
        styles.themeRow,
        {
          borderBottomColor: theme.border,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={{ marginBottom: 10 }}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>
          {t.theme ?? "Theme"}
        </Text>
        <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
          {t.themeSubtitle ?? "Choose how Coachly looks"}
        </Text>
      </View>

      <View style={[styles.segWrap, { backgroundColor: theme.bgSecondary ?? theme.border + "33" }]}>
        {OPTIONS.map((opt) => {
          const active = mode === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.8}
              onPress={() => setMode(opt.key)}
              style={[
                styles.segBtn,
                active && {
                  backgroundColor: theme.bg ?? "#fff",
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                },
              ]}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={active ? theme.accent : theme.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segLabel,
                  { color: active ? theme.accent : theme.textSecondary },
                  active && { fontWeight: "700" },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────── Screen

export default function PersonalSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme, mode, setMode } = useTheme();
  const { t } = useLang();

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(() => {
    const d = new Date();
    d.setHours(20, 0, 0, 0); // default 20:00
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load saved reminder state from AsyncStorage on mount
  useEffect(() => {
    getSavedReminderTime().then(({ hour, minute }) => {
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      setReminderTime(d);
    });
    getSavedReminderEnabled().then(setReminderEnabled);
  }, []);

  // ── handlers ──────────────────────────────────────────
  const handleReminderToggle = async (val) => {
    setReminderEnabled(val);
    try {
      if (val) {
        await enableReminder(
          reminderTime.getHours(),
          reminderTime.getMinutes(),
          t.notifTitle ?? "Coachly",
          t.notifBody ?? "Time to check in with your training 💪",
        );
      } else {
        await disableReminder();
      }
    } catch (e) {
      // Permission denied or scheduling failed — revert the toggle
      Alert.alert(
        t.error ?? "Error",
        e?.message === "Notification permission denied"
          ? (t.notifPermissionDenied ??
            "Please enable notifications for Coachly in your device settings.")
          : (e?.message ?? "Could not set reminder."),
      );
      setReminderEnabled(!val);
    }
  };

  const handleTimeChange = async (event, selectedDate) => {
    // Android closes the picker on selection; iOS leaves it inline
    if (Platform.OS === "android") setShowTimePicker(false);
    if (!selectedDate) return;

    setReminderTime(selectedDate);

    if (reminderEnabled) {
      try {
        await enableReminder(
          selectedDate.getHours(),
          selectedDate.getMinutes(),
          t.notifTitle ?? "Coachly",
          t.notifBody ?? "Time to check in with your training 💪",
        );
      } catch (e) {
        Alert.alert(
          t.error ?? "Error",
          e?.message ?? "Could not update reminder.",
        );
      }
    }
  };

  // ── render ────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.bgSecondary ?? theme.bg ?? "#F0F4F8" }}>
      {/* Blue header — extends under the system status bar */}
      <View style={[styles.header, { backgroundColor: theme.accent, paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.headerBtn}
          hitSlop={12}
        >
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t.personalSettings ?? t.personal ?? "Personal settings"}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      >
        {/* ─── Notifications section ─── */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {(t.notifications ?? "Notifications").toUpperCase()}
        </Text>

        <View style={[styles.section, { backgroundColor: theme.card ?? theme.bg ?? "#fff" }]}>
          <ToggleRow
            theme={theme}
            label={t.notifications ?? "Notifications"}
            subtitle={
              reminderEnabled
                ? `${t.reminder ?? "Daily reminder"} — ${formatTime(reminderTime)}`
                : (t.notifSubtitleOff ??
                  "Get a daily reminder to log your training")
            }
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            last={!reminderEnabled}
          />

          {reminderEnabled ? (
            <TouchableOpacity
              style={[
                styles.row,
                { borderBottomWidth: 0, alignItems: "center" },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>
                  {t.reminderTime ?? "Reminder time"}
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: theme.accent }]}>
                {formatTime(reminderTime)}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ─── Appearance section ─── */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {(t.appearance ?? t.theme ?? "Appearance").toUpperCase()}
        </Text>

        <View style={[styles.section, { backgroundColor: theme.card ?? theme.bg ?? "#fff" }]}>
          <ThemeRow
            mode={mode}
            setMode={setMode}
            theme={theme}
            t={t}
            last
          />
        </View>

        {/* iOS shows the picker inline on demand; Android shows a system dialog */}
        {showTimePicker ? (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
          />
        ) : null}

        {/* iOS only — give the user a way to dismiss the spinner */}
        {Platform.OS === "ios" && showTimePicker ? (
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.accent }]}
            onPress={() => setShowTimePicker(false)}
          >
            <Text style={styles.doneBtnText}>
              {t.done ?? "Done"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────── styles

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerBtn: { width: 40, alignItems: "center" },
  headerBack: { color: "#fff", fontSize: 28, lineHeight: 34 },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: FontSize.lg,
    fontWeight: "600",
    textAlign: "center",
  },

  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  section: {
    marginHorizontal: Spacing.md,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  rowLabel: {
    fontSize: FontSize.md,
    fontWeight: "500",
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  rowValue: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },

  // Theme picker (segmented control)
  themeRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  segWrap: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  segLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },

  doneBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});