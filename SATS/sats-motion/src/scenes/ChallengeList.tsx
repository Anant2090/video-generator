import React from 'react';
import {C, GRADIENT} from '../brand';
import {SceneFade, Words} from '../components/Bits';
import {useTime} from '../time';
import {ease, easeIO, lerp, scene, wordAt} from '../tl';

/** Original kinetic-text challenge. Swap into Main if preferred over Challenge (phone theatre). */
const ICONS: Record<string, string> = {
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  missed: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8M23 1l-6 6M17 1l6 6',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
};

export const ChallengeList: React.FC = () => {
  const {t} = useTime();
  const s = scene('challenge');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const rows = [
    {at: wordAt('vo2', 'phone') - 0.35, icon: 'phone', text: 'Every arrival → a *phone call*'},
    {at: wordAt('vo2', 'one') - 0.25, icon: 'clock', text: 'Made *one at a time*'},
    {at: wordAt('vo2', 'unanswered') - 0.45, icon: 'missed', text: 'Often *unanswered*'},
    {at: wordAt('vo2', 'same') - 0.3, icon: 'chat', text: 'The *same questions,* again and again'},
    {at: wordAt('vo2', 'little') - 0.4, icon: 'doc', text: 'And *little on record* afterwards'},
  ];
  const collapse = easeIO(t, s.end - 1.0, s.end - 0.15);
  const active = rows.filter((r) => t >= r.at).length - 1;
  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeOut={0}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 540, transform: `translateY(-50%) scale(${lerp(1, 0.05, collapse)})`, opacity: 1 - collapse, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
        {rows.map((r, i) => {
          const k = ease(t, r.at, r.at + 0.5);
          if (k <= 0) return null;
          const dim = i < active ? 0.32 : 1;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, opacity: dim, transform: `scale(${i === active ? 1 : 0.92})`, width: 1300, whiteSpace: 'nowrap'}}>
              <div style={{width: 76, height: 76, borderRadius: 22, background: '#fff', boxShadow: '0 12px 30px -14px rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: k, transform: `scale(${0.7 + 0.3 * k})`, flexShrink: 0}}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={i === active ? C.tealInk : C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[r.icon]} />
                </svg>
              </div>
              <div style={{fontWeight: 700, letterSpacing: '-0.03em', color: C.ink, lineHeight: 1.1}}>
                <Words text={r.text} local={t - r.at} size={64} />
              </div>
            </div>
          );
        })}
      </div>
      {collapse > 0 ? (
        <div style={{position: 'absolute', left: 960, top: 540, width: 28, height: 28, marginLeft: -14, marginTop: -14, borderRadius: 14, background: GRADIENT, opacity: ease(t, s.end - 0.5, s.end - 0.2), boxShadow: `0 0 30px ${C.cyan}`}} />
      ) : null}
    </SceneFade>
  );
};
