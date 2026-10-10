import React from 'react';
import {C, GRADIENT} from '../brand';

export type PhoneState = 'incoming' | 'active' | 'transfer' | 'ended';

const Icon: React.FC<{d: string; color?: string; size?: number; fill?: string}> = ({d, color = C.ink, size = 30, fill = 'none'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const HANDSET = 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z';

/** Caller avatar: the VOICERAcx orbit-and-wave mark, drawn. */
export const AgentMark: React.FC<{size: number; t: number}> = ({size, t}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: '#fff', boxShadow: `0 0 0 2px ${C.cyan}55, 0 12px 30px -12px rgba(19,159,198,0.6)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <svg width={size * 0.78} height={size * 0.78} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="am" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={C.cyan} />
          <stop offset="0.5" stopColor={C.teal} />
          <stop offset="1" stopColor={C.yellow} />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="44" ry="24" fill="none" stroke="url(#am)" strokeWidth="5" transform="rotate(-30 50 50)" />
      <ellipse cx="50" cy="50" rx="44" ry="24" fill="none" stroke="url(#am)" strokeWidth="5" transform="rotate(30 50 50)" />
      {Array.from({length: 9}, (_, i) => {
        const h = 6 + 26 * Math.abs(Math.sin(i * 1.3 + t * 5)) * (1 - Math.abs(i - 4) / 6);
        return <rect key={i} x={27 + i * 5.6} y={50 - h / 2} width={3} height={h} rx={1.5} fill="url(#am)" />;
      })}
    </svg>
  </div>
);

export const Phone: React.FC<{
  x: number;
  y: number;
  scale?: number;
  t: number;
  state: PhoneState;
  title: string;
  subtitle: string;
  timer?: string;
  speaking?: string | null;
  level?: number;
  ringK?: number;
}> = ({x, y, scale = 1, t, state, title, subtitle, timer, speaking, level = 0, ringK = 0}) => {
  const W = 380;
  const H = 780;
  const shake = state === 'incoming' ? Math.sin(t * 40) * 1.6 * ringK * (Math.sin(t * 6) > 0 ? 1 : 0) : 0;
  const bars = 30;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: W, height: H, transform: `scale(${scale}) rotate(${shake * 0.4}deg)`, transformOrigin: 'top left'}}>
      <div style={{width: W, height: H, borderRadius: 62, background: '#1D1D1F', padding: 12, boxShadow: '0 60px 120px -50px rgba(15,23,42,0.55), inset 0 0 0 2px #3a3a3c'}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 51, overflow: 'hidden', background: 'linear-gradient(180deg,#FFFFFF,#EEF3F6)'}}>
          <div style={{position: 'absolute', left: '50%', top: 12, width: 110, height: 32, marginLeft: -55, borderRadius: 18, background: '#1D1D1F'}} />
          <div style={{position: 'absolute', top: 64, width: '100%', textAlign: 'center', fontSize: 17, fontWeight: 600, color: C.sub, letterSpacing: '0.04em'}}>
            {state === 'incoming' ? 'INCOMING CALL' : state === 'transfer' ? 'TRANSFERRING…' : state === 'ended' ? 'CALL ENDED' : timer}
          </div>
          {/* avatar + ripples */}
          <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <div style={{position: 'relative'}}>
              {state === 'incoming'
                ? [0, 1, 2].map((i) => {
                    const p = ((t * 0.9 + i / 3) % 1 + 1) % 1;
                    return <div key={i} style={{position: 'absolute', left: 60 - 60 * (1 + p * 1.3), top: 60 - 60 * (1 + p * 1.3), width: 120 * (1 + p * 1.3), height: 120 * (1 + p * 1.3), borderRadius: '50%', border: `2px solid ${C.cyan}`, opacity: (1 - p) * 0.6 * ringK}} />;
                  })
                : null}
              <AgentMark size={120} t={state === 'active' && speaking === 'agent' ? t : 0} />
            </div>
          </div>
          <div style={{position: 'absolute', top: 268, width: '100%', textAlign: 'center', padding: '0 24px'}}>
            <div style={{fontSize: 27, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink, lineHeight: 1.15}}>{title}</div>
            <div style={{fontSize: 19, color: C.sub, marginTop: 8}}>{subtitle}</div>
          </div>
          {/* waveform */}
          {state === 'active' || state === 'transfer' ? (
            <div style={{position: 'absolute', top: 400, left: 0, right: 0, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5}}>
              {Array.from({length: bars}, (_, i) => {
                const n = Math.abs(Math.sin(i * 1.7 + t * 9) * Math.cos(i * 0.6 - t * 5.3));
                const env = 1 - Math.abs(i - bars / 2) / (bars / 1.6);
                const h = 5 + level * env * (20 + 110 * n);
                return <div key={i} style={{width: 5, height: h, borderRadius: 3, background: speaking === 'agent' ? GRADIENT : '#AEB8C2'}} />;
              })}
            </div>
          ) : null}
          {state === 'active' && speaking ? (
            <div style={{position: 'absolute', top: 572, width: '100%', display: 'flex', justifyContent: 'center'}}>
              <div style={{padding: '7px 16px', borderRadius: 999, fontSize: 17, fontWeight: 600, background: speaking === 'agent' ? `${C.cyan}1F` : 'rgba(29,29,31,0.06)', color: speaking === 'agent' ? C.tealInk : C.sub}}>
                {speaking === 'agent' ? 'AI agent speaking' : speaking === 'counter' ? 'Import counter' : 'Consignee speaking'}
              </div>
            </div>
          ) : null}
          {/* controls */}
          <div style={{position: 'absolute', bottom: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: state === 'incoming' ? 110 : 30}}>
            {state === 'incoming' ? (
              <>
                <div style={{width: 76, height: 76, borderRadius: 38, background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(135deg)'}}>
                  <Icon d={HANDSET} color="#fff" fill="#fff" />
                </div>
                <div style={{width: 76, height: 76, borderRadius: 38, background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.06 * Math.sin(t * 8) * ringK})`}}>
                  <Icon d={HANDSET} color="#fff" fill="#fff" />
                </div>
              </>
            ) : (
              ['M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14', 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3', 'end'].map((d) => (
                <div key={d} style={{width: 70, height: 70, borderRadius: 35, background: d === 'end' ? '#FF3B30' : '#E7ECF0', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: d === 'end' ? 'rotate(135deg)' : undefined}}>
                  {d === 'end' ? <Icon d={HANDSET} color="#fff" fill="#fff" size={28} /> : <Icon d={d} size={28} />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
