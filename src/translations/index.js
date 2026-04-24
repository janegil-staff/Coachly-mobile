// src/translations/index.js
// Translation loader. Returns the flat string table for a given language
// code, falling back to English for any missing key.

import strings from "./strings.js";

const SUPPORTED = ["no", "en", "nl", "fr", "de", "it", "sv", "da", "fi", "es", "pl", "pt"];
const DEFAULT_LANG = "en";

export function getTranslations(lang) {
  const code = SUPPORTED.includes(lang) ? lang : DEFAULT_LANG;
  const base = strings[DEFAULT_LANG];
  if (code === DEFAULT_LANG) return base;
  return { ...base, ...(strings[code] || {}) };
}

export function isSupportedLang(code) {
  return SUPPORTED.includes(code);
}

export const supportedLanguages = SUPPORTED;

export const languageLabels = {
  no: "Norsk",
  en: "English",
  nl: "Nederlands",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  sv: "Svenska",
  da: "Dansk",
  fi: "Suomi",
  es: "Español",
  pl: "Polski",
  pt: "Português",
};

export default getTranslations;
