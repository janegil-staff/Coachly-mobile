import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import { LogsProvider } from "./src/context/LogsContext";
import { LangProvider } from "./src/context/LangContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LangProvider>
            <LogsProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </LogsProvider>
            </LangProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}