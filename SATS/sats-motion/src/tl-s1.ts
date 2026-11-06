import {interpolate} from 'remotion';
import {clamp, easeInOut, easeOut} from './brand';
import LINES from './data/lines.json';
import TL from './data/timeline.scenario1.json';

export const FPS = TL.fps;
export const TOTAL_FRAMES = TL.frames;
export const TOTAL = TL.total;

type Word = {w: string; s: number; e: number};
type Line = {who: string; text: string; show: string; dur: number; words: Word[]};
const lines = LINES as Record<string, Line>;
const placed = TL.lines as Record<string, {at: number; end: number; who: string}>;

export type S1Scene = 'scenario1';
export const scene = (n: S1Scene) => TL.scenes.find((s) => s.name === n)!;
export const mark = (n: keyof typeof TL.marks) => TL.marks[n];
export const line = (k: string) => ({...placed[k], ...lines[k]});

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');

export const shownWords = (k: string) => {
  const l = line(k);
  const show = l.show.split(' ');
  const n = l.words.length;
  return show.map((w, i) => ({w, t: l.at + l.words[Math.min(n - 1, Math.floor((i * n) / show.length))].s}));
};

export const isSpeaking = (k: string, t: number) => {
  const l = line(k);
  return l.words.some((w) => t >= l.at + w.s && t <= l.at + w.e + 0.05);
};

export const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeOut});
export const easeIO = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeInOut});
