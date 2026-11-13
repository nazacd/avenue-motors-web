"use client";

import { ViewTransition, useEffect, useRef, useState } from "react";
import type { Image } from "@/data/cars";
import { fill } from "@/i18n/format";
import { ArrowIcon, BackIcon } from "./icons";
import { Picture, fallbackSrc } from "./Picture";

type GalleryProps = {
  slug: string;
  name: string;
  photos: Image[];
  labels: { photo: string; previous: string; next: string };
};

// A swipeable strip of photos. On a wide screen it also gets thumbnails and arrows.
export function Gallery({ slug, name, photos, labels }: GalleryProps) {
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setActive(Math.round(element.scrollLeft / element.clientWidth));
      });
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", onScroll);
    };
  }, []);

  const go = (index: number) => {
    const element = stage.current;
    if (!element) return;
    const target = Math.max(0, Math.min(photos.length - 1, index));
    element.scrollTo({ left: target * element.clientWidth, behavior: "smooth" });
  };

  const alt = (index: number) => `${name}. ${fill(labels.photo, { i: index + 1, n: photos.length })}`;

  return (
    <div className="gallery gallery--photos">
      {photos.length > 1 && (
        <div className="gallery__thumbs">
          {photos.map((photo, index) => (
            <button
              key={photo.base}
              type="button"
              className="gallery__thumb"
              aria-label={alt(index)}
              aria-current={index === active ? "true" : undefined}
              onClick={() => go(index)}
            >
              <img src={fallbackSrc(photo)} alt="" width={84} height={105} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      <div
        ref={stage}
        className="gallery__stage"
        tabIndex={0}
        role="group"
        aria-label={name}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") go(active + 1);
          if (event.key === "ArrowLeft") go(active - 1);
        }}
      >
        {photos.map((photo, index) => (
          <div key={photo.base} className="gallery__slide">
            {index === 0 ? (
              <ViewTransition name={`car-${slug}`}>
                <Picture image={photo} alt={alt(index)} sizes="(min-width: 1000px) 56vw, 100vw" eager />
              </ViewTransition>
            ) : (
              <Picture image={photo} alt={alt(index)} sizes="(min-width: 1000px) 56vw, 100vw" />
            )}
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="gallery__bar">
          <span className="gallery__count" aria-hidden>
            <b>{String(active + 1).padStart(2, "0")}</b> / {String(photos.length).padStart(2, "0")}
          </span>
          <div className="gallery__arrows">
            <button type="button" className="gallery__arrow" aria-label={labels.previous} onClick={() => go(active - 1)}>
              <BackIcon />
            </button>
            <button type="button" className="gallery__arrow" aria-label={labels.next} onClick={() => go(active + 1)}>
              <ArrowIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
