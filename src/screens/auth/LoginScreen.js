// src/screens/auth/LoginScreen.js
// Login with email + 4-digit PIN. Recover-style Hodepinedagboken layout.

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
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";

const APP_VERSION = "1.0.0";
const COMPANY = "KBB MEDIC AS";
const EMAIL = "post@kbbmedic.no";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const s = makeStyles(theme);

  const submit = async () => {
    setError("");
    if (!email.trim()) {
      setError(t.required);
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be 4 digits");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), pin);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t.invalidCredentials;
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
          {/* Logo + wordmark */}
          <View style={s.logoWrap}>
            <Image
              source={require("../../../assets/images/coachly-logo.png")}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.wordmark}>COACHLY</Text>
          </View>

          {/* Title */}
          <Text style={s.title}>{t.loginTitle}</Text>

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
              style={s.input}
            />
            <View style={s.underline} />
          </View>

          {/* PIN */}
          <View style={s.field}>
            <TextInput
              value={pin}
              onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
              placeholder="PIN"
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={s.input}
            />
            <View style={s.underline} />
          </View>

          {!!error && <Text style={s.error}>{error}</Text>}

          {/* Submit */}
          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonPrimaryText} />
            ) : (
              <Text style={s.buttonText}>{t.signIn}</Text>
            )}
          </TouchableOpacity>

          {/* Links */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={s.linkRow}
          >
            <Text style={s.linkMuted}>{t.noAccount} </Text>
            <Text style={s.link}>{t.createAccount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Terms")}
            style={s.linkRow}
          >
            <Text style={s.linkSmall}>{t.termsLink}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={s.footerText}>{COMPANY}</Text>
          <Text style={s.footerText}>{EMAIL}</Text>
          <Text style={s.footerTextSmall}>v{APP_VERSION}</Text>
        </View>
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
      paddingTop: 24,
      paddingBottom: 24,
    },
    logoWrap: {
      alignItems: "center",
      marginTop: 8,
      marginBottom: 32,
    },
    logo: {
      width: 110,
      height: 110,
      borderRadius: 22,
    },
    wordmark: {
      marginTop: 12,
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: 4,
      color: theme.accent,
    },
    title: {
      fontSize: 22,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 24,
      textAlign: "center",
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
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 20,
    },
    linkMuted: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    link: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "600",
    },
    linkSmall: {
      color: theme.textMuted,
      fontSize: 12,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 8,
      alignItems: "center",
    },
    footerText: {
      color: theme.textMuted,
      fontSize: 11,
      lineHeight: 16,
    },
    footerTextSmall: {
      color: theme.textMuted,
      fontSize: 10,
      marginTop: 2,
    },
  });
}