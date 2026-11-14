#!/usr/bin/env bash
# Cuts the chosen takes in source/film into the silent hero film: one cut for wide
# screens and one for upright phones.
# Needs ffmpeg. Run from the repository root: scripts/build-film.sh
set -euo pipefail

# The running order, and what is kept of each take. Both cuts use the same timings.
#   ignition  the lights come on in the showroom   (played a quarter faster)
#   row       a glide along the parked row
#   exit      the G 63 pulls out; the shot ends as its body blacks out the frame
#   avenue    the cars side by side under the lamps
#   tunnel    the chase through the tunnel
#   pass      the overtake on the open road
#   return    back at the showroom, the lights go out (played a fifth faster)
shots() {
  local frame=$1
  cat <<FILTER
    [0:v]trim=0.6:7.8,setpts=(PTS-STARTPTS)/1.25,${frame}[ignition];
    [1:v]trim=0.8:4.3,setpts=PTS-STARTPTS,${frame}[row];
    [2:v]trim=0.9:4.2,setpts=PTS-STARTPTS,${frame}[exit];
    [3:v]trim=0.5:4.5,setpts=PTS-STARTPTS,${frame}[avenue];
    [4:v]trim=0.3:4.3,setpts=PTS-STARTPTS,${frame}[tunnel];
    [5:v]trim=1.0:5.6,setpts=PTS-STARTPTS,${frame}[pass];
    [6:v]trim=0.4:5.9,setpts=(PTS-STARTPTS)/1.2,${frame}[return];
    [ignition][row][exit][avenue][tunnel][pass][return]concat=n=7:v=1:a=0
FILTER
}
# The seven pieces run 29.74 seconds; the fade to black takes the last 0.6.
fades="fade=t=in:st=0:d=0.4,fade=t=out:st=29.14:d=0.6"

inputs() {
  local suffix=$1
  for shot in ignition row exit avenue tunnel pass return; do
    local number
    case $shot in ignition) number=1 ;; row) number=2 ;; exit) number=3 ;; avenue) number=4 ;; tunnel) number=5 ;; pass) number=6 ;; return) number=7 ;; esac
    printf -- '-i source/film/v%s%s-%s.mp4 ' "$number" "$suffix" "$shot"
  done
}

# Every wide shot gets the same crop as the hero still, so the sign and the cars sit
# right of centre and the still and the film line up when one fades into the other.
wide="crop=iw*0.84:ih*0.8464:0:ih*0.026,scale=1600:900:flags=lanczos,fps=24,format=yuv420p"

# shellcheck disable=SC2046
ffmpeg -v error -y $(inputs "") \
  -filter_complex "$(shots "$wide"),unsharp=5:5:0.5,noise=alls=5:allf=t,${fades}[film]" \
  -map "[film]" -an -c:v libx264 -preset slow -crf 25 -maxrate 2600k -bufsize 5200k \
  -pix_fmt yuv420p -movflags +faststart public/media/film/night-run-wide.mp4

# The same shots as generated upright, for phones. These are not cropped.
upright="scale=720:1280:flags=lanczos,fps=24,format=yuv420p"

# shellcheck disable=SC2046
ffmpeg -v error -y $(inputs "v") \
  -filter_complex "$(shots "$upright"),noise=alls=4:allf=t,${fades}[film]" \
  -map "[film]" -an -c:v libx264 -preset slow -crf 26 -maxrate 2000k -bufsize 4000k \
  -pix_fmt yuv420p -movflags +faststart public/media/film/night-run-tall.mp4

ls -la public/media/film/
