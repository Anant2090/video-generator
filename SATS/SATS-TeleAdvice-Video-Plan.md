# SATS Import TeleAdvice: Video Production Plan (v2, fully generated)

**Deliverable:** one 4:00 master, 16:9, 1920×1080, 30 fps, H.264 + AAC.
**Audience:** SATS stakeholders and internal leadership.
**Goal:** win approval for a pilot, show the solution end to end, and explain the agentic architecture.
**Style:** clean, premium and light, matching the VOICERAcx.ai UI.
**Production mode:** **everything is generated.** No screen recordings or real calls exist. The video is built in Remotion from the provided screenshots, motion graphics, and AI voices (Cartesia).

### What changed from v1

| Topic | Decision |
|---|---|
| Footage | No recordings. Screens come from the provided screenshots, with redactions and text patches applied in code |
| Demo call | Fully scripted, voiced by Cartesia, with no "simulated" label |
| Data claim | Described as "COSYS-ready integrations", meaning built for COSYS but not claimed to be live |
| Node text | "from COSYS" is patched to "from the shipment system" on every node |
| Second Get Flight Details node | Kept, and explained as "flight re-checked before retry" |
| Call Intelligence | Motion-graphic summary card, not a fake product screen |
| ATA trigger | Animated event card whose payload flows into the ATA Event node |
| Voices | Narrator: female, calm, international. Agent: male, friendly, professional. Consignee: male, Singaporean / Southeast Asian English. Counter staff: female (one line). |
| Phone sound | A light phone-line filter on the consignee only. The agent stays clear. |
| Music | Original ambient bed generated in code, so there is no licensing |
| End card | Logo, tagline and **voiceracx.ai** (confirm the domain) |

**Wording rule:** the demo call is not labelled, so the voice-over never calls it a "real" or "live" call. It is framed as *"Here's how a call unfolds."* Every statement must match how the workflow is **configured**, as shown on the canvas.

---

## 1. Story in one line

> A flight lands. Within minutes, an AI agent calls the consignee, answers their questions from the right sources, hands off to a person when asked, and leaves a complete record.

The arc: **the problem → the architecture → a call, end to end → the edge cases → the audit trail → the next step.**

---

## 2. Accuracy ledger

Each claim in the video and what it is based on:

| Claim | Basis | Wording in the video |
|---|---|---|
| The ATA event starts an outbound call | ATA Event node: "Accepts awb, consignee, flight, arrival_time and phone, then starts the outbound call" | Stated directly |
| The NOA Agent speaks a personalised notice | NOA Agent node description | Stated directly |
| The Supervisor routes to three paths | Workflow card: "routes to Shipment Agent, FAQ Agent, or Human Escalation" | Stated directly |
| Shipment answers come only from dedicated tools | Shipment Agent: "Answers only from the … tools below" | "COSYS-ready integrations" |
| FAQ answers come from approved knowledge | FAQ Agent: "Approved SATS knowledge base only" | Stated directly |
| Hand-off keeps context | Human Escalation and Human Transfer descriptions | "passes on your air waybill details" |
| Retry on no answer | Answered? → Record No Answer → Get Flight Details → Supervisor | **"is configured to"**, with a "Configured path" badge |
| Outcomes recorded | Record Acknowledgement: acknowledged, declined, callback_requested, no_answer | Stated directly |
| Call Intelligence fields | Call Intelligence: intent, outcome, acknowledgement, next action, agents used, summary | Shown on the summary card |

---

## 3. Minute-by-minute timeline (4:00)

| # | Time | Duration | Chapter chip | Visual | Audio |
|---|---|---|---|---|---|
| 1 | 0:00–0:14 | 14 s | (none) | **Hook:** an aircraft lands, an ATA event card appears, its payload flows into the ATA Event node, and a phone rings | VO 1, touchdown, data tick, ring |
| 2 | 0:14–0:30 | 16 s | The challenge | Kinetic text showing the manual process | VO 2, music bed starts |
| 3 | 0:30–0:42 | 12 s | (none) | Title card, then the home screen and workflow list in a floating window, with a simulated cursor | VO 3 |
| 4 | 0:42–1:35 | 53 s | The workflow | Canvas screenshot with spotlight, gentle zooms and crisp callouts | VO 4 |
| 5 | 1:35–2:45 | 70 s | The call | **Split screen:** phone mockup and transcript on the left, canvas with node highlights on the right | VO 5, then Call A |
| 6 | 2:45–3:10 | 25 s | Hand-offs | Call B (transfer) and Call C (callback) in the same split layout | VO 6a / 6b and the calls |
| 7 | 3:10–3:25 | 15 s | Exceptions | No-answer path with the "Configured path" badge | VO 7 |
| 8 | 3:25–3:45 | 20 s | On record | Outcome pills, then the Call Intelligence summary card | VO 8 |
| 9 | 3:45–3:53 | 8 s | (none) | Four benefit chips | VO 9 |
| 10 | 3:53–4:00 | 7 s | (none) | End card: logo, tagline, voiceracx.ai | VO 10, music resolves |

---

## 4. Scene-by-scene direction

### Scene 1: Hook "The arrival moment" (0:00–0:14)

- **0:00–0:04:** A soft `#F5F5F7` stage with a thin horizon runway line. A clean line-art aircraft (SVG, ink stroke, brand-gradient contrail) glides in from the left and touches down. A subtle dust puff and a low "whoomp".
- **0:04–0:09: ATA event card.** A glass card slides up from the runway. Its title is **ATA EVENT** with a green "Landed" dot, and its fields type in one by one with soft ticks:
  - `AWB  ••• 4518`
  - `Consignee  Tan Freight Logistics`
  - `Flight  from Frankfurt`
  - `Arrival  14:32`
  - `Phone  +65 •••• ••12`
- **0:09–0:11:** The fields compress into a light particle stream that flows into an **exact replica of the canvas "ATA Event" node**. That node reappears on the real canvas at 0:50.
- **0:11–0:14:** A wire draws from the node's OUT port to a minimal phone, which rings (ripple rings and a ring sound). The caller ID reads **"SATS Import TeleAdvice"**. A whoosh leads into the next scene.

### Scene 2: The challenge (0:14–0:30)

Kinetic text, one line at a time, each with a small line icon. The gradient emphasis falls on the starred words.

1. "Every arrival → a *phone call*" (stacked phones)
2. "Made *one at a time*"
3. "Often *unanswered*" (missed-call icon)
4. "The *same questions*, again and again" (repeating speech bubbles)
5. "And *little on record* afterwards" (empty log)

The lines collapse into a dot, which expands into the title.

### Scene 3: Title and platform (0:30–0:42)

- **0:30–0:36:** Title card. **"SATS Import TeleAdvice"** (Inter 800). Subtitle: *"Agentic AI voice notifications for import cargo"*. **"Built on VOICERAcx.ai"** with the logo. SATS appears in text only.
- **0:36–0:39:** The **home screenshot** (`image.png`) rises inside a floating rounded window. Its patches:
  - "Welcome, Anant 👋" becomes "Welcome 👋"
  - the sidebar name becomes "SATS Demo", with the avatar letter "S"
  - The simulated cursor glides to **Workflow Canvas** and clicks, with a ripple and a soft click sound.
- **0:39–0:42:** A cross-dissolve to the **workflow list screenshot** (`image (2).png`). The three other workflow cards are covered by frosted glass. A spotlight falls on the **SATS Import TeleAdvice** card and its **PUBLISHED** badge, and the cursor clicks it.

### Scene 4: The workflow (0:42–1:35)

The source is `Generated image 1.png`, upscaled 2× with Lanczos plus a light sharpen, and shown inside a floating window about 1700 px wide.

**Low-resolution strategy:** the camera never zooms past **1.35×**. Focus comes from a **spotlight** (everything except the target dims to 30% with a soft blur) plus **vector highlight rings** and **crisp callouts**. The overlays are drawn in code and stay sharp, so they carry the eye.

**Text patches applied to the canvas** (re-typeset in Inter on the node's background colour):

| Node | Original | Patched |
|---|---|---|
| Shipment Agent | "Answers only from the COSYS tools below." | "Answers only from the shipment tools below." |
| Get Shipment | "Shipment status from COSYS." | "Shipment status from the shipment system." |
| Get AWB Details | "Consignee and pieces from COSYS." | "Consignee and pieces from the shipment system." |
| Get Flight Details (both) | "Flight from COSYS." | "Flight from the shipment system." |
| Get Arrival Details | "Arrival time and warehouse from COSYS." | "Arrival time and warehouse from the shipment system." |
| Supervisor | `http://127.0.0.1:8011` | (removed) |
| Record No Answer | "Demo retry. Stores retry count…" | "Retry handling. Stores retry count, call status and the second attempt." |
| Human Escalation | "Existing transfer with AWB … handoff_trigger." | "Hands off with the AWB and what has already been done." |

**Camera and callout beats:**

| Time | Camera / spotlight | Callouts (5 words or fewer) | Glossary chip (lower left) |
|---|---|---|---|
| 0:42–0:50 | Full canvas, slow push from 0.96× to 1.0×. Six stage labels sweep across: *Trigger · Notify · Orchestrate · Specialists · Respond · Record* | (none) | (none) |
| 0:50–1:00 | Spotlight on ATA Event and NOA Agent, zoom 1.3× | "Starts the outbound call" · "Personalised Notice of Arrival" | **ATA** = Actual Time of Arrival · **NOA** = Notice of Arrival |
| 1:00–1:10 | Spotlight on the Supervisor; its three outgoing wires pulse in turn | "Routes to three paths" | (none) |
| 1:10–1:25 | Spotlight on the Shipment Agent cluster; the 4 tool nodes glow in turn as the VO names them | "COSYS-ready integrations" | **AWB** = Air Waybill |
| 1:25–1:35 | Spotlight on FAQ Agent and SATS FAQ, then sweep to the Response Node | "Approved knowledge only" · "One voice response" | (none) |

### Scene 5: The call, split screen (1:35–2:45)

**Layout:**

- **Left 40%:** a minimal white phone mockup showing "SATS Import TeleAdvice", a call timer, and a waveform driven by the audio. Below it is a **live transcript**: the agent in a teal-tint bubble with an "AI" mark, and the consignee in a grey bubble. Words highlight as they are spoken.
- **Right 60%:** the canvas, dimmed to 35%. The **active node lights up** with a gradient ring and a pulse along the wire. Tool results pop up as chips beside the node, for example `Get AWB Details → 12 pcs · 486 kg`.

The node mapping per line is in §6.

### Scene 6: Hand-offs (2:45–3:10)

- **2:45–2:48:** VO 6a.
- **2:48–2:59, Call B:** the transfer. Nodes light in order: Supervisor, Human Escalation, Human Transfer. Callout: **"Context handed over"**. A ring, then the counter staff answer.
- **2:59–3:01:** VO 6b.
- **3:01–3:10, Call C:** the callback. Chip: `Outcome: callback_requested`.

### Scene 7: Exceptions (3:10–3:25)

- Spotlight on the bottom-left cluster: Answered?, Record No Answer, Get Flight Details, Supervisor.
- A persistent amber-outline badge sits top right: **"Configured path"**.
- The wires pulse in order. Callout on Get Flight Details: **"Flight re-checked before retry"**.

### Scene 8: On record (3:25–3:45)

- **3:25–3:31:** Spotlight on Record Acknowledgement, Final Outcome and Call Intelligence. Four pills animate out of Record Acknowledgement: `acknowledged · declined · callback_requested · no_answer`. The `acknowledged` pill stays lit.
- **3:31–3:45: Call Intelligence summary card**, a large glass card with the six fields revealed in sequence:

| Field | Value (Call A) |
|---|---|
| Intent | Shipment status · piece count · collection documents |
| Outcome | Completed |
| Acknowledgement | acknowledged |
| Next action | Consignee to collect at the import terminal |
| Agents used | NOA Agent → Supervisor → Shipment Agent → FAQ Agent |
| Summary | "Consignee confirmed arrival of AWB ••• 4518 (12 pcs, 486 kg) and was advised of the collection documents." |

### Scene 9: Benefits (3:45–3:53)

Four glass chips stagger in on a 2×2 grid:

- **Every arrival, notified consistently**
- **Answers from approved sources**
- **Seamless hand-off to your team**
- **A full record of every call**

### Scene 10: End card (3:53–4:00)

The VOICERAcx.ai logo settles in. Below it: **"SATS Import TeleAdvice, powered by VOICERAcx.ai"** and **voiceracx.ai**.

---

## 5. Narrator voice-over (female, calm, neutral international English)

About 300 words at roughly 145 words per minute. Cartesia's word timestamps drive all kinetic text and callout timing.

**VO 1 (0:00–0:14)**
> A flight lands. Within minutes, every consignee waiting on that cargo needs to know: *it's here*, and what to do next.

**VO 2 (0:14–0:30)**
> Today, that means phone calls, made one at a time. Calls that go unanswered. The same questions about status, pieces and collection, asked again and again. And very little left on record once the call ends.

**VO 3 (0:30–0:42)**
> This is SATS Import TeleAdvice: an *agentic AI* voice workflow, built on VOICERAcx.ai, that makes those calls, answers those questions, and records every outcome.

**VO 4 (0:42–1:35)**
> Here is the complete workflow, on the VOICERAcx Workflow Canvas.
> It starts with an ATA event, the actual time of arrival. The trigger carries the air waybill, consignee, flight and arrival time, and starts the outbound call.
> The NOA Agent then speaks a personalised Notice of Arrival.
> From there, the Supervisor takes over. It listens to what the consignee needs, and routes the conversation down one of *three* paths.
> Shipment questions go to the Shipment Agent, which answers only from four COSYS-ready integrations: shipment status, AWB details, flight details and arrival details.
> Procedural questions go to the FAQ Agent, which draws only on approved SATS knowledge.
> And every answer is delivered through a single Response Node.

**VO 5 (1:35–1:38)**
> Here's how a call unfolds.

**VO 6a (2:45–2:48)**
> Not every call goes the same way.

**VO 6b (2:59–3:01)**
> And if now isn't a good time…

**VO 7 (3:10–3:25)**
> If a call isn't answered, a dedicated path is configured to record the attempt, re-check the flight details, and return to the Supervisor for a second attempt.

**VO 8 (3:25–3:45)**
> When the call ends, Record Acknowledgement stores the result: acknowledged, declined, callback requested, or no answer. Call Intelligence then captures the intent, the outcome, the next action, the agents used, and a summary, so *every* call can be reviewed.

**VO 9 (3:45–3:53)**
> Every arrival, notified consistently. Every outcome, on record.

**VO 10 (3:53–4:00)**
> SATS Import TeleAdvice. Powered by VOICERAcx.ai.

**Pronunciation:**
- "SATS" is said as one word: "sats".
- "VOICERAcx" is said as "voice-era-C-X".
- "COSYS" is said as "co-sis".
- ATA, NOA and AWB are spelled out as letters.

Each one is checked in a short sample first.

---

## 6. Call scripts (Cartesia, separate voices)

**Test data (all fictional):**
- Consignee: Daniel Tan, Tan Freight Logistics
- AWB: ending in 4518
- Origin: Frankfurt, arrived 14:32
- Cargo: 12 pieces, 486 kg

### Call A: the main call (target about 62 s)

| # | Speaker | Line | Nodes lit / chip |
|---|---|---|---|
| 1 | Agent | "Hello, this is the SATS Import TeleAdvice assistant, calling for Tan Freight Logistics. Am I speaking with Daniel?" | ATA Event → NOA Agent |
| 2 | Consignee | "Yes, speaking." | (none) |
| 3 | Agent | "Good afternoon, Daniel. This is a notice of arrival. Your shipment under air waybill ending four-five-one-eight arrived today from Frankfurt at two thirty-two p.m." | NOA Agent |
| 4 | Consignee | "Okay, great. What's the current status?" | Supervisor |
| 5 | Agent | "It's been received at the import terminal and is ready for collection." | Shipment Agent → Get Shipment → Response Node · chip `Status → Ready for collection` |
| 6 | Consignee | "How many pieces are under that AWB?" | Supervisor |
| 7 | Agent | "There are twelve pieces, with a total weight of four hundred and eighty-six kilograms." | Shipment Agent → Get AWB Details → Response Node · chip `12 pcs · 486 kg` |
| 8 | Consignee | "And what do I need to bring to collect it?" | Supervisor |
| 9 | Agent | "Please bring the delivery order, your company's authorisation letter, and a valid photo ID." | FAQ Agent → SATS FAQ → Response Node · chip `Source: SATS FAQ` |
| 10 | Consignee | "Alright, noted. Thanks." | (none) |
| 11 | Agent | "You're welcome, Daniel. I've recorded your acknowledgement. Have a good day." | Record Acknowledgement · chip `acknowledged` |

### Call B: transfer (about 11 s)

| # | Speaker | Line | Nodes lit |
|---|---|---|---|
| 1 | Consignee | "Actually, can I speak to someone at the counter?" | Supervisor |
| 2 | Agent | "Of course. I'll transfer you now and pass on your air waybill details, so you won't need to repeat them." | Human Escalation → Human Transfer |
| 3 | (sound) | Two rings | (none) |
| 4 | Counter staff | "Import counter, good afternoon." | (none) |

### Call C: callback (about 9 s)

| # | Speaker | Line | Nodes lit / chip |
|---|---|---|---|
| 1 | Consignee | "I'm driving right now. Can you call me back after five?" | Supervisor |
| 2 | Agent | "No problem. I've noted your request for a callback after five p.m. Drive safely." | Record Acknowledgement · chip `callback_requested` |

**Natural-sound direction:**
- Put 250–450 ms gaps between turns.
- Add one small human "Okay," from the consignee.
- Set the agent slightly slower than the narrator.
- Give the consignee a slightly faster, busier pace.

---

## 7. Voice cast (Cartesia auditions)

I'll generate a 10-second sample per candidate, about 3 options per role, for you to pick from.

| Role | Brief |
|---|---|
| Narrator | Female, neutral international English, calm, authoritative, warm |
| AI agent | Male, friendly, professional, clear, customer-service pace |
| Consignee | Male, Singaporean / Southeast Asian English, busy logistics manager. If Cartesia has no convincing SG accent, fall back to the closest Southeast Asian English voice. |
| Counter staff | Female, brief, friendly (one line) |

**Audio treatment:**
- **Consignee:** a light phone-line filter (band-pass 300–3400 Hz, gentle compression, a touch of line noise).
- **Agent:** stays clear, with only slight EQ to sit inside the phone UI.
- **Counter staff:** gets the same phone filter as the consignee.

---

## 8. Design system

| Element | Spec |
|---|---|
| Background | `#F5F5F7` with a soft radial light (top left) |
| Ink / sub-text | `#1D1D1F` / `#6E6E73` |
| Brand gradient | `#3ECDF0 → #64D4C1 → #A4E06F → #DAE72D`; on light backgrounds use the ink gradient `#139FC6 → #23AE93 → #5FAF2E` |
| Node colour cues | Logic = purple, Integration = slate, Orchestrator = blue, Terminal = blue, Data = green (matching the canvas) |
| Font | Inter: 800 for titles, 600 for callouts, 500 for captions |
| Glass card | `rgba(255,255,255,0.72)`, 20 px blur, 20 px radius, soft shadow |
| Floating window | Screenshots sit in a 24 px rounded window with a soft drop shadow and 4% margin |
| Screenshot treatment | 2× Lanczos upscale with a light sharpen. Zoom 1.35× at most. Spotlight with dimming instead of deep zoom. |
| Redaction | Frosted-glass rectangles, never a pixel mosaic |
| Simulated cursor | macOS-style pointer with eased glide, a click ripple and a soft click sound |
| Motion | Entrances use ease-out `(0.22, 1, 0.36, 1)`. The camera uses ease-in-out `(0.65, 0, 0.35, 1)`. Moves take 0.6–0.9 s. One primary effect at a time. A visual change every 5–8 s. |
| Chapter chip | Top left glass pill, plus a thin progress bar at the bottom |

---

## 9. Audio: music and sound effects, all generated in code

- **Music:** an original ambient bed, synthesised in Python. Soft pads on a slow I–V–vi–IV progression, a light pulse at about 90 BPM, and a gentle swell into the title and the end card. Mixed at about −24 LUFS under the VO and ducked a further 8 dB under the calls.
- **Sound effects** (also synthesised):
  - aircraft touchdown (filtered noise and a thump)
  - data ticks
  - phone ring
  - three whooshes, on chapter changes only
  - UI clicks
  - soft callout ticks
- **Master:** −16 LUFS integrated, true peak at or below −1 dBTP.

---

## 10. Assets I'll use

| Asset | Source | Use |
|---|---|---|
| Home screen | `SATS/image.png` (`image (1).png` is an identical duplicate) | Scene 3, with the name patched |
| Workflow list | `SATS/image (2).png` | Scene 3, with the other cards frosted |
| Workflow canvas | `SATS/Generated image 1.png` | Scenes 4–8, with text patches |
| VOICERAcx logo | `voicera-motion/public/logo-light.png`, `logo-dark.png` | Title and end card |
| Brand tokens | `voicera-motion/src/brand.ts` | Design system |
| Cartesia key | the existing `.env` (`CARTESIA_API_KEY`) | All voices |

The two "Create With AI" screenshots (`image (3).png`, `image (4).png`) are not used.

**Optional quality upgrade:** if you can retake the same three screenshots in Chrome at 200% display scaling (or on a 4K screen), they drop straight in and the screens will look much sharper. Everything else stays the same.

---

## 11. Small confirmations (defaults apply if you don't object)

1. **Domain:** is it **voiceracx.ai**? Otherwise tell me the correct one.
2. **FAQ answer:** "Please bring the delivery order, your company's authorisation letter, and a valid photo ID." Check that this matches your SATS FAQ content, or give me the correct wording.
3. **Test names:** Daniel Tan / Tan Freight Logistics / AWB ending 4518 / Frankfurt / 12 pcs, 486 kg.
4. **Second Get Flight Details node:** confirm it re-checks the flight before the retry.

---

## 12. Pipeline and review gates

1. **Voice auditions:** samples for the narrator, agent and consignee. **You pick.**
2. **Generate audio:** the full narrator voice-over with word timestamps, the call lines with timestamps, the phone filter, and the generated music and sound effects.
3. **Prepare the screenshots:** upscale, add text patches and redactions, and map node positions for the highlights.
4. **Build:** a Remotion project at `SATS/sats-motion` with these scenes:
   - `Hook`
   - `Challenge`
   - `Title`
   - `CanvasTour`
   - `CallSplit`
   - `Handoffs`
   - `Exceptions`
   - `OnRecord`
   - `Benefits`
   - `EndCard`
5. **Gate 1:** stills of every scene. **You approve the look.**
6. **Gate 2:** a 60 s test render (0:00–1:00). **You approve the pace and voices.**
7. **Full render, mix and finalize:** output `SATS/sats-motion/out/final.mp4`. Open it in Explorer, VLC or a browser; the VS Code preview plays it silently.

**QA before delivery:**
- No "Anant", localhost address, "Demo retry" text or other workflows visible.
- No "COSYS" text left on any node.
- The voice-over never says "real" or "live" call.
- Captions match the call audio word for word.
- Loudness is −16 LUFS ±1.
- The end card domain is correct.
