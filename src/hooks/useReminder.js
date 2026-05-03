// src/hooks/useReminder.js
//
// Daily local reminder for Coachly.
// Mirrors the pattern used in the Recover app.
//
// Public API:
//   enableReminder(hour, minute, title, body)
//   disableReminder()
//   getSavedReminderEnabled()        -> boolean
//   getSavedReminderTime()           -> { hour, minute }
//   restoreReminderOnLaunch(title, body)
//   testReminder(title, body)        -> fires after 5s, useful while developing

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Namespaced so Coachly never collides with other Qup DA apps on the same device
const TIME_KEY    = "coachly:reminderTime";    // "HH:MM"
const ENABLED_KEY = "coachly:reminderEnabled"; // "1" | "0"

// ─── Foreground handler (module-level so it's set before App mounts) ───
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Permissions ───
async function requestPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === "granted";
}

// ─── Scheduling primitives ───
async function cancelReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function scheduleReminder(hour, minute, title, body) {
  await cancelReminder();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: "daily",
      hour,
      minute,
      repeats: true,
    },
  });
}

// ─── Persistence ───
export async function getSavedReminderTime() {
  try {
    const val = await AsyncStorage.getItem(TIME_KEY);
    if (!val) return { hour: 20, minute: 0 }; // default 20:00
    const [h, m] = val.split(":").map(Number);
    return { hour: h, minute: m };
  } catch {
    return { hour: 20, minute: 0 };
  }
}

async function saveReminderTime(hour, minute) {
  await AsyncStorage.setItem(
    TIME_KEY,
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  );
}

export async function getSavedReminderEnabled() {
  try {
    const val = await AsyncStorage.getItem(ENABLED_KEY);
    return val === "1";
  } catch {
    return false;
  }
}

async function saveReminderEnabled(enabled) {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
}

// ─── Public API ───
export async function enableReminder(hour, minute, title, body) {
  const granted = await requestPermission();
  if (!granted) throw new Error("Notification permission denied");
  await saveReminderTime(hour, minute);
  await saveReminderEnabled(true);
  await scheduleReminder(hour, minute, title, body);
}

export async function disableReminder() {
  await saveReminderEnabled(false);
  await cancelReminder();
}

// Call once at app launch — re-arms the notification if the OS cleared it
// (e.g. after reboot or app reinstall) so the user keeps getting their reminder.
export async function restoreReminderOnLaunch(title, body) {
  try {
    const enabled = await getSavedReminderEnabled();
    if (!enabled) return;

    const granted = await requestPermission();
    if (!granted) return;

    const { hour, minute } = await getSavedReminderTime();
    await scheduleReminder(hour, minute, title, body);
  } catch {
    // silently fail — never block app launch
  }
}

// Dev helper — fires after 5 seconds
export async function testReminder(title, body) {
  const granted = await requestPermission();
  if (!granted) throw new Error("Notification permission denied");
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { type: "timeInterval", seconds: 5, repeats: false },
  });
  return id;
}
