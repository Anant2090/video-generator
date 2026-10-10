// v5: VEE as a talking bust in a round bubble, at the bookends only. It pops in for the reveal, hops
// left, bursts the 12 caller cards out of itself and shrinks away (the product section is pure UI),
// then pops back for the end card.
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
  legion: {cx: 230, cy: 500, d: 300, look: 1}, // left, the cards burst out toward the grid
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

/** 0..1 how much of VEE is on screen: pops in, shrinks away after the card burst, pops back for the CTA. */
export const veeShown = (t: number) =>
  t >= A.veeBack ? pop(t, A.veeBack, 150, 13) : pop(t, A.veeIn, 150, 13) * (1 - k(t, A.veeOut, A.veeOut + 0.3, easeInOut));

export type Bubble = Place & {sx: number; sy: number};
/** The bubble at time t: place, hop arc with squash & stretch, a pulse on each card burst. */
export const bubbleAt = (t: number): Bubble => {
  if (t >= A.veeBack) return withSquash(PLACES.cta, 0);
  let from: Place = PLACES.hero;
  for (const [start, name] of HOPS) {
    const to = PLACES[name];
    if (t < start) break;
    if (t < start + HOP) {
      const p = (t - start) / HOP;
      const e = easeInOut(smooth(0.2, 0.85, p));
      const dist = Math.hypot(to.cx - from.cx, to.cy - from.cy);
      const arc = Math.min(220, Math.max(90, dist * 0.3)) * Math.sin(Math.PI * smooth(0.2, 0.85, p));
      const squash = p < 0.2 ? 0.12 * Math.sin((Math.PI * p) / 0.2) : p < 0.85 ? -0.1 * Math.sin((Math.PI * (p - 0.2)) / 0.65) : 0.14 * Math.sin((Math.PI * (p - 0.85)) / 0.15);
      return withSquash(
        {cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e - arc, d: from.d + (to.d - from.d) * e, look: from.look + (to.look - from.look) * e},
        squash,
      );
    }
    from = to;
  }
  const pulse = A.deal.reduce((s, a) => Math.max(s, bump(t, a - 0.05, 0.2)), 0);
  return withSquash({...from, d: from.d * (1 + 0.07 * pulse)}, 0);
};
const withSquash = (p: Place, s: number): Bubble => ({...p, sx: 1 + s, sy: 1 - s});

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

const env = (t: number, a: number, dur: number) => (t < a || t > a + dur ? 0 : Math.min(1, Math.sin(((t - a) / dur) * Math.PI) * 1.6));

export const bubblePose = (t: number, b: Bubble): Pose => {
  const k = b.d / 310;
  const nod = nodAt(t);
  // right (open) hand: only the hello wave; left: thumbs-up pumps
  const wave = waveAt(t);
  const pump = A.pumps.reduce((s, a) => Math.max(s, env(t, a, 0.7)), 0);
  const pumpAt = A.pumps.find((a) => t >= a && t <= a + 0.7) ?? 0;
  return {
    x: b.cx,
    y: b.cy + 485 * k,
    k,
    sx: 1,
    sy: 1,
    spine: {roll: 0.025 * Math.sin(t * 0.9), yaw: 0.06 * b.look},
    head: {
      yaw: b.look * 0.28 + 0.07 * Math.sin(t * 0.8),
      pitch: 0.1 * nod + 0.025 * Math.sin(t * 2.1),
      roll: 0.05 * Math.sin(t * 1.3) + 0.04 * nod,
    },
    armR: {d1: wave.d1, d2: wave.d2, twist: wave.twist},
    armL: {dz: -(pump * (0.3 + 0.2 * Math.abs(Math.sin(((t - pumpAt) / 0.7) * Math.PI * 3))))},
    legs: 0,
  };
};
