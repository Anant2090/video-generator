import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, fontFamily} from './brand';
import {Backdrop} from './components/Bits';
import {Chrome} from './components/Chrome';
import TL from './data/timeline.json';
import {CallD} from './scenes/CallSplit';
import {TimeOffset} from './time';
import {FPS} from './tl';

const pickup = TL.scenes.find((s) => s.name === 'pickup')!;
export const S6_START = pickup.start;
export const S6_FRAMES = Math.round((pickup.end - pickup.start) * FPS);

export const Scenario6: React.FC = () => (
  <TimeOffset.Provider value={S6_START}>
    <AbsoluteFill style={{background: C.bg, fontFamily, color: C.ink}}>
      <Backdrop />
      <CallD />
      <Chrome />
    </AbsoluteFill>
  </TimeOffset.Provider>
);
