import React from 'react';
import {getInputProps, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame} from 'remotion';
import {C, clamp, easeInOut, easeOut, glass} from '../brand';
import {callouts, mewsPatches, type Patch, pickupChip, ranges, type Rect, type Screen, screenStill, zooms} from '../cues';
import {FPS} from '../edit';
import {useTime} from '../time';

const SRC = staticFile('source.mp4');
const SRC_W = 1920;
const SRC_H = 1080;
export const WIN = {x: 240, y: 94, w: 1440, h: 810}; // bottom stays clear of two-line subtitles
const MOVE = 0.8; // s per camera move
const MAX_Z = 1.8;

// Source px -> window px for one screen's crop (fit width, centred vertically).
const mapFor = (crop: Rect) => {
  const sc = WIN.w / crop[2];
  const offY = (WIN.h - crop[3] * sc) / 2;
  return {sc, offY, x: (x: number) => (x - crop[0]) * sc, y: (y: number) => (y - crop[1]) * sc + offY};
};
const cropAt = (t: number) => ranges.find((r) => t >= r.from && t < r.to && r.mode === 'mews')?.crop ?? ranges.find((r) => r.mode === 'mews')!.crop!;

// ---- camera (window px) ---------------------------------------------------
type Cam = {z: number; cx: number; cy: number};
const BASE: Cam = {z: 1, cx: WIN.w / 2, cy: WIN.h / 2};
const rectToCam = (r: Rect, crop: Rect): Cam => {
  const m = mapFor(crop);
  const ww = r[2] * m.sc;
  const wh = r[3] * m.sc;
  const z = Math.min(MAX_Z, Math.max(1, 0.9 * Math.min(WIN.w / ww, WIN.h / wh)));
  return {z, cx: m.x(r[0]) + ww / 2, cy: m.y(r[1]) + wh / 2};
};
const holds: {s: number; e: number; cam: Cam}[] = [{s: -Infinity, e: -Infinity, cam: BASE}];
for (const z of zooms) {
  const prev = holds[holds.length - 1];
  if (z.at - prev.e > 2 * MOVE) holds.push({s: prev.e + MOVE, e: z.at, cam: BASE});
  holds.push({s: z.at + MOVE, e: z.until, cam: rectToCam(z.rect, cropAt(z.at))});
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
const cl = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---- callout: spotlight + drawn ring + label, pinned inside the camera -------
const PAD = 10;
const Callout: React.FC<{t: number; z: number; crop: Rect; view: {x: number; y: number; w: number; h: number}}> = ({t, z, crop, view}) => {
  const c = callouts.find((q) => t >= q.at && t < q.until);
  if (!c) return null;
  const m = mapFor(crop);
  const inK = interpolate(t, [c.at, c.at + 0.35], [0, 1], {...clamp, easing: easeOut});
  const outK = interpolate(t, [c.until - 0.2, c.until], [1, 0], clamp);
  const draw = interpolate(t, [c.at + 0.05, c.at + 0.6], [0, 1], {...clamp, easing: easeOut});
  const lab = interpolate(t, [c.at + 0.2, c.at + 0.55], [0, 1], {...clamp, easing: easeOut});
  const x = m.x(c.rect[0]) - PAD;
  const y = m.y(c.rect[1]) - PAD;
  const w = c.rect[2] * m.sc + 2 * PAD;
  const h = c.rect[3] * m.sc + 2 * PAD;
  const gap = 12 / z;
  const labelH = 70 / z;
  const place = y + h + labelH < view.y + view.h ? 'below' : y - labelH > view.y ? 'above' : 'inside';
  const top = place === 'below' ? y + h + gap : place === 'above' ? y - gap : y + h - gap;
  const labelW = (c.label.length * 16 + 50) / z;
  const left = cl(x, view.x + gap, view.x + view.w - labelW - gap) + (place === 'inside' ? gap : 0);
  const up = place !== 'below';
  return (
    <div style={{position: 'absolute', inset: 0, opacity: outK}}>
      <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 14, boxShadow: `0 0 0 4000px rgba(15,23,42,${0.3 * inK})`}} />
      <svg style={{position: 'absolute', left: x, top: y, overflow: 'visible'}} width={w} height={h}>
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0" stopColor={C.cyan} />
            <stop offset="0.5" stopColor={C.teal} />
            <stop offset="1" stopColor={C.green} />
          </linearGradient>
        </defs>
        <rect width={w} height={h} rx={14} fill="none" stroke="url(#ring)" strokeWidth={3 / z} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      </svg>
      <div
        style={{
          ...glass,
          background: 'rgba(255,255,255,0.9)',
          position: 'absolute',
          left,
          top,
          transformOrigin: up ? 'left bottom' : 'left top',
          transform: `translateY(${up ? -100 : 0}%) scale(${1 / z}) translateY(${(1 - lab) * 10}px)`,
          opacity: lab,
          filter: `blur(${(1 - lab) * 6}px)`,
          padding: '12px 22px',
          borderRadius: 16,
          fontSize: 30,
          fontWeight: 600,
          color: C.ink,
          whiteSpace: 'nowrap',
        }}
      >
        {c.label}
      </div>
    </div>
  );
};

// ---- corrections painted over the static screen (source px, scaled with the video) ----
// With line-height 1, Inter's baseline sits 0.863em below the line top; ink tops of
// caps/digits/ascenders sit ~0.74em above the baseline.
const DEBUG = Boolean(getInputProps().debugPatches);
const COVER_PAD = 4;
const PatchText: React.FC<{p: Patch; text: string; color: string}> = ({p, text, color}) => (
  <div
    style={{
      position: 'absolute',
      left: p.box[0],
      top: p.box[1] - 0.123 * p.size + (p.dy ?? 0),
      fontSize: p.size,
      fontWeight: p.weight ?? 400,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      color,
      letterSpacing: '-0.005em',
    }}
  >
    {text.split(/(\s+)/).map((w, i) => (
      <span key={i} style={p.underline?.includes(w) ? {textDecoration: 'underline', textDecorationThickness: 1.5, textUnderlineOffset: 4} : undefined}>
        {w}
      </span>
    ))}
  </div>
);
const Patches: React.FC<{screen: Screen; crop: Rect; t: number}> = ({screen, crop, t}) => {
  const m = mapFor(crop);
  const [a, b] = screenStill[screen];
  const opacity = DEBUG ? 1 : interpolate(t, [a, a + 0.1, b - 0.1, b], [0, 1, 1, 0], clamp);
  if (opacity === 0) return null;
  return (
    <div style={{position: 'absolute', left: -crop[0] * m.sc, top: -crop[1] * m.sc + m.offY, width: SRC_W, height: SRC_H, transform: `scale(${m.sc})`, transformOrigin: '0 0', opacity}}>
      {mewsPatches
        .filter((p) => p.screen === screen)
        .map((p, i) =>
          DEBUG ? (
            <PatchText key={i} p={p} text={p.orig} color="rgba(255,0,0,0.55)" />
          ) : (
            <React.Fragment key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: p.box[0] - COVER_PAD,
                  top: p.box[1] - COVER_PAD,
                  width: (p.coverW ?? p.box[2]) + 2 * COVER_PAD,
                  height: p.box[3] + 2 * COVER_PAD,
                  background: p.bg ?? '#FFFFFF',
                }}
              />
              <PatchText p={p} text={p.text} color={p.color ?? '#24232B'} />
            </React.Fragment>
          ),
        )}
      {pickupChip.screen === screen && !DEBUG ? (
        <div style={{position: 'absolute', left: pickupChip.x, top: pickupChip.y, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, background: '#E4F5EF', color: '#1D7A63', fontSize: 17, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D7A63" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 19v2M17 19v2M5 11h14" />
          </svg>
          {pickupChip.text}
        </div>
      ) : null}
    </div>
  );
};

// One Mews screen as a floating window. The first one grows out of the full frame.
export const MewsWindow: React.FC<{from: number; crop: Rect; screen: Screen; enter: boolean}> = ({from, crop, screen, enter}) => {
  const f = useCurrentFrame();
  const {t} = useTime();
  const k = enter ? spring({frame: f, fps: FPS, config: {damping: 200}, durationInFrames: 36}) : 1;
  const fadeIn = enter ? 1 : interpolate(f, [0, 8], [0, 1], clamp);
  const m = mapFor(crop);
  // entrance: start where the screen sits in the full frame
  const s0 = SRC_W / WIN.w;
  const dx = SRC_W / 2 - (WIN.x + WIN.w / 2);
  const dy = SRC_H / 2 - (WIN.y + WIN.h / 2);
  const {z, cx, cy} = camAt(t);
  const tx = cl(WIN.w / 2 - cx * z, WIN.w - WIN.w * z, 0);
  // zoomed in, keep the letterbox padding above/below the screen out of view
  const top = m.offY;
  const bottom = m.offY + crop[3] * m.sc;
  const ty = (bottom - top) * z >= WIN.h ? cl(WIN.h / 2 - cy * z, WIN.h - bottom * z, -top * z) : cl(WIN.h / 2 - cy * z, WIN.h - WIN.h * z, 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: WIN.x,
        top: WIN.y,
        width: WIN.w,
        height: WIN.h,
        borderRadius: 20 * k,
        overflow: 'hidden',
        background: 'white',
        opacity: fadeIn,
        boxShadow: `0 50px 100px -40px rgba(15,23,42,${0.4 * k}), 0 0 0 1px rgba(15,23,42,${0.06 * k})`,
        transform: `translate(${dx * (1 - k)}px, ${dy * (1 - k)}px) scale(${lerp(s0, 1, k)})`,
      }}
    >
      <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})`}}>
        <div style={{position: 'absolute', left: 0, top: m.offY, width: WIN.w, height: crop[3] * m.sc, overflow: 'hidden'}}>
          <OffthreadVideo
            src={SRC}
            trimBefore={from}
            muted
            style={{position: 'absolute', left: -crop[0] * m.sc, top: -crop[1] * m.sc, width: SRC_W * m.sc, height: SRC_H * m.sc, maxWidth: 'none'}}
          />
        </div>
        <Patches screen={screen} crop={crop} t={t} />
        <Callout t={t} z={z} crop={crop} view={{x: -tx / z, y: -ty / z, w: WIN.w / z, h: WIN.h / z}} />
      </div>
    </div>
  );
};
