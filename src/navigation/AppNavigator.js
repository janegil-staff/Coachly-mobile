// src/navigation/AppNavigator.js
// Post-login: single stack, Home is the root. No tabs.

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// Onboarding
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import PinSetupScreen from "../screens/auth/PinSetupScreen";
import PinConfirmScreen from "../screens/auth/PinConfirmScreen";
import TermsScreen from "../screens/auth/TermsScreen";
import PinVerifyScreen from "../screens/auth/PinVerifyScreen";

// Main
import HomeScreen from "../screens/home/HomeScreen";
import MyDataScreen from "../screens/home/MyDataScreen";
import LogEntryScreen from "../screens/log/LogEntryScreen";
import LogHistoryScreen from "../screens/log/LogHistoryScreen";
import WorkoutsScreen from "../screens/workouts/WorkoutsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import AdviceScreen from "../screens/advice/AdviceScreen";
import ShareScreen from "../screens/share/ShareScreen";
import StudiesScreen from "../screens/studies/StudiesScreen";
import QuestionnaireHubScreen from "../screens/questionnaires/QuestionnaireHubScreen";
import HooperScreen from "../screens/questionnaires/HooperScreen";
import RestqScreen from "../screens/questionnaires/RestqScreen";
import ChangeEmailScreen from "../screens/profile/ChangeEmailScreen";
import AboutScreen from "../screens/settings/AboutScreen";
import LanguageScreen from "../screens/settings/LanguageScreen";
import PersonalSettingsScreen from "../screens/settings/PersonalSettingsScreen";

const ONBOARDED_KEY = "@coachly:onboarded";

const Stack = createNativeStackNavigator();

// ── Onboarding ──────────────────────────────────────────────────────────────
function OnboardingStack({ onDone }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding">
        {(props) => <OnboardingScreen {...props} onDone={onDone} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// ── Auth (pre-login) ────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
      <Stack.Screen name="PinConfirm" component={PinConfirmScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
}

// ── Main app (post-login) ───────────────────────────────────────────────────
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Log" component={LogEntryScreen} />
      <Stack.Screen name="History" component={LogHistoryScreen} />
      <Stack.Screen name="MyData" component={MyDataScreen} />
      <Stack.Screen name="Workouts" component={WorkoutsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Advice" component={AdviceScreen} />
      <Stack.Screen name="Share" component={ShareScreen} />
      <Stack.Screen name="Studies" component={StudiesScreen} />
      <Stack.Screen name="QuestionnaireHub" component={QuestionnaireHubScreen} />
      <Stack.Screen name="Hooper" component={HooperScreen} />
      <Stack.Screen name="Restq" component={RestqScreen} />
      <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="PersonalSettings" component={PersonalSettingsScreen} />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
      <Stack.Screen name="PinConfirm" component={PinConfirmScreen} />
    </Stack.Navigator>
  );
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, loading: authLoading, pinVerified, setPinVerified } = useAuth();
  const { theme } = useTheme();

  const [onboarded, setOnboarded] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((val) => {
      setOnboarded(val === "true");
    });
  }, []);

  const handleOnboardingDone = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, "true");
    setOnboarded(true);
  };

  const navTheme = {
    dark: theme.mode === "dark",
    colors: {
      primary: theme.accent,
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.accent,
    },
    fonts: {
      regular: { fontFamily: "System", fontWeight: "400" },
      medium: { fontFamily: "System", fontWeight: "500" },
      bold: { fontFamily: "System", fontWeight: "700" },
      heavy: { fontFamily: "System", fontWeight: "900" },
    },
  };

  if (authLoading || onboarded === null) return null;

  let activeKey;
  let activeStack;

  if (!onboarded) {
    activeKey = "onboarding";
    activeStack = <OnboardingStack onDone={handleOnboardingDone} />;
  } else if (!user) {
    activeKey = "auth";
    activeStack = <AuthStack />;
  } else if (!pinVerified) {
    return (
      <PinVerifyScreen
        onSuccess={() => setPinVerified(true)}
        onFallback={() => setPinVerified(true)}
      />
    );
  } else {
    activeKey = "app";
    activeStack = <AppStack />;
  }

  return (
    <NavigationContainer key={activeKey} theme={navTheme}>
      {activeStack}
    </NavigationContainer>
  );
}