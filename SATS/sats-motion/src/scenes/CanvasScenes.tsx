import React from 'react';
import {C, glass, GRADIENT, gradientText} from '../brand';
import {bottom, CanvasStage, right, top} from '../components/CanvasStage';
import {Callout, Glossary, SceneFade} from '../components/Bits';
import type {Win} from '../components/Screen';
import {useTime} from '../time';
import {ease, easeIO, line, scene, wordAt} from '../tl';

const WIN: Win = {x: 80, y: 140, w: 1760, h: 800};
const FULL = {cx: 931, cy: 422, z: 1};

// ------------------------------------------------------------------ 4: the workflow
export const CanvasTour: React.FC = () => {
  const {t} = useTime();
  const s = scene('canvas');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const b = line('vo4b');
  const c = line('vo4c');
  const d = line('vo4d');
  const e = line('vo4e');
  const w = (k: string, word: string, n = 0) => wordAt(k, word, n);
  const every = w('vo4e', 'every');
  const three = w('vo4c', 'three');

  const keys = [
    {at: s.start, ...FULL, z: 0.96},
    {at: s.start + 0.2, ...FULL, dur: 4},
    {at: b.at - 0.5, cx: 420, cy: 430, z: 1.6, dur: 1.3},
    {at: c.at - 0.4, cx: 700, cy: 470, z: 1.35, dur: 1.2},
    {at: d.at - 0.4, cx: 1010, cy: 300, z: 1.5, dur: 1.2},
    {at: e.at - 0.4, cx: 1020, cy: 590, z: 1.55, dur: 1.2},
    {at: every - 0.3, cx: 1300, cy: 470, z: 1.6, dur: 1.1},
    {at: s.end - 1.4, ...FULL, dur: 1.2},
  ];
  const spots = [
    {from: b.at - 0.4, to: c.at - 0.2, nodes: ['ata', 'noa'] as const},
    {from: c.at - 0.3, to: d.at - 0.2, nodes: ['sup'] as const},
    {from: three - 0.2, to: d.at - 0.2, nodes: ['ship', 'faq', 'esc'] as const},
    {from: d.at - 0.3, to: e.at - 0.2, nodes: ['ship', 'gs', 'awb', 'gfd', 'arr'] as const},
    {from: e.at - 0.3, to: every - 0.1, nodes: ['faq', 'satsfaq'] as const},
    {from: every - 0.2, to: s.end - 1.3, nodes: ['resp', 'gs', 'awb', 'gfd', 'arr', 'satsfaq'] as const},
  ].map((x) => ({...x, nodes: [...x.nodes]}));
  const lit = [
    {id: 'ata' as const, at: w('vo4b', 'A'), until: w('vo4b', 'N')},
    {id: 'noa' as const, at: w('vo4b', 'N'), until: c.at},
    {id: 'sup' as const, at: w('vo4c', 'Supervisor'), until: d.at - 0.2},
    {id: 'ship' as const, at: w('vo4d', 'Shipment', 1), until: e.at - 0.2},
    {id: 'gs' as const, at: w('vo4d', 'status'), until: e.at - 0.2},
    {id: 'awb' as const, at: w('vo4d', 'W'), until: e.at - 0.2},
    {id: 'gfd' as const, at: w('vo4d', 'flight'), until: e.at - 0.2},
    {id: 'arr' as const, at: w('vo4d', 'arrival'), until: e.at - 0.2},
    {id: 'faq' as const, at: w('vo4e', 'Q'), until: every},
    {id: 'satsfaq' as const, at: w('vo4e', 'approved'), until: every},
    {id: 'resp' as const, at: w('vo4e', 'Response'), until: s.end - 1.2},
  ];
  const flows = [
    {edge: 'ata>noa', at: w('vo4b', 'starts', 1) - 0.1},
    {edge: 'noa>sup', at: c.at - 0.2},
    {edge: 'sup>ship', at: three - 0.1},
    {edge: 'sup>faq', at: three + 0.15},
    {edge: 'sup>esc', at: three + 0.4},
    {edge: 'ship>gs', at: w('vo4d', 'status') - 0.2},
    {edge: 'ship>awb', at: w('vo4d', 'W') - 0.2},
    {edge: 'ship>gfd', at: w('vo4d', 'flight') - 0.2},
    {edge: 'ship>arr', at: w('vo4d', 'arrival') - 0.2},
    {edge: 'faq>satsfaq', at: w('vo4e', 'approved') - 0.2},
    ...['gs', 'awb', 'gfd', 'arr', 'satsfaq'].map((n, i) => ({edge: `${n}>resp`, at: w('vo4e', 'delivered') - 0.2 + i * 0.08, dur: 0.7})),
  ];
  const stages: [string, number][] = [
    ['Trigger', 197],
    ['Notify', 413],
    ['Orchestrate', 638],
    ['Specialists', 866],
    ['Tools', 1089],
    ['Respond', 1340],
    ['Record', 1650],
  ];
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.6} fadeOut={0.4}>
      <CanvasStage
        id="tour"
        t={t}
        win={WIN}
        keys={keys}
        spots={spots}
        lit={lit}
        flows={flows}
        overlay={(p) => (
          <>
            {stages.map(([label, x], i) => {
              const at = s.start + 1.0 + i * 0.22;
              const k = ease(t, at, at + 0.4) * (1 - ease(t, b.at - 0.8, b.at - 0.4));
              if (k <= 0) return null;
              const [sx, sy] = p(x, 300);
              return (
                <div key={label} style={{...glass, position: 'absolute', left: sx, top: sy - 4, transform: `translate(-50%,-100%) translateY(${(1 - k) * 12}px)`, opacity: k, padding: '8px 18px', borderRadius: 999, fontSize: 21, fontWeight: 700, color: C.tealInk, letterSpacing: '0.02em', background: 'rgba(255,255,255,0.94)'}}>
                  {label}
                </div>
              );
            })}
            <Callout {...xy(p, top('ata'))} text="Starts the outbound call" t={t} at={w('vo4b', 'trigger')} until={c.at - 0.3} />
            <Callout {...xy(p, bottom('noa'))} up={false} text="Personalised Notice of Arrival" t={t} at={w('vo4b', 'N') + 0.2} until={c.at - 0.3} />
            <Callout {...xy(p, top('sup'))} text="Routes to three paths" t={t} at={w('vo4c', 'routes')} until={d.at - 0.3} />
            <Callout {...xy(p, top('gs'))} text="COSYS-ready integrations" t={t} at={w('vo4d', 'Cosysready') - 0.2} until={e.at - 0.3} dx={-60} />
            <Callout {...xy(p, top('satsfaq'))} text="Approved knowledge only" t={t} at={w('vo4e', 'approved')} until={every - 0.2} />
            <Callout {...xy(p, top('resp'))} text="One voice response" t={t} at={w('vo4e', 'Response')} until={s.end - 1.4} />
          </>
        )}
      />
      <Glossary
        t={t}
        items={[
          {abbr: 'ATA', full: 'Actual Time of Arrival', at: w('vo4b', 'actual'), until: c.at},
          {abbr: 'NOA', full: 'Notice of Arrival', at: w('vo4b', 'N'), until: c.at + 1.5},
          {abbr: 'AWB', full: 'Air Waybill', at: w('vo4d', 'W'), until: e.at},
        ]}
      />
    </SceneFade>
  );
};

const xy = (p: (x: number, y: number) => [number, number], pt: [number, number]) => {
  const [x, y] = p(pt[0], pt[1]);
  return {x, y};
};

// ------------------------------------------------------------------ 7: exceptions
export const Exceptions: React.FC = () => {
  const {t} = useTime();
  const s = scene('exceptions');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const v = line('vo7');
  const w = (word: string) => wordAt('vo7', word);
  const keys = [
    {at: s.start, ...FULL},
    {at: s.start + 0.3, cx: 470, cy: 600, z: 1.6, dur: 1.3},
  ];
  const spots = [{from: s.start + 0.3, to: s.end + 1, nodes: ['noa', 'ans', 'rna', 'gfd2', 'sup'] as ('noa' | 'ans' | 'rna' | 'gfd2' | 'sup')[]}];
  const lit = [
    {id: 'ans' as const, at: w('answered') - 0.2, until: s.end + 1},
    {id: 'rna' as const, at: w('record') - 0.1, until: s.end + 1},
    {id: 'gfd2' as const, at: w('recheck') - 0.1, until: s.end + 1},
    {id: 'sup' as const, at: w('return') - 0.1, until: s.end + 1},
  ];
  const flows = [
    {edge: 'noa>ans', at: w('answered') - 0.5},
    {edge: 'ans>rna', at: w('record') - 0.45},
    {edge: 'rna>gfd2', at: w('recheck') - 0.45},
    {edge: 'gfd2>sup', at: w('return') - 0.45},
  ];
  const badge = ease(t, v.at, v.at + 0.5);
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.5} fadeOut={0.4}>
      <CanvasStage
        id="exc"
        t={t}
        win={WIN}
        keys={keys}
        spots={spots}
        lit={lit}
        flows={flows}
        overlay={(p) => (
          <>
            <Callout {...xy(p, top('gfd2'))} text="Flight re-checked before retry" t={t} at={w('recheck')} until={s.end + 1} dx={90} />
            <Callout {...xy(p, bottom('rna'))} up={false} text="Attempt recorded" t={t} at={w('record')} until={s.end + 1} />
          </>
        )}
      />
      <div style={{...glass, position: 'absolute', right: 160, top: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderRadius: 999, border: `2px solid ${C.amber}`, color: '#B45309', fontSize: 22, fontWeight: 700, opacity: badge, transform: `scale(${0.9 + 0.1 * badge})`, background: 'rgba(255,251,235,0.95)'}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
        Configured path
      </div>
    </SceneFade>
  );
};

// ------------------------------------------------------------------ 8: on record
const OUTCOMES: [string, string][] = [
  ['acknowledged', 'acknowledged'],
  ['declined', 'declined'],
  ['callback', 'callback_requested'],
  ['no', 'no_answer'],
];

const SUMMARY: [string, string, string][] = [
  ['intent', 'Intent', 'Shipment status · piece count · collection documents'],
  ['outcome', 'Outcome', 'Completed'],
  ['acknowledgement', 'Acknowledgement', 'acknowledged'],
  ['next', 'Next action', 'Consignee to collect at the import terminal'],
  ['agents', 'Agents used', 'NOA Agent → Supervisor → Shipment Agent → FAQ Agent'],
  ['summary', 'Summary', 'Consignee confirmed arrival of AWB ••• 4518 (12 pcs, 486 kg) and was advised of the collection documents.'],
];

export const OnRecord: React.FC = () => {
  const {t} = useTime();
  const s = scene('record');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const v = line('vo8');
  const w = (word: string, n = 0) => wordAt('vo8', word, n);
  const ci = w('Intelligence');
  const keys = [
    {at: s.start, ...FULL},
    {at: s.start + 0.2, cx: 1540, cy: 480, z: 1.6, dur: 1.3},
  ];
  const spots = [{from: s.start + 0.2, to: s.end + 1, nodes: ['resp', 'ack', 'final', 'ci'] as ('resp' | 'ack' | 'final' | 'ci')[]}];
  const lit = [
    {id: 'ack' as const, at: w('Record') - 0.1, until: s.end + 1},
    {id: 'final' as const, at: ci - 0.7, until: s.end + 1},
    {id: 'ci' as const, at: ci - 0.2, until: s.end + 1},
  ];
  const flows = [
    {edge: 'resp>ack', at: v.at},
    {edge: 'ack>final', at: ci - 1.0},
    {edge: 'final>ci', at: ci - 0.5},
  ];
  const card = easeIO(t, ci + 0.3, ci + 1.1);
  const fieldAt: Record<string, number> = {
    intent: w('intent'),
    outcome: w('outcome', 0),
    acknowledgement: w('outcome', 0) + 0.5,
    next: w('next'),
    agents: w('agents'),
    summary: w('summary'),
  };
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.4} fadeOut={0.5}>
      <CanvasStage
        id="rec"
        t={t}
        win={WIN}
        keys={keys}
        spots={spots}
        lit={lit}
        flows={flows}
        veilAll={card}
        overlay={(p) => {
          const [ax, ay] = p(...bottom('ack'));
          const [rx] = p(...right('ack'));
          return (
            <div style={{opacity: 1 - card}}>
              {OUTCOMES.map(([word, label], i) => {
                const at = w(word, word === 'no' ? 0 : 0);
                const k = ease(t, at - 0.1, at + 0.35);
                if (k <= 0) return null;
                const keep = i === 0;
                const dim = keep ? 1 : 1 - 0.55 * ease(t, w('Intelligence') - 1.5, w('Intelligence') - 1.0);
                return (
                  <div
                    key={label}
                    style={{
                      position: 'absolute',
                      left: (ax + rx) / 2 - 150 + (i % 2) * 0,
                      top: ay + 26 + i * 58,
                      opacity: k * dim,
                      transform: `translateY(${(1 - k) * -30}px) scale(${0.8 + 0.2 * k})`,
                      padding: '9px 20px',
                      borderRadius: 999,
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
                      background: keep ? '#ECFDF5' : '#fff',
                      color: keep ? '#047857' : C.sub,
                      border: `1.5px solid ${keep ? '#34D399' : 'rgba(29,29,31,0.12)'}`,
                      boxShadow: '0 10px 24px -14px rgba(15,23,42,0.4)',
                    }}
                  >
                    {keep ? '✓ ' : ''}
                    {label}
                  </div>
                );
              })}
            </div>
          );
        }}
      />
      {card > 0 ? (
        <div
          style={{
            ...glass,
            position: 'absolute',
            left: 960,
            top: 545,
            width: 1180,
            padding: '34px 44px 26px',
            borderRadius: 32,
            background: 'rgba(255,255,255,0.97)',
            opacity: card,
            transform: `translate(-50%,-50%) translateY(${(1 - card) * 60}px) scale(${0.96 + 0.04 * card})`,
            boxShadow: '0 50px 120px -40px rgba(15,23,42,0.45)',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 52, height: 52, borderRadius: 16, background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                </svg>
              </div>
              <div>
                <div style={{fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em'}}>Call Intelligence</div>
                <div style={{fontSize: 20, color: C.sub, fontWeight: 500}}>Tan Freight Logistics · AWB ••• 4518 · Notice of Arrival</div>
              </div>
            </div>
            <div style={{padding: '8px 18px', borderRadius: 999, background: '#ECFDF5', color: '#047857', fontSize: 20, fontWeight: 700, border: '1.5px solid #34D399'}}>✓ Completed</div>
          </div>
          {SUMMARY.map(([key, label, value], i) => {
            const at = fieldAt[key];
            const k = ease(t, at - 0.15, at + 0.35);
            const glow = Math.max(0, 1 - Math.abs(t - at - 0.6) / 1.2);
            return (
              <div key={key} style={{display: 'flex', alignItems: 'baseline', gap: 28, padding: '15px 18px', borderTop: i ? `1px solid ${C.faint}` : undefined, borderRadius: 14, background: `rgba(62,205,240,${0.08 * glow * k})`}}>
                <div style={{width: 230, flexShrink: 0, fontSize: 21, fontWeight: 700, color: C.sub, letterSpacing: '0.02em', textTransform: 'uppercase'}}>{label}</div>
                <div style={{fontSize: key === 'summary' ? 25 : 27, fontWeight: key === 'summary' ? 500 : 600, color: C.ink, opacity: k, transform: `translateX(${(1 - k) * 16}px)`, lineHeight: 1.35}}>
                  {key === 'acknowledgement' ? <span style={{fontFamily: 'ui-monospace, Menlo, Consolas, monospace', color: '#047857'}}>{value}</span> : key === 'agents' ? <span style={gradientText}>{value}</span> : value}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </SceneFade>
  );
};
