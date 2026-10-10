import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, easeInOut} from '../brand';
import {CROP, FPS, ranges, S, SRC_H, SRC_W, WIN, zooms} from '../timeline';
import {Callout} from './Callout';
import {SmoothScroll} from './SmoothScroll';

const SRC = staticFile('source.mp4');

// ---- camera -------------------------------------------------------------
type Cam = {z: number; cx: number; cy: number}; // window px
type Rect = [number, number, number, number];
const BASE: Cam = {z: 1, cx: WIN.w / 2, cy: WIN.h / 2};
const MOVE = 0.8; // seconds per camera move
const MAX_Z = 1.6; // UI is recorded at high browser zoom already

const rectToCam = ([x, y, w, h]: Rect): Cam => {
  const ww = w * S;
  const wh = h * S;
  const z = Math.min(MAX_Z, Math.max(1, 0.9 * Math.min(WIN.w / ww, WIN.h / wh)));
  return {z, cx: (x - CROP.x) * S + ww / 2, cy: (y - CROP.y) * S + wh / 2};
};

// Still stretches; eased moves between them. Zooms closer than 2*MOVE pan directly.
const holds: {s: number; e: number; cam: Cam}[] = [{s: -Infinity, e: -Infinity, cam: BASE}];
for (const z of zooms) {
  const prev = holds[holds.length - 1];
  if (z.at - prev.e > 2 * MOVE) holds.push({s: prev.e + MOVE, e: z.at, cam: BASE});
  holds.push({s: z.at + MOVE, e: z.until, cam: rectToCam(z.rect)});
}
holds.push({s: holds[holds.length - 1].e + MOVE, e: Infinity, cam: BASE});

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const camAt = (t: number): Cam => {
  const i = holds.findIndex((h) => t <= h.e);
  const h = holds[i];
  if (t >= h.s) return h.cam;
  const p = holds[i - 1];
  const k = easeInOut((t - p.e) / (h.s - p.e));
  return {z: lerp(p.cam.z, h.cam.z, k), cx: lerp(p.cam.cx, h.cam.cx, k), cy: lerp(p.cam.cy, h.cam.cy, k)};
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---- presentations -------------------------------------------------------
const Backdrop: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const a = 20 + 8 * Math.sin(t / 9);
  const b = 80 + 6 * Math.cos(t / 11);
  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(55% 75% at ${a}% 15%, ${C.cyan}30, transparent 70%)`,
          `radial-gradient(50% 70% at ${b}% 90%, ${C.green}2A, transparent 70%)`,
          C.bg,
        ].join(','),
      }}
    />
  );
};

// Screen recording as a floating window. Enters from its exact source position
// (seamless with the cut) and settles into WIN; hosts the zoom camera.
const Framed: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 36});
  const dx = CROP.x + CROP.w / 2 - (WIN.x + WIN.w / 2);
  const dy = CROP.y + CROP.h / 2 - (WIN.y + WIN.h / 2);
  const s0 = CROP.w / WIN.w;

  const {z, cx, cy} = camAt((from + f) / FPS);
  const tx = clamp(WIN.w / 2 - cx * z, WIN.w - WIN.w * z, 0);
  const ty = clamp(WIN.h / 2 - cy * z, WIN.h - WIN.h * z, 0);

  return (
    <div
      style={{
        position: 'absolute',
        left: WIN.x,
        top: WIN.y,
        width: WIN.w,
        height: WIN.h,
        borderRadius: 18 * k,
        overflow: 'hidden',
        background: 'white',
        boxShadow: `0 40px 90px -30px rgba(15,23,42,${0.35 * k}), 0 0 0 1px rgba(15,23,42,${0.06 * k})`,
        transform: `translate(${dx * (1 - k)}px, ${dy * (1 - k)}px) scale(${lerp(s0, 1, k)})`,
      }}
    >
      <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})`}}>
        <OffthreadVideo
          src={SRC}
          trimBefore={from}
          style={{position: 'absolute', left: -CROP.x * S, top: -CROP.y * S, width: SRC_W * S, height: SRC_H * S}}
        />
        <SmoothScroll t={from + f} />
        <Callout t={(from + f) / FPS} z={z} view={{x: -tx / z, y: -ty / z, w: WIN.w / z, h: WIN.h / z}} />
      </div>
    </div>
  );
};

// Phone clips on white: multiply drops the white so they float on the backdrop.
const Blend: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp', easing: easeInOut});
  return (
    <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: k, transform: `scale(${lerp(1.03, 1, k)})`}}>
      <OffthreadVideo src={SRC} trimBefore={from} />
    </AbsoluteFill>
  );
};

export const Stage: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    {ranges.map((r) => (
      <Sequence key={r.from} from={r.from} durationInFrames={r.to - r.from} name={`${r.mode} ${r.from}`}>
        {r.mode === 'full' ? (
          <OffthreadVideo src={SRC} trimBefore={r.from} />
        ) : r.mode === 'blend' ? (
          <Blend from={r.from} />
        ) : (
          <Framed from={r.from} />
        )}
      </Sequence>
    ))}
  </AbsoluteFill>
);
