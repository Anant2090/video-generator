import React from 'react';
import {Composition} from 'remotion';
import {LEGION_FRAMES, LegionPromo} from './legion/LegionPromo';
import {LEGION5_FRAMES, LegionPromoV5} from './legion5/LegionPromo';
import {VeeCompare} from './legion/VeeCompare';
import {Main, TOTAL_FRAMES} from './Main';
import {PjfmChat, PJFM_FRAMES} from './pjfm/PjfmChat';
import {PjfmIntro, INTRO_FRAMES} from './pjfm/Intro';
import {PjfmEnd, END_FRAMES} from './pjfm/EndCard';
import {PjfmOutbound, OUTBOUND_FRAMES} from './pjfm/Outbound';
import {PjfmInbound, INBOUND_FRAMES} from './pjfm/Inbound';
import {PjfmFull, FULL_FRAMES} from './pjfm/Full';
import {HOTEL_FRAMES, HOTEL_FPS, VeeHotel} from './hotel/VeeHotel';
import {DEMO_FRAMES, DEMO_FPS, HotelDemo} from './hotel/HotelDemo';
import {FPS} from './timeline';
import {FPS as PJFM_FPS} from './pjfm/theme';

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="LegionPromo" component={LegionPromo} durationInFrames={LEGION_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="LegionPromoV5" component={LegionPromoV5} durationInFrames={LEGION5_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="VeeCompare" component={VeeCompare} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="PjfmChat" component={PjfmChat} durationInFrames={PJFM_FRAMES} fps={PJFM_FPS} width={1920} height={1080} />
    <Composition id="PjfmIntro" component={PjfmIntro} durationInFrames={INTRO_FRAMES} fps={PJFM_FPS} width={1920} height={1080} />
    <Composition id="PjfmEnd" component={PjfmEnd} durationInFrames={END_FRAMES} fps={PJFM_FPS} width={1920} height={1080} />
    <Composition id="PjfmOutbound" component={PjfmOutbound} durationInFrames={OUTBOUND_FRAMES} fps={PJFM_FPS} width={1920} height={1080} />
    <Composition id="PjfmInbound" component={PjfmInbound} durationInFrames={INBOUND_FRAMES} fps={PJFM_FPS} width={1920} height={1080} />
    <Composition id="PjfmFull" component={PjfmFull} durationInFrames={FULL_FRAMES} fps={PJFM_FPS} width={1920} height={1080} />
    <Composition id="VeeHotel" component={VeeHotel} durationInFrames={HOTEL_FRAMES} fps={HOTEL_FPS} width={1080} height={1920} />
    <Composition id="HotelDemo" component={HotelDemo} durationInFrames={DEMO_FRAMES} fps={DEMO_FPS} width={1920} height={1080} />
  </>
);
