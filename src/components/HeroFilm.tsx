"use client";

import { useState, useSyncExternalStore } from "react";

// The film is cut for wide screens. Narrow and upright screens, and visitors who ask
// for less motion, keep the still.
const WIDE = "(min-aspect-ratio: 3/2)";
const CALM = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(WIDE), window.matchMedia(CALM)];
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

const wanted = () => window.matchMedia(WIDE).matches && !window.matchMedia(CALM).matches;

export function HeroFilm({ src }: { src: string }) {
  const show = useSyncExternalStore(subscribe, wanted, () => false);
  const [playing, setPlaying] = useState(false);
  if (!show) return null;

  return (
    <video
      className={`hero__film${playing ? " is-playing" : ""}`}
      src={src}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden
      onPlaying={() => setPlaying(true)}
    />
  );
}
