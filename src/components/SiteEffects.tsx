"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

let lenis: Lenis | null = null;

// The menu and the video player lock page scroll while they are open.
export function lockScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (locked) lenis?.stop();
  else lenis?.start();
}

// Page-wide behaviour that needs the browser: weighted scrolling on desktop and
// fading sections in as they come into view.
export function SiteEffects() {
  const pathname = usePathname();

  // A language switch rebuilds the page shell in the browser, which drops the classes
  // the start-up script put on <html>. They go back before the next paint, and the
  // opening animation is marked as already seen so that it does not replay.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("js")) return;
    root.classList.add("js", "intro-done");
  }, []);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (calm || touch) return;
    lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.11 });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    const pending = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-in])");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.in = "";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    pending.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
