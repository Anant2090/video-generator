import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {easeOut, GRADIENT} from '../brand';
import {endCard} from '../timeline';

export const END_CARD_FRAMES = 180;
const LAST = staticFile('last-frame.png'); // the source's final frame (scripts/setup.py)
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Continues straight from the source's last frame: its focus (e.g. a logo) glides up,
// then the CTA and URL rise in beneath it.
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const move = spring({frame: f - 6, fps, config: {damping: 200}, durationInFrames: 40});
  const cta = interpolate(f, [28, 52], [0, 1], {...clamp, easing: easeOut});
  const url = interpolate(f, [38, 62], [0, 1], {...clamp, easing: easeOut});
  const shine = interpolate(f, [80, 115], [-30, 130], clamp);

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* one soft-masked copy: its edges are near-black already, so frame 0 matches Canva's last frame */}
      <Img
        src={LAST}
        style={{
          position: 'absolute',
          inset: 0,
          maskImage: 'radial-gradient(ellipse 75% 75% at 50% 45%, #000 55%, transparent 100%)',
          transformOrigin: `50% ${endCard!.focusY}px`,
          transform: `translateY(${-150 * move}px) scale(${1 - 0.38 * move})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 640,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '20px 46px',
            borderRadius: 999,
            background: GRADIENT,
            color: '#0B0B0C',
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            boxShadow: `0 0 70px -12px rgba(62,205,240,${0.6 * cta})`,
            opacity: cta,
            filter: `blur(${(1 - cta) * 8}px)`,
            transform: `translateY(${(1 - cta) * 24}px)`,
          }}
        >
          {endCard!.cta}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent ${shine - 20}%, rgba(255,255,255,0.65) ${shine}%, transparent ${shine + 20}%)`,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: 'rgba(255,255,255,0.72)',
            opacity: url,
            transform: `translateY(${(1 - url) * 16}px)`,
          }}
        >
          {endCard!.url}
        </div>
      </div>
    </AbsoluteFill>
  );
};
