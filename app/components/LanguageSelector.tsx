"use client";

import { useLanguage } from "@/app/lib/i18n/LanguageProvider";

import {
  LANGUAGE_OPTIONS,
  type Language,
} from "@/app/lib/i18n/translations";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newLanguage = event.target.value as Language;
    setLanguage(newLanguage);
  }

  return (
    <select
      value={language}
      onChange={handleChange}
      aria-label="Select language"
      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 outline-none transition hover:border-zinc-300 focus:border-zinc-400"
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option.code} value={option.code}>
          {option.shortLabel} — {option.label}
        </option>
      ))}
    </select>
  );
}