import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {fontFamily} from '../brand';
import CUES from './cues.json';

export const HOTEL_FPS = CUES.fps;
export const HOTEL_FRAMES = CUES.frames;

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const fade = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: ease});

type Line = {id: string; who: string; text: string; at: number; dur: number};
const lines = CUES.lines as Line[];
const M = CUES.marks;
const line = (id: string) => lines.find((l) => l.id === id)!;
const SMS_AT = line('g6').at + line('g6').dur + 0.2;

/** Phone screen is the entire 9:16 frame. No backdrop around it. */
const PHONE = {x: 0, y: 0, w: 1080, h: 1920};

type Shot = 'home' | 'coupons' | 'garden' | 'homeOn' | 'sms' | 'end';

const shotAt = (t: number): Shot => {
  if (t >= M.end) return 'end';
  if (t >= SMS_AT) return 'sms';
  if (t >= M.banner) return 'homeOn';
  if (t >= M.gardenIn) return 'garden';
  if (t >= M.couponsIn) return 'coupons';
  return 'home';
};

const Cursor: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  const k = fade(t, at - 1.05, at - 0.85) * (1 - fade(t, at + 0.55, at + 0.85));
  if (k < 0.02) return null;
  const travel = fade(t, at - 0.95, at - 0.08);
  const cx = x + 280 * (1 - travel);
  const cy = y + 360 * (1 - travel);
  const press = t >= at && t < at + 0.18 ? 0.82 : 1;
  return (
    <div style={{position: 'absolute', left: cx, top: cy, opacity: k, zIndex: 8, transform: `scale(${press})`, transformOrigin: '0 0'}}>
      {t >= at && t < at + 0.45 ? (
        <div
          style={{
            position: 'absolute',
            left: -28,
            top: -28,
            width: 72,
            height: 72,
            borderRadius: 36,
            border: '5px solid #3ECDF0',
            opacity: 1 - (t - at) / 0.45,
            transform: `scale(${1 + (t - at) * 2.2})`,
          }}
        />
      ) : null}
      <svg width="78" height="78" viewBox="0 0 24 24" style={{filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.45))'}}>
        <path d="M4 2 L4 20 L9.2 14.8 L13.2 22 L16.2 20.4 L12.1 13.2 L19 13.2 Z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const Ring: React.FC<{t: number; show: number; box: {l: string; tp: string; w: string; h: string}}> = ({t, show, box}) => {
  if (show < 0.02) return null;
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 7));
  return (
    <div
      style={{
        position: 'absolute',
        left: box.l,
        top: box.tp,
        width: box.w,
        height: box.h,
        borderRadius: 26,
        boxShadow: `0 0 0 6px rgba(62,205,240,${pulse}), 0 0 28px rgba(62,205,240,0.85)`,
        background: `rgba(62,205,240,${0.18 * show})`,
        opacity: show,
        zIndex: 4,
      }}
    />
  );
};

const Bubble: React.FC<{line: Line; t: number}> = ({line: row, t}) => {
  const k = fade(t, row.at, row.at + 0.2);
  if (k < 0.02) return null;
  const words = row.text.split(' ');
  const n = Math.max(1, Math.ceil(Math.min(1, (t - row.at) / Math.max(0.2, row.dur * 0.92)) * words.length));
  const mine = row.who === 'guest';
  return (
    <div style={{opacity: k, display: 'flex', gap: 10, alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start'}}>
      {mine ? null : (
        <Img src={staticFile('hotel/vee.png')} style={{width: 54, height: 54, borderRadius: 27, objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 3px #3ECDF0'}} />
      )}
      <div style={{maxWidth: 760, padding: '12px 16px', borderRadius: 18, background: mine ? 'rgba(255,255,255,0.96)' : 'rgba(232,248,252,0.97)', border: mine ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(62,205,240,0.5)', fontSize: 26, fontWeight: 650, lineHeight: 1.25, color: '#1D1D1F'}}>
        <div style={{fontSize: 13, fontWeight: 800, letterSpacing: '0.12em', color: mine ? '#6E6E73' : '#139FC6', marginBottom: 4}}>{mine ? 'GUEST' : 'VEE'}</div>
        {words.map((w, i) => (
          <span key={i} style={{opacity: i < n ? 1 : 0.22}}>
            {i ? ' ' : ''}
            {w}
          </span>
        ))}
      </div>
    </div>
  );
};

const Screen: React.FC<{t: number; shot: Shot}> = ({t, shot}) => {
  const couponScroll = fade(t, M.scroll, M.scroll + 1.15);
  const gardenScroll = fade(t, M.photos, M.photos + 1.15);
  const pair = (a: string, b: string, p: number) => (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <Img src={staticFile(a)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', transform: `translateY(${-p * 100}%)`}} />
      <Img src={staticFile(b)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', transform: `translateY(${(1 - p) * 100}%)`}} />
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff'}}>
      {shot === 'home' ? <Img src={staticFile('hotel/home-clean.png')} style={{width: '100%', height: '100%', objectFit: 'fill'}} /> : null}
      {shot === 'homeOn' ? <Img src={staticFile('hotel/home.png')} style={{width: '100%', height: '100%', objectFit: 'fill'}} /> : null}
      {shot === 'coupons' ? pair('hotel/coupons.png', 'hotel/coupons-scroll.png', couponScroll) : null}
      {shot === 'garden' ? pair('hotel/garden.png', 'hotel/garden-photos.png', gardenScroll) : null}
    </div>
  );
};

export const VeeHotel: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / HOTEL_FPS;
  const shot = shotAt(t);
  const active = lines.find((l) => t >= l.at && t < l.at + l.dur + 0.15);
  const couponRing = fade(t, line('v2').at, line('v2').at + 0.25) * (1 - fade(t, M.tapCoupons + 0.05, M.couponsIn));
  const reserveRing = fade(t, M.photos, M.photos + 0.3) * (1 - fade(t, M.tapReserve + 0.05, M.banner));
  const showPhone = shot !== 'end' && shot !== 'sms';

  return (
    <AbsoluteFill style={{background: '#000', fontFamily, overflow: 'hidden'}}>
      <Audio src={staticFile('hotel/mix.wav')} />
      {showPhone ? (
        <div style={{position: 'absolute', left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h}}>
          <Screen t={t} shot={shot} />
          <Ring t={t} show={couponRing} box={{l: '8.5%', tp: '64.5%', w: '20%', h: '11%'}} />
          <Ring t={t} show={reserveRing} box={{l: '8%', tp: '88%', w: '84%', h: '7.5%'}} />
          <Cursor t={t} at={M.tapCoupons} x={PHONE.w * 0.185} y={PHONE.h * 0.7} />
          <Cursor t={t} at={M.tapReserve} x={PHONE.w * 0.62} y={PHONE.h * 0.9} />
        </div>
      ) : null}
      {shot === 'sms' ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: PHONE.w, height: PHONE.h, background: '#111', padding: 16}}>
          <div style={{width: '100%', height: '100%', borderRadius: 36, background: '#f4f7fb', overflow: 'hidden'}}>
            <div style={{height: 150, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'flex-end', padding: '0 32px 22px', fontSize: 34, fontWeight: 800}}>VEE Hotel</div>
            <div style={{padding: 32, opacity: fade(t, SMS_AT, SMS_AT + 0.35), transform: `translateY(${(1 - fade(t, SMS_AT, SMS_AT + 0.35)) * 20}px)`}}>
              <div style={{fontSize: 18, fontWeight: 800, letterSpacing: '0.14em', color: '#6E6E73'}}>TEXT MESSAGE</div>
              <div style={{marginTop: 16, background: '#fff', borderRadius: 22, padding: '22px 24px', fontSize: 32, fontWeight: 650, lineHeight: 1.35, color: '#1D1D1F', boxShadow: '0 16px 40px rgba(15,23,42,0.08)'}}>
                We've received your table request for 7:30 PM for two guests. Your reservation is awaiting confirmation.
              </div>
              <div style={{marginTop: 16, fontSize: 24, fontWeight: 800, color: '#139FC6'}}>Request received · not yet confirmed</div>
            </div>
          </div>
        </div>
      ) : null}
      {active && shot !== 'end' ? (
        <div style={{position: 'absolute', left: 36, width: PHONE.w - 72, bottom: 36, zIndex: 9}}>
          <Bubble line={active} t={t} />
        </div>
      ) : null}
      {t >= M.end - 0.05 ? (
        <AbsoluteFill style={{opacity: fade(t, M.end, M.end + 0.45), background: 'linear-gradient(180deg,#062033,#0b6fa8 48%,#3ecdf0)', alignItems: 'center', justifyContent: 'center'}}>
          <Img src={staticFile('hotel/vee.png')} style={{width: 280, height: 280, borderRadius: 140, objectFit: 'cover'}} />
          <div style={{marginTop: 28, fontSize: 80, fontWeight: 800, color: '#fff'}}>VEE Hotel</div>
          <div style={{marginTop: 10, fontSize: 34, fontWeight: 650, color: 'rgba(255,255,255,0.92)'}}>Your Stay. Simplified.</div>
          <div style={{marginTop: 12, fontSize: 26, color: 'rgba(255,255,255,0.8)'}}>Your personal in-stay AI assistant.</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
