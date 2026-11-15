"use client";

import { useEffect, useRef } from "react";
import { startingQuality } from "@/lib/quality";

type RevealProps = {
  video: string;
  // The film's first frame, shown until the film has loaded.
  poster: string;
  // What is written over the picture before and after the cover comes off.
  before: React.ReactNode;
  after: React.ReactNode;
};

// A tall section whose picture stays put while the visitor scrolls through it. The
// scroll position picks the frame of the film, so the cover comes off the car as the
// page moves, and goes back on when scrolling up.
//
// Jumping about in a film asks a lot of a weak phone. Where the device is slow to show
// the frame it was asked for, the section changes to something any device can do: it
// plays the film through once when the visitor reaches it, and rewinds when they
// scroll back above it.
export function Reveal({ video, poster, before, after }: RevealProps) {
  const section = useRef<HTMLElement>(null);
  const film = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = section.current;
    const clip = film.current;
    if (!root || !clip) return;

    // The last frame, a touch short of the end so that the picture does not go blank.
    const end = () => Math.max(0, (clip.duration || 0) - 0.06);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No scrubbing: show the car uncovered.
      root.dataset.stage = "2";
      const toEnd = () => (clip.currentTime = end());
      clip.preload = "auto";
      if (clip.readyState >= 1) toEnd();
      else clip.addEventListener("loadedmetadata", toEnd, { once: true });
      return;
    }

    let frame = 0;
    let near = false;
    let primed = false;
    let shown = -1;

    // The simple way of showing the film, and what leads to it.
    let simple = startingQuality() !== "full";
    let playing = false;
    let asked = 0;
    let slow = 0;
    const onSeeked = () => {
      if (!asked) return;
      const took = performance.now() - asked;
      asked = 0;
      // Four frames in a row that each took longer than a sixth of a second.
      slow = took > 170 ? slow + 1 : 0;
      if (slow >= 4) simple = true;
    };
    clip.addEventListener("seeked", onSeeked);

    const tick = () => {
      const box = root.getBoundingClientRect();
      const travel = box.height - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -box.top / travel)) : 0;
      root.style.setProperty("--progress", progress.toFixed(3));
      if (simple) {
        root.dataset.mode = "simple";
        if (progress > 0.1 && !playing) {
          playing = true;
          clip.playbackRate = 1.25;
          clip.play().catch(() => {});
        } else if (progress < 0.03 && playing) {
          playing = false;
          clip.pause();
          clip.currentTime = 0;
        }
        // The words follow the film here, not the scroll.
        root.dataset.stage = !playing ? "0" : clip.currentTime < end() * 0.9 ? "1" : "2";
      } else {
        root.dataset.stage = progress < 0.16 ? "0" : progress < 0.74 ? "1" : "2";
        // The cover is off a little before the end, which leaves the car on show for a beat.
        const target = Math.min(1, progress / 0.86) * end();
        if (clip.duration && !clip.seeking && Math.abs(target - shown) > 0.02) {
          asked = performance.now();
          clip.currentTime = target;
          shown = target;
        }
      }
      if (near) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        cancelAnimationFrame(frame);
        if (!near) return;
        if (!primed) {
          primed = true;
          clip.preload = "auto";
          // Phones do not fetch a film until it is played, so it is started and
          // stopped at once; from then on any frame can be shown.
          clip.play().then(
            () => {
              if (!playing) clip.pause();
            },
            () => clip.load(),
          );
        }
        frame = requestAnimationFrame(tick);
      },
      { rootMargin: "60% 0px 60% 0px" },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clip.removeEventListener("seeked", onSeeked);
    };
  }, []);

  return (
    <section ref={section} className="reveal" data-stage="0">
      <div className="reveal__pin">
        <video ref={film} className="reveal__film" src={video} poster={poster} muted playsInline preload="metadata" aria-hidden tabIndex={-1} />
        <div className="reveal__shade" />
        <div className="container reveal__text">
          <div className="reveal__before">{before}</div>
          <div className="reveal__after">{after}</div>
        </div>
        <span className="reveal__bar" aria-hidden />
      </div>
    </section>
  );
}
