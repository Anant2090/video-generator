import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, glass, GRADIENT, gradientText} from '../../brand';
import {SceneFade, Words} from '../../components/Bits';
import {clampCam, Screen, type Win} from '../../components/Screen';
import SCREENS from '../../data/screens.dummy.json';
import {useDummyTime} from '../../time-dummy';
import {ease, easeIO, lerp, line, scene} from '../../tl-dummy';

const WIN: Win = {x: 140, y: 150, w: 1640, h: 740};

type Shot = {src: string; w: number; h: number};
const shots = SCREENS as Record<'dashboard' | 'workflow' | 'shipment', Shot>;

const Heading: React.FC<{num: string; label: string; t: number; start: number}> = ({num, label, t, start}) => (
  <div
    style={{
      ...glass,
      position: 'absolute',
      left: 140,
      top: 48,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '10px 22px 10px 12px',
      borderRadius: 999,
      opacity: ease(t, start + 0.15, start + 0.55),
    }}
  >
    <span style={{padding: '4px 10px', borderRadius: 999, background: GRADIENT, color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '0.04em'}}>{num}</span>
    <span style={{fontSize: 22, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em'}}>{label}</span>
  </div>
);

const ShotScene: React.FC<{
  name: 'dashboard' | 'workflow' | 'shipment';
  vo: string;
  num: string;
  heading: string;
  caption: string;
  children?: React.ReactNode;
}> = ({name, vo, num, heading, caption, children}) => {
  const {t} = useDummyTime();
  const s = scene(name);
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const img = shots[name];
  const fit = Math.min(WIN.w / img.w, WIN.h / img.h);
  const z0 = (fit * img.w) / WIN.w;
  const z = lerp(z0, z0 * 1.06, easeIO(t, s.start + 0.5, s.end - 0.5));
  const cam = clampCam(WIN, img, {cx: img.w / 2, cy: img.h / 2, z});
  const k = ease(t, s.start + 0.2, s.start + 0.7);
  const v = line(vo);
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.4} fadeOut={0.35}>
      <Heading num={num} label={heading} t={t} start={s.start} />
      <div style={{opacity: k, transform: `translateY(${(1 - k) * 28}px)`, position: 'absolute', inset: 0}}>
        <Screen src={img.src} img={img} win={WIN} cam={cam} />
      </div>
      {children}
      <div
        style={{
          position: 'absolute',
          left: 140,
          right: 140,
          top: WIN.y + WIN.h + 28,
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 600,
          color: C.sub,
          opacity: ease(t, v.at, v.at + 0.5),
        }}
      >
        {caption}
      </div>
    </SceneFade>
  );
};

export const DummyTitle: React.FC = () => {
  const {t} = useDummyTime();
  const s = scene('title');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const burst = ease(t, s.start, s.start + 0.9);
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0} fadeOut={0.4}>
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 540,
          width: 28,
          height: 28,
          marginLeft: -14,
          marginTop: -14,
          borderRadius: '50%',
          background: GRADIENT,
          transform: `scale(${1 + burst * 60})`,
          opacity: (1 - burst) * 0.45,
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center'}}>
        <div
          style={{
            display: 'inline-flex',
            padding: '8px 18px',
            borderRadius: 999,
            background: 'rgba(62,205,240,0.12)',
            color: C.tealInk,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.16em',
            opacity: ease(t, s.start + 0.25, s.start + 0.8),
          }}
        >
          DEMO
        </div>
        <div style={{fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.05, color: C.ink, marginTop: 28}}>
          <Words text="SATS Import *TeleAdvice*" local={t - s.start - 0.4} size={108} stagger={0.1} />
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: C.sub,
            marginTop: 28,
            opacity: ease(t, s.start + 1.15, s.start + 1.75),
            letterSpacing: '-0.01em',
          }}
        >
          Agentic AI voice notifications for import cargo
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 22,
            marginTop: 40,
            opacity: ease(t, s.start + 2.1, s.start + 2.7),
          }}
        >
          <span style={{fontSize: 26, fontWeight: 600, color: C.sub}}>Built on</span>
          <Img src={staticFile('logo-light.png')} style={{height: 110}} />
        </div>
      </div>
    </SceneFade>
  );
};

export const DummyDashboard: React.FC = () => (
  <ShotScene name="dashboard" vo="demo2" num="01" heading="Dashboard" caption="Published SATS Import TeleAdvice workflow" />
);

export const DummyWorkflow: React.FC = () => (
  <ShotScene name="workflow" vo="demo3" num="02" heading="Agent workflow" caption="Supervisor · Shipment Agent · FAQ Agent" />
);

const DEMO_FIELDS: [string, string][] = [
  ['AWB', '123456789'],
  ['Consignee', 'ABC Imports'],
  ['Flight', 'SQ123'],
  ['Pieces / weight', '4 pcs · 120 kg'],
  ['Location', 'SATS Import Hall 2'],
];

export const DummyShipment: React.FC = () => {
  const {t} = useDummyTime();
  const s = scene('shipment');
  const card = s ? ease(t, s.start + 1.1, s.start + 1.7) : 0;
  return (
    <ShotScene name="shipment" vo="demo4" num="03" heading="Demo shipment" caption="Illustrative demo data — not a live consignment">
      {card > 0 ? (
        <div
          style={{
            ...glass,
            position: 'absolute',
            right: 170,
            top: 200,
            width: 460,
            padding: '26px 30px 22px',
            borderRadius: 28,
            background: 'rgba(255,255,255,0.96)',
            opacity: card,
            transform: `translateY(${(1 - card) * 24}px)`,
            boxShadow: '0 30px 70px -36px rgba(15,23,42,0.45)',
          }}
        >
          <div style={{fontSize: 16, fontWeight: 800, letterSpacing: '0.14em', color: C.tealInk, marginBottom: 14}}>DEMO DATA</div>
          {DEMO_FIELDS.map(([k, v], i) => (
            <div key={k} style={{display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderTop: i ? `1px solid ${C.faint}` : undefined}}>
              <span style={{fontSize: 18, fontWeight: 600, color: C.sub}}>{k}</span>
              <span style={{fontSize: 20, fontWeight: 700, color: C.ink}}>{v}</span>
            </div>
          ))}
        </div>
      ) : null}
    </ShotScene>
  );
};

export const DummyEnd: React.FC = () => {
  const {t} = useDummyTime();
  const s = scene('end');
  if (t < s.start - 0.1) return null;
  const v = line('demo5');
  const logo = ease(t, s.start + 0.2, s.start + 1.1);
  const orbit = (t - s.start) * 12;
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.45} fadeOut={0.85}>
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 330,
          width: 480,
          height: 480,
          marginLeft: -240,
          marginTop: -240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(62,205,240,0.18), rgba(164,224,111,0.08) 45%, rgba(255,255,255,0) 70%)',
          transform: `scale(${0.6 + 0.4 * logo}) rotate(${orbit}deg)`,
          opacity: logo,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 330,
          transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * logo})`,
          opacity: logo,
          filter: `blur(${(1 - logo) * 10}px)`,
        }}
      >
        <Img src={staticFile('logo-light.png')} style={{height: 210}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 520, textAlign: 'center', fontWeight: 800, letterSpacing: '-0.035em', color: C.ink}}>
        <Words text="SATS Import *TeleAdvice*" local={t - v.at + 0.15} size={64} stagger={0.08} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center', fontSize: 30, fontWeight: 500, color: C.sub, opacity: ease(t, v.at + 1.4, v.at + 2.0)}}>
        Consistent · Traceable · Efficient
      </div>
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 740,
          transform: `translateX(-50%) translateY(${(1 - ease(t, v.at + 2.2, v.at + 2.8)) * 12}px)`,
          opacity: ease(t, v.at + 2.2, v.at + 2.8),
          ...glass,
          padding: '14px 36px',
          borderRadius: 999,
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        <span style={gradientText}>voiceracx.ai</span>
      </div>
    </SceneFade>
  );
};
