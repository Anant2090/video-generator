import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, fontFamily, GRADIENT} from '../brand';
import vo from './vo.json';
import {clamp, FPS} from './theme';

export const FULL_END_SEC = vo.fullEndSec;
export const FULL_END_FRAMES = Math.round(FULL_END_SEC * FPS);

export const PjfmFullEnd: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const inK = interpolate(t, [0, 0.45], [0, 1], clamp);
  const y = interpolate(t, [0, 0.5], [16, 0], clamp);
  const out = interpolate(t, [FULL_END_SEC - 0.5, FULL_END_SEC], [1, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 800px at 12% 0%, #FFFFFF 0%, rgba(255,255,255,0) 60%),
          radial-gradient(900px 700px at 100% 100%, rgba(100,212,193,0.12), rgba(255,255,255,0) 70%), ${C.bg}`,
        fontFamily,
        color: C.ink,
      }}
    >
      <Audio src={staticFile('pjfm/vo-full-end.wav')} />
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
        <div style={{fontSize: 13, fontWeight: 800, letterSpacing: '0.22em', color: C.tealInk}}>VOICERA × THE GLORIOUS CHURCH</div>
        <div
          style={{
            marginTop: 22,
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            maxWidth: 1200,
          }}
        >
          Questions answered.
          <br />
          Calls answered.
          <br />
          Outreach done.
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 22,
            fontWeight: 500,
            color: C.sub,
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          Voicera × The Glorious Church — chat, inbound, outbound.
        </div>
        <div style={{marginTop: 28, width: 72, height: 3, borderRadius: 2, background: GRADIENT}} />
        <Img src={staticFile('logo-light.png')} style={{height: 72, marginTop: 28}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
