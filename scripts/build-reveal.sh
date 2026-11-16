#!/usr/bin/env bash
# Cuts the reveal (the cover coming off the G 63) into the still pictures the home page
# moves through as the visitor scrolls.
#
#   npm run reveal
#
# The source is the enlarged film, source/film/xv1-reveal-2k.mp4 (see source/film/README.md
# for how that is made). Two things happen to it here:
#   - a frame is worked out between every two of its own, by following what moves, so
#     the film has twice the frames to scroll through;
#   - every frame is saved twice: whole for wide screens, and its middle for upright ones.
# It takes a few minutes: working out the in-between frames is slow.
set -euo pipefail
cd "$(dirname "$0")/.."

src="${1:-source/film/xv1-reveal-2k.mp4}"
out=public/media/reveal
wide="1920:1080"
tall="768:1280"
quality=60

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# 1. The in-between frames, kept in a scratch file at close to full quality.
ffmpeg -v error -y -i "$src" -an \
  -vf "minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none" \
  -c:v libx264 -preset veryfast -crf 6 -pix_fmt yuv420p "$work/all.mp4"

# 2. The two sets of pictures.
rm -rf "$out"
mkdir -p "$out/wide" "$out/tall"
ffmpeg -v error -y -i "$work/all.mp4" -filter_complex "
  [0:v]split=2[a][b];
  [a]scale=${wide}:flags=lanczos[wide];
  [b]scale=-2:${tall#*:}:flags=lanczos,crop=${tall}[tall]" \
  -map "[wide]" -fps_mode passthrough -c:v libwebp -quality $quality -compression_level 6 -start_number 0 "$out/wide/%03d.webp" \
  -map "[tall]" -fps_mode passthrough -c:v libwebp -quality $quality -compression_level 6 -start_number 0 "$out/tall/%03d.webp"

# 3. A small copy of every second frame. These are light enough to keep unpacked all the
# time, so there is always something to draw however fast the page is scrolled; the
# full-size frame takes over as soon as the scrolling eases.
small_wide="640:360"
small_tall="288:480"
for shape in wide tall; do
  size=$([ "$shape" = wide ] && echo "$small_wide" || echo "$small_tall")
  mkdir -p "$out/$shape/small"
  ffmpeg -v error -y -start_number 0 -i "$out/$shape/%03d.webp" \
    -vf "select='not(mod(n\,2))',scale=${size}:flags=lanczos" \
    -fps_mode passthrough -c:v libwebp -quality 55 -compression_level 6 -start_number 0 "$out/$shape/small/%03d.webp"
done

count=$(find "$out/wide" -maxdepth 1 -name '*.webp' | wc -l)
cat > src/data/reveal.json <<JSON
{
  "count": $count,
  "wide": {
    "path": "/media/reveal/wide",
    "width": ${wide%:*},
    "height": ${wide#*:},
    "small": { "path": "/media/reveal/wide/small", "width": ${small_wide%:*}, "height": ${small_wide#*:}, "every": 2 }
  },
  "tall": {
    "path": "/media/reveal/tall",
    "width": ${tall%:*},
    "height": ${tall#*:},
    "small": { "path": "/media/reveal/tall/small", "width": ${small_tall%:*}, "height": ${small_tall#*:}, "every": 2 }
  }
}
JSON

echo "$count frames"
du -sh "$out/wide" "$out/tall" "$out/wide/small" "$out/tall/small"
