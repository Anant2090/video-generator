import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, glass, GRADIENT, gradientText} from '../brand';
import {SceneFade, Words} from '../components/Bits';
import {useTime} from '../time';
import {ease, line, scene} from '../tl';

const BENEFITS: [string, string][] = [
  ['Every arrival, notified consistently', 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z'],
  ['Answers from approved sources', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4'],
  ['Seamless hand-off to your team', 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'],
  ['A full record of every call', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5'],
];

export const Benefits: React.FC = () => {
  const {t} = useTime();
  const s = scene('benefits');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.4} fadeOut={0.4}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontSize: 30, fontWeight: 700, letterSpacing: '0.18em', color: C.tealInk, opacity: ease(t, s.start + 0.1, s.start + 0.5)}}>WHAT IT DELIVERS</div>
      <div style={{position: 'absolute', left: 960, top: 560, transform: 'translate(-50%,-50%)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30}}>
        {BENEFITS.map(([text, icon], i) => {
          const at = s.start + 0.3 + i * 0.35;
          const k = ease(t, at, at + 0.55);
          return (
            <div key={text} style={{...glass, width: 700, height: 168, display: 'flex', alignItems: 'center', gap: 28, padding: '0 36px', borderRadius: 28, background: 'rgba(255,255,255,0.9)', opacity: k, transform: `translateY(${(1 - k) * 30}px) scale(${0.95 + 0.05 * k})`}}>
              <div style={{width: 84, height: 84, borderRadius: 24, background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icon} />
                </svg>
              </div>
              <div style={{fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', color: C.ink, lineHeight: 1.15}}>{text}</div>
            </div>
          );
        })}
      </div>
    </SceneFade>
  );
};

export const EndCard: React.FC = () => {
  const {t} = useTime();
  const s = scene('end');
  if (t < s.start - 0.1) return null;
  const v = line('vo10');
  const logo = ease(t, s.start + 0.2, s.start + 1.2);
  const orbit = (t - s.start) * 12;
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0.5} fadeOut={0.9}>
      <div style={{position: 'absolute', left: 960, top: 360, width: 520, height: 520, marginLeft: -260, marginTop: -260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(62,205,240,0.18), rgba(164,224,111,0.08) 45%, rgba(255,255,255,0) 70%)', transform: `scale(${0.6 + 0.4 * logo}) rotate(${orbit}deg)`, opacity: logo}} />
      <div style={{position: 'absolute', left: 960, top: 360, transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * logo})`, opacity: logo, filter: `blur(${(1 - logo) * 10}px)`}}>
        <Img src={staticFile('logo-light.png')} style={{height: 250}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontWeight: 800, letterSpacing: '-0.035em', color: C.ink}}>
        <Words text="SATS Import *TeleAdvice*" local={t - v.at + 0.2} size={70} stagger={0.1} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 660, textAlign: 'center', fontSize: 32, fontWeight: 500, color: C.sub, opacity: ease(t, v.at + 1.6, v.at + 2.2)}}>
        Powered by <span style={{fontWeight: 700, color: C.ink}}>VOICERAcx.ai</span>
      </div>
      <div style={{position: 'absolute', left: 960, top: 780, transform: `translateX(-50%) translateY(${(1 - ease(t, v.at + 2.6, v.at + 3.2)) * 14}px)`, opacity: ease(t, v.at + 2.6, v.at + 3.2), ...glass, padding: '16px 40px', borderRadius: 999, fontSize: 34, fontWeight: 700, letterSpacing: '-0.01em'}}>
        <span style={gradientText}>voiceracx.ai</span>
      </div>
    </SceneFade>
  );
};
