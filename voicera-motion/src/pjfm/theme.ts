import {Easing} from 'remotion';

export const FPS = 30;

/** Source still (PJFM_Chat.mp4). */
export const SRC = {w: 1880, h: 878};
export const FRAME = {w: 1920, h: 1080};
export const SCALE = Math.min(FRAME.w / SRC.w, FRAME.h / SRC.h);
export const OFF = {
  x: (FRAME.w - SRC.w * SCALE) / 2,
  y: (FRAME.h - SRC.h * SCALE) / 2,
};

/** White panel bbox on the source still, padded so the smear is covered. */
const PAD = 10;
export const WIDGET = {
  x: OFF.x + 1248 * SCALE - PAD,
  y: OFF.y + 95 * SCALE - PAD,
  w: 600 * SCALE + PAD * 2,
  h: 750 * SCALE + PAD * 2,
};

export const PJ = {
  bg: '#111815',
  header: '#0b1124',
  headerEnd: '#152038',
  body: '#f3f4f7',
  ink: '#1c2430',
  sub: '#6b7380',
  user: '#5eb3bc',
  userInk: '#0b2a30',
  bot: '#e4e8ee',
  footer: '#0f1528',
  send: '#5aaeb8',
  line: 'rgba(15,21,40,0.08)',
  success: '#1f7a4d',
};

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const clamp = {easing: easeOut, extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
