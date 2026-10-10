# Voicera video toolkit

Monorepo of Remotion / motion-graphics pipelines used to produce Voicera demo videos. **No finished `.mp4` renders or source screen-recordings are committed** — drop those in locally when you need to render.

## Projects

| Folder | What it is |
|---|---|
| `voicera-motion/` | Overlay motion graphics on a screen-recording (zooms, callouts, captions, scroll). Put your recording at `public/source.mp4`. |
| `vee-concierge-motion/` | VEE Concierge booth cut (edit list + Remotion scenes). Needs `public/source.mp4`. |
| `SATS/sats-motion/` | Fully generated demo (screenshots + Cartesia VO + synth music). No source video required. |
| `legion-capture/` | Browser capture helpers for Legion UI. |
| `mascot-test/`, `vee3d/` | VEE mascot / 3D asset experiments. |
| `video11999-analysis/` | Scene / still / silence notes from an earlier cut. |

## Quick start (any Remotion project)

```bash
cd voicera-motion   # or vee-concierge-motion / SATS/sats-motion
cp ../.env.example .env   # SATS only: set CARTESIA_API_KEY
npm ci
# place public/source.mp4 if this project needs a recording
npm run dev
```

### SATS (from-scratch) pipeline

```bash
cd SATS/sats-motion
npm ci
pip install pillow numpy scipy
npm run screens    # optional: rebuild patched screenshots
npm run audio      # Cartesia VO + timeline + mix.wav
npm run render     # muted video -> out/render.mp4
npm run finalize   # mux + loudnorm -> out/final.mp4
```

### Screen-recording overlay pipeline (`voicera-motion`)

See `voicera-motion/README.md`. Typical flow: `setup` → `transcribe` → author `src/timeline.ts` → `scrolls` → `render` → `finalize`.

## What is (and is not) in git

**Included:** source (`src/`), scripts, configs, logos, UI screenshots, short TTS clips / analysis helpers, plans.

**Excluded:** `node_modules/`, `out/`, `whisper.cpp/`, `.env`, and **all `.mp4` / `.mov` files** (finished cuts and source recordings).

Place source recordings yourself:

- `voicera-motion/public/source.mp4`
- `vee-concierge-motion/public/source.mp4`
