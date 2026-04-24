// src/context/ThemeContext.js
// Provides the active theme (light/dark) and a setter.
// Supports "system" mode that follows the device setting.
// Persists the user's choice in AsyncStorage.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  lightTheme,
  darkTheme,
  spacing,
  radius,
  typography,
  shadows,
} from "../constants/theme";

const STORAGE_KEY = "@coachly:themeMode"; // "light" | "dark" | "system"

const ThemeContext = createContext({
  theme: lightTheme,
  mode: "system",
  setMode: () => {},
  spacing,
  radius,
  typography,
  shadows,
});

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("system");
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() || "light",
  );
  const [hydrated, setHydrated] = useState(false);

  // Load persisted mode on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setModeState(saved);
        }
      } catch {
        // ignore, fall through to default
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Listen to system scheme changes (for "system" mode)
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
      // ignore — state still updates in memory
    }
  };

  const effectiveScheme = mode === "system" ? systemScheme : mode;
  const baseTheme = effectiveScheme === "dark" ? darkTheme : lightTheme;
  const theme = { ...baseTheme, spacing, radius, typography, shadows };

  const value = useMemo(
    () => ({
      theme,
      mode,
      setMode,
      spacing,
      radius,
      typography,
      shadows,
      hydrated,
    }),
    [theme, mode, hydrated],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * makeStyles pattern — call with the theme to get a memoized StyleSheet.
 * Usage inside a screen:
 *   const { theme } = useTheme();
 *   const styles = useMemo(() => makeStyles(theme), [theme]);
 */
export default ThemeContext;
