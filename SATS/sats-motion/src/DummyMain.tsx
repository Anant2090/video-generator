import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {C, fontFamily} from './brand';
import {Backdrop} from './components/Bits';
import {DummyDashboard, DummyEnd, DummyShipment, DummyTitle, DummyWorkflow} from './scenes/dummy/DummyScenes';

export const DummyMain: React.FC = () => (
  <AbsoluteFill style={{background: C.bg, fontFamily, color: C.ink}}>
    <Backdrop />
    <DummyTitle />
    <DummyDashboard />
    <DummyWorkflow />
    <DummyShipment />
    <DummyEnd />
    <Audio src={staticFile('audio/mix.dummy.wav')} />
  </AbsoluteFill>
);
