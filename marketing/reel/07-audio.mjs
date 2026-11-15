// Step 7: original synthesized music bed + transition SFX (no licensing issues), then mix with the voiceover.
// Music: I–V–vi–IV in C at 112 BPM. Hook/problem = tense filtered pad + arp; drums enter with AyurOS; CTA rings out.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const FFMPEG = 'C:/hari/code/twin-souls-studio/tools/ffmpeg/ffmpeg.exe';
const TL = JSON.parse(fs.readFileSync('build/timeline.json', 'utf8'));
const SR = 48000, DUR = TL.total, N = Math.ceil(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const at = (id) => TL.scenes.find((s) => s.id === id).start;
const BPM = 112, BEAT = 60 / BPM, BAR = BEAT * 4;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; // C G Am F
let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(t0, buf, gain = 1, pan = 0) {
  const s0 = Math.round(t0 * SR), gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < buf.length; i++) { const j = s0 + i; if (j < 0 || j >= N) continue; L[j] += buf[i] * gl; R[j] += buf[i] * gr; }
}
// Chamberlin state-variable filter, cutoff can vary per sample.
function svf(buf, cutoffAt, q = 0.7, mode = 'lp') {
  let lp = 0, bp = 0; const out = new Float32Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const f = 2 * Math.sin(Math.PI * Math.min(cutoffAt(i / SR), SR / 6) / SR);
    lp += f * bp; const hp = buf[i] - lp - q * bp; bp += f * hp;
    out[i] = mode === 'lp' ? lp : mode === 'bp' ? bp : hp;
  }
  return out;
}
const env = (t, a, d, len) => (t < a ? t / a : t < len ? 1 : Math.max(0, 1 - (t - len) / d));
const saw = (ph) => 2 * (ph % 1) - 1;

const drumsIn = at('ayuros'), ctaT = at('cta');
const bars = Math.ceil(DUR / BAR);
for (let b = 0; b < bars; b++) {
  const t0 = b * BAR, ch = chords[b % 4];
  const finalBar = t0 >= ctaT + BAR * 0.5;
  // Pad: detuned saws, filter opens as the ad builds.
  const len = finalBar ? DUR - t0 : BAR, n = Math.ceil((len + 0.6) * SR), pad = new Float32Array(n);
  for (const m of ch) for (const det of [-0.08, 0, 0.08]) {
    const f = hz(m + det);
    for (let i = 0; i < n; i++) pad[i] += saw((f * i) / SR + det) * 0.05;
  }
  for (let i = 0; i < n; i++) pad[i] *= env(i / SR, 0.25, 0.6, len);
  const open = t0 < drumsIn ? 700 : 1800;
  add(t0, svf(pad, (t) => open + 300 * Math.sin(t * 2)), 0.9, 0);
  if (finalBar) break;
  // Arp: 8th notes over chord tones, plucky, with a simple stereo echo.
  const arpNotes = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12];
  for (let k = 0; k < 8; k++) {
    const m = arpNotes[k % 4], f = hz(m), nn = Math.ceil(0.35 * SR), pl = new Float32Array(nn);
    for (let i = 0; i < nn; i++) { const tt = i / SR; pl[i] = (Math.abs(saw((f * i) / SR)) * 2 - 1) * Math.exp(-tt * 12) * 0.12; }
    const tk = t0 + k * BEAT / 2;
    add(tk, pl, 1, -0.3); add(tk + BEAT * 0.75, pl, 0.35, 0.4);
  }
  // Bass + drums from AyurOS onwards
  if (t0 + 0.01 >= drumsIn - BAR) {
    for (let k = 0; k < 8; k++) {
      const f = hz(ch[0] - 24), nn = Math.ceil(0.25 * SR), bs = new Float32Array(nn);
      for (let i = 0; i < nn; i++) { const tt = i / SR; bs[i] = (Math.sin(2 * Math.PI * f * tt) + 0.3 * saw(f * tt)) * Math.min(1, tt * 200) * Math.exp(-tt * 6) * 0.22; }
      add(t0 + k * BEAT / 2, bs, t0 >= drumsIn ? 1 : 0.5);
    }
  }
  if (t0 >= drumsIn) {
    for (let k = 0; k < 4; k++) {
      const nn = Math.ceil(0.4 * SR), kick = new Float32Array(nn);
      let ph = 0;
      for (let i = 0; i < nn; i++) { const tt = i / SR; ph += (45 + 90 * Math.exp(-tt * 30)) / SR; kick[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-tt * 8) * 0.55; }
      add(t0 + k * BEAT, kick);
      const hn = Math.ceil(0.06 * SR), hat = new Float32Array(hn);
      for (let i = 0; i < hn; i++) hat[i] = rnd() * Math.exp(-(i / SR) * 70) * 0.12;
      add(t0 + k * BEAT + BEAT / 2, svf(hat, () => 7000, 0.5, 'hp'), 1, 0.2);
      if (k % 2 === 1) { // clap
        const cn = Math.ceil(0.18 * SR), cl = new Float32Array(cn);
        for (let i = 0; i < cn; i++) cl[i] = rnd() * Math.exp(-(i / SR) * 25) * 0.18;
        add(t0 + k * BEAT, svf(cl, () => 1500, 0.8, 'bp'), 1, -0.1);
      }
    }
  }
}
// SFX: whoosh into every cut, riser + impact into the CTA.
function whoosh(center, len = 0.55, gain = 0.35) {
  const n = Math.ceil(len * SR), w = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = i / n; w[i] = rnd() * Math.sin(Math.PI * p) ** 2; }
  add(center - len * 0.7, svf(w, (t) => 300 + 5000 * Math.sin(Math.PI * Math.min(1, t / len)), 0.4, 'bp'), gain);
}
TL.scenes.slice(1).forEach((s) => whoosh(s.start));
{
  const len = 1.6, n = Math.ceil(len * SR), r = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = i / n; r[i] = rnd() * p * p * 0.5; }
  add(ctaT - len, svf(r, (t) => 400 + 6000 * (t / len) ** 2, 0.3, 'bp'), 0.4);
  const bn = Math.ceil(1.5 * SR), boom = new Float32Array(bn);
  let ph = 0;
  for (let i = 0; i < bn; i++) { const tt = i / SR; ph += (38 + 60 * Math.exp(-tt * 12)) / SR; boom[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-tt * 2.5) * 0.8 + rnd() * Math.exp(-tt * 20) * 0.15; }
  add(ctaT, boom);
}
// Master fade-out + write 32-bit float WAV
let peak = 0;
for (let i = 0; i < N; i++) { const f = Math.min(1, (DUR - i / SR) / 1.2, (i / SR) / 0.05); L[i] *= f; R[i] *= f; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const data = Buffer.alloc(N * 8);
for (let i = 0; i < N; i++) { data.writeFloatLE(L[i] / peak * 0.9, i * 8); data.writeFloatLE(R[i] / peak * 0.9, i * 8 + 4); }
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22);
h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
fs.writeFileSync('build/music.wav', Buffer.concat([h, data]));

// Mix: VO clips at their scene times, music ducked under the voice (sidechain), loudness to -14 LUFS for Instagram.
const vo = TL.scenes.map((s) => ['-i', `build/vo/${s.id}.wav`]).flat();
const delays = TL.scenes.map((s, i) => `[${i + 1}]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay=${Math.round(s.voStart * 1000)}:all=1[v${i}]`).join(';');
const filter = `${delays};${TL.scenes.map((_, i) => `[v${i}]`).join('')}amix=inputs=${TL.scenes.length}:normalize=0,`
  + `highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,volume=1.6,apad,asplit=2[vo][sc];`
  + `[0]volume=0.42[mus];[mus][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[duck];`
  + `[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]`;
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', 'build/music.wav', ...vo, '-filter_complex', filter, '-map', '[out]', '-t', String(DUR), '-c:a', 'pcm_s16le', 'build/mix.wav']);
console.log('wrote build/music.wav and build/mix.wav', DUR.toFixed(2) + 's');
