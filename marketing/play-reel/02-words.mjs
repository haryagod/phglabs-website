// Step 2: word timings for captions (whisper.cpp large-v3-turbo on the GPU, one word per segment).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const T = 'C:/hari/code/twin-souls-studio';
const { scenes } = JSON.parse(fs.readFileSync('script.json', 'utf8'));
fs.mkdirSync('build/words', { recursive: true });
for (const s of scenes) {
  execFileSync(`${T}/tools/ffmpeg/ffmpeg.exe`, ['-y', '-loglevel', 'error', '-i', `build/vo/${s.id}.wav`, '-ar', '16000', '-ac', '1', `build/words/${s.id}.16k.wav`]);
  execFileSync(`${T}/tools/whisper-cuda/whisper-cli.exe`, ['-m', `${T}/models/whisper/ggml-large-v3-turbo-q5_0.bin`, '-l', 'en', '-ml', '1', '-sow', '-oj',
    '--prompt', s.vo, '-f', `build/words/${s.id}.16k.wav`, '-of', `build/words/${s.id}`], { stdio: 'ignore' });
  const words = JSON.parse(fs.readFileSync(`build/words/${s.id}.json`, 'utf8')).transcription.map((w) => w.text.trim()).filter(Boolean);
  console.log(s.id.padEnd(8), words.join(' '));
}
