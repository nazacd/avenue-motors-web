import Link from "next/link";
import { formatPhone, site, telegramLink } from "@/data/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { Mark } from "./Mark";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const home = `/${locale}`;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__about">
            <Link href={home} className="footer__brand">
              <Mark />
              {site.name}
            </Link>
            <p>{dict.footer.tagline}</p>
          </div>
          <nav className="footer__nav" aria-label={dict.nav.menu}>
            <Link href={`${home}/catalog`}>{dict.nav.catalog}</Link>
            <Link href={`${home}/garage`}>{dict.nav.garage}</Link>
            <Link href={`${home}#showroom`}>{dict.nav.showroom}</Link>
            <Link href={`${home}#services`}>{dict.nav.services}</Link>
            <Link href={`${home}#contact`}>{dict.nav.contact}</Link>
          </nav>
          <div className="footer__reach">
            {site.phones.map((phone) => (
              <a key={phone} href={`tel:${phone}`}>
                {formatPhone(phone)}
              </a>
            ))}
            <a href={telegramLink()} target="_blank" rel="noopener">
              @{site.telegram}
            </a>
            <a href={`https://t.me/${site.channel}`} target="_blank" rel="noopener">
              t.me/{site.channel}
            </a>
          </div>
        </div>
      </div>
      {/* The name once more, very large and only outlined, as the last thing on the page. */}
      <p className="footer__word" aria-hidden>
        {site.name}
      </p>
      <div className="container footer__base">
        <p>
          © 2026 {site.name}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
