import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogGrid } from "@/components/CatalogGrid";
import { toCard } from "@/data/cards";
import { cars, makes } from "@/data/cars";
import { getDictionary } from "@/i18n";
import { isLocale, locales } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[lang]/catalog">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.catalog.title,
    alternates: {
      canonical: `/${lang}/catalog`,
      languages: Object.fromEntries(locales.map((code) => [code, `/${code}/catalog`])),
    },
  };
}

export default async function CatalogPage({ params }: PageProps<"/[lang]/catalog">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="container page-head section">
      <p className="label">{dict.featured.label}</p>
      <h1 className="display">{dict.catalog.title}</h1>
      <CatalogGrid
        cards={cars.map((car) => toCard(car, lang, dict))}
        makes={makes}
        locale={lang}
        labels={dict.catalog}
        bodies={dict.bodies}
        videoLabel={dict.car.note}
      />
    </div>
  );
}
