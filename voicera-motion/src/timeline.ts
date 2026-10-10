// Everything here is in SOURCE time. Nothing is cut, so body frame = source frame.
// Facts about the source file come from src/video.json (written by scripts/setup.py).
import video from './video.json';

export const FPS = video.fps;
export const SRC_FRAMES = video.frames;
export const SRC_W = video.width;
export const SRC_H = video.height;
// Where the screen recording sits inside the source (inside any letterbox).
export const CROP = video.crop;
// Floating window on the canvas, same aspect as the recording. Leaves a top band
// (chapter title + progress) and a bottom band (captions).
export const WIN = {x: 60, y: 100, w: 1800, h: Math.round((1800 * CROP.h) / CROP.w)};
export const S = WIN.w / CROP.w; // source px -> window px

// Appended after the source. null = no end card. focusY: vertical centre (source px)
// of what should shrink up out of the source's last frame, e.g. a logo lockup.
export const endCard: {cta: string; url: string; focusY: number} | null = {
  cta: 'Get started →',
  url: 'voiceracx.ai',
  focusY: 534,
};

// How each stretch of the source is presented (frame ranges from scene detection).
export type Mode = 'full' | 'framed' | 'blend';
export const ranges: {from: number; to: number; mode: Mode}[] = [
  {from: 0, to: 301, mode: 'full'}, // Canva title card
  {from: 301, to: 12586, mode: 'framed'}, // desktop screen recording
  {from: 12586, to: 12646, mode: 'blend'}, // phone: incoming call
  {from: 12646, to: 12910, mode: 'framed'}, // agent desktop
  {from: 12910, to: 13090, mode: 'blend'}, // phone: SMS / WhatsApp
  {from: 13090, to: SRC_FRAMES, mode: 'full'}, // Canva closing + logo
];

export type Rect = [x: number, y: number, w: number, h: number]; // source px

// All cue times in seconds. Callouts sit inside "still" windows of the recording
// (analysis/still.txt) so the UI never slides out from under them; verify with
// scripts/check_cues.py after any change.
// Camera eases into rect at `at`, holds until `until`.
export const zooms: {at: number; until: number; rect: Rect}[] = [
  {at: 11.0, until: 15.2, rect: [220, 520, 525, 345]}, // login form
  {at: 100.8, until: 121.5, rect: [461, 219, 1000, 481]}, // Add Contact List modal
  {at: 301.4, until: 316.8, rect: [288, 416, 1128, 437]}, // predictive dialing parameters
  {at: 342.0, until: 377.9, rect: [288, 480, 1128, 367]}, // SMS / Email / WhatsApp setup
];
// Spotlight + ring + label pinned to a UI element (moves with the zoom camera).
export const callouts: {at: number; until: number; rect: Rect; label: string}[] = [
  {at: 19.6, until: 22.8, rect: [355, 370, 1505, 365], label: 'Campaigns at a glance'},
  {at: 46.9, until: 51.0, rect: [869, 450, 477, 535], label: 'Live call monitoring'},
  {at: 57.3, until: 59.0, rect: [520, 293, 216, 40], label: 'List-based campaign reports'},
  {at: 73.0, until: 75.1, rect: [760, 296, 199, 45], label: 'Preview campaign reports'},
  {at: 90.2, until: 94.0, rect: [40, 723, 265, 62], label: 'Resources → Manage Contact Lists'},
  {at: 96.8, until: 99.8, rect: [833, 249, 205, 50], label: 'Add Contact List'},
  {at: 115.2, until: 121.0, rect: [516, 489, 436, 271], label: 'Call · SMS · Email · WhatsApp'},
  {at: 131.0, until: 133.2, rect: [1745, 453, 40, 40], label: 'Add contacts to this list'},
  {at: 134.3, until: 136.8, rect: [729, 171, 172, 49], label: 'Add Contact'},
  {at: 156.4, until: 158.3, rect: [1328, 171, 168, 49], label: 'Bulk upload'},
  {at: 176.2, until: 179.6, rect: [55, 197, 250, 58], label: 'Admin → SMS Template'},
  {at: 180.6, until: 182.9, rect: [1168, 170, 185, 50], label: 'Add Template'},
  {at: 194.2, until: 198.9, rect: [377, 353, 1463, 80], label: 'SMS · Insurance Renewal'},
  {at: 200.0, until: 203.4, rect: [55, 360, 250, 50], label: 'WhatsApp Template'},
  {at: 207.9, until: 210.6, rect: [377, 353, 1463, 80], label: 'Email · Insurance Renewal'},
  {at: 214.8, until: 219.1, rect: [45, 710, 262, 60], label: 'Campaign → List-Based Campaign'},
  {at: 223.3, until: 225.0, rect: [349, 280, 190, 48], label: 'Add Campaign'},
  {at: 240.9, until: 245.6, rect: [320, 616, 411, 324], label: 'Global time zones'},
  {at: 259.3, until: 262.8, rect: [320, 720, 1265, 171], label: 'Pick your channels'},
  {at: 266.6, until: 270.0, rect: [288, 483, 555, 58], label: 'IVR flow'},
  {at: 274.3, until: 276.6, rect: [863, 483, 553, 58], label: 'Outbound caller number'},
  {at: 284.4, until: 290.8, rect: [285, 505, 135, 44], label: 'Next customer as soon as an agent is free'},
  {at: 291.0, until: 300.8, rect: [428, 505, 122, 44], label: 'Predicts when agents free up'},
  {at: 320.0, until: 324.5, rect: [288, 668, 555, 58], label: 'Skill-based routing'},
  {at: 333.9, until: 341.4, rect: [288, 757, 1080, 92], label: 'Business days & hours'},
  {at: 344.4, until: 347.0, rect: [703, 483, 188, 37], label: 'SMS'},
  {at: 356.3, until: 359.5, rect: [915, 483, 185, 37], label: 'Email'},
  {at: 364.0, until: 367.5, rect: [1115, 483, 232, 37], label: 'WhatsApp'},
  {at: 392.0, until: 396.6, rect: [1457, 909, 177, 48], label: 'Create Campaign'},
  {at: 398.6, until: 401.8, rect: [351, 480, 1516, 107], label: 'New campaign, scheduled'},
  {at: 406.0, until: 411.4, rect: [1611, 507, 94, 44], label: 'Execute now'},
  {at: 413.0, until: 419.3, rect: [1437, 493, 170, 73], label: 'Calls going out'},
];
// Chapter starts; title shows big, then settles into the top-band label.
export const chapters: {at: number; title: string}[] = [
  {at: 10.03, title: 'Sign in'},
  {at: 18.2, title: 'Dashboard'},
  {at: 57.7, title: 'Campaign reports'},
  {at: 79.5, title: 'Contact lists'},
  {at: 127.2, title: 'Adding contacts'},
  {at: 164.7, title: 'Message templates'},
  {at: 209.4, title: 'Create a campaign'},
  {at: 259.3, title: 'Channels & dialing'},
  {at: 341.8, title: 'Messaging setup'},
  {at: 378.1, title: 'Review & launch'},
  {at: 419.5, title: 'Live'},
];
// Center-screen emphasis moments, landing on the spoken phrase (public/words.json),
// over transitions/static stretches so no UI action is hidden.
export const kinetic: {at: number; dur: number; text: string}[] = [
  {at: 54.2, dur: 3.0, text: 'Monitor everything from *one interface.*'},
  {at: 83.0, dur: 3.0, text: 'First, build your *contact list.*'},
  {at: 160.4, dur: 3.8, text: 'Big list? *Upload one CSV.*'},
  {at: 271.3, dur: 3.0, text: 'Human agent, or *AI agent.*'},
  {at: 280.8, dur: 3.2, text: '*Progressive* or *Predictive* dialing.'},
];

// --- the runnable check: fail loudly in Studio/render on bad data ---
const assert = (ok: boolean, msg: string) => {
  if (!ok) throw new Error(`timeline: ${msg}`);
};
ranges.forEach((r, i) => {
  assert(r.from < r.to, `range ${i} empty`);
  assert(i === 0 ? r.from === 0 : r.from === ranges[i - 1].to, `range ${i} not contiguous`);
});
assert(ranges[ranges.length - 1].to === SRC_FRAMES, 'ranges must end at source end');
const inFramed = (at: number, until: number) =>
  ranges.find((q) => at * FPS >= q.from && until * FPS <= q.to)?.mode === 'framed';
const sortedNoOverlap = (name: string, xs: {at: number; until: number}[]) =>
  xs.forEach((x, i) => {
    assert(x.at < x.until, `${name} ${i}: at >= until`);
    assert(i === 0 || x.at >= xs[i - 1].until, `${name} ${i} overlaps previous`);
    assert(inFramed(x.at, x.until), `${name} ${i} must sit inside one framed range`);
  });
sortedNoOverlap('zoom', zooms);
sortedNoOverlap('callout', callouts);
sortedNoOverlap('kinetic', kinetic.map((k) => ({at: k.at, until: k.at + k.dur})));
chapters.forEach((c, i) => assert(i === 0 || c.at > chapters[i - 1].at, `chapter ${i} out of order`));
