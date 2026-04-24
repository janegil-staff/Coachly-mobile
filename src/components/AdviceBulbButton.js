// src/components/AdviceBulbButton.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAdvice } from "../context/AdviceContext";

export default function AdviceBulbButton({ onPress, color = "#fff" }) {
  const { unreadCount } = useAdvice();
  return (
    <TouchableOpacity onPress={onPress} style={s.wrap} activeOpacity={0.7}>
      <Ionicons name="bulb-outline" size={26} color={color} />
      {unreadCount > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 4, position: "relative" },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800", lineHeight: 13 },
});
