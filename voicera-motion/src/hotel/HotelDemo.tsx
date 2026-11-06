import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {fontFamily} from '../brand';

export const DEMO_FPS = 30;

/** Opening line, then the original film. Spoken brand is "vee". */
const OPEN = 3.28;
const at = (t: number) => t + OPEN;
const END_AT = at(42.15);
const MSG_AT = END_AT + 3.68;
export const DEMO_FRAMES = 1588;

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const fade = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {...clamp, easing: ease});
const slide = (t: number, a: number, b: number, from: number, to: number) =>
  interpolate(t, [a, b], [from, to], {...clamp, easing: ease});

const PHONE = {x: 737, y: 78, w: 446, h: 924};
const BEZEL = 12;
const SW = PHONE.w - BEZEL * 2;
const SH = PHONE.h - BEZEL * 2;

const BLUE = '#3B8CF5';
const INK = '#16181D';
const SUB = '#8A8F98';

/** Positions on the reference screens, which are shown in full inside the phone. */
const COUPON_TILE = {x: 10, y: 598, w: 98, h: 112};
const RESERVE = {x: 30, y: 816, w: 358, h: 54};

const shot = (name: string) => staticFile(`hotel/screens/${name}`);

type ScreenId = 'hello' | 'home' | 'coupons' | 'restaurant' | 'sent' | 'splash';

const ORDER: {id: ScreenId; at: number}[] = [
  {id: 'hello', at: 0},
  {id: 'home', at: OPEN},
  {id: 'coupons', at: at(21.35)},
  {id: 'restaurant', at: at(28.7)},
  {id: 'sent', at: at(36.15)},
  {id: 'splash', at: END_AT},
];

const indexAt = (t: number) => {
  let i = 0;
  for (let k = 0; k < ORDER.length; k++) if (t >= ORDER[k].at) i = k;
  const next = ORDER[i + 1];
  if (!next) return i;
  return i + fade(t, next.at - 0.42, next.at);
};

const frameStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center center',
  background: '#fff',
};

export const HotelDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / DEMO_FPS;
  const pos = indexAt(t);
  const showFinger = (t > at(18.4) && t < at(20.7)) || (t > at(31.15) && t < at(32.7)) || (t > at(34.35) && t < at(35.55));
  return (
    <AbsoluteFill style={{background: '#0e1418', fontFamily}}>
      <Img
        src={staticFile('hotel/lobby.jpg')}
        style={{position: 'absolute', width: '108%', height: '108%', left: '-4%', top: '-4%', objectFit: 'cover', filter: 'blur(22px)'}}
      />
      <AbsoluteFill style={{background: 'rgba(8,14,20,0.28)'}} />
      <Phone t={t} pos={pos} />
      {showFinger ? <Finger t={t} /> : null}
      <Sequence from={0} durationInFrames={100}>
        <Audio src={staticFile('hotel/vo/open-checked.wav')} />
      </Sequence>
      <Sequence from={Math.round(OPEN * DEMO_FPS)}>
        <Audio
          src={staticFile('hotel/ref125.mp4')}
          volume={(f) => interpolate(f / DEMO_FPS, [41.7, 42.15], [1, 0], clamp)}
        />
      </Sequence>
      <Sequence from={Math.round(END_AT * DEMO_FPS)} durationInFrames={110}>
        <Audio src={staticFile('hotel/vo/end-sending.wav')} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Phone: React.FC<{t: number; pos: number}> = ({t, pos}) => {
  const base = Math.min(ORDER.length - 1, Math.floor(pos));
  const frac = pos - Math.floor(pos);
  const ids = [ORDER[base].id, ORDER[Math.min(ORDER.length - 1, base + 1)].id];
  return (
    <div
      style={{
        position: 'absolute',
        left: PHONE.x,
        top: PHONE.y,
        width: PHONE.w,
        height: PHONE.h,
        borderRadius: 48,
        background: '#0A0A0C',
        boxShadow: '0 30px 70px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.18) inset',
      }}
    >
      <div style={{position: 'absolute', left: BEZEL, top: BEZEL, width: SW, height: SH, borderRadius: 38, overflow: 'hidden', background: '#fff'}}>
        <div style={{display: 'flex', width: SW * 2, height: SH, transform: `translateX(${-frac * SW}px)`}}>
          <Screen id={ids[0]} t={t} />
          <Screen id={ids[1]} t={t} />
        </div>
      </div>
    </div>
  );
};

const Screen: React.FC<{id: ScreenId; t: number}> = ({id, t}) => {
  if (id === 'hello') return <Hello />;
  if (id === 'coupons') return <Coupons t={t} />;
  if (id === 'restaurant') return <Restaurant t={t} />;
  if (id === 'sent') return <Page file="home-sent.jpg" />;
  if (id === 'splash') return <Ending t={t} />;
  return <Home t={t} />;
};

const Page: React.FC<{file: string; fit?: 'cover' | 'fill'}> = ({file, fit = 'cover'}) => (
  <div style={{width: SW, height: SH, flexShrink: 0, background: '#fff'}}>
    <Img src={shot(file)} style={{...frameStyle, objectFit: fit}} />
  </div>
);

/** One screen replaces the other. Two full shots are never shown stacked. */
const Crossfade: React.FC<{
  a: string;
  b: string;
  t: number;
  from: number;
  to: number;
  aFit?: 'cover' | 'fill';
  bFit?: 'cover' | 'fill';
}> = ({a, b, t, from, to, aFit, bFit}) => {
  const p = fade(t, from, to);
  return (
    <div style={{width: SW, height: SH, flexShrink: 0, position: 'relative', overflow: 'hidden', background: '#fff'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - p}}>
        <Page file={a} fit={aFit} />
      </div>
      <div style={{position: 'absolute', inset: 0, opacity: p}}>
        <Page file={b} fit={bFit} />
      </div>
    </div>
  );
};

const Hello: React.FC = () => (
  <div style={{width: SW, height: SH, flexShrink: 0, background: '#F3F6FB', display: 'flex', flexDirection: 'column'}}>
    <div style={{height: 78, background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px 0'}}>
      <Img src={staticFile('hotel/vee.png')} style={{width: 36, height: 36, borderRadius: 18, objectFit: 'cover', background: '#fff'}} />
      <div>
        <div style={{fontSize: 16, fontWeight: 800, lineHeight: 1.1}}>VEE</div>
        <div style={{fontSize: 11, fontWeight: 500, opacity: 0.9}}>Hotel assistant</div>
      </div>
    </div>
    <div style={{padding: '8px 14px 0'}}>
      <Chat text="You're checked in to VEE Hotel. How can I help you?" show={1} />
    </div>
  </div>
);

const Home: React.FC<{t: number}> = ({t}) => {
  const ring = t > at(18.7) && t < at(21.1) ? fade(t, at(18.7), at(19.05)) : 0;
  return (
    <div style={{width: SW, height: SH, flexShrink: 0, position: 'relative', background: '#fff'}}>
      <Img src={shot('home.jpg')} style={frameStyle} />
      {ring > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: COUPON_TILE.x,
            top: COUPON_TILE.y,
            width: COUPON_TILE.w,
            height: COUPON_TILE.h,
            borderRadius: 16,
            boxShadow: `0 0 0 3px rgba(59,140,245,${ring})`,
          }}
        />
      ) : null}
    </div>
  );
};

const Coupons: React.FC<{t: number}> = ({t}) => (
  <Crossfade a="coupons.jpg" b="coupons-how.jpg" aFit="fill" t={t} from={at(23.2)} to={at(23.85)} />
);

const Restaurant: React.FC<{t: number}> = ({t}) => {
  const ask = t >= at(33.05) && t < at(36.15);
  const yesOn = t >= at(34.2) && t < at(36.15);
  const ring = t > at(31.2) && t < at(32.7) ? fade(t, at(31.2), at(31.5)) : 0;
  return (
    <div style={{width: SW, height: SH, flexShrink: 0, overflow: 'hidden', background: '#fff', position: 'relative'}}>
      <Crossfade a="garden.jpg" b="garden-photos.jpg" aFit="fill" t={t} from={at(30.0)} to={at(30.6)} />
      {ring > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: RESERVE.x,
            top: RESERVE.y,
            width: RESERVE.w,
            height: RESERVE.h,
            borderRadius: 14,
            boxShadow: `0 0 0 3px rgba(59,140,245,${ring})`,
          }}
        />
      ) : null}
      {ask ? (
        <div style={{position: 'absolute', inset: 0, background: 'rgba(10,16,22,0.35)', display: 'flex', alignItems: 'flex-end', zIndex: 5}}>
          <div
            style={{
              width: '100%',
              background: '#fff',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: '16px 16px 22px',
              transform: `translateY(${(1 - fade(t, at(33.05), at(33.4))) * 40}px)`,
            }}
          >
            <div style={{fontSize: 14, fontWeight: 800, color: INK}}>Text you when it's confirmed?</div>
            <div style={{fontSize: 12, color: SUB, marginTop: 4}}>The table is not booked until the hotel confirms.</div>
            <div style={{display: 'flex', gap: 8, marginTop: 14}}>
              <div style={{flex: 1, height: 40, borderRadius: 10, border: '1px solid #E6EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: INK}}>
                Not now
              </div>
              <div
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  background: yesOn ? '#1D6FE0' : BLUE,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Yes, please
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Ending: React.FC<{t: number}> = ({t}) => {
  const msg = fade(t, MSG_AT, MSG_AT + 0.4);
  return (
    <div style={{width: SW, height: SH, flexShrink: 0, background: '#F3F6FB', display: 'flex', flexDirection: 'column'}}>
      <div style={{height: 78, background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px 0'}}>
        <Img src={staticFile('hotel/vee.png')} style={{width: 36, height: 36, borderRadius: 18, objectFit: 'cover', background: '#fff'}} />
        <div>
          <div style={{fontSize: 16, fontWeight: 800, lineHeight: 1.1}}>VEE</div>
          <div style={{fontSize: 11, fontWeight: 500, opacity: 0.9}}>Hotel assistant</div>
        </div>
      </div>
      <div style={{padding: '8px 14px 0', flex: 1, display: 'flex', flexDirection: 'column'}}>
        <Chat text="Hold on a second. I'm sending the confirmation message." show={1} />
        <div style={{marginTop: 'auto', paddingBottom: 16, opacity: t >= MSG_AT ? msg : 0, transform: `translateY(${(1 - msg) * 28}px)`}}>
          <div style={{background: '#fff', borderRadius: 18, padding: '14px 14px 16px', boxShadow: '0 12px 30px rgba(16,24,40,0.12)'}}>
            <div style={{fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: BLUE}}>MESSAGE RECEIVED</div>
            <div style={{marginTop: 6, fontSize: 16, fontWeight: 800, color: INK}}>Table confirmed</div>
            <div style={{marginTop: 4, fontSize: 13, fontWeight: 500, color: '#3C4452', lineHeight: 1.4}}>
              Your table at The Garden Restaurant is confirmed.
            </div>
            <div style={{marginTop: 8, fontSize: 11, fontWeight: 600, color: SUB}}>From VEE Hotel · just now</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Chat: React.FC<{text: string; show: number}> = ({text, show}) => (
  <div style={{display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12, opacity: show, transform: `translateY(${(1 - show) * 14}px)`}}>
    <Img src={staticFile('hotel/vee.png')} style={{width: 28, height: 28, borderRadius: 14, objectFit: 'cover', background: '#fff', flexShrink: 0}} />
    <div
      style={{
        maxWidth: SW - 72,
        background: '#fff',
        color: INK,
        borderRadius: 16,
        borderBottomLeftRadius: 5,
        padding: '10px 12px',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.35,
        boxShadow: '0 4px 14px rgba(16,24,40,0.06)',
      }}
    >
      {text}
    </div>
  </div>
);

const Finger: React.FC<{t: number}> = ({t}) => {
  let x = COUPON_TILE.x + COUPON_TILE.w / 2;
  let y = COUPON_TILE.y + COUPON_TILE.h / 2;
  if (t < at(21.5)) {
    x = slide(t, at(18.7), at(20.5), SW * 0.72, x);
    y = slide(t, at(18.7), at(20.5), SH * 0.34, y);
  } else if (t < at(34)) {
    x = slide(t, at(31.2), at(32.45), SW * 0.78, SW - 48);
    y = slide(t, at(31.2), at(32.45), SH * 0.4, RESERVE.y + 24);
  } else {
    x = slide(t, at(34.35), at(35.15), SW * 0.55, SW - 36);
    y = slide(t, at(34.35), at(35.15), SH * 0.7, SH - 42);
  }
  const tap = (t > at(20.85) && t < at(21.25)) || (t > at(32.4) && t < at(32.75)) || (t > at(35.15) && t < at(35.5));
  return (
    <div
      style={{
        position: 'absolute',
        left: PHONE.x + BEZEL + x - 14,
        top: PHONE.y + BEZEL + y - 14,
        width: 28,
        height: 28,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.92)',
        border: '2px solid rgba(20,20,20,0.35)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
        transform: `scale(${tap ? 0.86 : 1})`,
      }}
    />
  );
};
