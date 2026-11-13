import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { CarCard } from "@/components/CarCard";
import { Gallery } from "@/components/Gallery";
import { ArrowIcon, BackIcon, PhoneIcon, TelegramIcon } from "@/components/icons";
import { fallbackSrc } from "@/components/Picture";
import { RoundVideo, VideoNotes } from "@/components/VideoNotes";
import { toCard } from "@/data/cards";
import { cars, formatNumber, formatUsd, getCar } from "@/data/cars";
import { site, telegramLink } from "@/data/site";
import { fill, getDictionary, plural } from "@/i18n";
import { isLocale, locales } from "@/i18n/config";

export function generateStaticParams() {
  return cars.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/cars/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const car = getCar(slug);
  if (!car || !isLocale(lang)) return {};
  const dict = getDictionary(lang);
  const title = car.year ? `${car.name} ${car.year}` : car.name;
  const price = car.priceUsd ? formatUsd(car.priceUsd, lang) : dict.car.onRequest;
  const image = car.photos[0] ? fallbackSrc(car.photos[0]) : car.note?.poster;
  return {
    title,
    description: `${title} — ${price}. ${dict.meta.description}`,
    alternates: {
      canonical: `/${lang}/cars/${slug}`,
      languages: Object.fromEntries(locales.map((code) => [code, `/${code}/cars/${slug}`])),
    },
    openGraph: { title, images: image ? [image] : undefined },
  };
}

export default async function CarPage({ params }: PageProps<"/[lang]/cars/[slug]">) {
  const { lang, slug } = await params;
  const car = getCar(slug);
  if (!car || !isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const home = `/${lang}`;

  const facts = [
    car.year && { term: dict.car.year, value: String(car.year) },
    car.mileageKm !== undefined && {
      term: dict.car.mileage,
      value: `${formatNumber(car.mileageKm, lang)} ${dict.car.km}`,
    },
    { term: dict.car.body, value: dict.bodies[car.body] },
    { term: dict.car.paint, value: dict.paints[car.paint] },
    car.seats && { term: dict.car.seats, value: String(car.seats) },
  ].filter((fact): fact is { term: string; value: string } => Boolean(fact));

  const noteLabels = {
    play: dict.notes.play,
    soundOn: dict.notes.soundOn,
    soundOff: dict.notes.soundOff,
    close: dict.nav.close,
    view: dict.featured.view,
  };

  const others = cars.filter((other) => other.slug !== car.slug).slice(0, 3);

  const listing = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: car.name,
    brand: { "@type": "Brand", name: car.make },
    ...(car.year && { vehicleModelDate: String(car.year) }),
    ...(car.mileageKm !== undefined && {
      mileageFromOdometer: { "@type": "QuantitativeValue", value: car.mileageKm, unitCode: "KMT" },
    }),
    ...(car.photos[0] && { image: `${site.url}${fallbackSrc(car.photos[0])}` }),
    ...(car.priceUsd && {
      offers: {
        "@type": "Offer",
        price: car.priceUsd,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        seller: { "@type": "AutoDealer", name: site.name },
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listing).replace(/</g, "\\u003c") }}
      />

      <div className="container car">
        <Link className="link car__back" href={`${home}/catalog`}>
          <BackIcon />
          {dict.car.back}
        </Link>

        <div className="car__layout">
          {car.photos.length > 0 ? (
            <Gallery slug={car.slug} name={car.name} photos={car.photos} labels={dict.car} />
          ) : (
            car.note && (
              <div className="gallery gallery--round">
                <ViewTransition name={`car-${car.slug}`}>
                  <div>
                    <RoundVideo video={car.note.video} poster={car.note.poster} labels={noteLabels} />
                  </div>
                </ViewTransition>
              </div>
            )
          )}

          <div className="car__panel">
            <p className="label">{car.make}</p>
            <h1 className="display">{car.name}</h1>

            <dl className="facts">
              {facts.map((fact) => (
                <div key={fact.term}>
                  <dt>{fact.term}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="price">
              <span className="label">{dict.car.price}</span>
              {car.priceUsd ? (
                <span className="price__value">{formatUsd(car.priceUsd, lang)}</span>
              ) : (
                <span className="price__value price__value--request">{dict.car.onRequest}</span>
              )}
            </div>

            {car.installment && (
              <div className="terms">
                <div className="terms__head">
                  <span>{dict.car.installment}</span>
                  {car.installment.estimated && <span>{dict.car.estimate}</span>}
                </div>
                <dl className="terms__rows">
                  <div>
                    <dt>{dict.car.down}</dt>
                    <dd>{formatUsd(car.installment.downUsd, lang)}</dd>
                  </div>
                  <div>
                    <dt>
                      {plural(dict.car.months, car.installment.months, lang)}, {dict.car.perMonth}
                    </dt>
                    <dd>{formatUsd(car.installment.monthlyUsd, lang)}</dd>
                  </div>
                </dl>
              </div>
            )}

            <div className="car__cta">
              <a
                className="btn btn--primary"
                href={telegramLink(fill(dict.car.message, { name: car.name }))}
                target="_blank"
                rel="noopener"
              >
                <TelegramIcon />
                {dict.car.ask}
              </a>
              <a className="btn btn--ghost" href={`tel:${site.phones[0]}`}>
                <PhoneIcon />
                {dict.car.call}
              </a>
            </div>

            {(car.unconfirmed || car.installment?.estimated) && (
              <p className="car__fine">{car.unconfirmed ? dict.car.unconfirmed : dict.calc.note}</p>
            )}

            {car.note && car.photos.length > 0 && (
              <div className="car__note">
                <VideoNotes
                  items={[{ slug: car.slug, name: car.name, video: car.note.video, poster: car.note.poster }]}
                  labels={noteLabels}
                  showNames={false}
                />
                <p>
                  <strong>{dict.car.note}</strong>
                  {dict.notes.text}
                </p>
              </div>
            )}

            {car.photos.length === 0 && <p className="car__fine">{dict.car.videoOnly}</p>}
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2 className="title">{dict.car.more}</h2>
            <Link className="link" href={`${home}/catalog`}>
              {dict.featured.all}
              <ArrowIcon />
            </Link>
          </div>
          <div className="grid">
            {others.map((other) => (
              <CarCard key={other.slug} card={toCard(other, lang, dict)} locale={lang} videoLabel={dict.car.note} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
