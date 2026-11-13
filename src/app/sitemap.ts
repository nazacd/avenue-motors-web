import type { MetadataRoute } from "next";
import { cars } from "@/data/cars";
import { site } from "@/data/site";
import { locales } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/catalog", ...cars.map((car) => `/cars/${car.slug}`)];
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(locales.map((code) => [code, `${site.url}/${code}${path}`])),
      },
    })),
  );
}
