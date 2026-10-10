import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import words from '../../public/words.json';
import {C, clamp, easeOut, glass} from '../brand';
import {kinetic, subtitleRanges} from '../cues';
import {useTime} from '../time';

type W = {text: string; start: number; end: number};
const MAX = 84; // two lines of ~42 chars

// Sentences, split at commas (then anywhere) into chunks of at most MAX chars.
const chunks: {text: string; from: number; to: number}[] = [];
let cur: W[] = [];
const len = (ws: W[]) => ws.map((w) => w.text).join(' ').length;
const flush = (ws: W[]) => {
  if (!ws.length) return;
  if (len(ws) <= MAX) {
    chunks.push({text: ws.map((w) => w.text).join(' '), from: ws[0].start - 0.1, to: ws[ws.length - 1].end + 0.4});
    return;
  }
  // prefer the comma closest to the middle, else the most balanced word break
  const half = len(ws) / 2;
  const best = (ok: (i: number) => boolean) => {
    let cut = -1;
    for (let i = 1; i < ws.length; i++) {
      if (!ok(i) || len(ws.slice(0, i)) > MAX || len(ws.slice(i)) > MAX * 2) continue;
      if (cut < 0 || Math.abs(len(ws.slice(0, i)) - half) < Math.abs(len(ws.slice(0, cut)) - half)) cut = i;
    }
    return cut;
  };
  let cut = best((i) => /,$/.test(ws[i - 1].text));
  if (cut < 0) cut = best(() => true);
  flush(ws.slice(0, cut));
  flush(ws.slice(cut));
};
for (const w of words as W[]) {
  cur.push(w);
  if (/[.?!]$/.test(w.text)) (flush(cur), (cur = []));
}
flush(cur);
// never overlap the next chunk; never shorter than 1 s
chunks.forEach((c, i) => {
  const next = chunks[i + 1];
  c.to = Math.max(c.to, c.from + 1.0);
  if (next && c.to > next.from) c.to = next.from;
});

export const Subtitles: React.FC = () => {
  const {t} = useTime();
  if (!subtitleRanges.some(([a, b]) => t >= a && t < b)) return null;
  if (kinetic.some((q) => t >= q.at && t < q.at + q.dur)) return null; // the kinetic line already says it
  const i = chunks.findIndex((c) => t >= c.from && t < c.to);
  if (i < 0) return null;
  const c = chunks[i];
  if (kinetic.some((q) => c.from >= q.at - 0.3 && c.from < q.at + q.dur)) return null; // nor its tail after the line fades
  const k = interpolate(t, [c.from, c.from + 0.2], [0, 1], {...clamp, easing: easeOut}) * interpolate(t, [c.to - 0.2, c.to], [1, 0], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 28}}>
      <div
        key={i}
        style={{
          ...glass,
          background: 'rgba(255,255,255,0.84)',
          padding: '12px 30px 14px',
          maxWidth: 1180,
          fontSize: 44,
          lineHeight: 1.22,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          textAlign: 'center',
          textWrap: 'balance',
          color: C.ink,
          opacity: k,
          transform: `translateY(${(1 - k) * 10}px)`,
        }}
      >
        {c.text}
      </div>
    </AbsoluteFill>
  );
};
