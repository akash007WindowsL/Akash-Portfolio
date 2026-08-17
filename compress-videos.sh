#!/usr/bin/env bash
#
# Compress portfolio video for the web and pull a poster frame for each clip.
#
#   1. put your original exports in  videos/src/
#   2. run:  bash compress-videos.sh
#
# Encoded files land in videos/ and posters in images/poster-<name>.jpg,
# which is exactly what the markup in index.html expects.
#
# Orientation is detected per file: portrait clips are capped at 1080 wide,
# landscape at 1080 tall. Nothing is upscaled.
#
set -euo pipefail

SRC="videos/src"
OUT="videos"
POSTERS="images"
CRF=26            # 23 = higher quality/bigger, 28 = smaller/softer
POSTER_AT=1       # seconds into the clip to grab the still from

command -v ffmpeg  >/dev/null || { echo "ffmpeg not found — see the README note below."; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found — it ships with ffmpeg."; exit 1; }
[ -d "$SRC" ] || { echo "No $SRC directory. Create it and put your originals there."; exit 1; }

mkdir -p "$OUT" "$POSTERS"

shopt -s nullglob nocaseglob
files=("$SRC"/*.mp4 "$SRC"/*.mov "$SRC"/*.m4v)
[ ${#files[@]} -gt 0 ] || { echo "No video files found in $SRC"; exit 1; }

total_before=0
total_after=0

for f in "${files[@]}"; do
  name="$(basename "${f%.*}")"
  dest="$OUT/$name.mp4"
  poster="$POSTERS/poster-$name.jpg"

  read -r w h < <(ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height -of csv=p=0:s=' ' "$f")

  # cap the long edge at 1080; -2 keeps the other edge even, which H.264 requires
  if [ "$h" -gt "$w" ]; then
    scale="scale='min(1080,iw)':-2"
  else
    scale="scale=-2:'min(1080,ih)'"
  fi

  echo "→ $name  (${w}x${h})"

  # +faststart moves the index to the head of the file so playback can begin
  # before the download finishes — without it the browser waits for the lot
  ffmpeg -loglevel error -y -i "$f" \
    -vf "$scale" \
    -c:v libx264 -crf "$CRF" -preset slow -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 96k -movflags +faststart \
    "$dest"

  ffmpeg -loglevel error -y -ss "$POSTER_AT" -i "$dest" -vframes 1 -q:v 3 "$poster"

  before=$(stat -c%s "$f")
  after=$(stat -c%s "$dest")
  total_before=$((total_before + before))
  total_after=$((total_after + after))
  printf "   %'.0f KB  →  %'.0f KB   (poster: %s)\n" \
    "$((before / 1024))" "$((after / 1024))" "$(basename "$poster")"
done

echo
printf "Total  %s MB  →  %s MB\n" \
  "$((total_before / 1048576))" "$((total_after / 1048576))"
echo "Originals in $SRC are untouched — keep them out of git."
