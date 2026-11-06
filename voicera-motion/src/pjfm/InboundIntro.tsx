import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, easeInOut, easeOut, fontFamily, GRADIENT, gradientText} from '../brand';
import {Phone} from './Phone';
import vo from './vo.json';
import {FPS} from './theme';

export const INBOUND_INTRO_SEC = vo.inboundIntroSec;
export const INBOUND_INTRO_FRAMES = Math.round(INBOUND_INTRO_SEC * FPS);

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeOut});
const easeIO = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeInOut});
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const Words: React.FC<{text: string; local: number; size: number; stagger?: number}> = ({text, local, size, stagger = 0.12}) => {
  let on = false;
  const words = text.split(' ').map((w) => {
    if (w.startsWith('*')) on = true;
    const accent = on;
    if (/\*[.,!?:]?$/.test(w)) on = false;
    return {w: w.replace(/\*/g, ''), accent};
  });
  return (
    <span style={{fontSize: size}}>
      {words.map(({w, accent}, i) => {
        const p = interpolate(local, [i * stagger, 0.45 + i * stagger], [0, 1], {...clamp, easing: easeOut});
        return (
          <React.Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span
              style={{
                display: 'inline-block',
                opacity: p,
                filter: `blur(${(1 - p) * 10}px)`,
                transform: `translateY(${(1 - p) * 20}px)`,
                ...(accent ? gradientText : null),
              }}
            >
              {w}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
};

export const PjfmInboundIntro: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const burst = ease(t, 0, 0.9);
  const lift = easeIO(t, 7.4, 8.6);
  const phoneK = ease(t, 8.2, 9.0);
  const ringK = ease(t, 8.6, 8.9);
  const fadeOut = 1 - ease(t, INBOUND_INTRO_SEC - 0.45, INBOUND_INTRO_SEC);

  return (
    <AbsoluteFill style={{background: C.bg, fontFamily, color: C.ink, opacity: fadeOut}}>
      <Audio src={staticFile('pjfm/vo-inbound-intro.wav')} />
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
          top: lerp(280, 48, lift),
          textAlign: 'center',
          transform: `scale(${lerp(1, 0.42, lift)})`,
          transformOrigin: 'center top',
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: C.tealInk,
            opacity: ease(t, 0.3, 0.9) * (1 - lift),
          }}
        >
          AGENTIC AI · VOICE
        </div>
        <div style={{fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.05, color: C.ink, marginTop: 18}}>
          <Words text="Prophet Jerome *Inbound*" local={t - 0.35} size={108} stagger={0.11} />
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: C.sub,
            marginTop: 26,
            opacity: ease(t, 1.2, 1.8) * (1 - lift),
            letterSpacing: '-0.01em',
          }}
        >
          When a visitor calls, the AI answers
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            marginTop: 40,
            opacity: ease(t, 2.4, 3.0) * (1 - lift),
          }}
        >
          <span style={{fontSize: 28, fontWeight: 600, color: C.sub}}>Built on</span>
          <Img src={staticFile('logo-light.png')} style={{height: 120}} />
        </div>
      </div>

      {phoneK > 0.02 ? (
        <div style={{opacity: phoneK, transform: `translateY(${(1 - phoneK) * 70}px)`}}>
          <Phone
            x={770}
            y={168}
            scale={0.92}
            t={t}
            state="incoming"
            title="Rahul Sharma"
            subtitle="Calling PJFM"
            ringK={ringK}
            visitorLabel="Rahul speaking"
          />
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 56,
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 600,
          color: C.sub,
          opacity: ease(t, 9.4, 10.0) * (1 - ease(t, INBOUND_INTRO_SEC - 0.7, INBOUND_INTRO_SEC - 0.15)),
        }}
      >
        <span style={gradientText}>Live inbound</span>
        {' · The Glorious Church'}
      </div>
    </AbsoluteFill>
  );
};
