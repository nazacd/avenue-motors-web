"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { startingQuality } from "@/lib/quality";

type FrameSet = { path: string; width: number; height: number };

// The film as separate pictures, numbered from 000: one set cut for wide screens and
// one for upright ones.
export type RevealFrames = { count: number; wide: FrameSet; tall: FrameSet };

type RevealProps = {
  frames: RevealFrames;
  // What is written over the picture before and after the cover comes off.
  before: React.ReactNode;
  after: React.ReactNode;
};

type Shape = "wide" | "tall";

const UPRIGHT = "(max-aspect-ratio: 7/10)";

function watchShape(changed: () => void) {
  const query = window.matchMedia(UPRIGHT);
  query.addEventListener("change", changed);
  return () => query.removeEventListener("change", changed);
}

const readShape = (): Shape => (window.matchMedia(UPRIGHT).matches ? "tall" : "wide");
const noShape = () => null;

const frameUrl = (set: FrameSet, index: number) => `${set.path}/${String(index).padStart(3, "0")}.webp`;

// How quickly the picture catches up with the scroll, in milliseconds. A mouse wheel
// moves the page in jumps; this turns each jump into a short glide. (Kept brief: the
// site already eases wheel scrolling, and a finger needs none.)
const GLIDE = 90;
// Frames unpacked ahead of the one on show in the direction of travel, and behind it;
// and how far from it a frame may fall before it is let go of. An unpacked frame is
// big (eight megabytes for a wide one), so only a small window of them is ever held.
const AHEAD = 8;
const BEHIND = 3;
const KEPT = 9;
const UNPACKED_AT_ONCE = 4;
const LOADS_AT_ONCE = 6;

// A tall section whose picture stays put while the visitor scrolls through it. The
// scroll position picks the frame of the film, so the cover comes off the car as the
// page moves, and goes back on when scrolling up.
//
// The film is a run of still pictures drawn on a canvas, which any device can show
// at once; asking a video for one frame after another cannot keep up with a finger.
// Between two frames the next is faded in over the last, so the motion has no steps.
// Weaker devices load every second or fourth frame and lean on that fade.
export function Reveal({ frames, before, after }: RevealProps) {
  const section = useRef<HTMLElement>(null);
  const screen = useRef<HTMLCanvasElement>(null);
  const shape = useSyncExternalStore<Shape | null>(watchShape, readShape, noShape);

  useEffect(() => {
    const root = section.current;
    const canvas = screen.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!root || !canvas || !context || !shape) return;

    const set = frames[shape];
    const quality = startingQuality();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The frames this device uses. With reduced motion, only the last: the car uncovered.
    const lastFrame = frames.count - 1;
    const step = quality === "full" ? 1 : quality === "light" ? 2 : 4;
    const used: number[] = [];
    if (!still) for (let index = 0; index < lastFrame; index += step) used.push(index);
    used.push(lastFrame);
    const last = used.length - 1;

    // Every frame is fetched as it comes off the server, still packed. Unpacking is done
    // off the main thread and only for the frames about to be shown; a frame that is
    // not ready is never waited for: the nearest ready one stands in until it is.
    const packed: (Blob | undefined)[] = new Array(used.length);
    const ready = new Map<number, ImageBitmap>();
    const unpacking = new Set<number>();
    let dead = false;
    let dirty = true;
    let painted = -1;
    let exact = false;

    // ── Loading: the two ends first, then ever finer steps between them, so that
    // there is a rough film to move through long before every frame has arrived.
    const queue = [0];
    if (last > 0) queue.push(last);
    for (let stride = 32; stride >= 1; stride /= 2) {
      for (let slot = stride; slot < last; slot += stride) {
        if (stride === 32 || slot % (stride * 2) !== 0) queue.push(slot);
      }
    }
    let started = false;
    let loading = 0;
    const loadNext = () => {
      while (!dead && loading < LOADS_AT_ONCE && queue.length) {
        const slot = queue.shift()!;
        loading++;
        fetch(frameUrl(set, used[slot]))
          .then((answer) => (answer.ok ? answer.blob() : undefined))
          .catch(() => undefined)
          .then((blob) => {
            loading--;
            if (dead) return;
            packed[slot] = blob;
            if (blob && !exact) dirty = true;
            loadNext();
          });
      }
    };

    const unpack = (slot: number) => {
      const blob = packed[slot];
      if (!blob || ready.has(slot) || unpacking.has(slot) || unpacking.size >= UNPACKED_AT_ONCE) return;
      // A browser too old for this keeps showing the first picture.
      if (typeof createImageBitmap !== "function") return;
      unpacking.add(slot);
      createImageBitmap(blob).then(
        (bitmap) => {
          unpacking.delete(slot);
          if (dead) return bitmap.close();
          ready.set(slot, bitmap);
          // Worth a new drawing only if it is the frame on show, or better than its stand-in.
          if (!exact || Math.abs(slot - painted) <= 1) dirty = true;
          // One is done, so the next in line can start.
          warm(centre, forwards);
        },
        () => unpacking.delete(slot),
      );
    };

    // Gets the frames around the one wanted ready, nearest first and mostly in the
    // direction of travel, and lets go of those left far behind.
    let centre = 0;
    let forwards = true;
    const warm = (slot: number, forward: boolean) => {
      centre = slot;
      forwards = forward;
      const way = forward ? 1 : -1;
      unpack(slot);
      for (let away = 1; away <= AHEAD; away++) {
        const ahead = slot + away * way;
        const behind = slot - away * way;
        if (ahead >= 0 && ahead <= last) unpack(ahead);
        if (away <= BEHIND && behind >= 0 && behind <= last) unpack(behind);
      }
      for (const [kept, bitmap] of ready) {
        if (Math.abs(kept - slot) > KEPT) {
          bitmap.close();
          ready.delete(kept);
        }
      }
    };

    const nearestReady = (slot: number) => {
      let best = -1;
      for (const kept of ready.keys()) {
        if (best < 0 || Math.abs(kept - slot) < Math.abs(best - slot)) best = kept;
      }
      return best;
    };

    // Fills the canvas with a frame, cropped evenly where the shapes differ.
    const cover = (bitmap: ImageBitmap, alpha: number) => {
      const scale = Math.max(canvas.width / set.width, canvas.height / set.height);
      const width = set.width * scale;
      const height = set.height * scale;
      context.globalAlpha = alpha;
      context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    };

    const paint = (position: number) => {
      const slot = Math.min(last, Math.floor(position));
      const mix = position - slot;
      // Moving fast, each drawing is already a new frame; the fade is for slow travel.
      const slow = painted < 0 || Math.abs(position - painted) < 1.25;
      warm(slot, position >= painted);
      const wanted = ready.get(slot);
      exact = Boolean(wanted);
      const shown = wanted ?? ready.get(nearestReady(slot));
      if (!shown) return false;
      cover(shown, 1);
      const next = ready.get(slot + 1);
      if (wanted && next && slow && mix > 0.02) cover(next, mix);
      canvas.dataset.ready = "";
      return true;
    };

    // The canvas has as many dots as the screen can show, but never more than the
    // frames themselves hold.
    const sharpest = quality === "full" ? 2 : quality === "light" ? 1.5 : 1;
    const fit = () => {
      const { clientWidth, clientHeight } = canvas;
      if (!clientWidth || !clientHeight) return;
      const stretch = Math.max(clientWidth / set.width, clientHeight / set.height);
      const ratio = Math.min(window.devicePixelRatio || 1, sharpest, 1 / stretch);
      canvas.width = Math.round(clientWidth * ratio);
      canvas.height = Math.round(clientHeight * ratio);
      dirty = true;
    };
    const sizes = new ResizeObserver(fit);
    sizes.observe(canvas);
    fit();

    // ── Following the scroll.
    let frame = 0;
    let near = false;
    let ticked = 0;
    let eased = -1;
    let told = "";

    const tick = (now: number) => {
      const box = root.getBoundingClientRect();
      const travel = box.height - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -box.top / travel)) : 0;

      const text = progress.toFixed(3);
      if (text !== told) {
        told = text;
        root.style.setProperty("--progress", text);
        if (!still) root.dataset.stage = progress < 0.16 ? "0" : progress < 0.74 ? "1" : "2";
      }

      // The cover is off a little before the end, which leaves the car on show for a beat.
      const target = Math.min(1, progress / 0.86);
      const passed = Math.min(64, now - ticked);
      ticked = now;
      eased = eased < 0 ? target : eased + (target - eased) * (1 - Math.exp(-passed / GLIDE));
      if (Math.abs(target - eased) < 0.0003) eased = target;

      const position = eased * last;
      if (dirty || Math.abs(position - painted) > 0.004) {
        dirty = false;
        if (paint(position)) painted = position;
      }
      if (near) frame = requestAnimationFrame(tick);
    };

    if (still) root.dataset.stage = "2";

    const observer = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        cancelAnimationFrame(frame);
        if (!near) return;
        if (!started) {
          started = true;
          loadNext();
        }
        ticked = performance.now();
        frame = requestAnimationFrame(tick);
      },
      // Starts fetching the frames two screens before the section comes into view.
      { rootMargin: "200% 0px 100% 0px" },
    );
    observer.observe(root);

    return () => {
      dead = true;
      observer.disconnect();
      sizes.disconnect();
      cancelAnimationFrame(frame);
      for (const bitmap of ready.values()) bitmap.close();
      ready.clear();
      delete canvas.dataset.ready;
    };
  }, [frames, shape]);

  return (
    <section ref={section} className="reveal" data-stage="0">
      <div className="reveal__pin">
        {/* The first frame, on show until the canvas has something to draw. */}
        <picture>
          <source media={UPRIGHT} srcSet={frameUrl(frames.tall, 0)} />
          <img
            className="reveal__film"
            src={frameUrl(frames.wide, 0)}
            width={frames.wide.width}
            height={frames.wide.height}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </picture>
        <canvas ref={screen} className="reveal__film reveal__screen" aria-hidden />
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
