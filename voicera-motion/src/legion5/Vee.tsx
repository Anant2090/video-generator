import React from 'react';
import {useCurrentFrame} from 'remotion';
import cues from '../../public/legion5/cues.json';
import {type Bubble, bubbleAt, bubblePose, veeShown, waveAt} from './bubble';
import {bayerMask, Rings, SpeechBubble} from './kit';
import {loudAt} from './performance';
import {FPS, k, L} from './theme';
import {Vee3DLayer} from './Vee3D';

// v5.1: VEE only at the bookends (reveal -> card burst, end card), as a talking bust in a round bubble,
// with voice rings and its two speech bubbles ("Hi!", "Your turn!"). Nothing is drawn in between.

const BUBBLES = cues.actions.bubbles as unknown as [number, number, string][];

/** The round bubble with VEE's 3D bust inside (clipped to the circle). Sized by geometry only (`d`), so the
 *  dithered render is never resampled; the dot pattern is anchored to the bubble centre. */
const VeeBubble: React.FC<{t: number; b: Bubble}> = ({t, b}) => {
  const r = b.d / 2;
  const ring = Math.max(5, Math.round(b.d * 0.022));
  const pose = bubblePose(t, b);
  const anchor: [number, number] = [b.cx, b.cy];
  // while waving, the arm breaks out of the bubble: redraw VEE clipped to the arm's region outside
  // the circle (model x 290..470, y 360..660 in the bubble framing), above the ring
  const km = b.d / 310;
  const mx = (x: number) => b.cx + (x - 186) * km;
  const my = (y: number) => b.cy - (y - 485) * km;
  const outside = `radial-gradient(circle at ${b.cx}px ${b.cy}px, transparent ${r}px, black ${r + 1}px)`;
  // only once the elbow is up at shoulder height; it dissolves in/out in Bayer dots (no half-transparent ghost)
  const breakOut = k(waveAt(t).on, 0.55, 0.75);
  const dots = bayerMask(Math.round(breakOut * 64), 6);
  return (
    <>
      <div style={{position: 'absolute', left: b.cx - r, top: b.cy - r, width: b.d, height: b.d, borderRadius: '50%', background: L.mint, boxShadow: `${Math.round(ring * 1.6)}px ${Math.round(ring * 1.6)}px 0 ${L.ink}`}} />
      <div style={{position: 'absolute', inset: 0, clipPath: `circle(${r - ring / 2}px at ${b.cx}px ${b.cy}px)`}}>
        <Vee3DLayer t={t} pose={pose} cell={3} anchor={anchor} />
      </div>
      <div style={{position: 'absolute', left: b.cx - r, top: b.cy - r, width: b.d, height: b.d, borderRadius: '50%', border: `${ring}px solid ${L.ink}`, boxSizing: 'border-box'}} />
      {breakOut > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(${mx(290)}px ${my(660)}px, ${mx(470)}px ${my(660)}px, ${mx(470)}px ${my(360)}px, ${mx(290)}px ${my(360)}px)`,
            WebkitMaskImage: outside,
            maskImage: outside,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              ...(breakOut < 1
                ? {WebkitMaskImage: dots, maskImage: dots, WebkitMaskSize: '48px 48px', maskSize: '48px 48px', WebkitMaskPosition: `${b.cx}px ${b.cy}px`, maskPosition: `${b.cx}px ${b.cy}px`}
                : {}),
            }}
          >
            <Vee3DLayer t={t} pose={pose} cell={3} anchor={anchor} />
          </div>
        </div>
      ) : null}
    </>
  );
};

export const Presenter: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const at = bubbleAt(t);
  const b = {...at, d: 2 * Math.round((at.d * veeShown(t)) / 2)}; // entrances/exit change the real size
  if (b.d < 24) return null;
  const big = k(b.d, 420, 540); // voice rings only on the big hero/end-card bubble (the small one sits by the cards)
  return (
    <>
      <VeeBubble t={t} b={b} />
      {big > 0 ? (
        <div style={{opacity: Math.min(1, loudAt(t) * 1.6) * big}}>
          <Rings t={t} x={b.cx + b.d / 2 + 4} y={b.cy - b.d * 0.06} size={b.d * 0.36} />
        </div>
      ) : null}
      {BUBBLES.map(([at, dur, text]) => (
        <SpeechBubble key={at} t={t} at={at} dur={dur} x={b.cx - 20} y={b.cy - b.d / 2 - 4} text={text} />
      ))}
    </>
  );
};
