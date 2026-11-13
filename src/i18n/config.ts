export const locales = ["ru", "uz", "en"] as const;

export type Locale = (typeof locales)[number];

// The showroom's channel is written in Russian, so Russian is the fallback.
export const defaultLocale: Locale = "ru";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const localeLabels: Record<Locale, { short: string; name: string }> = {
  ru: { short: "RU", name: "Русский" },
  uz: { short: "UZ", name: "O‘zbekcha" },
  en: { short: "EN", name: "English" },
};

export const intlLocales: Record<Locale, string> = {
  ru: "ru-RU",
  uz: "uz-UZ",
  en: "en-US",
};
