import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, fontFamily} from '../brand';
import {PjfmChat, PJFM_FRAMES} from './PjfmChat';
import {PjfmInboundCall, INBOUND_CALL_FRAMES} from './Inbound';
import {PjfmOutboundCall, OUTBOUND_CALL_FRAMES} from './Outbound';
import {FULL_INTRO_FRAMES, PjfmFullIntro} from './FullIntro';
import {FULL_END_FRAMES, PjfmFullEnd} from './FullEnd';
import {CARD_FRAMES, ScenarioCard, SceneBadge} from './ScenarioCard';

const chat = CARD_FRAMES + PJFM_FRAMES;
const inbound = CARD_FRAMES + INBOUND_CALL_FRAMES;
const outbound = CARD_FRAMES + OUTBOUND_CALL_FRAMES;

const T0 = FULL_INTRO_FRAMES;
const T1 = T0 + chat;
const T2 = T1 + inbound;
const T3 = T2 + outbound;

export const FULL_FRAMES = T3 + FULL_END_FRAMES;

const BodyBadge: React.FC<{n: string; label: string; left?: number; children: React.ReactNode}> = ({n, label, left, children}) => (
  <AbsoluteFill>
    {children}
    <SceneBadge n={n} label={label} left={left} />
  </AbsoluteFill>
);

export const PjfmFull: React.FC = () => (
  <AbsoluteFill style={{background: C.bg, fontFamily}}>
    <Sequence durationInFrames={FULL_INTRO_FRAMES}>
      <PjfmFullIntro />
    </Sequence>

    <Sequence from={T0} durationInFrames={CARD_FRAMES}>
      <ScenarioCard
        n="01"
        title="Scenario 1: Website — *Every question answered*"
        line="Visitor on prophetjerome.com talks to the AI Assistant (service times, Miracle Dome, English service, contact, baptism)."
      />
    </Sequence>
    <Sequence from={T0 + CARD_FRAMES} durationInFrames={PJFM_FRAMES}>
      <BodyBadge n="01" label="Website chat">
        <PjfmChat />
      </BodyBadge>
    </Sequence>

    <Sequence from={T1} durationInFrames={CARD_FRAMES}>
      <ScenarioCard
        n="02"
        title="Scenario 2: Inbound — *When a visitor calls, the AI answers*"
        line="Rahul Sharma calls; Vee greets, Miracle Dome + times, prayer request, confirm, follow-up."
      />
    </Sequence>
    <Sequence from={T1 + CARD_FRAMES} durationInFrames={INBOUND_CALL_FRAMES}>
      <BodyBadge n="02" label="Inbound" left={500}>
        <PjfmInboundCall />
      </BodyBadge>
    </Sequence>

    <Sequence from={T2} durationInFrames={CARD_FRAMES}>
      <ScenarioCard
        n="03"
        title="Scenario 3: Outbound — *The church reaches out first*"
        line="Vee calls Mr. Daniel; services, faith line, capture details, close."
      />
    </Sequence>
    <Sequence from={T2 + CARD_FRAMES} durationInFrames={OUTBOUND_CALL_FRAMES}>
      <BodyBadge n="03" label="Outbound" left={500}>
        <PjfmOutboundCall />
      </BodyBadge>
    </Sequence>

    <Sequence from={T3} durationInFrames={FULL_END_FRAMES}>
      <PjfmFullEnd />
    </Sequence>
  </AbsoluteFill>
);
