import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, easeOut, fontFamily, glass, GRADIENT, gradientText} from '../brand';
import {FPS} from './theme';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeOut});

export const CARD_SEC = 4.7;
export const CARD_FRAMES = Math.round(CARD_SEC * FPS);

export const Words: React.FC<{text: string; local: number; size: number; stagger?: number}> = ({text, local, size, stagger = 0.055}) => {
  let on = false;
  const words = text.split(' ').map((w) => {
    if (w.startsWith('*')) on = true;
    const accent = on;
    if (/\*[.,!?:]?$/.test(w)) on = false;
    return {w: w.replace(/\*/g, ''), accent};
  });
  return (
    <span style={{fontSize: size, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, color: C.ink}}>
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

export const SceneBadge: React.FC<{n: string; label: string; left?: number}> = ({n, label, left = 72}) => (
  <div
    style={{
      ...glass,
      position: 'absolute',
      left,
      top: 36,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '10px 22px 10px 12px',
      borderRadius: 999,
      zIndex: 12,
    }}
  >
    <span style={{padding: '4px 10px', borderRadius: 999, background: GRADIENT, color: '#fff', fontSize: 18, fontWeight: 800}}>{n}</span>
    <span style={{fontSize: 22, fontWeight: 600, color: C.ink}}>{label}</span>
  </div>
);

export const ScenarioCard: React.FC<{n: string; title: string; line: string}> = ({n, title, line}) => {
  const t = useCurrentFrame() / FPS;
  const out = 1 - ease(t, CARD_SEC - 0.4, CARD_SEC);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 800px at 12% 0%, #FFFFFF 0%, rgba(255,255,255,0) 60%),
          radial-gradient(900px 700px at 100% 100%, rgba(100,212,193,0.10), rgba(255,255,255,0) 70%), ${C.bg}`,
        fontFamily,
        opacity: out,
      }}
    >
      <SceneBadge n={n} label={`Scenario ${n.replace(/^0/, '')}`} />
      <div style={{position: 'absolute', left: 960, top: 480, transform: 'translate(-50%,-50%)', textAlign: 'center', width: 1500}}>
        <div>
          <Words text={title} local={t - 0.15} size={52} stagger={0.05} />
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: C.sub,
            marginTop: 28,
            lineHeight: 1.4,
            maxWidth: 1200,
            marginLeft: 'auto',
            marginRight: 'auto',
            opacity: ease(t, 1.05, 1.5),
          }}
        >
          {line}
        </div>
      </div>
    </AbsoluteFill>
  );
};
