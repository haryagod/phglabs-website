// Step 6: render composition.html frame by frame in headless Edge -> ffmpeg (silent video).
//   node 06-render.mjs            full render -> build/video.mp4
//   node 06-render.mjs stills 1.2 5.5 ...   preview frames -> build/stills/
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { launch } from './pw.mjs';
const FFMPEG = 'C:/hari/code/twin-souls-studio/tools/ffmpeg/ffmpeg.exe';
const FPS = 30;
const TL = JSON.parse(fs.readFileSync('build/timeline.json', 'utf8'));
const OFF = JSON.parse(fs.readFileSync('build/site-offsets.json', 'utf8'));
fs.copyFileSync('composition.html', 'build/composition.html');

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', (m) => console.log('[page]', m.text()));
await page.addInitScript(([tl, off]) => { window.TL = tl; window.SITE_OFFSETS = off; }, [TL, OFF]);
await page.goto(pathToFileURL(path.resolve('build/composition.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => window.ready);

const [mode, ...times] = process.argv.slice(2);
if (mode === 'stills') {
  fs.mkdirSync('build/stills', { recursive: true });
  for (const t of times) {
    await page.evaluate((t) => window.seek(t), Number(t));
    await page.screenshot({ path: `build/stills/t${t}.jpg`, type: 'jpeg', quality: 85 });
  }
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
