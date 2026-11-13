"use client";

import { useState } from "react";
import { ArrowIcon } from "./icons";

// Every figure arrives already worked out and formatted, so this only switches rows.
export type CalcOption = {
  slug: string;
  name: string;
  price: string;
  down: string;
  term: string;
  monthly: string;
  href: string;
};

type CalculatorProps = {
  options: CalcOption[];
  labels: { car: string; price: string; down: string; term: string; monthly: string; note: string; cta: string };
};

export function Calculator({ options, labels }: CalculatorProps) {
  const [slug, setSlug] = useState(options[0]?.slug);
  const option = options.find((item) => item.slug === slug) ?? options[0];
  if (!option) return null;

  return (
    <div className="calc__card">
      <label className="calc__field">
        <span>{labels.car}</span>
        <select className="calc__select" value={option.slug} onChange={(event) => setSlug(event.target.value)}>
          {options.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <dl className="calc__rows" aria-live="polite">
        <div className="calc__row">
          <dt>{labels.price}</dt>
          <dd>{option.price}</dd>
        </div>
        <div className="calc__row">
          <dt>{labels.down}</dt>
          <dd>{option.down}</dd>
        </div>
        <div className="calc__row">
          <dt>{labels.term}</dt>
          <dd>{option.term}</dd>
        </div>
        <div className="calc__row calc__row--total">
          <dt>{labels.monthly}</dt>
          <dd>{option.monthly}</dd>
        </div>
      </dl>

      <p className="calc__note">{labels.note}</p>

      <a className="btn btn--primary" href={option.href} target="_blank" rel="noopener">
        {labels.cta}
        <ArrowIcon />
      </a>
    </div>
  );
}
