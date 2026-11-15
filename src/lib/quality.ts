// How much the heavier parts of the site (the 3D garage, the scroll reveal) ask of a
// device. Strong devices get everything; effects are only cut where the device shows it
// cannot keep up.
//   full   everything
//   light  no glow or vignette, no cast shadows, no headlamp beams, a coarser floor reflection
//   basic  as light, and the floor no longer mirrors the room
export type Quality = "full" | "light" | "basic";

const ORDER: Quality[] = ["full", "light", "basic"];

export function lower(quality: Quality): Quality {
  return ORDER[Math.min(ORDER.indexOf(quality) + 1, ORDER.length - 1)];
}

// A level fixed in the address, for trying each one out: /garage?quality=basic
export function forcedQuality(): Quality | null {
  const asked = new URLSearchParams(window.location.search).get("quality");
  return ORDER.includes(asked as Quality) ? (asked as Quality) : null;
}

type Hints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

// A first guess from what the browser says about the device. Many browsers say little
// (no iPhone reports its memory), so the garage also measures its own frame rate and
// steps down from here if it has to.
export function startingQuality(): Quality {
  const forced = forcedQuality();
  if (forced) return forced;
  const device = navigator as Hints;
  if (device.connection?.saveData) return "basic";
  if (device.deviceMemory !== undefined && device.deviceMemory <= 2) return "basic";
  if (device.deviceMemory !== undefined && device.deviceMemory <= 4) return "light";
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return "light";
  return "full";
}
