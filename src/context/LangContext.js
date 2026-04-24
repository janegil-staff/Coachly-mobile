// src/context/LangContext.js
// Provides the active language code and the translation table.
// Persists the user's choice in AsyncStorage.
// Falls back to the device locale if nothing is persisted.

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTranslations, isSupportedLang, supportedLanguages } from "../translations";

const STORAGE_KEY = "@coachly:lang";
const DEFAULT_LANG = "en";

function detectDeviceLang() {
  try {
    let tag;
    if (Platform.OS === "ios") {
      tag =
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        "en";
    } else {
      tag = NativeModules.I18nManager?.localeIdentifier || "en";
    }
    const code = tag.toLowerCase().split(/[-_]/)[0];
    return isSupportedLang(code) ? code : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

const LangContext = createContext({
  lang: DEFAULT_LANG,
  t: getTranslations(DEFAULT_LANG),
  setLang: () => {},
  supportedLanguages,
});

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && isSupportedLang(saved)) {
          setLangState(saved);
        } else {
          setLangState(detectDeviceLang());
        }
      } catch {
        setLangState(detectDeviceLang());
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setLang = async (next) => {
    if (!isSupportedLang(next)) return;
    setLangState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const t = useMemo(() => getTranslations(lang), [lang]);

  const value = useMemo(
    () => ({ lang, t, setLang, supportedLanguages, hydrated }),
    [lang, t, hydrated]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export default LangContext;