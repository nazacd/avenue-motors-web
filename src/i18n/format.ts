import { intlLocales, type Locale } from "./config";
import type { PluralForms } from "./dictionaries/en";

// Kept apart from the dictionaries so client components can format text without
// pulling every language into the browser bundle.

export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

// What separates thousands in each language. This is done here and not with the
// browser's own number formatting because browsers do not all know every language:
// Chrome has no rules for Uzbek and writes 9,000 where the server wrote 9 000, and a
// page whose two halves disagree is thrown away and rebuilt.
const groupSeparators: Record<Locale, string> = { en: ",", ru: "\u00a0", uz: "\u00a0" };

// A whole number with its thousands separated: 9,000 in English, 9 000 in Russian and Uzbek.
export function groupDigits(value: number, locale: Locale) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparators[locale]);
}

export function plural(forms: PluralForms, n: number, locale: Locale) {
  const rule = new Intl.PluralRules(intlLocales[locale]).select(n) as keyof PluralForms;
  return fill(forms[rule] ?? forms.other, { n });
}
