// Step 2: local neural TTS (Kokoro-82M, ONNX) -> one WAV per scene. Model cached in TwinStudio's models folder.
import fs from 'node:fs';
import { env } from '@huggingface/transformers';
import { KokoroTTS } from 'kokoro-js';
env.cacheDir = 'C:/hari/code/twin-souls-studio/models/transformers';
const voice = process.argv[2] ?? 'af_heart';
const { scenes } = JSON.parse(fs.readFileSync('script.json', 'utf8'));
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'fp32', device: 'cpu' });
fs.mkdirSync('build/vo', { recursive: true });
for (const s of scenes) {
  const audio = await tts.generate(s.vo.replace('P H G labs dot in', 'P.H.G. labs dot in'), { voice, speed: 1.0 });
  audio.save(`build/vo/${s.id}.wav`);
  console.log(s.id, (audio.audio.length / audio.sampling_rate).toFixed(2) + 's');
}
