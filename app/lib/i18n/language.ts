import {
  LANGUAGE_STORAGE_KEY,
  translations,
  type Language,
} from "./translations";

const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: string | null): value is Language {
  return (
    value === "en" ||
    value === "hi" ||
    value === "hinglish"
  );
}

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

export function saveLanguage(language: Language) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

  window.dispatchEvent(
    new CustomEvent("dayal-language-change", {
      detail: language,
    })
  );
}

export function getTranslations(language: Language) {
  return translations[language];
}