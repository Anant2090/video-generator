import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {fontFamily} from '../brand';
import {ChatWidget} from './ChatWidget';
import {FADE_OUT, PJFM_FRAMES} from './timeline';
import {clamp, FPS, OFF, PJ, SCALE, SRC} from './theme';

export {PJFM_FRAMES};

export const PjfmChat: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const fade = interpolate(t, [FADE_OUT, PJFM_FRAMES / FPS], [1, 0], clamp);

  return (
    <AbsoluteFill style={{background: PJ.bg, fontFamily}}>
      <AbsoluteFill style={{opacity: fade}}>
        <Img
          src={staticFile('pjfm/homepage.png')}
          style={{
            position: 'absolute',
            left: OFF.x,
            top: OFF.y,
            width: SRC.w * SCALE,
            height: SRC.h * SCALE,
          }}
        />
        <ChatWidget />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.04)`,
        }}
      />
    </AbsoluteFill>
  );
};
