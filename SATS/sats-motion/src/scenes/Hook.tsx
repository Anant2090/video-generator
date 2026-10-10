import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, clamp, easeInOut, glass} from '../brand';
import {SceneFade} from '../components/Bits';
import {Phone} from '../components/Phone';
import {useTime} from '../time';
import {ease, easeIO, lerp, mark, scene} from '../tl';

const RUNWAY_Y = 720;
const TOUCH = 2.1;
const AS = 1.45; // aircraft scale

const Aircraft: React.FC = () => (
  <svg width="460" height="150" viewBox="0 0 460 150">
    <defs>
      <linearGradient id="fus" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#E4E9EE" />
      </linearGradient>
    </defs>
    {/* tail fin */}
    <path d="M40 66 L14 8 Q12 4 18 4 L44 4 Q48 4 51 8 L104 62 Z" fill="url(#fus)" stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M22 14 L44 14" stroke={C.cyan} strokeWidth="5" strokeLinecap="round" />
    {/* far wing */}
    <path d="M210 66 L262 30 L284 30 L250 68 Z" fill="#E9EEF2" stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    {/* fuselage */}
    <path d="M28 70 Q22 60 40 58 L380 56 Q420 56 446 74 Q452 80 444 84 Q420 96 380 96 L60 96 Q36 96 28 84 Z" fill="url(#fus)" stroke={C.ink} strokeWidth="2.6" strokeLinejoin="round" />
    {/* cheatline */}
    <path d="M60 84 L430 84" stroke="url(#cl)" strokeWidth="4" />
    <defs>
      <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={C.cyan} />
        <stop offset="0.5" stopColor={C.teal} />
        <stop offset="1" stopColor={C.green} />
      </linearGradient>
    </defs>
    {/* windows */}
    {Array.from({length: 22}, (_, i) => (
      <rect key={i} x={110 + i * 12.5} y={66} width={6} height={8} rx={2.5} fill={C.ink} opacity={0.75} />
    ))}
    <path d="M412 64 Q426 64 434 72 L414 72 Z" fill={C.ink} opacity={0.85} />
    {/* stabiliser */}
    <path d="M36 74 L96 74 L58 88 Z" fill="#E9EEF2" stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    {/* near wing + engine */}
    <path d="M196 88 L262 88 L216 134 L190 134 Z" fill="url(#fus)" stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
    <rect x="226" y="98" width="54" height="20" rx="10" fill="#F4F7FA" stroke={C.ink} strokeWidth="2.2" />
    <rect x="272" y="101" width="8" height="14" rx="3" fill={C.ink} opacity={0.8} />
    {/* gear */}
    <path d="M150 96 L150 116 M330 96 L330 116" stroke={C.ink} strokeWidth="3" />
    <circle cx="150" cy="122" r="7" fill={C.ink} />
    <circle cx="330" cy="122" r="7" fill={C.ink} />
  </svg>
);

/** Replica of the canvas "ATA Event" node (purple logic header). */
export const AtaNode: React.FC<{scale?: number}> = ({scale = 1}) => (
  <div style={{width: 260, borderRadius: 14, background: '#fff', boxShadow: '0 24px 60px -24px rgba(76,29,149,0.45), 0 0 0 1px rgba(29,29,31,0.06)', overflow: 'hidden', transform: `scale(${scale})`, transformOrigin: 'center'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'linear-gradient(90deg,#6D28D9,#8B5CF6)', color: '#fff'}}>
      <div style={{width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      </div>
      <div>
        <div style={{fontSize: 17, fontWeight: 700}}>ATA Event</div>
        <div style={{fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: '0.06em'}}>LOGIC</div>
      </div>
    </div>
    <div style={{padding: '12px 14px 6px', fontSize: 13.5, lineHeight: 1.4, color: '#4B5563'}}>Trigger. Accepts awb, consignee, flight, arrival_time, and phone, then starts the outbound call.</div>
    <div style={{display: 'flex', justifyContent: 'space-between', padding: '6px 14px 12px', fontSize: 12.5, fontWeight: 700, color: C.ink}}>
      <span>
        <span style={{color: '#22C55E'}}>●</span> IN 1
      </span>
      <span>
        <span style={{color: C.blue}}>●</span> OUT ◆
      </span>
    </div>
  </div>
);

const FIELDS: [string, string][] = [
  ['AWB', '••• 4518'],
  ['Consignee', 'Tan Freight Logistics'],
  ['Flight', 'from Frankfurt'],
  ['Arrival', '14:32'],
  ['Phone', '+65 •••• ••12'],
];
const FIELD_AT = (i: number) => 4.3 + i * 0.42;

const EventCard: React.FC<{t: number}> = ({t}) => {
  const k = ease(t, 3.9, 4.4);
  const out = easeIO(t, 8.1, 8.9);
  if (k <= 0 || out >= 1) return null;
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <div
      style={{
        ...glass,
        position: 'absolute',
        left: 960,
        top: 520,
        width: 640,
        padding: '26px 34px 22px',
        borderRadius: 28,
        background: 'rgba(255,255,255,0.9)',
        opacity: k * (1 - out),
        transform: `translate(-50%,-50%) translate(${lerp(0, -300, out)}px, 0) scale(${(0.94 + 0.06 * k) * lerp(1, 0.4, out)})`,
        filter: `blur(${out * 6}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
        <div style={{fontSize: 20, fontWeight: 800, letterSpacing: '0.14em', color: C.sub}}>ATA EVENT</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderRadius: 999, background: '#22C55E1A', color: '#15803D', fontSize: 19, fontWeight: 700}}>
          <span style={{width: 10, height: 10, borderRadius: 5, background: '#22C55E', boxShadow: `0 0 0 ${5 * pulse}px #22C55E33`}} />
          Landed
        </div>
      </div>
      {FIELDS.map(([label, value], i) => {
        const at = FIELD_AT(i);
        const chars = Math.round(interpolate(t, [at, at + 0.35], [0, value.length], clamp));
        const rk = ease(t, at - 0.05, at + 0.25);
        return (
          <div key={label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: i ? `1px solid ${C.faint}` : undefined, opacity: 0.35 + 0.65 * rk}}>
            <span style={{fontSize: 24, color: C.sub, fontWeight: 500}}>{label}</span>
            <span style={{fontSize: 28, fontWeight: 650, color: C.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em'}}>
              {value.slice(0, chars)}
              {chars > 0 && chars < value.length ? <span style={{color: C.cyan}}>▍</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const NODE = {x: 620, y: 540};
const PHONE = {x: 1250, y: 540 - 390 * 0.78, s: 0.78};

export const Hook: React.FC = () => {
  const {t} = useTime();
  const s = scene('hook');
  const ring = mark('hook_ring');
  if (t > s.end + 0.1) return null;

  // aircraft: descend, flare, touch down, roll out
  const ax = t < TOUCH ? interpolate(t, [0, TOUCH], [-520, 560]) : 560 + 420 * ease(t, TOUCH, 4.4);
  const ay = t < TOUCH ? interpolate(t, [0, TOUCH], [220, RUNWAY_Y - 129 * AS], {easing: (x) => 1 - (1 - x) ** 1.6}) : RUNWAY_Y - 129 * AS;
  const pitch = t < TOUCH ? interpolate(t, [0, 1.4, TOUCH], [6, 6, -3], clamp) : interpolate(t, [TOUCH, TOUCH + 0.6], [-3, 0], clamp);
  const groundOut = easeIO(t, 3.7, 4.4);
  const dust = ease(t, TOUCH, TOUCH + 1.4);

  const nodeK = ease(t, 8.6, 9.3);
  const wire = easeIO(t, 9.5, 10.3);
  const phoneK = ease(t, 9.3, 9.9);
  const ringK = ease(t, ring, ring + 0.3);
  const wx0 = NODE.x + 195;
  const wx1 = PHONE.x - 6;
  const wy = NODE.y;

  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.6} fadeOut={0.5}>
      {/* ground: runway, aircraft, contrail, dust */}
      <AbsoluteFill style={{opacity: 1 - groundOut, transform: `translateY(${groundOut * 40}px)`}}>
        <div style={{position: 'absolute', left: 0, top: RUNWAY_Y, height: 2, width: `${100 * ease(t, 0.1, 1.4)}%`, background: `linear-gradient(90deg, ${C.ink}00, ${C.ink}55 20%, ${C.ink}55 80%, ${C.ink}00)`}} />
        {Array.from({length: 16}, (_, i) => (
          <div key={i} style={{position: 'absolute', top: RUNWAY_Y + 14, left: ((i * 150 - t * 60) % 2400) - 100, width: 70, height: 4, borderRadius: 2, background: `${C.ink}22`, opacity: ease(t, 0.3 + i * 0.04, 1 + i * 0.04)}} />
        ))}
        <div
          style={{
            position: 'absolute',
            left: ax - 560,
            top: ay + 78 * AS,
            width: 600,
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${C.cyan}00, ${C.cyan}66 60%, ${C.teal}AA)`,
            transform: `rotate(${pitch * 0.4 + 8}deg)`,
            transformOrigin: 'right center',
            opacity: 1 - ease(t, TOUCH - 0.5, TOUCH + 0.1),
            filter: 'blur(1px)',
          }}
        />
        <div style={{position: 'absolute', left: ax, top: ay, transform: `rotate(${-pitch}deg) scale(${AS})`, transformOrigin: '0 0'}}>
          <Aircraft />
        </div>
        {t >= TOUCH
          ? [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 560 + 150 * AS - 40 - i * 26 - dust * (40 + i * 30),
                  top: RUNWAY_Y - 18 - dust * (10 + i * 6),
                  width: 30 + dust * (40 + i * 12),
                  height: 30 + dust * (40 + i * 12),
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(110,110,115,0.28), rgba(110,110,115,0))',
                  opacity: (1 - dust) * 0.9,
                }}
              />
            ))
          : null}
      </AbsoluteFill>

      <EventCard t={t} />

      {/* particles from the card into the node */}
      {t > 8.0 && t < 9.4
        ? Array.from({length: 26}, (_, i) => {
            const a = 8.05 + (i % 9) * 0.05;
            const p = easeIO(t, a, a + 0.75);
            const sx = 960 - 260 + ((i * 97) % 520);
            const sy = 380 + ((i * 53) % 300);
            const ex = NODE.x - 20 + ((i * 13) % 40);
            const ey = NODE.y - 10 + ((i * 7) % 20);
            return <div key={i} style={{position: 'absolute', left: lerp(sx, ex, p), top: lerp(sy, ey, p) - Math.sin(p * Math.PI) * 60, width: 8, height: 8, borderRadius: 4, background: i % 2 ? C.cyan : C.teal, opacity: (p > 0 ? 1 : 0) * (1 - ease(t, a + 0.65, a + 0.8)), boxShadow: `0 0 10px ${C.cyan}`}} />;
          })
        : null}

      {/* node, wire, phone */}
      <div style={{position: 'absolute', left: NODE.x, top: NODE.y, transform: `translate(-50%,-50%) scale(${(0.85 + 0.15 * nodeK) * 1.5})`, opacity: nodeK}}>
        <AtaNode />
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M${wx0},${wy} C${wx0 + 160},${wy} ${wx1 - 160},${wy} ${wx1},${wy}`} pathLength={1} fill="none" stroke={C.cyan} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${wire} 1`} />
        {wire > 0 && wire < 1 ? <circle cx={lerp(wx0, wx1, wire)} cy={wy} r={8} fill="#fff" stroke={C.cyan} strokeWidth={3} style={{filter: `drop-shadow(0 0 8px ${C.cyan})`}} /> : null}
        {wire > 0 ? <circle cx={wx0} cy={wy} r={6} fill={C.blue} /> : null}
      </svg>
      <div style={{opacity: phoneK, transform: `translateY(${(1 - phoneK) * 30}px)`}}>
        <Phone x={PHONE.x} y={PHONE.y} scale={PHONE.s} t={t} state="incoming" title="SATS Import TeleAdvice" subtitle="Notice of Arrival" ringK={ringK} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: NODE.x,
          top: NODE.y + 190,
          transform: 'translateX(-50%)',
          fontSize: 24,
          fontWeight: 600,
          color: C.sub,
          opacity: ease(t, 9.6, 10.2),
          letterSpacing: '0.02em',
        }}
      >
        Arrival recorded · call starts automatically
      </div>
      <AbsoluteFill style={{pointerEvents: 'none', opacity: interpolate(t, [0, 0.6], [1, 0], {...clamp, easing: easeInOut}), background: C.bg}} />
    </SceneFade>
  );
};
