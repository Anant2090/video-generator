// public/captions.json (whisper sub-word tokens) -> public/words.json (whole words, brand spellings fixed)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const tokens = JSON.parse(fs.readFileSync(path.join(root, 'public/captions.json'), 'utf8'));

// Whisper hears the product names phonetically.
// Anchored; longest first. A match must consume the whole span (bar trailing "'s"/punctuation).
// Brand spellings (confirmed by user): "VEE", "Voicera".
const FIXES = [
  [/^V ?dial ?er/i, 'VEE Dialer'],
  [/^Voice ?ra/i, 'Voicera'],
  [/^Vo ?ic ?era/i, 'Voicera'],
  [/^V(?=\W*$)/, 'VEE'],
  [/^S ?MS/, 'SMS'],
  [/^IV ?R/, 'IVR'],
];

const words = [];
for (const t of tokens) {
  if (/^\s*\[.*\]\s*$|^\s*>>\s*$/.test(t.text)) continue; // [MUSIC], speaker marks
  const startsWord = /^\s/.test(t.text) || words.length === 0;
  const isPunct = /^[.,!?;:'’]/.test(t.text.trim()) && !/^\s/.test(t.text);
  if (startsWord && !isPunct) words.push({text: t.text.trim(), startMs: t.startMs, endMs: t.endMs});
  else {
    const w = words[words.length - 1];
    w.text += t.text.trim();
    w.endMs = t.endMs;
  }
}

// Merge misheard multi-word spans into one fixed word, keeping outer timing.
const fixSpan = (joined) => {
  for (const [re, to] of FIXES) {
    const m = re.exec(joined);
    const rest = m && joined.slice(m[0].length);
    if (m && !/\s/.test(rest)) return to + rest;
  }
  return null;
};
for (let i = 0; i < words.length; i++) {
  for (const n of [3, 2, 1]) {
    const span = words.slice(i, i + n);
    if (span.length < n) continue;
    const joined = span.map((w) => w.text).join(' ');
    const fixed = fixSpan(joined);
    if (fixed && fixed !== joined) {
      words.splice(i, n, {text: fixed, startMs: span[0].startMs, endMs: span[n - 1].endMs});
      break;
    }
  }
}

// Drop sound tags: [MUSIC], (air whooshing), (bell chimes)...
let inTag = false;
const spoken = words.filter((w) => {
  if (/^[[(]/.test(w.text)) inTag = true;
  const keep = !inTag;
  if (/[\])][.,]?$/.test(w.text)) inTag = false;
  return keep;
});
words.splice(0, words.length, ...spoken);

fs.writeFileSync(
  path.join(root, 'public/words.json'),
  // Leading space = word boundary for createTikTokStyleCaptions.
  JSON.stringify(words.map((w) => ({...w, text: ` ${w.text}`, timestampMs: w.startMs, confidence: null})), null, 1),
);
console.log(`${words.length} words`);
