import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {C, fontFamily} from './brand';
import {Backdrop} from './components/Bits';
import {Scenario1Call} from './scenes/Scenario1Call';
import {TOTAL_FRAMES} from './tl-s1';

export const S1_FRAMES = TOTAL_FRAMES;

export const Scenario1: React.FC = () => (
  <AbsoluteFill style={{background: C.bg, fontFamily, color: C.ink}}>
    <Backdrop />
    <Scenario1Call />
    <Audio src={staticFile('audio/mix.scenario1.wav')} />
  </AbsoluteFill>
);
