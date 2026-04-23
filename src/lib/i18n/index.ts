import { useSyncExternalStore } from "react";
import { en } from "./en";
import { zh } from "./zh";

/* ─── Types ── */

export type Locale = "en" | "zh";
export type TranslationKey = keyof typeof en;
export type Translations = Record<TranslationKey, string>;

const translations: Record<Locale, Translations> = {
  en: en as Translations,
  zh: zh as Translations,
};

/* ─── Store ── */

const STORAGE_KEY = "pokeshrimp-locale";
let currentLocale: Locale = "en";
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function getSnapshot(): Locale {
  return currentLocale;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ─── Init from localStorage ── */

if (typeof window !== "undefined") {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored === "zh" || stored === "en") {
    currentLocale = stored;
  }
}

/* ─── Public API ── */

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }
  emit();
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, () => "en");
}

export function useT(): Translations {
  const locale = useLocale();
  return translations[locale];
}

export function getT(): Translations {
  return translations[currentLocale];
}
