// src/components/calendar/DayActionModal.js
// Small action picker shown when user taps a calendar cell with logged data.
// Three buttons: Edit (navigates), Preview (shows details modal), Cancel.

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize } from "../../constants/theme";

// Format a YYYY-MM-DD date string to a readable header like "Friday, May 6"
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
  const dayIdx = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
  return `${weekdays[dayIdx]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function DayActionModal({
  visible,
  date,
  onEdit,
  onPreview,
  onCancel,
}) {
  const { theme } = useTheme();
  const { t } = useLang();

  const surface = theme.surface ?? "#fff";
  const text = theme.text ?? "#2d4a6e";
  const muted = theme.textMuted ?? "#7a9ab8";
  const accent = theme.accent ?? "#4a7ab5";
  const border = theme.border ?? "#dde5ee";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={s.backdrop} onPress={onCancel}>
        <Pressable
          style={[s.card, { backgroundColor: surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[s.dateHeader, { color: text }]}>
            {formatDateHeader(date, t)}
          </Text>
          <Text style={[s.subhead, { color: muted }]}>
            {t.whatToDo ?? "What would you like to do?"}
          </Text>

          {/* Edit — primary action, filled */}
          <TouchableOpacity
            style={[s.btnPrimary, { backgroundColor: accent }]}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={s.btnPrimaryText}>{t.edit ?? "Edit"}</Text>
          </TouchableOpacity>

          {/* Preview — secondary, outlined */}
          <TouchableOpacity
            style={[s.btnSecondary, { borderColor: border }]}
            onPress={onPreview}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={18} color={accent} />
            <Text style={[s.btnSecondaryText, { color: accent }]}>
              {t.preview ?? "Preview"}
            </Text>
          </TouchableOpacity>

          {/* Cancel — tertiary, ghost */}
          <TouchableOpacity
            style={s.btnGhost}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[s.btnGhostText, { color: muted }]}>
              {t.cancel ?? "Cancel"}
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dateHeader: {
    fontSize: FontSize.lg ?? 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  subhead: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 8,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  btnGhost: {
    paddingVertical: 11,
    alignItems: "center",
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
