import React from 'react';
import {interpolate} from 'remotion';
import {C, easeOut, glass} from '../brand';
import {callouts, CROP, S} from '../timeline';

const PAD = 10; // window px around the target
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Lives inside the zoom camera (window px), so it stays pinned to the UI.
// t = source seconds, z = camera zoom (label counter-scales to stay 22px),
// view = the part of the window the camera currently shows (window px).
type View = {x: number; y: number; w: number; h: number};
export const Callout: React.FC<{t: number; z: number; view: View}> = ({t, z, view}) => {
  const c = callouts.find((q) => t >= q.at && t < q.until);
  if (!c) return null;

  const inK = interpolate(t, [c.at, c.at + 0.45], [0, 1], {...clamp, easing: easeOut});
  const outK = interpolate(t, [c.until - 0.3, c.until], [1, 0], clamp);
  const draw = interpolate(t, [c.at + 0.1, c.at + 0.8], [0, 1], {...clamp, easing: easeOut});
  const label = interpolate(t, [c.at + 0.35, c.at + 0.8], [0, 1], {...clamp, easing: easeOut});

  const x = (c.rect[0] - CROP.x) * S - PAD;
  const y = (c.rect[1] - CROP.y) * S - PAD;
  const w = c.rect[2] * S + 2 * PAD;
  const h = c.rect[3] * S + 2 * PAD;
  // Label goes below the target if visible there, else above, else inside its bottom edge.
  const gap = 12 / z;
  const labelH = 60 / z;
  const place = y + h + labelH < view.y + view.h ? 'below' : y - labelH > view.y ? 'above' : 'inside';
  const top = place === 'below' ? y + h + gap : place === 'above' ? y - gap : y + h - gap;
  const left = Math.max(x, view.x + gap) + (place === 'inside' ? gap : 0);
  const up = place !== 'below';

  return (
    <div style={{position: 'absolute', inset: 0, opacity: outK}}>
      {/* spotlight: dims everything outside the target */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 14,
          boxShadow: `0 0 0 4000px rgba(15,23,42,${0.32 * inK})`,
        }}
      />
      <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible'}} width={w} height={h}>
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0" stopColor={C.cyan} />
            <stop offset="0.5" stopColor={C.teal} />
            <stop offset="1" stopColor={C.green} />
          </linearGradient>
        </defs>
        <rect
          width={w}
          height={h}
          rx={14}
          fill="none"
          stroke="url(#ring)"
          strokeWidth={3 / z}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - draw}
        />
      </svg>
      <div
        style={{
          ...glass,
          position: 'absolute',
          left,
          top,
          transformOrigin: up ? 'left bottom' : 'left top',
          transform: `translateY(${up ? -100 : 0}%) scale(${1 / z}) translateY(${(1 - label) * 10}px)`,
          opacity: label,
          filter: `blur(${(1 - label) * 6}px)`,
          padding: '10px 18px',
          fontSize: 22,
          fontWeight: 600,
          color: C.ink,
          whiteSpace: 'nowrap',
        }}
      >
        {c.label}
      </div>
    </div>
  );
};
