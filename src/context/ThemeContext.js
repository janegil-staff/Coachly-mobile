// src/context/ThemeContext.js
// Provides the active flat theme object + mode setter.

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme } from "../constants/theme";

const STORAGE_KEY = "@coachly:themeMode"; // "light" | "dark" | "system"

const ThemeContext = createContext({
  theme: lightTheme,
  mode: "system",
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("light");
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() || "light"
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setModeState(saved);
        }
      } catch {
        // ignore
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || "light");
    });
    return () => sub.remove();
  }, []);

  const setMode = async (next) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const effectiveScheme = mode === "system" ? systemScheme : mode;
  const theme = effectiveScheme === "dark" ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({ theme, mode, setMode, hydrated }),
    [theme, mode, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;