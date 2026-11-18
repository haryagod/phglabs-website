// Drafts the long-form "guide" section for each game page with the local LLM (Ollama, qwen3:14b).
// Drafts go to tools/drafts/<page>.html for a human check; tools/insert-guides.mjs then puts them in the pages.
//   node tools/draft-guides.mjs [page ...]      (default: every page below)
import fs from 'node:fs';
import vm from 'node:vm';

const OLLAMA = 'http://127.0.0.1:11434/api/generate';
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const data = (file, key) => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(ROOT + file, 'utf8'), ctx); return ctx.window[key]; };
const og = data('data/output-guess.js', 'OUTPUT_GUESS'), bh = data('data/bug-hunt.js', 'BUG_HUNT');

// Facts the model must stay within (taken from the game code, so the text never promises what the game doesn't do)
const FACTS = {
  'output-guess': `${og.length} levels. Each shows a short JavaScript snippet; the player picks what console.log prints from 4 choices. +1 point only on the first try. After every answer there is an explanation. Snippets cover: ${og.map((q) => q.code.split('\n').pop()).slice(0, 15).join(' | ')}`,
  'bug-hunt': `${bh.length} short JavaScript programs, each with exactly one buggy line; the player clicks that line. +1 point on the first try. The fixed line and an explanation are shown. Programs: ${bh.map((l) => l.title).join(', ')}.`,
  sudoku: 'Easy, Medium and Hard. Every puzzle is freshly generated in the browser and has exactly one solution. Tap a square, then a number (or use the keyboard: 1-9, arrows, Backspace). Clashing numbers are highlighted. Hints fill one correct square. A best time is saved only for puzzles solved without hints.',
  'number-series': 'Rounds of 10 questions, 30 seconds each, harder as the round goes on. 10 points per right answer plus up to 10 bonus points for speed. Patterns used: add or subtract a fixed number, multiply, growing gaps, square numbers (±1), each number = sum of the two before, primes, alternately add and multiply, two interleaved series, cubes, double then add 1, n×(n+1). The rule is explained after each answer.',
  reflex: 'Five tries; the box turns red, then green after a random 1.5 to 4.5 seconds; tap (or press Space) as soon as it is green. Tapping early does not count and that try is redone. Shows each time and the average in milliseconds; the best average is saved on the device.',
  'digit-memory': 'A number appears and stays visible for 1 second plus 0.6 seconds per digit, then the player types it. Starts at 3 digits; each correct answer adds one digit. Two lives; a mistake shows which digits were wrong and repeats the same length. The final score is the digit span. Typical adult digit span is about 5 to 9 digits.',
  'chess/daily': 'One chess puzzle per day, the same for everyone, taken from real games (Lichess puzzle database, CC0), medium difficulty. The opponent makes the first move, then the player finds the best move(s). Hint and Show solution buttons. Solving without mistakes counts as perfect; a daily streak is saved on the device.',
  'chess/puzzles': 'Puzzle trainer with Easy, Medium and Hard levels, 800 real-game puzzles per level (Lichess database, CC0). Any move that gives checkmate is accepted. After solving, the tactical themes are explained (e.g. fork, pin, skewer, discovered attack, mate in 2). Hint and solution buttons, a solved counter and a perfect streak.',
  'chess/play': 'Play a full game against the Stockfish chess engine running in the browser, at 5 levels from beginner to strong. Choose White or Black, take back a move, and the game is saved if you leave the page. Win/loss/draw record kept on the device.',
};

const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const pages = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(FACTS);
fs.mkdirSync(ROOT + 'tools/drafts', { recursive: true });

for (const page of pages) {
  const html = fs.readFileSync(`${ROOT}${page}/index.html`, 'utf8');
  const title = /<h1>([\s\S]*?)<\/h1>/.exec(html)[1].replace(/<[^>]+>/g, '').trim();
  const existing = strip(/<main>([\s\S]*?)<\/main>/.exec(html)[1].replace(/<!-- guide:start -->[\s\S]*<!-- guide:end -->/, ''));
  const prompt = `You write helpful, original web content for PHG Labs Play (play.phglabs.in), a free browser games site with no sign-up, made by PHG Labs, a small software company in Karad, India.
Write ONE extra section for the "${title}" page. Readers: students, job seekers preparing for aptitude tests or coding interviews, and puzzle fans.

Facts about this game (stay within these; never invent features, levels, studies or exact statistics):
${FACTS[page]}

The page already says this (do NOT repeat it):
"""${existing.slice(0, 1800)}"""

Requirements:
- 450 to 550 words, plain simple English, warm and practical, second person ("you").
- Structure: <h2> with practical tips or a strategy, as a <ul> of 4 to 6 <li> items with a short explanation each; then an <h2> about why this skill is useful in real life (exams, interviews, work, coding, daily life) with 1 or 2 <p>; then <h2>Frequently asked questions</h2> with exactly 4 questions, each an <h3> followed by one <p>.
- No medical or health promises, no made-up numbers, no mention of other websites or apps, no "In conclusion".
- Output ONLY the HTML, using only h2, h3, p, ul, li, strong and code tags. No markdown, no html/body tags, no title.`;
  const t0 = Date.now();
  const res = await fetch(OLLAMA, { method: 'POST', body: JSON.stringify({ model: 'qwen3:14b', prompt, stream: false, think: false, options: { temperature: 0.6, num_ctx: 8192 } }) });
  let out = (await res.json()).response.trim().replace(/^```html?\s*|```$/g, '').trim();
  fs.writeFileSync(`${ROOT}tools/drafts/${page.replace('/', '-')}.html`, out + '\n');
  console.log(`${page.padEnd(15)} ${strip(out).split(' ').length} words  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
