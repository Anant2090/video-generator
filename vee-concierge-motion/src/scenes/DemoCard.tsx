import React from 'react';
import {AbsoluteFill, interpolate, spring} from 'remotion';
import {C, clamp, easeInOut, easeOut, glass, gradientText} from '../brand';
import {Backdrop} from '../components/Backdrop';
import {DEMO, DEMO_AT} from '../cues';
import {FPS, srcToOut, TOTAL_FRAMES} from '../edit';
import {useTime} from '../time';
import {Orbit, ORBIT} from './Hook';

const START = Math.round(srcToOut(DEMO_AT));
const NOTES = [0.45, 0.62, 0.79]; // sonic logo V-E-E hits (scripts/sonic.py), seconds into the card

export const DemoCard: React.FC = () => {
  const {f} = useTime();
  if (f < START) return null;
  const l = f - START;
  const s = l / FPS;
  const k = interpolate(l, [0, 18], [0, 1], {...clamp, easing: easeInOut});
  const end = interpolate(f, [TOTAL_FRAMES - 14, TOTAL_FRAMES - 2], [1, 0], {...clamp, easing: easeInOut}); // converge on the hook's first frame
  const rise = (at: number) => interpolate(s, [at, at + 0.6], [0, 1], {...clamp, easing: easeOut});
  const wipe = interpolate(s, [0.45, 1.25], [0, 100], {...clamp, easing: easeInOut});
  const btn = spring({frame: l - Math.round(1.3 * FPS), fps: FPS, config: {damping: 200}, durationInFrames: 24});
  const push = 1 + 0.03 * (l / Math.max(1, TOTAL_FRAMES - START));
  const pulse = 1 + NOTES.reduce((p, at, i) => p + (s >= at ? (0.1 + 0.05 * i) * Math.exp(-(s - at) * 7) : 0), 0);
  const ripple = interpolate(s, [NOTES[2], NOTES[2] + 1.2], [0, 1], clamp);
  return (
    <AbsoluteFill style={{opacity: k}}>
      <Backdrop />
      {ripple > 0 && ripple < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: ORBIT.x - ORBIT.size / 2,
            top: ORBIT.y - ORBIT.size / 2,
            width: ORBIT.size,
            height: ORBIT.size,
            borderRadius: '50%',
            border: `2px solid ${C.cyan}`,
            opacity: 0.7 * (1 - ripple),
            transform: `scale(${1 + 1.6 * easeOut(ripple)})`,
          }}
        />
      ) : null}
      <Orbit opacity={rise(0.15)} scale={pulse} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', opacity: end, transform: `scale(${push})`}}>
        <div
          style={{
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: '-0.045em',
            lineHeight: 1.1,
            paddingBottom: 8,
            ...gradientText,
            clipPath: `inset(0 ${100 - wipe}% 0 0)`,
          }}
        >
          {DEMO.title}
        </div>
        <div style={{fontSize: 42, fontWeight: 500, color: C.sub, marginTop: 10, opacity: rise(0.9), transform: `translateY(${(1 - rise(0.9)) * 16}px)`}}>
          {DEMO.line}
        </div>
        <div
          style={{
            ...glass,
            marginTop: 64,
            padding: '22px 46px',
            borderRadius: 999,
            fontSize: 46,
            fontWeight: 600,
            color: C.ink,
            border: `2px solid ${C.cyan}66`,
            boxShadow: `0 24px 60px -24px ${C.cyan}AA`,
            opacity: btn,
            transform: `translateY(${(1 - btn) * 24}px) scale(${0.94 + 0.06 * btn})`,
          }}
        >
          {DEMO.cta} →
        </div>
        <div style={{fontSize: 38, fontWeight: 600, marginTop: 30, letterSpacing: '-0.01em', opacity: rise(1.7)}}>{DEMO.url}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
