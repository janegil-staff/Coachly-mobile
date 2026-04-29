// src/screens/auth/RegisterScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Modal,
  FlatList,
  Image,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { FontSize, Spacing, Radius } from "../../constants/theme";
import { authApi } from "../../services/api";

const LANGUAGES = [
  { code: "no", flag: "🇳🇴", label: "Norsk" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "da", flag: "🇩🇰", label: "Dansk" },
  { code: "sv", flag: "🇸🇪", label: "Svenska" },
  { code: "fi", flag: "🇫🇮", label: "Suomi" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "nl", flag: "🇳🇱", label: "Nederlands" },
  { code: "pl", flag: "🇵🇱", label: "Polski" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
];

const AGES = Array.from({ length: 83 }, (_, i) => String(i + 18));
const HEIGHTS = Array.from({ length: 101 }, (_, i) => String(i + 100));
const WEIGHTS = Array.from({ length: 181 }, (_, i) => String(i + 20));

function GenderIcon({ type, active, color, size = 44 }) {
  if (type === "female")
    return (
      <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <Circle
          cx="22"
          cy="11"
          r="7"
          stroke={color}
          strokeWidth="2.2"
          fill={active ? "rgba(255,255,255,0.25)" : "none"}
        />
        <Path
          d="M15 10 Q14 5 18 4"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <Path
          d="M29 10 Q30 5 26 4"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <Path
          d="M10 38 Q10 26 22 26 Q34 26 34 38"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill={active ? "rgba(255,255,255,0.15)" : "none"}
        />
        <Path
          d="M16 26 Q14 32 12 38 M28 26 Q30 32 32 38"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    );
  if (type === "male")
    return (
      <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <Circle
          cx="22"
          cy="11"
          r="7"
          stroke={color}
          strokeWidth="2.2"
          fill={active ? "rgba(255,255,255,0.25)" : "none"}
        />
        <Path
          d="M10 38 Q10 26 22 26 Q34 26 34 38"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill={active ? "rgba(255,255,255,0.15)" : "none"}
        />
        <Path
          d="M19 26 L22 30 L25 26"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Circle
        cx="22"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth="2.2"
        fill={active ? "rgba(255,255,255,0.25)" : "none"}
      />
      <Path
        d="M19 8 Q19 6 22 6 Q25 6 25 9 Q25 11 22 12 L22 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="22" cy="16.5" r="1" fill={color} />
      <Path
        d="M10 38 Q10 26 22 26 Q34 26 34 38"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill={active ? "rgba(255,255,255,0.15)" : "none"}
      />
    </Svg>
  );
}

function Field({ label, value, onChangeText, keyboardType, theme }) {
  return (
    <View style={{ width: "100%", marginBottom: Spacing.lg }}>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: FontSize.md,
          fontWeight: "600",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          color: theme.text,
          fontSize: FontSize.md,
          fontWeight: "500",
          paddingBottom: 8,
        }}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
        placeholderTextColor={theme.textMuted}
        selectionColor={theme.accent}
      />
      <View
        style={{ height: 2, backgroundColor: theme.inputLine, width: "100%" }}
      />
    </View>
  );
}

function Dropdown({ label, value, options, onSelect, unit, theme }) {
  const [open, setOpen] = useState(false);
  const s = makeStyles(theme);
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: FontSize.sm,
          fontWeight: "600",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TouchableOpacity
        style={[s.dropTrigger, open && { borderColor: theme.accent }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: value ? theme.text : theme.textMuted,
            fontSize: FontSize.md,
            fontWeight: "600",
          }}
        >
          {value ? `${value}${unit ?? ""}` : "—"}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 10 }}>▼</Text>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              s.modalSheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[s.modalTitle, { color: theme.text }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 260 }}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: 44,
                offset: 44 * index,
                index,
              })}
              initialScrollIndex={
                value ? Math.max(0, options.indexOf(value) - 2) : 0
              }
              renderItem={({ item }) => {
                const active = item === value;
                return (
                  <TouchableOpacity
                    style={[
                      s.modalItem,
                      { borderBottomColor: theme.border },
                      active && { backgroundColor: theme.accent + "18" },
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: active ? theme.accent : theme.text,
                        fontSize: FontSize.md,
                        fontWeight: active ? "700" : "500",
                      }}
                    >
                      {item}
                      {unit ?? ""}
                    </Text>
                    {active && (
                      <Text style={{ color: theme.accent, fontSize: 16 }}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function StepIndicator({ step, theme }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xl,
      }}
    >
      {[1, 2].map((n) => (
        <React.Fragment key={n}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: step >= n ? theme.accent : theme.surface,
              borderWidth: 2,
              borderColor: step >= n ? theme.accent : theme.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: step >= n ? "#fff" : theme.textMuted,
              }}
            >
              {n}
            </Text>
          </View>
          {n < 2 && (
            <View
              style={{
                width: 40,
                height: 2,
                backgroundColor: step >= 2 ? theme.accent : theme.border,
                marginHorizontal: 6,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function RegisterScreen({ navigation, route }) {
  const { register } = useAuth();
  const { theme } = useTheme();
  const { t, setLang } = useLang();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [pin, setPin] = useState("");
  const [tncAccepted, setTncAccepted] = useState(false);
  const [infoAccepted, setInfoAccepted] = useState(false);
  const [language, setLanguage] = useState("en");
  const [langOpen, setLangOpen] = useState(false);

  const [gender, setGender] = useState("female");
  const [age, setAge] = useState("18");
  const [height, setHeight] = useState("180");
  const [weight, setWeight] = useState("70");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = route?.params ?? {};
    if (p.pin) setPin(p.pin);
    if (p.email) setEmail(p.email);
    if (p.emailConfirm) setEmailConfirm(p.emailConfirm);
    if (p.language) setLanguage(p.language);
    if (p.tncAccepted !== undefined) setTncAccepted(Boolean(p.tncAccepted));
    if (p.infoAccepted !== undefined) setInfoAccepted(Boolean(p.infoAccepted));
    if (p.gender) setGender(p.gender);
    if (p.age) setAge(p.age);
    if (p.height) setHeight(p.height);
    if (p.weight) setWeight(p.weight);
    if (p.step) setStep(p.step);
  }, [route?.params]);

  const pinSet = pin.length === 4;
  const canStep1 =
    tncAccepted &&
    infoAccepted &&
    pinSet &&
    email.trim() &&
    emailConfirm.trim();

  const goToPinSetup = () =>
    navigation.navigate("PinSetup", {
      returnTo: "Register",
      returnParams: {
        email,
        emailConfirm,
        language,
        tncAccepted,
        infoAccepted,
        gender,
        age,
        height,
        weight,
        step: 1,
      },
    });

  const advanceToStep2 = async () => {
    setError("");
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email.trim())) {
      setError(`${t.email} invalid`);
      return;
    }
    if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
      setError(t.emailMismatch ?? "Emails do not match");
      return;
    }
    if (!pinSet) {
      setError(t.pinRequired ?? "PIN required");
      return;
    }
    if (!tncAccepted || !infoAccepted) {
      setError(t.acceptTermsRequired ?? "Please accept the terms");
      return;
    }

    setLoading(true);
    try {
      const { exists } = await authApi.checkEmail(email.trim().toLowerCase());
      if (exists) {
        setError(t.emailAlreadyExists ?? "Email already registered");
        return;
      }
    } catch (e) {
      setError(e?.message ?? "Could not verify email");
      return;
    } finally {
      setLoading(false);
    }
    setStep(2);
  };

  const submit = async () => {
    setError("");
    if (!age) {
      setError(`${t.age} ${t.isRequired ?? "is required"}`);
      return;
    }
    setLoading(true);
    try {
      await register({
        name: email?.split("@")[0] ?? "",
        email: email.trim().toLowerCase(),
        password: pin,
        language,
        age: parseInt(age, 10) || undefined,
        height: parseInt(height, 10) || 0,
        weight: parseInt(weight, 10) || 0,
        gender,
      });
      setLang(language);
    } catch (e) {
      setError(e?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const s = makeStyles(theme);

  return (
    <View style={s.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <StepIndicator step={step} theme={theme} />

          {step === 1 && (
            <>
              <Text style={s.sectionLabel}>{t.language}</Text>
              <View style={{ marginBottom: Spacing.xl }}>
                <TouchableOpacity
                  style={[
                    s.dropdown,
                    langOpen && { borderColor: theme.accent },
                  ]}
                  onPress={() => setLangOpen((o) => !o)}
                  activeOpacity={0.8}
                >
                  <Text style={s.dropdownFlag}>
                    {LANGUAGES.find((l) => l.code === language)?.flag ?? "🌐"}
                  </Text>
                  <Text style={[s.dropdownValue, { color: theme.text }]}>
                    {LANGUAGES.find((l) => l.code === language)?.label ??
                      language}
                  </Text>
                  <Text style={[s.dropdownArrow, { color: theme.textMuted }]}>
                    {langOpen ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {langOpen && (
                  <View
                    style={[
                      s.dropdownList,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                      },
                    ]}
                  >
                    {LANGUAGES.map(({ code, flag, label }) => {
                      const active = language === code;
                      return (
                        <TouchableOpacity
                          key={code}
                          style={[
                            s.dropdownItem,
                            active && { backgroundColor: theme.accent + "14" },
                            { borderBottomColor: theme.border },
                          ]}
                          onPress={() => {
                            setLanguage(code);
                            setLang(code);
                            setLangOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={s.dropdownFlag}>{flag}</Text>
                          <Text
                            style={[
                              s.dropdownItemLabel,
                              { color: active ? theme.accent : theme.text },
                              active && { fontWeight: "700" },
                            ]}
                          >
                            {label}
                          </Text>
                          {active && (
                            <Text style={{ color: theme.accent, fontSize: 16 }}>
                              ✓
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={s.fields}>
                {!!error && <Text style={s.error}>{error}</Text>}
                <Field
                  label={`${t.email}*`}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  theme={theme}
                />
                <Field
                  label={`${t.confirmEmail}*`}
                  value={emailConfirm}
                  onChangeText={setEmailConfirm}
                  keyboardType="email-address"
                  theme={theme}
                />
                <TouchableOpacity style={s.pinRow} onPress={goToPinSetup}>
                  <Text style={s.pinLabel}>{`${t.pinCode}*`}</Text>
                  <Text style={[s.pinAction, pinSet && s.pinDone]}>
                    {pinSet ? t.pinCreated : t.createPin}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: Spacing.lg }} />

              <View style={s.checkRow}>
                <TouchableOpacity
                  onPress={() => setTncAccepted(!tncAccepted)}
                  activeOpacity={0.7}
                >
                  <View style={[s.checkbox, tncAccepted && s.checkboxChecked]}>
                    {tncAccepted && <Text style={s.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={s.checkText}>
                  {t.acceptTerms}{" "}
                  <Text
                    style={s.checkLink}
                    onPress={() => navigation.navigate("Terms")}
                  >
                    {t.termsLink}
                  </Text>
                  {"\n"}
                  {t.includingPrivacy}
                </Text>
              </View>

              <View style={{ height: Spacing.md }} />

              <TouchableOpacity
                style={s.checkRow}
                onPress={() => setInfoAccepted(!infoAccepted)}
              >
                <View style={[s.checkbox, infoAccepted && s.checkboxChecked]}>
                  {infoAccepted && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.checkText}>{t.consentText}</Text>
              </TouchableOpacity>

              <View style={{ height: Spacing.xl }} />

              <TouchableOpacity
                style={[s.btn, !canStep1 && s.btnDisabled]}
                onPress={canStep1 ? advanceToStep2 : undefined}
                activeOpacity={canStep1 ? 0.85 : 1}
              >
                <Text style={s.btnText}>{t.letsStart ?? "CONTINUE →"}</Text>
              </TouchableOpacity>

              <View style={{ height: Spacing.xl }} />
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={s.alreadyText}>{t.alreadyAccount}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Image
                source={require("../../../assets/images/register_header.png")}
                style={s.headerImage}
                resizeMode="cover"
              />

              <Text style={s.sectionLabel}>{t.gender}</Text>
              <View style={s.genderRow}>
                {[
                  { key: "female", label: t.female, icon: "female" },
                  { key: "male", label: t.male, icon: "male" },
                  {
                    key: "undefined",
                    label: t.genderUndefined,
                    icon: "unknown",
                  },
                ].map(({ key, label, icon }) => {
                  const active = gender === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={s.genderItem}
                      onPress={() => setGender(key)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          s.genderCircle,
                          active
                            ? { backgroundColor: theme.accent }
                            : {
                                backgroundColor: theme.accentLight ?? "#dde8f4",
                              },
                        ]}
                      >
                        <GenderIcon
                          type={icon}
                          active={active}
                          color={active ? "#fff" : theme.accent}
                          size={44}
                        />
                      </View>
                      <Text
                        style={[
                          s.genderText,
                          active && { color: theme.accent, fontWeight: "700" },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {!!error && <Text style={s.error}>{error}</Text>}
              <View
                style={{
                  flexDirection: "row",
                  gap: Spacing.md,
                  marginBottom: Spacing.xl,
                }}
              >
                <Dropdown
                  label={`${t.age}*`}
                  value={age}
                  options={AGES}
                  onSelect={setAge}
                  theme={theme}
                />
                <Dropdown
                  label={t.heightCm ?? "Height"}
                  value={height}
                  options={HEIGHTS}
                  onSelect={setHeight}
                  unit=" cm"
                  theme={theme}
                />
                <Dropdown
                  label={t.weightKg ?? "Weight"}
                  value={weight}
                  options={WEIGHTS}
                  onSelect={setWeight}
                  unit=" kg"
                  theme={theme}
                />
              </View>

              <TouchableOpacity
                style={[s.btn, (!age || loading) && s.btnDisabled]}
                onPress={age && !loading ? submit : undefined}
                activeOpacity={age ? 0.85 : 1}
              >
                <Text style={s.btnText}>
                  {loading ? "..." : t.createAccount}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    bg: { flex: 1, backgroundColor: t.bg },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 30,
      paddingTop: 60,
      paddingBottom: 50,
    },
    sectionLabel: {
      color: t.textSecondary,
      fontSize: FontSize.md,
      fontWeight: "700",
      marginBottom: Spacing.md,
      marginTop: Spacing.sm,
      letterSpacing: 0.3,
    },
    genderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.xl,
    },
    genderItem: { alignItems: "center", flex: 1 },
    genderCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    genderText: {
      fontSize: FontSize.sm,
      color: t.textSecondary,
      fontWeight: "500",
    },
    fields: { width: "100%" },
    error: {
      color: "#C62828",
      fontSize: FontSize.sm,
      marginBottom: Spacing.md,
    },
    pinRow: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.lg,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: t.inputLine,
    },
    pinLabel: {
      color: t.textSecondary,
      fontSize: FontSize.md,
      fontWeight: "600",
    },
    pinAction: { color: t.accent, fontSize: FontSize.md, fontWeight: "700" },
    pinDone: { color: "#2E7D32" },
    dropdown: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: t.inputLine,
      borderRadius: Radius.md,
      backgroundColor: t.surface,
      gap: 10,
    },
    dropdownFlag: { fontSize: 20 },
    dropdownValue: { flex: 1, fontSize: FontSize.md, fontWeight: "600" },
    dropdownArrow: { fontSize: 11 },
    dropdownList: {
      borderWidth: 1.5,
      borderTopWidth: 0,
      borderBottomLeftRadius: Radius.md,
      borderBottomRightRadius: Radius.md,
      overflow: "hidden",
      marginTop: -2,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      gap: 10,
    },
    dropdownItemLabel: { flex: 1, fontSize: FontSize.md },
    dropTrigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderWidth: 1.5,
      borderColor: t.inputLine,
      borderRadius: Radius.sm,
      backgroundColor: t.surface,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    modalSheet: {
      width: "100%",
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      overflow: "hidden",
    },
    modalTitle: {
      fontSize: FontSize.md,
      fontWeight: "700",
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.08)",
    },
    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    checkRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 2.5,
      borderColor: t.accent,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2,
      flexShrink: 0,
    },
    checkboxChecked: { backgroundColor: t.accent, borderColor: t.accent },
    checkmark: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 16,
    },
    checkText: {
      color: t.text,
      fontSize: FontSize.sm,
      lineHeight: 20,
      flex: 1,
    },
    checkLink: {
      color: t.text,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    btn: {
      width: "100%",
      height: 56,
      backgroundColor: t.accent,
      borderRadius: 10,
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
      color: "#FFFFFF",
      fontSize: FontSize.md,
      fontWeight: "800",
      letterSpacing: 2,
    },
    alreadyText: {
      color: t.textSecondary,
      fontSize: FontSize.md,
      fontWeight: "600",
      textAlign: "center",
    },
    headerImage: {
      width: "100%",
      height: 180,
      borderRadius: Radius.lg,
      marginBottom: Spacing.xl,
      overflow: "hidden",
    },
  });
