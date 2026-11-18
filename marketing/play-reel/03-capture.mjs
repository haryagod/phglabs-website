// Step 3: play the real games on play.phglabs.in at phone size and screenshot each moment (question -> tap -> result).
// Writes build/shots/*.png and build/shots.json: per game, a list of steps { img, tap: [x, y] } in CSS px (390x844 screen).
import fs from 'node:fs';
import { launch } from '../reel/pw.mjs';

const SITE = 'https://play.phglabs.in';
const browser = await launch();
fs.mkdirSync('build/shots', { recursive: true });
const only = process.argv.slice(2);
const out = only.length && fs.existsSync('build/shots.json') ? JSON.parse(fs.readFileSync('build/shots.json', 'utf8')) : {};

// Deterministic Math.random so randomly generated questions repeat between runs
const SEED = `(() => { let a = 20261115; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;
const CLEAN = '.toast,.ad{display:none!important} *{transition-duration:0s!important;animation-duration:0s!important;caret-color:transparent!important}';

async function game(name, path, fn, { seed = false } = {}) {
  if (only.length && !only.includes(name.replace(/-.*/, ''))) return;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: false });
  if (seed) await ctx.addInitScript(SEED);
  // Never load ads from a bot: automated ad requests count as invalid traffic for the AdSense account
  await ctx.route(/googlesyndication|doubleclick|googleadservices|adtrafficquality|google\.com\/adsense/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(SITE + path, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: CLEAN });
  await page.evaluate(() => document.fonts.ready);
  const steps = [];
  let n = 0;
  const shot = async (tap) => {
    await page.waitForTimeout(250);
    const img = `${name}-${++n}.png`;
    await page.screenshot({ path: `build/shots/${img}` });
    steps.push(tap ? { img, tap } : { img });
  };
  const center = async (loc) => { const b = await loc.boundingBox(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; };
  const tap = async (loc) => { const c = await center(loc); await loc.click(); return c; };
  await fn({ page, shot, tap, center });
  out[name] = steps;
  await ctx.close();
  console.log(name, steps.length, 'shots');
}

// Output Guess: level 1, pick "22"
await game('og', '/output-guess/', async ({ page, shot, tap }) => {
  await shot();
  await shot(await tap(page.locator('#choices button', { hasText: /^22$/ })));
});

// Bug Hunt: level 1, the off-by-one on line 3
await game('bh', '/bug-hunt/', async ({ page, shot, tap }) => {
  await shot();
  await shot(await tap(page.locator('#code .ln[data-line="3"]')));
});

// Number Series: learn the answer with a throwaway guess, then replay the same seeded question correctly
let nsAnswer;
await game('ns-probe', '/number-series/', async ({ page }) => {
  await page.fill('#input', '0'); await page.press('#input', 'Enter');
  nsAnswer = (await page.locator('#series span').last().textContent()).trim();
}, { seed: true });
await game('ns', '/number-series/', async ({ page, shot, tap }) => {
  await page.evaluate(() => document.activeElement.blur());
  await shot();
  const at = await tap(page.locator('#input'));
  await page.keyboard.type(nsAnswer, { delay: 30 });
  await shot(at);
  await shot(await tap(page.locator('#form button[type="submit"], #form .btn').first()));
}, { seed: true });
delete out['ns-probe'];
fs.rmSync('build/shots/ns-probe-1.png', { force: true });

// Sudoku (easy): solve the grid in the page, then fill one square correctly
await game('su', '/sudoku/', async ({ page, shot, tap }) => {
  const sol = await page.evaluate(() => {
    const g = [...document.querySelectorAll('#grid button')].map((b) => Number(b.textContent) || 0);
    const ok = (i, v) => { const r = Math.floor(i / 9), c = i % 9;
      for (let k = 0; k < 9; k++) if (g[r * 9 + k] === v || g[k * 9 + c] === v || g[(Math.floor(r / 3) * 3 + Math.floor(k / 3)) * 9 + Math.floor(c / 3) * 3 + k % 3] === v) return false; return true; };
    const solve = () => { const i = g.indexOf(0); if (i < 0) return true; for (let v = 1; v <= 9; v++) if (ok(i, v)) { g[i] = v; if (solve()) return true; } g[i] = 0; return false; };
    const empty = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    solve(); return { empty, g };
  });
  const cell = sol.empty[Math.floor(sol.empty.length / 2)];
  await shot();
  await shot(await tap(page.locator('#grid button').nth(cell)));
  await shot(await tap(page.locator('.pad button, #pad button', { hasText: new RegExp(`^${sol.g[cell]}$`) }).first()));
}, { seed: true });

// Reflex: the waiting and green screens, then (in a fresh tab) a result tapped ~200 ms after green, like a quick human
await game('rf', '/reflex/', async ({ page, shot, center }) => {
  const c = await center(page.locator('#arena'));
  await page.mouse.click(...c);
  await shot(c);
  await page.waitForSelector('#arena.go', { timeout: 10000 });
  await shot();
});
await game('rf-result', '/reflex/', async ({ page, shot, center }) => {
  const c = await center(page.locator('#arena'));
  // Tap from inside the page exactly 200 ms after green (waiting from outside adds unpredictable lag)
  await page.evaluate(() => {
    const a = document.getElementById('arena');
    new MutationObserver((_, obs) => {
      if (!a.classList.contains('go')) return;
      obs.disconnect();
      setTimeout(() => a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })), 200);
    }).observe(a, { attributes: true });
  });
  await page.mouse.click(...c);
  await page.waitForFunction(() => / ms$/.test(document.querySelector('#arena h2').textContent), null, { timeout: 10000 });
  await shot(c);
  console.log('REFLEX', (await page.locator('#arena h2').textContent()).trim());
});
if (out['rf-result']) { fs.renameSync('build/shots/rf-result-1.png', 'build/shots/rf-3.png'); out.rf.push({ ...out['rf-result'][0], img: 'rf-3.png' }); delete out['rf-result']; }

// Digit Memory: start, remember, type it back
await game('dm', '/digit-memory/', async ({ page, shot, tap }) => {
  await shot();
  await shot(await tap(page.locator('#go')));
  const num = (await page.locator('.digits').textContent()).trim();
  await page.waitForSelector('#in', { timeout: 10000 });
  await page.evaluate(() => document.activeElement.blur());
  const at = await tap(page.locator('#in'));
  await page.keyboard.type(num, { delay: 30 });
  await shot(at);
  await shot(await tap(page.locator('#f button')));
});

// Daily chess puzzle: same puzzle the page picks today, solved by clicking squares
await game('ch', '/chess/daily/', async ({ page, shot }) => {
  const info = await page.evaluate(async () => {
    const list = await (await fetch('/data/chess-medium.json')).json();
    const day = PLAY.dayNumber();
    return list[((day % list.length) * 7919) % list.length];
  });
  const moves = info[2].split(' ');
  const player = info[1].split(' ')[1] === 'w' ? 'b' : 'w'; // first move is the opponent's
  await page.waitForFunction(() => /Your move/.test(document.getElementById('status').textContent), null, { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById('board').scrollIntoView({ block: 'center' }));
  const box = await page.locator('#board').boundingBox();
  const sq = (s) => { const f = s.charCodeAt(0) - 97, r = Number(s[1]) - 1, w = box.width / 8;
    const col = player === 'w' ? f : 7 - f, row = player === 'w' ? 7 - r : r;
    return [Math.round(box.x + (col + 0.5) * w), Math.round(box.y + (row + 0.5) * w)]; };
  await shot();
  for (let i = 1; i < moves.length; i += 2) {
    const a = sq(moves[i].slice(0, 2)), b = sq(moves[i].slice(2, 4));
    await page.mouse.click(...a); await page.waitForTimeout(150);
    await shot(a);
    await page.mouse.click(...b); await page.waitForTimeout(700);
    await shot(b);
    if (i + 2 < moves.length) await page.waitForTimeout(900);
  }
  console.log('chess status:', (await page.locator('#status').textContent()).slice(0, 60), '| moves', moves.length);
});

fs.writeFileSync('build/shots.json', JSON.stringify(out, null, 1));
await browser.close();
