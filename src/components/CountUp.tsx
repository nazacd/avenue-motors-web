"use client";

import { useEffect, useRef, useState } from "react";

// A number that counts up from zero the first time it scrolls into view. The server
// sends the finished number, so it reads correctly without scripts.
export function CountUp({ value, locale, suffix = "" }: { value: number; locale: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const started = performance.now();
        const length = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - started) / length);
          setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref}>
      {new Intl.NumberFormat(locale).format(shown)}
      {suffix}
    </span>
  );
}
