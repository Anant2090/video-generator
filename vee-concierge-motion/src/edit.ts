// Output timeline = hook + keep-segments of the source + tail hold.
// Everything else is authored in SOURCE seconds and mapped through here.
import edit from './edit.json';

export const FPS = edit.fps;
export const HOOK = edit.hookFrames;
export const SEGMENTS = edit.segments as [number, number][]; // source frames [from, to)
const BODY = SEGMENTS.reduce((n, [a, b]) => n + b - a, 0);
export const TOTAL_FRAMES = HOOK + BODY + edit.tailFrames;
export const SRC_END = SEGMENTS[SEGMENTS.length - 1][1];

// Output frame where each segment starts.
export const SEG_OUT: number[] = [];
SEGMENTS.reduce((at, [a, b]) => (SEG_OUT.push(at), at + b - a), HOOK);

// Output frame -> source seconds. Before the body it runs up to the first kept
// frame; after it, it keeps counting so the tail hold has a timeline.
export const outToSrc = (f: number): number => {
  if (f < HOOK) return (SEGMENTS[0][0] - (HOOK - f)) / FPS;
  for (let i = SEGMENTS.length - 1; i >= 0; i--) {
    if (f >= SEG_OUT[i]) return (SEGMENTS[i][0] + f - SEG_OUT[i]) / FPS;
  }
  return 0;
};

// Source seconds -> output frame (a time inside a removed pause snaps to the cut).
export const srcToOut = (s: number): number => {
  const sf = s * FPS;
  for (let i = 0; i < SEGMENTS.length; i++) {
    const [a, b] = SEGMENTS[i];
    if (sf < a) return SEG_OUT[i];
    if (sf < b || i === SEGMENTS.length - 1) return SEG_OUT[i] + (sf - a);
  }
  return TOTAL_FRAMES;
};
