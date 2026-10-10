// VEE's face performance on global time: lip-sync, blinks, nods (used by Vee3D.tsx / bubble.ts).
import {random} from 'remotion';
import cues from '../../public/legion5/cues.json';
import {FPS, k} from './theme';

const at = <T,>(arr: T[], f: number, dflt: T) => arr[Math.min(arr.length - 1, Math.max(0, f))] ?? dflt;
export const mouthAt = (t: number) => at(cues.mouth, Math.round(t * FPS), 0); // 0 rest,1 closed,2 small,3 mid,4 wide,5 O
export const loudAt = (t: number) => at(cues.loud, Math.round(t * FPS), 0);

// Seeded blinks every 2.2-3.8 s: half, closed, closed, half.
const BLINKS = (() => {
  const out: number[] = [];
  for (let t = 1.1, i = 0; t < cues.duration; t += 2.2 + random(`blink-${i++}`) * 1.6) out.push(Math.round(t * FPS));
  return out;
})();
const BLINK_SEQ = [1, 2, 2, 1];
/** 0 open, 1 half, 2 closed */
export const blinkAt = (t: number) => {
  const f = Math.round(t * FPS);
  const b = BLINKS.find((s) => f >= s && f < s + BLINK_SEQ.length);
  return b === undefined ? 0 : BLINK_SEQ[f - b];
};

export const decay = (t: number, a: number, tau: number) => (t < a ? 0 : Math.exp(-(t - a) / tau));
export const bump = (t: number, a: number, dur: number) => Math.sin(k(t, a, a + dur, (x) => x) * Math.PI);

// Stressed word onsets drive small, unhurried head nods (louder word -> bigger nod; weak words don't bob).
const ONSETS = cues.words
  .map((w) => ({t: w.startMs / 1000, a: at(cues.loud, Math.round((w.startMs / 1000) * FPS) + 2, 0)}))
  .filter((o) => o.a > 0.55);
export const nodAt = (t: number) =>
  ONSETS.reduce((s, o) => s + o.a * decay(t, o.t, 0.22) * (t >= o.t ? Math.min(1, (t - o.t) / 0.08) : 0), 0);

