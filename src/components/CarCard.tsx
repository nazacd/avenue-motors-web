import Link from "next/link";
import { ViewTransition } from "react";
import type { CardData } from "@/data/cards";
import type { Locale } from "@/i18n/config";
import { Picture } from "./Picture";

type CarCardProps = {
  card: CardData;
  locale: Locale;
  // Shown on cars that have a video note but no photographs yet.
  videoLabel: string;
  eager?: boolean;
};

export function CarCard({ card, locale, videoLabel, eager }: CarCardProps) {
  return (
    <Link href={`/${locale}/cars/${card.slug}`} className="card">
      {card.cover ? (
        <div className="card__media">
          <div className="card__tags">{card.year && <span className="tag">{card.year}</span>}</div>
          <ViewTransition name={`car-${card.slug}`}>
            <Picture
              image={card.cover}
              alt={card.name}
              sizes="(min-width: 1100px) 30vw, (min-width: 700px) 46vw, 92vw"
              eager={eager}
            />
          </ViewTransition>
        </div>
      ) : (
        <div className="card__media card__media--round">
          <div className="card__tags">
            {card.year && <span className="tag">{card.year}</span>}
            <span className="tag tag--accent">{videoLabel}</span>
          </div>
          {/* The same frame, enlarged and out of focus, fills the space round the disc. */}
          {card.poster && <img className="card__glow" src={card.poster} alt="" aria-hidden width={400} height={400} loading="lazy" decoding="async" />}
          {card.poster && (
            <ViewTransition name={`car-${card.slug}`}>
              <div className="card__round">
                <img src={card.poster} alt={card.name} width={400} height={400} loading="lazy" decoding="async" />
              </div>
            </ViewTransition>
          )}
        </div>
      )}
      <div className="card__body">
        <span className="card__make">{card.make}</span>
        <h3 className="card__name">{card.name}</h3>
        <div className="card__foot">
          <span>{card.mileage ?? card.year ?? ""}</span>
          <span className="card__price">{card.price}</span>
        </div>
      </div>
    </Link>
  );
}
