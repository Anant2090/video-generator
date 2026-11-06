import React from 'react';
import {C, glass, GRADIENT} from '../brand';
import {CanvasStage, type Flow, type Lit, right, top} from '../components/CanvasStage';
import {Chip, SceneFade, Words} from '../components/Bits';
import {Phone, type PhoneState} from '../components/Phone';
import type {Key, Win} from '../components/Screen';
import type {NodeId} from '../canvas';
import {useS1Time} from '../time-s1';
import {ease, isSpeaking, line, mark, scene, shownWords} from '../tl-s1';

const WIN: Win = {x: 860, y: 140, w: 980, h: 800};
const PHONE = {x: 70, y: 150, s: 0.98};
const CHAT = {x: 470, y: 150, w: 360, h: 790};

type Turn = {id: string; who: 'agent' | 'consignee'};

const Bubble: React.FC<{id: string; t: number}> = ({id, t}) => {
  const l = line(id);
  const agent = l.who === 'agent';
  const k = ease(t, l.at - 0.1, l.at + 0.3);
  const words = shownWords(id);
  return (
    <div style={{alignSelf: agent ? 'flex-start' : 'flex-end', maxWidth: CHAT.w, opacity: k, transform: `translateY(${(1 - k) * 16}px)`, flexShrink: 0}}>
      <div style={{fontSize: 14, fontWeight: 800, letterSpacing: '0.1em', color: agent ? C.tealInk : C.sub, marginBottom: 6, textAlign: agent ? 'left' : 'right'}}>
        {agent ? 'AI AGENT' : 'CONSIGNEE'}
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
        {words.map((w, i) => (
          <React.Fragment key={i}>
            {i ? ' ' : null}
            <span style={{opacity: 0.18 + 0.82 * ease(t, w.t - 0.05, w.t + 0.12)}}>{w.w}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Transcript: React.FC<{turns: Turn[]; t: number; from: number}> = ({turns, t, from}) => {
  const shown = turns.filter((x) => line(x.id).at - 0.1 <= t && line(x.id).at >= from - 0.01);
  return (
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
        maskImage: 'linear-gradient(180deg, transparent 0, black 140px)',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0, black 140px)',
      }}
    >
      {shown.slice(-5).map((x) => (
        <Bubble key={x.id} id={x.id} t={t} />
      ))}
    </div>
  );
};

const fmt = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
const speakerAt = (turns: Turn[], t: number) => turns.find((x) => isSpeaking(x.id, t))?.who ?? null;

type Beat = {at: number; nodes: NodeId[]; until: number};
const litFrom = (beats: Beat[]): Lit[] => beats.flatMap((b) => b.nodes.map((id) => ({id, at: b.at, until: b.until})));

const ChipAt: React.FC<{
  p: (x: number, y: number) => [number, number];
  node: NodeId;
  t: number;
  at: number;
  until: number;
  side: 'right' | 'top';
  tone?: 'teal' | 'amber' | 'ink';
  children: React.ReactNode;
}> = ({p, node, t, at, until, side, tone, children}) => {
  const [x, y] = p(...(side === 'right' ? right(node) : top(node)));
  const ox = side === 'right' ? 14 : -70;
  const oy = side === 'top' ? -30 : 0;
  return (
    <Chip x={Math.min(x + ox, WIN.x + WIN.w - 330)} y={y + oy} t={t} at={at} until={until} tone={tone}>
      {children}
    </Chip>
  );
};

export const Scenario1Call: React.FC = () => {
  const {t} = useS1Time();
  const s = scene('scenario1');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const L = (id: string) => line(id);
  const ring = mark('ring');
  const pick = mark('pickup');
  const hang = mark('hangup');
  const sms = mark('sms');
  const E: Turn[] = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'].map((id) => ({id, who: L(id).who as Turn['who']}));
  const sending = ease(t, sms, sms + 0.35) * (1 - ease(t, L('E7').at - 0.1, L('E7').at + 0.25));
  const smsK = ease(t, L('E7').at + 0.35, L('E7').at + 0.95);
  const outcome = ease(t, hang + 0.25, hang + 0.85);
  const titleK = 1 - ease(t, ring - 0.3, ring + 0.2);

  const beats: Beat[] = [
    {at: ring, nodes: ['ata'], until: L('E1').end},
    {at: ring + 0.45, nodes: ['noa'], until: L('E1').end},
    {at: L('E1').at, nodes: ['arr'], until: L('E4').at},
    {at: L('E2').at, nodes: ['sup'], until: L('E3').end},
    {at: L('E2').at + 0.3, nodes: ['awb'], until: L('E4').at},
    {at: L('E4').at, nodes: ['sup'], until: L('E5').at},
    {at: L('E5').at, nodes: ['faq', 'satsfaq'], until: L('E7').at},
    {at: L('E5').at + 0.5, nodes: ['resp'], until: L('E6').end},
    {at: L('E7').at, nodes: ['ack'], until: s.end + 1},
    {at: hang, nodes: ['ci'], until: s.end + 1},
  ];
  const flows: Flow[] = [
    {edge: 'ata>noa', at: ring + 0.25},
    {edge: 'noa>sup', at: L('E2').at - 0.15},
    {edge: 'sup>ship', at: L('E2').at},
    {edge: 'ship>awb', at: L('E2').at + 0.25},
    {edge: 'awb>resp', at: L('E3').at - 0.2},
    {edge: 'sup>faq', at: L('E5').at},
    {edge: 'faq>satsfaq', at: L('E5').at + 0.3},
    {edge: 'satsfaq>resp', at: L('E5').at + 0.55},
    {edge: 'resp>ack', at: L('E7').at - 0.1},
  ];
  const keys: Key[] = [
    {at: s.start, cx: 420, cy: 430, z: 1.7},
    {at: L('E2').at - 0.2, cx: 1000, cy: 280, z: 1.75},
    {at: L('E5').at - 0.2, cx: 1020, cy: 560, z: 1.75},
    {at: L('E7').at - 0.2, cx: 1540, cy: 480, z: 1.75},
  ];
  const state: PhoneState = t < pick ? 'incoming' : t < hang ? 'active' : 'ended';
  const who = speakerAt(E, t);
  const level = who ? 0.55 + 0.45 * Math.abs(Math.sin(t * 7.3)) : 0.04;

  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.35} fadeOut={0.35}>
      <div
        style={{
          ...glass,
          position: 'absolute',
          left: 80,
          top: 46,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 22px 10px 12px',
          borderRadius: 999,
          opacity: ease(t, 0.2, 0.6) * (1 - ease(t, s.end - 0.5, s.end)),
        }}
      >
        <span style={{padding: '4px 10px', borderRadius: 999, background: GRADIENT, color: '#fff', fontSize: 18, fontWeight: 800}}>01</span>
        <span style={{fontSize: 22, fontWeight: 600, color: C.ink}}>Scenario 1</span>
      </div>

      {titleK > 0.02 ? (
        <div style={{position: 'absolute', inset: 0, opacity: titleK}}>
          <div style={{position: 'absolute', left: 960, top: 480, transform: 'translate(-50%,-50%)', textAlign: 'center', width: 1400}}>
            <div style={{fontWeight: 800, letterSpacing: '-0.04em', color: C.ink}}>
              <Words text="Scenario 1: Shipment Arrival — *Pickup Deadline & Payment*" local={t - 0.2} size={54} stagger={0.055} />
            </div>
            <div style={{fontSize: 28, fontWeight: 500, color: C.sub, marginTop: 26, lineHeight: 1.4, opacity: ease(t, 1.0, 1.5)}}>
              Shipment arrived. Collect before 3:00 p.m. today.
            </div>
          </div>
        </div>
      ) : null}

      {t >= ring - 0.45 ? (
        <div style={{opacity: ease(t, ring - 0.2, ring + 0.4)}}>
          <Phone x={PHONE.x} y={PHONE.y} scale={PHONE.s} t={t} state={state} title="SATS Import TeleAdvice" subtitle="Notice of arrival" timer={fmt(Math.max(0, t - pick))} speaking={who} level={level} ringK={t >= ring ? ease(t, ring, ring + 0.3) * (1 - ease(t, pick - 0.2, pick)) : 0} />
          <Transcript turns={E} t={t} from={L('E1').at} />
          <CanvasStage
            id="s1"
            t={t}
            win={WIN}
            keys={keys}
            lit={litFrom(beats)}
            flows={flows}
            spots={[{from: -10, to: 9999, nodes: []}, ...litFrom(beats).map((l) => ({from: l.at - 0.1, to: l.until + 0.3, nodes: [l.id]}))]}
            overlay={(p) => (
              <>
                <ChipAt p={p} node="ata" t={t} at={ring + 0.15} until={L('E1').end} side="top">
                  Outbound call
                </ChipAt>
                <ChipAt p={p} node="arr" t={t} at={L('E1').at + 1.0} until={L('E4').at} side="right">
                  Ready for collection · by 15:00
                </ChipAt>
                <ChipAt p={p} node="awb" t={t} at={L('E3').at} until={L('E5').at} side="right">
                  12 pcs · 486 kg
                </ChipAt>
                <ChipAt p={p} node="satsfaq" t={t} at={L('E5').at + 0.8} until={L('E7').at} side="right">
                  Storage USD 30 / hour
                </ChipAt>
                <ChipAt p={p} node="ack" t={t} at={L('E7').at + 1.0} until={s.end + 1} side="top" tone="amber">
                  USD 60 · payment link sent
                </ChipAt>
              </>
            )}
          />
          <div style={{position: 'absolute', left: WIN.x, top: WIN.y - 52, display: 'flex', alignItems: 'center', gap: 12, fontSize: 21, fontWeight: 700, color: C.sub, letterSpacing: '0.04em'}}>
            <span style={{width: 10, height: 10, borderRadius: 5, background: GRADIENT}} />
            WORKFLOW IN ACTION
          </div>
        </div>
      ) : null}

      {sending > 0.02 ? (
        <div style={{...glass, position: 'absolute', left: CHAT.x, top: CHAT.y + 36, padding: '10px 20px', borderRadius: 999, fontSize: 22, fontWeight: 700, color: C.tealInk, opacity: sending}}>
          Sending payment link…
        </div>
      ) : null}

      {smsK > 0.02 ? (
        <div
          style={{
            ...glass,
            position: 'absolute',
            left: 86,
            top: 430,
            width: 348,
            padding: '18px 20px 16px',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.97)',
            opacity: smsK,
            transform: `translateY(${(1 - smsK) * 24}px)`,
            zIndex: 8,
          }}
        >
          <div style={{fontSize: 13, fontWeight: 800, letterSpacing: '0.16em', color: C.tealInk}}>MESSAGE</div>
          <div style={{fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 8}}>SATS Import TeleAdvice</div>
          <div style={{fontSize: 17, fontWeight: 500, color: C.sub, marginTop: 8, lineHeight: 1.4}}>
            Storage 2 hours × USD 30 = USD 60. Pay before collection.
          </div>
          <div style={{marginTop: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(62,205,240,0.1)', fontSize: 15, fontWeight: 700, color: C.tealInk, wordBreak: 'break-all'}}>
            https://pay.sats.com.sg/collect/awb-4518
          </div>
        </div>
      ) : null}

      {smsK > 0.4 ? (
        <div
          style={{
            ...glass,
            position: 'absolute',
            left: 86,
            top: 372,
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 18,
            fontWeight: 700,
            color: '#047857',
            opacity: ease(t, L('E7').at + 1.5, L('E7').at + 2.0) * (1 - outcome),
            zIndex: 9,
          }}
        >
          Payment link sent
        </div>
      ) : null}

      {outcome > 0.02 ? (
        <div
          style={{
            ...glass,
            position: 'absolute',
            left: 960,
            bottom: 48,
            transform: `translateX(-50%) translateY(${(1 - outcome) * 16}px)`,
            padding: '14px 28px',
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 700,
            color: C.ink,
            opacity: outcome,
            whiteSpace: 'nowrap',
          }}
        >
          Not available by 15:00 — USD 60 — payment link sent
        </div>
      ) : null}
    </SceneFade>
  );
};
