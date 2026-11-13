import Link from "next/link";
import { site } from "@/data/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { Mark } from "./Mark";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const home = `/${locale}`;
  return (
    <footer className="footer">
      <div className="container footer__row">
        <Link href={home} className="footer__brand">
          <Mark />
          {site.name}
        </Link>
        <nav className="footer__nav" aria-label={dict.nav.menu}>
          <Link href={`${home}/catalog`}>{dict.nav.catalog}</Link>
          <Link href={`${home}/garage`}>{dict.nav.garage}</Link>
          <Link href={`${home}#showroom`}>{dict.nav.showroom}</Link>
          <Link href={`${home}#services`}>{dict.nav.services}</Link>
          <Link href={`${home}#contact`}>{dict.nav.contact}</Link>
          <a href={`https://t.me/${site.channel}`} target="_blank" rel="noopener">
            Telegram
          </a>
        </nav>
        <p>
          © 2026 {site.name}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
