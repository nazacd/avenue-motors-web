// Gives the upright ignition take the stutter that the wide take has.
//
// In the wide take the headlamp rings flash on for three frames, go dark for five and
// then come on for good, the way lamps do as an engine catches. In the upright take
// they only fade up. The room and the camera do not move in that shot, so the stutter
// can be made from the take's own frames: for eight frames the lamps and their
// reflections in the floor are swapped for the same spots from another moment, lit or
// dark.
//
// Needs ffmpeg. Run from the repository root: node scripts/build-ignition.mjs
// Reads source/film/v1v-ignition.mp4, writes source/film/v1v-ignition-glitch.mp4.
// scripts/build-film.sh then cuts the phone film from the result.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "source/film/v1v-ignition.mp4");
const output = path.join(root, "source/film/v1v-ignition-glitch.mp4");

// Where the two lamps and their reflections in the floor are in the 720 by 1280 frame,
// as ovals. Only these are swapped: the room is still brightening while the lamps come
// on, so a larger patch would show as a box of the wrong brightness.
const SPOTS = [
  { cx: 225, cy: 693, rx: 50, ry: 50 },
  { cx: 445, cy: 693, rx: 50, ry: 50 },
  { cx: 225, cy: 1018, rx: 46, ry: 62 },
  { cx: 445, cy: 1018, rx: 46, ry: 62 },
];
// How softly each oval fades into the frame around it.
const FEATHER = 9;

// Frame of the take (counted from 0) → the frame its lamps are taken from. The rings
// begin to glow at frame 133 and are fully lit by 141.
const SWAP = new Map([
  [133, 138], // flash
  [134, 140],
  [135, 139],
  [136, 130], // dark
  [137, 131],
  [138, 132],
  [139, 131],
  [140, 130],
]);

const ffmpeg = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
const work = mkdtempSync(path.join(os.tmpdir(), "ignition-"));
const frame = (n) => path.join(work, `${String(n + 1).padStart(4, "0")}.png`);

try {
  ffmpeg(["-i", input, "-vsync", "0", path.join(work, "%04d.png")]);

  const { width, height } = await sharp(frame(0)).metadata();
  // White where a frame is replaced, black where it is kept, soft between.
  const mask = await sharp(
    Buffer.from(
      `<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="#000"/>${SPOTS.map(
        (spot) => `<ellipse cx="${spot.cx}" cy="${spot.cy}" rx="${spot.rx}" ry="${spot.ry}" fill="#fff"/>`,
      ).join("")}</svg>`,
    ),
  )
    .blur(FEATHER)
    .extractChannel(0)
    .raw()
    .toBuffer();

  // Read every source frame before any frame is written over.
  const sources = new Map();
  for (const from of new Set(SWAP.values())) {
    const pixels = await sharp(frame(from)).removeAlpha().raw().toBuffer();
    sources.set(
      from,
      await sharp(pixels, { raw: { width, height, channels: 3 } })
        .joinChannel(mask, { raw: { width, height, channels: 1 } })
        .png()
        .toBuffer(),
    );
  }

  for (const [to, from] of SWAP) {
    const patched = await sharp(frame(to))
      .composite([{ input: sources.get(from) }])
      .png()
      .toBuffer();
    await sharp(patched).toFile(frame(to));
  }

  ffmpeg([
    "-framerate", "24", "-i", path.join(work, "%04d.png"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    output,
  ]);
  console.log(`Wrote ${path.relative(root, output)}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
