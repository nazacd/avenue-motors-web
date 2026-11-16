"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { startingQuality } from "@/lib/quality";

type Pictures = { path: string; width: number; height: number };
// A set of frames, with a small copy of every few of them (`every`), numbered from 000 too.
type FrameSet = Pictures & { small: Pictures & { every: number } };

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

const frameUrl = (set: Pictures, index: number) => `${set.path}/${String(index).padStart(3, "0")}.webp`;

// How quickly the picture catches up with the scroll, in milliseconds. A mouse wheel
// moves the page in jumps; this turns each jump into a short glide. (Kept brief: the
// site already eases wheel scrolling.) Under a finger the page moves evenly by itself,
// and the picture should stay with the finger, so there it is briefer still.
const GLIDE = 90;
const GLIDE_TOUCH = 40;
// Frames unpacked ahead of the one on show in the direction of travel, and behind it;
// and how far from it a frame may fall before it is let go of. An unpacked frame is
// big (eight megabytes for a wide one), so only a small window of them is ever held.
const AHEAD = 8;
const BEHIND = 3;
const KEPT = 9;
const MOST_KEPT = 28;
const UNPACKED_AT_ONCE = 6;
// Unpacking a frame takes a few drawings' time. A frame started for where the film is
// now would be ready after the film has moved on, so frames are started for where it
// will be this many drawings from now.
const LEAD = 3;
// After falling back to the small film while moving, this many full-size frames in a
// row must be ready before going back to them.
const STEADY = 2;
const LOADS_AT_ONCE = 6;

// A tall section whose picture stays put while the visitor scrolls through it. The
// scroll position picks the frame of the film, so the cover comes off the car as the
// page moves, and goes back on when scrolling up.
//
// The film is a run of still pictures drawn on a canvas, which any device can show
// at once; asking a video for one frame after another cannot keep up with a finger.
// Between two frames the next is faded in over the last, so the motion has no steps.
// Weaker devices load every second or fourth frame and lean on that fade.
//
// A full-size frame takes a moment to unpack, and a fast scroll passes frames quicker
// than that. So the film is also held as small pictures, all unpacked and all in
// memory: whenever the full-size frame is not ready the small one is drawn, and the
// picture keeps up with the scroll at any speed. It sharpens as the scroll eases.
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
    // off the main thread and only for the frames about to be shown.
    const packed: (Blob | undefined)[] = new Array(used.length);
    const ready = new Map<number, ImageBitmap>();
    const unpacking = new Set<number>();
    // The small film: one picture for every `every` frames, unpacked for good.
    const { small } = set;
    const smallCount = still ? 0 : Math.floor(lastFrame / small.every) + 1;
    const rough: (ImageBitmap | undefined)[] = new Array(smallCount);
    let dead = false;
    let dirty = true;
    let painted = -1;
    // Whether the last drawing was the full-size frame asked for.
    let sharp = false;

    // ── Loading: the two ends first, then ever finer steps between them, so that
    // there is something of the whole film to move through long before all of it has
    // arrived. The small film goes first; it is a twentieth of the weight.
    const roughestFirst = (end: number) => {
      const order = [0];
      if (end > 0) order.push(end);
      for (let stride = 32; stride >= 1; stride /= 2) {
        for (let index = stride; index < end; index += stride) {
          if (stride === 32 || index % (stride * 2) !== 0) order.push(index);
        }
      }
      return order;
    };
    type Load = { small: boolean; index: number };
    // The weakest devices take every second small picture.
    const smallStep = quality === "basic" ? 2 : 1;
    const queue: Load[] = roughestFirst(last).map((index) => ({ small: false, index }));
    if (smallCount > 0) {
      const smallOnes = roughestFirst(Math.floor((smallCount - 1) / smallStep));
      queue.unshift(...smallOnes.map((index) => ({ small: true, index: index * smallStep })));
    }

    let started = false;
    let loading = 0;
    const loadNext = () => {
      while (!dead && loading < LOADS_AT_ONCE && queue.length) {
        const load = queue.shift()!;
        loading++;
        fetch(load.small ? frameUrl(small, load.index) : frameUrl(set, used[load.index]))
          .then((answer) => (answer.ok ? answer.blob() : undefined))
          .catch(() => undefined)
          .then((blob) => {
            loading--;
            if (dead) return;
            if (blob && load.small) {
              // A browser too old for this keeps showing the first picture.
              if (typeof createImageBitmap === "function") {
                createImageBitmap(blob).then(
                  (bitmap) => {
                    if (dead) return bitmap.close();
                    rough[load.index] = bitmap;
                    if (!sharp) dirty = true;
                  },
                  () => {},
                );
              }
            } else if (blob) {
              packed[load.index] = blob;
              if (!sharp) dirty = true;
            }
            loadNext();
          });
      }
    };

    const unpack = (slot: number) => {
      const blob = packed[slot];
      if (!blob || ready.has(slot) || unpacking.has(slot) || unpacking.size >= UNPACKED_AT_ONCE) return;
      if (typeof createImageBitmap !== "function") return;
      unpacking.add(slot);
      createImageBitmap(blob).then(
        (bitmap) => {
          unpacking.delete(slot);
          if (dead) return bitmap.close();
          ready.set(slot, bitmap);
          // Worth a new drawing only if it is the frame on show, or better than what is.
          if (!sharp || Math.abs(slot - painted) <= 1) dirty = true;
          // One is done, so the next in line can start.
          warm(centre, pace);
        },
        () => unpacking.delete(slot),
      );
    };

    // 1, 2, 4, 8…: moving fast, the screen shows only every few frames of the film, so
    // only every few are made ready. The steps fit inside one another, so a change of
    // pace still finds the frames made ready a moment ago.
    const strideFor = (speed: number) => (speed < 1.5 ? 1 : Math.min(16, 2 ** Math.round(Math.log2(speed))));

    // Gets full-size frames ready ahead of the film: starting from where it will be in a
    // few drawings' time and on from there, then back towards where it is now. `pace` is
    // how many frames the film moves per drawing, negative when going back.
    let centre = 0;
    let pace = 0;
    const warm = (slot: number, velocity: number) => {
      centre = slot;
      pace = velocity;
      const speed = Math.abs(velocity);
      const way = velocity < 0 ? -1 : 1;
      const stride = strideFor(speed);
      const lead = Math.round(speed * LEAD);
      const within = (index: number) => Math.min(last, Math.max(0, index));
      const base = within(Math.round((slot + way * lead) / stride) * stride);
      unpack(base);
      for (let away = 1; away <= AHEAD; away++) unpack(within(base + away * stride * way));
      // Back to the frame on show, and at rest a few behind it for a change of direction.
      const back = Math.ceil(lead / stride) + (speed < 0.5 ? BEHIND : 0);
      for (let away = 1; away <= back; away++) unpack(within(base - away * stride * way));
      unpack(slot);

      const reach = KEPT * stride + lead;
      for (const [kept, bitmap] of ready) {
        if (Math.abs(kept - slot) > reach) {
          bitmap.close();
          ready.delete(kept);
        }
      }
      // A change of pace can leave frames of several spacings in reach; the furthest go.
      const middle = slot + (way * lead) / 2;
      while (ready.size > MOST_KEPT) {
        let furthest = -1;
        for (const kept of ready.keys()) {
          if (furthest < 0 || Math.abs(kept - middle) > Math.abs(furthest - middle)) furthest = kept;
        }
        ready.get(furthest)?.close();
        ready.delete(furthest);
      }
    };

    // The nearest small picture that has arrived, looking outward from `index`.
    const nearestRough = (index: number) => {
      for (let away = 0; away < smallCount; away++) {
        if (rough[index - away]) return index - away;
        if (rough[index + away]) return index + away;
      }
      return -1;
    };

    // Fills the canvas with a frame, cropped evenly where the shapes differ. The small
    // pictures have the shape of the full ones, so one sum places both.
    const cover = (bitmap: ImageBitmap, alpha: number) => {
      const scale = Math.max(canvas.width / set.width, canvas.height / set.height);
      const width = set.width * scale;
      const height = set.height * scale;
      context.globalAlpha = alpha;
      context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    };

    let streak = 0;
    const paint = (position: number) => {
      const slot = Math.min(last, Math.floor(position));
      const mix = position - slot;
      // How far the film has moved since the last drawing, in frames.
      const velocity = painted < 0 ? 0 : position - painted;
      const moved = Math.abs(velocity);
      const way = velocity < 0 ? -1 : 1;
      // Moving fast, each drawing is already a new frame; the fade is for slow travel.
      const slow = moved < 1.25;
      const stride = strideFor(moved);
      warm(slot, velocity);

      // The full-size frame for this drawing: the very one or, failing that, a ready one
      // close by, which the eye cannot tell from it in motion. One the film has just
      // passed is preferred to one it has not reached, so the picture never steps back.
      let wanted = ready.get(slot);
      const reach = slow ? 1 : Math.max(2, Math.ceil(stride * 1.5));
      for (let away = 1; !wanted && away <= reach; away++) {
        wanted = ready.get(slot - away * way) ?? (away <= stride / 2 ? ready.get(slot + away * way) : undefined);
      }
      streak = wanted ? streak + 1 : 0;

      // Once on the small film, stay on it until the scroll has eased or the full
      // frames are keeping up again: going back and forth would make the picture flicker.
      if (wanted && (sharp || slow || streak >= STEADY)) {
        sharp = true;
        cover(wanted, 1);
        const next = ready.get(slot + 1);
        if (next && slow && wanted === ready.get(slot) && mix > 0.02) cover(next, mix);
      } else {
        sharp = false;
        const film = (used[slot] + mix * (slot < last ? used[slot + 1] - used[slot] : 0)) / small.every;
        const index = Math.min(smallCount - 1, Math.floor(film));
        const shown = nearestRough(index);
        if (shown < 0) {
          // Nothing small yet either (or reduced motion, which has no small film).
          if (!wanted) return false;
          cover(wanted, 1);
          sharp = true;
        } else {
          cover(rough[shown]!, 1);
          const next = rough[shown + 1];
          if (shown === index && next && slow && film - index > 0.02) cover(next, film - index);
        }
      }
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
    const glide = window.matchMedia("(pointer: coarse)").matches ? GLIDE_TOUCH : GLIDE;

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
      eased = eased < 0 ? target : eased + (target - eased) * (1 - Math.exp(-passed / glide));
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
      for (const bitmap of rough) bitmap?.close();
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
