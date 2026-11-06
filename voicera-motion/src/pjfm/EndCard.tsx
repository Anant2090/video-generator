import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, fontFamily} from '../brand';
import vo from './vo.json';
import {clamp, FPS} from './theme';

export const END_SEC = vo.endSec;
export const END_FRAMES = Math.round(END_SEC * FPS);

export const PjfmEnd: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const inK = interpolate(t, [0, 0.4], [0, 1], clamp);
  const y = interpolate(t, [0, 0.45], [14, 0], clamp);
  const out = interpolate(t, [END_SEC - 0.45, END_SEC], [1, 0], clamp);

  return (
    <AbsoluteFill style={{background: '#05070d', fontFamily, color: '#fff'}}>
      <Audio src={staticFile('pjfm/vo-end.wav')} />
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          left: '50%',
          top: '42%',
          transform: 'translate(-50%, -50%)',
          borderRadius: 400,
          background: 'radial-gradient(circle, rgba(62,205,240,0.14) 0%, rgba(5,7,13,0) 70%)',
        }}
      />
      <AbsoluteFill
        style={{
          opacity: inK * out,
          transform: `translateY(${y}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
          padding: 80,
        }}
      >
        <div style={{fontSize: 13, fontWeight: 800, letterSpacing: '0.22em', color: C.cyan}}>VOICERA × THE GLORIOUS CHURCH</div>
        <div
          style={{
            marginTop: 22,
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            maxWidth: 1100,
          }}
        >
          Questions answered.
          <br />
          Next steps made simple.
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 22,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.78)',
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          Baptism registration received. The church team will follow up.
        </div>
        <div
          style={{
            marginTop: 28,
            width: 72,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${C.cyan}, ${C.teal})`,
          }}
        />
      </AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 120px rgba(0,0,0,0.35)'}} />
    </AbsoluteFill>
  );
};
