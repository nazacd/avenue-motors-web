// Builds the web-ready media in public/media from the raw Telegram export in source/.
// Run with `npm run media` after changing src/data/inventory.json or the source files.
// The output is committed, so a deploy does not need the raw export or ffmpeg.
//
// `npm run media -- photos`, `-- notes` or `-- site` rebuilds only that part.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photosDir = path.join(root, "source/photos");
const notesDir = path.join(root, "source/round_video_messages");
const outDir = path.join(root, "public/media");

const WIDTHS = [640, 1080, 1600, 2000];
const FALLBACK_WIDTH = 1080;
// Each round Telegram clip opens on the front camera, pointed at whoever is filming,
// before it flips to the car. This many seconds are cut from the start.
const NOTE_TRIM = 1;

const only = process.argv[2];
const doPhotos = !only || only === "photos";
const doNotes = !only || only === "notes";
const doSite = !only || only === "site";

const inventory = JSON.parse(readFileSync(path.join(root, "src/data/inventory.json"), "utf8"));
const photoFiles = readdirSync(photosDir).filter((f) => !f.includes("_thumb"));

function sourcePhoto(n) {
  const file = photoFiles.find((f) => f.startsWith(`photo_${n}@`));
  if (!file) throw new Error(`No source photo number ${n}`);
  return path.join(photosDir, file);
}

// Writes the responsive set for one image and returns what the page needs to render it.
async function writeImage(input, dir, base, { crop } = {}) {
  mkdirSync(dir, { recursive: true });
  let pipeline = sharp(input).rotate();
  if (crop) pipeline = pipeline.extract(crop);
  const master = await pipeline.toBuffer({ resolveWithObject: true });
  const { width, height } = master.info;
  const widths = WIDTHS.filter((w) => w <= width);
  if (widths.length === 0) widths.push(width);

  for (const w of widths) {
    await sharp(master.data)
      .resize({ width: w })
      .avif({ quality: 55, effort: 5 })
      .toFile(path.join(dir, `${base}-${w}.avif`));
  }
  const fallbackWidth = Math.min(FALLBACK_WIDTH, width);
  await sharp(master.data)
    .resize({ width: fallbackWidth })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(dir, `${base}-${fallbackWidth}.jpg`));

  const blur = await sharp(master.data).resize({ width: 20 }).webp({ quality: 40 }).toBuffer();
  const rel = path.relative(path.join(root, "public"), dir).split(path.sep).join("/");
  return {
    base: `/${rel}/${base}`,
    width,
    height,
    widths,
    fallbackWidth,
    blur: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
}

const manifestPath = path.join(root, "src/data/media.json");
// A part that is not being rebuilt keeps the entries from the last run.
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { cars: {}, site: {} };

if (doPhotos) rmSync(path.join(outDir, "cars"), { recursive: true, force: true });
if (doSite) rmSync(path.join(outDir, "site"), { recursive: true, force: true });
if (doNotes) rmSync(path.join(outDir, "notes"), { recursive: true, force: true });

const media = { cars: {}, site: previous.site };

for (const car of inventory) {
  const dir = path.join(outDir, "cars", car.slug);
  const entry = { photos: previous.cars[car.slug]?.photos ?? [], note: previous.cars[car.slug]?.note };

  if (doPhotos) {
    entry.photos = [];
    for (const [i, n] of car.photos.entries()) {
      entry.photos.push(await writeImage(sourcePhoto(n), dir, String(i + 1).padStart(2, "0")));
    }
  }

  if (!car.note) delete entry.note;

  if (car.note && doNotes) {
    const input = path.join(notesDir, car.note);
    const noteDir = path.join(outDir, "notes");
    mkdirSync(noteDir, { recursive: true });
    const video = path.join(noteDir, `${car.slug}.mp4`);
    ffmpeg([
      "-ss", String(NOTE_TRIM),
      "-i", input,
      "-vf", "fps=30,scale=400:400",
      "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "64k", "-ac", "1",
      "-movflags", "+faststart",
      video,
    ]);
    const posterPng = path.join(noteDir, `${car.slug}.png`);
    ffmpeg(["-ss", String(car.notePosterAt ?? 1), "-i", input, "-frames:v", "1", posterPng]);
    await sharp(posterPng).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(noteDir, `${car.slug}.jpg`));
    rmSync(posterPng);
    const duration = Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).toString(),
    );
    entry.note = {
      video: `/media/notes/${car.slug}.mp4`,
      poster: `/media/notes/${car.slug}.jpg`,
      duration: Math.round(duration),
    };
  }

  media.cars[car.slug] = entry;
  console.log(`${car.slug}: ${entry.photos.length} photos${entry.note ? ", video note" : ""}`);
}

if (doSite) {
  const siteDir = path.join(outDir, "site");
  media.site = {
    // The first key frame of the film, generated from the showroom's own photos. It is
    // cropped on the right so the sign and the car sit right of centre and the headline
    // has dark wall to stand on.
    heroWide: await writeImage(path.join(root, "source/stills/k1-ignition.jpg"), siteDir, "hero-wide", {
      crop: { left: 0, top: 40, width: 2312, height: 1300 },
    }),
    // Phones still get the real photo until the vertical key frame exists.
    heroTall: await writeImage(sourcePhoto(3), siteDir, "hero-tall"),
    showroom: await writeImage(sourcePhoto(11), siteDir, "showroom"),
    // The empty stage, shown while the 3D garage loads and where it cannot run.
    garage: await writeImage(path.join(root, "source/stills/k0-empty-stage.jpg"), siteDir, "garage"),
  };
}

writeFileSync(manifestPath, `${JSON.stringify(media, null, 2)}\n`);
console.log("Wrote src/data/media.json");
