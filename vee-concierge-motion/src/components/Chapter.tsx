import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';
import {C, clamp, easeOut, glass} from '../brand';
import {chapters} from '../cues';
import {useTime} from '../time';

// Top-band pill naming the current section.
export const Chapter: React.FC = () => {
  const {t} = useTime();
  const c = chapters.find((q) => t >= q.at - 0.2 && t < q.until);
  if (!c) return null;
  const k = interpolate(t, [c.at + 0.4, c.at + 1.0], [0, 1], {...clamp, easing: easeOut}) * interpolate(t, [c.until - 0.4, c.until], [1, 0], clamp);
  return (
    <div
      style={{
        ...glass,
        position: 'absolute',
        left: 240,
        top: 22,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 22px 8px 12px',
        borderRadius: 999,
        fontSize: 24,
        fontWeight: 600,
        opacity: k,
        transform: `translateY(${(1 - k) * -12}px)`,
      }}
    >
      <Img src={staticFile('orbit.png')} style={{width: 32, height: 32}} />
      <span>VEE Concierge</span>
      <span style={{color: C.sub, fontWeight: 500}}>→</span>
      <span>{c.title}</span>
    </div>
  );
};
