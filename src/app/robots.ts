import type { MetadataRoute } from "next";
import { site } from "@/data/site";

// Written once at build time, which a static export requires.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
