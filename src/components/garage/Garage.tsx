"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { garageViews, paints, specScale, type GarageCar, type GarageView, type PaintKey } from "@/data/garage";
import { ArrowIcon } from "../icons";
import { Mark } from "../Mark";

// The 3D scene is heavy and only works in a browser, so it loads after the page.
const GarageScene = dynamic(() => import("./GarageScene"), { ssr: false });

export type GarageEntry = GarageCar & {
  name: string;
  short: string;
  make: string;
  price: string;
  // Year, body and mileage, already worded for the page's language.
  facts: string[];
  href: string;
};

type GarageProps = {
  cars: GarageEntry[];
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
    camera: string;
    previous: string;
    next: string;
    power: string;
    sprint: string;
    topSpeed: string;
    hp: string;
    seconds: string;
    kmh: string;
    factory: string;
    views: Record<GarageView, string>;
    paints: Record<PaintKey, string>;
  };
};

const pad = (value: number) => String(value).padStart(2, "0");

export function Garage({ cars, labels }: GarageProps) {
  const [index, setIndex] = useState(0);
  // Which car, if any, is on the turntable and drawn. The curtain covers the change.
  const [shown, setShown] = useState<string | null>(null);
  // Null means the colour of the car that is in stock.
  const [paint, setPaint] = useState<PaintKey | null>(null);
  const [lights, setLights] = useState(true);
  const [view, setView] = useState<GarageView>("show");

  const car = cars[index];
  const ready = shown === car.slug;
  const onReady = useCallback(() => setShown(car.slug), [car.slug]);
  const color = paint ? paints.find((item) => item.key === paint)!.color : car.paint;
  // A preview colour that matches the real car would only repeat the first swatch.
  const previews = paints.filter((item) => item.color !== car.paint);

  const choose = useCallback(
    (next: number) => {
      setIndex((next + cars.length) % cars.length);
      setPaint(null);
    },
    [cars.length],
  );

  // The keys a driving game would use: arrows change the car, L the lamps, V the view.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, select, textarea, dialog")) return;
      const key = event.key.toLowerCase();
      if (key === "arrowright") choose(index + 1);
      else if (key === "arrowleft") choose(index - 1);
      else if (key === "l") setLights((value) => !value);
      else if (key === "v") setView((value) => garageViews[(garageViews.indexOf(value) + 1) % garageViews.length]);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, index]);

  const figures = [
    { key: "power", label: labels.power, value: String(car.specs.power), unit: labels.hp, fill: car.specs.power / specScale.power },
    // A quicker car fills more of the bar.
    { key: "sprint", label: labels.sprint, value: car.specs.sprint.toFixed(1), unit: labels.seconds, fill: 1 - car.specs.sprint / specScale.sprint },
    { key: "topSpeed", label: labels.topSpeed, value: String(car.specs.topSpeed), unit: labels.kmh, fill: car.specs.topSpeed / specScale.topSpeed },
  ];

  return (
    <section className={`garage${ready ? " is-ready" : ""}`}>
      <div className="garage__stage">
        <GarageScene car={car} paint={color} lights={lights} view={view} onReady={onReady} />
      </div>
      <div className="garage__curtain" aria-hidden>
        <Mark className="garage__curtain-mark" />
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
        <p className="garage__facts">
          {car.facts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </p>
        <p className="garage__price">{car.price}</p>
        <Link className="btn btn--primary" href={car.href}>
          {labels.view}
          <ArrowIcon />
        </Link>
      </div>

      <div className="garage__specs">
        <dl>
          {figures.map((figure) => (
            <div key={figure.key} className="figure">
              <dt>{figure.label}</dt>
              <dd>
                {figure.value}
                <small>{figure.unit}</small>
              </dd>
              <span className="figure__bar" style={{ "--fill": Math.min(Math.max(figure.fill, 0.04), 1) } as React.CSSProperties} />
            </div>
          ))}
        </dl>
        <p className="garage__factory">{labels.factory}</p>
      </div>

      <div className="garage__rail" role="group" aria-label={labels.cars}>
        <button type="button" className="garage__step" aria-label={labels.previous} onClick={() => choose(index - 1)}>
          <ArrowIcon />
        </button>
        <div className="garage__cars">
          {cars.map((item, i) => (
            <button key={item.slug} type="button" className="garage__car" aria-pressed={i === index} onClick={() => choose(i)}>
              <span>{pad(i + 1)}</span>
              {item.short}
            </button>
          ))}
        </div>
        <button type="button" className="garage__step" aria-label={labels.next} onClick={() => choose(index + 1)}>
          <ArrowIcon />
        </button>
      </div>

      <div className="garage__controls">
        <div className="garage__group garage__group--views" role="group" aria-label={labels.camera}>
          <span className="garage__caption">{labels.camera}</span>
          <div className="garage__views">
            {garageViews.map((item) => (
              <button key={item} type="button" className="garage__view" aria-pressed={view === item} onClick={() => setView(item)}>
                {labels.views[item]}
              </button>
            ))}
          </div>
        </div>
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
          <button type="button" className="garage__lamp" aria-pressed={lights} onClick={() => setLights((value) => !value)}>
            <span aria-hidden />
            {labels.lights}
          </button>
        </div>
        {paint !== null && <p className="garage__note">{labels.preview}</p>}
      </div>

      <p className="garage__keys" aria-hidden>
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd>
          {labels.cars}
        </span>
        <span>
          <kbd>V</kbd>
          {labels.camera}
        </span>
        <span>
          <kbd>L</kbd>
          {labels.lights}
        </span>
        <span className="garage__drag">{labels.hint}</span>
      </p>
    </section>
  );
}
