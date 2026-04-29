// src/screens/auth/PinSetupScreen.js
// Two modes:
//   - Default (from Register): enter new PIN, navigate to PinConfirm
//   - verifyFirst (from Profile): enter CURRENT PIN first, then enter new PIN,
//     then navigate to PinConfirm with oldPin in params

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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize } from "../../constants/theme";

export default function PinSetupScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const returnTo = route?.params?.returnTo;
  const returnParams = route?.params?.returnParams ?? {};
  const verifyFirst = route?.params?.verifyFirst === true;

  // phase: "verify" (enter current PIN) | "new" (enter new PIN)
  const [phase, setPhase] = useState(verifyFirst ? "verify" : "new");
  const [oldPin, setOldPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(id);
  }, [phase]);

  const handleChange = async (val) => {
    if (checking) return;
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setError("");
    setPin(digits);

    if (digits.length !== 4) return;

    Keyboard.dismiss();

    if (phase === "verify") {
      setChecking(true);
      const stored = await SecureStore.getItemAsync("userPin");
      if (stored && stored === digits) {
        setOldPin(digits);
        setPin("");
        setPhase("new");
        setChecking(false);
      } else {
        setError(t.wrongPin ?? "Wrong PIN");
        setTimeout(() => {
          setPin("");
          setChecking(false);
          inputRef.current?.focus();
        }, 600);
      }
      return;
    }

    // phase === "new" — advance to PinConfirm
    setTimeout(() => {
      navigation.navigate("PinConfirm", {
        pin: digits,
        oldPin: oldPin || undefined,
        returnTo,
        returnParams,
      });
      setPin("");
    }, 140);
  };

  const s = makeStyles(theme);

  const title =
    phase === "verify"
      ? (t.enterCurrentPin ?? "Enter current PIN")
      : (t.setupTitle ?? "Create a PIN");
  const body =
    phase === "verify"
      ? (t.enterCurrentPinBody ??
          "Enter your current 4-digit PIN to continue.")
      : (t.setupBody ?? "Choose a 4-digit PIN to protect your account.");

  return (
    <Pressable
      style={[
        s.bg,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
      onPress={() => inputRef.current?.focus()}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={16}
        style={s.backBtn}
      >
        <Ionicons name="chevron-back" size={26} color={theme.text} />
      </TouchableOpacity>

      <View style={s.logoWrap}>
        <Image
          source={require("../../../assets/images/coachly-logo.png")}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={[s.wordmark, { color: theme.accent }]}>COACHLY</Text>
      </View>

      <Text style={[s.title, { color: theme.text }]}>{title}</Text>
      <Text style={[s.subtitle, { color: theme.textSecondary }]}>{body}</Text>

      <TouchableOpacity
        style={s.dotsRow}
        onPress={() => inputRef.current?.focus()}
        activeOpacity={1}
      >
        {[0, 1, 2, 3].map((i) => {
          const filled = i < pin.length;
          return (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor: filled ? theme.accent : theme.surface,
                  borderColor: filled ? theme.accent : theme.accent + "55",
                },
              ]}
            />
          );
        })}
      </TouchableOpacity>

      <View style={s.errorRow}>
        {!!error && <Text style={s.error}>{error}</Text>}
      </View>

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
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    bg: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: "center",
      paddingHorizontal: 24,
    },
    backBtn: { alignSelf: "flex-start", padding: 8, marginLeft: -8 },
    logoWrap: { alignItems: "center", marginTop: 24, marginBottom: 32 },
    logo: { width: 80, height: 80, borderRadius: 16 },
    wordmark: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 4,
    },
    title: { fontSize: FontSize.xl, fontWeight: "600", textAlign: "center" },
    subtitle: {
      fontSize: FontSize.md,
      marginTop: 8,
      textAlign: "center",
      paddingHorizontal: 16,
    },
    dotsRow: {
      flexDirection: "row",
      gap: 20,
      marginTop: 48,
      paddingHorizontal: 32,
      paddingVertical: 16,
    },
    dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
    errorRow: {
      height: 24,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 16,
    },
    error: { color: "#C62828", fontSize: FontSize.sm, fontWeight: "600" },
    hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
  });
}