import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, clamp, easeInOut, fontFamily} from './brand';
import {Backdrop} from './components/Backdrop';
import {Chapter} from './components/Chapter';
import {Kinetic} from './components/Kinetic';
import {Subtitles} from './components/Subtitles';
import {ranges, type Mode, type Rect, type Screen} from './cues';
import {FPS, SEGMENTS, srcToOut} from './edit';
import {DemoCard} from './scenes/DemoCard';
import {Hook} from './scenes/Hook';
import {LiveCall} from './scenes/LiveCall';
import {MewsWindow} from './scenes/MewsWindow';
import {TimeProvider} from './time';

const SRC = staticFile('source.mp4');

// Footage pieces = keep-segments ∩ presentation ranges (source frames).
type Piece = {from: number; to: number; mode: Mode; crop?: Rect; screen?: Screen; first: boolean; prev?: Mode};
const pieces: Piece[] = [];
for (const [a, b] of SEGMENTS) {
  ranges.forEach((r, i) => {
    const from = Math.max(a, Math.round(r.from * FPS));
    const to = Math.min(b, Math.round(r.to * FPS));
    if (from >= to || r.mode === 'call') return;
    pieces.push({from, to, mode: r.mode, crop: r.crop, screen: r.screen, first: from === Math.round(r.from * FPS), prev: ranges[i - 1]?.mode});
  });
}

const FullFrame: React.FC<{p: Piece}> = ({p}) => {
  const f = useCurrentFrame();
  // dissolve in only when following the hook or the Mews window
  const fade = p.first ? (p.prev === undefined ? 12 : p.prev === 'mews' ? 6 : 0) : 0;
  const k = fade ? interpolate(f, [0, fade], [0, 1], {...clamp, easing: easeInOut}) : 1;
  return (
    <AbsoluteFill style={{opacity: k}}>
      <OffthreadVideo src={SRC} trimBefore={p.from} muted />
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => (
  <TimeProvider>
    <AbsoluteFill style={{background: C.bg, fontFamily, color: C.ink}}>
      <Backdrop />
      {pieces.map((p) => (
        <Sequence key={p.from} from={srcToOut(p.from / FPS)} durationInFrames={p.to - p.from} name={`${p.mode} ${(p.from / FPS).toFixed(1)}s`}>
          {p.mode === 'mews' ? <MewsWindow from={p.from} crop={p.crop!} screen={p.screen!} enter={p.first && p.prev !== 'mews'} /> : <FullFrame p={p} />}
        </Sequence>
      ))}
      <LiveCall />
      <Chapter />
      <Kinetic />
      <Subtitles />
      <DemoCard />
      <Hook />
    </AbsoluteFill>
  </TimeProvider>
);
