import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, fontFamily} from './brand';
import {Captions} from './components/Captions';
import {Chrome} from './components/Chrome';
import {END_CARD_FRAMES, EndCard} from './components/EndCard';
import {Kinetic} from './components/Kinetic';
import {Stage} from './components/Stage';
import {endCard, SRC_FRAMES} from './timeline';

// Nothing precedes the source; the optional end card follows it.
export const TOTAL_FRAMES = SRC_FRAMES + (endCard ? END_CARD_FRAMES : 0);

export const Main: React.FC = () => (
  <AbsoluteFill style={{background: C.bg, fontFamily}}>
    <Sequence durationInFrames={SRC_FRAMES} name="Body">
      <Stage />
      <Chrome />
      <Kinetic />
      <Captions />
    </Sequence>
    {endCard ? (
      <Sequence from={SRC_FRAMES} durationInFrames={END_CARD_FRAMES} name="End card">
        <EndCard />
      </Sequence>
    ) : null}
  </AbsoluteFill>
);
