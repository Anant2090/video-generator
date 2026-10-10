import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile} from 'remotion';
import levels from '../../public/levels.json';
import words from '../../public/words.json';
import {C, clamp, easeInOut, easeOut, glass} from '../brand';
import {CALL, type Field, GREET, GREETINGS, pickup, room, type Speaker, TURN_END, turns} from '../cues';
import {FPS, srcToOut} from '../edit';
import {useTime} from '../time';
import {Backdrop} from '../components/Backdrop';

type W = {text: string; start: number; end: number};
const WORDS = words as W[];
const LV = levels as number[];
const ease = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: easeOut});

const bubbles = turns.map((tr, i) => {
  const end = turns[i + 1]?.at ?? TURN_END;
  return {...tr, words: WORDS.filter((w) => w.start >= tr.at && w.start < end)};
});
const speakerAt = (t: number): Speaker => [...turns].reverse().find((x) => t >= x.at)?.who ?? 'vee';

// ---- top band -------------------------------------------------------------
const TopBand: React.FC<{f: number; t: number}> = ({f, t}) => {
  const secs = Math.max(0, (f - srcToOut(GREET.at)) / FPS);
  const tc = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
  const pulse = 0.55 + 0.45 * Math.sin((t * Math.PI * 2) / 1.6);
  return (
    <>
      <div style={{...glass, position: 'absolute', left: 110, top: 44, display: 'flex', alignItems: 'center', gap: 14, padding: '10px 22px', borderRadius: 999, fontSize: 24, fontWeight: 600}}>
        <span style={{width: 14, height: 14, borderRadius: 7, background: C.cyan, boxShadow: `0 0 0 ${6 * pulse}px ${C.cyan}33`}} />
        <span style={{letterSpacing: '0.08em'}}>LIVE CALL</span>
        <span style={{color: C.sub, fontVariantNumeric: 'tabular-nums'}}>{tc}</span>
      </div>
      <div style={{position: 'absolute', right: 110, top: 48, display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, fontWeight: 600}}>
        <Img src={staticFile('orbit.png')} style={{width: 40, height: 40}} />
        <span>VEE Concierge</span>
        <span style={{color: C.sub, fontWeight: 500}}>· Demo Heritage Hotel</span>
      </div>
    </>
  );
};

const GuestAvatar: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg, #F6D7A7, ${C.amber})`}}>
    <svg width={size} height={size} viewBox="0 0 112 112">
      <circle cx="56" cy="44" r="20" fill="#fff" opacity="0.95" />
      <path d="M18 112c4-26 20-38 38-38s34 12 38 38z" fill="#fff" opacity="0.95" />
    </svg>
  </div>
);

// ---- phone ----------------------------------------------------------------
const PH = {x: 110, y: 140, w: 420, h: 840};
const Phone: React.FC<{t: number}> = ({t}) => {
  const who = speakerAt(t);
  const sf = Math.round(t * FPS);
  const greetK = interpolate(t, [GREET.chipOut - 0.4, GREET.chipOut + 0.2], [1, 0], clamp);
  const gi = Math.min(GREETINGS.length - 1, Math.max(0, Math.floor((t - GREET.at) / ((GREET.settle - GREET.at) / (GREETINGS.length - 1)))));
  const gLocal = (t - GREET.at) % ((GREET.settle - GREET.at) / (GREETINGS.length - 1));
  const gPop = gi === GREETINGS.length - 1 ? ease(t, GREET.settle - 0.05, GREET.settle + 0.35) : ease(gLocal, 0, 0.12);
  const N = 34;
  return (
    <div
      style={{
        position: 'absolute',
        left: PH.x,
        top: PH.y,
        width: PH.w,
        height: PH.h,
        borderRadius: 68,
        background: '#1D1D1F',
        padding: 14,
        boxShadow: '0 60px 120px -50px rgba(15,23,42,0.55), inset 0 0 0 2px #3a3a3c',
      }}
    >
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 56, overflow: 'hidden', background: 'linear-gradient(180deg,#FFFFFF,#F3F6F8)'}}>
        <div style={{position: 'absolute', left: '50%', top: 14, width: 120, height: 34, marginLeft: -60, borderRadius: 20, background: '#1D1D1F'}} />
        <div style={{position: 'absolute', top: 92, width: '100%', textAlign: 'center'}}>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <GuestAvatar size={112} />
          </div>
          <div style={{fontSize: 30, fontWeight: 600, marginTop: 18}}>John Doe</div>
          <div style={{fontSize: 22, color: C.sub, marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>+1 415 555 0123</div>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 18, padding: '8px 16px', borderRadius: 999, background: who === 'vee' ? `${C.cyan}1F` : C.faint, fontSize: 20, fontWeight: 600, color: who === 'vee' ? '#139FC6' : C.sub}}>
            {who === 'vee' ? <Img src={staticFile('vee.png')} style={{width: 26, height: 26, borderRadius: 13}} /> : null}
            {who === 'vee' ? 'VEE is speaking' : 'Guest is speaking'}
          </div>
        </div>
        {/* centre: greeting cycle, then live waveform */}
        <div style={{position: 'absolute', top: 400, left: 0, right: 0, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {greetK > 0 && t < GREET.chipOut + 0.2 ? (
            <div style={{fontSize: 64, fontWeight: 700, letterSpacing: '-0.03em', opacity: greetK * gPop, transform: `translateY(${(1 - gPop) * 14}px) scale(${0.92 + 0.08 * gPop})`, filter: `blur(${(1 - gPop) * 6}px)`}}>
              {GREETINGS[gi]}
            </div>
          ) : null}
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: 1 - greetK}}>
            {Array.from({length: N}, (_, i) => {
              const lv = LV[sf - (N - 1 - i) * 2] ?? 0;
              const h = 6 + lv * 150;
              return (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: h,
                    borderRadius: 3,
                    background: who === 'vee' ? `linear-gradient(180deg, ${C.cyan}, ${C.teal})` : '#B8C2CC',
                    opacity: 0.35 + 0.65 * (i / (N - 1)),
                  }}
                />
              );
            })}
          </div>
        </div>
        {/* controls */}
        <div style={{position: 'absolute', bottom: 64, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 34}}>
          {['speaker', 'mic', 'end'].map((b) => (
            <div key={b} style={{width: 78, height: 78, borderRadius: 39, background: b === 'end' ? '#FF3B30' : '#EEF1F4', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={b === 'end' ? '#fff' : C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {b === 'speaker' ? <path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /> : null}
                {b === 'mic' ? <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3" /> : null}
                {b === 'end' ? <path d="M3 15c5-5 13-5 18 0l-2 3-4-2v-2a10 10 0 0 0-6 0v2l-4 2z" fill="#fff" /> : null}
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Multilingual chip beside the phone while the greeting settles.
const LanguageChip: React.FC<{t: number}> = ({t}) => {
  const k = ease(t, GREET.settle, GREET.settle + 0.5) * interpolate(t, [GREET.chipOut - 0.4, GREET.chipOut], [1, 0], clamp);
  if (k <= 0) return null;
  return (
    <div
      style={{
        ...glass,
        position: 'absolute',
        left: PH.x + PH.w - 40,
        top: PH.y + 470,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 24px',
        borderRadius: 999,
        fontSize: 28,
        fontWeight: 600,
        opacity: k,
        transform: `translateX(${(1 - k) * -20}px)`,
        whiteSpace: 'nowrap',
        zIndex: 5,
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#139FC6" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
      </svg>
      Speaks your guest's language
    </div>
  );
};

// ---- conversation -----------------------------------------------------------
const CHAT = {x: 590, y: 140, w: 600, h: 840};
const Bubble: React.FC<{b: (typeof bubbles)[number]; t: number}> = ({b, t}) => {
  const k = ease(t, b.at, b.at + 0.35);
  const vee = b.who === 'vee';
  const shown = b.words.filter((w) => w.start <= t);
  return (
    <div style={{display: 'flex', flexDirection: vee ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 14, maxHeight: 520 * k, opacity: k, transform: `translateY(${(1 - k) * 18}px)`, flexShrink: 0}}>
      {vee ? <Img src={staticFile('vee.png')} style={{width: 58, height: 58, borderRadius: 29, boxShadow: `0 0 0 3px ${C.cyan}55`, flexShrink: 0}} /> : <GuestAvatar size={58} />}
      <div
        style={{
          ...glass,
          maxWidth: 500,
          padding: '16px 24px 18px',
          borderRadius: 26,
          borderBottomLeftRadius: vee ? 8 : 26,
          borderBottomRightRadius: vee ? 26 : 8,
          background: vee ? 'rgba(232,247,252,0.88)' : 'rgba(255,255,255,0.9)',
          border: vee ? `1px solid ${C.cyan}44` : `1px solid ${C.faint}`,
        }}
      >
        <div style={{fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', color: vee ? '#139FC6' : C.sub, marginBottom: 6}}>{vee ? 'VEE' : 'GUEST'}</div>
        <div style={{fontSize: 29, lineHeight: 1.34, fontWeight: 500, color: C.ink, minHeight: 39}}>
          {shown.map((w, i) => (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span style={{opacity: ease(t, w.start, w.start + 0.12)}}>{w.text}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChatStream: React.FC<{t: number}> = ({t}) => {
  const visible = bubbles.filter((b) => b.at <= t).slice(-5);
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
        maskImage: 'linear-gradient(180deg, transparent 0, black 160px)',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0, black 160px)',
      }}
    >
      {visible.map((b) => (
        <Bubble key={b.at} b={b} t={t} />
      ))}
    </div>
  );
};

// ---- booking cards ----------------------------------------------------------
const CARD = {x: 1240, y: 140, w: 570};
const ROW_H = 82;
const HEAD_H = 104;

const Status: React.FC<{t: number; steps: {at: number; text: string; tone: 'live' | 'done'}[]}> = ({t, steps}) => {
  const s = [...steps].reverse().find((x) => t >= x.at) ?? steps[0];
  const done = s.tone === 'done';
  const k = ease(t, s.at, s.at + 0.4);
  const tick = ease(t, s.at + 0.1, s.at + 0.6);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 999,
        fontSize: 20,
        fontWeight: 700,
        background: done ? C.teal : 'transparent',
        color: done ? '#fff' : '#139FC6',
        border: done ? `1.5px solid ${C.teal}` : `1.5px solid ${C.cyan}88`,
        transform: `scale(${0.9 + 0.1 * k})`,
        whiteSpace: 'nowrap',
      }}
    >
      {done ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5l5 5L20 6.5" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tick} />
        </svg>
      ) : (
        <span style={{width: 8, height: 8, borderRadius: 4, background: C.cyan, opacity: 0.5 + 0.5 * Math.sin(t * 5)}} />
      )}
      {s.text}
    </div>
  );
};

const Row: React.FC<{field: Field; t: number; lit: number; value?: string; badge?: React.ReactNode}> = ({field, t, lit, value, badge}) => {
  const on = t >= field.at;
  const k = ease(t, field.at, field.at + 0.35);
  const flash = interpolate(t, [field.at, field.at + 0.15, field.at + 0.9], [0, 1, 0], clamp);
  const glow = Math.max(flash, lit);
  return (
    <div style={{height: ROW_H, display: 'flex', alignItems: 'center', gap: 18, padding: '0 22px', borderRadius: 16, background: `rgba(62,205,240,${0.12 * glow})`}}>
      <div style={{width: 46, height: 46, borderRadius: 14, background: on ? `${C.cyan}22` : C.faint, color: on ? '#139FC6' : C.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flexShrink: 0}}>
        {field.icon}
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 19, fontWeight: 600, color: C.sub, letterSpacing: '0.02em'}}>{field.label}</div>
        {on ? (
          <div style={{fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap', opacity: k, transform: `translateY(${(1 - k) * 8}px)`, clipPath: `inset(0 ${100 - 100 * k}% 0 0)`}}>
            {value ?? field.value}
          </div>
        ) : (
          <div style={{height: 14, width: 180, marginTop: 10, borderRadius: 7, background: `linear-gradient(90deg, ${C.faint}, rgba(29,29,31,0.04), ${C.faint})`}} />
        )}
      </div>
      {badge}
    </div>
  );
};

const CardShell: React.FC<{title: string; t: number; status: React.ReactNode; height: number; children: React.ReactNode; style?: React.CSSProperties}> = ({title, status, height, children, style}) => (
  <div style={{...glass, background: 'rgba(255,255,255,0.86)', width: CARD.w, height, overflow: 'hidden', padding: '0 10px', ...style}}>
    <div style={{height: HEAD_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 0 22px'}}>
      <div>
        <div style={{fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', color: C.sub}}>DEMO HERITAGE HOTEL</div>
        <div style={{fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2, whiteSpace: 'nowrap'}}>{title}</div>
      </div>
      {status}
    </div>
    <div style={{height: 1, background: C.faint, margin: '0 12px 8px'}} />
    {children}
  </div>
);

const RoomCard: React.FC<{t: number}> = ({t}) => {
  const compact = ease(t, pickup.at - 0.1, pickup.at + 0.6);
  const lit = (row: number) => {
    const hits = room.recap.filter((r) => r.row === row && t >= r.at && t < room.recapEnd);
    return hits.length ? interpolate(t - hits[hits.length - 1].at, [0, 0.15, 1.1], [0, 1, 0.25], clamp) : 0;
  };
  const clarifying = t >= room.clarify.at && t < room.clarify.resolved;
  const resolved = t >= room.clarify.resolved;
  const clarK = ease(t, room.clarify.at, room.clarify.at + 0.3);
  const rooms = room.fields[4];
  const noteK = ease(t, room.note.at, room.note.at + 0.4);
  const fullH = HEAD_H + 9 + ROW_H * 5 + 74;
  const compactH = HEAD_H + 9 + 64;
  return (
    <CardShell title={room.title} t={t} status={<Status t={t} steps={room.status} />} height={lerp(fullH, compactH, compact)}>
      <div style={{position: 'relative'}}>
        <div style={{opacity: 1 - compact}}>
          {room.fields.slice(0, 4).map((fd, i) => (
            <Row key={fd.label} field={fd} t={t} lit={lit(i)} />
          ))}
          <Row
            field={rooms}
            t={t}
            lit={lit(4)}
            value={resolved ? room.clarify.value : rooms.value}
            badge={
              clarifying ? (
                <div style={{padding: '6px 14px', borderRadius: 999, background: `${C.amber}22`, color: '#B26F0E', fontSize: 18, fontWeight: 700, opacity: clarK, whiteSpace: 'nowrap'}}>Clarifying…</div>
              ) : resolved ? (
                <div style={{display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: `${C.teal}26`, color: '#1E8C79', fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap', opacity: ease(t, room.clarify.resolved, room.clarify.resolved + 0.3)}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E8C79" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12.5l5 5L20 6.5" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ease(t, room.clarify.resolved + 0.1, room.clarify.resolved + 0.6)} />
                  </svg>
                  {room.clarify.badge}
                </div>
              ) : null
            }
          />
          <div style={{margin: '10px 22px 0', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, background: `${C.green}2A`, color: '#4C8A1E', fontSize: 20, fontWeight: 600, opacity: noteK, transform: `translateY(${(1 - noteK) * 8}px)`}}>
            ✓ {room.note.text}
          </div>
        </div>
        <div style={{position: 'absolute', top: 0, left: 22, right: 22, height: 56, display: 'flex', alignItems: 'center', fontSize: 26, fontWeight: 600, color: C.ink, opacity: compact}}>
          Oct 1 – 5 · 3 guests · 1 Double + 1 Single
        </div>
      </div>
    </CardShell>
  );
};

const PickupCard: React.FC<{t: number}> = ({t}) => {
  if (t < pickup.at - 0.1) return null;
  const k = ease(t, pickup.at, pickup.at + 0.6);
  return (
    <CardShell
      title={pickup.title}
      t={t}
      status={<Status t={t} steps={pickup.status} />}
      height={HEAD_H + 9 + ROW_H * 5 + 12}
      style={{marginTop: 22, opacity: k, transform: `translateY(${(1 - k) * 40}px)`}}
    >
      {pickup.fields.map((fd) => (
        <Row key={fd.label} field={fd} t={t} lit={0} />
      ))}
    </CardShell>
  );
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Hand-off toast as the call wraps up.
const Complete: React.FC<{t: number}> = ({t}) => {
  const at = 131.6;
  const k = ease(t, at, at + 0.45);
  if (k <= 0) return null;
  return (
    <div
      style={{
        ...glass,
        position: 'absolute',
        left: '50%',
        bottom: 46,
        transform: `translateX(-50%) translateY(${(1 - k) * 24}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 30px',
        borderRadius: 999,
        fontSize: 30,
        fontWeight: 600,
        opacity: k,
        whiteSpace: 'nowrap',
        border: `1.5px solid ${C.teal}66`,
      }}
    >
      <span style={{width: 34, height: 34, borderRadius: 17, background: C.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20}}>✓</span>
      Booking complete · sending to Mews
    </div>
  );
};

export const LiveCall: React.FC = () => {
  const {f, t} = useTime();
  if (t < CALL.in || t > CALL.out + 0.1) return null;
  const k = interpolate(t, [CALL.in, CALL.in + 0.5, CALL.out - 0.5, CALL.out], [0, 1, 1, 0], {...clamp, easing: easeInOut});
  const enter = (d: number) => spring({frame: f - srcToOut(CALL.in) - Math.round(d * FPS), fps: FPS, config: {damping: 200}, durationInFrames: 30});
  const col = (d: number): React.CSSProperties => ({opacity: enter(d), transform: `translateY(${(1 - enter(d)) * 30}px)`});
  return (
    <AbsoluteFill style={{opacity: k, transform: `scale(${1.02 - 0.02 * k})`}}>
      <Backdrop />
      <AbsoluteFill style={col(0.1)}>
        <TopBand f={f} t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={col(0.15)}>
        <Phone t={t} />
        <LanguageChip t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={col(0.3)}>
        <ChatStream t={t} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: CARD.x, top: CARD.y, ...col(0.45)}}>
        <RoomCard t={t} />
        <PickupCard t={t} />
      </div>
      <Complete t={t} />
    </AbsoluteFill>
  );
};
