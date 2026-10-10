import React from 'react';
import {useCurrentFrame} from 'remotion';
import cues from '../../public/legion5/cues.json';
import {type Bubble, bubbleAt, bubblePose, veeShown, waveAt} from './bubble';
import {Rings, SpeechBubble} from './kit';
import {loudAt} from './performance';
import {FPS, k, L} from './theme';
import {Vee3DLayer} from './Vee3D';

// v5: VEE only at the bookends (reveal -> card burst, end card), as a talking bust in a round bubble,
// with voice rings and its two speech bubbles ("Hi!", "Your turn!"). Nothing is drawn in between.

const BUBBLES = cues.actions.bubbles as unknown as [number, number, string][];

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

export const Presenter: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const shown = veeShown(t);
  if (shown <= 0.001) return null;
  const b = bubbleAt(t);
  const top = b.cy - (b.d / 2) * b.sy;
  return (
    <>
      <VeeBubble t={t} b={b} enter={shown} />
      <div style={{opacity: Math.min(1, loudAt(t) * 1.6) * Math.min(1, shown)}}>
        <Rings t={t} x={b.cx + (b.d / 2) * b.sx + 4} y={b.cy - b.d * 0.06} size={b.d * 0.36} />
      </div>
      {BUBBLES.map(([at, dur, text]) => (
        <SpeechBubble key={at} t={t} at={at} dur={dur} x={b.cx - 20} y={top - 4} text={text} />
      ))}
    </>
  );
};
