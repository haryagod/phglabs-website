// Renders the 1200x630 social preview images (WhatsApp, Facebook, X, LinkedIn link cards) with headless Edge.
//   node tools/og-image.mjs   -> play/og.png and ../assets/og.png
import { launch } from '../../marketing/reel/pw.mjs';

const LOGO = '<svg viewBox="0 0 64 64" width="120" height="120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs><polygon points="32,3 57.1,17.5 57.1,46.5 32,61 6.9,46.5 6.9,17.5" fill="url(#g)"/><g stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"><line x1="21" y1="22" x2="43" y2="24"/><line x1="21" y1="22" x2="27" y2="43"/><line x1="43" y1="24" x2="27" y2="43"/><line x1="43" y1="24" x2="45" y2="42"/></g><g fill="#fff"><circle cx="21" cy="22" r="5"/><circle cx="43" cy="24" r="4.2"/><circle cx="27" cy="43" r="4.6"/><circle cx="45" cy="42" r="3"/></g></svg>';
const card = ({ tag, title, sub, chips, url }) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&display=block" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0} body{width:1200px;height:630px;overflow:hidden;font-family:Inter,"Segoe UI Emoji",sans-serif;color:#fff;
  background:radial-gradient(700px 500px at 88% 8%,rgba(6,182,212,.35),transparent 60%),radial-gradient(700px 500px at 5% 100%,rgba(79,70,229,.55),transparent 60%),linear-gradient(180deg,#0B1026,#151E45);
  padding:70px 80px;display:flex;flex-direction:column;justify-content:space-between}
  .top{display:flex;align-items:center;gap:26px} .brand{font-size:54px;font-weight:500;letter-spacing:-1px} .brand b{font-weight:900}
  .tag{font-size:26px;font-weight:900;letter-spacing:3px;padding:8px 18px;border-radius:99px;background:linear-gradient(135deg,#6D63FF,#22D3EE)}
  h1{font-size:76px;font-weight:900;letter-spacing:-2.5px;line-height:1.02;max-width:1000px}
  .g{background:linear-gradient(100deg,#A5A0FF,#67E8F9 70%);-webkit-background-clip:text;color:transparent}
  p{font-size:32px;color:#CBD5E1;font-weight:500;margin-top:18px}
  .row{display:flex;justify-content:space-between;align-items:center} .chips{display:flex;gap:14px}
  .chip{font-size:26px;font-weight:800;padding:12px 20px;border-radius:16px;background:rgba(18,26,58,.85);border:2px solid rgba(255,255,255,.15)}
  .url{font-size:30px;font-weight:800;color:#67E8F9}
</style></head><body>
  <div class="top">${LOGO}<div class="brand"><b>PHG</b> Labs</div>${tag ? `<span class="tag">${tag}</span>` : ''}</div>
  <div><h1>${title}</h1><p>${sub}</p></div>
  <div class="row"><div class="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div><span class="url">${url}</span></div>
</body></html>`;

const CARDS = [
  { out: 'og.png', tag: 'PLAY', title: 'Free games that make you <span class="g">sharper</span>', sub: 'No sign-up · Works on your phone', chips: ['💻 Code', '🧩 Puzzles', '⚡ Brain', '♞ Chess'], url: 'play.phglabs.in' },
  { out: '../assets/og.png', tag: '', title: 'Software that keeps your business <span class="g">moving forward</span>', sub: 'Karad, Maharashtra · Free demo on WhatsApp', chips: ['AyurOS', 'Shop Stock', 'Custom apps'], url: 'phglabs.in' },
];
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const c of CARDS) {
  await page.setContent(card(c), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: c.out });
  console.log('wrote', c.out);
}
await browser.close();
