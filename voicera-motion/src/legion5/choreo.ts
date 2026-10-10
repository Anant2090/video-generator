// v5 layout constants shared by the scenes, the click ripples and the bubble VEE (bookends only; the
// v3 IK engine lives on in src/legion/choreo.ts). Screen = 1920x1080 px.
import cues from '../../public/legion5/cues.json';
import J from '../../public/legion/vee3d/joints.json';
import {camAt, type Cam, toStage} from './kit';
import {SC} from './theme';

const A = cues.actions;
type V2 = [number, number];

// rest angles of the right (open-hand) arm in the model plane; the wave (bubble.ts) is built on them
const [S_R, E_R, T_R] = [J.upperarm_r, J.forearm_r, J.hand_r_end];
const A1R = Math.atan2(E_R[1] - S_R[1], E_R[0] - S_R[0]);
export const ARM_REST = {a1: A1R, a2: Math.atan2(T_R[1] - E_R[1], T_R[0] - E_R[0])};

// Build: window centred; wide for the two chip taps, then the camera zooms onto the rule
export const WB = {x: 190, y: 72, w: 1540, h: 866};
const zoomAt = (A.taps[1] + A.taps[2]) / 2 - SC.build;
export const BUILD_CAM: [number, Cam][] = [
  [0, {cx: 1100, cy: 575, w: 1560}],
  [zoomAt - 0.2, {cx: 1100, cy: 575, w: 1560}],
  [zoomAt + 0.15, {cx: 850, cy: 390, w: 1040}],
];
const TAP_UI: V2[] = [
  [378, 390], // "Anxious" chip
  [378, 750], // "Prompt injection" chip
  [430, 364], // rule selector
  [425, 455], // "AI judge check" option
];
export const TAPS = A.taps.map((t, i) => {
  const s = toStage(WB, camAt(t - SC.build, BUILD_CAM), TAP_UI[i][0], TAP_UI[i][1]);
  return {t, at: [s.x, s.y] as V2};
});
export const RUN_BTN = {x: 440, top: 760, r: 62}; // big RUN button on a stand, left of the live window
export const STAMP_LEN = 55; // stamp prop length (model units, x STAMP_K on screen)

// card grid (Legion scene)
export const CARD = {w: 218, h: 300, x0: 452, y0: 190, gx: 22, gy: 24};
export const cardXY = (i: number) => ({x: CARD.x0 + (i % 6) * (CARD.w + CARD.gx), y: CARD.y0 + Math.floor(i / 6) * (CARD.h + CARD.gy)});
export const STAT = (i: number) => ({x: 1290, y: 120 + i * 214, w: 580, h: 188});

export type Pose = {
  x: number; // feet midpoint on screen
  y: number;
  k: number; // screen px per model unit
  sx: number; // squash & stretch (about the feet)
  sy: number;
  spine: {roll: number; yaw: number};
  head: {yaw: number; pitch: number; roll: number};
  armR: {d1: number; d2: number; twist: number};
  armL: {dz: number};
  legs: number; // knee bend (radians)
};
