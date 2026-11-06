import fs from 'node:fs';
import path from 'node:path';
import {downloadWhisperModel, installWhisperCpp, toCaptions, transcribe} from '@remotion/install-whisper-cpp';

const root = path.resolve(import.meta.dirname, '..');
const whisperPath = path.join(root, 'whisper.cpp');
const version = '1.5.5';
const model = 'base.en';

await installWhisperCpp({to: whisperPath, version});
await downloadWhisperModel({model, folder: whisperPath});

const whisperCppOutput = await transcribe({
  inputPath: path.join(root, 'public', 'pjfm', 'inbound-16k.wav'),
  whisperPath,
  whisperCppVersion: version,
  model,
  tokenLevelTimestamps: true,
  additionalArgs: [['--prompt', 'The Glorious Church, Voicera, Miracle Dome, Prophet Jerome, baptism, Katunayake, Sinhala']],
  onProgress: (p) => process.stdout.write(`\r${Math.round(p * 100)}%`),
});

const {captions} = toCaptions({whisperCppOutput});
const out = path.join(root, 'public', 'pjfm', 'inbound-captions.json');
fs.writeFileSync(out, JSON.stringify(captions, null, 1));
console.log(`\n${captions.length} captions -> ${out}`);
