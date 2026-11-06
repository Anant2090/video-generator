import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {C, fontFamily} from './brand';
import {Backdrop} from './components/Bits';
import {Chrome} from './components/Chrome';
import {CallA, CallD, Handoffs} from './scenes/CallSplit';
import {CanvasTour, Exceptions, OnRecord} from './scenes/CanvasScenes';
import {Challenge} from './scenes/Challenge';
// import {ChallengeList} from './scenes/ChallengeList'; // kinetic-text original
import {Benefits, EndCard} from './scenes/Closing';
import {Hook} from './scenes/Hook';
import {Title} from './scenes/Title';

export const Main: React.FC = () => (
  <AbsoluteFill style={{background: C.bg, fontFamily, color: C.ink}}>
    <Backdrop />
    <Hook />
    <Challenge />
    <Title />
    <CanvasTour />
    <CallA />
    <Handoffs />
    <CallD />
    <Exceptions />
    <OnRecord />
    <Benefits />
    <EndCard />
    <Chrome />
    <Audio src={staticFile('audio/mix.wav')} />
  </AbsoluteFill>
);
