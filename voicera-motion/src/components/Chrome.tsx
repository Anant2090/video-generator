import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, easeInOut, easeOut, GRADIENT, gradientText} from '../brand';
import {chapters, FPS, ranges, WIN} from '../timeline';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
// Chrome lives over the framed/blend stretch only (not the Canva title cards).
const START = ranges.find((r) => r.mode !== 'full')!.from / FPS;
const END = [...ranges].reverse().find((r) => r.mode !== 'full')!.to / FPS;
const endOf = (i: number) => chapters[i + 1]?.at ?? END;

const BAR = {x: 1160, w: WIN.x + WIN.w - 1160, gap: 6};

// Top band: chapter title arrives big, then settles into a small label.
// Right side: story-style progress, one segment per chapter.
export const Chrome: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const vis = interpolate(t, [START, START + 0.5, END - 0.4, END], [0, 1, 1, 0], clamp);
  if (vis === 0 || chapters.length === 0) return null;

  const i = chapters.findLastIndex((c) => c.at <= t);
  const total = END - chapters[0].at;

  return (
    <AbsoluteFill style={{opacity: vis}}>
      {i >= 0 ? <Title i={i} t={t} /> : null}
      {chapters.map((c, j) => {
        const x = BAR.x + ((c.at - chapters[0].at) / total) * BAR.w;
        const w = ((endOf(j) - c.at) / total) * BAR.w - BAR.gap;
        const fill = interpolate(t, [c.at, endOf(j)], [0, 1], clamp);
        return (
          <div
            key={c.at}
            style={{position: 'absolute', left: x, top: 48, width: w, height: 4, borderRadius: 2, background: 'rgba(29,29,31,0.08)', overflow: 'hidden'}}
          >
            <div style={{width: `${fill * 100}%`, height: '100%', background: GRADIENT}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Title: React.FC<{i: number; t: number}> = ({i, t}) => {
  const c = chapters[i];
  const local = t - c.at;
  const inK = interpolate(local, [0, 0.6], [0, 1], {...clamp, easing: easeOut});
  const settle = interpolate(local, [2.6, 3.3], [0, 1], {...clamp, easing: easeInOut});
  const exit = interpolate(t, [endOf(i) - 0.25, endOf(i)], [1, 0], clamp);
  const scale = 1 - 0.5 * settle; // 56px -> 28px

  return (
    <div
      style={{
        position: 'absolute',
        left: WIN.x,
        top: 50,
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
        fontSize: 56,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color: C.ink,
        transformOrigin: 'left center',
        transform: `translateY(-50%) scale(${scale}) translateY(${(1 - inK) * 16}px)`,
        opacity: inK * exit,
        filter: `blur(${(1 - inK) * 10}px)`,
      }}
    >
      <span style={{...gradientText, fontWeight: 800}}>{String(i + 1).padStart(2, '0')}</span>
      <span>{c.title}</span>
    </div>
  );
};
