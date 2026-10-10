import {createTikTokStyleCaptions, type Caption} from '@remotion/captions';
import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import cues from '../../public/legion5/cues.json';
import {Mono} from './kit';
import {Build, Cta, Hook, Legion, Live, Real, Reveal, Scores, Why} from './scenes';
import {clamp, easeOut, FPS, HEAD, L, ORDER, SC, type Scene, sceneAt, sceneEnd, TOTAL} from './theme';
import {Presenter} from './Vee';

export {TOTAL as LEGION5_FRAMES};
const f = (s: number) => Math.round(s * FPS);
const OVERLAP = 0.45; // a scene keeps rendering under the next one's dither/whip entrance

const SCENES: Record<Scene, React.FC> = {hook: Hook, reveal: Reveal, legion: Legion, build: Build, live: Live, scores: Scores, why: Why, real: Real, cta: Cta};
const LABELS: Record<Scene, string> = {
  hook: '// 00 · the problem',
  reveal: '// 01 · meet vee legion',
  legion: '// 01 · the legion',
  build: '// 02 · define a good call',
  live: '// 03 · run at scale',
  scores: '// 04 · the numbers',
  why: '// 05 · the why',
  real: '// 06 · real calls too',
  cta: '// 07 · private beta',
};

// Top band: section label + running timecode (dither-editorial HUD).
const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const s = sceneAt(frame / FPS);
  const color = s === 'hook' ? 'rgba(255,255,255,0.7)' : L.ink;
  const tc = `00:00:${String(Math.floor(frame / FPS)).padStart(2, '0')}:${String(frame % FPS).padStart(2, '0')}`;
  return (
    <>
      <Mono style={{position: 'absolute', left: 44, top: 30, fontSize: 20, color}}>{LABELS[s]}</Mono>
      <Mono style={{position: 'absolute', right: 44, top: 30, fontSize: 20, color}}>LEGION&nbsp;&nbsp;{tc}</Mono>
    </>
  );
};

// Word-by-word captions (Cartesia timestamps, re-timed in scripts/legion_cues.py).
const {pages} = createTikTokStyleCaptions({captions: cues.words as Caption[], combineTokensWithinMilliseconds: 1100});
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const ms = t * 1000;
  const s = sceneAt(t);
  if (s === 'reveal' || s === 'cta') return null; // on-screen type already says it
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs);
  if (!page) return null;
  const last = page.tokens[page.tokens.length - 1].toMs;
  if (ms > last + 500) return null;
  const inK = interpolate(ms - page.startMs, [0, 180], [0, 1], {...clamp, easing: easeOut});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 26}}>
      <div
        key={page.startMs}
        style={{
          maxWidth: 1300,
          padding: '10px 22px 12px',
          background: L.paper,
          border: `3px solid ${L.ink}`,
          borderRadius: 14,
          fontFamily: HEAD,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: '-0.01em',
          textAlign: 'center',
          opacity: inK,
          transform: `translateY(${(1 - inK) * 10}px)`,
        }}
      >
        {page.tokens.map((w, i) => {
          const active = ms >= w.fromMs && ms < w.toMs;
          return (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span
                style={{
                  padding: '0 5px',
                  borderRadius: 6,
                  background: active ? L.blue : 'transparent',
                  color: active ? L.paper : ms >= w.fromMs ? L.ink : 'rgba(10,10,10,0.3)',
                }}
              >
                {w.text.trim()}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const LegionPromoV5: React.FC = () => (
  <AbsoluteFill style={{background: L.navy, fontFamily: HEAD}}>
    {ORDER.map((s) => {
      const C = SCENES[s];
      const end = s === 'cta' ? cues.duration : sceneEnd(s) + OVERLAP;
      return (
        <Sequence key={s} name={s} from={f(SC[s])} durationInFrames={f(end) - f(SC[s])}>
          <C />
        </Sequence>
      );
    })}
    <Presenter />
    <Hud />
    <Captions />
    {cues.segments.map((seg, i) => (
      <Sequence key={i} name={`vo ${i}`} from={f(seg.at)} durationInFrames={f(seg.to - seg.from) + 1}>
        <Audio src={staticFile('legion5/vo.wav')} trimBefore={f(seg.from)} trimAfter={f(seg.to)} />
      </Sequence>
    ))}
    <Audio src={staticFile('legion5/music.wav')} volume={0.55} />
    <Audio src={staticFile('legion5/sfx.wav')} volume={0.8} />
  </AbsoluteFill>
);
