import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LangContext";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";

export default function DeleteAccountScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const { logout } = useAuth();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (pin.length < 4) {
      Alert.alert(
        t.deleteAccountErrorTitle ?? "Deletion Failed",
        t.deleteAccountPinRequired ?? "Please enter your PIN",
      );
      return;
    }

    setLoading(true);
    try {
      await authApi.deleteAccount(pin);

      // Clean up local state too
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      await AsyncStorage.clear().catch(() => {});

      Alert.alert(
        t.deleteAccountSuccessTitle ?? "Account Deleted",
        t.deleteAccountSuccessMessage ??
          "Your account and all associated data have been permanently deleted.",
        [{ text: "OK", onPress: () => logout?.() }],
      );
    } catch (err) {
      Alert.alert(
        t.deleteAccountErrorTitle ?? "Deletion Failed",
        err.message ||
          t.deleteAccountErrorMessage ||
          "Could not delete account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      t.deleteAccountFinalConfirmTitle ?? "Are you absolutely sure?",
      t.deleteAccountFinalConfirmMessage ??
        "Your account and all data will be permanently deleted. This cannot be undone.",
      [
        { text: t.cancel ?? "Cancel", style: "cancel" },
        {
          text: t.deleteAccountConfirmButton ?? "Delete My Account",
          style: "destructive",
          onPress: handleDelete,
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: theme.text,
          marginBottom: 16,
        }}
      >
        {t.deleteAccountTitle ?? "Delete Account"}
      </Text>

      <View
        style={{
          backgroundColor: theme.bgSecondary ?? theme.surface ?? "#f5f5f5",
          borderLeftWidth: 4,
          borderLeftColor: "#d9534f",
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 15, marginBottom: 12 }}>
          {t.deleteAccountWarning ??
            "Deleting your account will permanently remove the following data:"}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 12,
          }}
        >
          {"\u2022 "}
          {t.deleteAccountWarningSessions ?? "All training sessions and logs"}
          {"\n"}
          {"\u2022 "}
          {t.deleteAccountWarningQuestionnaires ??
            "All questionnaire responses (PSS-10, PSQI, IPAQ-SF)"}
          {"\n"}
          {"\u2022 "}
          {t.deleteAccountWarningShares ?? "All share codes with your coach"}
          {"\n"}
          {"\u2022 "}
          {t.deleteAccountWarningProfile ??
            "Your profile, goals, and personal settings"}
        </Text>
        <Text style={{ color: "#d9534f", fontSize: 14, fontWeight: "600" }}>
          {t.deleteAccountWarningIrreversible ??
            "This action cannot be undone."}
        </Text>
      </View>

      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
      >
        <TouchableOpacity
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: confirmed ? "#d9534f" : theme.border,
            backgroundColor: confirmed ? "#d9534f" : "transparent",
            marginRight: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => setConfirmed(!confirmed)}
        >
          {confirmed && (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {"\u2713"}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={{ flex: 1, color: theme.text, fontSize: 14 }}>
          {t.deleteAccountUnderstand ??
            "I understand that this will permanently delete my account and all associated data."}
        </Text>
      </View>

      <Text style={{ color: theme.text, fontSize: 14, marginBottom: 8 }}>
        {t.deleteAccountEnterPinPrompt ?? "Enter your PIN to confirm"}
      </Text>
      <TextInput
        style={{
          backgroundColor: theme.surface ?? theme.bg,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          padding: 14,
          color: theme.text,
          fontSize: 16,
          marginBottom: 20,
        }}
        value={pin}
        onChangeText={setPin}
        placeholder={t.deleteAccountPinPlaceholder ?? "PIN"}
        placeholderTextColor={theme.textSecondary}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        editable={confirmed && !loading}
      />

      <TouchableOpacity
        style={{
          backgroundColor: "#d9534f",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 12,
          opacity: !confirmed || pin.length < 4 || loading ? 0.5 : 1,
        }}
        onPress={confirmDelete}
        disabled={!confirmed || pin.length < 4 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {t.deleteAccountConfirmButton ?? "Delete My Account"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={{ padding: 16, alignItems: "center" }}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
          {t.cancel ?? "Cancel"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}