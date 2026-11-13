import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";

// Every page lives under a language prefix. A visitor who arrives without one is sent
// to the same path in the language their browser asks for.
function preferredLocale(header: string | null) {
  if (!header) return defaultLocale;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], weight: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.weight - a.weight);
  return ranked.find((entry) => isLocale(entry.lang))?.lang ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split("/")[1] ?? "")) return;

  const locale = preferredLocale(request.headers.get("accept-language"));
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Leave Next's own files and anything with a file extension alone.
  matcher: "/((?!_next|.*\\..*).*)",
};
