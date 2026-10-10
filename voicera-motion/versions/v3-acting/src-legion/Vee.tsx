import React from 'react';
import {getInputProps, useCurrentFrame} from 'remotion';
import cues from '../../public/legion/cues.json';
import {DROP_AT, DROP_FLIGHT, releaseAt, STAMP_LEN, toScreen, veeAt} from './choreo';
import {FileCard, pop, Rings, SpeechBubble, StampTool} from './kit';
import {loudAt, SURPRISE} from './performance';
import {FPS, HEAD, k, L} from './theme';
import {Vee3DLayer} from './Vee3D';

// VEE, always on screen: the 3D character placed and posed by choreo.veeAt(t), plus everything that
// rides on it — props in its hand, the thrown call file, speech bubbles, voice rings and the "!".

const A = cues.actions;
const BUBBLES = A.bubbles as unknown as [number, number, string][];
const DROP_FROM = releaseAt(A.drop);

const Alarm: React.FC<{t: number; x: number; y: number; size: number}> = ({t, x, y, size}) => {
  const a = SURPRISE.reduce((s, at) => Math.max(s, t >= at - 0.05 && t < at + 0.9 ? pop(t, at - 0.05, 220, 10) : 0), 0);
  if (a <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
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

export const Presenter: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const v = veeAt(t);
  const enter = pop(t, 0.15, 150, 13); // rises in from below at the start
  const pose = {...v, y: v.y + (1 - enter) * 620};
  const st = {x: pose.x, y: pose.y, k: pose.k, look: pose.look};
  const ring = toScreen(st, [281, 530]); // right headset cup
  const alarm = toScreen(st, [231, 660]);
  const headTop = toScreen(st, [186, 648]);
  const talk = loudAt(t);

  // the thrown call file: release point -> into the import window
  const fly = t >= A.drop && t < A.drop + DROP_FLIGHT ? (t - A.drop) / DROP_FLIGHT : -1;
  return (
    <>
      <Vee3DLayer t={t} pose={pose} />
      {pose.prop?.kind === 'stamp' ? <StampTool at={pose.tip} angle={pose.prop.angle} k={pose.k} len={STAMP_LEN} /> : null}
      {pose.prop?.kind === 'file' ? <FileCard x={pose.tip[0]} y={pose.tip[1] + 20} rot={-6} scale={0.9} /> : null}
      {fly >= 0 ? (
        <FileCard
          x={DROP_FROM[0] + (DROP_AT[0] - DROP_FROM[0]) * fly}
          y={DROP_FROM[1] + (DROP_AT[1] - DROP_FROM[1]) * fly - 140 * Math.sin(Math.PI * fly)}
          rot={-6 + 380 * fly}
          scale={0.9 - 0.45 * fly}
          opacity={1 - k(t, A.drop + DROP_FLIGHT - 0.06, A.drop + DROP_FLIGHT)}
        />
      ) : null}
      <div style={{opacity: Math.min(1, talk * 1.6)}}>
        <Rings t={t} x={ring[0] + 10 * pose.k / 2.25} y={ring[1]} size={220 * pose.k / 2.25} />
      </div>
      <Alarm t={t} x={alarm[0]} y={alarm[1]} size={110 * Math.max(0.6, pose.k / 2.25)} />
      {getInputProps().debug ? ( // --props='{"debug":true}': predicted fingertip vs the 3D hand
        <div style={{position: 'absolute', left: pose.tip[0] - 6, top: pose.tip[1] - 6, width: 12, height: 12, borderRadius: 6, background: '#ff00ff'}} />
      ) : null}
      {BUBBLES.map(([at, dur, text]) => (
        <SpeechBubble key={at} t={t} at={at} dur={dur} x={headTop[0] - 30} y={headTop[1]} text={text} />
      ))}
    </>
  );
};

/** Horizontal band free of VEE for the captions: the wider side of the screen next to VEE's body. */
export const captionBand = (t: number): [number, number] => {
  const v = veeAt(t);
  const x0 = v.x + (20 - 186) * v.k;
  const x1 = v.x + (329 - 186) * v.k;
  const left: [number, number] = [40, Math.max(40, x0 - 24)];
  const right: [number, number] = [Math.min(1880, x1 + 24), 1880];
  return left[1] - left[0] > right[1] - right[0] ? left : right;
};
