// src/screens/auth/PinVerifyScreen.js
// Shown on app launch when a PIN is stored locally.
// System numeric keyboard drives a hidden input (4 dots visible).
// Back button logs out — user returns to Login.

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Keyboard,
  Pressable,
  Alert,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { useAuth } from "../../context/AuthContext";
import { FontSize, Spacing } from "../../constants/theme";

const PIN_KEY = "userPin";

export default function PinVerifyScreen({ onSuccess, onFallback }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const { user, logoutAndClearPin } = useAuth();
  const insets = useSafeAreaInsets();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(id);
  }, []);

  const handleChange = async (val) => {
    if (checking) return;
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setError("");
    setPin(digits);

    if (digits.length === 4) {
      Keyboard.dismiss();
      setChecking(true);
      const stored = await SecureStore.getItemAsync(PIN_KEY);
      if (stored && stored === digits) {
        onSuccess?.();
      } else {
        setError(t.wrongPin ?? "Wrong PIN");
        setTimeout(() => {
          setPin("");
          setChecking(false);
          inputRef.current?.focus();
        }, 600);
      }
    }
  };

  const handleBack = async () => {
    Alert.alert(
      t.backToLogin ?? "Back to login?",
      t.backToLoginBody ??
        "You will be signed out and need to sign in again.",
      [
        { text: t.cancel ?? "Cancel", style: "cancel" },
        {
          text: t.confirm ?? "Confirm",
          style: "destructive",
          onPress: async () => {
            if (logoutAndClearPin) await logoutAndClearPin();
            onFallback?.();
          },
        },
      ]
    );
  };

  const handleForgot = () => {
    Alert.alert(
      t.forgotPin ?? "Forgot your PIN?",
      t.forgotPinBody ??
        "You will be signed out and need to sign in again.",
      [
        { text: t.cancel ?? "Cancel", style: "cancel" },
        {
          text: t.confirm ?? "Confirm",
          style: "destructive",
          onPress: async () => {
            if (logoutAndClearPin) await logoutAndClearPin();
            onFallback?.();
          },
        },
      ]
    );
  };

  const s = makeStyles(theme, insets);

  return (
    <View style={s.bg}>
      {/* Blue status-bar area — extends the header color up into the notch */}
      <StatusBar barStyle="light-content" backgroundColor={theme.accent} />
      <View style={s.statusFill} />

      {/* Blue header with back button */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={16} style={s.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.enterPin ?? "Enter PIN"}</Text>
        <View style={s.backBtn} />
      </View>

      {/* Body */}
      <Pressable
        style={s.body}
        onPress={() => inputRef.current?.focus()}
      >
        <View style={s.logoWrap}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={[s.wordmark, { color: theme.accent }]}>COACHLY</Text>
        </View>

        <Text style={[s.title, { color: theme.text }]}>
          {t.pinInputTitle ?? "Enter your PIN"}
        </Text>
        {!!user?.name && (
          <Text style={[s.subtitle, { color: theme.textSecondary }]}>
            {user.name}
          </Text>
        )}

        <TouchableOpacity
          style={s.dotsRow}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor:
                    i < pin.length ? theme.accent : "transparent",
                  borderColor: theme.border,
                },
              ]}
            />
          ))}
        </TouchableOpacity>

        <View style={s.errorRow}>
          {!!error && <Text style={s.error}>{error}</Text>}
        </View>

        <TouchableOpacity
          onPress={handleForgot}
          style={s.forgotRow}
          hitSlop={16}
        >
          <Text style={[s.forgotText, { color: theme.accent }]}>
            {t.forgotPin ?? "Forgot PIN?"}
          </Text>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value={pin}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={4}
          style={s.hidden}
          autoFocus
          caretHidden
          contextMenuHidden
          textContentType="oneTimeCode"
        />
      </Pressable>
    </View>
  );
}

function makeStyles(theme, insets) {
  return StyleSheet.create({
    bg: { flex: 1, backgroundColor: theme.bg },

    // Fills the status-bar area with the header color (extends behind notch)
    statusFill: {
      height: insets.top,
      backgroundColor: theme.accent,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingBottom: Spacing.sm,
      backgroundColor: theme.accent,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    body: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 24,
      paddingBottom: insets.bottom + 16,
    },

    logoWrap: { alignItems: "center", marginTop: 32, marginBottom: 28 },
    logo: { width: 90, height: 90, borderRadius: 18 },
    wordmark: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 4,
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: "600",
      textAlign: "center",
    },
    subtitle: {
      fontSize: FontSize.md,
      marginTop: 8,
      textAlign: "center",
    },
    dotsRow: {
      flexDirection: "row",
      gap: 20,
      marginTop: 40,
      paddingHorizontal: 32,
      paddingVertical: 16,
    },
    dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
    errorRow: {
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 4,
    },
    error: { color: "#C62828", fontSize: FontSize.sm, fontWeight: "600" },
    forgotRow: { marginTop: 28, padding: 8 },
    forgotText: { fontSize: FontSize.md, fontWeight: "600" },
    hidden: {
      position: "absolute",
      width: 1,
      height: 1,
      opacity: 0,
    },
  });
}
