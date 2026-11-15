# PHG Labs Play (play.phglabs.in)

Free browser games: coding games, puzzles, brain tests and chess. Plain HTML, CSS and JavaScript with no build step.
It deploys together with the main site (`deploy/`), and nginx serves it for the `play.phglabs.in` host.

| Path | What |
|---|---|
| `index.html`, `*/index.html` | Pages; each game is a folder so URLs look like `/sudoku/` |
| `js/core.js` | Header/footer, saved scores and streaks (localStorage), sharing, **AdSense switch** (`ADSENSE_CLIENT`) |
| `js/code.js`, `data/output-guess.js`, `data/bug-hunt.js` | Code games and their levels |
| `js/chess-ui.js`, `css/chess.css` | Board, move input, puzzle runner, theme explanations |
| `data/chess-*.json` | 800 Lichess puzzles per level (CC0) |
| `vendor/` | chess.js (BSD-2), cm-chessboard (MIT), Stockfish 19 lite (GPL-3, unmodified, credited on `/credits/`) |
| `tools/` | Content scripts, not deployed |

## Run locally

Any static server from this folder works, e.g. `npx serve play` and open http://localhost:3000.
Pages use absolute paths (`/css/...`), so serve `play/` as the root.

## Content tools

- `node tools/check-code-games.mjs` runs every Output Guess snippet and Bug Hunt fix to prove the answers are right. Run it after editing levels.
- `node tools/build-pages.mjs` regenerates About, Privacy, Credits, 404, `sitemap.xml` and `robots.txt`.
- `node tools/build-puzzles.mjs lichess_db_puzzle.csv.zst` rebuilds the chess puzzle sets from https://database.lichess.org/#puzzles.

## Ads

Ads are off. After `play.phglabs.in` is approved in AdSense, put the publisher ID in `ADSENSE_CLIENT` in `js/core.js`;
every `<div class="ad">` slot then shows an ad. Also add an `ads.txt` at the root of **phglabs.in**.
