import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {veeAt} from './choreo';
import {L} from './theme';
import {Vee3DLayer} from './Vee3D';

// Look-dev: official dithered mascot (left) vs the 3D VEE (right), same framing (hero size, k = 2.25).
// Frame 0 = rest pose; frames 1-5 = rest pose showing mouth decal 1-5; later frames play the
// real choreography from t = frame / 30 + 4, re-positioned into the comparison frame.
const AT = {x: 960 + 110 + 186 * 2.25, y: 180 + 633 * 2.25, k: 2.25};

export const VeeCompare: React.FC = () => {
  const frame = useCurrentFrame();
  const rest = frame <= 5;
  const t = frame / 30 + 4;
  return (
    <AbsoluteFill style={{background: L.blue}}>
      <Img src={staticFile('legion/vee_dither.png')} style={{position: 'absolute', left: 110, top: 180, imageRendering: 'pixelated'}} />
      <Vee3DLayer t={t} pose={rest ? null : {...veeAt(t), ...AT, sx: 1, sy: 1}} at={AT} forceMouth={rest && frame > 0 ? frame : undefined} />
    </AbsoluteFill>
  );
};
