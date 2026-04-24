// src/screens/profile/ChangeEmailScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { authApi } from "../../services/api";
import { FontSize, Spacing, Radius } from "../../constants/theme";

function Field({ label, value, onChangeText, keyboardType, theme, error, secureTextEntry }) {
  return (
    <View style={{ width: "100%", marginBottom: Spacing.lg }}>
      <Text style={{ color: theme.textSecondary, fontSize: FontSize.md, fontWeight: "600", marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        style={{ color: theme.text, fontSize: FontSize.md, fontWeight: "500", paddingBottom: 8 }}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
        placeholderTextColor={theme.textMuted}
        selectionColor={theme.accent}
        secureTextEntry={secureTextEntry}
      />
      <View style={{ height: 2, backgroundColor: error ? "#EF4444" : theme.inputLine, width: "100%" }} />
      {error ? <Text style={{ color: "#EF4444", fontSize: FontSize.xs, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export default function ChangeEmailScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    const rx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rx.test(newEmail.trim())) e.newEmail = t.emailInvalid ?? "Invalid email";
    if (newEmail.trim().toLowerCase() !== confirmEmail.trim().toLowerCase())
      e.confirmEmail = t.emailMismatch ?? "Emails do not match";
    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase())
      e.newEmail = t.emailSameAsCurrent ?? "Same as current email";
    if (pin.length !== 4) e.pin = t.pinRequired ?? "Enter your 4-digit PIN";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const updated = await authApi.changeEmail({
        newEmail: newEmail.trim().toLowerCase(),
        password: pin,
      });
      if (updated) updateUser(updated);
      Alert.alert(
        t.saved ?? "Saved",
        t.emailUpdated ?? "Email updated successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      setErrors({ general: err?.message ?? "Failed to update email." });
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(theme, insets);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Text style={s.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.changeEmail ?? "Change Email"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={{ marginBottom: Spacing.xl }}>
            <Text style={{ color: theme.textSecondary, fontSize: FontSize.md, fontWeight: "600", marginBottom: 6 }}>
              {t.currentEmail ?? "Current email"}
            </Text>
            <Text style={{ color: theme.text, fontSize: FontSize.md, fontWeight: "500", paddingBottom: 8 }}>
              {user?.email ?? "—"}
            </Text>
            <View style={{ height: 2, backgroundColor: theme.inputLine }} />
          </View>

          {errors.general && (
            <Text style={{ color: "#EF4444", fontSize: FontSize.sm, marginBottom: Spacing.md }}>
              {errors.general}
            </Text>
          )}

          <Field
            label={`${t.newEmail ?? "New email"}*`}
            value={newEmail}
            onChangeText={(v) => {
              setNewEmail(v);
              setErrors((e) => ({ ...e, newEmail: undefined }));
            }}
            keyboardType="email-address"
            theme={theme}
            error={errors.newEmail}
          />

          <Field
            label={`${t.confirmEmail ?? "Confirm new email"}*`}
            value={confirmEmail}
            onChangeText={(v) => {
              setConfirmEmail(v);
              setErrors((e) => ({ ...e, confirmEmail: undefined }));
            }}
            keyboardType="email-address"
            theme={theme}
            error={errors.confirmEmail}
          />

          <Field
            label={`${t.pinCode ?? "PIN"}*`}
            value={pin}
            onChangeText={(v) => {
              setPin(v.replace(/\D/g, "").slice(0, 4));
              setErrors((e) => ({ ...e, pin: undefined }));
            }}
            keyboardType="number-pad"
            theme={theme}
            error={errors.pin}
            secureTextEntry
          />

          <View style={{ height: Spacing.xl }} />

          <TouchableOpacity
            style={[
              s.btn,
              (!newEmail || !confirmEmail || pin.length < 4 || loading) && s.btnDisabled,
            ]}
            onPress={submit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>
              {loading ? "..." : (t.save ?? "SAVE").toUpperCase()}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (t, insets) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      backgroundColor: t.accent,
    },
    headerBtn: { width: 40 },
    headerBack: { color: "#fff", fontSize: 28, lineHeight: 34 },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
    },
    scroll: {
      paddingHorizontal: 30,
      paddingTop: Spacing.xl,
      paddingBottom: 50,
    },
    btn: {
      width: "100%",
      height: 56,
      backgroundColor: t.accent,
      borderRadius: Radius.md,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: t.accent,
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: {
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "800",
      letterSpacing: 2,
    },
  });
