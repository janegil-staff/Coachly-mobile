import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import { LangProvider } from "./src/context/LangContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LangProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </LangProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}