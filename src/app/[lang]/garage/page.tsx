import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Garage, type GarageEntry } from "@/components/garage/Garage";
import { formatUsd, getCar } from "@/data/cars";
import { garageCars } from "@/data/garage";
import { getDictionary } from "@/i18n";
import { isLocale, locales } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/garage">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: getDictionary(lang).garage.label,
    alternates: {
      canonical: `/${lang}/garage`,
      languages: Object.fromEntries(locales.map((code) => [code, `/${code}/garage`])),
    },
  };
}

// The name without its make, for the buttons that pick a car.
const shortName = (name: string) => name.replace(/^(Mercedes-|Bentley |BMW )/, "");

export default async function GaragePage({ params }: PageProps<"/[lang]/garage">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const entries: GarageEntry[] = garageCars.flatMap((entry) => {
    const car = getCar(entry.slug);
    if (!car) return [];
    return [
      {
        ...entry,
        name: car.name,
        short: shortName(car.name),
        make: car.make,
        price: car.priceUsd ? formatUsd(car.priceUsd, lang) : dict.car.onRequest,
        facts: [
          car.year ? String(car.year) : "",
          dict.bodies[car.body],
          car.mileageKm != null ? `${new Intl.NumberFormat(lang).format(car.mileageKm)} ${dict.car.km}` : "",
        ].filter(Boolean),
        href: `/${lang}/cars/${car.slug}`,
      },
    ];
  });
  if (entries.length === 0) notFound();

  return <Garage cars={entries} labels={dict.garage} />;
}
