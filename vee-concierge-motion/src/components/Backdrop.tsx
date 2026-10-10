import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../brand';
import {TOTAL_FRAMES} from '../edit';
import {useTime} from '../time';

// Slow drifting blooms. Periodic over the whole film so the loop seam is invisible.
export const Backdrop: React.FC = () => {
  const {f} = useTime();
  const p = (2 * Math.PI * f) / TOTAL_FRAMES;
  const a = 22 + 10 * Math.sin(p);
  const b = 78 + 8 * Math.cos(p * 2);
  const c = 50 + 12 * Math.sin(p * 3 + 1);
  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(50% 70% at ${a}% 12%, ${C.cyan}2E, transparent 70%)`,
          `radial-gradient(45% 65% at ${b}% 92%, ${C.teal}2A, transparent 70%)`,
          `radial-gradient(35% 45% at ${c}% 55%, ${C.green}14, transparent 70%)`,
          C.bg,
        ].join(','),
      }}
    />
  );
};
