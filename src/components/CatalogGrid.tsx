"use client";

import { useMemo, useState } from "react";
import type { CardData } from "@/data/cards";
import type { Body } from "@/data/cars";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { plural } from "@/i18n/format";
import { CarCard } from "./CarCard";

type Sort = "newest" | "priceAsc" | "priceDesc";

type CatalogGridProps = {
  cards: CardData[];
  makes: string[];
  locale: Locale;
  labels: Dictionary["catalog"];
  bodies: Dictionary["bodies"];
  videoLabel: string;
};

export function CatalogGrid({ cards, makes, locale, labels, bodies, videoLabel }: CatalogGridProps) {
  const [make, setMake] = useState<string | null>(null);
  const [body, setBody] = useState<Body | null>(null);
  const [sort, setSort] = useState<Sort>("newest");

  const bodyKeys = useMemo(() => [...new Set(cards.map((card) => card.body))], [cards]);

  const visible = useMemo(() => {
    const filtered = cards.filter((card) => (!make || card.make === make) && (!body || card.body === body));
    if (sort === "newest") return filtered.sort((a, b) => b.posted.localeCompare(a.posted));
    // Cars priced on request go last whichever way the prices run.
    const direction = sort === "priceAsc" ? 1 : -1;
    return filtered.sort((a, b) => {
      if (a.priceUsd === undefined || b.priceUsd === undefined) {
        return Number(a.priceUsd === undefined) - Number(b.priceUsd === undefined);
      }
      return (a.priceUsd - b.priceUsd) * direction;
    });
  }, [cards, make, body, sort]);

  const reset = () => {
    setMake(null);
    setBody(null);
  };

  return (
    <>
      <div className="filters">
        <div className="filters__group" role="group" aria-label={labels.make}>
          <span className="filters__name">{labels.make}</span>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={make === null} onClick={() => setMake(null)}>
              {labels.all}
            </button>
            {makes.map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                aria-pressed={make === name}
                onClick={() => setMake(make === name ? null : name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="filters__group" role="group" aria-label={labels.body}>
          <span className="filters__name">{labels.body}</span>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={body === null} onClick={() => setBody(null)}>
              {labels.all}
            </button>
            {bodyKeys.map((key) => (
              <button
                key={key}
                type="button"
                className="chip"
                aria-pressed={body === key}
                onClick={() => setBody(body === key ? null : key)}
              >
                {bodies[key]}
              </button>
            ))}
          </div>
        </div>

        <label className="filters__group">
          <span className="filters__name">{labels.sort}</span>
          <select className="filters__sort" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="newest">{labels.newest}</option>
            <option value="priceAsc">{labels.priceAsc}</option>
            <option value="priceDesc">{labels.priceDesc}</option>
          </select>
        </label>
      </div>

      <p className="filters__count" aria-live="polite">
        {plural(labels.count, visible.length, locale)}
      </p>

      {visible.length > 0 ? (
        <div className="grid">
          {visible.map((card, index) => (
            <CarCard key={card.slug} card={card} locale={locale} videoLabel={videoLabel} eager={index < 3} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>{labels.empty}</p>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            {labels.reset}
          </button>
        </div>
      )}
    </>
  );
}
