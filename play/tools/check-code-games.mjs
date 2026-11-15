// Verifies the coding-game content: every Output Guess answer is what the code really prints, and every
// Bug Hunt program fails with its bug and passes with the fix.   node tools/check-code-games.mjs
import fs from 'node:fs';
import vm from 'node:vm';
const load = (f, name) => { const w = {}; vm.runInNewContext(fs.readFileSync(f, 'utf8'), { window: w }); return w[name]; };
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };

for (const [i, q] of load('data/output-guess.js', 'OUTPUT_GUESS').entries()) {
  const out = [];
  const fmt = (v) => (v === undefined ? 'undefined' : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
  const ctx = { console: { log: (...a) => out.push(a.map(fmt).join(' ')) }, setTimeout, Promise };
  try { vm.runInNewContext(q.code, ctx, { timeout: 500 }); } catch (e) { out.push(e.name); }
  await new Promise((r) => setTimeout(r, 30));
  const got = out.join('\n');
  if (got !== q.answer) fail(`output-guess #${i + 1}: printed ${JSON.stringify(got)}, answer says ${JSON.stringify(q.answer)}`);
  if (!q.choices.includes(q.answer)) fail(`output-guess #${i + 1}: answer not among choices`);
  if (new Set(q.choices).size !== q.choices.length) fail(`output-guess #${i + 1}: duplicate choices`);
}

for (const [i, l] of load('data/bug-hunt.js', 'BUG_HUNT').entries()) {
  const lines = l.code.split('\n');
  if (!lines[l.bug - 1] || lines[l.bug - 1] === l.fix) { fail(`bug-hunt #${i + 1}: bad bug line`); continue; }
  if (!l.test) { console.log(`bug-hunt #${i + 1} (${l.title}): no runnable test, check by hand`); continue; }
  const run = (src) => {
    try { return vm.runInNewContext(`${src}\n;(${l.test})`, { console: { log() {} }, JSON, Math, Date }, { timeout: 300 }) === true; }
    catch { return false; }
  };
  const fixed = [...lines]; fixed[l.bug - 1] = l.fix;
  if (run(l.code)) fail(`bug-hunt #${i + 1}: buggy version passes its test`);
  if (!run(fixed.join('\n'))) fail(`bug-hunt #${i + 1}: fixed version fails its test`);
}
console.log(bad ? `${bad} problem(s)` : 'all code-game answers verified');
process.exit(bad ? 1 : 0);
