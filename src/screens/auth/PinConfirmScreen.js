// src/screens/auth/PinConfirmScreen.js
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
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize } from "../../constants/theme";

export default function PinConfirmScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const originalPin = route?.params?.pin ?? "";
  const oldPin = route?.params?.oldPin; // forwarded from PinSetup (profile flow)
  const returnTo = route?.params?.returnTo;
  const returnParams = route?.params?.returnParams ?? {};

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(id);
  }, []);

  const handleChange = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setError("");
    setPin(digits);
    if (digits.length === 4) {
      Keyboard.dismiss();
      setTimeout(() => {
        if (digits === originalPin) {
          if (returnTo) {
            // For profile flow: send { newPin, oldPin }. For register flow: send { pin }
            const extra = oldPin
              ? { newPin: digits, oldPin }
              : { pin: digits };
            navigation.navigate(returnTo, { ...returnParams, ...extra });
          } else {
            navigation.goBack();
          }
        } else {
          setError(t.pinMismatch ?? "PINs don't match. Try again.");
          setPin("");
          setTimeout(() => inputRef.current?.focus(), 120);
        }
      }, 140);
    }
  };

  const s = makeStyles(theme);

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
          source={require("../../../assets/images/logo.png")}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={[s.wordmark, { color: theme.accent }]}>COACHLY</Text>
      </View>

      <Text style={[s.title, { color: theme.text }]}>
        {t.confirmTitle ?? "Confirm PIN"}
      </Text>
      <Text style={[s.subtitle, { color: theme.textSecondary }]}>
        {t.confirmBody ?? "Enter the same PIN again."}
      </Text>

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
    dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
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
