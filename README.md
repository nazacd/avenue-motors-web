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
| `scripts/build-model.mjs` | Turns a source car model into the small file the 3D garage loads. |
| `src/data/garage.ts` | Which cars stand in the 3D garage, and the paint colours on offer. |
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
3. Tell the garage what each part of the model is. The script prints the model's material names; `PARTS` in `src/components/garage/GarageScene.tsx` sorts them into paint, glass, chrome, lamps and plates. Every model names its materials differently, so each new one needs its own list.

The dealer plate and the wall sign are drawn from the logo in `src/components/garage/plate.ts`.

## Before it goes live

- Set `NEXT_PUBLIC_SITE_URL` to the real address. It is used for the sitemap, canonical links and share previews.
- The Maybach model in the garage was downloaded from Sketchfab, and its file carries the marks of a third-party download site, so its licence cannot be trusted. It is fine for a private preview; replace or license it before the site is public.
- The hero film is 720p, the most the trial gave, and has no sound yet. The takes in `source/film` keep their sound for a later cut.
