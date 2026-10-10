import React from 'react';
import {useCurrentFrame} from 'remotion';
import cues from '../../public/legion/cues.json';
import {type Bubble, bubbleAt, bubbleFrom, bubblePose, waveAt} from './bubble';
import {DROP_AT, DROP_FLIGHT, PRESS_AT, STAMP_AT, STAMP_LEN, TAPS} from './choreo';
import {FileCard, pop, Rings, SpeechBubble, StampTool} from './kit';
import {loudAt, SURPRISE} from './performance';
import {FPS, HEAD, k, L} from './theme';
import {Vee3DLayer} from './Vee3D';

// VEE, always on screen as a talking bust in a round bubble that hops to a new place each scene
// (bubble.ts), plus what rides on it: speech bubbles, voice rings, the "!", and the things that fly
// out of it (the FAIL stamp, the call file) and the click ripples on the UI.

const A = cues.actions;
const BUBBLES = A.bubbles as unknown as [number, number, string][];

const Alarm: React.FC<{t: number; x: number; y: number; size: number}> = ({t, x, y, size}) => {
  const a = SURPRISE.reduce((s, at) => Math.max(s, t >= at - 0.05 && t < at + 0.9 ? pop(t, at - 0.05, 220, 10) : 0), 0);
  if (a <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: L.red,
        border: `${size * 0.055}px solid ${L.ink}`,
        color: L.paper,
        fontFamily: HEAD,
        fontWeight: 800,
        fontSize: size * 0.65,
        lineHeight: `${size * 0.89}px`,
        textAlign: 'center',
        transform: `scale(${a})`,
      }}
    >
      !
    </div>
  );
};

/** Expanding click ring where the UI gets "clicked" (build taps, the CTA button). */
const Ripple: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  if (t < at || t > at + 0.4) return null;
  const p = k(t, at, at + 0.4);
  const r = 14 + 46 * p;
  return <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', border: `${5 * (1 - p) + 1}px solid ${L.blue}`, opacity: 1 - p}} />;
};

/** The round bubble with VEE's 3D bust inside (clipped to the circle). */
const VeeBubble: React.FC<{t: number; b: Bubble; enter: number}> = ({t, b, enter}) => {
  const r = b.d / 2;
  const ring = Math.max(5, b.d * 0.022);
  const pose = bubblePose(t, b);
  const cell = b.d >= 450 ? 3 : 2;
  // while waving, the arm breaks out of the bubble: redraw VEE clipped to the arm's region outside
  // the circle (model x 290..470, y 360..660 in the bubble framing), above the ring
  const km = b.d / 310;
  const mx = (x: number) => b.cx + (x - 186) * km;
  const my = (y: number) => b.cy - (y - 485) * km;
  const outside = `radial-gradient(circle at ${b.cx}px ${b.cy}px, transparent ${r}px, black ${r + 1}px)`;
  // only once the elbow is up at shoulder height (quick fade), so the rising/lowering arm is never sliced
  const breakOut = k(waveAt(t).on, 0.55, 0.75);
  return (
    <div style={{position: 'absolute', inset: 0, transformOrigin: `${b.cx}px ${b.cy}px`, transform: `scale(${b.sx * enter}, ${b.sy * enter})`}}>
      <div style={{position: 'absolute', left: b.cx - r, top: b.cy - r, width: b.d, height: b.d, borderRadius: '50%', background: L.mint, boxShadow: `${ring * 1.6}px ${ring * 1.6}px 0 ${L.ink}`}} />
      <div style={{position: 'absolute', inset: 0, clipPath: `circle(${r - ring / 2}px at ${b.cx}px ${b.cy}px)`}}>
        <Vee3DLayer t={t} pose={pose} cell={cell} />
      </div>
      <div style={{position: 'absolute', left: b.cx - r, top: b.cy - r, width: b.d, height: b.d, borderRadius: '50%', border: `${ring}px solid ${L.ink}`, boxSizing: 'border-box'}} />
      {breakOut > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: breakOut,
            clipPath: `polygon(${mx(290)}px ${my(660)}px, ${mx(470)}px ${my(660)}px, ${mx(470)}px ${my(360)}px, ${mx(290)}px ${my(360)}px)`,
            WebkitMaskImage: outside,
            maskImage: outside,
          }}
        >
          <Vee3DLayer t={t} pose={pose} cell={cell} />
        </div>
      ) : null}
    </div>
  );
};

// the FAIL stamp flies out of the bubble, hovers over the bad reply, slams down, lifts off
const STAMP_K = 2.6; // big enough to read as a rubber stamp at full-frame scale
const STAMP_PX = STAMP_LEN * STAMP_K;
const STAMP_LAUNCH = A.stamp - 0.4;
const STAMP_FROM = bubbleFrom(STAMP_LAUNCH);
const stampAt = (t: number): [number, number] | null => {
  const knob: [number, number] = [STAMP_AT[0], STAMP_AT[1] - STAMP_PX]; // rubber face on the target
  const hover: [number, number] = [knob[0], knob[1] - 130];
  if (t < STAMP_LAUNCH || t > A.stamp + 0.55) return null;
  if (t < A.stamp - 0.08) {
    const p = k(t, STAMP_LAUNCH, A.stamp - 0.08);
    return [STAMP_FROM[0] + (hover[0] - STAMP_FROM[0]) * p, STAMP_FROM[1] + (hover[1] - STAMP_FROM[1]) * p - 120 * Math.sin(Math.PI * p)];
  }
  if (t < A.stamp) return [knob[0], hover[1] + (knob[1] - hover[1]) * k(t, A.stamp - 0.08, A.stamp) ** 2];
  if (t < A.stamp + 0.12) return knob;
  return [knob[0], knob[1] - 130 * k(t, A.stamp + 0.12, A.stamp + 0.45)];
};
const DROP_FROM = bubbleFrom(A.drop);

export const Presenter: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const b = bubbleAt(t);
  const enter = pop(t, 0.15, 150, 13); // pops in at the start
  const talk = loudAt(t);
  const top = b.cy - (b.d / 2) * b.sy;
  const stamp = stampAt(t);
  const fly = t >= A.drop && t < A.drop + DROP_FLIGHT ? (t - A.drop) / DROP_FLIGHT : -1;
  return (
    <>
      {TAPS.map(({t: at, at: p}) => (
        <Ripple key={at} t={t} at={at} x={p[0]} y={p[1]} />
      ))}
      <Ripple t={t} at={A.press} x={PRESS_AT[0]} y={PRESS_AT[1]} />
      <VeeBubble t={t} b={b} enter={enter} />
      {stamp ? (
        <div style={{opacity: 1 - k(t, A.stamp + 0.4, A.stamp + 0.55)}}>
          <StampTool at={stamp} angle={-Math.PI / 2} k={STAMP_K} len={STAMP_LEN} />
        </div>
      ) : null}
      {fly >= 0 ? (
        <FileCard
          x={DROP_FROM[0] + (DROP_AT[0] - DROP_FROM[0]) * fly}
          y={DROP_FROM[1] + (DROP_AT[1] - DROP_FROM[1]) * fly - 140 * Math.sin(Math.PI * fly)}
          rot={-6 + 380 * fly}
          scale={0.5 + 0.4 * Math.sin(Math.PI * fly)}
          opacity={1 - k(t, A.drop + DROP_FLIGHT - 0.06, A.drop + DROP_FLIGHT)}
        />
      ) : null}
      <div style={{opacity: Math.min(1, talk * 1.6) * enter}}>
        <Rings t={t} x={b.cx + (b.d / 2) * b.sx + 4} y={b.cy - b.d * 0.06} size={b.d * 0.36} />
      </div>
      <Alarm t={t} x={b.cx + b.d * 0.36} y={b.cy - b.d * 0.36} size={Math.max(64, b.d * 0.24)} />
      {BUBBLES.map(([at, dur, text]) => (
        <SpeechBubble key={at} t={t} at={at} dur={dur} x={b.cx - 20} y={top - 4} text={text} />
      ))}
    </>
  );
};

/** Horizontal band for the captions: full width, or the wider side next to the bubble if it sits low. */
export const captionBand = (t: number): [number, number] => {
  const b = bubbleAt(t);
  if (b.cy + b.d / 2 < 960) return [40, 1880];
  const left: [number, number] = [40, Math.max(40, b.cx - b.d / 2 - 24)];
  const right: [number, number] = [Math.min(1880, b.cx + b.d / 2 + 24), 1880];
  return left[1] - left[0] > right[1] - right[0] ? left : right;
};
