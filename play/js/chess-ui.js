// Shared chess helpers: board setup, legal-move input (with promotion), and a puzzle runner.
import { Chess } from "/vendor/chess.js/chess.js";
import { Chessboard, COLOR, FEN, INPUT_EVENT_TYPE } from "/vendor/cm-chessboard/src/Chessboard.js";
import { Markers, MARKER_TYPE } from "/vendor/cm-chessboard/src/extensions/markers/Markers.js";
import { PromotionDialog } from "/vendor/cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js";

export { Chess, COLOR, MARKER_TYPE };

export function createBoard(el, fen, orientation) {
  return new Chessboard(el, {
    position: fen || FEN.empty,
    orientation: orientation === "b" ? COLOR.black : COLOR.white,
    assetsUrl: "/vendor/cm-chessboard/assets/",
    style: { cssClass: "phg", showCoordinates: true, pieces: { file: "pieces/staunty.svg" } },
    extensions: [{ class: Markers, props: { autoMarkers: MARKER_TYPE.frame } }, { class: PromotionDialog }],
  });
}

/** Marks the last move (from/to squares). */
export function markLastMove(board, from, to) {
  board.removeMarkers(MARKER_TYPE.square);
  if (from) board.addMarker(MARKER_TYPE.square, from);
  if (to) board.addMarker(MARKER_TYPE.square, to);
}

/**
 * Lets the player move pieces of `color` ("w"/"b"). Only legal moves are accepted.
 * `onMove(from, to, promotion)` is called after the piece lands; it must update the board itself.
 */
export function enableInput(board, game, color, onMove) {
  board.disableMoveInput(); // enabling twice throws
  board.enableMoveInput((event) => {
    switch (event.type) {
      case INPUT_EVENT_TYPE.moveInputStarted: {
        const moves = game.moves({ square: event.squareFrom, verbose: true });
        board.addLegalMovesMarkers(moves);
        return moves.length > 0;
      }
      case INPUT_EVENT_TYPE.validateMoveInput: {
        board.removeLegalMovesMarkers();
        const moves = game.moves({ square: event.squareFrom, verbose: true }).filter((m) => m.to === event.squareTo);
        if (!moves.length) return false;
        if (moves.some((m) => m.promotion)) {
          board.showPromotionDialog(event.squareTo, color === "w" ? COLOR.white : COLOR.black, (result) => {
            if (result && result.piece) onMove(event.squareFrom, event.squareTo, result.piece.charAt(1));
            else board.setPosition(game.fen(), true);
          });
          return true;
        }
        // let the board finish its own move animation first
        setTimeout(() => onMove(event.squareFrom, event.squareTo), 0);
        return true;
      }
      case INPUT_EVENT_TYPE.moveInputCanceled:
      case INPUT_EVENT_TYPE.moveInputFinished:
        board.removeLegalMovesMarkers();
        return true;
    }
    return true;
  }, color === "w" ? COLOR.white : COLOR.black);
}

/** Tries a move on a chess.js game; returns the move or null instead of throwing. */
export function tryMove(game, from, to, promotion) {
  try { return game.move({ from, to, promotion: promotion || "q" }); } catch (e) { return null; }
}
const uciMove = (game, uci) => tryMove(game, uci.slice(0, 2), uci.slice(2, 4), uci[4]);

/**
 * Runs one Lichess puzzle: [id, fen, moves, rating, themes]. The first move is the opponent's; the player
 * finds the rest. Any move that gives checkmate is accepted too. Callbacks: onState({status, ...}).
 */
export function runPuzzle(board, row, onState) {
  const [id, fen, movesStr] = row;
  const moves = movesStr.split(" ");
  const game = new Chess(fen);
  const player = game.turn() === "w" ? "b" : "w";
  let step = 0, mistakes = 0, done = false, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  board.disableMoveInput();
  board.removeMarkers();
  board.setOrientation(player === "w" ? COLOR.white : COLOR.black);
  board.setPosition(fen, false);
  onState({ status: "loading", player, id });

  function opponent() {
    const m = uciMove(game, moves[step]);
    step++;
    board.setPosition(game.fen(), true);
    markLastMove(board, m.from, m.to);
    if (step >= moves.length) return finish();
    onState({ status: "your-move", player, mistakes });
    enableInput(board, game, player, playerMove);
  }
  function playerMove(from, to, promo) {
    if (done) return;
    const expected = moves[step];
    const probe = new Chess(game.fen());
    const m = tryMove(probe, from, to, promo);
    const correct = m && (from + to + (m.promotion || "") === expected || probe.isCheckmate());
    if (!correct) {
      mistakes++;
      board.setPosition(game.fen(), true);
      onState({ status: "wrong", player, mistakes });
      return;
    }
    const played = tryMove(game, from, to, m.promotion);
    step++;
    board.setPosition(game.fen(), true);
    markLastMove(board, played.from, played.to);
    if (step >= moves.length || game.isCheckmate()) return finish();
    board.disableMoveInput();
    onState({ status: "correct", player, mistakes });
    later(opponent, 500);
  }
  function finish() {
    done = true;
    board.disableMoveInput();
    onState({ status: "solved", player, mistakes });
  }
  later(opponent, 700);

  return {
    hint() {
      if (done || step >= moves.length) return;
      board.removeMarkers(MARKER_TYPE.circlePrimary);
      board.addMarker(MARKER_TYPE.circlePrimary, moves[step].slice(0, 2));
      mistakes++;
    },
    showSolution() {
      if (done) return;
      done = true; mistakes = Math.max(mistakes, 1);
      board.disableMoveInput();
      const playNext = () => {
        if (step >= moves.length) return onState({ status: "shown", player, mistakes });
        const m = uciMove(game, moves[step]); step++;
        board.setPosition(game.fen(), true);
        markLastMove(board, m.from, m.to);
        later(playNext, 700);
      };
      playNext();
    },
    stop() { timers.forEach(clearTimeout); board.disableMoveInput(); },
  };
}

// Plain-language explanations of Lichess puzzle themes (shown after solving).
export const THEMES = {
  mateIn1: ["Mate in 1", "One move gives checkmate."],
  mateIn2: ["Mate in 2", "Checkmate in two moves, whatever the opponent does."],
  mateIn3: ["Mate in 3", "A forced checkmate in three moves."],
  mateIn4: ["Mate in 4", "A long forced checkmate. Every move must be exact."],
  fork: ["Fork", "One piece attacks two (or more) enemy pieces at once, and the opponent can only save one."],
  pin: ["Pin", "A piece can't move because a more valuable piece (often the king) is behind it."],
  skewer: ["Skewer", "Like a pin in reverse: a valuable piece is attacked and must move, exposing a piece behind it."],
  discoveredAttack: ["Discovered attack", "Moving one piece uncovers an attack by another piece behind it."],
  discoveredCheck: ["Discovered check", "Moving a piece reveals a check from the piece behind it, so the moved piece is free to cause damage."],
  doubleCheck: ["Double check", "Two pieces give check at once, so the king must move."],
  sacrifice: ["Sacrifice", "Giving up material on purpose to win something bigger."],
  deflection: ["Deflection", "Forcing a defending piece away from the square or piece it protects."],
  attraction: ["Attraction", "Luring an enemy piece (often the king) onto a bad square."],
  clearance: ["Clearance", "Moving a piece out of the way so another piece can use its square or line."],
  interference: ["Interference", "Putting a piece between an enemy piece and what it defends."],
  intermezzo: ["In-between move", "Instead of the expected reply, first playing a stronger threat (zwischenzug)."],
  hangingPiece: ["Hanging piece", "An undefended piece that can simply be taken."],
  trappedPiece: ["Trapped piece", "A piece with no safe squares to escape to."],
  capturingDefender: ["Remove the defender", "Capturing the piece that protects something else."],
  backRankMate: ["Back-rank mate", "Checkmate on the back row, where the king is boxed in by its own pawns."],
  smotheredMate: ["Smothered mate", "A knight checkmates a king surrounded by its own pieces."],
  promotion: ["Promotion", "A pawn reaches the last rank and becomes a queen (or another piece)."],
  advancedPawn: ["Advanced pawn", "A pawn close to promotion decides the game."],
  quietMove: ["Quiet move", "A strong move that is not a check or capture, so it is easy to miss."],
  defensiveMove: ["Defensive move", "The key move is a precise defence that avoids losing."],
  xRayAttack: ["X-ray attack", "A piece attacks or defends a square through another piece."],
  zugzwang: ["Zugzwang", "The opponent would be fine if they could pass, but every move makes things worse."],
  exposedKing: ["Exposed king", "The king has few defenders around it, which gives the attack its chance."],
  kingsideAttack: ["Kingside attack", "An attack on the king after it has castled short."],
  queensideAttack: ["Queenside attack", "An attack on the king after it has castled long."],
  enPassant: ["En passant", "A special pawn capture of a pawn that just moved two squares."],
  crushing: ["Crushing", "Wins a decisive amount of material."],
  advantage: ["Advantage", "Gains a clear advantage."],
  equality: ["Equality", "Saves a difficult position."],
};
export function explainThemes(themes) {
  return themes.split(" ").filter((t) => THEMES[t]).slice(0, 3)
    .map((t) => "<li><strong>" + THEMES[t][0] + ":</strong> " + THEMES[t][1] + "</li>").join("");
}

/** Loads one difficulty file: "easy" | "medium" | "hard". */
const cache = {};
export async function loadPuzzles(level) {
  if (!cache[level]) cache[level] = fetch("/data/chess-" + level + ".json").then((r) => r.json());
  return cache[level];
}
