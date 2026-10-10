import React from 'react';
import {Easing, Img, staticFile} from 'remotion';
import scrollsJson from '../scrolls.json';
import {CROP, S} from '../timeline';

// Replaces each jumpy wheel-scroll in the recording with one eased slide of the
// pre-merged content strip (scripts/scrolls.py), plus vertical motion blur by speed.
const TAIL = 5; // frames of settle after the last real jump
const ease = Easing.bezier(0.33, 0, 0.2, 1); // gentle start, long deceleration
const MAX_BLUR = 6; // source px

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Explicit type: an empty scrolls.json (no scrolls yet) would otherwise infer never[].
type Gesture = {from: number; to: number; rect: number[]; offsets: number[][]; omin: number; strip: string};
const scrolls = scrollsJson as Gesture[];

// t = source frame. Lives inside the zoom camera (window px).
export const SmoothScroll: React.FC<{t: number}> = ({t}) => {
  // Latest gesture that has started; a following gesture cuts the previous tail short.
  const g = scrolls.findLast((q) => q.from <= t);
  if (!g || t > g.to + TAIL) return null;

  const D = g.offsets[g.offsets.length - 1][1];
  const dur = g.to + TAIL - g.from;
  const at = (f: number) => D * ease(clamp01((f - g.from) / dur));
  const o = at(t);
  const speed = Math.abs(at(t + 0.5) - at(t - 0.5)); // source px per frame
  const blur = Math.min(MAX_BLUR, speed / 5);
  const [x, y, w, h] = g.rect;
  const id = `scroll-blur-${g.from}`;

  return (
    <div
      style={{
        position: 'absolute',
        left: (x - CROP.x) * S,
        top: (y - CROP.y) * S,
        width: w * S,
        height: h * S,
        overflow: 'hidden',
      }}
    >
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="0" y="-2%" width="100%" height="104%">
          <feGaussianBlur stdDeviation={`0 ${blur * S}`} />
        </filter>
      </svg>
      <Img
        src={staticFile(g.strip)}
        style={{
          position: 'absolute',
          left: 0,
          top: -(o - g.omin) * S,
          width: w * S,
          filter: blur > 0.3 ? `url(#${id})` : undefined,
        }}
      />
    </div>
  );
};
