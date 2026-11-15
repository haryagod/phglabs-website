// Builds data/chess-*.json from the Lichess puzzle database (CC0, https://database.lichess.org/#puzzles).
//   curl -LO https://database.lichess.org/lichess_db_puzzle.csv.zst
//   node tools/build-puzzles.mjs path/to/lichess_db_puzzle.csv.zst
// Keeps popular, well-tested puzzles, PER_LEVEL per difficulty. Row: [id, fen, moves, rating, themes]
import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
const PER_LEVEL = 800;
const levels = { easy: [400, 1200], medium: [1200, 1700], hard: [1700, 2300] };
const out = { easy: [], medium: [], hard: [] };
// The file is in zstd's seekable format; skip leading skippable frames (magic 0x184D2A5?) that Node's decoder rejects.
const fd = fs.openSync(process.argv[2], 'r'), head = Buffer.alloc(8);
let start = 0;
for (;;) {
  fs.readSync(fd, head, 0, 8, start);
  if ((head.readUInt32LE(0) & 0xfffffff0) !== 0x184d2a50) break;
  start += 8 + head.readUInt32LE(4);
}
const zs = zlib.createZstdDecompress();
zs.on('error', () => rl.close()); // the trailing seek table is another skippable frame; everything before it is decoded
const rl = readline.createInterface({ input: fs.createReadStream(process.argv[2], { start }).pipe(zs) });
let header, n = 0;
for await (const line of rl) {
  if (!header) { header = line.split(','); continue; }
  n++;
  const [id, fen, moves, rating, rd, pop, plays, themes] = line.split(',');
  const r = +rating, mv = moves.split(' ');
  if (+pop < 88 || +plays < 3000 || +rd > 80 || mv.length > 8 || mv.length < 2) continue;
  for (const [lvl, [lo, hi]] of Object.entries(levels)) {
    if (r >= lo && r < hi && out[lvl].length < PER_LEVEL) out[lvl].push([id, fen, moves, r, themes]);
  }
  if (Object.values(out).every((a) => a.length >= PER_LEVEL)) break;
}
for (const [lvl, rows] of Object.entries(out)) fs.writeFileSync(`data/chess-${lvl}.json`, JSON.stringify(rows));
console.log('scanned', n, Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])));
