const fs = require("fs");
const path = require("path");

const files = [
  "src/screens/onboarding/OnboardingScreen.js",
  "src/screens/auth/LoginScreen.js",
  "src/screens/auth/RegisterScreen.js",
  "src/screens/auth/TermsScreen.js",
  "src/screens/auth/PinSetupScreen.js",
  "src/screens/auth/PinConfirmScreen.js",
  "src/screens/auth/PinInputScreen.js",
  "src/screens/auth/PinVerifyScreen.js",
  "src/screens/home/HomeScreen.js",
  "src/screens/home/MyDataScreen.js",
  "src/screens/log/LogEntryScreen.js",
  "src/screens/log/LogHistoryScreen.js",
  "src/screens/workouts/WorkoutsScreen.js",
  "src/screens/profile/ProfileScreen.js",
  "src/screens/profile/ChangeEmailScreen.js",
  "src/screens/settings/AboutScreen.js",
  "src/screens/settings/LanguageScreen.js",
  "src/screens/settings/PersonalSettingsScreen.js",
];

const template = (name) => `// Placeholder — replace with real implementation.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function ${name}() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>${name}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
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
`;

for (const f of files) {
  const name = path.basename(f, ".js");
  const abs = path.resolve(f);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, template(name), "utf8");
  console.log("Wrote:", f);
}
