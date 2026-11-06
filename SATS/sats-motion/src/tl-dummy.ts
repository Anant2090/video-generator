import {interpolate} from 'remotion';
import {clamp, easeInOut, easeOut} from './brand';
import LINES from './data/lines.dummy.json';
import TL from './data/timeline.dummy.json';

export const FPS = TL.fps;
export const TOTAL_FRAMES = TL.frames;
export const TOTAL = TL.total;

type Word = {w: string; s: number; e: number};
type Line = {who: string; text: string; show: string; dur: number; words: Word[]};
const lines = LINES as Record<string, Line>;
const placed = TL.lines as Record<string, {at: number; end: number; who: string}>;

export type DummySceneName = 'title' | 'dashboard' | 'workflow' | 'shipment' | 'end';
export const scene = (n: DummySceneName) => TL.scenes.find((s) => s.name === n)!;
export const line = (k: string) => ({...placed[k], ...lines[k]});

export const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeOut});
export const easeIO = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeInOut});
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
