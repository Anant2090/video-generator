import React from 'react';
import {AbsoluteFill, Easing, Img, random, staticFile, useCurrentFrame} from 'remotion';
import cues from '../../public/legion5/cues.json';
import {bubbleFrom} from './bubble';
import {BUILD_CAM, CARD, cardXY, RUN_BTN, STAMP_LEN, STAT, TAPS, WB} from './choreo';
import {type Cam, camAt, DitherIn, DrawRect, FileCard, Mascot, Mono, pop, Ripple, RunButton, StampMark, StampTool, Tag, toStage, UIWindow, useT, WhipIn, type Win} from './kit';
import {easeInOut, HEAD, k, L, linear, MK, MONO, SC} from './theme';

const A = cues.actions;

const pad3 = (n: number) => String(n).padStart(3, '0');
const bump = (t: number, at: number, dur = 0.45) => Math.sin(k(t, at, at + dur, linear) * Math.PI);

// ─── 1. Hook: one agent, thousands of calls — which went wrong? ─────────────────────
const FLAGS: Record<number, string> = {5: '3s awkward silence', 9: 'Made up a refund policy', 13: 'Shared account details'};

export const Hook: React.FC = () => {
  const t = useT();
  const frame = useCurrentFrame();
  const which = MK.which - SC.hook;
  const n = Math.round(9847 * k(t, 0.15, 2.4, Easing.out(Easing.cubic)));
  const scroll = t * 22;
  const order = Object.keys(FLAGS).map(Number);

  return (
    <AbsoluteFill style={{background: L.navy}}>
      <div style={{position: 'absolute', left: 150, top: 250}}>
        <Mono style={{color: L.mint, fontSize: 24}}>// calls handled today</Mono>
        <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 168, color: L.paper, letterSpacing: '-0.045em', lineHeight: 1, marginTop: 12, fontVariantNumeric: 'tabular-nums'}}>
          {n.toLocaleString('en-US')}
        </div>
        <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 46, color: 'rgba(255,255,255,0.72)', marginTop: 16}}>by one AI agent.</div>
        <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 46, color: L.red, marginTop: 10, opacity: k(t, which, which + 0.3)}}>
          {k(t, which + 0.2, which + 0.9, linear) >= 1 ? '3 went wrong.' : `${Math.round(3 * k(t, which + 0.2, which + 0.9, linear))} went wrong.`}
        </div>
      </div>
      <AbsoluteFill style={{WebkitMaskImage: 'linear-gradient(to bottom, transparent 40px, black 120px)', maskImage: 'linear-gradient(to bottom, transparent 40px, black 120px)'}}>
      {Array.from({length: 21}, (_, i) => {
        const r = Math.floor(i / 3);
        const c = i % 3;
        const x = 940 + c * 290;
        const y = 110 + r * 144 - scroll;
        const flagAt = FLAGS[i] ? which + 0.15 + order.indexOf(i) * 0.28 : Infinity;
        const p = k(t, flagAt, flagAt + 0.28, linear);
        const red = p > 0.5;
        const glitch = t > flagAt && t < flagAt + 0.45 ? (random(`g${i}-${frame}`) - 0.5) * 16 : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + glitch,
              top: y,
              width: 270,
              height: 124,
              borderRadius: 14,
              padding: '14px 18px',
              boxSizing: 'border-box',
              background: red ? L.red : '#1E293B',
              border: `2px solid ${red ? L.paper : '#334155'}`,
              transform: `scaleY(${Math.max(0.02, Math.abs(Math.cos(p * Math.PI)))})`,
              filter: glitch ? `drop-shadow(${glitch}px 0 0 ${L.mint})` : undefined,
            }}
          >
            <Mono style={{fontSize: 15, color: red ? 'rgba(255,255,255,0.8)' : '#94A3B8'}}>CALL #{(9847 - i * 7).toLocaleString('en-US')}</Mono>
            {red ? (
              <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 24, color: L.paper, lineHeight: 1.15, marginTop: 10}}>✗ {FLAGS[i]}</div>
            ) : (
              <>
                <svg width={234} height={34} style={{marginTop: 8}}>
                  {Array.from({length: 18}, (_, b) => {
                    const h = 6 + 26 * Math.abs(Math.sin(t * 5 + i * 0.9 + b * 0.7));
                    return <rect key={b} x={b * 13} y={17 - h / 2} width={7} height={h} rx={3} fill="#475569" />;
                  })}
                </svg>
                <Mono style={{fontSize: 15, color: L.mint, marginTop: 4}}>✓ resolved</Mono>
              </>
            )}
          </div>
        );
      })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── 2. Reveal: Meet VEE Legion ─────────────────────────────────────────────────────
const Lockup: React.FC<{t: number; at: number; out?: number}> = ({t, at, out = 0}) => {
  if (t < at) return null; // nothing (not even the typing cursor) before the logo lands
  const logo = pop(t, at, 160, 12);
  const word = k(t, at + 0.15, at + 0.55);
  const type = 'independent QA for voice & chat AI agents';
  const chars = Math.round(type.length * k(t, at + 0.45, at + 1.2, linear));
  return (
    <div style={{position: 'absolute', left: 1000, top: 250, opacity: 1 - out, transform: `translateY(${-60 * out}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
        <Img
          src={staticFile('legion/logo_white.png')}
          style={{height: 130, transform: `scale(${logo}) rotate(${(1 - logo) * -90}deg)`}}
        />
        <Img src={staticFile('legion/wordmark_white.png')} style={{width: 700, clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`}} />
      </div>
      <Mono style={{color: L.ink, fontSize: 28, marginTop: 36}}>
        // {type.slice(0, chars)}
        <span style={{opacity: chars < type.length ? 1 : 0}}>▌</span>
      </Mono>
    </div>
  );
};

// VEE itself is drawn by the root <Presenter> (Vee.tsx), which grows into hero framing here.
export const Reveal: React.FC = () => {
  const t = useT();
  return (
    <DitherIn>
      <AbsoluteFill style={{background: L.blue}}>
        <Lockup t={t} at={MK.meet - SC.reveal} />
      </AbsoluteFill>
    </DitherIn>
  );
};

// ─── 3. The Legion: VEE becomes an army of test callers ─────────────────────────────
type CardSpec = {label: string; sub: string; bg: string; red?: [string, string]};
const CARDS: CardSpec[] = [
  {label: 'Frustrated senior', sub: 'voice · banking', bg: L.amber},
  {label: 'Confused', sub: 'chat · telecom', bg: L.pink},
  {label: 'Anxious', sub: 'voice · banking', bg: L.teal},
  {label: 'Pushy', sub: 'voice · telecom', bg: L.lilac},
  {label: 'Tech-savvy', sub: 'chat · banking', bg: L.mint},
  {label: 'Noisy line', sub: 'voice · poor signal', bg: L.paper},
  {label: 'Everyday caller', sub: 'chat · general', bg: L.lilac},
  {label: 'Slow & thoughtful', sub: 'voice · telecom', bg: L.teal},
  {label: 'Well-informed', sub: 'chat · banking', bg: L.mint, red: ['Prompt injection', 'red-team']},
  {label: 'Determined', sub: 'voice · banking', bg: L.amber, red: ['Jailbreak', 'red-team']},
  {label: 'Nervous', sub: 'voice · telecom', bg: L.pink, red: ['Data extraction', 'red-team']},
  {label: 'Impatient', sub: 'chat · general', bg: L.paper, red: ['Social engineering', 'red-team']},
];
// 6x2 grid to the right of VEE's bubble; once VEE has shrunk away the grid glides to the centre
const SLOT = {dx: (CARD.w - 159) / 2, dy: 40, h: 192}; // card mascot inside a card
const CENTRE_SHIFT = (1920 - (6 * CARD.w + 5 * CARD.gx)) / 2 - CARD.x0;
// the cards burst out of VEE's bubble: 4 bursts, 3 cards each
const DEAL = A.deal;
const dealAt = (i: number) => DEAL[Math.floor(i / 3)] + (i % 3) * 0.04;
const DEAL_FROM = DEAL.map((r) => bubbleFrom(r));

const Card: React.FC<{i: number; t: number; appear: number; flipAt: number; pulseAt: number; shift: number}> = ({i, t, appear, flipAt, pulseAt, shift}) => {
  const spawn = DEAL_FROM[Math.floor(i / 3)];
  const frame = useCurrentFrame();
  const c = CARDS[i];
  const {x: x0, y} = cardXY(i);
  const x = x0 + shift;
  const a = pop(t, appear, 200, 14);
  if (a <= 0) return null;
  const fly = 1 - k(t, appear, appear + 0.45); // 1 at VEE -> 0 in the slot
  const dx = (spawn[0] - (x + CARD.w / 2)) * fly;
  const dy = (spawn[1] - (y + CARD.h / 2)) * fly - 90 * Math.sin(Math.PI * fly) + 5 * Math.sin(t * 2.3 + i * 0.9) * (1 - fly); // arc, then a gentle bob
  const f = c.red ? k(t, flipAt, flipAt + 0.3, linear) : 0;
  const red = f > 0.5;
  const glitch = c.red && t > flipAt && t < flipAt + 0.4 ? (random(`c${i}-${frame}`) - 0.5) * 18 : 0;
  const pulse = 1 + 0.07 * bump(t, pulseAt);
  const label = red ? c.red![0] : c.label;
  return (
    <div
      style={{
        position: 'absolute',
        left: x + glitch + dx,
        top: y + dy,
        width: CARD.w,
        height: CARD.h,
        boxSizing: 'border-box',
        borderRadius: 18,
        background: red ? L.paper : c.bg,
        border: `3px solid ${red ? L.red : L.ink}`,
        boxShadow: `8px 8px 0 ${red ? L.red : L.ink}`,
        transform: `scale(${(0.25 + 0.75 * a) * pulse}) scaleX(${Math.max(0.02, Math.abs(Math.cos(f * Math.PI)))})`,
        opacity: Math.min(1, a * 1.4),
        filter: glitch ? `drop-shadow(${glitch}px 0 0 ${L.mint}) drop-shadow(${-glitch}px 0 0 ${L.red})` : undefined,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 12px 0'}}>
        <Mono style={{fontSize: 14, color: red ? L.red : L.ink}}>{red ? '// troublemaker' : '// caller'}</Mono>
        <Mono style={{fontSize: 14, color: red ? L.red : L.ink}}>{String(i + 1).padStart(2, '0')}</Mono>
      </div>
      <Mascot pose={red ? 'cardRed' : 'card'} style={{position: 'absolute', left: SLOT.dx, top: SLOT.dy, height: SLOT.h}} />
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 38,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: label.length > 14 ? 18 : 22,
          lineHeight: 1.05,
          whiteSpace: 'nowrap',
          color: red ? L.red : L.ink,
        }}
      >
        {label}
      </div>
      <Mono style={{position: 'absolute', left: 12, bottom: 14, fontSize: 13, color: red ? L.red : L.ink}}>{red ? c.red![1] : c.sub}</Mono>
    </div>
  );
};

export const Legion: React.FC = () => {
  const t = useT();
  const at = (m: number) => m - SC.legion;
  const trouble = at(MK.troublemakers);
  const line = '// voice + chat agents — VEE · Twilio · Retell · Vapi · Synthflow';
  const chars = Math.round(line.length * k(t, at(MK.voice) - 0.2, at(MK.voice) + 2.0, linear));
  const shift = CENTRE_SHIFT * k(t, at(A.veeOut) + 0.25, at(A.veeOut) + 0.85, easeInOut);
  let flip = 0;

  return (
    <AbsoluteFill style={{background: L.blue}}>
      <Lockup t={t + 10} at={0} out={k(t, 0, 0.35)} />
      <Mono style={{position: 'absolute', left: 0, right: 0, top: 104, textAlign: 'center', color: L.ink, fontSize: 36, fontWeight: 700}}>
        {line.slice(0, chars)}
      </Mono>
      {CARDS.map((c, i) => (
        <Card
          key={i}
          i={i}
          t={t}
          shift={shift}
          appear={dealAt(i) - SC.legion}
          flipAt={c.red ? trouble - 0.05 + flip++ * 0.09 : Infinity}
          pulseAt={i === 0 ? at(MK.frustrated) : i === 1 ? at(MK.confused) : Infinity}
        />
      ))}
    </AbsoluteFill>
  );
};

// ─── 4. Build a test (real UI: Create a test → Pass/fail → AI judge check) ───────────
export const Build: React.FC = () => {
  const t = useT();
  // each builder frame advances on a click (choreo.ts TAPS, with a click ripple):
  // 001 first chip · 002 +Anxious (tap 1) · 003-005 more chips · 006 +Prompt injection (tap 2) · 007 all ·
  // 008 pass/fail step, rule menu open (tap 3) · 009 AI judge picked (tap 4) · 010-030 rule typed out, then holds
  const [t1, t2, t3, t4] = A.taps.map((x) => x - SC.build);
  const te = A.typeEnd - SC.build;
  const fr =
    t < t1 ? 1
    : t < t2 ? 2 + Math.min(3, Math.floor(((t - t1) / (t2 - t1)) * 4))
    : t < t3 ? (t < t2 + 0.15 ? 6 : 7)
    : t < t4 ? 8
    : 9 + Math.min(21, Math.max(0, Math.floor(((t - t4 - 0.06) / (te - t4 - 0.06)) * 22)));
  const cam = camAt(t, BUILD_CAM);
  const tag = toStage(WB, BUILD_CAM[BUILD_CAM.length - 1][1], 960, 276); // beside the AI judge rule
  return (
    <DitherIn>
      <AbsoluteFill style={{background: L.blue}}>
        <UIWindow src={`legion/ui/builder/${pad3(fr)}.jpg`} cam={cam} win={WB} />
        {TAPS.map(({t: at, at: p}) => (
          <Ripple key={at} t={t} at={at - SC.build} x={p[0]} y={p[1]} />
        ))}
        <Tag t={t} at={t4 + 0.12} tone="blue" x={tag.x} y={tag.y}>
          ✓ AI judge check
        </Tag>
      </AbsoluteFill>
    </DitherIn>
  );
};

// ─── 5. Run hundreds at once (real UI: live run → 240/240) ───────────────────────────
const WL: Win = {x: 560, y: 70, w: 1320, h: 743}; // window up & right: the RUN button stands bottom-left
export const Live: React.FC = () => {
  const t = useT();
  const hit = A.run - SC.live; // RUN clicked -> the calls start
  const done = A.runDone - SC.live;
  const fr = t < hit ? 2 : t < done ? 2 + Math.min(48, Math.floor(((t - hit) / (done - hit)) * 49)) : 51;
  const flash = 1 - k(t, done, done + 0.3);
  const blink = Math.floor(t * 4) % 2 === 0;
  const cam = {cx: 1100, cy: 440, w: 1560};
  const tag = toStage(WL, cam, 1197, 598);
  const pressed = t >= hit ? 1 - k(t, hit + 0.1, hit + 0.3) : 0;
  return (
    <WhipIn>
      <AbsoluteFill style={{background: L.blue}}>
        <UIWindow src={`legion/ui/live/${pad3(fr)}.jpg`} cam={cam} win={WL} />
        {t >= done ? <AbsoluteFill style={{background: L.paper, opacity: 0.55 * flash}} /> : null}
        <RunButton x={RUN_BTN.x} top={RUN_BTN.top} r={RUN_BTN.r} pressed={pressed} show={pop(t, 0.05, 170, 14)} />
        <Ripple t={t} at={hit} x={RUN_BTN.x} y={RUN_BTN.top + RUN_BTN.r * 0.4} />
        {t < hit ? null : t < done ? (
          <Tag t={t} at={hit + 0.05} x={tag.x} y={tag.y} size={34}>
            <span style={{color: L.red, opacity: blink ? 1 : 0.25}}>●</span> 240 calls running in parallel
          </Tag>
        ) : (
          <Tag t={t} at={done + 0.05} tone="green" x={tag.x} y={tag.y} size={34}>
            ✓ 240 / 240 calls done
          </Tag>
        )}
      </AbsoluteFill>
    </WhipIn>
  );
};

// ─── 6. The numbers (real UI: report) ────────────────────────────────────────────────
// report window large on the left; on each spoken word ("pass rate", "goals met", "attacks resisted")
// its source in the real report is outlined, then the number lifts out into a card on the right
const WS: Win = {x: 60, y: 120, w: 1140, h: 641};
const SCORES_CAM: Cam = {cx: 1100, cy: 540, w: 1560};
const STATS = [
  {v: 94, label: 'of calls passed', tag: '// criteria pass · 93.8%', rect: [525, 480, 1325, 45] as const},
  {v: 92, label: 'of goals met', tag: '// goal satisfaction · 91.7%', rect: [525, 540, 1325, 45] as const},
  {v: 100, label: 'of attacks resisted', tag: '// injection · PII · policy', rect: [353, 715, 665, 183] as const},
];
const STAT_FROM = STATS.map(({rect: [x, y, w, h]}) => toStage(WS, SCORES_CAM, x + w / 2, y + h / 2));

export const Scores: React.FC = () => {
  const t = useT();
  const cam = SCORES_CAM;
  const s = WS.w / cam.w;
  const deal = A.statDeal.map((x) => x - SC.scores);
  const FLY = 0.45;
  return (
    <WhipIn>
      <AbsoluteFill style={{background: L.blue}}>
        <UIWindow src="legion/ui/report/000.jpg" cam={cam} win={WS}>
          {STATS.map((st, i) => (
            <DrawRect key={i} r={[...st.rect]} p={k(t, deal[i] - 0.45, deal[i] - 0.05)} color={L.blue} s={s} fill="rgba(37,99,235,0.08)" />
          ))}
        </UIWindow>
        <Mono style={{position: 'absolute', left: WS.x, top: WS.y + WS.h + 30, color: L.ink, fontSize: 26, fontWeight: 700}}>
          // 48 calls scored · real Legion report
        </Mono>
        {STATS.map((st, i) => {
          const a = deal[i];
          if (t < a) return null;
          const slot = STAT(i);
          const f = k(t, a, a + FLY); // flight from its outlined source in the report into the slot
          const from = STAT_FROM[i];
          const x = from.x - slot.w / 2 + (slot.x - (from.x - slot.w / 2)) * f;
          const y = from.y - slot.h / 2 + (slot.y - (from.y - slot.h / 2)) * f - 110 * Math.sin(Math.PI * f);
          const land = pop(t, a + FLY * 0.8, 260, 13);
          const n = Math.round(st.v * k(t, a + FLY, a + FLY + 0.55));
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: slot.w,
                height: slot.h,
                boxSizing: 'border-box',
                padding: '16px 28px',
                background: L.paper,
                border: `3px solid ${L.ink}`,
                boxShadow: `8px 8px 0 ${L.ink}`,
                borderRadius: 18,
                transformOrigin: 'center',
                transform: `scale(${0.25 + 0.75 * f + 0.05 * (land - 1)}) rotate(${(1 - f) * -14}deg)`,
              }}
            >
              <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
                <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 92, letterSpacing: '-0.04em', color: L.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>
                  {n}%
                </div>
                <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 28, color: L.ink, lineHeight: 1.1}}>{st.label}</div>
              </div>
              <Mono style={{fontSize: 19, color: L.blue, marginTop: 14}}>{st.tag}</Mono>
            </div>
          );
        })}
      </AbsoluteFill>
    </WhipIn>
  );
};

// ─── 7. The why (real UI: replay transcript, flagged turn) ───────────────────────────
// transcript window on the right; the FAIL stamp drops in from above onto the bad reply; the two
// reasons land as cards in the free left column, so nothing covers the transcript
const WY: Win = {x: 600, y: 150, w: 1280, h: 720};
const BUBBLE: [number, number, number, number] = [754, 548, 544, 188]; // turn-2 agent reply
const WHY_CAM: [number, Cam][] = [
  [0, {cx: 1100, cy: 560, w: 1400}],
  [0.6, {cx: 1052, cy: 600, w: 800}],
];
const STAMP_K = 2.6; // big enough to read as a rubber stamp at full-frame scale
const STAMP_PX = STAMP_LEN * STAMP_K;
const STAMP_ON = toStage(WY, WHY_CAM[1][1], 1200, 700); // lower right of the reply, clear of its words
/** Stamp handle: drops from above the frame, hovers, slams at `hit`, lifts off (null = not shown). */
const stampAt = (t: number, hit: number): [number, number] | null => {
  const knob: [number, number] = [STAMP_ON.x, STAMP_ON.y - STAMP_PX]; // rubber face on the target
  const hover = knob[1] - 130;
  if (t < hit - 0.45 || t > hit + 0.55) return null;
  if (t < hit - 0.1) return [knob[0], -STAMP_PX - 40 + (hover + STAMP_PX + 40) * k(t, hit - 0.45, hit - 0.1)];
  if (t < hit) return [knob[0], hover + (knob[1] - hover) * k(t, hit - 0.1, hit, linear) ** 2];
  if (t < hit + 0.12) return knob;
  return [knob[0], knob[1] - 130 * k(t, hit + 0.12, hit + 0.45)];
};

export const Why: React.FC = () => {
  const t = useT();
  const cam = camAt(t, WHY_CAM);
  const s = WY.w / cam.w;
  const hit = A.stamp - SC.why;
  const shake = t > hit && t < hit + 0.14 ? Math.sin((t - hit) * 140) * 7 : 0;
  const stamp = stampAt(t, hit);
  return (
    <WhipIn>
      <AbsoluteFill style={{background: L.blue, transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
        <UIWindow src="legion/ui/replay/000.jpg" cam={cam} win={WY}>
          <DrawRect r={BUBBLE} p={k(t, hit, hit + 0.35, linear)} color={L.red} s={s} fill="rgba(239,68,68,0.07)" />
        </UIWindow>
        <StampMark t={t} at={hit} x={STAMP_ON.x} y={STAMP_ON.y} />
        {stamp ? (
          <div style={{opacity: 1 - k(t, hit + 0.4, hit + 0.55)}}>
            <StampTool at={stamp} angle={-Math.PI / 2} k={STAMP_K} len={STAMP_LEN} />
          </div>
        ) : null}
        <Mono style={{position: 'absolute', left: 60, top: 300, color: L.ink, fontSize: 26, fontWeight: 700, opacity: k(t, hit + 0.05, hit + 0.3)}}>
          // why it failed
        </Mono>
        <Tag t={t} at={hit + 0.15} tone="red" x={60} y={350} size={30} w={480}>
          ✗ Changed the address without verifying identity
        </Tag>
        <Tag t={t} at={hit + 0.5} tone="red" x={60} y={490} size={30} w={480}>
          ✗ Promised a fee waiver it can’t give
        </Tag>
      </AbsoluteFill>
    </WhipIn>
  );
};

// ─── 8. Even your real calls (real UI: import → scored) ──────────────────────────────
// its own beat: the import form holds; the call file slides in on "Import" and drops onto the form;
// "Import & score" is clicked; the scored report appears; on "scored" the camera pushes to the result
const WR: Win = {x: 260, y: 170, w: 1400, h: 788};
const FORM_CAM: Cam = {cx: 1100, cy: 520, w: 1560};
const RESULT_CAM: Cam = {cx: 880, cy: 770, w: 1100}; // metric score + the conversation row, "passed"
const FILE_ON = toStage(WR, FORM_CAM, 640, 395); // the Source ID field
const IMPORT_BTN = toStage(WR, FORM_CAM, 417, 759); // "Import & score"

export const Real: React.FC = () => {
  const t = useT();
  const at = (x: number) => x - SC.real;
  const [drop, land, click, scored] = [A.drop, A.dropLand, A.importClick, A.scored].map(at);
  const sw = click + 0.2; // the scored report replaces the form
  const cam = t < sw ? FORM_CAM : camAt(t, [[scored, FORM_CAM], [scored + 0.6, RESULT_CAM]]);
  const s = WR.w / cam.w;
  const bumpY = t >= land ? 1 - k(t, land, land + 0.25) : 0;
  const f = k(t, drop, land, easeInOut); // file: in from the left edge on an arc
  const sink = k(t, land + 0.2, land + 0.45); // then sinks into the field
  return (
    <WhipIn>
      <AbsoluteFill style={{background: L.blue}}>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${bumpY * 10}px)`}}>
          <UIWindow src={`legion/ui/import/${t < sw ? '000' : '001'}.jpg`} cam={cam} win={WR}>
            {t >= sw ? <DrawRect r={[364, 307, 130, 130]} p={k(t, sw + 0.15, sw + 0.5)} color={L.green} s={s} /> : null}
            {t >= sw ? <DrawRect r={[1150, 1034, 76, 28]} p={k(t, scored + 0.5, scored + 0.8)} color={L.green} s={s} /> : null}
          </UIWindow>
        </div>
        {t >= drop && sink < 1 ? (
          <FileCard x={-120 + (FILE_ON.x + 120) * f} y={FILE_ON.y - 160 * Math.sin(Math.PI * f)} rot={-20 * (1 - f)} scale={1 - 0.6 * sink} opacity={1 - sink} />
        ) : null}
        <Ripple t={t} at={click} x={IMPORT_BTN.x} y={IMPORT_BTN.y} />
        <Tag t={t} at={at(MK.checks) - 0.35} tone="green" x={WR.x} y={78} size={32}>
          ✓ Real call imported &amp; scored — same checks
        </Tag>
      </AbsoluteFill>
    </WhipIn>
  );
};

// ─── 9. CTA ─────────────────────────────────────────────────────────────────────────
export const Cta: React.FC = () => {
  const t = useT();
  const c = MK.catch - SC.cta;
  const w1 = k(t, c - 0.05, c + 0.35);
  const w2 = k(t, c + 0.35, c + 0.8);
  const btn = pop(t, c + 1.05);
  const press = A.press - SC.cta; // the button gets clicked
  const down = t >= press ? 1 - k(t, press + 0.22, press + 0.38) : 0;
  return (
    <DitherIn dur={0.36}>
      <AbsoluteFill style={{background: L.blue}}>
        <div style={{position: 'absolute', left: 930, top: 150}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 26, opacity: k(t, 0.2, 0.5), transform: `translateY(${(1 - k(t, 0.2, 0.6)) * 20}px)`}}>
            <Img src={staticFile('legion/logo_white.png')} style={{height: 96}} />
            <Img src={staticFile('legion/wordmark_white.png')} style={{width: 560}} />
          </div>
          <Mono style={{fontSize: 28, fontWeight: 700, color: L.ink, marginTop: 30, opacity: k(t, 0.45, 0.75)}}>// test · evaluate · improve</Mono>
          <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 96, letterSpacing: '-0.045em', lineHeight: 1.02, color: L.ink, marginTop: 44}}>
            <div style={{opacity: w1, transform: `translateY(${(1 - w1) * 30}px)`}}>Catch it before</div>
            <div
              style={{
                display: 'inline-block',
                marginTop: 12,
                padding: '2px 22px 10px',
                background: L.paper,
                opacity: w2,
                transform: `translateY(${(1 - w2) * 30}px)`,
              }}
            >
              your customers do.
            </div>
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 64,
              padding: '22px 36px',
              background: down > 0 ? L.mint : L.paper,
              border: `4px solid ${L.ink}`,
              boxShadow: `${10 - 8 * down}px ${10 - 8 * down}px 0 ${L.ink}`,
              borderRadius: 16,
              fontFamily: HEAD,
              fontWeight: 800,
              fontSize: 44,
              color: L.ink,
              transformOrigin: 'left center',
              transform: `translate(${8 * down}px, ${8 * down}px) scale(${0.7 + 0.3 * btn})`,
              opacity: Math.min(1, btn * 1.5),
            }}
          >
            Join the private beta →
          </div>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 36, color: L.ink, marginTop: 34, opacity: k(t, c + 1.3, c + 1.6)}}>legion.voiceracx.ai</div>
        </div>
        <Ripple t={t} at={press} x={1010} y={690} />
      </AbsoluteFill>
    </DitherIn>
  );
};
