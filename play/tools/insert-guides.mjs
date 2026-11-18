// Puts each reviewed draft from tools/drafts/<page>.html into its game page as a guide section,
// just before the end of <main>. Re-running replaces the previous guide instead of adding a second one.
//   node tools/insert-guides.mjs
import fs from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const ALLOWED = /^(h2|h3|p|ul|li|strong|code|em)$/;
for (const file of fs.readdirSync(ROOT + 'tools/drafts').filter((f) => f.endsWith('.html'))) {
  const page = file.replace('.html', '').replace(/^chess-/, 'chess/');
  const draft = fs.readFileSync(ROOT + 'tools/drafts/' + file, 'utf8').trim();
  const bad = [...draft.matchAll(/<\/?([a-z0-9]+)/gi)].map((m) => m[1].toLowerCase()).filter((t) => !ALLOWED.test(t));
  if (bad.length) throw new Error(`${file}: unexpected tags ${[...new Set(bad)].join(', ')}`);
  const path = `${ROOT}${page}/index.html`;
  let html = fs.readFileSync(path, 'utf8').replace(/\n    <section class="section card prose guide">\n<!-- guide:start -->[\s\S]*?<!-- guide:end -->\n    <\/section>/, '');
  // FAQ structured data from the guide's "Frequently asked questions" (each <h3> question and the <p> after it)
  const text = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const faq = [...draft.matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => ({ '@type': 'Question', name: text(m[1]), acceptedAnswer: { '@type': 'Answer', text: text(m[2]) } }));
  const ld = faq.length ? `\n      <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq }).replace(/</g, '\\u003c')}</script>` : '';
  const block = `\n    <section class="section card prose guide">\n<!-- guide:start -->\n${draft.replace(/^/gm, '      ')}${ld}\n<!-- guide:end -->\n    </section>`;
  const end = html.lastIndexOf('\n  </div>\n</main>');
  if (end < 0) throw new Error(`${page}: no "</div></main>" to insert before`);
  html = html.slice(0, end) + block + html.slice(end);
  fs.writeFileSync(path, html);
  console.log('guide ->', page);
}
