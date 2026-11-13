"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localeLabels, locales, type Locale } from "@/i18n/config";
import { formatPhone, site, telegramLink } from "@/data/site";
import { TelegramIcon } from "./icons";
import { Mark } from "./Mark";
import { lockScroll } from "./SiteEffects";

type HeaderProps = {
  locale: Locale;
  labels: {
    home: string;
    catalog: string;
    services: string;
    showroom: string;
    contact: string;
    menu: string;
    close: string;
    language: string;
  };
};

export function LocaleLinks({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <nav className="locales" aria-label={label}>
      {locales.map((code) => (
        <Link
          key={code}
          href={`/${code}${rest ? `/${rest}` : ""}`}
          hrefLang={code}
          lang={code}
          aria-current={code === locale ? "true" : undefined}
          title={localeLabels[code].name}
        >
          {localeLabels[code].short}
        </Link>
      ))}
    </nav>
  );
}

export function Header({ locale, labels }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // A link inside the menu changes the page; the menu should not stay over it.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  const home = `/${locale}`;
  const links = [
    { href: `${home}/catalog`, text: labels.catalog },
    { href: `${home}#showroom`, text: labels.showroom },
    { href: `${home}#services`, text: labels.services },
    { href: `${home}#contact`, text: labels.contact },
  ];

  return (
    <>
      <header className={`header${scrolled || open ? " is-scrolled" : ""}`}>
        <button
          type="button"
          className="header__menu"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="header__burger" aria-hidden />
          <span className="header__menu-text">{open ? labels.close : labels.menu}</span>
          <span className="visually-hidden">{open ? labels.close : labels.menu}</span>
        </button>

        <Link href={home} className="header__mark" aria-label={`${site.name} — ${labels.home}`}>
          <Mark />
        </Link>

        <div className="header__right">
          <LocaleLinks locale={locale} label={labels.language} />
          <a className="header__contact" href={telegramLink()} target="_blank" rel="noopener">
            <TelegramIcon />
            <span>Telegram</span>
            <span className="visually-hidden">Telegram</span>
          </a>
        </div>
      </header>

      <div id="site-menu" className={`menu${open ? " is-open" : ""}`} inert={!open}>
        <nav className="menu__nav" aria-label={labels.menu}>
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ "--i": index } as React.CSSProperties}
              onClick={() => setOpen(false)}
            >
              <small>{String(index + 1).padStart(2, "0")}</small>
              {link.text}
            </Link>
          ))}
        </nav>
        <div className="menu__foot">
          <div className="menu__phones">
            {site.phones.map((phone) => (
              <a key={phone} href={`tel:${phone}`}>
                {formatPhone(phone)}
              </a>
            ))}
          </div>
          <LocaleLinks locale={locale} label={labels.language} />
        </div>
      </div>
    </>
  );
}
