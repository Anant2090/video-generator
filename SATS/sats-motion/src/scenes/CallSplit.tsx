import React from 'react';
import {C, glass, GRADIENT} from '../brand';
import {bottom, CanvasStage, type Flow, type Lit, right, top} from '../components/CanvasStage';
import {Callout, Chip, SceneFade, Words} from '../components/Bits';
import {FlexDesk} from '../components/FlexDesk';
import {Phone, type PhoneState} from '../components/Phone';
import type {Key, Win} from '../components/Screen';
import type {NodeId} from '../canvas';
import {useTime} from '../time';
import {ease, isSpeaking, line, mark, scene, shownWords} from '../tl';

const WIN: Win = {x: 860, y: 140, w: 980, h: 800};
const PHONE = {x: 70, y: 150, s: 0.98};
const CHAT = {x: 470, y: 150, w: 360, h: 790};

type Turn = {id: string; who: 'agent' | 'consignee' | 'counter'};

// ---------------------------------------------------------------- transcript
const Bubble: React.FC<{id: string; t: number}> = ({id, t}) => {
  const l = line(id);
  const agent = l.who === 'agent';
  const k = ease(t, l.at - 0.1, l.at + 0.3);
  const words = shownWords(id);
  const label = agent ? 'AI AGENT' : l.who === 'counter' ? 'IMPORT COUNTER' : 'CONSIGNEE';
  return (
    <div style={{alignSelf: agent ? 'flex-start' : 'flex-end', maxWidth: CHAT.w, opacity: k, transform: `translateY(${(1 - k) * 16}px)`, flexShrink: 0}}>
      <div style={{fontSize: 14, fontWeight: 800, letterSpacing: '0.1em', color: agent ? C.tealInk : C.sub, marginBottom: 6, textAlign: agent ? 'left' : 'right'}}>{label}</div>
      <div
        style={{
          ...glass,
          padding: '13px 18px 14px',
          borderRadius: 22,
          borderTopLeftRadius: agent ? 6 : 22,
          borderTopRightRadius: agent ? 22 : 6,
          background: agent ? 'rgba(232,248,252,0.95)' : 'rgba(255,255,255,0.96)',
          border: agent ? `1px solid ${C.cyan}55` : `1px solid ${C.faint}`,
          fontSize: 23,
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
        gap: 18,
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

const speakerAt = (turns: Turn[], t: number) => turns.find((x) => isSpeaking(x.id, t))?.who ?? null;

const fmt = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

// ---------------------------------------------------------------- helpers to script the canvas
type Beat = {at: number; nodes: NodeId[]; until: number};
const litFrom = (beats: Beat[]): Lit[] => beats.flatMap((b) => b.nodes.map((id) => ({id, at: b.at, until: b.until})));

// ---------------------------------------------------------------- 5: Call A
const A: Turn[] = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11'].map((id) => ({id, who: line(id).who as Turn['who']}));

export const CallA: React.FC = () => {
  const {t} = useTime();
  const s = scene('call');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const L = (id: string) => line(id);
  const trig = mark('trigger');
  const ring = mark('ringA');
  const pick = mark('pickupA');
  const hang = mark('hangupA');
  const tool = (q: string, a: string) => ({q: L(q).end, a: L(a).at});

  const t5 = tool('A4', 'A5');
  const t7 = tool('A6', 'A7');
  const t9 = tool('A8', 'A9');
  const beats: Beat[] = [
    {at: trig, nodes: ['ata'], until: pick + 0.5},
    {at: trig + 0.6, nodes: ['noa'], until: L('A3').end + 0.2},
    {at: L('A4').at, nodes: ['sup'], until: t5.a},
    {at: t5.q + 0.1, nodes: ['ship'], until: L('A5').end},
    {at: t5.q + 0.45, nodes: ['gs'], until: L('A5').end},
    {at: t5.a, nodes: ['resp'], until: L('A5').end + 0.2},
    {at: L('A6').at, nodes: ['sup'], until: t7.a},
    {at: t7.q + 0.1, nodes: ['ship'], until: L('A7').end},
    {at: t7.q + 0.45, nodes: ['awb'], until: L('A7').end},
    {at: t7.a, nodes: ['resp'], until: L('A7').end + 0.2},
    {at: L('A8').at, nodes: ['sup'], until: t9.a},
    {at: t9.q + 0.1, nodes: ['faq'], until: L('A9').end},
    {at: t9.q + 0.45, nodes: ['satsfaq'], until: L('A9').end},
    {at: t9.a, nodes: ['resp'], until: L('A9').end + 0.2},
    {at: L('A10').at, nodes: ['sup'], until: L('A11').at},
    {at: L('A11').at, nodes: ['ack'], until: s.end + 1},
    {at: hang, nodes: ['final', 'ci'], until: s.end + 1},
  ];
  const flows: Flow[] = [
    {edge: 'ata>noa', at: trig + 0.3},
    {edge: 'noa>sup', at: L('A4').at - 0.3},
    {edge: 'sup>ship', at: t5.q},
    {edge: 'ship>gs', at: t5.q + 0.35},
    {edge: 'gs>resp', at: t5.a - 0.3},
    {edge: 'sup>ship', at: t7.q},
    {edge: 'ship>awb', at: t7.q + 0.35},
    {edge: 'awb>resp', at: t7.a - 0.3},
    {edge: 'sup>faq', at: t9.q},
    {edge: 'faq>satsfaq', at: t9.q + 0.35},
    {edge: 'satsfaq>resp', at: t9.a - 0.3},
    {edge: 'resp>ack', at: L('A11').at - 0.2},
    {edge: 'ack>final', at: hang},
    {edge: 'final>ci', at: hang + 0.45},
  ];
  // camera follows the conversation across the canvas
  const keys: Key[] = [
    {at: s.start, cx: 420, cy: 430, z: 1.85},
    {at: L('A4').at - 0.6, cx: 760, cy: 400, z: 1.85},
    {at: t5.q - 0.2, cx: 1000, cy: 330, z: 1.85},
    {at: L('A8').at - 0.3, cx: 1000, cy: 500, z: 1.85},
    {at: L('A11').at - 0.4, cx: 1450, cy: 470, z: 1.85},
  ];
  const state: PhoneState = t < pick ? 'incoming' : t < hang ? 'active' : 'ended';
  const who = speakerAt(A, t);
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.6} fadeOut={0.4}>
      <SplitLayout
        t={t}
        state={state}
        timer={fmt(Math.max(0, t - pick))}
        speaking={who}
        ringK={t >= ring ? ease(t, ring, ring + 0.3) * (1 - ease(t, pick - 0.2, pick)) : 0}
        turns={A}
        from={L('A1').at}
        keys={keys}
        lit={litFrom(beats)}
        flows={flows}
        id="callA"
        overlay={(p) => (
          <>
            <ChipAt p={p} node="ata" t={t} at={trig + 0.2} until={pick + 0.6} side="top">
              <Dot /> ATA event received
            </ChipAt>
            <ChipAt p={p} node="gs" t={t} at={t5.q + 0.7} until={L('A6').at} side="right">
              Status → Ready for collection
            </ChipAt>
            <ChipAt p={p} node="awb" t={t} at={t7.q + 0.7} until={L('A8').at} side="right">
              12 pcs · 486 kg
            </ChipAt>
            <ChipAt p={p} node="satsfaq" t={t} at={t9.q + 0.7} until={L('A10').at} side="right">
              Source: SATS FAQ
            </ChipAt>
            <ChipAt p={p} node="ack" t={t} at={L('A11').at + 1.2} until={s.end + 1} side="top">
              ✓ acknowledged
            </ChipAt>
            <ChipAt p={p} node="ci" t={t} at={hang + 0.7} until={s.end + 1} side="bottom" tone="ink">
              Summary saved
            </ChipAt>
          </>
        )}
      />
    </SceneFade>
  );
};

// ---------------------------------------------------------------- 6: Calls B and C
const B: Turn[] = ['B1', 'B2', 'B3'].map((id) => ({id, who: line(id).who as Turn['who']}));
const Cc: Turn[] = ['C1', 'C2'].map((id) => ({id, who: line(id).who as Turn['who']}));

export const Handoffs: React.FC = () => {
  const {t} = useTime();
  const s = scene('handoffs');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const L = (id: string) => line(id);
  const callB = mark('callB');
  const ringB = mark('ringB');
  const callC = mark('callC');
  const hangC = mark('hangupC');
  const inC = t >= callC;
  const beats: Beat[] = [
    {at: L('B1').at, nodes: ['sup'], until: L('B2').at + 0.4},
    {at: L('B1').end + 0.2, nodes: ['esc'], until: callC},
    {at: L('B2').at + 1.6, nodes: ['xfer'], until: callC},
    {at: L('C1').at, nodes: ['sup'], until: L('C2').at + 0.3},
    {at: L('C2').at, nodes: ['ack'], until: s.end + 1},
  ];
  const flows: Flow[] = [
    {edge: 'sup>esc', at: L('B1').end},
    {edge: 'esc>xfer', at: L('B2').at + 1.3},
    {edge: 'resp>ack', at: L('C2').at - 0.1},
  ];
  const keys: Key[] = [
    {at: s.start, cx: 880, cy: 620, z: 1.8},
    {at: callC - 0.2, cx: 1300, cy: 470, z: 1.8},
  ];
  const turns = inC ? Cc : B;
  const state: PhoneState = t < callB ? 'ended' : !inC && t >= ringB && t < L('B3').at ? 'transfer' : t >= hangC ? 'ended' : 'active';
  const who = speakerAt(turns, t);
  const tag = (at: number, until: number, text: string) => {
    const k = ease(t, at, at + 0.4) * (1 - ease(t, until - 0.3, until));
    return k > 0 ? (
      <div style={{...glass, position: 'absolute', left: CHAT.x, top: CHAT.y + 40, transform: `translateY(${(1 - k) * -10}px)`, opacity: k, padding: '10px 20px', borderRadius: 999, fontSize: 22, fontWeight: 700, color: C.tealInk, whiteSpace: 'nowrap'}}>{text}</div>
    ) : null;
  };
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.4} fadeOut={0.4}>
      <SplitLayout
        t={t}
        state={state}
        timer={fmt(Math.max(0, t - (inC ? callC : callB)) + (inC ? 21 : 48))}
        speaking={who}
        title={inC ? 'SATS Import TeleAdvice' : !inC && t >= L('B3').at ? 'Import counter' : 'SATS Import TeleAdvice'}
        subtitle={!inC && t >= L('B3').at ? 'Transferred with context' : 'Notice of Arrival'}
        turns={turns}
        from={inC ? L('C1').at : L('B1').at}
        keys={keys}
        lit={litFrom(beats)}
        flows={flows}
        id="handoffs"
        hideCanvas={!inC && t >= ringB - 0.05 && t < L('B3').end + 0.35}
        overlay={(p) => (
          <>
            <Callout {...xyOf(p, top('xfer'))} text="Context handed over" t={t} at={L('B2').at + 2.0} until={ringB} />
            <ChipAt p={p} node="ack" t={t} at={L('C2').at + 1.2} until={s.end + 1} side="top" tone="amber">
              callback_requested
            </ChipAt>
          </>
        )}
      />
      {!inC ? <FlexDesk t={t} at={ringB} until={L('B3').end + 0.35} /> : null}
      {tag(callB - 0.3, callC, 'Another call · asks for a person')}
      {tag(callC + 0.2, s.end, 'Another call · asks for a callback')}
    </SceneFade>
  );
};

const D_IDS = ['D1', 'D2', 'D3', 'D4', 'D5'] as const;

export const CallD: React.FC = () => {
  const {t} = useTime();
  const s = scene('pickup');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const L = (id: string) => line(id);
  const ring = mark('ringD');
  const pick = mark('pickupD');
  const hang = mark('hangupD');
  const sms = mark('smsD');
  const D: Turn[] = D_IDS.map((id) => ({id, who: L(id).who as Turn['who']}));
  const sending = ease(t, sms, sms + 0.35) * (1 - ease(t, L('D5').at - 0.15, L('D5').at + 0.2));
  const smsK = ease(t, L('D5').at + 0.4, L('D5').at + 1.0);
  const outcome = ease(t, hang + 0.3, hang + 0.9) * (1 - ease(t, s.end - 0.5, s.end));
  const titleK = 1 - ease(t, ring - 0.35, ring + 0.25);

  const beats: Beat[] = [
    {at: ring, nodes: ['ata'], until: L('D1').end + 0.2},
    {at: ring + 0.5, nodes: ['noa'], until: L('D1').end + 0.2},
    {at: L('D1').at, nodes: ['arr'], until: L('D2').at},
    {at: L('D2').at, nodes: ['sup'], until: L('D3').at},
    {at: L('D3').at, nodes: ['faq'], until: L('D5').at},
    {at: L('D3').at + 0.4, nodes: ['satsfaq'], until: L('D5').at},
    {at: L('D3').at + 0.8, nodes: ['resp'], until: L('D4').end},
    {at: L('D5').at, nodes: ['ack'], until: s.end + 1},
    {at: hang, nodes: ['final', 'ci'], until: s.end + 1},
  ];
  const flows: Flow[] = [
    {edge: 'ata>noa', at: ring + 0.3},
    {edge: 'noa>sup', at: L('D2').at - 0.2},
    {edge: 'sup>faq', at: L('D3').at},
    {edge: 'faq>satsfaq', at: L('D3').at + 0.35},
    {edge: 'satsfaq>resp', at: L('D3').at + 0.7},
    {edge: 'resp>ack', at: L('D5').at - 0.15},
    {edge: 'ack>final', at: hang},
    {edge: 'final>ci', at: hang + 0.4},
  ];
  const keys: Key[] = [
    {at: s.start, cx: 420, cy: 430, z: 1.75},
    {at: L('D2').at - 0.3, cx: 760, cy: 430, z: 1.75},
    {at: L('D3').at - 0.2, cx: 1020, cy: 560, z: 1.8},
    {at: L('D5').at - 0.3, cx: 1500, cy: 480, z: 1.8},
  ];
  const state: PhoneState = t < pick ? 'incoming' : t < hang ? 'active' : 'ended';
  const who = speakerAt(D, t);

  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.45} fadeOut={0.4}>
      {titleK > 0.02 ? (
        <div style={{position: 'absolute', inset: 0, opacity: titleK, pointerEvents: 'none'}}>
          <div
            style={{
              position: 'absolute',
              left: 960,
              top: 430,
              transform: 'translate(-50%,-50%)',
              textAlign: 'center',
              width: 1400,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '8px 18px',
                borderRadius: 999,
                background: 'rgba(62,205,240,0.14)',
                color: C.tealInk,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '0.14em',
                marginBottom: 22,
              }}
            >
              SCENARIO 6
            </div>
            <div style={{fontWeight: 800, letterSpacing: '-0.04em', color: C.ink, marginTop: 8}}>
              <Words text="Scenario 6: Shipment Arrival — *Pickup Deadline & Payment*" local={t - s.start - 0.25} size={56} stagger={0.06} />
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 500,
                color: C.sub,
                marginTop: 28,
                lineHeight: 1.4,
                opacity: ease(t, s.start + 1.1, s.start + 1.7),
              }}
            >
              The AI agent proactively calls the consignee: the shipment has arrived
              <br />
              and should be collected before 3:00 p.m. today.
            </div>
          </div>
        </div>
      ) : null}

      {t >= ring - 0.5 ? (
        <div style={{opacity: ease(t, ring - 0.2, ring + 0.45)}}>
          <SplitLayout
            t={t}
            state={state}
            timer={fmt(Math.max(0, t - pick))}
            speaking={who}
            ringK={t >= ring ? ease(t, ring, ring + 0.3) * (1 - ease(t, pick - 0.2, pick)) : 0}
            subtitle="Pickup deadline"
            turns={D}
            from={L('D1').at}
            keys={keys}
            lit={litFrom(beats)}
            flows={flows}
            id="callD"
            overlay={(p) => (
              <>
                <ChipAt p={p} node="ata" t={t} at={ring + 0.2} until={L('D1').end} side="top">
                  <Dot /> Outbound call
                </ChipAt>
                <ChipAt p={p} node="arr" t={t} at={L('D1').at + 1.2} until={L('D3').at} side="right">
                  Ready for collection · by 15:00
                </ChipAt>
                <ChipAt p={p} node="satsfaq" t={t} at={L('D3').at + 1.0} until={L('D5').at} side="right">
                  Source: SATS FAQ · amount to be confirmed
                </ChipAt>
                <ChipAt p={p} node="ack" t={t} at={L('D5').at + 1.0} until={s.end + 1} side="top" tone="amber">
                  follow-up recorded
                </ChipAt>
              </>
            )}
          />
        </div>
      ) : null}

      {sending > 0.02 ? (
        <div
          style={{
            ...glass,
            position: 'absolute',
            left: CHAT.x,
            top: CHAT.y + 36,
            padding: '10px 20px',
            borderRadius: 999,
            fontSize: 22,
            fontWeight: 700,
            color: C.tealInk,
            opacity: sending,
          }}
        >
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
            transform: `translateY(${(1 - smsK) * 28}px)`,
            boxShadow: '0 24px 50px -28px rgba(15,23,42,0.45)',
            zIndex: 8,
          }}
        >
          <div style={{fontSize: 13, fontWeight: 800, letterSpacing: '0.16em', color: C.tealInk}}>MESSAGE</div>
          <div style={{fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 8}}>SATS Import TeleAdvice</div>
          <div style={{fontSize: 17, fontWeight: 500, color: C.sub, marginTop: 8, lineHeight: 1.4}}>
            Your shipment is ready for collection before 3:00 p.m. today. Review applicable charges before paying.
          </div>
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(62,205,240,0.1)',
              fontSize: 15,
              fontWeight: 700,
              color: C.tealInk,
              wordBreak: 'break-all',
            }}
          >
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
            opacity: ease(t, L('D5').at + 1.6, L('D5').at + 2.1) * (1 - outcome),
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
          Customer not available — payment link sent — follow-up recorded
        </div>
      ) : null}
    </SceneFade>
  );
};

const xyOf = (p: (x: number, y: number) => [number, number], pt: [number, number]) => {
  const [x, y] = p(pt[0], pt[1]);
  return {x, y};
};

// ---------------------------------------------------------------- shared layout
const Dot: React.FC = () => <span style={{width: 10, height: 10, borderRadius: 5, background: '#22C55E', display: 'inline-block'}} />;

const ChipAt: React.FC<{
  p: (x: number, y: number) => [number, number];
  node: NodeId;
  t: number;
  at: number;
  until: number;
  side: 'right' | 'top' | 'bottom';
  tone?: 'teal' | 'amber' | 'ink';
  children: React.ReactNode;
}> = ({p, node, t, at, until, side, tone, children}) => {
  const [x, y] = p(...(side === 'right' ? right(node) : side === 'top' ? top(node) : bottom(node)));
  const ox = side === 'right' ? 14 : -70;
  const oy = side === 'top' ? -30 : side === 'bottom' ? 30 : 0;
  return (
    <Chip x={Math.min(x + ox, WIN.x + WIN.w - 330)} y={y + oy} t={t} at={at} until={until} tone={tone}>
      {children}
    </Chip>
  );
};

const SplitLayout: React.FC<{
  t: number;
  state: PhoneState;
  timer: string;
  speaking: string | null;
  ringK?: number;
  title?: string;
  subtitle?: string;
  turns: Turn[];
  from: number;
  keys: Key[];
  lit: Lit[];
  flows: Flow[];
  id: string;
  overlay: (p: (x: number, y: number) => [number, number]) => React.ReactNode;
  hideCanvas?: boolean;
}> = ({t, state, timer, speaking, ringK = 0, title = 'SATS Import TeleAdvice', subtitle = 'Notice of Arrival', turns, from, keys, lit, flows, id, overlay, hideCanvas = false}) => {
  const level = speaking ? 0.55 + 0.45 * Math.abs(Math.sin(t * 7.3)) : 0.04;
  return (
    <>
      <Phone x={PHONE.x} y={PHONE.y} scale={PHONE.s} t={t} state={state} title={title} subtitle={subtitle} timer={timer} speaking={speaking} level={level} ringK={ringK} />
      <Transcript turns={turns} t={t} from={from} />
      {hideCanvas ? null : (
        <>
          <CanvasStage
            id={id}
            t={t}
            win={WIN}
            keys={keys}
            lit={lit}
            flows={flows}
            spots={[{from: -10, to: 9999, nodes: []}, ...lit.map((l) => ({from: l.at - 0.1, to: l.until + 0.3, nodes: [l.id]}))]}
            overlay={(p) => overlay(p)}
          />
          <div style={{position: 'absolute', left: WIN.x, top: WIN.y - 52, display: 'flex', alignItems: 'center', gap: 12, fontSize: 21, fontWeight: 700, color: C.sub, letterSpacing: '0.04em'}}>
            <span style={{width: 10, height: 10, borderRadius: 5, background: GRADIENT}} />
            WORKFLOW IN ACTION
          </div>
        </>
      )}
    </>
  );
};
