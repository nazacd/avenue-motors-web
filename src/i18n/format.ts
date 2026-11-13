import { intlLocales, type Locale } from "./config";
import type { PluralForms } from "./dictionaries/en";

// Kept apart from the dictionaries so client components can format text without
// pulling every language into the browser bundle.

export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

export function plural(forms: PluralForms, n: number, locale: Locale) {
  const rule = new Intl.PluralRules(intlLocales[locale]).select(n) as keyof PluralForms;
  return fill(forms[rule] ?? forms.other, { n });
}
