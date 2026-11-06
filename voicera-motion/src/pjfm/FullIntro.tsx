import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, easeInOut, easeOut, fontFamily, GRADIENT, gradientText} from '../brand';
import {Words} from './ScenarioCard';
import vo from './vo.json';
import {FPS} from './theme';

export const FULL_INTRO_SEC = vo.fullIntroSec;
export const FULL_INTRO_FRAMES = Math.round(FULL_INTRO_SEC * FPS);

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeOut});
const easeIO = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeInOut});
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const CHIPS = ['Website chat', 'Inbound call', 'Outbound call'];

export const PjfmFullIntro: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const burst = ease(t, 0, 0.9);
  const lift = easeIO(t, FULL_INTRO_SEC - 2.4, FULL_INTRO_SEC - 1.1);
  const fadeOut = 1 - ease(t, FULL_INTRO_SEC - 0.45, FULL_INTRO_SEC);

  return (
    <AbsoluteFill style={{background: C.bg, fontFamily, color: C.ink, opacity: fadeOut}}>
      <Audio src={staticFile('pjfm/vo-full-intro.wav')} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 800px at 12% 0%, #FFFFFF 0%, rgba(255,255,255,0) 60%),
            radial-gradient(900px 700px at 100% 100%, rgba(100,212,193,0.10), rgba(255,255,255,0) 70%),
            radial-gradient(800px 600px at 85% 10%, rgba(62,205,240,0.08), rgba(255,255,255,0) 70%), ${C.bg}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 540,
          width: 28,
          height: 28,
          marginLeft: -14,
          marginTop: -14,
          borderRadius: '50%',
          background: GRADIENT,
          transform: `scale(${1 + burst * 60})`,
          opacity: (1 - burst) * 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: lerp(250, 48, lift),
          textAlign: 'center',
          transform: `scale(${lerp(1, 0.42, lift)})`,
          transformOrigin: 'center top',
        }}
      >
        <div style={{fontSize: 30, fontWeight: 700, letterSpacing: '0.2em', color: C.tealInk, opacity: ease(t, 0.3, 0.9) * (1 - lift)}}>
          AGENTIC AI · VOICE
        </div>
        <div style={{marginTop: 18}}>
          <Words text="The Glorious Church" local={t - 0.35} size={96} stagger={0.1} />
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: C.sub,
            marginTop: 26,
            opacity: ease(t, 1.3, 1.9) * (1 - lift),
            letterSpacing: '-0.01em',
          }}
        >
          Chat. Inbound. Outbound. One AI that meets every visitor.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            marginTop: 36,
            opacity: ease(t, 2.5, 3.1) * (1 - lift),
          }}
        >
          <span style={{fontSize: 28, fontWeight: 600, color: C.sub}}>Built on</span>
          <Img src={staticFile('logo-light.png')} style={{height: 110}} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginTop: 36,
            opacity: ease(t, 3.4, 4.0) * (1 - lift),
          }}
        >
          {CHIPS.map((label) => (
            <div
              key={label}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: `1px solid ${C.cyan}55`,
                background: 'rgba(255,255,255,0.72)',
                fontSize: 20,
                fontWeight: 600,
                color: C.ink,
              }}
            >
              <span style={gradientText}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
