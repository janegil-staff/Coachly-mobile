// src/screens/settings/LanguageScreen.js
//
// List of supported languages. Tap to switch — updates LangContext locally
// (instant UI change) and persists to the server when logged in.
//
// The currently active language (from LangContext) is shown at the top
// and is highlighted in the list. Includes a quick search filter so users
// can type to find their language even with 12 options.

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
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
import { FontSize, Spacing, Radius } from "../../constants/theme";

const LANGUAGES = [
  { code: "no", label: "Norsk",      flag: "🇳🇴", endonym: "Norsk" },
  { code: "en", label: "English",    flag: "🇬🇧", endonym: "English" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪", endonym: "Deutsch" },
  { code: "da", label: "Dansk",      flag: "🇩🇰", endonym: "Dansk" },
  { code: "sv", label: "Svenska",    flag: "🇸🇪", endonym: "Svenska" },
  { code: "fi", label: "Suomi",      flag: "🇫🇮", endonym: "Suomi" },
  { code: "fr", label: "Français",   flag: "🇫🇷", endonym: "Français" },
  { code: "es", label: "Español",    flag: "🇪🇸", endonym: "Español" },
  { code: "it", label: "Italiano",   flag: "🇮🇹", endonym: "Italiano" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", endonym: "Nederlands" },
  { code: "pl", label: "Polski",     flag: "🇵🇱", endonym: "Polski" },
  { code: "pt", label: "Português",  flag: "🇵🇹", endonym: "Português" },
];

export default function LanguageScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const { lang, t, setLang } = useLang();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [savingCode, setSavingCode] = useState(null);
  const [query, setQuery] = useState("");

  const currentLanguage =
    LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[1]; // default English

  // Sort: current language first, then the rest alphabetically by their
  // own label. Then filter by search query.
  const visibleLanguages = useMemo(() => {
    const rest = LANGUAGES
      .filter((l) => l.code !== lang)
      .sort((a, b) => a.label.localeCompare(b.label));
    const ordered = [currentLanguage, ...rest];
    if (!query.trim()) return ordered;
    const q = query.trim().toLowerCase();
    return ordered.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.endonym.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [lang, query, currentLanguage]);

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
        {/* Current language banner */}
        <View style={[s.currentCard, { backgroundColor: theme.accent + "15", borderColor: theme.accent + "55" }]}>
          <Text style={[s.currentLabel, { color: theme.accent }]}>
            {t.currentLanguage ?? "Current language"}
          </Text>
          <View style={s.currentRow}>
            <Text style={s.flag}>{currentLanguage.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.currentName, { color: theme.text }]}>
                {currentLanguage.label}
              </Text>
              <Text style={[s.currentCode, { color: theme.textMuted }]}>
                {currentLanguage.code.toUpperCase()}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={28} color={theme.accent} />
          </View>
        </View>

        {/* Search input */}
        <View style={[s.searchWrap, { backgroundColor: theme.bg ?? "#fff", borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchLanguages ?? "Search languages"}
            placeholderTextColor={theme.textMuted}
            style={[s.searchInput, { color: theme.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Language list */}
        <View style={[s.list, { backgroundColor: theme.bg ?? "#fff" }]}>
          {visibleLanguages.length === 0 ? (
            <View style={s.empty}>
              <Text style={[s.emptyText, { color: theme.textMuted }]}>
                {t.noLanguagesFound ?? "No languages match"} "{query}"
              </Text>
            </View>
          ) : (
            visibleLanguages.map((item, idx) => {
              const active = lang === item.code;
              const isSaving = savingCode === item.code;
              const isLast = idx === visibleLanguages.length - 1;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    s.row,
                    { borderBottomColor: theme.border },
                    isLast && { borderBottomWidth: 0 },
                    active && { backgroundColor: theme.accent + "10" },
                  ]}
                  onPress={() => selectLanguage(item.code)}
                  activeOpacity={0.7}
                  disabled={!!savingCode}
                >
                  <Text style={s.flag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.label,
                        { color: theme.text },
                        active && { color: theme.accent, fontWeight: "700" },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={[s.codeLabel, { color: theme.textMuted }]}>
                      {item.code.toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.trailing}>
                    {isSaving ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : active ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={theme.accent}
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Helper text */}
        <Text style={[s.helper, { color: theme.textMuted }]}>
          {t.languageHelper ??
            "Your selection is saved to your account and synced across devices."}
        </Text>
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

    // Current language banner
    currentCard: {
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius?.md ?? 12,
      borderWidth: 1,
    },
    currentLabel: {
      fontSize: FontSize.xs,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    currentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    currentName: {
      fontSize: FontSize.lg,
      fontWeight: "700",
    },
    currentCode: {
      fontSize: FontSize.xs,
      fontWeight: "600",
      letterSpacing: 1,
      marginTop: 2,
    },

    // Search
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderRadius: Radius?.md ?? 12,
      borderWidth: 1,
    },
    searchInput: {
      flex: 1,
      fontSize: FontSize.md,
      padding: 0,
    },

    // Language list
    list: {
      marginTop: Spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    flag: { fontSize: 26, marginRight: Spacing.md },
    label: {
      fontSize: FontSize.md,
      fontWeight: "500",
    },
    codeLabel: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1,
      marginTop: 2,
    },
    trailing: { width: 28, alignItems: "center" },

    // Empty state
    empty: {
      paddingVertical: 32,
      alignItems: "center",
    },
    emptyText: {
      fontSize: FontSize.sm,
    },

    // Helper text below
    helper: {
      fontSize: FontSize.xs,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      lineHeight: 18,
    },
  });
}