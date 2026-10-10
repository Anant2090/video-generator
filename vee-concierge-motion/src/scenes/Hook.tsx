import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {clamp, easeInOut} from '../brand';
import {HOOK_TEXT} from '../cues';
import {FPS, HOOK} from '../edit';
import {useTime} from '../time';
import {Words} from '../components/Kinetic';
import {Backdrop} from '../components/Backdrop';

// Loop seam: frame 0 is backdrop + orbit mark only, matching DemoCard's last frame.
export const ORBIT = {x: 960, y: 150, size: 76};

export const Orbit: React.FC<{opacity?: number; scale?: number}> = ({opacity = 1, scale = 1}) => (
  <Img
    src={staticFile('orbit.png')}
    style={{position: 'absolute', left: ORBIT.x - ORBIT.size / 2, top: ORBIT.y - ORBIT.size / 2, width: ORBIT.size, height: ORBIT.size, opacity, transform: `scale(${scale})`}}
  />
);

export const Hook: React.FC = () => {
  const {f} = useTime();
  if (f >= HOOK + 14) return null;
  const local = f / FPS;
  const text = interpolate(f, [HOOK - 18, HOOK - 4], [1, 0], {...clamp, easing: easeInOut});
  const all = interpolate(f, [HOOK, HOOK + 14], [1, 0], {...clamp, easing: easeInOut}); // lobby dissolves in under this
  return (
    <AbsoluteFill style={{opacity: all}}>
      <Backdrop />
      <Orbit />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 6,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          opacity: text,
          filter: `blur(${(1 - text) * 10}px)`,
          transform: `scale(${0.96 + 0.04 * text})`,
        }}
      >
        <div>
          <Words text={HOOK_TEXT[0]} local={local} size={112} delay={0.2} />
        </div>
        <div>
          <Words text={HOOK_TEXT[1]} local={local} size={112} delay={0.75} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
