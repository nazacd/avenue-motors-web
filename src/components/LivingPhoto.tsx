"use client";

import { useEffect, useRef } from "react";

type LivingPhotoProps = {
  src: string;
  // Given by a gallery: play while this photo is the one on show. Left out on a card,
  // where the loop plays while the pointer is over the card, or on a touch screen
  // while the card is in the middle of the screen.
  active?: boolean;
};

// A short silent loop laid over the photo it was made from. Nothing is downloaded
// until it is first asked to play.
export function LivingPhoto({ src, active }: LivingPhotoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let wanted = false;
    const play = () => {
      wanted = true;
      video.play().then(
        () => {
          if (wanted) video.classList.add("is-live");
        },
        () => {},
      );
    };
    const stop = () => {
      wanted = false;
      video.classList.remove("is-live");
      video.pause();
    };

    if (active !== undefined) {
      if (active) play();
      return stop;
    }

    const card = video.closest<HTMLElement>(".card");
    if (!card) return;
    if (window.matchMedia("(hover: hover)").matches) {
      card.addEventListener("pointerenter", play);
      card.addEventListener("pointerleave", stop);
      return () => {
        card.removeEventListener("pointerenter", play);
        card.removeEventListener("pointerleave", stop);
        stop();
      };
    }
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : stop()), {
      rootMargin: "-30% 0px -30% 0px",
    });
    observer.observe(video);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [active]);

  return <video ref={ref} className="living" src={src} muted loop playsInline preload="none" aria-hidden tabIndex={-1} />;
}
