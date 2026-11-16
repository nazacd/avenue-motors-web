import type { MetadataRoute } from "next";
import { cars } from "@/data/cars";
import { site } from "@/data/site";
import { locales } from "@/i18n/config";

// Written once at build time, which a static export requires.
export const dynamic = "force-static";

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
