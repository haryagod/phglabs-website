// Generates the simple text pages (about, privacy, credits, 404) plus sitemap.xml and robots.txt.
//   node tools/build-pages.mjs        (run from the play/ folder)
import fs from 'node:fs';

// AdSense tag (not on the 404 page: no ads on pages without content)
const ADSENSE = '  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8590058399315809" crossorigin="anonymous"></script>\n';
const head = (title, desc, path, extra = '') => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  ${path ? `<link rel="canonical" href="https://play.phglabs.in${path}">` : extra}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/play.css?v=2">
${path ? ADSENSE : ''}  <script src="/js/core.js?v=2" defer></script>
</head>
<body>
<main>
  <div class="container prose">
`;
const foot = `  </div>
</main>
</body>
</html>
`;
const write = (file, html) => { fs.mkdirSync(file.split('/').slice(0, -1).join('/') || '.', { recursive: true }); fs.writeFileSync(file, html); };
const CONTACT = 'Message us on WhatsApp at <a href="https://wa.me/917499703345" rel="noopener">+91 74997 03345</a> or through <a href="https://phglabs.in/#contact">phglabs.in</a>.';

write('about/index.html', head('About PHG Labs Play', 'PHG Labs Play is a free collection of coding games, puzzles, brain tests and chess, made by PHG Labs, a software company in Karad, Maharashtra.', '/about/') + `    <span class="eyebrow">About</span>
    <h1>About PHG Labs Play</h1>
    <p>PHG Labs Play is a free collection of games that make you think: coding challenges, logic puzzles, quick brain tests and chess. Everything runs in your browser, there's nothing to install, and you never need an account.</p>
    <h2>Who makes it</h2>
    <p>We're <a href="https://phglabs.in/">PHG Labs</a>, a software company in Karad, Maharashtra, India. We build business software such as <strong>AyurOS</strong> for Ayurvedic clinics and <strong>Shop Stock</strong> for retail shops, along with custom web and mobile apps. We made this site because we enjoy puzzles as much as code, and we think learning should feel like playing.</p>
    <h2>What you'll find here</h2>
    <ul>
      <li><strong>Code games:</strong> <a href="/output-guess/">Output Guess</a> (predict what JavaScript prints) and <a href="/bug-hunt/">Bug Hunt</a> (find the one broken line). Every answer comes with an explanation.</li>
      <li><strong>Puzzles:</strong> <a href="/sudoku/">Sudoku</a> in three levels and <a href="/number-series/">Number Series</a> for aptitude-test practice.</li>
      <li><strong>Brain tests:</strong> the <a href="/reflex/">Reflex Test</a> for reaction time and <a href="/digit-memory/">Digit Memory</a> for short-term memory.</li>
      <li><strong>Chess:</strong> a <a href="/chess/daily/">daily puzzle</a>, a <a href="/chess/puzzles/">puzzle trainer</a> with 2,400 positions from real games, and <a href="/chess/play/">a full game against the computer</a>.</li>
    </ul>
    <p>We write every question, explanation and guide ourselves, and we check the code games automatically so every answer is correct.</p>
    <h2>What we believe</h2>
    <ul>
      <li><strong>Free for everyone.</strong> No paywalls and no sign-up.</li>
      <li><strong>Respect your time.</strong> Short games that teach you something real.</li>
      <li><strong>Respect your privacy.</strong> Scores are saved on your own device, not on our servers. See our <a href="/privacy/">privacy policy</a>.</li>
    </ul>
    <h2>Contact</h2>
    <p>Found a bug in a puzzle, or have an idea for a new game? ${CONTACT}</p>
` + foot);

write('privacy/index.html', head('Privacy Policy | PHG Labs Play', 'How PHG Labs Play handles your data: no accounts, scores stored only in your browser, and how cookies and advertising work on this site.', '/privacy/') + `    <span class="eyebrow">Legal</span>
    <h1>Privacy Policy</h1>
    <p class="muted">Last updated: 15 November 2026</p>
    <p>This policy explains what information PHG Labs Play (play.phglabs.in), run by PHG Labs, Karad, Maharashtra, India, collects and how it is used.</p>
    <h2>No accounts, no personal details</h2>
    <p>You can use every game without signing up. We don't ask for your name, email address or phone number.</p>
    <h2>Scores saved on your device</h2>
    <p>Your best scores, streaks, settings and saved chess games are stored in your own browser using <em>local storage</em>. This information stays on your device and is never sent to us. You can delete it at any time by clearing your browser's site data for play.phglabs.in.</p>
    <h2>Server logs</h2>
    <p>Like almost every website, our server keeps short-lived technical logs (such as IP address, browser type and the page requested) to keep the site secure and working. We don't use them to identify you, and they are deleted automatically.</p>
    <h2>Advertising and cookies</h2>
    <p>To keep the site free, we may show ads from Google AdSense. When ads are shown:</p>
    <ul>
      <li>Third-party vendors, including Google, use cookies to serve ads based on your previous visits to this and other websites.</li>
      <li>Google's use of advertising cookies enables it and its partners to serve ads based on your visits to this site and/or other sites on the internet.</li>
      <li>You can opt out of personalised advertising in <a href="https://adssettings.google.com/" rel="noopener">Google Ads Settings</a>, or opt out of some third-party vendors' cookies at <a href="https://www.aboutads.info/" rel="noopener">aboutads.info</a>.</li>
    </ul>
    <p>Learn more in <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">How Google uses information from sites that use its services</a>.</p>
    <h2>Fonts</h2>
    <p>The site uses fonts from Google Fonts, which means your browser requests them from Google's servers.</p>
    <h2>Children</h2>
    <p>The games are suitable for all ages. We don't knowingly collect personal information from anyone, including children.</p>
    <h2>Changes and contact</h2>
    <p>If we change this policy, we'll update the date above. Questions? ${CONTACT}</p>
` + foot);

write('contact/index.html', head('Contact Us | PHG Labs Play', 'Contact PHG Labs, the team behind PHG Labs Play: report a bug, suggest a game or ask about our software. WhatsApp +91 74997 03345, Karad, Maharashtra.', '/contact/') + `    <span class="eyebrow">Get in touch</span>
    <h1>Contact us</h1>
    <p>PHG Labs Play is made by <a href="https://phglabs.in/">PHG Labs</a>, a small software company in Karad, Maharashtra, India. We read every message.</p>
    <h2>How to reach us</h2>
    <ul>
      <li><strong>WhatsApp or phone:</strong> <a href="https://wa.me/917499703345" rel="noopener">+91 74997 03345</a></li>
      <li><strong>Website:</strong> <a href="https://phglabs.in/#contact">phglabs.in</a> (enquiry form)</li>
      <li><strong>Office:</strong> Karad, Maharashtra, India</li>
      <li><strong>Hours:</strong> Monday to Saturday, 10:00 AM to 7:00 PM IST</li>
    </ul>
    <h2>What to write to us about</h2>
    <ul>
      <li><strong>A wrong answer or a bug:</strong> tell us the game and the level or question number, and what you expected. A screenshot helps.</li>
      <li><strong>Ideas:</strong> a new game, a puzzle type or a topic for the code games.</li>
      <li><strong>Schools and colleges:</strong> if you use these games in class and want a custom set of questions.</li>
      <li><strong>Business software:</strong> questions about our products, such as AyurOS and Shop Stock, or custom software.</li>
    </ul>
    <p>To learn how we handle data, see our <a href="/privacy/">privacy policy</a>.</p>
` + foot);

write('credits/index.html', head('Credits & Licences | PHG Labs Play', 'Open-source software and data used by PHG Labs Play, with their licences.', '/credits/') + `    <span class="eyebrow">Thank you</span>
    <h1>Credits &amp; licences</h1>
    <p>PHG Labs Play is built on excellent free and open-source work:</p>
    <ul>
      <li><strong>Stockfish 19</strong>: the chess engine behind <a href="/chess/play/">Play the Computer</a>, compiled to WebAssembly by <a href="https://github.com/nmrugg/stockfish.js" rel="noopener">stockfish.js</a>. Licensed under the GNU General Public License v3 (<a href="/vendor/stockfish/Copying.txt">full licence</a>). The complete source code is available at <a href="https://github.com/nmrugg/stockfish.js" rel="noopener">github.com/nmrugg/stockfish.js</a> and <a href="https://github.com/official-stockfish/Stockfish" rel="noopener">github.com/official-stockfish/Stockfish</a>. We use it unmodified.</li>
      <li><strong>chess.js</strong>: chess rules and move validation, BSD-2-Clause licence (<a href="/vendor/chess.js/LICENSE">licence</a>, <a href="https://github.com/jhlywa/chess.js" rel="noopener">source</a>).</li>
      <li><strong>cm-chessboard</strong>: the chessboard and pieces, MIT licence (<a href="/vendor/cm-chessboard/LICENSE">licence</a>, <a href="https://github.com/shaack/cm-chessboard" rel="noopener">source</a>).</li>
      <li><strong>Lichess puzzle database</strong>: the chess puzzles, released under CC0 (public domain) by <a href="https://database.lichess.org/#puzzles" rel="noopener">lichess.org</a>.</li>
      <li><strong>Inter</strong>: the typeface, by Rasmus Andersson, SIL Open Font License, served by Google Fonts.</li>
    </ul>
    <p>All other games, puzzles, questions and explanations are original work by PHG Labs.</p>
` + foot);

write('404.html', head('Page not found | PHG Labs Play', 'This page could not be found.', '', '<meta name="robots" content="noindex">') + `    <h1>Page not found</h1>
    <p>That page doesn't exist, but plenty of games do.</p>
    <p><a class="btn" href="/">Back to all games</a></p>
` + foot);

const pages = ['/', '/output-guess/', '/bug-hunt/', '/sudoku/', '/number-series/', '/reflex/', '/digit-memory/', '/chess/', '/chess/daily/', '/chess/puzzles/', '/chess/play/', '/about/', '/contact/', '/privacy/', '/credits/'];
fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>https://play.phglabs.in${p}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: https://play.phglabs.in/sitemap.xml\n');
console.log('pages written');
