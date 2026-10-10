import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, FPS, HEAD, k, L, MONO} from './theme';

/** Scene-local time in seconds. */
export const useT = () => useCurrentFrame() / FPS;

/** Spring 0..1 (overshoots) starting at `at` seconds. */
export const pop = (t: number, at: number, stiffness = 180, damping = 13) =>
  t < at ? 0 : spring({frame: (t - at) * FPS, fps: FPS, config: {stiffness, damping}});

// --- 1-bit Bayer dither: the video's signature transition ---------------------------
const BAYER = (() => {
  let b = [[0]];
  for (let i = 0; i < 3; i++) {
    const n = b.length;
    const nb = Array.from({length: 2 * n}, () => Array<number>(2 * n).fill(0));
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = 4 * b[y][x];
        nb[y][x] = v;
        nb[y][x + n] = v + 2;
        nb[y + n][x] = v + 3;
        nb[y + n][x + n] = v + 1;
      }
    b = nb;
  }
  return b;
})();
const masks = new Map<string, string>();
/** CSS mask tile: 8x8 cells of `cell` px, cells with Bayer value < level (0..64) opaque. */
export const bayerMask = (level: number, cell: number) => {
  const key = `${level}:${cell}`;
  if (!masks.has(key)) {
    let rects = '';
    BAYER.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v < level) rects += `<rect x='${x * cell}' y='${y * cell}' width='${cell}' height='${cell}'/>`;
      }),
    );
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${cell * 8}' height='${cell * 8}'>${rects}</svg>`;
    masks.set(key, `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`);
  }
  return masks.get(key)!;
};
/** Reveals children through an ordered-dither pattern over `dur` seconds. */
export const DitherIn: React.FC<{dur?: number; cell?: number; children: React.ReactNode}> = ({dur = 0.32, cell = 16, children}) => {
  const p = useT() / dur;
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const m = bayerMask(Math.round(Math.max(0, p) * 64), cell);
  const size = `${cell * 8}px ${cell * 8}px`;
  return (
    <AbsoluteFill style={{WebkitMaskImage: m, maskImage: m, WebkitMaskSize: size, maskSize: size, WebkitMaskRepeat: 'repeat', maskRepeat: 'repeat'}}>
      {children}
    </AbsoluteFill>
  );
};

/** Fast horizontal whip between two UI shots (motion-blurred). */
export const WhipIn: React.FC<{dur?: number; children: React.ReactNode}> = ({dur = 0.24, children}) => {
  const p = k(useT(), 0, dur, easeInOut);
  return (
    <AbsoluteFill style={{transform: `translateX(${(1 - p) * 1920}px)`, filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined}}>
      {children}
    </AbsoluteFill>
  );
};

// --- mascot (each size has its own dither so the 3px dot grain stays crisp) -------------
const POSES = {
  bust: 'legion/vee_dither.png', // 741x900
  card: 'legion/vee_card.png', // 159x192
  cardRed: 'legion/vee_card_red.png',
};
export const Mascot: React.FC<{pose: keyof typeof POSES; style?: React.CSSProperties}> = ({pose, style}) => (
  <Img src={staticFile(POSES[pose])} style={{display: 'block', imageRendering: 'pixelated', ...style}} />
);

/** Sound rings off VEE's headset — the "voice" motif. */
export const Rings: React.FC<{t: number; x: number; y: number; size?: number; color?: string}> = ({t, x, y, size = 220, color = L.ink}) => (
  <svg style={{position: 'absolute', left: x - size, top: y - size, overflow: 'visible'}} width={size * 2} height={size * 2}>
    {[0, 1, 2].map((i) => {
      const ph = (t * 0.8 + i / 3) % 1;
      return (
        <path
          key={i}
          d={`M ${size + size * ph * 0.9 * Math.cos(-0.7)} ${size + size * ph * 0.9 * Math.sin(-0.7)} A ${size * ph * 0.9} ${size * ph * 0.9} 0 0 1 ${size + size * ph * 0.9 * Math.cos(0.7)} ${size + size * ph * 0.9 * Math.sin(0.7)}`}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={(1 - ph) * 0.9}
        />
      );
    })}
  </svg>
);

// --- real UI in a floating window with a camera --------------------------------------
export type Cam = {cx: number; cy: number; w: number}; // screenshot px (1920x1080 space)
export type Win = {x: number; y: number; w: number; h: number}; // stage px
export const WIN: Win = {x: 330, y: 72, w: 1540, h: 866}; // right of the presenter VEE (bottom-left)

/** Camera between keyframes [seconds, cam], eased. */
export const camAt = (t: number, keys: [number, Cam][]): Cam => {
  const ts = keys.map(([s]) => s);
  const f = (sel: (c: Cam) => number) =>
    interpolate(t, ts, keys.map(([, c]) => sel(c)), {...clamp, easing: easeInOut});
  return {cx: f((c) => c.cx), cy: f((c) => c.cy), w: f((c) => c.w)};
};
/** Screenshot px -> stage px for a given window + camera. */
export const toStage = (win: Win, cam: Cam, x: number, y: number) => {
  const s = win.w / cam.w;
  const h = win.h / s;
  return {x: win.x + (x - (cam.cx - cam.w / 2)) * s, y: win.y + (y - (cam.cy - h / 2)) * s, s};
};

/** Screenshot (3840x2160 capture, laid out in 1920x1080 px) viewed through `cam`. Children use screenshot px. */
export const UIWindow: React.FC<{src: string; cam: Cam; win?: Win; children?: React.ReactNode}> = ({src, cam, win = WIN, children}) => {
  const s = win.w / cam.w;
  const h = win.h / s;
  return (
    <div
      style={{
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        borderRadius: 22,
        overflow: 'hidden',
        background: '#EEF1F6',
        boxShadow: `0 0 0 3px ${L.ink}, 14px 14px 0 0 ${L.ink}`, // flat editorial shadow
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 1920,
          height: 1080,
          transformOrigin: '0 0',
          transform: `scale(${s}) translate(${-(cam.cx - cam.w / 2)}px, ${-(cam.cy - h / 2)}px)`,
        }}
      >
        <Img src={staticFile(src)} style={{width: 1920, height: 1080, display: 'block'}} />
        {children}
      </div>
    </div>
  );
};

/** Outline that draws itself around a screenshot rect (inside UIWindow). */
export const DrawRect: React.FC<{r: [number, number, number, number]; p: number; color: string; s: number; fill?: string}> = ({r, p, color, s, fill}) => {
  const [x, y, w, h] = r;
  const pad = 8;
  return (
    <svg style={{position: 'absolute', left: x - pad, top: y - pad, overflow: 'visible'}} width={w + 2 * pad} height={h + 2 * pad}>
      <rect
        width={w + 2 * pad}
        height={h + 2 * pad}
        rx={16}
        fill={fill ?? 'none'}
        fillOpacity={p}
        stroke={color}
        strokeWidth={5 / s}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
      />
    </svg>
  );
};

// --- type & tags ------------------------------------------------------------------------
export const Mono: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontFamily: MONO, fontSize: 22, fontWeight: 500, letterSpacing: '0.02em', ...style}}>{children}</div>
);

type Tone = 'paper' | 'red' | 'blue' | 'green';
const TONES: Record<Tone, {bg: string; fg: string}> = {
  paper: {bg: L.paper, fg: L.ink},
  red: {bg: L.red, fg: L.paper},
  blue: {bg: L.blue, fg: L.paper},
  green: {bg: L.green, fg: L.paper},
};
/** Hard-edged editorial tag that pops in at `at`. */
export const Tag: React.FC<{t: number; at: number; tone?: Tone; x: number; y: number; size?: number; children: React.ReactNode}> = ({
  t,
  at,
  tone = 'paper',
  x,
  y,
  size = 30,
  children,
}) => {
  const p = pop(t, at);
  if (p <= 0) return null;
  const c = TONES[tone];
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transformOrigin: 'left center',
        transform: `scale(${0.7 + 0.3 * p}) rotate(${(1 - p) * -3}deg)`,
        opacity: Math.min(1, p * 1.5),
        background: c.bg,
        color: c.fg,
        border: `3px solid ${L.ink}`,
        boxShadow: `6px 6px 0 ${L.ink}`,
        borderRadius: 12,
        padding: `${size * 0.36}px ${size * 0.66}px`,
        fontFamily: HEAD,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
};

/** Pointer that glides to (x,y) by `at` and clicks. */
export const Cursor: React.FC<{t: number; from: [number, number]; to: [number, number]; start: number; at: number}> = ({t, from, to, start, at}) => {
  const p = k(t, start, at, easeInOut);
  const click = k(t, at, at + 0.25);
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p;
  return (
    <>
      {click > 0 && click < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: x - 40 * click,
            top: y - 40 * click,
            width: 80 * click,
            height: 80 * click,
            borderRadius: '50%',
            border: `4px solid ${L.blue}`,
            opacity: 1 - click,
          }}
        />
      ) : null}
      <svg style={{position: 'absolute', left: x - 4, top: y - 2, transform: `scale(${1 - 0.12 * Math.sin(click * Math.PI)})`}} width={34} height={44} viewBox="0 0 17 22">
        <path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L14 12 Z" fill={L.paper} stroke={L.ink} strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </>
  );
};

// --- VEE's props & speech bubble (dither-editorial: flat fills, ink outline, hard shadow) ----------
const deg = (rad: number) => (-rad * 180) / Math.PI; // model angle (CCW, y up) -> CSS rotate (CW, y down)

/** Rubber stamp held at the fingertip, pointing along the forearm (`angle`, model radians). */
export const StampTool: React.FC<{at: [number, number]; angle: number; k: number; len: number}> = ({at, angle, k: s, len}) => {
  const ln = len * s;
  const w = 38 * s;
  return (
    <div style={{position: 'absolute', left: at[0], top: at[1], transformOrigin: '0 0', transform: `rotate(${deg(angle)}deg)`}}>
      <div style={{position: 'absolute', left: -8 * s, top: -9 * s, width: 18 * s, height: 18 * s, borderRadius: '50%', background: L.ink}} />
      <div style={{position: 'absolute', left: 4 * s, top: -4 * s, width: ln * 0.35, height: 8 * s, background: L.ink}} />
      <div
        style={{
          position: 'absolute',
          left: ln * 0.38,
          top: -w / 2,
          width: ln * 0.5,
          height: w,
          background: L.amber,
          border: `${2.5 * s}px solid ${L.ink}`,
          borderRadius: 4 * s,
          boxSizing: 'border-box',
        }}
      />
      <div style={{position: 'absolute', left: ln * 0.88, top: -w / 2 - 3 * s, width: ln * 0.12, height: w + 6 * s, background: L.red, border: `${2 * s}px solid ${L.ink}`, boxSizing: 'border-box'}} />
    </div>
  );
};

/** The FAIL ink mark left by the stamp: slams in (scale 1.5 -> 1), inky dithered texture. */
export const StampMark: React.FC<{t: number; at: number; x: number; y: number}> = ({t, at, x, y}) => {
  if (t < at) return null;
  const p = k(t, at, at + 0.12);
  const m = bayerMask(54, 3);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(-9deg) scale(${1.5 - 0.5 * p})`,
        opacity: Math.min(1, p * 3),
        padding: '4px 26px',
        border: `9px solid ${L.red}`,
        borderRadius: 14,
        color: L.red,
        fontFamily: HEAD,
        fontWeight: 800,
        fontSize: 88,
        letterSpacing: '0.06em',
        lineHeight: 1,
        WebkitMaskImage: m,
        maskImage: m,
        WebkitMaskSize: '24px 24px',
        maskSize: '24px 24px',
      }}
    >
      FAIL
    </div>
  );
};

/** Big RUN button on a stand; `pressed` 0..1 pushes the dome down. */
export const RunButton: React.FC<{x: number; top: number; r: number; pressed: number; show: number}> = ({x, top, r, pressed, show}) => (
  <div style={{position: 'absolute', left: x, top, transform: `translateY(${(1 - show) * 420}px)`}}>
    {/* stand */}
    <div
      style={{
        position: 'absolute',
        left: -58,
        top: r * 0.55,
        width: 116,
        height: 1080 - top,
        background: L.navy,
        border: `4px solid ${L.ink}`,
        borderRadius: '10px 10px 0 0',
        boxSizing: 'border-box',
      }}
    >
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 26, color: L.paper, textAlign: 'center', marginTop: 26, letterSpacing: '0.1em'}}>RUN</div>
      <div style={{fontFamily: MONO, fontSize: 13, color: L.mint, textAlign: 'center', marginTop: 4}}>240 calls</div>
    </div>
    {/* base ring */}
    <div style={{position: 'absolute', left: -r - 10, top: r * 0.35, width: 2 * r + 20, height: r * 0.55, borderRadius: '50%', background: L.ink}} />
    {/* dome */}
    <div
      style={{
        position: 'absolute',
        left: -r,
        top: 10 * pressed,
        width: 2 * r,
        height: r * (0.95 - 0.35 * pressed),
        borderRadius: `${r}px ${r}px ${r * 0.5}px ${r * 0.5}px`,
        background: L.red,
        border: `4px solid ${L.ink}`,
        boxSizing: 'border-box',
        boxShadow: `inset -${r * 0.25}px -${r * 0.15}px 0 rgba(0,0,0,0.25)`,
      }}
    />
  </div>
);

/** "prod-call.wav" file card, centred at (x, y). */
export const FileCard: React.FC<{x: number; y: number; scale?: number; rot?: number; opacity?: number}> = ({x, y, scale = 1, rot = 0, opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 118,
      height: 146,
      transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
      opacity,
      background: L.paper,
      border: `4px solid ${L.ink}`,
      boxShadow: `6px 6px 0 ${L.ink}`,
      borderRadius: '8px 26px 8px 8px',
      boxSizing: 'border-box',
      padding: '14px 10px',
    }}
  >
    <svg width={90} height={40} viewBox="0 0 90 40">
      {Array.from({length: 13}, (_, i) => {
        const h = 6 + 28 * Math.abs(Math.sin(i * 1.7));
        return <rect key={i} x={i * 7} y={20 - h / 2} width={4} height={h} rx={2} fill={L.blue} />;
      })}
    </svg>
    <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 13, color: L.ink, marginTop: 12, lineHeight: 1.2}}>
      prod-call
      <br />
      .wav
    </div>
  </div>
);

/** Comic speech bubble whose tail points down at (x, y) (VEE's head top). */
export const SpeechBubble: React.FC<{t: number; at: number; dur: number; x: number; y: number; text: string}> = ({t, at, dur, x, y, text}) => {
  if (t < at || t > at + dur) return null;
  const p = pop(t, at, 260, 14);
  const out = 1 - k(t, at + dur - 0.15, at + dur);
  const left = Math.max(40, Math.min(1880, x));
  return (
    <div style={{position: 'absolute', left, top: y, transform: `translate(-50%, -100%) scale(${p * out})`, transformOrigin: '50% 100%'}}>
      <div
        style={{
          position: 'relative',
          padding: '10px 24px 12px',
          background: L.paper,
          border: `4px solid ${L.ink}`,
          boxShadow: `6px 6px 0 ${L.ink}`,
          borderRadius: 22,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 40,
          color: L.ink,
          whiteSpace: 'nowrap',
          marginBottom: 22,
        }}
      >
        {text}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -17,
            width: 26,
            height: 26,
            background: L.paper,
            borderRight: `4px solid ${L.ink}`,
            borderBottom: `4px solid ${L.ink}`,
            transform: 'translateX(-50%) rotate(45deg)',
          }}
        />
      </div>
    </div>
  );
};
