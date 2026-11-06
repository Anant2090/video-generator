import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, fontFamily, glass, GRADIENT} from '../brand';
import {Phone, type PhoneState} from './Phone';
import {OUTBOUND_INTRO_FRAMES, PjfmOutboundIntro} from './OutboundIntro';
import data from './outbound-turns.json';
import {clamp, FPS} from './theme';

export const OUTBOUND_CALL_SEC = data.durationSec;
export const OUTBOUND_CALL_FRAMES = Math.round(OUTBOUND_CALL_SEC * FPS);
export const OUTBOUND_FRAMES = OUTBOUND_INTRO_FRAMES + OUTBOUND_CALL_FRAMES;

type Who = 'agent' | 'visitor';
type Word = {w: string; t: number};
type Turn = {id: string; who: Who; at: number; end: number; text: string; words: Word[]};

const TURNS = data.turns as Turn[];
const PICKUP = data.pickup;
const HANGUP = data.hangup;

const PHONE = {x: 64, y: 128, s: 0.96};
const CHAT = {x: 500, y: 128, w: 680, h: 820};

const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);

const fmt = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

const speakerAt = (t: number): Who | null => {
  const hit = TURNS.find((x) => t >= x.at && t <= x.end + 0.12);
  return hit?.who ?? null;
};

const Bubble: React.FC<{turn: Turn; t: number}> = ({turn, t}) => {
  const agent = turn.who === 'agent';
  const k = ease(t, turn.at - 0.12, turn.at + 0.28);
  return (
    <div style={{alignSelf: agent ? 'flex-start' : 'flex-end', maxWidth: CHAT.w - 8, opacity: k, transform: `translateY(${(1 - k) * 16}px)`, flexShrink: 0}}>
      <div style={{fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', color: agent ? C.tealInk : C.sub, marginBottom: 6, textAlign: agent ? 'left' : 'right'}}>
        {agent ? 'AI AGENT' : 'DANIEL'}
      </div>
      <div
        style={{
          ...glass,
          padding: '13px 18px 14px',
          borderRadius: 22,
          borderTopLeftRadius: agent ? 6 : 22,
          borderTopRightRadius: agent ? 22 : 6,
          background: agent ? 'rgba(232,248,252,0.95)' : 'rgba(255,255,255,0.96)',
          border: agent ? `1px solid ${C.cyan}55` : `1px solid ${C.faint}`,
          fontSize: 22,
          lineHeight: 1.36,
          fontWeight: 500,
          color: C.ink,
        }}
      >
        {turn.words.map((w, i) => (
          <React.Fragment key={i}>
            {i ? ' ' : null}
            <span style={{opacity: 0.18 + 0.82 * ease(t, w.t - 0.04, w.t + 0.14)}}>{w.w}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const FACTS: {at: number; until: number; kicker: string; body: string}[] = [
  {at: 34.0, until: 63.0, kicker: 'WEEKLY', body: 'Forensic Night · Thursdays'},
  {at: 79.0, until: 98.5, kicker: 'SUNDAY', body: '7:30 Sinhala & Tamil · 11:30 English & Sinhala'},
  {at: 94.5, until: 105.0, kicker: 'POYA', body: '10:00 a.m. IST'},
  {at: 109.7, until: 136.0, kicker: 'FAITH LINE', body: '+94 11 777 48 77'},
  {at: 149.5, until: 162.0, kicker: 'EMAIL', body: 'info@prophetjerome.com'},
];

export const PjfmOutboundCall: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const state: PhoneState = t < PICKUP ? 'incoming' : t < HANGUP ? 'active' : 'ended';
  const who = speakerAt(t);
  const level = who ? 0.55 + 0.45 * Math.abs(Math.sin(t * 7.3)) : 0.04;
  const ringK = t >= 0 ? ease(t, 0, 0.28) * (1 - ease(t, PICKUP - 0.2, PICKUP)) : 0;
  const shown = TURNS.filter((x) => t >= x.at - 0.12);
  const fadeIn = interpolate(t, [0, 0.4], [0, 1], clamp);
  const fadeOut = interpolate(t, [OUTBOUND_CALL_SEC - 0.8, OUTBOUND_CALL_SEC], [1, 0], clamp);
  const fade = fadeIn * fadeOut;

  return (
    <AbsoluteFill style={{background: C.bg, fontFamily, opacity: fade}}>
      <Audio src={staticFile('pjfm/outbound.wav')} />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          left: -280,
          top: -320,
          borderRadius: 450,
          background: 'radial-gradient(circle, rgba(62,205,240,0.18) 0%, rgba(245,245,247,0) 70%)',
        }}
      />
      <div
        style={{
          ...glass,
          position: 'absolute',
          left: 72,
          top: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 22px 10px 12px',
          borderRadius: 999,
        }}
      >
        <span style={{padding: '4px 12px', borderRadius: 999, background: GRADIENT, color: '#fff', fontSize: 16, fontWeight: 800}}>CALL</span>
        <span style={{fontSize: 22, fontWeight: 600, color: C.ink}}>Outbound · Prophet Jerome Fernando Ministries</span>
      </div>

      <Phone
        x={PHONE.x}
        y={PHONE.y}
        scale={PHONE.s}
        t={t}
        state={state}
        title="Vee · PJFM"
        subtitle="Calling Mr. Daniel"
        timer={fmt(Math.max(0, t - PICKUP))}
        speaking={who}
        level={level}
        ringK={ringK}
        visitorLabel="Daniel speaking"
      />

      <div
        style={{
          position: 'absolute',
          left: CHAT.x,
          top: CHAT.y,
          width: CHAT.w,
          height: CHAT.h,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 16,
          overflow: 'hidden',
          maskImage: 'linear-gradient(180deg, transparent 0, black 120px)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0, black 120px)',
        }}
      >
        {shown.slice(-4).map((turn) => (
          <Bubble key={turn.id} turn={turn} t={t} />
        ))}
      </div>

      {FACTS.map((f, i) => {
        const k = ease(t, f.at, f.at + 0.45) * (1 - ease(t, f.until, f.until + 0.4));
        if (k < 0.02) return null;
        const stack = FACTS.slice(0, i).filter((x) => t >= x.at && t <= x.until + 0.4).length;
        return (
          <div
            key={f.kicker}
            style={{
              ...glass,
              position: 'absolute',
              right: 48,
              top: 168 + stack * 118,
              width: 500,
              padding: '16px 20px',
              borderRadius: 20,
              opacity: k,
              transform: `translateY(${(1 - k) * 14}px)`,
              zIndex: 4,
            }}
          >
            <div style={{fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', color: C.tealInk}}>{f.kicker}</div>
            <div style={{fontSize: 22, fontWeight: 600, color: C.ink, marginTop: 8, lineHeight: 1.35}}>{f.body}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const PjfmOutbound: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <Sequence durationInFrames={OUTBOUND_INTRO_FRAMES}>
      <PjfmOutboundIntro />
    </Sequence>
    <Sequence from={OUTBOUND_INTRO_FRAMES} durationInFrames={OUTBOUND_CALL_FRAMES}>
      <PjfmOutboundCall />
    </Sequence>
  </AbsoluteFill>
);
