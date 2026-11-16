import { notFound } from "next/navigation";

// Catches every address under a language that no page claims, so it gets the site's
// own "not found" screen.
export default function UnknownPage() {
  notFound();
}

// A static export has to know every page ahead of time, and "anything else" cannot be
// listed. One address stands in for it: /ru/404 (and /uz/404, /en/404) is written out
// as that screen in each language, and the site's 404 page sends visitors to it.
export function generateStaticParams() {
  return [{ rest: ["404"] }];
}
