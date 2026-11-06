import React from 'react';
import {Composition} from 'remotion';
import {DummyMain} from './DummyMain';
import {Main} from './Main';
import {S1_FRAMES, Scenario1} from './Scenario1';
import {S6_FRAMES, Scenario6} from './Scenario6';
import {FPS, TOTAL_FRAMES} from './tl';
import {FPS as DUMMY_FPS, TOTAL_FRAMES as DUMMY_FRAMES} from './tl-dummy';
import {FPS as S1_FPS} from './tl-s1';

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="DummyMain" component={DummyMain} durationInFrames={DUMMY_FRAMES} fps={DUMMY_FPS} width={1920} height={1080} />
    <Composition id="Scenario6" component={Scenario6} durationInFrames={S6_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="Scenario1" component={Scenario1} durationInFrames={S1_FRAMES} fps={S1_FPS} width={1920} height={1080} />
  </>
);
