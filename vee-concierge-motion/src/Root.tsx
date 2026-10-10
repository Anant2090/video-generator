import React from 'react';
import {Composition} from 'remotion';
import {FPS, TOTAL_FRAMES} from './edit';
import {Main} from './Main';

export const Root: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
