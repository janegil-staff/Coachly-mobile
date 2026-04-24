// src/components/Rating.js
// Horizontal 1-5 rating slider. Tap a pill or drag across.
// No native dependency beyond PanResponder.

import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { FontSize, Spacing, Radius } from "../constants/theme";

export default function Rating({
  value,
  onChange,
  label,
  leftLabel,
  rightLabel,
  disabled = false,
}) {
  const { theme } = useTheme();
  const containerWidth = useRef(0);

  const setFromX = (x) => {
    const w = containerWidth.current;
    if (!w) return;
    const segment = w / 5;
    const raw = Math.floor(x / segment) + 1;
    const clamped = Math.max(1, Math.min(5, raw));
    if (clamped !== value) onChange(clamped);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (e) => {
        setFromX(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e) => {
        setFromX(e.nativeEvent.locationX);
      },
    })
  ).current;

  const s = makeStyles(theme, disabled);

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{value ?? "–"}</Text>
      </View>

      <View
        style={s.track}
        onLayout={(e) => {
          containerWidth.current = e.nativeEvent.layout.width;
        }}
        {...panResponder.panHandlers}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value != null && n <= value;
          return (
            <TouchableOpacity
              key={n}
              style={[
                s.pill,
                { backgroundColor: active ? theme.accent : theme.surface },
              ]}
              onPress={() => !disabled && onChange(n)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <Text
                style={[
                  s.pillText,
                  { color: active ? "#fff" : theme.textMuted },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.captions}>
        <Text style={s.caption}>{leftLabel}</Text>
        <Text style={s.caption}>{rightLabel}</Text>
      </View>
    </View>
  );
}

function makeStyles(theme, disabled) {
  return StyleSheet.create({
    wrap: { marginBottom: Spacing.lg, opacity: disabled ? 0.4 : 1 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 8,
    },
    label: {
      color: theme.text,
      fontSize: FontSize.md,
      fontWeight: "600",
    },
    value: {
      color: theme.accent,
      fontSize: FontSize.xl,
      fontWeight: "800",
    },
    track: {
      flexDirection: "row",
      gap: 6,
      height: 44,
    },
    pill: {
      flex: 1,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    pillText: {
      fontSize: FontSize.md,
      fontWeight: "700",
    },
    captions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    caption: {
      color: theme.textMuted,
      fontSize: FontSize.xs,
    },
  });
}
