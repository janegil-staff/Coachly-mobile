// src/screens/profile/ProfileScreen.js
// Coachly Profile. Recover-style layout; Coachly data model.
// Fields come from user.clientProfile (gender/age/heightCm/weightKg).
// Email + PIN + language managed here; medications/advice/questionnaires are
// Recover-only and intentionally absent.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { authApi } from "../../services/api";
import { FontSize, Spacing } from "../../constants/theme";

// ── Gender SVG icons ─────────────────────────────────────────────────────
function FemaleSvg({ color, size = 48 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="14" r="8" stroke={color} strokeWidth="2" />
      <Path
        d="M16 14 Q16 6 24 6 Q32 6 32 14"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M10 38 C10 28 38 28 38 38"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M17 26 L14 38 M31 26 L34 38"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
function MaleSvg({ color, size = 48 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="14" r="8" stroke={color} strokeWidth="2" />
      <Path
        d="M10 38 C10 28 38 28 38 38"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M20 26 L24 30 L28 26"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
function UndefinedSvg({ color, size = 48 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M20 18 C20 14 28 14 28 19 C28 22 24 23 24 26"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="24" cy="31" r="1.5" fill={color} />
    </Svg>
  );
}
function LogoutIcon({ color = "#fff", size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 17l5-5-5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const GENDERS = [
  { value: "female", labelKey: "female", Svg: FemaleSvg },
  { value: "male", labelKey: "male", Svg: MaleSvg },
  { value: "undefined", labelKey: "genderUndefined", Svg: UndefinedSvg },
];

const ALL_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

function Row({ label, value, onPress, theme, last }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.border,
      }}
    >
      <Text style={{ color: theme.text, fontSize: FontSize.md }}>{label}</Text>
      <Text style={{ color: theme.textMuted, fontSize: FontSize.md }}>
        {value} ›
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation, route }) {
  const { user, logout, logoutAndClearPin, updateUser, savePin } = useAuth();
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const profile = user?.clientProfile ?? {};
  const [gender, setGender] = useState(profile.gender ?? "undefined");
  const [ageVal, setAgeVal] = useState(
    profile.age != null ? String(profile.age) : "",
  );
  const [heightVal, setHeightVal] = useState(
    profile.heightCm != null ? String(profile.heightCm) : "",
  );
  const [weightVal, setWeightVal] = useState(
    profile.weightKg != null ? String(profile.weightKg) : "",
  );
  const [saving, setSaving] = useState(false);

  // Sync state when user.clientProfile changes (e.g. after save)
  useEffect(() => {
    const p = user?.clientProfile ?? {};
    setGender(p.gender ?? "undefined");
    setAgeVal(p.age != null ? String(p.age) : "");
    setHeightVal(p.heightCm != null ? String(p.heightCm) : "");
    setWeightVal(p.weightKg != null ? String(p.weightKg) : "");
  }, [
    user?.clientProfile?.gender,
    user?.clientProfile?.age,
    user?.clientProfile?.heightCm,
    user?.clientProfile?.weightKg,
  ]);

  // If we came back from PIN change flow, there's a `pin` in route.params
  useEffect(() => {
    const newPin = route?.params?.newPin;
    const oldPin = route?.params?.oldPin;
    if (!newPin || !oldPin) return;
    (async () => {
      try {
        await authApi.changePassword({
          oldPassword: oldPin,
          newPassword: newPin,
        });
        await savePin(newPin);
        Alert.alert(t.saved ?? "Saved", t.pinUpdated ?? "PIN updated.");
      } catch (e) {
        Alert.alert("Error", e?.message ?? "Could not change PIN");
      } finally {
        // Clear params so this doesn't re-run on focus
        navigation.setParams({ newPin: undefined, oldPin: undefined });
      }
    })();
  }, [route?.params?.newPin, route?.params?.oldPin]);

  const p = user?.clientProfile ?? {};
  const isDirty =
    gender !== (p.gender ?? "undefined") ||
    ageVal !== (p.age != null ? String(p.age) : "") ||
    heightVal !== (p.heightCm != null ? String(p.heightCm) : "") ||
    weightVal !== (p.weightKg != null ? String(p.weightKg) : "");

  const saveChanges = async () => {
    setSaving(true);
    try {
      const patch = {};
      if (gender !== (p.gender ?? "undefined")) patch.gender = gender;
      if (ageVal !== (p.age != null ? String(p.age) : "")) {
        patch.age = ageVal ? parseInt(ageVal, 10) : null;
      }
      if (heightVal !== (p.heightCm != null ? String(p.heightCm) : "")) {
        patch.heightCm = heightVal ? parseInt(heightVal, 10) : null;
      }
      if (weightVal !== (p.weightKg != null ? String(p.weightKg) : "")) {
        patch.weightKg = weightVal ? parseFloat(weightVal) : null;
      }
      if (Object.keys(patch).length === 0) return;
      const updated = await authApi.updateProfile(patch);
      if (updated) updateUser(updated);
      Alert.alert(t.saved ?? "Saved", t.profileUpdated ?? "Profile updated.");
    } catch (e) {
      Alert.alert("Error", e?.message ?? "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        t.saveChanges ?? "Save changes?",
        t.unsavedChanges ?? "You have unsaved changes.",
        [
          { text: t.cancel ?? "Cancel", style: "cancel" },
          {
            text: t.discard ?? "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
          {
            text: t.save ?? "Save",
            onPress: async () => {
              await saveChanges();
              navigation.goBack();
            },
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  const currentLang =
    ALL_LANGUAGES.find((l) => l.code === (user?.language ?? "en")) ??
    ALL_LANGUAGES[0];

  const handleLogout = () =>
    Alert.alert(t.signOut ?? "Sign out", t.signOutMsg ?? "Are you sure?", [
      { text: t.cancel ?? "Cancel", style: "cancel" },
      { text: t.signOut ?? "Sign out", style: "destructive", onPress: logout },
    ]);

  const handleChangePin = () => {
    // Navigate through PinVerify → PinSetup → PinConfirm, returning to Profile
    // with { oldPin, newPin } once both are set.
    navigation.navigate("PinSetup", {
      returnTo: "Profile",
      verifyFirst: true, // signals PinSetup to ask for current first
    });
  };

  const s = makeStyles(theme, insets);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={s.headerBtn}>
          <Text style={s.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.settingsTitle ?? "Settings"}</Text>
        <TouchableOpacity style={s.headerBtnRight} onPress={handleLogout}>
          <LogoutIcon color="#fff" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gender */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            {t.chooseGender ?? "Choose gender"}
          </Text>
          <View style={s.genderRow}>
            {GENDERS.map(({ value, labelKey, Svg: GenderSvg }) => {
              const active = gender === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={s.genderItem}
                  onPress={() => setGender(value)}
                >
                  <View
                    style={[
                      s.genderCircle,
                      active && { backgroundColor: theme.accent },
                    ]}
                  >
                    <GenderSvg
                      color={active ? "#fff" : theme.accent}
                      size={44}
                    />
                  </View>
                  <Text
                    style={[
                      s.genderLabel,
                      active && { color: theme.accent, fontWeight: "700" },
                    ]}
                  >
                    {t[labelKey] ?? labelKey}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.divider} />

        {/* Age / Height / Weight / Email */}
        <View style={s.section}>
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{t.age ?? "Age"}</Text>
            <TextInput
              style={s.fieldInput}
              value={ageVal}
              onChangeText={(v) => setAgeVal(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={theme.textMuted}
              selectionColor={theme.accent}
            />
          </View>
          <View style={s.fieldLine} />

          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{t.heightCm ?? "Height (cm)"}</Text>
            <TextInput
              style={s.fieldInput}
              value={heightVal}
              onChangeText={(v) => setHeightVal(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={theme.textMuted}
              selectionColor={theme.accent}
            />
          </View>
          <View style={s.fieldLine} />

          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{t.weightKg ?? "Weight (kg)"}</Text>
            <TextInput
              style={s.fieldInput}
              value={weightVal}
              onChangeText={(v) =>
                setWeightVal(
                  v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"),
                )
              }
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={theme.textMuted}
              selectionColor={theme.accent}
            />
          </View>
          <View style={s.fieldLine} />

          <TouchableOpacity
            style={s.fieldRowWrap}
            onPress={() => navigation.navigate("ChangeEmail")}
            activeOpacity={0.7}
          >
            <View>
              <Text style={s.fieldLabel}>{t.email ?? "Email"}</Text>
              <Text style={s.fieldValue}>{user?.email ?? "—"}</Text>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: FontSize.md }}>
              ›
            </Text>
          </TouchableOpacity>
          <View style={s.fieldLine} />
        </View>

        {/* Save button only when dirty */}
        {isDirty && (
          <View
            style={{
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={saveChanges}
              disabled={saving}
              style={[s.saveBtn, saving && { opacity: 0.5 }]}
              activeOpacity={0.85}
            >
              <Text style={s.saveBtnText}>
                {saving ? "..." : (t.save ?? "Save").toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.divider} />

        {/* Settings rows */}
        <View style={s.section}>
          <Row
            label={t.changePin ?? "Change PIN"}
            value={t.change ?? "Change"}
            onPress={handleChangePin}
            theme={theme}
          />
          <Row
            label={t.language ?? "Language"}
            value={`${currentLang.flag} ${currentLang.label}`}
            onPress={() => navigation.navigate("Language")}
            theme={theme}
          />
          <Row
            label={t.termsTitle ?? "Terms & Conditions"}
            value={t.view ?? "View"}
            onPress={() => navigation.navigate("Terms")}
            theme={theme}
          />
          <Row
            label={t.about ?? "About"}
            value={t.readMore ?? "Read more"}
            onPress={() => navigation.navigate("About")}
            theme={theme}
            last
          />
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (t, insets) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bgSecondary ?? "#F0F4F8" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      backgroundColor: t.accent,
    },
    headerBtn: { width: 40 },
    headerBtnRight: { width: 40, alignItems: "flex-end" },
    headerBack: { color: "#fff", fontSize: 28, lineHeight: 34 },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
    },
    divider: {
      height: Spacing.md,
      backgroundColor: t.bgSecondary ?? "#F0F4F8",
    },
    section: { backgroundColor: t.bg ?? "#fff" },
    sectionTitle: {
      color: t.text,
      fontSize: FontSize.md,
      fontWeight: "500",
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    genderRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    genderItem: { alignItems: "center", gap: 8 },
    genderCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: t.accentBg ?? "#dde8f4",
      justifyContent: "center",
      alignItems: "center",
    },
    genderLabel: { color: t.textSecondary, fontSize: FontSize.md },
    fieldWrap: {
      paddingHorizontal: Spacing.lg,
      paddingTop: 14,
      paddingBottom: 0,
    },
    fieldLabel: { color: t.textMuted, fontSize: FontSize.sm, marginBottom: 2 },
    fieldInput: {
      color: t.text,
      fontSize: FontSize.lg,
      fontWeight: "500",
      paddingBottom: 10,
    },
    fieldRowWrap: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingTop: 14,
      paddingBottom: 10,
    },
    fieldValue: { color: t.text, fontSize: FontSize.lg, fontWeight: "500" },
    fieldLine: {
      height: 1,
      backgroundColor: t.border,
      marginHorizontal: Spacing.lg,
    },
    saveBtn: {
      height: 50,
      borderRadius: 10,
      backgroundColor: t.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    saveBtnText: {
      color: "#fff",
      fontSize: FontSize.md,
      fontWeight: "800",
      letterSpacing: 2,
    },
  });
