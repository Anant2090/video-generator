import React from 'react';
import {C, glass, GRADIENT} from '../brand';
import {useTime} from '../time';
import {ease, scene, type SceneName, TOTAL} from '../tl';

const CHAPTERS: [SceneName, string, string][] = [
  ['challenge', '01', 'The challenge'],
  ['canvas', '02', 'The workflow'],
  ['call', '03', 'The call'],
  ['handoffs', '04', 'Hand-offs'],
  ['pickup', '06', 'Scenario 6'],
  ['exceptions', '06', 'Exceptions'],
  ['record', '07', 'On record'],
];

export const Chrome: React.FC = () => {
  const {t} = useTime();
  const bar = ease(t, 1, 2) * (1 - ease(t, scene('end').start, scene('end').start + 0.6));
  return (
    <>
      {CHAPTERS.map(([n, num, label]) => {
        const s = scene(n);
        const k = ease(t, s.start + 0.3, s.start + 0.9) * (1 - ease(t, s.end - 0.4, s.end));
        if (k <= 0) return null;
        return (
          <div
            key={n}
            style={{
              ...glass,
              position: 'absolute',
              left: 80,
              top: 46,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 22px 10px 12px',
              borderRadius: 999,
              opacity: k,
              transform: `translateX(${(1 - k) * -16}px)`,
            }}
          >
            <span style={{padding: '4px 10px', borderRadius: 999, background: GRADIENT, color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '0.04em'}}>{num}</span>
            <span style={{fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em'}}>{label}</span>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 4, width: `${(t / TOTAL) * 100}%`, background: GRADIENT, opacity: 0.85 * bar}} />
    </>
  );
};
