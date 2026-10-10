# Production prompt: VEE Concierge booth film (from `Video Project 11999.mp4`)

## 1. Role and goal

You are a senior motion designer and Remotion engineer. Remake `Video Project 11999.mp4` (3:19, 1920×1080, 30 fps, AAC stereo 48 kHz) into a **premium, calm, Apple-grade 16:9 film that loops on a trade-show booth screen**. Most people will watch it **without sound**, from 2–4 m away, for 5–30 seconds at a time. Every section must make sense muted, and the loop seam must be invisible.

The product is **VEE Concierge** by **Voicera**: an AI voice agent that answers hotel guest calls, books rooms and arranges services, then hands the reservation to **Mews** (hotel PMS). The film must make one idea land: *a guest calls, VEE handles the whole request, and the booking appears in Mews.*

## 2. Locked decisions (from the client)

| Topic | Decision |
|---|---|
| Use | Trade-show booth loop, often muted |
| Length | **Light tighten only**: remove dead air (frozen logo, long pauses). Keep every spoken sentence. Target ≈ 3:11 |
| Output | One 16:9 1920×1080 30 fps master |
| Style | Clean premium hospitality: Apple-like, soft glass, calm easing, warm neutrals |
| Phone-call section | Replace the gradient visual with a designed scene: live chat bubbles (VEE vs Guest) and a booking card that fills in as details are agreed |
| "En" / "Hello!" labels | Turn into a multilingual greeting moment |
| Mews screens | Camera zooms/pans plus callouts timed to the narration |
| Captions | Clean sentence subtitles (not word-by-word) |
| Intro | New 3-second hook before the lobby shot |
| Audio | Original audio, loudness-normalised to −14 LUFS. No added music or SFX |
| Ending | Evergreen animated "Book a demo" card: VEE Concierge, `voiceracx.ai` (no event details) |
| Languages | VEE is multilingual, so the "Speaks your guest's language" claim is approved |
| Brand | Taken from the video and the existing `voicera-motion/src/brand.ts` |

## 3. Source facts (measured)

- Scene cuts (s): 2.53, 9.67, 20.20, 179.90. Other transitions are dissolves.
- The Mews screens are **fully static** (freeze-detected): 142.5–154.7, 155.1–167.2, 167.7–179.9. That makes them ideal for camera moves and callouts.
- Letterboxes (`cropdetect`):
  - Call section: `1920:974:0:106` (black bars top and bottom)
  - Mews dashboard (≈142–155): `1908:1080:6:0`
  - Mews timeline (≈155–167): `1920:984:0:48`
  - Mews sales screen (≈167–180): `1920:1016:0:32`
- Loudness: −18.3 LUFS integrated, LRA 6.8 LU.
- Transcript: `video11999-analysis/cartesia_stt.json` (Cartesia `ink-whisper`, 542 words with word timings). **Use it for all timing.**
- Brand-name fixes for any on-screen text: "Muse" → **Mews**, "V" / "Vee" / "vConcierge" → **VEE** / **VEE Concierge**, "IHS" → **IH Miami**, "2 p .m." → **2 PM**, "12 .45pm" → **12:45 PM**, "check -in" → **check-in**, "multi -step" → **multi-step**.

### Source scene map

| Source s | Content | Treatment |
|---|---|---|
| 0.00–2.53 | Voicera logo on white, frozen, silent | **Cut**, replaced by the hook |
| 2.53–10.0 | Hotel lobby with serif intro text (music only) | Keep as is (`full`) |
| 10.0–20.2 | "Meet VEE Concierge", app and feature cards | Keep (`full`) + subtitles |
| 20.2–26.6 | Robot at the front desk, phone-ring icons | Keep (`full`) + subtitles |
| 26.6–133.7 | Static phone graphic, booking call | **Replace visual** with the Live Call scene (§6.3) |
| 133.7–142.3 | Robot with holographic panels, "connects with Mews" | Keep (`full`) + subtitles + one kinetic line |
| 142.3–180.0 | Mews dashboard, timeline + guest panel, sales screen | Floating window + zooms + callouts (§6.4) |
| 180.0–189.7 | Robot recap with orbit effect | Keep (`full`) + subtitles |
| 189.7–≈193.5 | Robot in lobby | Keep (`full`) + subtitles |
| ≈193.5–199.3 | Wipe to the flat IH Miami end card | **Replace** with the animated "Book a demo" card (§6.6) |

## 4. Edit decision list (light tighten)

Author every cue in **source seconds**. One helper maps source time to output time through the edit list, so cues never need recomputing by hand.

1. Drop 0.00–2.53 (frozen logo). Prepend a **3.0 s hook**.
2. Shorten each pause to **0.40 s**, removing the middle of the silence. Only cut where the picture is static or fully covered by the redesigned call scene:

| Silence (source s) | Length | Remove |
|---|---|---|
| 65.60–66.62 | 1.03 | 0.63 |
| 77.06–79.86 | 2.80 | 2.40 |
| 82.88–83.80 | 0.92 | 0.52 |
| 104.70–105.50 | 0.81 | 0.41 |
| 109.13–110.03 | 0.90 | 0.50 |
| 112.42–113.91 | 1.49 | 1.09 |
| 115.97–117.03 | 1.05 | 0.65 |
| 121.91–122.83 | 0.93 | 0.53 |
| 124.29–125.56 | 1.26 | 0.86 |
| 127.46–128.74 | 1.28 | 0.88 |
| 132.81–133.72 | 0.92 | 0.52 (keep clear of the 133.73 visual change) |

   Do **not** cut 154.42–155.25: it overlaps the dashboard-to-timeline transition.
3. Hold the end card **+1.5 s** past the source end so the loop breathes.
4. The closing line "Visit us at booth 512 at IH Miami. We'd love to meet you." (≈191.5–196.5) is now out of date. Recommended: **duck it to silence** (fade 191.3→191.5) and let the end card play over silence, so the event is never mentioned. Alternative: keep it audible but unsubtitled. Use the recommended option unless told otherwise.
5. Expected output ≈ 199.30 − 2.53 + 3.0 − 8.99 + 1.5 ≈ **191.3 s (3:11)**.
6. Every audio cut gets a 15 ms equal-power crossfade. Verify that no word is clipped by checking each cut against word boundaries in `cartesia_stt.json`.

## 5. Design system

**Palette**: warm-neutral base with the Voicera orbit hues as accents, plus VEE's cyan glow.

| Token | Value | Use |
|---|---|---|
| `bg` | `#F7F5F2` | Warm canvas |
| `ink` | `#1D1D1F` | Primary text |
| `sub` | `#6E6E73` | Secondary text, labels |
| `cyan` | `#3ECDF0` | VEE accents, live indicators |
| `teal` | `#64D4C1` | Confirmed states |
| `green` | `#A4E06F` | Success ticks |
| `yellow` | `#DAE72D` | Gradient end only |
| `veeBlue` | `#5B7FA8` (sample from the robot at 12 s) | VEE avatar ring, bubble tint |
| Ink gradient | `linear-gradient(90deg,#139FC6,#23AE93 50%,#5FAF2E)` | Emphasis words |

- **Type**: Inter 400/500/600/700, already loaded in `brand.ts`. Headlines 72–96 px weight 700 with −1.5% tracking. Booth-readable minimums: body ≥ 30 px, subtitles 44 px, card values ≥ 34 px.
- **Surfaces**: glass (`rgba(255,255,255,0.72)`, 20 px blur, 1 px hairline `rgba(29,29,31,0.08)`, radius 24, soft long shadow).
- **Backdrop**: slow-drifting radial blooms of cyan and teal over `bg`, as in `Stage.tsx` `Backdrop`. Never fully static.
- **Motion**: entrances use `easeOut` `bezier(0.22,1,0.36,1)` over 18–24 frames, with a 12–24 px rise and opacity. Camera moves use `easeInOut` `bezier(0.65,0,0.35,1)` over 0.8 s. Springs use `damping 200`, so nothing bounces. Only one primary effect at a time, and something changes every 5–8 s.
- **Do not**: neon glows, glitch effects, more than two type weights in one element, or motion faster than 12 frames.

## 6. Section by section

### 6.1 Hook (new, output 0.0–3.0 s, silent)

- Warm backdrop with blooms. The Voicera orbit mark (cropped from the source at 15 s, bottom-right badge) fades in small at the top centre.
- Two-line kinetic headline, word by word, 4-frame stagger:
  - "Every guest call."
  - "*Answered instantly.*" (gradient on the second line)
- At 2.4 s the headline scales to 0.96 and blurs out while the lobby shot (source 2.53) dissolves in over 12 frames.
- The hook's first frame matches the booth card's last frame (same backdrop, same orbit mark position), so the loop is seamless.

### 6.2 Original intro and VEE introduction (source 2.53–26.6)

- Play full-frame and untouched, apart from subtitles from 10.6 s onward.
- No chapter titles here; the intro text already does that job.

### 6.3 Live Call scene (source 26.6–133.7): the centrepiece

Replace the source picture completely; the source audio continues. Use a three-column layout on the warm backdrop with a top band at y 40–90 and the main area from y 120 to 1000.

**Top band**: a live pill on the left (pulsing cyan dot, "LIVE CALL", call timer counting up from 00:00 at 26.6 s, in source-time-derived seconds). On the right: "VEE Concierge · Demo Heritage Hotel".

**Left column (x 90–620): phone**
- Rebuild the phone in React as a clean modern device frame in white glass. Do not reuse the source footage.
- Caller avatar (neutral illustrated guest), number "+1 314 159 2653", and a status line that reads "VEE is speaking" or "Guest is speaking", switching per speaker turn.
- A live waveform driven by the **real audio amplitude** of the cut audio (`@remotion/media-utils` `visualizeAudio`), tinted cyan for VEE and `sub` grey for the guest.
- **Multilingual greeting (26.6–31.0)**: above the phone, a large greeting cycles every 10 frames: Hello → Hola → Bonjour → Ciao → Olá → Hallo → こんにちは → مرحبا → Hello. It settles on "Hello!" at 28.5 s with a small chip: "Speaks your guest's language". (**Confirm with the client that VEE is multilingual before final render.**) The chip fades out by 33 s.

**Centre column (x 660–1240): conversation**
- Chat bubbles, with VEE on the left (VEE head avatar cropped from the source at 12 s, faint cyan tint) and the guest on the right (white glass).
- Each bubble appears at its turn's first word. Text reveals word by word from the word timings, as a typed reveal of the real speech, using corrected spellings.
- At most 4 bubbles are visible. Older ones slide up and fade to 0 at the top edge. Use 30 px Inter 500 text with 28 px bubble padding.
- During this scene **the bubbles are the captions**: hide bottom subtitles from 26.6 to 133.7.

Speaker turns (source s; derived from content, so **verify by ear** and refine from word timings):

| Speaker | Start | First words |
|---|---|---|
| VEE | 26.62 | Welcome to the Demo Heritage Hotel… |
| Guest | 32.3 | Hi, I wanted to book a hotel room. |
| VEE | 34.6 | Awesome, I can help you with that… |
| Guest | 41.8 | I will be checking in on the 1st October… |
| VEE | 47.4 | Got it. Check in on the 1st of October… (through "…staying with you?") |
| Guest | 64.1 | Three guests will be in total. |
| VEE | 66.5 | Three guests. Got it… (through "…adjoining rooms.") |
| Guest | 77.3 | I'd prefer having a room with double bed and another with single bed. |
| VEE | 83.2 | I think I may have misheard you there… (through "…two rooms total.") |
| Guest | 92.4 | Yeah, that's correct. |
| VEE | 93.8 | So to recap… (through "…any other questions?") |
| Guest | 109.5 | I'd like to arrange an airport pickup for 1 PM. |
| VEE | 113.9 | Please share your flight details and passenger count. |
| Guest | 116.5 | Skyline Airways SX234 arriving at 12:45 PM, 3 passengers. |
| VEE | 122.1 | Got it. How much luggage will you have? |
| Guest | 125.0 | 2 cabin bags and 2 suitcases. |
| VEE | 128.4 | Perfect. Your 1 PM airport pickup is arranged. |
| Guest | 132.1 | Thank you. |

**Right column (x 1280–1830): booking cards**
- **Card 1, "Room reservation · Demo Heritage Hotel"**. Status pill: "Collecting details" (cyan outline) at 26.6, "Confirming" at 94.43, "Confirmed ✓" (teal fill, green tick draw-on) at 107.31.
- Field rows: an icon, a label in `sub` at 24 px, and a value in `ink` at 34 px weight 600. Each value types in at its spoken moment, with a 0.6 s soft cyan highlight on the row.

| Field | Value | Appears (source s) |
|---|---|---|
| Check-in | Oct 1 · around 2 PM | 42.91 (date), 46.55 (time) |
| Check-out | Oct 5 · around 2 PM | 44.66 |
| Stay | 4 nights | 50.41 (after VEE confirms) |
| Note | "2 PM arrival & departure arranged" (small chip) | 60.6 ("I'll make a note of that") |
| Guests | 3 | 64.14 |
| Rooms | 1 Double + 1 Single | 80.66 |
| Rooms state | amber "Clarifying…" chip on the Rooms row | 84.77 → resolves to "2 rooms ✓" at 92.99 |

- **Recap (93.8–104.1)**: a soft light sweep travels down card 1, row by row, in step with the recap sentence (rooms 95.49, guests 95.99, check-in 98.49, check-out 100.29, time 101.53, beds 102.43–104.11).
- **Card 2, "Airport pickup"**: slides in under card 1 at 111.27, and card 1 compacts to a one-line summary. Status goes from "Collecting details" to "Arranged ✓" at 131.13.

| Field | Value | Appears (source s) |
|---|---|---|
| Pickup time | 1:00 PM | 111.27 |
| Flight | Skyline Airways · SX234 | 116.47 |
| Arrival | 12:45 PM | ≈119.5 |
| Passengers | 3 | ≈120.8 |
| Luggage | 2 cabin bags · 2 suitcases | 125.66 |

- **Exit (132.1–133.7)**: both cards merge into one compact "Booking complete" token that flies toward the top right and dissolves just as the robot shot (133.73) dissolves in. This visually hands the booking to the next section.

### 6.4 Bridge to Mews (source 133.7–142.3)

- Full-frame robot with subtitles.
- One kinetic line over the static hologram stretch, timed to "connects with Mews" (≈137.2): "From the call → *straight into Mews*." Fade it out by 141.3.
- Chapter label "Inside Mews" at 142.3.

### 6.5 Mews screens (source 142.3–180.0)

- Present them as a **floating window** (radius 18, long soft shadow) on the warm backdrop.
- Use the **per-range crop** from §3 so no black bars ever show. The window keeps one fixed size and position across all three screens.
- Use a dissolve between screens, not a hard cut.
- Callouts: a spotlight dims everything outside the rect to 35%, plus a 2 px cyan ring (radius 12), plus a glass label (≤ 5 words, 30 px, 600) attached to the ring's nearest free side. Maximum zoom is **1.8×**; the screens are static, so this is safe.
- Rects below are approximate source px `[x, y, w, h]`, read from 1024-px previews. **Re-measure each on a 100 px grid of the source frame before rendering.**

| Source s | Camera | Callout label | Rect |
|---|---|---|---|
| 142.3–148.5 | Whole dashboard, slow 1.00→1.04 push | none | — |
| 148.61 | Zoom to stat row | "Total reservations" | `[262,347,534,262]` |
| 149.95 | hold | "Room nights" | `[810,347,531,262]` |
| 150.83 | hold | "Guest volume" | `[1354,347,536,262]` |
| 151.97 | Pan to charts row | "Reservation status" | `[262,634,759,420]` |
| 153.73 | hold | "Booking segments" | `[1037,634,853,420]` |
| 155.49 | Timeline, zoom to grid | "Availability at a glance" | `[0,178,1354,853]` |
| 159.57 | Pan to guest panel | "John Doe · reservation" | `[1359,131,560,900]` |
| 161.97 | hold | "Stay dates" | `[1378,272,525,103]` |
| 162.71 | hold | "Room details" | `[1378,422,525,47]` |
| 163.77 | hold | "Guest information" | `[1378,563,525,150]` |
| 164.95 | hold | "Flight & travel details" | `[1378,731,525,206]` |
| 166.13 | hold | "One-click check-in" | `[1766,962,133,45]` |
| 167.35 | Sales screen, whole | "New reservation" | `[34,173,459,43]` |
| 171.31 | Zoom to search row | "Dates" | `[709,409,248,51]` |
| 171.93 | hold | "Rooms" | `[1012,409,221,51]` |
| 172.53 | hold | "Guests" | `[1299,409,223,51]` |
| 173.79 | Pan to rate options | "Room types & rates" | `[975,572,900,469]` |
| 177.0–180.0 | Ease back to whole window | kinetic: "All from *one streamlined workflow.*" | — |

- **Linking beat (subtle)**: at 159.57, the guest panel's "3 (2 Adults…)" and "Skyline Airways · SX234" rows get a brief cyan shimmer that echoes the call cards. This shows the same data now lives in Mews.

### 6.6 Recap and "Book a demo" card (source 180.0–199.3, +1.5 s)

- 180.0–≈191.3: robot footage, full-frame, with subtitles. The last subtitle is "Want to see VEE Concierge in action?" (189.96).
- From ≈191.3, cross-dissolve over 18 frames from the robot to the **end card** on the warm backdrop. The source's IH Miami wipe and card are never shown.
  1. The Voicera orbit mark fades and rises in at the top centre.
  2. **"VEE Concierge"** at 120 px weight 700 with the ink gradient, revealed with a left-to-right mask wipe.
  3. The line "Every guest call. Answered instantly." at 40 px in `sub`, echoing the hook.
  4. A glass button, **"Book a demo →"** at 44 px weight 600, which springs in, followed by **`voiceracx.ai`** below it at 36 px in `ink`.
  5. A gentle 1.00→1.03 push over the whole hold.
- Its final 12 frames converge on the hook's first frame (§6.1) for a seamless loop.

## 7. Subtitles (outside the call scene)

- Sentence-level, built from `cartesia_stt.json` with brand fixes applied. Each subtitle is at most 2 lines and 42 characters per line, and splits on punctuation.
- Display window: the first word's start − 0.1 s through the last word's end + 0.4 s. Never shorter than 1.0 s.
- Style: bottom-centre glass pill, 44 px Inter 600 `ink`, 24 px from the bottom safe area, fading in and out over 6 frames.
- Active from 10.6 to 26.5 and from 133.8 to 191.3. Hidden during the hook, the call scene and the end card. The IH Miami / booth 512 line is never subtitled.
- Key subtitles by index (React keys by index, never by timestamp), as in the existing `Captions.tsx`.

## 8. Audio

1. Build the cut audio with ffmpeg directly from the source, following the edit list (15 ms crossfades at each cut). The hook is 3.0 s of silence. Fade the source to silence over 191.3→191.5 to drop the IH Miami line, and keep it silent through the end card and the +1.5 s hold.
2. Two-pass `loudnorm` to **I = −14 LUFS, TP = −1.0 dBTP, LRA = 11**, then encode AAC 256 kbps at 48 kHz.
3. Mux it onto the silent Remotion render. **Never use Remotion's own rendered audio**, which runs about 42 ms late.
4. Verify by cross-correlating the final audio against the source over three windows (call, Mews, end). Offset must be within ±1 frame. Measure the final integrated loudness and report it.

## 9. Build plan (Remotion)

- Create a new project `vee-concierge-motion/` next to the source, based on the generic parts of `voicera-motion/` (brand, `Callout`, `Captions`, the camera logic in `Stage`). **Do not modify `voicera-motion/`.**
- Files:
  - `src/edit.ts`: keep-segments, `srcToOut()`, and the total frame count.
  - `src/cues.ts`: all cues in source seconds (zooms, callouts, card fields, speaker turns, kinetic lines, chapters).
  - `src/scenes/Hook.tsx`, `LiveCall.tsx` (`Phone`, `ChatStream`, `BookingCards`, `GreetingCycle`), `MewsWindow.tsx`, `DemoCard.tsx`.
  - `src/components/Subtitles.tsx`.
  - `scripts/audio.py` (edit list, loudnorm, mux, sync check).
- Body footage is rendered with `OffthreadVideo` per keep-segment (muted). Full-frame sections use `full` presentation. Mews uses `framed` with a per-range crop.
- Asserts fail the build on overlapping cues, cues inside removed segments, or callout rects outside the frame.

## 10. Quality bar and review checkpoints

1. **Checkpoint A, stills**: one still per section (hook, intro, call at 45 s, 85 s, 100 s and 125 s, Mews at three zoom states, demo card). Get client sign-off on the look.
2. **Checkpoint B, 40 s test render**: source 26–66 s (the multilingual greeting, first bubbles and first card fields). Check bubble and field sync against the audio.
3. **Full render**: CRF 16, `yuv420p`, `+faststart`, `--gl=angle`.
4. **Final QA**:
   - A contact sheet of the whole film (one frame every 2 s).
   - A subtitle sheet comparing each rendered subtitle with the expected text.
   - Every callout ring sits on its target at the start and end of its cue.
   - Audio loudness and sync measured.
   - The loop seam is checked by playing the last 2 s into the first 2 s.
   - No black bars anywhere, no text under 30 px, and no brand misspellings.
5. Deliver `vee-concierge-motion/out/vee-concierge-booth.mp4`, to be played outside VS Code (its preview can't decode AAC).

## 11. Remaining assumptions (change if wrong)

- Demo URL is `voiceracx.ai`, taken from the earlier Voicera project.
- The spoken IH Miami / booth 512 line is silenced rather than kept.
- Only the orbit mark is used, not a full Voicera wordmark (no wordmark asset in the repo).
