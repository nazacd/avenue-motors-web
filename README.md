# Avenue Motors website

The website for the Avenue Motors showroom: a home page, a catalogue and a page per car, in Russian, Uzbek and English.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000. For a production build, run `npm run build` and then `npm run start`.

## Where things live

| Path | What it is |
|---|---|
| `src/data/inventory.json` | The cars. This is the one file to edit when stock changes. |
| `src/data/site.ts` | Phones, Telegram handles and the installment terms. |
| `src/i18n/dictionaries/` | All site text, one file per language. |
| `src/app/globals.css` | The design system: colours, type, components. |
| `scripts/build-media.mjs` | Turns the raw export in `source/` into web-ready photos and clips in `public/media`. |
| `source/covers/` | The generated studio picture that leads each car's card and gallery, with notes on each. |
| `source/loops/` | Living photos: short loops of listing photos, with the list of which are used and why the others are not. |
| `scripts/build-ignition.mjs` | Adds the headlamp stutter to the phone film's opening shot. Run before `build-film.sh` if that take changes. |
| `scripts/build-reveal.sh` | Cuts the scroll reveal into its still frames (`npm run reveal`): twice the film's own frames, for wide and upright screens. |
| `scripts/upscale-frames.py` | Doubles the size of the reveal's frames before that; see `source/film/README.md`. |
| `.github/workflows/pages.yml`, `scripts/finish-export.mjs`, `src/lib/asset.ts` | The GitHub Pages deploy; see below. |
| `scripts/build-model.mjs` | Turns a source car model into the small file the 3D garage loads. |
| `src/data/garage.ts` | Which cars stand in the 3D garage, their factory figures, the camera views and the paint colours on offer. |
| `source/` | The raw Telegram export (photos and round video notes), source stills and source 3D models. |
| `brand/` | The logo mark as a vector, and raster copies. |
| `production/` | The brief and reference list for generating the hero film. |

## Adding or changing a car

1. Edit `src/data/inventory.json`. `photos` lists photo numbers from `source/photos` in display order; the first is the cover. `note` is the file name of a round video in `source/round_video_messages`.
2. Run `npm run media` to rebuild the photos and clips. It needs `ffmpeg` installed. To rebuild only one half, run `npm run media -- photos` or `npm run media -- notes`.
3. Commit the changes, including `public/media` and `src/data/media.json`.

A car with a price and no posted installment offer gets an estimate from the terms in `src/data/site.ts`, and the page labels it as an estimate.

## Adding a car to the 3D garage

1. Unpack the source model so its `.obj` and `.mtl` sit side by side, then convert it:

```bash
npm run model -- path/to/model.obj public/models/name.glb
```

2. Add the car to `src/data/garage.ts`.
3. Tell the garage what each part of the model is. Every model is built differently, so each has its own "recipe" function in `src/components/garage/GarageScene.tsx` that sorts its parts into paint, glass, chrome, lamps and plates. Add the car's factory figures (power, 0–100 km/h, top speed) to its entry in `src/data/garage.ts`; the garage shows them beside the car.

The dealer plate and the wall sign are drawn from the logo in `src/components/garage/plate.ts`.

## Weaker devices

The 3D garage and the scroll reveal cut their effects only where a device cannot keep up.

- **Garage.** It starts from what the browser says about the device, then watches its own frame rate. Each time it runs below about 34 frames a second for a few seconds it drops one level: first the glow, cast shadows and headlamp beams go and the floor reflection gets coarser; then the floor stops mirroring the room. It never steps back up during a visit.
- **Reveal.** The film is a run of still pictures drawn on a canvas. A strong device loads every one; a weaker one loads every second, the weakest (or one asking to save data) every fourth, and the fade between neighbouring frames covers the gaps. Every device also holds a small copy of the film ready at all times and draws from it whenever the full-size frame is not unpacked yet, so the picture keeps up with a fast scroll and sharpens as it eases. With reduced motion it shows only the last frame.

To see a level on any device, add `?quality=full`, `?quality=light` or `?quality=basic` to the address. That also stops the garage from changing level by itself.

## Deploying to GitHub Pages

Every push to `main` builds the site as plain files and publishes it, through `.github/workflows/pages.yml`. The address is https://nazacd.github.io/avenue-motors-web/.

One-time setup: in the repository's **Settings → Pages**, set **Source** to **GitHub Actions**. After that, the **Actions** tab shows each deploy, and "Run workflow" there starts one by hand.

GitHub Pages only serves files, so the deploy uses Next's static export rather than a server:

- `npm run build:pages` writes the site to `out/`. It is `next build` with `STATIC_EXPORT=1`, followed by `scripts/finish-export.mjs`.
- A project's Pages site lives in a folder named after the repository, so every address needs `/avenue-motors-web` in front. The workflow passes that in as `NEXT_PUBLIC_BASE_PATH`; links get it from Next, and pictures, films and models get it from `src/lib/asset.ts`. With a domain of its own the base path is empty and nothing else changes.
- With no server to redirect, `scripts/finish-export.mjs` writes two small pages: the root one sends a visitor to their browser's language, and `404.html` sends an unknown address to the "not found" screen in its own language (`/ru/404/`).

To try the export locally with the same addresses:

```bash
NEXT_PUBLIC_BASE_PATH=/avenue-motors-web npm run build:pages
```

`npm run dev`, `npm run build` and `npm run start` are unchanged: without those settings the site runs as an ordinary Next.js server.

## Before it goes live

- Set `NEXT_PUBLIC_SITE_URL` to the real address. It is used for the sitemap, canonical links and share previews. The GitHub Pages deploy sets it by itself.
- The Maybach model in the garage was downloaded from Sketchfab, and its file carries the marks of a third-party download site, so its licence cannot be trusted. It is fine for a private preview; replace or license it before the site is public. (The GitHub Pages address is public: anyone with the link can open it.)
- The hero film is 720p, the most the trial gave, and has no sound yet. The takes in `source/film` keep their sound for a later cut.
