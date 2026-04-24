// src/screens/settings/LanguageScreen.js
// List of supported languages. Tap to switch — updates LangContext locally
// (instant UI change) and persists to the server when logged in.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import { useTheme } from "../../context/ThemeContext";
import { authApi } from "../../services/api";
import { FontSize, Spacing } from "../../constants/theme";

const LANGUAGES = [
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

export default function LanguageScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const { lang, t, setLang } = useLang();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [savingCode, setSavingCode] = useState(null);

  const selectLanguage = async (code) => {
    if (code === lang || savingCode) return;

    // Instant UI change via local override
    await setLang(code);

    // Persist to server when logged in
    if (user) {
      setSavingCode(code);
      try {
        const updated = await authApi.updateProfile({ language: code });
        if (updated) updateUser(updated);
      } catch (e) {
        // Non-fatal — local override already applied
        console.warn("Failed to persist language:", e?.message);
      } finally {
        setSavingCode(null);
      }
    }
  };

  const s = makeStyles(theme);

  return (
    <View style={[s.root, { backgroundColor: theme.bgSecondary ?? "#F0F4F8" }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.headerBtn}
          hitSlop={12}
        >
          <Text style={s.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.language ?? "Language"}</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.list}>
          {LANGUAGES.map((item, idx) => {
            const active = lang === item.code;
            const isSaving = savingCode === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  s.row,
                  idx === LANGUAGES.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => selectLanguage(item.code)}
                activeOpacity={0.7}
                disabled={!!savingCode}
              >
                <Text style={s.flag}>{item.flag}</Text>
                <Text
                  style={[
                    s.label,
                    active && { color: theme.accent, fontWeight: "700" },
                  ]}
                >
                  {item.label}
                </Text>
                <View style={s.trailing}>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : active ? (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={theme.accent}
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      backgroundColor: theme.accent,
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
    list: {
      backgroundColor: theme.bg ?? "#fff",
      marginTop: Spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    flag: { fontSize: 24, marginRight: Spacing.md },
    label: {
      flex: 1,
      color: theme.text,
      fontSize: FontSize.md,
      fontWeight: "500",
    },
    trailing: { width: 28, alignItems: "center" },
  });
}
