import en, { type Dictionary, type PluralForms } from "./dictionaries/en";
import ru from "./dictionaries/ru";
import uz from "./dictionaries/uz";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, ru, uz };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export { fill, plural } from "./format";
export type { Dictionary, PluralForms };
