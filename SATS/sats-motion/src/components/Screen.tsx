import React from 'react';
import {Img, staticFile} from 'remotion';
import {C} from '../brand';
import {edgeAt, edgePath, NODES, type NodeId, type Rect} from '../canvas';
import {ease, easeIO, lerp} from '../tl';

export type Win = {x: number; y: number; w: number; h: number};
export type Cam = {cx: number; cy: number; z: number};
export type Key = Cam & {at: number; dur?: number};

/** Camera at time t: holds each key, easing from the previous one over `dur` seconds. */
export const camAt = (t: number, keys: Key[]): Cam => {
  let cur: Cam = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k.at) break;
    const p = easeIO(t, k.at, k.at + (k.dur ?? 1.1));
    cur = {cx: lerp(cur.cx, k.cx, p), cy: lerp(cur.cy, k.cy, p), z: lerp(cur.z, k.z, p)};
  }
  return cur;
};

const scaleOf = (win: Win, imgW: number, cam: Cam) => (win.w / imgW) * cam.z;

/** Keeps the view inside the image (centres it when the image is smaller than the window). */
export const clampCam = (win: Win, img: {w: number; h: number}, cam: Cam): Cam => {
  const s = scaleOf(win, img.w, cam);
  const hw = win.w / 2 / s;
  const hh = win.h / 2 / s;
  const cl = (v: number, h: number, size: number) => (h * 2 >= size ? size / 2 : Math.min(Math.max(v, h), size - h));
  return {cx: cl(cam.cx, hw, img.w), cy: cl(cam.cy, hh, img.h), z: cam.z};
};

/** Image pixel -> stage pixel (cam must already be clamped). */
export const project = (win: Win, imgW: number, cam: Cam, x: number, y: number): [number, number] => {
  const s = scaleOf(win, imgW, cam);
  return [win.x + win.w / 2 + (x - cam.cx) * s, win.y + win.h / 2 + (y - cam.cy) * s];
};

export const Screen: React.FC<{
  src: string;
  img: {w: number; h: number};
  win: Win;
  cam: Cam;
  radius?: number;
  bg?: string;
  style?: React.CSSProperties;
  children?: (s: number) => React.ReactNode;
}> = ({src, img, win, cam, radius = 22, bg = '#F7F8FA', style, children}) => {
  const s = scaleOf(win, img.w, cam);
  return (
    <div
      style={{
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        borderRadius: radius,
        overflow: 'hidden',
        background: bg,
        boxShadow: '0 40px 90px -40px rgba(15,23,42,0.45), 0 0 0 1px rgba(29,29,31,0.07)',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: img.w,
          height: img.h,
          transformOrigin: '0 0',
          transform: `translate(${win.w / 2 - cam.cx * s}px, ${win.h / 2 - cam.cy * s}px) scale(${s})`,
        }}
      >
        <Img src={staticFile(src)} style={{width: img.w, height: img.h, display: 'block'}} />
        {children?.(s)}
      </div>
    </div>
  );
};

// ---------- overlays in image coordinates ----------

/** White veil over everything except the holes; hole strength k (0..1) animates the spotlight. */
export const Veil: React.FC<{img: {w: number; h: number}; amount: number; holes: {r: Rect; k: number}[]; id: string}> = ({img, amount, holes, id}) =>
  amount <= 0.001 ? null : (
    <svg width={img.w} height={img.h} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <mask id={id}>
          <rect width={img.w} height={img.h} fill="#fff" />
          {holes.map(({r, k}, i) => (
            <rect key={i} x={r[0] - 8} y={r[1] - 8} width={r[2] - r[0] + 16} height={r[3] - r[1] + 16} rx={16} fill="#000" fillOpacity={k} />
          ))}
        </mask>
      </defs>
      <rect width={img.w} height={img.h} fill="#F4F6F9" fillOpacity={0.72 * amount} mask={`url(#${id})`} />
    </svg>
  );

/** Gradient ring + glow around a node (or any rect). */
export const Ring: React.FC<{id: NodeId | string; r?: Rect; k: number; s: number; color?: string}> = ({id, r, k, s, color}) => {
  if (k <= 0.001) return null;
  const [x0, y0, x1, y1] = r ?? NODES[id as NodeId];
  const pad = 6;
  const sw = 3.2 / Math.max(s, 0.6);
  return (
    <svg
      width={x1 - x0 + pad * 2 + 20}
      height={y1 - y0 + pad * 2 + 20}
      style={{position: 'absolute', left: x0 - pad - 10, top: y0 - pad - 10, overflow: 'visible', opacity: k, filter: `drop-shadow(0 0 ${10 / s}px ${color ?? C.cyan}AA)`}}
    >
      <defs>
        <linearGradient id={`rg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color ?? C.cyan} />
          <stop offset="0.5" stopColor={color ?? C.teal} />
          <stop offset="1" stopColor={color ?? C.green} />
        </linearGradient>
      </defs>
      <rect x={10} y={10} width={x1 - x0 + pad * 2} height={y1 - y0 + pad * 2} rx={16} fill="none" stroke={`url(#rg-${id})`} strokeWidth={sw * (0.85 + 0.15 * k)} />
    </svg>
  );
};

/** A comet of light travelling along a wire, starting at `at`. */
export const Pulse: React.FC<{edge: string; t: number; at: number; dur?: number; s: number}> = ({edge, t, at, dur = 0.55, s}) => {
  const p = ease(t, at, at + dur);
  const fade = 1 - ease(t, at + dur, at + dur + 0.35);
  if (t < at || fade <= 0) return null;
  const [hx, hy] = edgeAt(edge, p);
  const L = 0.35;
  const sw = 3.5 / Math.max(s, 0.6);
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: fade}}>
      <path d={edgePath(edge)} pathLength={1} fill="none" stroke={C.cyan} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${L} 2`} strokeDashoffset={L - p} style={{filter: `drop-shadow(0 0 ${4 / s}px ${C.cyan})`}} />
      <circle cx={hx} cy={hy} r={5.5 / Math.max(s, 0.6)} fill="#fff" stroke={C.cyan} strokeWidth={sw * 0.8} style={{filter: `drop-shadow(0 0 ${6 / s}px ${C.cyan})`}} />
    </svg>
  );
};
