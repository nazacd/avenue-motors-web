import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Garage } from "@/components/garage/Garage";
import { formatUsd, getCar, siteImages } from "@/data/cars";
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

export default async function GaragePage({ params }: PageProps<"/[lang]/garage">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const entry = garageCars[0];
  const car = getCar(entry.slug);
  if (!car) notFound();

  return (
    <Garage
      model={entry.model}
      still={siteImages.garage}
      car={{
        name: car.name,
        make: car.make,
        price: car.priceUsd ? formatUsd(car.priceUsd, lang) : dict.car.onRequest,
        href: `/${lang}/cars/${car.slug}`,
      }}
      labels={dict.garage}
    />
  );
}
