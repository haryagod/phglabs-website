// Step 4: scene timing from the voiceover lengths + whisper word timings, and the phone schedule
// (which game screenshot shows when, where the finger taps, when a result badge pops) -> build/timeline.json
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const FFPROBE = 'C:/hari/code/twin-souls-studio/tools/ffmpeg/ffprobe.exe';
const { scenes } = JSON.parse(fs.readFileSync('script.json', 'utf8'));
const SHOTS = JSON.parse(fs.readFileSync('build/shots.json', 'utf8'));

// Extra hold after each line so the result on screen can land before the cut
const TAIL = { hook: 0.35, code: 0.75, puzzles: 0.75, brain: 0.85, chess: 0.9, cta: 2.4 };
const LEAD = 0.18;

// Phone script: [screenshot, when] per scene. "w:word+0.2" = that word's start + 0.2 s; a number = seconds after the line starts.
// A screenshot with a tap in shots.json gets a finger tap just before it appears.
const PHONE = {
  code: [['og-1', 0], ['og-2', 'w:prints+0.05'], ['bh-1', 'w:then'], ['bh-2', 'w:bug+0.1']],
  puzzles: [['ns-1', 0], ['ns-2', 'w:number'], ['ns-3', 'w:pattern+0.1'], ['su-1', 'w:and'], ['su-2', 'w:fill'], ['su-3', 'w:sudoku+0.15']],
  brain: [['rf-1', 0], ['rf-2', 'w:reflexes'], ['rf-3', 'w:reflexes+0.4'], ['dm-2', 'w:and+0.05'], ['dm-3', 'w:memory'], ['dm-4', 'w:memory+0.45']],
  chess: [['ch-1', 0], ['ch-2', 'w:fresh'], ['ch-3', 'w:chess+0.15'], ['ch-4', 'w:every'], ['ch-5', 'w:day+0.05']],
};
// Result badges next to the phone
const BADGE = { 'og-2': '✓ Correct!', 'bh-2': '🐞 Bug found!', 'ns-3': '✓ +20 points', 'su-3': '✓ Nice!', 'rf-3': '⚡ 205 ms', 'dm-4': '🧠 Remembered!', 'ch-5': '♞ Solved!' };

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9.]/g, '').replace(/\.$/, '');
let t = 0;
const out = { scenes: [], words: [], phone: [], taps: [], badges: [] };
for (const [i, s] of scenes.entries()) {
  const voDur = Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `build/vo/${s.id}.wav`]).toString());
  const start = t, voStart = start + (i === 0 ? 0.05 : LEAD);
  const end = voStart + voDur + TAIL[s.id];
  const words = JSON.parse(fs.readFileSync(`build/words/${s.id}.json`, 'utf8')).transcription
    .map((w) => ({ w: w.text.trim(), s: +(voStart + w.offsets.from / 1000).toFixed(3), e: +(voStart + w.offsets.to / 1000).toFixed(3), scene: s.id }))
    .filter((w) => w.w);
  out.scenes.push({ id: s.id, headline: s.headline, start: +start.toFixed(3), end: +end.toFixed(3), voStart: +voStart.toFixed(3), voDur });
  out.words.push(...words);

  const at = (spec) => {
    if (typeof spec === 'number') return voStart + spec;
    const [, word, plus] = /^w:([^+]+)(?:\+([\d.]+))?$/.exec(spec);
    const hit = words.find((w) => norm(w.w) === word);
    if (!hit) throw new Error(`no word "${word}" in ${s.id}`);
    return hit.s + Number(plus || 0);
  };
  for (const [img, when] of PHONE[s.id] || []) {
    const game = img.split('-')[0], step = SHOTS[game].find((x) => x.img === `${img}.png`);
    if (!step) throw new Error(`no screenshot ${img}`);
    const show = when === 0 ? start : at(when);
    if (step.tap) out.taps.push({ t: +(show - 0.14).toFixed(3), x: step.tap[0], y: step.tap[1] });
    out.phone.push({ img: `shots/${img}.png`, game, t: +show.toFixed(3), scene: s.id });
    if (BADGE[img]) out.badges.push({ t: +(show + 0.08).toFixed(3), text: BADGE[img], scene: s.id, game, end: +(end - 0.1).toFixed(3) });
  }
  // A badge leaves as soon as the next game slides in
  for (const b of out.badges.filter((x) => x.scene === s.id)) {
    const next = out.phone.find((p) => p.scene === s.id && p.t > b.t && p.game !== b.game);
    if (next) b.end = +Math.min(b.end, next.t + 0.1).toFixed(3);
  }
  t = end;
}
out.total = +t.toFixed(3);
fs.writeFileSync('build/timeline.json', JSON.stringify(out, null, 1));
console.log(out.scenes.map((s) => `${s.id.padEnd(8)} ${s.start.toFixed(2)}-${s.end.toFixed(2)}`).join('\n'), '\ntotal', out.total, '| phone', out.phone.length, 'taps', out.taps.length, 'badges', out.badges.length);
