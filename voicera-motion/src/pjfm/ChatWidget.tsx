import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CARD} from './script';
import {dotsAt, SUCCESS_AT, typingAt, visibleTurns, type Timed} from './timeline';
import {clamp, FPS, PJ, WIDGET} from './theme';

const MASCOT = staticFile('pjfm/mascot-badge.png');

const Mascot: React.FC<{size: number; bounce?: number}> = ({size, bounce = 0}) => {
  const s = 1 + 0.08 * bounce;
  const y = -4 * bounce;
  return (
    <Img
      src={MASCOT}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        transform: `translateY(${y}px) scale(${s})`,
        boxShadow: '0 2px 8px rgba(11,17,36,0.18)',
      }}
    />
  );
};

const Field: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div style={{marginTop: 10}}>
    <div style={{fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: PJ.sub, textTransform: 'uppercase'}}>{label}</div>
    <div style={{fontSize: 15, fontWeight: 600, color: PJ.ink, marginTop: 3}}>{value}</div>
  </div>
);

const Card: React.FC<{ask: boolean; name: boolean; contact: boolean; purpose: boolean}> = ({ask, name, contact, purpose}) => (
  <div
    style={{
      alignSelf: 'stretch',
      background: '#fff',
      border: `1px solid ${PJ.line}`,
      borderRadius: 16,
      padding: '14px 16px 16px',
      marginLeft: 36,
    }}
  >
    <div style={{fontSize: 13, fontWeight: 800, color: PJ.ink, letterSpacing: '0.04em'}}>Registration details</div>
    {name ? <Field label="Name" value={CARD.name} /> : null}
    {contact ? <Field label="Contact information" value={CARD.contact} /> : null}
    {purpose ? <Field label="Purpose of registration" value={CARD.purpose} /> : null}
    {ask ? (
      <div style={{marginTop: 14, fontSize: 15, fontWeight: 600, color: PJ.ink, lineHeight: 1.4}}>Are these details correct?</div>
    ) : null}
  </div>
);

const UserFace: React.FC = () => (
  <div
    style={{
      width: 28,
      height: 28,
      borderRadius: 14,
      flexShrink: 0,
      background: 'linear-gradient(135deg,#7ec8d0,#e8a07a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 19c1.2-3.4 3.6-5 7-5s5.8 1.6 7 5" />
    </svg>
  </div>
);

const Bubble: React.FC<{turn: Timed}> = ({turn}) => {
  if (turn.who === 'bot' && turn.kind === 'card') {
    return <Card ask name contact purpose />;
  }
  const user = turn.who === 'user';
  return (
    <div
      style={{
        alignSelf: user ? 'flex-end' : 'flex-start',
        maxWidth: '94%',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        flexDirection: user ? 'row-reverse' : 'row',
      }}
    >
      {user ? <UserFace /> : <Mascot size={28} />}
      <div
        style={{
          padding: '11px 14px 12px',
          borderRadius: 18,
          borderBottomRightRadius: user ? 6 : 18,
          borderBottomLeftRadius: user ? 18 : 6,
          background: user ? PJ.user : PJ.bot,
          color: user ? '#fff' : PJ.ink,
          fontSize: 15.5,
          lineHeight: 1.38,
          fontWeight: 500,
          boxShadow: user ? 'none' : '0 1px 2px rgba(15,21,40,0.06)',
        }}
      >
        {turn.text}
      </div>
    </div>
  );
};

const Typing: React.FC<{t: number}> = ({t}) => {
  const bounce = 0.5 + 0.5 * Math.sin(t * 7.2);
  const pulse = (i: number) => 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 10 + i * 0.95));
  return (
    <div style={{alignSelf: 'flex-start', display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '94%'}}>
      <Mascot size={36} bounce={bounce} />
      <div>
        <div style={{fontSize: 11, fontWeight: 700, color: PJ.sub, margin: '0 0 6px 4px', letterSpacing: '0.02em'}}>
          AI Assistant is typing
        </div>
        <div
          style={{
            background: PJ.bot,
            borderRadius: 18,
            borderBottomLeftRadius: 6,
            padding: '12px 16px',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            boxShadow: '0 1px 2px rgba(15,21,40,0.06)',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: PJ.send,
                opacity: pulse(i),
                transform: `translateY(${-3 * pulse(i)}px)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Clip: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b93a3" strokeWidth="2" strokeLinecap="round">
    <path d="M21.4 11.6 12 21a6 6 0 1 1-8.5-8.5l9.4-9.4a4 4 0 0 1 5.7 5.7L9.2 18.2a2 2 0 1 1-2.8-2.8l8.5-8.5" />
  </svg>
);

const Plane: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
    <path d="M3.2 11.2 20.4 3.4c.7-.3 1.4.4 1.1 1.1l-7.8 17.2c-.3.7-1.3.6-1.5-.1L10.4 14 3.3 12.6c-.8-.2-.7-1.3-.1-1.4z" />
  </svg>
);

export const ChatWidget: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const inK = interpolate(t, [0.05, 0.4], [0, 1], clamp);
  const shown = visibleTurns(t);
  const typing = typingAt(t);
  const dots = dotsAt(t);
  const success = interpolate(t, [SUCCESS_AT, SUCCESS_AT + 0.45], [0, 1], clamp);
  const nameOn = shown.some((x) => x.id === 'u7');
  const contactOn = shown.some((x) => x.id === 'u8');
  const purposeOn = shown.some((x) => x.id === 'u9');
  const cardTurn = shown.some((x) => x.id === 'card');
  const collect = nameOn && !cardTurn;
  const thread = shown.filter((x) => x.id !== 'card' || cardTurn).slice(-5);

  return (
    <div
      style={{
        position: 'absolute',
        left: WIDGET.x,
        top: WIDGET.y,
        width: WIDGET.w,
        height: WIDGET.h,
        borderRadius: 22,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: PJ.body,
        boxShadow: '0 24px 60px -20px rgba(0,0,0,0.55)',
        opacity: inK,
        transform: `translateY(${(1 - inK) * 18}px) scale(${0.98 + 0.02 * inK})`,
        transformOrigin: '100% 0%',
      }}
    >
      <div
        style={{
          background: `linear-gradient(180deg, ${PJ.header}, ${PJ.headerEnd})`,
          color: '#fff',
          padding: '14px 16px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          boxShadow: '0 8px 16px rgba(11,17,36,0.18)',
          zIndex: 2,
        }}
      >
        <Mascot size={40} />
        <div style={{flex: 1, minWidth: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em'}}>AI Assistant</div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            opacity: 0.9,
          }}
        >
          ×
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: '16px 14px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 12,
          overflow: 'hidden',
          maskImage: 'linear-gradient(180deg, transparent 0, black 24px)',
        }}
      >
        {thread.map((turn) => (
          <Bubble key={turn.id} turn={turn} />
        ))}
        {collect ? <Card ask={false} name={nameOn} contact={contactOn} purpose={purposeOn} /> : null}
        {dots ? <Typing t={t} /> : null}
      </div>

      {success > 0.02 ? (
        <div
          style={{
            margin: '0 14px 8px',
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(31,122,77,0.12)',
            color: PJ.success,
            fontSize: 14,
            fontWeight: 700,
            opacity: success,
          }}
        >
          Registration noted — a team member will follow up
        </div>
      ) : null}

      <div style={{flexShrink: 0, background: PJ.footer, padding: '10px 12px 8px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <Clip />
          <div
            style={{
              flex: 1,
              background: '#fff',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 15,
              color: typing?.text ? PJ.ink : '#9aa3ae',
              minHeight: 20,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {typing?.text || 'Type your message...'}
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: PJ.send,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: typing ? 1 : 0.85,
            }}
          >
            <Plane />
          </div>
        </div>
        <div style={{textAlign: 'center', color: '#8b93a3', fontSize: 12, padding: '8px 0 4px', letterSpacing: '0.02em'}}>
          Powered by VLM
        </div>
      </div>
    </div>
  );
};
