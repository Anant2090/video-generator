import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, easeOut, gradientText} from '../brand';
import {FPS, kinetic} from '../timeline';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const STAGGER = 0.09; // s per word

// Full-frame emphasis: frosts the footage, words blur-in one by one.
// Wrap words in *asterisks* to paint them with the brand gradient.
export const Kinetic: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const k = kinetic.find((q) => t >= q.at && t < q.at + q.dur);
  if (!k) return null;

  const local = t - k.at;
  const frost = interpolate(local, [0, 0.35, k.dur - 0.35, k.dur], [0, 1, 1, 0], clamp);
  const out = interpolate(local, [k.dur - 0.35, k.dur], [1, 0], clamp);
  // *accent* spans may cover several words.
  let on = false;
  const words = k.text.split(' ').map((w) => {
    if (w.startsWith('*')) on = true;
    const accent = on;
    if (/\*[.,!?]?$/.test(w)) on = false;
    return {w: w.replace(/\*/g, ''), accent};
  });

  return (
    <AbsoluteFill
      style={{
        backdropFilter: `blur(${16 * frost}px)`,
        background: `rgba(245,245,247,${0.7 * frost})`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          textAlign: 'center',
          textWrap: 'balance',
          fontSize: 88,
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.08,
          color: C.ink,
          opacity: out,
          transform: `scale(${1 + 0.03 * (1 - out)})`,
        }}
      >
        {words.map(({w, accent}, i) => {
          const p = interpolate(local, [0.15 + i * STAGGER, 0.6 + i * STAGGER], [0, 1], {...clamp, easing: easeOut});
          return (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span
                style={{
                  display: 'inline-block',
                  opacity: p,
                  filter: `blur(${(1 - p) * 12}px)`,
                  transform: `translateY(${(1 - p) * 24}px)`,
                  ...(accent ? gradientText : null),
                }}
              >
                {w}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
