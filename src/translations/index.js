// src/translations/index.js
// Translation loader — returns the string table for a language code,
// falling back to English for any missing key.
// Usage:
//   const t = getTranslations(lang);
//   <Text>{t.home.greeting}</Text>

import strings from "./strings.js";

const SUPPORTED = [
  "no", "en", "nl", "fr", "de",
  "it", "sv", "da", "fi", "es",
  "pl", "pt",
];

const DEFAULT_LANG = "en";

/**
 * Deep merge: overlay `override` on top of `base`.
 * Any key missing in `override` falls back to the `base` value.
 */
function deepMerge(base, override) {
  if (typeof base !== "object" || base === null) return override ?? base;
  if (typeof override !== "object" || override === null) return base;
  const out = { ...base };
  for (const key of Object.keys(override)) {
    out[key] = deepMerge(base[key], override[key]);
  }
  return out;
}

/**
 * Get the translation table for a given language code.
 * Always returns a complete object — missing keys fall back to English.
 */
export function getTranslations(lang) {
  const code = SUPPORTED.includes(lang) ? lang : DEFAULT_LANG;
  const base = strings[DEFAULT_LANG];
  if (code === DEFAULT_LANG) return base;
  return deepMerge(base, strings[code] || {});
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