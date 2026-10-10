// Every contact keyframe in src/legion/choreo.ts must put VEE's fingertip (or prop tip) on its target.
//   node scripts/check_ik.mjs
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'out', 'legion-choreo-check.mjs'); // inside the project so node_modules resolve
await build({
  stdin: {contents: "export {_ikCheck} from './src/legion/choreo.ts';", resolveDir: root, loader: 'ts'},
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  logLevel: 'error',
  external: ['react', 'react-dom', 'remotion', '@remotion/*'],
});
const {_ikCheck} = await import(pathToFileURL(out).href);
const rows = _ikCheck();
let bad = 0;
for (const r of rows) {
  const ok = r.err <= 6;
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'BAD'} t=${r.t.toFixed(3)} ${r.kind.padEnd(6)} want (${r.want.map((v) => v.toFixed(0))}) got (${r.got.map((v) => v.toFixed(0))}) err ${r.err.toFixed(1)}px`);
}
console.log(bad ? `${bad} / ${rows.length} contacts out of reach` : `all ${rows.length} contacts within 6 px`);
process.exit(bad ? 1 : 0);
