import React from 'react';
import {Composition} from 'remotion';
import {LEGION_FRAMES, LegionPromo} from './legion/LegionPromo';
import {LEGION5_FRAMES, LegionPromoV5} from './legion5/LegionPromo';
import {VeeCompare} from './legion/VeeCompare';
import {Main, TOTAL_FRAMES} from './Main';
import {FPS} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="LegionPromo" component={LegionPromo} durationInFrames={LEGION_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="LegionPromoV5" component={LegionPromoV5} durationInFrames={LEGION5_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="VeeCompare" component={VeeCompare} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
