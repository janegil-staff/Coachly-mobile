// src/screens/auth/ForgotPinScreen.js
//
// Step 1 of the PIN reset flow:
//   - User confirms their email
//   - We POST /auth/forgot-password and unconditionally navigate to ResetPin.
//     Backend always returns 200 to prevent email enumeration, so we always
//     proceed to the next screen — if the email isn't registered, the user
//     just won't get an email.

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { authApi } from "../../services/api";

export default function ForgotPinScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState(route?.params?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const s = makeStyles(theme);

  const submit = async () => {
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError(t.invalidEmail ?? "Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPin(trimmed);
      // Always navigate forward — backend returns 200 even when email
      // isn't registered (anti-enumeration). User will only see the email
      // if they actually have an account.
      navigation.navigate("ResetPin", { email: trimmed });
    } catch (e) {
      // Network / server errors only — anything 4xx/5xx that breaks the request
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        (t.errNetwork ?? "Something went wrong");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.bg, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </TouchableOpacity>

          <Text style={s.title}>{t.forgotPinTitle ?? "Reset your PIN"}</Text>
          <Text style={s.subtitle}>
            {t.forgotPinBody ??
              "Enter your email and we'll send you a 6-digit code to reset your PIN."}
          </Text>

          {/* Email */}
          <View style={s.field}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t.email}
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={s.input}
            />
            <View style={s.underline} />
          </View>

          {!!error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonPrimaryText} />
            ) : (
              <Text style={s.buttonText}>
                {t.sendCode ?? "Send reset code"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.linkRow}
          >
            <Text style={s.linkSmall}>
              {t.backToLogin ?? "Back to sign in"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    bg: { flex: 1, backgroundColor: theme.bg },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 24,
    },
    backBtn: { width: 40, padding: 8, marginLeft: -8, marginBottom: 16 },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: 32,
    },
    field: { marginBottom: 16 },
    input: {
      fontSize: 16,
      color: theme.inputText,
      paddingVertical: 10,
    },
    underline: {
      height: 1,
      backgroundColor: theme.border,
    },
    error: {
      color: theme.danger,
      fontSize: 13,
      marginTop: 4,
      marginBottom: 8,
      textAlign: "center",
    },
    button: {
      marginTop: 24,
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
      color: theme.buttonPrimaryText,
      fontSize: 16,
      fontWeight: "600",
    },
    linkRow: {
      alignItems: "center",
      marginTop: 24,
    },
    linkSmall: {
      color: theme.textMuted,
      fontSize: 14,
    },
  });
}
