// analysis/audio16k.wav -> public/captions.json (word-level, @remotion/captions format)
import fs from 'node:fs';
import path from 'node:path';
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from '@remotion/install-whisper-cpp';

const root = path.resolve(import.meta.dirname, '..');
const video = JSON.parse(fs.readFileSync(path.join(root, 'src/video.json'), 'utf8'));
const whisperPath = path.join(root, 'whisper.cpp');
const version = '1.5.5'; // prebuilt Windows binary
const model = 'medium.en';

await installWhisperCpp({to: whisperPath, version});
// A cut-off earlier download leaves a partial file that downloadWhisperModel would reuse.
const modelFile = path.join(whisperPath, `ggml-${model}.bin`);
if (fs.existsSync(modelFile) && fs.statSync(modelFile).size < 1_533_774_781) fs.rmSync(modelFile);
await downloadWhisperModel({model, folder: whisperPath});

const whisperCppOutput = await transcribe({
  inputPath: path.join(root, 'analysis/audio16k.wav'),
  whisperPath,
  whisperCppVersion: version,
  model,
  tokenLevelTimestamps: true,
  // Biases spelling of brand/product names (whisperPrompt in src/video.json).
  additionalArgs: video.whisperPrompt ? [['--prompt', video.whisperPrompt]] : [],
  onProgress: (p) => process.stdout.write(`\r${Math.round(p * 100)}%`),
});

const {captions} = toCaptions({whisperCppOutput});
fs.writeFileSync(path.join(root, 'public/captions.json'), JSON.stringify(captions, null, 1));
console.log(`\n${captions.length} captions written`);
