import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator, type CalcOption } from "@/components/Calculator";
import { CountUp } from "@/components/CountUp";
import { HeroFilm } from "@/components/HeroFilm";
import { ArrowIcon, TelegramIcon } from "@/components/icons";
import { Picture, avifSrcSet, fallbackSrc } from "@/components/Picture";
import { VideoNotes, type NoteItem } from "@/components/VideoNotes";
import { cars, featuredCars, formatUsd, makes, siteImages } from "@/data/cars";
import { formatPhone, site, telegramLink } from "@/data/site";
import { fill, getDictionary, plural } from "@/i18n";
import { isLocale, locales } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return {
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((code) => [code, `/${code}`])),
    },
  };
}

// Names for the marquee. The two Mercedes sub-brands read better spelled out than the
// parent company name does.
const marqueeNames = makes.flatMap((make) => (make === "Mercedes-Benz" ? ["Mercedes-Maybach", "Mercedes-AMG"] : [make]));

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const home = `/${lang}`;

  const calcOptions: CalcOption[] = cars
    .filter((car) => car.priceUsd && car.installment)
    .map((car) => ({
      slug: car.slug,
      name: car.year ? `${car.name} ${car.year}` : car.name,
      price: formatUsd(car.priceUsd!, lang),
      down: formatUsd(car.installment!.downUsd, lang),
      term: plural(dict.car.months, car.installment!.months, lang),
      monthly: formatUsd(car.installment!.monthlyUsd, lang),
      href: telegramLink(fill(dict.calc.message, { name: car.name })),
    }));

  const notes: NoteItem[] = cars
    .filter((car) => car.note)
    .map((car) => ({
      slug: car.slug,
      name: car.name,
      video: car.note!.video,
      poster: car.note!.poster,
      href: `${home}/cars/${car.slug}`,
    }));

  const facts = [
    { value: cars.length, label: dict.facts.cars },
    { value: makes.length, label: dict.facts.makes },
    { value: 9000, suffix: "+", label: dict.facts.subscribers },
    { value: site.installment.months, label: dict.facts.months },
  ];

  const dealer = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: site.name,
    url: `${site.url}${home}`,
    telephone: site.phones,
    sameAs: [`https://t.me/${site.channel}`],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dealer).replace(/</g, "\\u003c") }}
      />

      {/* Hero. The still shows first; on wide screens the film fades in over it once it plays. */}
      <section className="hero">
        <div className="hero__media">
          <picture>
            <source
              media="(orientation: portrait)"
              type="image/avif"
              srcSet={avifSrcSet(siteImages.heroTall)}
              sizes="100vw"
            />
            <source media="(orientation: portrait)" srcSet={fallbackSrc(siteImages.heroTall)} />
            <source type="image/avif" srcSet={avifSrcSet(siteImages.heroWide)} sizes="100vw" />
            <img
              src={fallbackSrc(siteImages.heroWide)}
              alt=""
              width={siteImages.heroWide.width}
              height={siteImages.heroWide.height}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <HeroFilm wide="/media/film/night-run-wide.mp4" tall="/media/film/night-run-tall.mp4" />
        </div>
        <div className="hero__shade" />
        <div className="hero__content">
          <p className="label">{dict.hero.eyebrow}</p>
          <h1 className="display hero__title">
            <span>{dict.hero.line1}</span>
            <span>{dict.hero.line2}</span>
          </h1>
          <p className="lead">{dict.hero.lead}</p>
          <div className="hero__cta">
            <Link className="btn btn--primary" href={`${home}/catalog`}>
              {dict.hero.ctaStock}
              <ArrowIcon />
            </Link>
            <a className="btn btn--ghost" href={telegramLink()} target="_blank" rel="noopener">
              <TelegramIcon />
              {dict.hero.ctaTelegram}
            </a>
          </div>
        </div>
        <div className="hero__meta">
          <span className="hero__count">{plural(dict.hero.inStock, cars.length, lang)}</span>
          <span className="hero__scroll">{dict.hero.scroll}</span>
        </div>
      </section>

      <div className="marquee" aria-hidden>
        <div className="marquee__track">
          {[0, 1].map((group) => (
            <div key={group} className="marquee__group">
              {[...marqueeNames, ...marqueeNames].map((name, index) => (
                <span key={index} className="marquee__item">
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="numbers">
        <dl className="container numbers__grid">
          {facts.map((fact, index) => (
            <div key={fact.label} className="number" data-reveal style={{ "--delay": `${index * 0.08}s` } as React.CSSProperties}>
              <dt className="number__label">{fact.label}</dt>
              <dd className="number__value">
                <CountUp value={fact.value} locale={lang} suffix={fact.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <div className="container section__head" data-reveal>
          <div>
            <p className="label">{dict.featured.label}</p>
            <h2 className="title">{dict.featured.title}</h2>
          </div>
          <Link className="link" href={`${home}/catalog`}>
            {dict.featured.all}
            <ArrowIcon />
          </Link>
        </div>
        <div className="slices" data-reveal>
          {featuredCars.map((car, index) => (
            <Link key={car.slug} href={`${home}/cars/${car.slug}`} className="slice">
              <div className="slice__media">
                <Picture image={car.photos[0]} alt="" sizes="(min-width: 1000px) 40vw, 76vw" />
              </div>
              <div className="slice__text">
                <span className="slice__index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <span className="slice__make">{car.make}</span>
                  <h3 className="slice__name">{car.name}</h3>
                  <div className="slice__more">
                    <span>{car.priceUsd ? formatUsd(car.priceUsd, lang) : dict.car.onRequest}</span>
                    <span className="slice__view">
                      {dict.featured.view}
                      <ArrowIcon />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="showroom">
        <div className="container showroom">
          <div className="showroom__text" data-reveal>
            <p className="label">{dict.showroom.label}</p>
            <h2 className="title">{dict.showroom.title}</h2>
            <p className="lead">{dict.showroom.text}</p>
            <div className="hero__cta">
              <Link className="btn btn--primary" href={`${home}/garage`}>
                {dict.garage.enter}
                <ArrowIcon />
              </Link>
              <a className="btn btn--ghost" href={telegramLink(dict.showroom.message)} target="_blank" rel="noopener">
                {dict.showroom.cta}
              </a>
            </div>
          </div>
          <div className="showroom__media" data-reveal style={{ "--delay": "0.15s" } as React.CSSProperties}>
            <Picture image={siteImages.showroom} alt="" sizes="(min-width: 900px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      <section className="section section--panel" id="services">
        <div className="container">
          <div className="section__head" data-reveal>
            <div>
              <p className="label">{dict.services.label}</p>
              <h2 className="title">{dict.services.title}</h2>
            </div>
          </div>
          <ol className="services">
            {dict.services.items.map((item, index) => (
              <li key={item.title} className="service" data-reveal>
                <span className="service__index">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="service__title">{item.title}</h3>
                <p className="service__text">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container calc">
          <div className="calc__intro" data-reveal>
            <p className="label">{dict.calc.label}</p>
            <h2 className="title">{dict.calc.title}</h2>
            <p className="lead">{dict.services.items[2].text}</p>
          </div>
          <div data-reveal style={{ "--delay": "0.15s" } as React.CSSProperties}>
            <Calculator options={calcOptions} labels={dict.calc} />
          </div>
        </div>
      </section>

      <section className="section section--panel">
        <div className="container section__head" data-reveal>
          <div>
            <p className="label">{dict.notes.label}</p>
            <h2 className="title">{dict.notes.title}</h2>
          </div>
          <p className="lead">{dict.notes.text}</p>
        </div>
        <div className="notes__rail" data-reveal>
          <VideoNotes
            items={notes}
            labels={{
              play: dict.notes.play,
              soundOn: dict.notes.soundOn,
              soundOff: dict.notes.soundOff,
              close: dict.nav.close,
              view: dict.featured.view,
            }}
          />
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container contact">
          <div data-reveal>
            <p className="label">{dict.contact.label}</p>
            <h2 className="display">{dict.contact.title}</h2>
            <p className="lead">{dict.contact.text}</p>
          </div>
          <div className="contact__list" data-reveal style={{ "--delay": "0.15s" } as React.CSSProperties}>
            <div className="contact__group">
              <span>{dict.contact.phones}</span>
              {site.phones.map((phone) => (
                <a key={phone} className="contact__big" href={`tel:${phone}`}>
                  {formatPhone(phone)}
                </a>
              ))}
            </div>
            <div className="contact__group">
              <span>{dict.contact.telegram}</span>
              <a
                className="contact__big"
                href={telegramLink(dict.contact.message)}
                target="_blank"
                rel="noopener"
              >
                @{site.telegram}
              </a>
            </div>
            <div className="contact__group">
              <span>{dict.contact.channel}</span>
              <a className="contact__big" href={`https://t.me/${site.channel}`} target="_blank" rel="noopener">
                t.me/{site.channel}
              </a>
              <small>{dict.contact.channelNote}</small>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
