import React from 'react';
import {C, GRADIENT, glass} from '../brand';
import {SceneFade} from '../components/Bits';
import {Phone, type PhoneState} from '../components/Phone';
import {useTime} from '../time';
import {ease, easeIO, lerp, scene, wordAt} from '../tl';

/** Kinetic-text original lives in ChallengeList.tsx — swap in Main if preferred. */

const PHONE = {x: 220, y: 130, s: 0.95};
const PANEL_X = 720;

const fade = (t: number, at: number, until: number, inD = 0.4, outD = 0.35) =>
  ease(t, at, at + inD) * (1 - ease(t, until - outD, until));

const Cap: React.FC<{t: number; at: number; until: number; text: string}> = ({t, at, until, text}) => {
  const k = fade(t, at, until);
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 70, textAlign: 'center', opacity: k, transform: `translateY(${(1 - k) * 12}px)`, fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', color: C.ink}}>
      {text}
    </div>
  );
};

const Queue: React.FC<{t: number; at: number; until: number; missed: boolean}> = ({t, at, until, missed}) => {
  const k = fade(t, at, until, 0.45, 0.4);
  if (k <= 0) return null;
  const rows = [
    {label: 'Call 1', status: missed ? 'No answer' : 'Calling…', tone: missed ? '#DC2626' : C.tealInk},
    {label: 'Call 2', status: 'Waiting', tone: C.sub},
    {label: 'Call 3', status: 'Waiting', tone: C.sub},
  ];
  return (
    <div style={{...glass, position: 'absolute', left: PANEL_X, top: 220, width: 520, padding: '22px 26px', borderRadius: 28, opacity: k, transform: `translateX(${(1 - k) * 30}px)`, background: 'rgba(255,255,255,0.94)'}}>
      <div style={{fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.sub, marginBottom: 16}}>OUTBOUND QUEUE</div>
      {rows.map((r, i) => (
        <div key={r.label} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: i ? '1px solid rgba(15,23,42,0.06)' : undefined, opacity: 0.55 + 0.45 * ease(t, at + i * 0.18, at + i * 0.18 + 0.35)}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
            <div style={{width: 10, height: 10, borderRadius: 5, background: i === 0 ? (missed ? '#DC2626' : C.cyan) : '#CBD5E1'}} />
            <span style={{fontSize: 26, fontWeight: 650, color: C.ink}}>{r.label}</span>
          </div>
          <span style={{fontSize: 22, fontWeight: 600, color: r.tone}}>{r.status}</span>
        </div>
      ))}
    </div>
  );
};

const MissedBadge: React.FC<{t: number; at: number; until: number}> = ({t, at, until}) => {
  const k = fade(t, at, until, 0.35, 0.35);
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', left: PHONE.x + 190 * PHONE.s, top: PHONE.y + 90, transform: `translateX(-50%) scale(${0.85 + 0.15 * k})`, opacity: k, background: '#FEE2E2', border: '2px solid #FECACA', color: '#B91C1C', padding: '10px 22px', borderRadius: 999, fontSize: 22, fontWeight: 800, letterSpacing: '0.02em', boxShadow: '0 16px 40px -20px rgba(185,28,28,0.55)', whiteSpace: 'nowrap'}}>
      Missed · no answer
    </div>
  );
};

const Questions: React.FC<{t: number; at: number; until: number}> = ({t, at, until}) => {
  const k = fade(t, at, until, 0.4, 0.45);
  if (k <= 0) return null;
  const qs = [
    {at: at + 0.0, text: 'What’s the status?'},
    {at: wordAt('vo2', 'pieces') - 0.15, text: 'How many pieces?'},
    {at: wordAt('vo2', 'collection') - 0.2, text: 'What do I need for collection?'},
  ];
  const again = ease(t, wordAt('vo2', 'again', 1), wordAt('vo2', 'again', 1) + 0.4);
  return (
    <div style={{position: 'absolute', left: PANEL_X, top: 200, width: 560, opacity: k}}>
      <div style={{fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.sub, marginBottom: 18}}>SAME QUESTIONS</div>
      {qs.map((q, i) => {
        const qk = ease(t, q.at, q.at + 0.4);
        if (qk <= 0) return null;
        return (
          <div key={i} style={{...glass, marginBottom: 14, padding: '18px 22px', borderRadius: 22, background: 'rgba(255,255,255,0.95)', opacity: qk, transform: `translateX(${(1 - qk) * 24}px)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16}}>
            <span style={{fontSize: 26, fontWeight: 600, color: C.ink}}>{q.text}</span>
            {again > 0 ? (
              <span style={{fontSize: 15, fontWeight: 800, color: '#B45309', background: '#FFFBEB', border: `1px solid ${C.amber}88`, padding: '6px 12px', borderRadius: 999, opacity: again}}>×{2 + i}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const EmptyRecord: React.FC<{t: number; at: number; until: number}> = ({t, at, until}) => {
  const k = fade(t, at, until, 0.45, 0.5);
  if (k <= 0) return null;
  const lines = ['Intent', 'Outcome', 'Notes', 'Next action'];
  return (
    <div style={{...glass, position: 'absolute', left: PANEL_X, top: 210, width: 540, padding: '28px 30px', borderRadius: 28, opacity: k, transform: `translateY(${(1 - k) * 20}px)`, background: 'rgba(255,255,255,0.96)'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22}}>
        <div style={{fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.sub}}>CALL RECORD</div>
        <div style={{fontSize: 18, fontWeight: 700, color: '#B91C1C'}}>Empty</div>
      </div>
      {lines.map((label, i) => {
        const lk = ease(t, at + 0.15 + i * 0.12, at + 0.15 + i * 0.12 + 0.35);
        return (
          <div key={label} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: i ? '1px solid rgba(15,23,42,0.06)' : undefined, opacity: lk}}>
            <span style={{fontSize: 24, fontWeight: 600, color: C.sub}}>{label}</span>
            <span style={{fontSize: 24, fontWeight: 600, color: '#CBD5E1', letterSpacing: '0.2em'}}>—</span>
          </div>
        );
      })}
    </div>
  );
};

export const Challenge: React.FC = () => {
  const {t} = useTime();
  const s = scene('challenge');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;

  const phoneAt = wordAt('vo2', 'phone') - 0.45;
  const oneAt = wordAt('vo2', 'one') - 0.2;
  const missAt = wordAt('vo2', 'unanswered') - 0.35;
  const sameAt = wordAt('vo2', 'same') - 0.25;
  const littleAt = wordAt('vo2', 'little') - 0.35;
  const collapse = easeIO(t, s.end - 1.0, s.end - 0.15);

  let state: PhoneState = 'active';
  let title = 'Consignee';
  let subtitle = 'Outbound · Notice of Arrival';
  let timer: string | undefined = '00:03';
  if (t >= missAt) {
    state = 'ended';
    subtitle = 'Attempt ended';
    timer = undefined;
  } else if (t >= oneAt) {
    timer = '00:08';
    subtitle = 'Calling… one at a time';
  }

  const phoneIn = ease(t, phoneAt, phoneAt + 0.55);
  const stageScale = lerp(1, 0.04, collapse);
  const stageOp = 1 - collapse;

  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeOut={0}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${stageScale})`, transformOrigin: '960px 540px', opacity: stageOp}}>
        <div style={{opacity: phoneIn, transform: `translateY(${(1 - phoneIn) * 40}px)`}}>
          <Phone x={PHONE.x} y={PHONE.y} scale={PHONE.s} t={t} state={state} title={title} subtitle={subtitle} timer={timer} speaking={null} level={t < missAt ? 0.35 + 0.25 * Math.sin(t * 7) : 0} />
        </div>
        <MissedBadge t={t} at={missAt} until={littleAt} />
        <Queue t={t} at={oneAt} until={sameAt} missed={t >= missAt} />
        <Questions t={t} at={sameAt} until={littleAt} />
        <EmptyRecord t={t} at={littleAt} until={s.end} />
        <Cap t={t} at={phoneAt} until={oneAt} text="Every arrival starts with a phone call" />
        <Cap t={t} at={oneAt} until={missAt} text="Made one at a time" />
        <Cap t={t} at={missAt} until={sameAt} text="Often unanswered" />
        <Cap t={t} at={sameAt} until={littleAt} text="The same questions, again and again" />
        <Cap t={t} at={littleAt} until={s.end - 0.8} text="And little left on record" />
      </div>
      {collapse > 0 ? (
        <div style={{position: 'absolute', left: 960, top: 540, width: 28, height: 28, marginLeft: -14, marginTop: -14, borderRadius: 14, background: GRADIENT, opacity: ease(t, s.end - 0.5, s.end - 0.2), boxShadow: `0 0 30px ${C.cyan}`}} />
      ) : null}
    </SceneFade>
  );
};
