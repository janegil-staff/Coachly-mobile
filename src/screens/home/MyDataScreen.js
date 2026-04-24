// Placeholder — replace with real implementation.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function MyDataScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]}>MyDataScreen</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Placeholder screen
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  subtitle: { fontSize: 14 },
});
