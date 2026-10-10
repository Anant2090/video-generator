import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, clamp, easeOut, glass, gradientText} from '../brand';
import {ease} from '../tl';

export const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(1200px 800px at 12% 0%, #FFFFFF 0%, rgba(255,255,255,0) 60%),
        radial-gradient(900px 700px at 100% 100%, rgba(100,212,193,0.10), rgba(255,255,255,0) 70%),
        radial-gradient(800px 600px at 85% 10%, rgba(62,205,240,0.08), rgba(255,255,255,0) 70%), ${C.bg}`,
    }}
  />
);

/** Pill with a leader line down (or up) to an anchor point in stage pixels. */
export const Callout: React.FC<{x: number; y: number; text: string; t: number; at: number; until: number; up?: boolean; dx?: number}> = ({
  x,
  y,
  text,
  t,
  at,
  until,
  up = true,
  dx = 0,
}) => {
  const k = ease(t, at, at + 0.45) * (1 - ease(t, until - 0.3, until));
  if (k <= 0) return null;
  const len = 46;
  const dir = up ? -1 : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: k}}>
      <div style={{position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: 7, background: '#fff', border: `3px solid ${C.tealInk}`, boxShadow: `0 0 0 ${6 * k}px ${C.cyan}33`}} />
      <div style={{position: 'absolute', left: -1, top: up ? -len * k : 0, width: 2, height: len * k, background: `linear-gradient(${up ? 0 : 180}deg, ${C.tealInk}, ${C.cyan}00)`}} />
      <div
        style={{
          ...glass,
          position: 'absolute',
          left: dx,
          top: dir * (len + 6),
          transform: `translate(-50%, ${up ? '-100%' : '0'}) translateY(${(1 - k) * 10 * dir}px)`,
          padding: '12px 22px',
          borderRadius: 999,
          fontSize: 26,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: C.ink,
          background: 'rgba(255,255,255,0.92)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Small result/status chip (stage pixels). */
export const Chip: React.FC<{x: number; y: number; t: number; at: number; until: number; children: React.ReactNode; tone?: 'teal' | 'amber' | 'ink'}> = ({
  x,
  y,
  t,
  at,
  until,
  children,
  tone = 'teal',
}) => {
  const k = ease(t, at, at + 0.4) * (1 - ease(t, until - 0.3, until));
  if (k <= 0) return null;
  const col = tone === 'amber' ? '#B45309' : tone === 'ink' ? C.ink : '#0E7C86';
  const bd = tone === 'amber' ? `${C.amber}88` : `${C.teal}AA`;
  return (
    <div
      style={{
        ...glass,
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(0, -50%) scale(${0.85 + 0.15 * k})`,
        transformOrigin: 'left center',
        opacity: k,
        padding: '10px 18px',
        borderRadius: 14,
        fontSize: 22,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: col,
        border: `1.5px solid ${bd}`,
        background: 'rgba(255,255,255,0.94)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {children}
    </div>
  );
};

/** Lower-left glossary chip: "ATA = Actual Time of Arrival". */
export const Glossary: React.FC<{items: {at: number; until: number; abbr: string; full: string}[]; t: number}> = ({items, t}) => (
  <div style={{position: 'absolute', left: 80, bottom: 34, display: 'flex', gap: 14}}>
    {items.map((g) => {
      const k = ease(t, g.at, g.at + 0.45) * (1 - ease(t, g.until - 0.35, g.until));
      if (k <= 0) return null;
      return (
        <div key={g.abbr} style={{...glass, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px 10px 12px', borderRadius: 999, opacity: k, transform: `translateY(${(1 - k) * 14}px)`}}>
          <span style={{padding: '4px 12px', borderRadius: 999, background: `${C.cyan}22`, color: C.tealInk, fontSize: 20, fontWeight: 800, letterSpacing: '0.06em'}}>{g.abbr}</span>
          <span style={{fontSize: 22, fontWeight: 500, color: C.ink}}>{g.full}</span>
        </div>
      );
    })}
  </div>
);

/** Words blur-rise in one by one; *wrapped* words get the gradient. */
export const Words: React.FC<{text: string; local: number; size: number; stagger?: number; delay?: number}> = ({text, local, size, stagger = 0.08, delay = 0}) => {
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
        const p = interpolate(local, [delay + i * stagger, delay + 0.45 + i * stagger], [0, 1], {...clamp, easing: easeOut});
        return (
          <React.Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span style={{display: 'inline-block', opacity: p, filter: `blur(${(1 - p) * 10}px)`, transform: `translateY(${(1 - p) * 20}px)`, ...(accent ? gradientText : null)}}>{w}</span>
          </React.Fragment>
        );
      })}
    </span>
  );
};

/** macOS-style pointer with a click ripple at `clickAt`. */
export const Cursor: React.FC<{x: number; y: number; t: number; clickAt?: number; opacity?: number}> = ({x, y, t, clickAt, opacity = 1}) => {
  const r = clickAt !== undefined ? ease(t, clickAt, clickAt + 0.5) : 0;
  const ripple = clickAt !== undefined && t >= clickAt && t < clickAt + 0.5;
  const press = clickAt !== undefined ? interpolate(t, [clickAt - 0.08, clickAt, clickAt + 0.12], [1, 0.86, 1], clamp) : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity, zIndex: 50}}>
      {ripple ? <div style={{position: 'absolute', left: -30 * r - 4, top: -30 * r - 4, width: 60 * r + 8, height: 60 * r + 8, borderRadius: '50%', border: `3px solid ${C.cyan}`, opacity: 1 - r}} /> : null}
      <svg width="34" height="40" viewBox="0 0 24 28" style={{transform: `scale(${press})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))'}}>
        <path d="M2 2 L2 22 L7.5 17 L11 25.5 L14.5 24 L11 15.8 L18.5 15.8 Z" fill="#1D1D1F" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** Scene envelope: fades and slight scale at the edges of [start, end]. */
export const SceneFade: React.FC<{t: number; start: number; end: number; fadeIn?: number; fadeOut?: number; children: React.ReactNode}> = ({
  t,
  start,
  end,
  fadeIn = 0.5,
  fadeOut = 0.5,
  children,
}) => {
  if (t < start - 0.01 || t > end + 0.01) return null;
  const a = fadeIn ? ease(t, start, start + fadeIn) : 1;
  const b = fadeOut ? 1 - interpolate(t, [end - fadeOut, end], [0, 1], clamp) : 1;
  return <AbsoluteFill style={{opacity: Math.min(a, b), transform: `scale(${1.015 - 0.015 * a})`}}>{children}</AbsoluteFill>;
};
