// v5.1: VEE as a talking bust in a round bubble, at the bookends only. It grows in for the reveal,
// glides left, bursts the 12 caller cards out of itself and shrinks away (the product section is pure
// UI), then grows back for the end card. Every size change is geometry (never a CSS scale of the
// dithered render) and positions are whole pixels, so the 1-bit dots stay crisp in motion.
import {Easing} from 'remotion';
import cues from '../../public/legion5/cues.json';
import type {Pose} from './choreo';
import {ARM_REST} from './choreo';
import {pop} from './kit';
import {easeInOut, k} from './theme';
import {nodAt} from './performance';

const A = cues.actions;
type V2 = [number, number];

// centre, diameter, and which way VEE looks (+1 = toward screen right)
export type Place = {cx: number; cy: number; d: number; look: number};
export const PLACES = {
  hero: {cx: 500, cy: 560, d: 560, look: 0.5}, // big, centre-left (reveal)
  legion: {cx: 232, cy: 500, d: 400, look: 1}, // left of the card grid (x0 452), face still readable at 3 px dots
  cta: {cx: 470, cy: 590, d: 560, look: 0.5}, // big, left (end card)
} satisfies Record<string, Place>;
type PlaceName = keyof typeof PLACES;
const HOPS = A.hops as unknown as [number, PlaceName][];
const HOP = A.hopDur;

const smooth = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const bump = (t: number, a: number, dur: number) => (t < a || t > a + dur ? 0 : Math.sin(((t - a) / dur) * Math.PI));

// soft spring (~4 % overshoot, settles in ~0.5 s) for the entrances; an accelerating shrink for the exit
const grow = (t: number, at: number) => pop(t, at, 120, 16);
/** 0..1 size factor of VEE's bubble: grows in, shrinks away after the card burst, grows back for the CTA. */
export const veeShown = (t: number) =>
  t >= A.veeBack ? grow(t, A.veeBack) : grow(t, A.veeIn) * (1 - k(t, A.veeOut, A.veeOut + 0.4, Easing.in(Easing.cubic)));

// whole-pixel centre, even diameter: disc, ring, shadow and the dither anchor all line up
const snap = (p: Place): Place => ({...p, cx: Math.round(p.cx), cy: Math.round(p.cy), d: 2 * Math.round(p.d / 2)});
export type Bubble = Place;
/** The bubble at time t: its place, or an eased low-arc glide between places. */
export const bubbleAt = (t: number): Bubble => {
  if (t >= A.veeBack) return snap(PLACES.cta);
  let from: Place = PLACES.hero;
  for (const [start, name] of HOPS) {
    const to = PLACES[name];
    if (t < start) break;
    if (t < start + HOP) {
      const e = easeInOut((t - start) / HOP);
      const arc = Math.min(60, 0.2 * Math.hypot(to.cx - from.cx, to.cy - from.cy)) * Math.sin(Math.PI * e);
      const lerp = (u: number, v: number) => u + (v - u) * e;
      return snap({cx: lerp(from.cx, to.cx), cy: lerp(from.cy, to.cy) - arc, d: lerp(from.d, to.d), look: lerp(from.look, to.look)});
    }
    from = to;
  }
  return snap(from);
};

/** Where things launched from the bubble start (its centre at time t). */
export const bubbleFrom = (t: number): V2 => {
  const b = bubbleAt(t);
  return [b.cx, b.cy];
};

// ─── the bust inside the bubble ───────────────────────────────────────────────────────
// Model units = source px of the art (feet at y≈0). The bubble frames model y 330..640 (head and
// shoulders, thumbs-up still in view) around model (186, 485).
// A real hello wave: the forearm comes up first (the hand rises inside the bubble), then the upper arm
// lifts out to the side and HOLDS while the forearm swings side to side from the elbow (windshield
// wiper), palm to camera, beside the head; lowering runs the other way round.
const WAVE = {dur: 1.35, upper: 0.44, fore: 1.31, swing: 0.35, hz: 2.2}; // radians: upper arm 25° up, forearm ~75°
export const waveAt = (t: number) => {
  const p = (t - A.wave) / WAVE.dur;
  if (p <= 0 || p >= 1) return {d1: 0, d2: 0, twist: 0, on: 0};
  const onFore = smooth(0, 0.14, p) * (1 - smooth(0.88, 1, p)); // forearm leads up, follows down
  const onUpper = smooth(0.08, 0.24, p) * (1 - smooth(0.78, 0.92, p)); // upper arm lifts after, drops first
  const osc = Math.sin((t - A.wave - 0.32) * Math.PI * 2 * WAVE.hz) * smooth(0.2, 0.34, p) * (1 - smooth(0.7, 0.8, p));
  const a1 = ARM_REST.a1 + onUpper * (WAVE.upper - ARM_REST.a1); // upper arm: out to the side, then still
  const a2 = ARM_REST.a2 + onFore * (WAVE.fore - ARM_REST.a2) + onUpper * WAVE.swing * osc; // forearm swings at the elbow
  const d1 = a1 - ARM_REST.a1;
  return {d1, d2: a2 - ARM_REST.a2 - d1, twist: 1.3 * onFore, on: onUpper};
};

// thumbs-up: raise, two smooth pumps while held, lower
const PUMP = 0.9;
const thumbAt = (t: number) => {
  const a = A.pumps.find((p) => t >= p && t <= p + PUMP);
  if (a === undefined) return 0;
  const p = (t - a) / PUMP;
  const hold = smooth(0, 0.22, p) * (1 - smooth(0.78, 1, p));
  return hold * (0.28 + 0.1 * (0.5 - 0.5 * Math.cos(4 * Math.PI * smooth(0.15, 0.85, p))));
};

export const bubblePose = (t: number, b: Bubble): Pose => {
  const k = b.d / 310;
  const nod = nodAt(t);
  // a small lean + nod toward the grid as each group of caller cards bursts out
  const burst = A.deal.reduce((s, a) => Math.max(s, bump(t, a - 0.05, 0.35)), 0);
  const wave = waveAt(t); // right (open) hand: only the hello wave
  return {
    x: b.cx,
    y: b.cy + 485 * k,
    k,
    sx: 1,
    sy: 1,
    spine: {roll: 0.012 * Math.sin(t * 0.7), yaw: 0.06 * b.look + 0.1 * burst},
    head: {
      yaw: 0.15 * b.look + 0.035 * Math.sin(t * 0.6), // capped so the face stays toward camera
      pitch: 0.07 * nod + 0.05 * burst + 0.012 * Math.sin(t * 1.3),
      roll: 0.025 * Math.sin(t * 0.9) + 0.02 * nod,
    },
    armR: {d1: wave.d1, d2: wave.d2, twist: wave.twist},
    armL: {dz: -thumbAt(t)},
    legs: 0,
  };
};
