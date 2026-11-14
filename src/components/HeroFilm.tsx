"use client";

import { useState, useSyncExternalStore } from "react";

// The film has two cuts: one for wide screens and one shot upright for phones. Screens
// in between, and visitors who ask for less motion, keep the still.
const WIDE = "(min-aspect-ratio: 3/2)";
const UPRIGHT = "(orientation: portrait)";
const CALM = "(prefers-reduced-motion: reduce)";

type Cut = "wide" | "tall" | "none";

function subscribe(onChange: () => void) {
  const queries = [WIDE, UPRIGHT, CALM].map((query) => window.matchMedia(query));
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

function cutForScreen(): Cut {
  if (window.matchMedia(CALM).matches) return "none";
  if (window.matchMedia(UPRIGHT).matches) return "tall";
  return window.matchMedia(WIDE).matches ? "wide" : "none";
}

export function HeroFilm({ wide, tall }: { wide: string; tall: string }) {
  const cut = useSyncExternalStore<Cut>(subscribe, cutForScreen, () => "none");
  const [playing, setPlaying] = useState<Cut>("none");
  if (cut === "none") return null;

  return (
    <video
      key={cut}
      className={`hero__film${playing === cut ? " is-playing" : ""}`}
      src={cut === "wide" ? wide : tall}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden
      onPlaying={() => setPlaying(cut)}
    />
  );
}
