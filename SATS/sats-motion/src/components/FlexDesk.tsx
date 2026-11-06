import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, glass} from '../brand';
import {ease} from '../tl';

const WIN = {x: 860, y: 140, w: 980, h: 800};

const HISTORY: {at: number; who: 'ai' | 'cust' | 'sys'; text: string}[] = [
  {at: 0.15, who: 'ai', text: 'Notice of arrival · AWB 4518 · Frankfurt 14:32'},
  {at: 0.5, who: 'ai', text: 'Status: ready for collection · 12 pcs · 486 kg'},
  {at: 0.95, who: 'cust', text: 'Can I speak to someone at the counter?'},
  {at: 1.4, who: 'sys', text: 'Transferred with AWB and conversation context'},
];

export const FlexDesk: React.FC<{t: number; at: number; until: number}> = ({t, at, until}) => {
  const k = ease(t, at, at + 0.35) * (1 - ease(t, until - 0.3, until));
  if (k < 0.02) return null;
  const local = t - at;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: WIN.x,
          top: WIN.y - 52,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 21,
          fontWeight: 700,
          color: C.sub,
          letterSpacing: '0.04em',
          opacity: k,
        }}
      >
        <span style={{width: 10, height: 10, borderRadius: 5, background: '#226CF2'}} />
        AGENT DESKTOP · CONTEXT HANDED OVER
      </div>
      <div
        style={{
          position: 'absolute',
          left: WIN.x,
          top: WIN.y,
          width: WIN.w,
          height: WIN.h,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 40px 80px -40px rgba(15,23,42,0.45)',
          opacity: k,
          transform: `translateY(${(1 - k) * 18}px)`,
          background: '#fff',
        }}
      >
        <Img src={staticFile('flex.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill'}} />

        <div style={{position: 'absolute', left: '6.2%', top: 52, width: '19.8%', bottom: 42, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 10px 12px'}}>
          <div style={{fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 14}}>Tasks</div>
          <div
            style={{
              ...glass,
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(34,108,242,0.35)',
              background: 'rgba(239,246,255,0.96)',
              opacity: ease(t, at + 0.2, at + 0.45),
            }}
          >
            <div style={{fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#226CF2'}}>LIVE TASK</div>
            <div style={{fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 4, lineHeight: 1.3}}>Inbound transfer · AWB 4518</div>
            <div style={{fontSize: 12, color: C.sub, marginTop: 4}}>Tan Freight · Daniel</div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '26.2%',
            top: 52,
            width: '44.8%',
            bottom: 42,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '14px 14px 10px',
          }}
        >
          <div style={{fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: '#226CF2'}}>CONVERSATION HISTORY</div>
          {HISTORY.map((h, i) => {
            const hk = ease(t, at + h.at, at + h.at + 0.26);
            if (hk < 0.02) return null;
            const mine = h.who === 'cust';
            const sys = h.who === 'sys';
            return (
              <div
                key={i}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                  opacity: hk,
                  transform: `translateY(${(1 - hk) * 10}px)`,
                  padding: '8px 11px',
                  borderRadius: 13,
                  background: sys ? 'rgba(34,108,242,0.08)' : mine ? '#EEF2F7' : 'rgba(232,248,252,0.95)',
                  border: sys ? '1px solid rgba(34,108,242,0.25)' : `1px solid ${C.faint}`,
                  fontSize: 14,
                  fontWeight: 550,
                  lineHeight: 1.35,
                  color: sys ? '#1D4ED8' : C.ink,
                }}
              >
                {h.text}
              </div>
            );
          })}
          {local > 2.2 ? (
            <div style={{...glass, marginTop: 4, padding: '7px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, color: '#047857', alignSelf: 'flex-start'}}>
              Live with import counter
            </div>
          ) : null}
        </div>

        <div
          style={{
            position: 'absolute',
            left: '71.2%',
            top: 52,
            width: '27.6%',
            bottom: 42,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '22px 12px 12px',
            opacity: ease(t, at + 0.35, at + 0.65),
          }}
        >
          <div style={{fontSize: 16, fontWeight: 800, color: C.ink, textAlign: 'center', marginBottom: 6}}>Customer 360</div>
          {[
            ['Consignee', 'Daniel · Tan Freight'],
            ['AWB', '4518'],
            ['Status', 'Ready for collection'],
            ['Pieces / weight', '12 pcs · 486 kg'],
          ].map(([label, value]) => (
            <div key={label} style={{padding: '8px 10px', borderRadius: 10, background: '#F8FAFC', border: `1px solid ${C.faint}`}}>
              <div style={{fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: C.sub}}>{label.toUpperCase()}</div>
              <div style={{fontSize: 14, fontWeight: 650, color: C.ink, marginTop: 3}}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
