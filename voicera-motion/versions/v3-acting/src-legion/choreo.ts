// VEE's choreography: where it stands, how it hops, and what its arms/legs do, as a pure function of
// global time. The 3D rig (Vee3D.tsx) and every DOM overlay that must line up with VEE's hand (dealt
// cards, stamp, file, buttons, speech bubbles) read the same veeAt(t), so contacts are exact.
//
// Model units = source px of the official art (x right, y up, feet at y≈0); joints from
// video/vee3d/rig_vee.py -> public/legion/vee3d/joints.json. Screen = 1920x1080 px.
import cues from '../../public/legion/cues.json';
import J from '../../public/legion/vee3d/joints.json';
import {camAt, type Cam, toStage, WIN} from './kit';
import {easeInOut, SC} from './theme';
import {nodAt, surpriseAt} from './performance';

const A = cues.actions;
type V2 = [number, number];

// ─── stages ──────────────────────────────────────────────────────────────────────────
// (x, y) = screen position of the feet midpoint (model 186, 0); k = screen px per model unit.
export type Stage = {x: number; y: number; k: number; look: number};
export const STAGES = {
  hook: {x: 240, y: 1050, k: 1.0, look: 0.8}, // full body, left
  hero: {x: 528.5, y: 1624, k: 2.25, look: 0.6}, // big bust, left (reveal)
  legion: {x: 250, y: 1050, k: 1.0, look: 1}, // full body, left of the card grid
  build: {x: 150, y: 1001, k: 1.25, look: 1}, // beside the builder window, head fully in frame
  live: {x: 230, y: 1060, k: 1.0, look: 1}, // full body, next to the RUN button
  scores: {x: 1085, y: 1050, k: 1.0, look: 0.8}, // center, between report and stat cards
  why: {x: 150, y: 1061, k: 1.25, look: 1}, // left of the transcript, stamp in hand
  real: {x: 200, y: 1060, k: 1.0, look: 1}, // full body, carrying the call file
  cta: {x: 528.5, y: 1624, k: 2.25, look: 0.6}, // big bust, left (end card)
} satisfies Record<string, Stage>;
type StageName = keyof typeof STAGES;
const HOPS = A.hops as unknown as [number, StageName][];
const HOP = A.hopDur;

export const toScreen = (st: Stage, m: V2): V2 => [st.x + (m[0] - 186) * st.k, st.y - m[1] * st.k];
export const toModel = (st: Stage, s: V2): V2 => [186 + (s[0] - st.x) / st.k, (st.y - s[1]) / st.k];

// ─── the right (open-hand) arm as a planar 2-bone chain ────────────────────────────────
const S_R: V2 = J.upperarm_r as V2;
const E_R: V2 = J.forearm_r as V2;
const T_R: V2 = J.hand_r_end as V2; // fingertip (hand is rigid with the forearm)
const L1 = Math.hypot(E_R[0] - S_R[0], E_R[1] - S_R[1]);
const L2 = Math.hypot(T_R[0] - E_R[0], T_R[1] - E_R[1]);
const A1R = Math.atan2(E_R[1] - S_R[1], E_R[0] - S_R[0]);
const A2R = Math.atan2(T_R[1] - E_R[1], T_R[0] - E_R[0]);
const LEG = Math.hypot(J.thigh_l[0] - J.shin_l[0], J.thigh_l[1] - J.shin_l[1]) + Math.hypot(J.shin_l[0] - J.foot_l[0], J.shin_l[1] - J.foot_l[1]);

type Arm = {a1: number; a2: number}; // absolute angles (model plane, radians, CCW from +x)
const REST: Arm = {a1: A1R, a2: A2R};
const fk = (arm: Arm, ext = 0): V2 => [
  S_R[0] + L1 * Math.cos(arm.a1) + (L2 + ext) * Math.cos(arm.a2),
  S_R[1] + L1 * Math.sin(arm.a1) + (L2 + ext) * Math.sin(arm.a2),
];
/** 2-bone IK: fingertip (or prop tip, `ext` beyond it) onto model point p; elbow bends toward `pref`. */
const ik = (p: V2, ext = 0, pref: V2 = [0.55, -0.83]): Arm => {
  const l2 = L2 + ext;
  const dx = p[0] - S_R[0];
  const dy = p[1] - S_R[1];
  const d = Math.min(L1 + l2 - 1e-3, Math.max(Math.abs(L1 - l2) + 1e-3, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const off = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - l2 * l2) / (2 * L1 * d))));
  const pick = [base + off, base - off].sort((u, v) => Math.cos(v) * pref[0] + Math.sin(v) * pref[1] - (Math.cos(u) * pref[0] + Math.sin(u) * pref[1]))[0];
  const e: V2 = [S_R[0] + L1 * Math.cos(pick), S_R[1] + L1 * Math.sin(pick)];
  return {a1: pick, a2: Math.atan2(p[1] - e[1], p[0] - e[0])};
};
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const lerpArm = (u: Arm, v: Arm, w: number): Arm => ({a1: u.a1 + wrap(v.a1 - u.a1) * w, a2: u.a2 + wrap(v.a2 - u.a2) * w});

// ─── contact targets (screen px) ───────────────────────────────────────────────────────
export const BUILD_CAM: [number, Cam][] = [
  [0, {cx: 1100, cy: 575, w: 1560}],
  [0.78, {cx: 1100, cy: 575, w: 1560}],
  [1.0, {cx: 850, cy: 390, w: 1040}],
];
const TAP_UI: V2[] = [
  [378, 390], // "Anxious" chip
  [378, 750], // "Prompt injection" chip
  [430, 364], // rule selector
  [425, 455], // "AI judge check" option
];
export const TAPS = A.taps.map((t, i) => {
  const s = toStage(WIN, camAt(t - SC.build, BUILD_CAM), TAP_UI[i][0], TAP_UI[i][1]);
  return {t, at: [s.x, s.y] as V2};
});
export const RUN_BTN = {x: 440, top: 760, r: 62}; // big RUN button on a stand, right of VEE (live)
export const STAMP_AT: V2 = [560, 590]; // FAIL stamp lands on the bad agent reply (why)
export const STAMP_LEN = 55; // stamp prop length beyond the fingertip, model units
export const DROP_AT: V2 = [700, 560]; // call file lands in the import window (real)
export const DROP_FLIGHT = 0.28;
export const PRESS_AT: V2 = [1010, 690]; // "Join the private beta" button (cta)

// card grid (Legion scene) — same numbers scenes.tsx uses
export const CARD = {w: 218, h: 300, x0: 452, y0: 190, gx: 22, gy: 24};
export const cardXY = (i: number) => ({x: CARD.x0 + (i % 6) * (CARD.w + CARD.gx), y: CARD.y0 + Math.floor(i / 6) * (CARD.h + CARD.gy)});
export const STAT = (i: number) => ({x: 1300, y: 120 + i * 214, w: 570, h: 188});

// ─── right-arm keyframes ───────────────────────────────────────────────────────────────
type Ease = 'in' | 'out' | 'inout'; // how the arm moves INTO this key: strikes accelerate in, recoils ease out
type Key = ({kind: 'rest'} | {kind: 'model'; p: V2; ext?: number; pref?: V2} | {kind: 'screen'; p: V2; ext?: number; pref?: V2}) & {t: number; ease?: Ease};
const COCK: V2 = [300, 520]; // hand up by the ear, ready to flick
const CARRY: V2 = [330, 300]; // holding a prop at the side
const towards = (from: V2, to: V2, len: number): V2 => {
  const d = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  return [from[0] + ((to[0] - from[0]) / d) * len, from[1] + ((to[1] - from[1]) / d) * len];
};
/** Release point of a flick toward screen point `aim` (arm nearly straight), in model units for stage st. */
const flickAt = (st: Stage, aim: V2): V2 => towards(S_R, toModel(st, aim), 0.93 * (L1 + L2));

const KEYS: Key[] = (() => {
  const k: Key[] = [];
  // Legion: deal 12 caller cards in 4 flicks (3 cards each) toward the grid
  const groupAim = (f: number): V2 => {
    const cs = [0, 1, 2].map((j) => cardXY(f * 3 + j));
    return [cs.reduce((s, c) => s + c.x + CARD.w / 2, 0) / 3, cs[0].y + CARD.h / 2];
  };
  k.push({t: A.deal[0] - 0.45, kind: 'rest'});
  A.deal.forEach((r, f) => {
    k.push({t: r - 0.16, kind: 'model', p: COCK, pref: [0.9, -0.4]});
    k.push({t: r, kind: 'model', p: flickAt(STAGES.legion, groupAim(f)), ease: 'in'});
  });
  k.push({t: A.deal[3] + 0.25, kind: 'model', p: flickAt(STAGES.legion, groupAim(3))});
  k.push({t: A.deal[3] + 0.65, kind: 'rest'});
  // Build: tap the chips and the rule with the fingertip
  k.push({t: TAPS[0].t - 0.3, kind: 'rest'});
  TAPS.forEach(({t, at}, i) => {
    const s = toScreen(STAGES.build, S_R);
    const back = towards(at, s, 40);
    if (i === 0 || t - TAPS[i - 1].t > 0.25) k.push({t: t - 0.12, kind: 'screen', p: back});
    k.push({t, kind: 'screen', p: at, ease: 'in'});
    k.push({t: t + 0.08, kind: 'screen', p: back, ease: 'out'});
  });
  k.push({t: TAPS[3].t + 0.4, kind: 'rest'});
  // Live: slam the RUN button (elbow up and out)
  const runTop: V2 = [RUN_BTN.x, RUN_BTN.top - 6];
  k.push({t: A.run - 0.2, kind: 'rest'});
  k.push({t: A.run - 0.09, kind: 'screen', p: [RUN_BTN.x - 20, RUN_BTN.top - 190], pref: [0.8, 0.6]});
  k.push({t: A.run, kind: 'screen', p: runTop, pref: [0.8, 0.6], ease: 'in'});
  k.push({t: A.run + 0.07, kind: 'screen', p: [RUN_BTN.x, RUN_BTN.top - 28], pref: [0.8, 0.6], ease: 'out'});
  k.push({t: A.run + 0.35, kind: 'screen', p: [RUN_BTN.x - 10, RUN_BTN.top - 70], pref: [0.8, 0.6]});
  k.push({t: A.run + 0.65, kind: 'rest'});
  // Scores: deal the 3 stat cards toward their slots
  k.push({t: A.statDeal[0] - 0.4, kind: 'rest'});
  A.statDeal.forEach((r, i) => {
    const s = STAT(i);
    k.push({t: r - 0.14, kind: 'model', p: COCK, pref: [0.9, -0.4]});
    k.push({t: r, kind: 'model', p: flickAt(STAGES.scores, [s.x + s.w / 2, s.y + s.h / 2]), ease: 'in'});
  });
  k.push({t: A.statDeal[2] + 0.5, kind: 'rest'});
  // Why: carry the stamp in, wind up, SLAM
  k.push({t: HOPS[6][0], kind: 'model', p: CARRY});
  k.push({t: A.stamp - 0.33, kind: 'screen', p: [STAMP_AT[0] - 40, STAMP_AT[1] - 210], ext: STAMP_LEN, pref: [0.8, 0.6]});
  k.push({t: A.stamp, kind: 'screen', p: STAMP_AT, ext: STAMP_LEN, pref: [0.8, 0.6], ease: 'in'});
  k.push({t: A.stamp + 0.12, kind: 'screen', p: [STAMP_AT[0] - 10, STAMP_AT[1] - 25], ext: STAMP_LEN, pref: [0.8, 0.6], ease: 'out'});
  k.push({t: A.stamp + 0.55, kind: 'model', p: CARRY});
  // Real: carry the file in, pull back, throw it into the window
  k.push({t: HOPS[7][0], kind: 'model', p: CARRY});
  k.push({t: A.drop - 0.2, kind: 'model', p: [300, 470], pref: [0.9, -0.4]});
  k.push({t: A.drop, kind: 'model', p: flickAt(STAGES.real, DROP_AT), ease: 'in'});
  k.push({t: A.drop + 0.45, kind: 'rest'});
  // CTA: press the "Join the private beta" button and hold it a beat
  k.push({t: A.press - 0.5, kind: 'rest'});
  k.push({t: A.press - 0.12, kind: 'screen', p: [PRESS_AT[0] - 40, PRESS_AT[1] - 12]});
  k.push({t: A.press, kind: 'screen', p: PRESS_AT, ease: 'in'});
  k.push({t: A.press + 0.22, kind: 'screen', p: PRESS_AT});
  k.push({t: A.press + 0.45, kind: 'screen', p: [PRESS_AT[0] - 50, PRESS_AT[1] - 20]});
  k.push({t: A.press + 0.85, kind: 'rest'});
  return k.sort((u, v) => u.t - v.t);
})();

// ─── stage over time (with hops) ────────────────────────────────────────────────────────
const smooth = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
type Body = {st: Stage; arcY: number; crouch: number; air: number; stretch: number; yaw: number};
const bodyAt = (t: number): Body => {
  let from: Stage = STAGES.hook;
  for (const [start, name] of HOPS) {
    const to = STAGES[name];
    if (t < start) return {st: from, arcY: 0, crouch: 0, air: 0, stretch: 0, yaw: 0};
    if (t < start + HOP) {
      const p = (t - start) / HOP;
      const q = smooth(0.25, 0.8, p); // airborne progress
      const e = easeInOut(q);
      const st: Stage = {
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        k: from.k + (to.k - from.k) * e,
        look: from.look + (to.look - from.look) * e,
      };
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const h = Math.min(260, Math.max(110, dist * 0.35));
      const inAir = p > 0.25 && p < 0.8 ? Math.sin(Math.PI * (p - 0.25) / 0.55) : 0;
      const crouch = p < 0.22 ? smooth(0, 0.22, p) : p < 0.3 ? 1 - smooth(0.22, 0.3, p) : p > 0.8 ? 0.8 * Math.sin(Math.PI * (p - 0.8) / 0.2) : 0;
      return {st, arcY: h * inAir, crouch, air: inAir, stretch: inAir, yaw: Math.sign(to.x - from.x) * 0.35 * Math.sin(Math.PI * p)};
    }
    from = to;
  }
  return {st: from, arcY: 0, crouch: 0, air: 0, stretch: 0, yaw: 0};
};

// ─── the pose ─────────────────────────────────────────────────────────────────────────
const resolve = (key: Key, st: Stage): Arm => {
  if (key.kind === 'rest') return REST;
  const p = key.kind === 'screen' ? toModel(st, key.p) : key.p;
  return ik(p, key.ext ?? 0, key.pref);
};
const env = (t: number, a: number, dur: number) => (t < a || t > a + dur ? 0 : Math.min(1, Math.sin(((t - a) / dur) * Math.PI) * 1.6));

export type Prop = {kind: 'stamp' | 'file'; at: V2; angle: number; size: number} | null;
export type Pose = {
  x: number; // feet midpoint on screen, after hop arc / crouch
  y: number;
  k: number;
  sx: number; // squash & stretch (about the feet)
  sy: number;
  look: number;
  spine: {roll: number; yaw: number};
  head: {yaw: number; pitch: number; roll: number};
  armR: {d1: number; d2: number; twist: number};
  armL: {dz: number};
  legs: number; // knee bend (radians)
  tip: V2; // right fingertip on screen
  headAt: V2; // head centre on screen
  prop: Prop;
};

export const veeAt = (t: number): Pose => {
  const b = bodyAt(t);
  const st = b.st;
  // crouch keeps the feet planted: lower the body by the legs' vertical shortening
  const theta = 0.55 * b.crouch + 0.28 * b.air;
  const drop = b.air > 0 ? 0 : LEG * (1 - Math.cos(0.55 * b.crouch));
  const trouble = env(t, A.trouble, 0.8);
  const x = st.x;
  const y = st.y + drop * st.k - b.arcY - 30 * trouble;
  const sy = (1 - 0.1 * b.crouch) * (1 + 0.07 * b.stretch);
  const pose = {...st, y};

  // right arm: IK keyframes (interpolated in angle space), else wave / hop / startle overlays
  let arm = REST;
  let ik = 0;
  const i = KEYS.findIndex((key) => key.t > t);
  const prev = i === -1 ? KEYS[KEYS.length - 1] : KEYS[i - 1];
  const next = i === -1 ? undefined : KEYS[i];
  if (prev && next && !(prev.kind === 'rest' && next.kind === 'rest')) {
    const w = (t - prev.t) / (next.t - prev.t);
    const e = next.ease === 'in' ? w * w : next.ease === 'out' ? 1 - (1 - w) * (1 - w) : easeInOut(w);
    arm = lerpArm(resolve(prev, pose), resolve(next, pose), e);
    ik = prev.kind === 'rest' ? e : next.kind === 'rest' ? 1 - e : 1;
  }
  let d1 = arm.a1 - A1R;
  let d2 = arm.a2 - A2R - d1;
  let twist = 0;
  const wv = env(t, A.wave, 1.35);
  if (wv > 0 && ik === 0) {
    const p = (t - A.wave) / 1.35;
    d1 = 2.35 * wv;
    d2 = (0.55 + 0.38 * Math.sin(p * Math.PI * 2 * 2.2)) * wv;
    twist = 1.3 * wv;
  }
  const startle = Math.max(env(t, HOPS[0][0], 0.6), trouble);
  if (ik === 0) d1 += 0.55 * b.air + 0.6 * startle;

  // left (thumbs-up) arm: pumps; lifts in the air and on a startle
  const pump = A.pumps.reduce((s, a) => Math.max(s, env(t, a, 0.7)), 0);
  const pumpPh = A.pumps.find((a) => t >= a && t <= a + 0.7);
  const dz = -(pump * (0.3 + 0.2 * Math.abs(Math.sin(((t - (pumpPh ?? 0)) / 0.7) * Math.PI * 3)))) - 0.45 * b.air - 0.4 * startle;

  // head & spine (spine stays still while the arm is reaching, so the IK contact is exact)
  const nod = nodAt(t);
  const surprise = surpriseAt(t);
  const shake = trouble * 0.28 * Math.sin((t - A.trouble) * Math.PI * 2 * 3.2);
  const calm = 1 - ik;
  const head = {
    yaw: st.look * 0.22 + 0.07 * Math.sin(t * 0.8) - 0.1 * surprise + shake + 0.5 * b.yaw,
    pitch: 0.1 * nod - 0.14 * surprise + 0.025 * Math.sin(t * 2.1),
    roll: 0.05 * Math.sin(t * 1.3) + 0.04 * nod,
  };
  const spine = {roll: calm * (0.025 * Math.sin(t * 0.9) - 0.03 * surprise), yaw: calm * (0.06 * st.look) + b.yaw};

  const tipM = fk({a1: A1R + d1, a2: A2R + d1 + d2});
  const tip = toScreen(pose, tipM);
  const a2 = A2R + d1 + d2;
  let prop: Prop = null;
  if (t >= HOPS[6][0] && t < HOPS[7][0]) prop = {kind: 'stamp', at: tip, angle: a2, size: st.k};
  if (t >= HOPS[7][0] && t < A.drop) prop = {kind: 'file', at: tip, angle: a2, size: st.k};

  return {
    x,
    y,
    k: st.k,
    sx: 1 / Math.sqrt(sy),
    sy,
    look: st.look,
    spine,
    head,
    armR: {d1, d2, twist},
    armL: {dz},
    legs: theta,
    tip,
    headAt: toScreen(pose, [186, 530]),
    prop,
  };
};

/** Fingertip (screen) at the moment of release — where dealt cards / the thrown file start. */
export const releaseAt = (t: number): V2 => veeAt(t).tip;
/** For IK sanity checks: model-space fingertip for a key's resolved pose. */
export const _ikCheck = () =>
  KEYS.filter((k) => k.kind !== 'rest').map((k) => {
    const pose = veeAt(k.t);
    // body-relative keys are checked against the body as posed (incl. hop crouch), screen keys absolutely
    const want = k.kind === 'screen' ? k.p : toScreen({...bodyAt(k.t).st, y: pose.y}, k.p);
    const ext = k.ext ?? 0;
    const tipM = fk({a1: A1R + pose.armR.d1, a2: A2R + pose.armR.d1 + pose.armR.d2}, ext);
    const got = toScreen({...bodyAt(k.t).st, y: pose.y}, tipM);
    return {t: k.t, kind: k.kind, want, got, err: Math.hypot(got[0] - want[0], got[1] - want[1])};
  });
