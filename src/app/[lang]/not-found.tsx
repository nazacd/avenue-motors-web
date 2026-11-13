import Link from "next/link";
import { lang } from "next/root-params";
import { ArrowIcon } from "@/components/icons";
import { getDictionary } from "@/i18n";
import { defaultLocale, isLocale } from "@/i18n/config";

export default async function NotFound() {
  const requested = await lang();
  const locale = isLocale(requested) ? requested : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <div className="container lost">
      <p className="label">404</p>
      <h1 className="display">{dict.notFound.title}</h1>
      <p className="lead">{dict.notFound.text}</p>
      <Link className="btn btn--primary" href={`/${locale}/catalog`}>
        {dict.notFound.cta}
        <ArrowIcon />
      </Link>
    </div>
  );
}
