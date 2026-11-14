#!/usr/bin/env bash
# Cuts the chosen takes in source/film into the silent hero film for wide screens.
# Needs ffmpeg. Run from the repository root: scripts/build-film.sh
set -euo pipefail

# Every shot gets the same crop as the hero still, so the sign and the cars sit right of
# centre and the still and the film line up when one fades into the other.
frame="crop=iw*0.84:ih*0.8464:0:ih*0.026,scale=1600:900:flags=lanczos,fps=24,format=yuv420p"

ffmpeg -v error -y \
  -i source/film/v1-ignition.mp4 -i source/film/v4-avenue.mp4 \
  -i source/film/v5-tunnel.mp4 -i source/film/v6-pass.mp4 \
  -filter_complex "
    [0:v]trim=0.6:7.8,setpts=(PTS-STARTPTS)/1.25,${frame}[ignition];
    [1:v]trim=0.5:4.5,setpts=PTS-STARTPTS,${frame}[avenue];
    [2:v]trim=0.3:4.3,setpts=PTS-STARTPTS,${frame}[tunnel];
    [3:v]trim=1.0:5.6,setpts=PTS-STARTPTS,${frame}[pass];
    [ignition][avenue][tunnel][pass]concat=n=4:v=1:a=0,
    unsharp=5:5:0.5,noise=alls=5:allf=t,
    fade=t=in:st=0:d=0.4,fade=t=out:st=17.76:d=0.6[film]" \
  -map "[film]" -an -c:v libx264 -preset slow -crf 25 -maxrate 2600k -bufsize 5200k \
  -pix_fmt yuv420p -movflags +faststart public/media/film/night-run-wide.mp4

ls -la public/media/film/night-run-wide.mp4
