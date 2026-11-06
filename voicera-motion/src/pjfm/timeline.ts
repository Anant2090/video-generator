import {LINES} from './script';
import {FPS} from './theme';

export type Timed =
  | {
      id: string;
      who: 'user';
      text: string;
      typeStart: number;
      typeEnd: number;
      sent: number;
    }
  | {
      id: string;
      who: 'bot';
      text: string;
      kind?: 'card' | 'closing';
      dotsAt: number;
      shown: number;
      until: number;
    };

const typeDur = (text: string) => Math.max(1.2, text.length / 24);
const holdDur = (text: string) => {
  const words = text.trim() ? text.trim().split(/\s+/).length : 8;
  return Math.max(3.9, 3.35 + words * 0.145);
};

const timed: Timed[] = [];
let t = 0.7;

for (const line of LINES) {
  if (line.kind === 'card') {
    const shown = t + 0.25;
    const until = shown + 7.2;
    timed.push({id: line.id, who: 'bot', text: line.text, kind: 'card', dotsAt: t, shown, until});
    t = until;
    continue;
  }
  if (line.who === 'user') {
    const typeStart = t + 0.5;
    const typeEnd = typeStart + typeDur(line.text);
    const sent = typeEnd + 0.22;
    timed.push({id: line.id, who: 'user', text: line.text, typeStart, typeEnd, sent});
    t = sent;
    continue;
  }
  const dotsAt = t + 0.2;
  const shown = dotsAt + 0.85;
  const until = shown + holdDur(line.text);
  timed.push({id: line.id, who: 'bot', text: line.text, kind: line.kind, dotsAt, shown, until});
  t = until;
}

export const TURNS = timed;
export const SUCCESS_AT = t + 0.5;
export const FADE_OUT = SUCCESS_AT + 5.8;
export const TOTAL_SEC = FADE_OUT + 0.65;
export const PJFM_FRAMES = Math.round(TOTAL_SEC * FPS);

export const typingAt = (sec: number) => {
  const u = TURNS.find((x) => x.who === 'user' && sec >= x.typeStart && sec < x.sent);
  if (!u || u.who !== 'user') return null;
  const p = Math.min(1, Math.max(0, (sec - u.typeStart) / Math.max(0.01, u.typeEnd - u.typeStart)));
  const n = Math.floor(p * u.text.length);
  return {text: u.text.slice(0, n), sending: sec >= u.typeEnd};
};

export const dotsAt = (sec: number) =>
  TURNS.some((x) => x.who === 'bot' && sec >= x.dotsAt && sec < x.shown);

export const visibleTurns = (sec: number) =>
  TURNS.filter((x) => (x.who === 'user' ? sec >= x.sent : sec >= x.shown));
