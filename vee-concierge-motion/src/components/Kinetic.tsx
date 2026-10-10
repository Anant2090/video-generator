import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, clamp, easeOut, gradientText} from '../brand';
import {kinetic} from '../cues';
import {useTime} from '../time';

const STAGGER = 0.09; // s per word

// Splits "a *b c* d" into words flagged for the gradient.
export const accentWords = (text: string) => {
  let on = false;
  return text.split(' ').map((w) => {
    if (w.startsWith('*')) on = true;
    const accent = on;
    if (/\*[.,!?]?$/.test(w)) on = false;
    return {w: w.replace(/\*/g, ''), accent};
  });
};

// The wrapper carries the font size so the spaces between words scale too.
export const Words: React.FC<{text: string; local: number; size: number; delay?: number}> = ({text, local, size, delay = 0.15}) => (
  <span style={{fontSize: size}}>
    {accentWords(text).map(({w, accent}, i) => {
      const p = interpolate(local, [delay + i * STAGGER, delay + 0.45 + i * STAGGER], [0, 1], {...clamp, easing: easeOut});
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
  </span>
);

// Full-frame emphasis: frosts whatever is underneath, words blur in one by one.
export const Kinetic: React.FC = () => {
  const {t} = useTime();
  const k = kinetic.find((q) => t >= q.at && t < q.at + q.dur);
  if (!k) return null;
  const local = t - k.at;
  const frost = interpolate(local, [0, 0.35, k.dur - 0.35, k.dur], [0, 1, 1, 0], clamp);
  const out = interpolate(local, [k.dur - 0.35, k.dur], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        backdropFilter: `blur(${18 * frost}px)`,
        background: `rgba(247,245,242,${0.72 * frost})`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          textAlign: 'center',
          textWrap: 'balance',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.08,
          color: C.ink,
          opacity: out,
          transform: `scale(${1 + 0.03 * (1 - out)})`,
        }}
      >
        <Words text={k.text} local={local} size={92} />
      </div>
    </AbsoluteFill>
  );
};
