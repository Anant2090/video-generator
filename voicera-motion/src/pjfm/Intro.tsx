import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, fontFamily} from '../brand';
import vo from './vo.json';
import {clamp, FPS} from './theme';

export const INTRO_SEC = vo.introSec;
export const INTRO_FRAMES = Math.round(INTRO_SEC * FPS);

const CHIPS = ['Service Times', 'Find Us', 'English Services', 'Contact', 'Baptism Registration'];

const fadeUp = (t: number, at: number, dur = 0.45) => {
  const o = interpolate(t, [at, at + dur], [0, 1], clamp);
  const y = interpolate(t, [at, at + dur], [18, 0], clamp);
  return {opacity: o, transform: `translateY(${y}px)`};
};

export const PjfmIntro: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const out = interpolate(t, [INTRO_SEC - 0.65, INTRO_SEC], [1, 0], clamp);
  const chip0 = Math.max(3.2, INTRO_SEC * 0.42);

  return (
    <AbsoluteFill style={{background: '#05070d', fontFamily, color: '#fff'}}>
      <Audio src={staticFile('pjfm/vo-intro.wav')} />
      <div
        style={{
          position: 'absolute',
          width: 920,
          height: 920,
          left: -280,
          top: -360,
          borderRadius: 460,
          background: 'radial-gradient(circle, rgba(62,205,240,0.22) 0%, rgba(5,7,13,0) 68%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 720,
          height: 720,
          right: -200,
          bottom: -280,
          borderRadius: 360,
          background: 'radial-gradient(circle, rgba(100,212,193,0.16) 0%, rgba(5,7,13,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(5,7,13,0.2) 0%, rgba(5,7,13,0.55) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 160,
          right: 160,
          top: 210,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: out,
        }}
      >
        <div
          style={{
            ...fadeUp(t, 0.12),
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.22em',
            color: C.cyan,
          }}
        >
          POWERED BY VOICERA
        </div>
        <div
          style={{
            ...fadeUp(t, 0.4),
            marginTop: 22,
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: '-0.045em',
            lineHeight: 1.1,
            maxWidth: 1280,
          }}
        >
          Every question answered.
          <br />
          Every connection made.
        </div>
        <div
          style={{
            ...fadeUp(t, 1.05),
            marginTop: 24,
            fontSize: 23,
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'rgba(255,255,255,0.82)',
            maxWidth: 1040,
          }}
        >
          Meet the AI assistant for The Glorious Church — helping visitors find service times, locate the Miracle Dome,
          explore English services, get in touch, and register for baptism, all through a simple conversation.
        </div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32, justifyContent: 'center'}}>
          {CHIPS.map((label, i) => {
            const st = fadeUp(t, chip0 + i * 0.32, 0.38);
            return (
              <div
                key={label}
                style={{
                  ...st,
                  padding: '9px 18px',
                  borderRadius: 999,
                  border: `1px solid ${C.cyan}55`,
                  background: 'rgba(62,205,240,0.12)',
                  color: '#e7fbff',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
