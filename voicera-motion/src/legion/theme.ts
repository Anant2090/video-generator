import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadHead} from '@remotion/google-fonts/PlusJakartaSans';
import {Easing, interpolate} from 'remotion';
import cues from '../../public/legion/cues.json';
import {easeInOut, easeOut} from '../brand';

export {easeInOut, easeOut};

// Legion app type: Plus Jakarta Sans headings, JetBrains Mono labels (Legion-Frontend layout.tsx).
export const {fontFamily: HEAD} = loadHead('normal', {weights: ['500', '700', '800'], subsets: ['latin']});
export const {fontFamily: MONO} = loadMono('normal', {weights: ['400', '500', '700'], subsets: ['latin']});

// Legion brand (globals.css + logo) as flat dither-editorial fields.
export const L = {
  blue: '#2563EB',
  navy: '#0F172A',
  ink: '#0A0A0A',
  paper: '#FFFFFF',
  red: '#EF4444',
  green: '#16A34A',
  // Pocketsflow-style card fields, kept inside the Legion palette's temperature
  amber: '#F8B33D',
  pink: '#F3798E',
  teal: '#3CB1B6',
  lilac: '#BC8DEC',
  mint: '#5EEAD4',
};

export const FPS = cues.fps;
export const TOTAL = Math.round(cues.duration * FPS);
export const SC = cues.scenes;
export const MK = cues.marks;
export type Scene = keyof typeof SC;
export const ORDER: Scene[] = ['hook', 'reveal', 'legion', 'build', 'live', 'scores', 'why', 'real', 'cta'];
export const sceneEnd = (s: Scene) => {
  const next = ORDER[ORDER.indexOf(s) + 1];
  return next ? SC[next] : cues.duration;
};
export const sceneAt = (t: number): Scene => [...ORDER].reverse().find((s) => t >= SC[s]) ?? 'hook';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** 0..1 progress of t between a and b (a = Infinity means "never" -> 0). */
export const k = (t: number, a: number, b: number, easing = easeOut) =>
  Number.isFinite(a) ? interpolate(t, [a, b], [0, 1], {...clamp, easing}) : 0;
export const linear = Easing.linear;
