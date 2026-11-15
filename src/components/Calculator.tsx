"use client";

import { useId, useState } from "react";
import { ArrowIcon } from "./icons";
import { Select } from "./Select";

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
  const carLabel = useId();
  if (!option) return null;

  return (
    <div className="calc__card">
      <div className="calc__field">
        <span id={carLabel}>{labels.car}</span>
        <Select
          className="calc__select"
          value={option.slug}
          onChange={setSlug}
          labelledBy={carLabel}
          options={options.map((item) => ({ value: item.slug, label: item.name }))}
        />
      </div>

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
