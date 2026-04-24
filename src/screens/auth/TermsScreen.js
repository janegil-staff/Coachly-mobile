// src/screens/auth/TermsScreen.js
// Static Terms & Privacy text. Replace body copy with your real terms.

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";

export default function TermsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const s = makeStyles(theme);

  return (
    <View style={[s.bg, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={16}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.termsLink}</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={s.h1}>Terms of Service</Text>
        <Text style={s.p}>
          Coachly is a personal training tracker operated by KBB Medic AS. By
          creating an account you agree to use the service in accordance with
          these terms. This is placeholder text — replace with your actual
          terms before publishing.
        </Text>

        <Text style={s.h2}>Account & Data</Text>
        <Text style={s.p}>
          Your training log, profile information, and any data you share with a
          coach are stored on our servers and synced to your device. You may
          delete your account at any time from Profile → Delete account.
        </Text>

        <Text style={s.h2}>Health Disclaimer</Text>
        <Text style={s.p}>
          Coachly is not a medical device and does not provide medical advice.
          Consult a qualified professional before starting any training
          program.
        </Text>

        <Text style={s.h1}>Privacy Policy</Text>
        <Text style={s.p}>
          We collect the minimum information needed to run the service: your
          email, name, and the training data you enter. We do not sell your
          data. Full privacy details are available at kbbmedic.no.
        </Text>

        <Text style={s.h2}>Contact</Text>
        <Text style={s.p}>
          KBB MEDIC AS — post@kbbmedic.no
        </Text>
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
      justifyContent: "space-between",
      paddingHorizontal: 12,
      height: 52,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: { width: 40, padding: 8 },
    headerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    scroll: {
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    h1: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      marginTop: 8,
      marginBottom: 12,
    },
    h2: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    },
    p: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.textSecondary,
      marginBottom: 8,
    },
  });
}