# Film takes

The takes chosen for the hero film, as generated (720p, with their own sound). `scripts/build-film.sh` cuts them into the file the site plays.

| File | Shot | Higgsfield job |
|---|---|---|
| `v1-ignition.mp4` | V1, take b | `349a205a-fb7f-41ad-b4bd-b27af5b51b26` |
| `v2-row.mp4` | V2, take b | `4c699b4b-8fd4-4309-ac20-e189a51d6d77` |
| `v3-exit.mp4` | V3, take a | `6ea767ee-6754-42a4-9bc7-eb42d3909b20` |
| `v4-avenue.mp4` | V4, take a | `7c872be5-3f9d-4a28-acad-6e9137d6e158` |
| `v5-tunnel.mp4` | V5, take b | `7a45bef2-cb6f-4e00-934d-09fe05f43513` |
| `v6-pass.mp4` | V6, take b | `b30b38c1-162b-4834-ba5f-345b0f2eb8f3` |
| `v7-return.mp4` | V7, take b | `ad4ebe92-f5b1-4993-919c-9e2333a90836` |
| `v1v-ignition.mp4` | V1 upright, take b | `f00d640d-7cb8-4c37-8b35-fcfa45530dae` |
| `v2v-row.mp4` | V2 upright, take b | `7f6dd57a-640c-45b2-99d2-b5b7904f63de` |
| `v3v-exit.mp4` | V3 upright, take b | `27277eb6-61a4-4ac9-90cb-527985b22aea` |
| `v4v-avenue.mp4` | V4 upright, take c | `e91f4c48-064d-4bbc-9081-a5b144e8a5d4` |
| `v5v-tunnel.mp4` | V5 upright, take b | `e60a60fc-a1b9-47da-b5d7-f0fb1d55172c` |
| `v6v-pass.mp4` | V6 upright, take d | `6d0c9edb-78da-4df0-9548-8e96ffe4d477` |
| `v7v-return.mp4` | V7 upright, take a | `83eb3ba3-d6b9-431b-b811-6d12af3a2523` |
| `xv1-reveal.mp4` | XV1, take b: the cover comes off the G 63 | `6c12aded-f445-4e29-99fe-60526eec4370` |

`v1v-ignition-glitch.mp4` is made from `v1v-ignition.mp4` by `scripts/build-ignition.mjs`.
In the wide take the headlamps flash on, go dark and come on again, as when an engine
catches; the upright take only faded them up, so the same stutter is added from its own
frames. The phone film is cut from this version.

`xv1-reveal.mp4` is not part of the hero film. The home page moves through it as the
visitor scrolls. Take a was left out: its headlights show through the cover.

`xv1-reveal-2k.mp4` is that take at twice the size (2560×1440), which is what the site's
frames are cut from. Higgsfield's own video upscaler is not part of the trial, so it was
made here, frame by frame, with Real-ESRGAN's small general model:

```bash
python -m venv venv && venv/bin/pip install torch numpy pillow
curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth
ffmpeg -i source/film/xv1-reveal.mp4 -t 5.9 -vsync 0 frames/%04d.png
venv/bin/python scripts/upscale-frames.py realesr-general-x4v3.pth frames frames-2k
ffmpeg -framerate 24 -i frames-2k/%04d.png -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p source/film/xv1-reveal-2k.mp4
```

It takes about twelve seconds a frame without a graphics card, half an hour in all.
`npm run reveal` then cuts the frames the site uses (`public/media/reveal`).
