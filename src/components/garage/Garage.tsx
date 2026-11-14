"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import { paints, type PaintKey } from "@/data/garage";
import type { Image } from "@/data/cars";
import { ArrowIcon } from "../icons";
import { Picture } from "../Picture";

// The 3D scene is heavy and only works in a browser, so it loads after the page.
const GarageScene = dynamic(() => import("./GarageScene"), { ssr: false });

type GarageProps = {
  model: string;
  still: Image;
  car: { name: string; make: string; price: string; href: string };
  labels: {
    label: string;
    hint: string;
    colour: string;
    lights: string;
    view: string;
    loading: string;
    preview: string;
    paints: Record<PaintKey, string>;
  };
};

export function Garage({ model, still, car, labels }: GarageProps) {
  const [ready, setReady] = useState(false);
  const [paint, setPaint] = useState<PaintKey>("black");
  const [lights, setLights] = useState(true);
  const onReady = useCallback(() => setReady(true), []);
  const color = paints.find((item) => item.key === paint)!.color;

  return (
    <section className={`garage${ready ? " is-ready" : ""}`}>
      <div className="garage__still" aria-hidden>
        <Picture image={still} alt="" sizes="100vw" eager />
      </div>
      <div className="garage__stage">
        <GarageScene model={model} paint={color} lights={lights} onReady={onReady} />
      </div>
      {!ready && (
        <p className="garage__loading" role="status">
          {labels.loading}
        </p>
      )}

      <div className="garage__info">
        <p className="label">
          {labels.label} · {car.make}
        </p>
        <h1 className="garage__name">{car.name}</h1>
        <p className="garage__price">{car.price}</p>
        <Link className="btn btn--primary" href={car.href}>
          {labels.view}
          <ArrowIcon />
        </Link>
      </div>

      <div className="garage__controls">
        <div className="garage__group" role="group" aria-label={labels.colour}>
          <span className="garage__caption">{labels.colour}</span>
          <div className="swatches">
            {paints.map((item) => (
              <button
                key={item.key}
                type="button"
                className="swatch"
                style={{ "--swatch": item.color } as React.CSSProperties}
                aria-label={labels.paints[item.key]}
                aria-pressed={paint === item.key}
                title={labels.paints[item.key]}
                onClick={() => setPaint(item.key)}
              />
            ))}
          </div>
        </div>
        <button type="button" className="chip" aria-pressed={lights} onClick={() => setLights((value) => !value)}>
          {labels.lights}
        </button>
        {paint !== "black" && <p className="garage__note">{labels.preview}</p>}
      </div>

      <p className="garage__hint" aria-hidden>
        {labels.hint}
      </p>
    </section>
  );
}
