// Step 5: render composition.html frame by frame in headless Edge -> ffmpeg on the GPU (silent video).
//   node 05-render.mjs                       full render -> build/video.mp4
//   node 05-render.mjs stills 1.2 5.5 ...    preview frames -> build/stills/ (+ build/stills.jpg contact sheet)
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { launch } from '../reel/pw.mjs';
const FFMPEG = 'C:/hari/code/twin-souls-studio/tools/ffmpeg/ffmpeg.exe';
const FPS = 30;
const TL = JSON.parse(fs.readFileSync('build/timeline.json', 'utf8'));
fs.copyFileSync('composition.html', 'build/composition.html');

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[page error]', e.message));
await page.addInitScript((tl) => { window.TL = tl; }, TL);
await page.goto(pathToFileURL(path.resolve('build/composition.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.ready);

const [mode, ...times] = process.argv.slice(2);
if (mode === 'stills') {
  fs.rmSync('build/stills', { recursive: true, force: true });
  fs.mkdirSync('build/stills', { recursive: true });
  for (const [i, t] of times.entries()) {
    await page.evaluate((t) => window.seek(t), Number(t));
    await page.screenshot({ path: `build/stills/${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 85 });
  }
  const n = times.length, cols = Math.min(n, 5), rows = Math.ceil(n / cols);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', '1', '-i', 'build/stills/%02d.jpg',
    '-vf', `scale=324:-1,tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', 'build/stills.jpg']);
} else {
  const frames = Math.ceil(TL.total * FPS);
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', '16', '-b:v', '0', '-profile:v', 'high', '-pix_fmt', 'yuv420p', 'build/video.mp4'],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`\rframe ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
