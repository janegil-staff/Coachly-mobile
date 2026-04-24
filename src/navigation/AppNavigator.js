// src/navigation/AppNavigator.js
// Root navigator: decides which flow to show based on onboarding/auth/PIN state.
//
// Flow:
//   1. Hydrating → splash (returns null — App can show a splash elsewhere)
//   2. Not onboarded → OnboardingStack
//   3. No user → AuthStack (Login / Register / Terms)
//   4. User but PIN not set → PinSetupStack
//   5. User + PIN set + app just launched → PinVerifyStack
//   6. Verified → MainTabs (Home / Log / Workouts / Profile)

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { useTheme } from "../context/ThemeContext";

// Screens (lazy-friendly imports)
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import TermsScreen from "../screens/auth/TermsScreen";

// PIN
import PinSetupScreen from "../screens/auth/PinSetupScreen";
import PinConfirmScreen from "../screens/auth/PinConfirmScreen";
import PinInputScreen from "../screens/auth/PinInputScreen";
import PinVerifyScreen from "../screens/auth/PinVerifyScreen";

// Main
import HomeScreen from "../screens/home/HomeScreen";
import MyDataScreen from "../screens/home/MyDataScreen";
import LogEntryScreen from "../screens/log/LogEntryScreen";
import LogHistoryScreen from "../screens/log/LogHistoryScreen";
import WorkoutsScreen from "../screens/workouts/WorkoutsScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ChangeEmailScreen from "../screens/profile/ChangeEmailScreen";

// Settings
import AboutScreen from "../screens/settings/AboutScreen";
import LanguageScreen from "../screens/settings/LanguageScreen";
import PersonalSettingsScreen from "../screens/settings/PersonalSettingsScreen";

const ONBOARDED_KEY = "@coachly:onboarded";
const PIN_KEY = "coachly_pin"; // SecureStore

// ── Sub-navigators ─────────────────────────────────────────────────────────

const OnboardingStackNav = createNativeStackNavigator();
function OnboardingStack({ onDone }) {
  return (
    <OnboardingStackNav.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStackNav.Screen name="Onboarding">
        {(props) => <OnboardingScreen {...props} onDone={onDone} />}
      </OnboardingStackNav.Screen>
    </OnboardingStackNav.Navigator>
  );
}

const AuthStackNav = createNativeStackNavigator();
function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
      <AuthStackNav.Screen name="Terms" component={TermsScreen} />
    </AuthStackNav.Navigator>
  );
}

const PinSetupStackNav = createNativeStackNavigator();
function PinSetupStack({ onDone }) {
  return (
    <PinSetupStackNav.Navigator screenOptions={{ headerShown: false }}>
      <PinSetupStackNav.Screen name="PinSetup" component={PinSetupScreen} />
      <PinSetupStackNav.Screen name="PinConfirm">
        {(props) => <PinConfirmScreen {...props} onDone={onDone} />}
      </PinSetupStackNav.Screen>
    </PinSetupStackNav.Navigator>
  );
}

const PinVerifyStackNav = createNativeStackNavigator();
function PinVerifyStack({ onVerified }) {
  return (
    <PinVerifyStackNav.Navigator screenOptions={{ headerShown: false }}>
      <PinVerifyStackNav.Screen name="PinVerify">
        {(props) => <PinVerifyScreen {...props} onVerified={onVerified} />}
      </PinVerifyStackNav.Screen>
      <PinVerifyStackNav.Screen name="PinInput" component={PinInputScreen} />
    </PinVerifyStackNav.Navigator>
  );
}

// ── Main tabs ─────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();
function MainTabs() {
  const { theme } = useTheme();
  const { t } = useLang();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Home: "home-outline",
            Log: "add-circle-outline",
            Workouts: "barbell-outline",
            Profile: "person-outline",
          };
          return (
            <Ionicons name={iconMap[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: t.home?.todaysSession ? "Home" : "Home" }}
      />
      <Tab.Screen
        name="Log"
        component={LogStack}
        options={{ title: t.log?.entryTitle || "Log" }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsStack}
        options={{ title: t.workouts?.title || "Workouts" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: t.profile?.title || "Profile" }}
      />
    </Tab.Navigator>
  );
}

// ── Per-tab stacks (so each tab can push detail screens) ───────────────────

const HomeStackNav = createNativeStackNavigator();
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="MyData" component={MyDataScreen} />
    </HomeStackNav.Navigator>
  );
}

const LogStackNav = createNativeStackNavigator();
function LogStack() {
  return (
    <LogStackNav.Navigator screenOptions={{ headerShown: false }}>
      <LogStackNav.Screen name="LogEntry" component={LogEntryScreen} />
      <LogStackNav.Screen name="LogHistory" component={LogHistoryScreen} />
    </LogStackNav.Navigator>
  );
}

const WorkoutsStackNav = createNativeStackNavigator();
function WorkoutsStack() {
  return (
    <WorkoutsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutsStackNav.Screen name="WorkoutsMain" component={WorkoutsScreen} />
    </WorkoutsStackNav.Navigator>
  );
}

const ProfileStackNav = createNativeStackNavigator();
function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNav.Screen
        name="ChangeEmail"
        component={ChangeEmailScreen}
      />
      <ProfileStackNav.Screen name="About" component={AboutScreen} />
      <ProfileStackNav.Screen name="Language" component={LanguageScreen} />
      <ProfileStackNav.Screen
        name="PersonalSettings"
        component={PersonalSettingsScreen}
      />
    </ProfileStackNav.Navigator>
  );
}

// ── Root decider ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { theme, typography } = useTheme();

  const [onboarded, setOnboarded] = useState(null); // null | true | false
  const [hasPin, setHasPin] = useState(null); // null | true | false
  const [pinVerified, setPinVerified] = useState(false);

  // Hydrate onboarded flag
  useEffect(() => {
    (async () => {
      const val = await AsyncStorage.getItem(ONBOARDED_KEY);
      setOnboarded(val === "true");
    })();
  }, []);

  // Hydrate PIN presence when user changes
  useEffect(() => {
    (async () => {
      if (!user) {
        setHasPin(null);
        setPinVerified(false);
        return;
      }
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      setHasPin(!!storedPin);
    })();
  }, [user]);

  const handleOnboardingDone = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, "true");
    setOnboarded(true);
  };

  const handlePinSetupDone = () => {
    setHasPin(true);
    setPinVerified(true); // just set it, no need to re-verify now
  };

  const handlePinVerified = () => setPinVerified(true);

  const navTheme = {
    dark: theme.mode === "dark",
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
    fonts: {
      regular: { fontFamily: "System", fontWeight: "400" },
      medium: { fontFamily: "System", fontWeight: "500" },
      bold: { fontFamily: "System", fontWeight: "700" },
      heavy: { fontFamily: "System", fontWeight: "900" },
    },
  };

  // Still hydrating — return null (App.js can show a splash)
  if (authLoading || onboarded === null) {
    return null;
  }

  let root;
  if (!onboarded) {
    root = <OnboardingStack onDone={handleOnboardingDone} />;
  } else if (!user) {
    root = <AuthStack />;
  } else if (hasPin === null) {
    // Still checking PIN — null prevents flicker
    return null;
  } else if (!hasPin) {
    root = <PinSetupStack onDone={handlePinSetupDone} />;
  } else if (!pinVerified) {
    root = <PinVerifyStack onVerified={handlePinVerified} />;
  } else {
    root = <MainTabs />;
  }

  return <NavigationContainer theme={navTheme}>{root}</NavigationContainer>;
}
