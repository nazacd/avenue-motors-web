import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { formatNumber, formatUsd, type Body, type Car, type Image } from "./cars";

// What a catalogue card shows, with the text already written in the page's language.
export type CardData = {
  slug: string;
  make: string;
  name: string;
  body: Body;
  posted: string;
  priceUsd?: number;
  year?: number;
  cover?: Image;
  poster?: string;
  price: string;
  mileage?: string;
};

export function toCard(car: Car, locale: Locale, dict: Dictionary): CardData {
  return {
    slug: car.slug,
    make: car.make,
    name: car.name,
    body: car.body,
    posted: car.posted,
    priceUsd: car.priceUsd,
    year: car.year,
    cover: car.photos[0],
    poster: car.note?.poster,
    price: car.priceUsd ? formatUsd(car.priceUsd, locale) : dict.car.onRequest,
    mileage: car.mileageKm ? `${formatNumber(car.mileageKm, locale)} ${dict.car.km}` : undefined,
  };
}
