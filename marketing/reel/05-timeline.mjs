// Step 5: scene timing from the voiceover lengths + word timings from Whisper -> build/timeline.json
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const FFPROBE = 'C:/hari/code/twin-souls-studio/tools/ffmpeg/ffprobe.exe';
const pick = { hook: 1, problem: 0, ayuros: 1, shopstock: 1, custom: 1, cta: 0 };
const { scenes } = JSON.parse(fs.readFileSync('script.json', 'utf8'));
const LEAD = 0.2, TAIL = 0.25, END_HOLD = 2.2;
let t = 0;
const out = { scenes: [], words: [] };
for (const [i, s] of scenes.entries()) {
  const voDur = Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `build/vo/${s.id}.wav`]).toString());
  const start = t, voStart = start + (i === 0 ? 0.05 : LEAD);
  const end = voStart + voDur + (s.id === 'cta' ? END_HOLD : TAIL);
  const words = JSON.parse(fs.readFileSync(`build/words/${s.id}.json`, 'utf8')).transcription
    .map((w) => ({ w: w.text.trim(), s: +(voStart + w.offsets.from / 1000).toFixed(3), e: +(voStart + w.offsets.to / 1000).toFixed(3), scene: s.id }))
    .filter((w) => w.w);
  out.scenes.push({ id: s.id, headline: s.headline, start: +start.toFixed(3), end: +end.toFixed(3), voStart: +voStart.toFixed(3), voDur, img: `img/${s.id}-${pick[s.id]}.png` });
  out.words.push(...words);
  t = end;
}
out.total = +t.toFixed(3);
fs.writeFileSync('build/timeline.json', JSON.stringify(out, null, 1));
console.log(out.scenes.map((s) => `${s.id} ${s.start}-${s.end}`).join('\n'), '\ntotal', out.total);
