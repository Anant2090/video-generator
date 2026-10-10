# Video motion graphics (Remotion)

This project adds motion graphics on top of a screen-recording or product-demo video. It never cuts source frames, and the original audio is kept untouched.

## What it adds

- a floating-window frame for the screen recording
- zooms and callouts
- chapter titles and a progress bar
- kinetic text
- word-by-word captions
- smooth scrolling
- an optional "Get started" end card

## Pipeline

```
npm ci                                   # once
npm run setup -- path/to/video.mp4       # ~1 min: source + src/video.json + analysis/
npm run transcribe                       # ~25 min on CPU: captions (public/words.json)
#   author src/timeline.ts (see below), preview with:
npm run dev                              # Remotion Studio
npm run scrolls                          # ~2 min: smooth-scroll data; review analysis/scrolls/check_*.png
npm run render                           # ~7 fps on 8 cores + GPU  -> out/render.mp4
npm run finalize                         # original audio + checks   -> out/final.mp4
```

The render's own audio is re-encoded and runs about 42 ms late. **Always run `finalize`**: it swaps in the source's audio track, then checks the frame count and alignment. It also writes `analysis/final_captions.png`, which you should look through.

Play results in Explorer, VLC or a browser. VS Code's preview can't decode AAC audio, so videos play silently there.

## Per-video files

| File | What | Written by |
|---|---|---|
| `src/video.json` | fps, frames, size, `crop` (where the recording sits inside any letterbox), `scrollDeny`, `whisperPrompt` | `setup.py` (hand-edited keys are kept) |
| `src/timeline.ts` | `ranges` (full / framed / blend), `zooms`, `callouts`, `chapters`, `kinetic`, `endCard` | you |
| `src/brand.ts`, `FIXES` in `scripts/words.mjs` | brand colours and brand-name spellings | you, per brand |

Every time in `timeline.ts` is in **source seconds**. Rects are `[x, y, w, h]` in **source pixels**. The asserts at the bottom of the file throw on overlaps or on cues outside framed ranges.

## Helpers

| Script | What it does |
|---|---|
| `scripts/grid.py 12.5 30` | writes source frames with a 100 px grid, for reading rects |
| `scripts/check_cues.py` | draws every zoom and callout rect at its cue's start and end (`analysis/cues/`) |
| `analysis/still.txt` | lists the stretches where the picture is still, which is where callouts belong |
| `analysis/scenes.txt` | lists the scene cuts, which is where `ranges` should split |
