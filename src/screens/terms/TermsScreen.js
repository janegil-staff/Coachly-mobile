// src/screens/terms/TermsScreen.js
//
// Terms & Conditions screen — content is fully translated via the i18n system.
// All section text comes from `t.terms*` keys in translations.js.

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize, Spacing, Radius } from "../../constants/theme";

const SECTIONS = [
  { titleKey: "termsSection1Title", bodyKey: "termsSection1Body" }, // Acceptance
  { titleKey: "termsSection2Title", bodyKey: "termsSection2Body" }, // Account
  { titleKey: "termsSection3Title", bodyKey: "termsSection3Body" }, // Acceptable use
  { titleKey: "termsSection4Title", bodyKey: "termsSection4Body" }, // Health disclaimer
  { titleKey: "termsSection5Title", bodyKey: "termsSection5Body" }, // Data & privacy
  { titleKey: "termsSection6Title", bodyKey: "termsSection6Body" }, // IP
  { titleKey: "termsSection7Title", bodyKey: "termsSection7Body" }, // Liability
  { titleKey: "termsSection8Title", bodyKey: "termsSection8Body" }, // Changes
  { titleKey: "termsSection9Title", bodyKey: "termsSection9Body" }, // Contact
];

export default function TermsScreen() {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const s = makeStyles(theme);

  const contactEmail = "jan.egi.staff@qupda.com";

  return (
    <View style={s.bg}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={16}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {t.termsTitle ?? "Terms & Conditions"}
        </Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.lastUpdated}>
          {t.termsLastUpdated ?? "Last updated: April 2026"}
        </Text>

        <Text style={s.intro}>
          {t.termsIntro ??
            "These Terms & Conditions govern your use of Coachly, operated by Qup DA. By using the app, you agree to these terms."}
        </Text>

        {SECTIONS.map((section, idx) => (
          <View key={section.titleKey} style={s.section}>
            <Text style={s.sectionTitle}>
              {idx + 1}. {t[section.titleKey] ?? section.titleKey}
            </Text>
            <Text style={s.sectionBody}>
              {t[section.bodyKey] ?? section.bodyKey}
            </Text>
          </View>
        ))}

        <View style={s.contactBox}>
          <Text style={s.contactLabel}>{t.termsContact ?? "Contact"}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
            activeOpacity={0.7}
          >
            <Text style={s.contactEmail}>{contactEmail}</Text>
          </TouchableOpacity>
          <Text style={s.contactCompany}>
            Qup DA · {t.operatesCoachly ?? "Operator of Coachly"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    bg: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      backgroundColor: theme.accent,
    },
    headerBtn: { width: 40, alignItems: "center" },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
    },
    scroll: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
    },
    lastUpdated: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      fontStyle: "italic",
      marginBottom: Spacing.md,
    },
    intro: {
      color: theme.text,
      fontSize: FontSize.md,
      lineHeight: 22,
      marginBottom: Spacing.xl,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      color: theme.accent,
      fontSize: FontSize.md,
      fontWeight: "700",
      marginBottom: Spacing.sm,
    },
    sectionBody: {
      color: theme.text,
      fontSize: FontSize.md,
      lineHeight: 22,
    },
    contactBox: {
      marginTop: Spacing.xl,
      padding: Spacing.lg,
      backgroundColor: theme.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    contactLabel: {
      color: theme.textMuted,
      fontSize: FontSize.sm,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: Spacing.sm,
    },
    contactEmail: {
      color: theme.accent,
      fontSize: FontSize.md,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    contactCompany: {
      color: theme.textSecondary,
      fontSize: FontSize.sm,
      marginTop: Spacing.xs,
    },
  });
}
