import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/context/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import { LogsProvider } from "./src/context/LogsContext";
import { AdviceProvider } from "./src/context/AdviceContext";
import { LangProvider } from "./src/context/LangContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LangProvider>
            <LogsProvider>
              <AdviceProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </AdviceProvider>
              </LogsProvider>
            </LangProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}