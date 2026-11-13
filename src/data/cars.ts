import inventory from "./inventory.json";
import media from "./media.json";
import { intlLocales, type Locale } from "@/i18n/config";
import { site } from "./site";

export type Body = "suv" | "sedan" | "coupe";
export type Paint = "black" | "rivieraBlue" | "matteBlue";

export type Image = {
  base: string;
  width: number;
  height: number;
  widths: number[];
  fallbackWidth: number;
  blur: string;
};

export type VideoNote = { video: string; poster: string; duration: number };

export type Installment = { downUsd: number; months: number; monthlyUsd: number; estimated: boolean };

export type Car = {
  slug: string;
  make: string;
  name: string;
  year?: number;
  mileageKm?: number;
  seats?: number;
  priceUsd?: number;
  body: Body;
  paint: Paint;
  posted: string;
  // True when the post had no caption and the details were read from the photos.
  unconfirmed: boolean;
  photos: Image[];
  note?: VideoNote;
  installment?: Installment;
};

type RawCar = (typeof inventory)[number] & {
  year?: number;
  mileageKm?: number;
  seats?: number;
  priceUsd?: number;
  unconfirmed?: boolean;
  installment?: { downUsd: number; months: number; monthlyUsd: number };
};

type MediaEntry = { photos: Image[]; note?: VideoNote };

const carMedia = media.cars as Record<string, MediaEntry>;

function installmentFor(raw: RawCar): Installment | undefined {
  if (raw.installment) return { ...raw.installment, estimated: false };
  if (!raw.priceUsd) return undefined;
  const { downShare, months, markup } = site.installment;
  const downUsd = Math.round(raw.priceUsd * downShare);
  const monthlyUsd = Math.round(((raw.priceUsd - downUsd) * (1 + markup)) / months);
  return { downUsd, months, monthlyUsd, estimated: true };
}

export const cars: Car[] = (inventory as RawCar[])
  .map((raw) => ({
    slug: raw.slug,
    make: raw.make,
    name: raw.name,
    year: raw.year,
    mileageKm: raw.mileageKm,
    seats: raw.seats,
    priceUsd: raw.priceUsd,
    body: raw.body as Body,
    paint: raw.paint as Paint,
    posted: raw.posted,
    unconfirmed: raw.unconfirmed ?? false,
    photos: carMedia[raw.slug]?.photos ?? [],
    note: carMedia[raw.slug]?.note,
    installment: installmentFor(raw),
  }))
  .sort((a, b) => b.posted.localeCompare(a.posted));

export const siteImages = media.site as Record<"heroWide" | "heroTall" | "showroom", Image>;

export function getCar(slug: string) {
  return cars.find((car) => car.slug === slug);
}

const featuredSlugs = [
  "mercedes-amg-g63",
  "mercedes-maybach-s680",
  "bmw-m4-cs-2024",
  "bentley-flying-spur-speed-2023",
  "range-rover-p530-lwb-2026",
];

export const featuredCars = featuredSlugs
  .map((slug) => getCar(slug))
  .filter((car): car is Car => Boolean(car));

export const makes = [...new Set(cars.map((car) => car.make))].sort();

export function formatUsd(amount: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocales[locale], {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocales[locale]).format(value);
}
