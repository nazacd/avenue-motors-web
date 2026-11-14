"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import { paints, type GarageCar, type PaintKey } from "@/data/garage";
import type { Image } from "@/data/cars";
import { ArrowIcon } from "../icons";
import { Picture } from "../Picture";

// The 3D scene is heavy and only works in a browser, so it loads after the page.
const GarageScene = dynamic(() => import("./GarageScene"), { ssr: false });

export type GarageEntry = GarageCar & { name: string; short: string; make: string; price: string; href: string };

type GarageProps = {
  cars: GarageEntry[];
  still: Image;
  labels: {
    label: string;
    hint: string;
    colour: string;
    stock: string;
    lights: string;
    view: string;
    loading: string;
    preview: string;
    cars: string;
    paints: Record<PaintKey, string>;
  };
};

export function Garage({ cars, still, labels }: GarageProps) {
  const [index, setIndex] = useState(0);
  // Which car, if any, is on the turntable and drawn. The still covers the change.
  const [shown, setShown] = useState<string | null>(null);
  // Null means the colour of the car that is in stock.
  const [paint, setPaint] = useState<PaintKey | null>(null);
  const [lights, setLights] = useState(true);

  const car = cars[index];
  const ready = shown === car.slug;
  const onReady = useCallback(() => setShown(car.slug), [car.slug]);
  const color = paint ? paints.find((item) => item.key === paint)!.color : car.paint;
  // A preview colour that matches the real car would only repeat the first swatch.
  const previews = paints.filter((item) => item.color !== car.paint);

  const choose = (next: number) => {
    setIndex(next);
    setPaint(null);
  };

  return (
    <section className={`garage${ready ? " is-ready" : ""}`}>
      <div className="garage__still" aria-hidden>
        <Picture image={still} alt="" sizes="100vw" eager />
      </div>
      <div className="garage__stage">
        <GarageScene car={car} paint={color} lights={lights} onReady={onReady} />
      </div>
      {!ready && (
        <p className="garage__loading" role="status">
          {labels.loading}
        </p>
      )}

      <div className="garage__cars" role="group" aria-label={labels.cars}>
        {cars.map((item, i) => (
          <button key={item.slug} type="button" className="chip" aria-pressed={i === index} onClick={() => choose(i)}>
            {item.short}
          </button>
        ))}
      </div>

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
            <button
              type="button"
              className="swatch"
              style={{ "--swatch": car.paint } as React.CSSProperties}
              aria-label={labels.stock}
              aria-pressed={paint === null}
              title={labels.stock}
              onClick={() => setPaint(null)}
            />
            {previews.map((item) => (
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
        {paint !== null && <p className="garage__note">{labels.preview}</p>}
      </div>

      <p className="garage__hint" aria-hidden>
        {labels.hint}
      </p>
    </section>
  );
}
