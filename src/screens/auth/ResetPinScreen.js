// src/screens/auth/ResetPinScreen.js
//
// Step 2 of the PIN reset flow:
//   - User enters the 6-digit code from email + chooses a new 4-digit PIN
//   - We POST /auth/reset-password — on success, backend returns
//     { user, accessToken, refreshToken } so the user is logged in immediately
//     without going back through /login.
//
// We hand the response to AuthContext.loginAfterReset, which mirrors what
// `login` does: persists the new PIN to SecureStore, flips pinVerified, and
// sets the user object so the app reroutes to the home stack.

import React, { useState, useRef } from "react";
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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { authApi } from "../../services/api";

export default function ResetPinScreen({ navigation, route }) {
  const { loginAfterReset } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const email = route?.params?.email ?? "";

  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pinRef = useRef(null);
  const pinConfirmRef = useRef(null);

  const s = makeStyles(theme);

  const submit = async () => {
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError(t.codeInvalid ?? "Code must be 6 digits");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError(t.pinInvalid ?? "PIN must be 4 digits");
      return;
    }
    if (pin !== pinConfirm) {
      setError(t.pinsDoNotMatch ?? "PINs do not match");
      return;
    }

    setLoading(true);
    try {
      // authApi.resetPin posts to /auth/reset-password and (matching the
      // pattern of authApi.login) returns the user object plus persists
      // tokens internally.
      const result = await authApi.resetPin(email, code, pin);
      const userObj = result?.user ?? result;

      if (!userObj) {
        throw new Error(t.codeOrPinInvalid ?? "Invalid or expired code");
      }

      await loginAfterReset({ email, pin, user: userObj });
      // No navigation call needed — AuthContext setting `user` flips the
      // root navigator from auth stack to app stack automatically.
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        (t.codeOrPinInvalid ?? "Invalid or expired code");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!email) return;
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPin(email);
      Alert.alert(
        t.codeResent ?? "Code sent",
        (t.codeResentBody ?? "We sent a new code to") + " " + email,
      );
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          (t.errNetwork ?? "Something went wrong"),
      );
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
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </TouchableOpacity>

          <Text style={s.title}>{t.resetPinTitle ?? "Enter the code"}</Text>
          <Text style={s.subtitle}>
            {(t.resetPinBody ?? "We sent a 6-digit code to") +
              ` ${email}. ` +
              (t.resetPinBody2 ?? "Enter it below along with your new PIN.")}
          </Text>

          {/* Code */}
          <View style={s.field}>
            <Text style={s.label}>{t.codeLabel ?? "Code"}</Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              style={[s.input, s.codeInput]}
              returnKeyType="next"
              onSubmitEditing={() => pinRef.current?.focus()}
            />
            <View style={s.underline} />
          </View>

          {/* New PIN */}
          <View style={s.field}>
            <Text style={s.label}>{t.newPin ?? "New PIN"}</Text>
            <TextInput
              ref={pinRef}
              value={pin}
              onChangeText={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={s.input}
              returnKeyType="next"
              onSubmitEditing={() => pinConfirmRef.current?.focus()}
            />
            <View style={s.underline} />
          </View>

          {/* Confirm PIN */}
          <View style={s.field}>
            <Text style={s.label}>{t.confirmPin ?? "Confirm new PIN"}</Text>
            <TextInput
              ref={pinConfirmRef}
              value={pinConfirm}
              onChangeText={(v) =>
                setPinConfirm(v.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={s.input}
              returnKeyType="done"
              onSubmitEditing={submit}
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
                {t.resetPinAction ?? "Reset PIN"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resendCode}
            disabled={loading}
            style={s.linkRow}
          >
            <Text style={s.linkSmall}>
              {t.resendCode ?? "Didn't get the email? Send again"}
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
    field: { marginBottom: 20 },
    label: {
      fontSize: 13,
      color: theme.textMuted,
      fontWeight: "600",
      marginBottom: 4,
    },
    input: {
      fontSize: 16,
      color: theme.inputText,
      paddingVertical: 10,
    },
    codeInput: {
      fontSize: 22,
      letterSpacing: 8,
      fontWeight: "600",
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
      marginTop: 16,
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