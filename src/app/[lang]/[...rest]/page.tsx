import { notFound } from "next/navigation";

// Catches every address under a language that no page claims, so it gets the site's
// own "not found" screen.
export default function UnknownPage() {
  notFound();
}
