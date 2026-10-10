import {createTikTokStyleCaptions, type Caption} from '@remotion/captions';
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import words from '../../public/words.json';
import {C, easeOut, glass, GRADIENT} from '../brand';
import {FPS} from '../timeline';

const {pages} = createTikTokStyleCaptions({
  captions: words as Caption[],
  combineTokensWithinMilliseconds: 1400,
});

// Bottom band, below the floating window. Spoken words ink, upcoming faint,
// active word gets a brand-gradient underline.
export const Captions: React.FC = () => {
  const ms = (useCurrentFrame() / FPS) * 1000;
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs);
  if (!page) return null;
  const lastMs = page.tokens[page.tokens.length - 1].toMs;
  if (ms > lastMs + 600) return null; // don't linger through silences

  const k = interpolate(ms - page.startMs, [0, 220], [0, 1], {extrapolateRight: 'clamp', easing: easeOut});
  const out = interpolate(ms, [lastMs + 450, lastMs + 600], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 34}}>
      <div
        key={page.startMs} // fresh DOM per page
        style={{
          ...glass,
          padding: '12px 28px 14px',
          maxWidth: 1500,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          textAlign: 'center',
          opacity: k * out,
          transform: `translateY(${(1 - k) * 12}px)`,
        }}
      >
        {page.tokens.map((t, i) => {
          const active = ms >= t.fromMs && ms < t.toMs;
          const u = interpolate(ms - t.fromMs, [0, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          // key by position, not fromMs: two words can share a start time (353.26s),
          // and duplicate keys leave orphaned words in the DOM for the rest of the render
          return (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span
                style={{
                  position: 'relative',
                  color: ms >= t.fromMs ? C.ink : 'rgba(29,29,31,0.35)',
                }}
              >
                {t.text.trim()}
                {active ? (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: -5,
                      height: 4,
                      borderRadius: 2,
                      background: GRADIENT,
                      transform: `scaleX(${u})`,
                      transformOrigin: 'left',
                    }}
                  />
                ) : null}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
