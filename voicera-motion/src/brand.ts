import {loadFont} from '@remotion/google-fonts/Inter';
import type {CSSProperties} from 'react';
import {Easing} from 'remotion';

export const {fontFamily} = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

// Sampled from vlmUI logo (hue buckets of the orbit mark).
export const C = {
  cyan: '#3ECDF0',
  teal: '#64D4C1',
  green: '#A4E06F',
  yellow: '#DAE72D',
  ink: '#1D1D1F',
  sub: '#6E6E73',
  bg: '#F5F5F7',
  faint: 'rgba(29,29,31,0.08)',
  tealInk: '#139FC6',
};

export const GRADIENT = `linear-gradient(90deg, ${C.cyan}, ${C.teal} 35%, ${C.green} 70%, ${C.yellow})`;
// Darker shades of the same hues, for text/strokes on light backgrounds.
export const GRADIENT_INK = 'linear-gradient(90deg, #139FC6, #23AE93 50%, #5FAF2E)';

// Text/UI entrances; camera moves use the symmetric in-out.
export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const gradientText: CSSProperties = {
  backgroundImage: GRADIENT_INK,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

export const glass: CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(29,29,31,0.08)',
  borderRadius: 20,
  boxShadow: '0 10px 30px -10px rgba(15,23,42,0.18)',
};
