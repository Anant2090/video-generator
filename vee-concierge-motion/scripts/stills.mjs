// node scripts/stills.mjs 45 85.5 o:30 ...   (source seconds, or o:<output frame>)
// -> out/stills/<label>.png, bundled once, plus out/stills/sheet.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const edit = JSON.parse(fs.readFileSync(path.join(root, 'src/edit.json'), 'utf8'));
const segOut = [];
edit.segments.reduce((at, [a, b]) => (segOut.push(at), at + b - a), edit.hookFrames);
const srcToOut = (s) => {
  const sf = s * edit.fps;
  for (let i = 0; i < edit.segments.length; i++) {
    const [a, b] = edit.segments[i];
    if (sf < a) return segOut[i];
    if (sf < b || i === edit.segments.length - 1) return Math.round(segOut[i] + sf - a);
  }
};

const out = path.join(root, 'out/stills');
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const inputProps = process.env.DEBUG_PATCHES ? {debugPatches: true} : {};
const composition = await selectComposition({serveUrl, id: 'Main', inputProps});
const files = [];
for (const arg of process.argv.slice(2)) {
  const frame = arg.startsWith('o:') ? Number(arg.slice(2)) : srcToOut(Number(arg));
  const file = path.join(out, `${arg.replace(':', '')}.png`);
  await renderStill({serveUrl, composition, inputProps, frame: Math.min(frame, composition.durationInFrames - 1), output: file, chromiumOptions: {gl: 'angle'}});
  files.push(file);
  console.log(arg, '-> frame', frame);
}
// contact sheet with labels
const cols = Math.min(3, files.length);
const filter = files.map((_, i) => `[${i}]scale=640:-1,drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='${path.basename(files[i], '.png')}':x=8:y=8:fontsize=24:fontcolor=red:box=1:boxcolor=white@0.8[v${i}]`).join(';');
const layout = files.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${filter};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black`, path.join(out, 'sheet.png')]);
