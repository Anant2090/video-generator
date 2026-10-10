// Every time here is SOURCE seconds (word timings: public/words.json).
// Rects are [x, y, w, h] in source pixels, measured on analysis/grid/*.png.
import {SEGMENTS, FPS} from './edit';

export type Rect = [x: number, y: number, w: number, h: number];

// ---- how each stretch of footage is shown ----------------------------------
// full: untouched full-frame. call: footage hidden, LiveCall scene drawn instead.
// mews: floating window, `crop` removes that screen's letterbox.
export type Mode = 'full' | 'call' | 'mews';
export type Screen = 'dash' | 'timeline' | 'sales';
export const ranges: {from: number; to: number; mode: Mode; crop?: Rect; screen?: Screen}[] = [
  {from: 0, to: 27.0, mode: 'full'}, // lobby intro, VEE intro, front desk
  {from: 27.0, to: 133.74, mode: 'call'}, // source shows the old "En / Hello!" phone until its cut at 133.73
  {from: 133.74, to: 142.5, mode: 'full'}, // robot + holograms, "connects with Mews"
  {from: 142.5, to: 154.9, mode: 'mews', crop: [6, 0, 1908, 1080], screen: 'dash'}, // analytics dashboard
  {from: 154.9, to: 167.45, mode: 'mews', crop: [0, 48, 1920, 984], screen: 'timeline'}, // timeline + guest panel
  {from: 167.45, to: 179.9, mode: 'mews', crop: [0, 32, 1920, 1016], screen: 'sales'}, // look-to-book sales screen
  {from: 179.9, to: 999, mode: 'full'}, // recap robot (hard cut in the source at 179.9)
];

// Scene overlays (fade windows in source s)
export const CALL = {in: 26.3, out: 134.25}; // LiveCall covers the footage between these; fades out over the robot
export const HOOK_TEXT = ['Every guest call.', '*Answered instantly.*'];
export const DEMO_AT = 191.3; // demo card dissolves in; IH Miami line is silenced from here
export const DEMO = {title: 'VEE Concierge', line: 'Every guest call. Answered instantly.', cta: 'Book a demo', url: 'voiceracx.ai'};

// ---- Mews window: camera + callouts ----------------------------------------
// Camera eases into rect at `at`, holds until `until`.
export const zooms: {at: number; until: number; rect: Rect}[] = [
  {at: 155.5, until: 159.4, rect: [0, 178, 1354, 853]}, // room timeline
  {at: 159.6, until: 163.6, rect: [1359, 131, 553, 413]}, // guest panel: dates, room
  {at: 163.7, until: 167.25, rect: [1359, 544, 553, 478]}, // guest panel: guests, flight, check-in
  {at: 171.2, until: 173.65, rect: [435, 366, 1088, 141]}, // dates / rooms / guests fields
  {at: 173.75, until: 177.0, rect: [975, 572, 900, 469]}, // rate & room options
];
export const callouts: {at: number; until: number; rect: Rect; label: string}[] = [
  {at: 148.5, until: 149.9, rect: [262, 347, 534, 262], label: 'Total reservations'},
  {at: 149.9, until: 150.8, rect: [810, 347, 531, 262], label: 'Room nights'},
  {at: 150.8, until: 151.9, rect: [1354, 347, 536, 262], label: 'Guest volume'},
  {at: 151.95, until: 153.7, rect: [262, 634, 759, 420], label: 'Reservation status'},
  {at: 153.7, until: 154.85, rect: [1037, 634, 853, 420], label: 'Booking segments'},
  {at: 156.2, until: 159.4, rect: [330, 300, 1024, 700], label: 'Availability at a glance'},
  {at: 161.9, until: 162.65, rect: [1378, 272, 525, 126], label: 'Stay dates'},
  {at: 162.65, until: 163.6, rect: [1378, 422, 525, 47], label: 'Room details'},
  {at: 163.75, until: 164.9, rect: [1378, 563, 525, 150], label: 'Guest information'},
  {at: 164.9, until: 166.05, rect: [1384, 735, 505, 196], label: 'Flight & travel details'},
  {at: 166.05, until: 167.2, rect: [1766, 962, 133, 45], label: 'One-click check-in'},
  {at: 168.0, until: 171.1, rect: [34, 173, 425, 47], label: 'New reservation'},
  {at: 171.3, until: 171.9, rect: [709, 409, 248, 51], label: 'Dates'},
  {at: 171.9, until: 172.5, rect: [1012, 409, 221, 51], label: 'Rooms'},
  {at: 172.5, until: 173.6, rect: [1299, 409, 223, 51], label: 'Guests'},
  {at: 173.9, until: 176.9, rect: [975, 640, 420, 400], label: 'Room types & rates'},
];
// Corrections painted onto the static Mews screens so they match the call
// (Oct 1–5 2026, Thu–Mon, 14:00 both ways, 2 rooms, 3 adults, John Doe, Demo Heritage Hotel).
// box = measured ink bbox of the original text (scripts/measure.py); the cover pads it.
export type Patch = {
  screen: Screen;
  box: Rect;
  orig: string;
  text: string;
  size: number;
  weight?: number;
  color?: string;
  bg?: string;
  dy?: number; // nudge (source px) so the new text sits on the old baseline
  coverW?: number; // widen the cover (e.g. to hide the room toggle)
  underline?: string[]; // words to underline (room numbers)
};
const INK = '#24232B';
const GREY = '#6F6E80';
const HINT = '#8A8A95';
export const mewsPatches: Patch[] = [
  {screen: 'dash', box: [365, 39, 277, 16], orig: 'Search within Analytics Hotel Test', text: 'Search within Demo Heritage Hotel', size: 17.6, color: HINT},
  {screen: 'timeline', box: [388, 81, 292, 12], orig: 'Search within The Grand Mews Hotel', text: 'Search within Demo Heritage Hotel', size: 16.5, color: HINT},
  {screen: 'timeline', box: [532, 152, 145, 17], orig: '15 Sep 2026 Tue', text: '1 Oct 2026 Thu', size: 17.5, color: INK, bg: '#FDFDFD'},
  {screen: 'timeline', box: [338, 203, 156, 18], orig: 'September 2026', text: 'October 2026', size: 18.8, weight: 600, color: INK, bg: '#FDFDFD'},
  {screen: 'timeline', box: [400, 244, 52, 12], orig: 'Tue 15', text: 'Thu 1', size: 16.5, weight: 600, color: INK, bg: '#F4F3F8'},
  {screen: 'timeline', box: [594, 244, 58, 12], orig: 'Wed 16', text: 'Fri 2', size: 16.5, weight: 600, color: INK, bg: '#FDFDFD'},
  {screen: 'timeline', box: [790, 244, 53, 12], orig: 'Thu 17', text: 'Sat 3', size: 16.5, weight: 600, color: INK, bg: '#FFFFFF'},
  {screen: 'timeline', box: [989, 244, 43, 12], orig: 'Fri 18', text: 'Sun 4', size: 16.5, weight: 600, color: INK, bg: '#FFFFFF'},
  {screen: 'timeline', box: [1183, 244, 48, 12], orig: 'Sat 19', text: 'Mon 5', size: 16.5, weight: 600, color: INK, bg: '#E6E7FC'},
  {screen: 'timeline', box: [1106, 637, 100, 17], orig: 'Smith, John', text: 'Doe, John', size: 17, weight: 500, color: '#FFFFFF', bg: '#3C7FBF'},
  {screen: 'timeline', box: [1523, 211, 78, 16], orig: 'Group (1)', text: 'Group (2)', size: 18, weight: 500, color: GREY},
  {screen: 'timeline', box: [1398, 292, 246, 18], orig: '15/09/2026 - 19/09/2026', text: '01/10/2026 - 05/10/2026', size: 20.5, weight: 600, color: INK},
  {screen: 'timeline', box: [1397, 323, 245, 15], orig: '4 nights, Tue 14:00 - Sat 12:00', text: '4 nights, Thu 14:00 - Mon 14:00', size: 17, color: GREY, bg: '#FDFDFD'},
  {screen: 'timeline', box: [1396, 428, 185, 32], orig: 'STD 705', text: 'STD 705  ·  DBL 206', size: 20.5, weight: 600, color: INK, dy: 12, underline: ['705', '206']},
  {screen: 'timeline', box: [1690, 575, 189, 17], orig: '3 (2 Adults, 0 Children)', text: '3 (3 Adults, 0 Children)', size: 17.5, color: INK},
  {screen: 'timeline', box: [1535, 841, 140, 15], orig: '15/09/2026 Tue', text: '01/10/2026 Thu', size: 18.7, color: INK},
  {screen: 'sales', box: [358, 69, 317, 13], orig: 'Search within The Grand Mews Hotel', text: 'Search within Demo Heritage Hotel', size: 18.6, color: HINT},
  {screen: 'sales', box: [780, 425, 125, 21], orig: '15 Sep 2026', text: '5 Oct 2026', size: 21.5, color: '#3A3E5C'},
  {screen: 'sales', box: [719, 475, 34, 16], orig: 'Tue', text: 'Mon', size: 21, color: '#3A3E5C', bg: '#FDFDFD'},
  {screen: 'sales', box: [1119, 425, 9, 17], orig: '1', text: '2', size: 23, color: '#3A3E5C'},
];
// Airport pickup chip added inside the Flight Booking block (timeline screen).
// The source slides between screens with motion blur; patches only show while the screen is still.
export const screenStill: Record<Screen, [number, number]> = {dash: [142.57, 154.7], timeline: [155.13, 167.23], sales: [167.66, 179.9]};
export const pickupChip = {screen: 'timeline' as const, x: 1712, y: 832, text: 'Pickup · 1:00 PM'};

// Chapter label in the top band.
export const chapters: {at: number; until: number; title: string}[] = [
  {at: 142.5, until: 179.9, title: 'Inside Mews'},
];

// ---- full-frame kinetic lines (*words* get the gradient) --------------------
export const kinetic: {at: number; dur: number; text: string}[] = [
  {at: 137.0, dur: 4.2, text: 'From the call, *straight into Mews.*'},
  {at: 177.1, dur: 2.8, text: 'All from *one streamlined workflow.*'},
];

// ---- subtitles: active outside the call scene and the demo card -------------
export const subtitleRanges: [number, number][] = [
  [10.4, 26.4],
  [133.6, DEMO_AT],
];

// ---- live call --------------------------------------------------------------
export type Speaker = 'vee' | 'guest';
export const turns: {at: number; who: Speaker}[] = [
  {at: 26.6, who: 'vee'},
  {at: 32.2, who: 'guest'},
  {at: 34.5, who: 'vee'},
  {at: 41.7, who: 'guest'},
  {at: 47.3, who: 'vee'},
  {at: 64.0, who: 'guest'},
  {at: 66.4, who: 'vee'},
  {at: 77.2, who: 'guest'},
  {at: 83.1, who: 'vee'},
  {at: 92.3, who: 'guest'},
  {at: 93.7, who: 'vee'},
  {at: 109.4, who: 'guest'},
  {at: 113.8, who: 'vee'},
  {at: 116.4, who: 'guest'},
  {at: 122.0, who: 'vee'},
  {at: 124.9, who: 'guest'},
  {at: 128.3, who: 'vee'},
  {at: 132.0, who: 'guest'},
];
export const TURN_END = 133.0;

export const GREETINGS = ['Hello', 'Hola', 'Bonjour', 'Ciao', 'Olá', 'Hallo', 'こんにちは', 'مرحبا', 'Hello!'];
export const GREET = {at: 26.6, settle: 28.6, chipOut: 33.0};

export type Field = {label: string; value: string; at: number; icon: string};
export const room = {
  title: 'Room reservation',
  status: [
    {at: 26.6, text: 'Collecting details', tone: 'live'},
    {at: 94.4, text: 'Confirming', tone: 'live'},
    {at: 107.3, text: 'Confirmed', tone: 'done'},
  ] as {at: number; text: string; tone: 'live' | 'done'}[],
  fields: [
    {label: 'Check-in', value: 'Oct 1 · around 2 PM', at: 42.9, icon: '→'},
    {label: 'Check-out', value: 'Oct 5 · around 2 PM', at: 44.66, icon: '←'},
    {label: 'Stay', value: '4 nights', at: 50.4, icon: '☾'},
    {label: 'Guests', value: '3', at: 64.14, icon: '◍'},
    {label: 'Rooms', value: '1 Double + 1 Single', at: 80.66, icon: '▭'},
  ] as Field[],
  note: {at: 60.6, text: '2 PM arrival & departure noted'},
  clarify: {at: 84.77, resolved: 92.99, value: 'Double + Single', badge: '2 rooms'},
  // recap sweep: row index lit at each spoken mention
  recap: [
    {at: 95.49, row: 4},
    {at: 95.99, row: 3},
    {at: 98.49, row: 0},
    {at: 100.29, row: 1},
    {at: 102.43, row: 4},
  ],
  recapEnd: 104.6,
};
export const pickup = {
  title: 'Airport pickup',
  at: 111.27,
  status: [
    {at: 111.27, text: 'Collecting details', tone: 'live'},
    {at: 131.13, text: 'Arranged', tone: 'done'},
  ] as {at: number; text: string; tone: 'live' | 'done'}[],
  fields: [
    {label: 'Pickup', value: '1:00 PM', at: 111.6, icon: '◷'},
    {label: 'Flight', value: 'Skyline Airways · SX234', at: 117.05, icon: '✈'}, // speech resumes after digital silence
    {label: 'Arrival', value: '12:45 PM', at: 119.64, icon: '↓'},
    {label: 'Passengers', value: '3', at: 120.8, icon: '◍'},
    {label: 'Luggage', value: '2 cabin bags · 2 suitcases', at: 125.66, icon: '▣'},
  ] as Field[],
};

// ---- the runnable check ----------------------------------------------------
const assert = (ok: boolean, msg: string) => {
  if (!ok) throw new Error(`cues: ${msg}`);
};
const kept = (s: number) => SEGMENTS.some(([a, b]) => s * FPS >= a && s * FPS < b);
const modeAt = (s: number) => ranges.find((r) => s >= r.from && s < r.to);
const ordered = (name: string, xs: {at: number; until: number}[]) =>
  xs.forEach((x, i) => {
    assert(x.at < x.until, `${name} ${i}: at >= until`);
    assert(i === 0 || x.at >= xs[i - 1].until, `${name} ${i} overlaps previous`);
    const m = modeAt(x.at);
    assert(m?.mode === 'mews' && x.until <= m.to + 1e-6, `${name} ${i} must sit inside one mews range`);
    assert(kept(x.at), `${name} ${i} starts inside a removed pause`);
  });
ordered('zoom', zooms);
ordered('callout', callouts);
ranges.forEach((r, i) => assert(i === 0 || r.from === ranges[i - 1].to, `range ${i} not contiguous`));
[...room.fields, ...pickup.fields].forEach((f) => assert(kept(f.at), `field ${f.label} inside a removed pause`));
turns.forEach((t, i) => assert(i === 0 || t.at > turns[i - 1].at, `turn ${i} out of order`));
