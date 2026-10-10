// node scripts/stills.mjs 12.5 40 ...   (seconds) -> out/stills/<t>.png (bundled once) + out/stills/sheet.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'out/stills');
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Main'});
const files = [];
for (const arg of process.argv.slice(2)) {
  const frame = Math.min(Math.round(Number(arg) * composition.fps), composition.durationInFrames - 1);
  const file = path.join(out, `${arg}.png`);
  await renderStill({serveUrl, composition, frame, output: file, chromiumOptions: {gl: 'angle'}});
  files.push(file);
  console.log(arg, '-> frame', frame);
}
if (files.length > 1) {
  const cols = Math.min(3, files.length);
  const filter = files
    .map((_, i) => `[${i}]scale=640:-1,drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='${path.basename(files[i], '.png')}s':x=8:y=8:fontsize=24:fontcolor=red:box=1:boxcolor=white@0.8[v${i}]`)
    .join(';');
  const layout = files.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${filter};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black`, path.join(out, 'sheet.png')]);
}
