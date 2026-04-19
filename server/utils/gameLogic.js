// ── Ludo board constants (mirrored from client) ──────────────────────────────

const PLAYER_COLOR_CONFIG = {
  red:    { startAbsIndex: 1 },
  green:  { startAbsIndex: 14 },
  yellow: { startAbsIndex: 27 },
  blue:   { startAbsIndex: 40 },
};

const SAFE_SQUARES = [1, 9, 14, 22, 27, 35, 40, 48];

export function getAbsoluteTrackIndex(color, relativePos) {
  return (PLAYER_COLOR_CONFIG[color].startAbsIndex + relativePos) % 52;
}

// ── Movable token calculation ────────────────────────────────────────────────

export function getMovableTokens(playerIdx, dice, tokens, players) {
  const movable = [];
  const pt = tokens[playerIdx];
  if (!pt) return movable;

  for (let ti = 0; ti < 4; ti++) {
    const pos = pt[ti];
    if (pos === 56) continue;
    if (pos === -1) {
      if (dice === 6) movable.push(ti);
      continue;
    }
    const newPos = pos + dice;
    if (newPos > 56) continue;

    if (newPos <= 50) {
      const absDest = getAbsoluteTrackIndex(players[playerIdx].color, newPos);
      let blocked = false;
      for (let pi = 0; pi < players.length; pi++) {
        if (pi === playerIdx) continue;
        const count = tokens[pi].filter(
          p => p >= 0 && p <= 50 && getAbsoluteTrackIndex(players[pi].color, p) === absDest
        ).length;
        if (count >= 2) { blocked = true; break; }
      }
      if (blocked) continue;
    }
    movable.push(ti);
  }
  return movable;
}

// ── Process a token move — returns next game state ───────────────────────────

export function processMove(state, tokenIndex) {
  const { currentPlayer, dice, tokens, players, consecutiveSixes } = state;

  const pos = tokens[currentPlayer][tokenIndex];
  const newPos = pos === -1 ? 0 : pos + dice;

  const newTokens = tokens.map(arr => [...arr]);
  let didCapture = false;

  if (newPos >= 0 && newPos <= 50) {
    const absDest = getAbsoluteTrackIndex(players[currentPlayer].color, newPos);
    if (!SAFE_SQUARES.includes(absDest)) {
      for (let pi = 0; pi < players.length; pi++) {
        if (pi === currentPlayer) continue;
        for (let ti = 0; ti < 4; ti++) {
          const op = newTokens[pi][ti];
          if (op >= 0 && op <= 50 && getAbsoluteTrackIndex(players[pi].color, op) === absDest) {
            newTokens[pi][ti] = -1;
            didCapture = true;
          }
        }
      }
    }
  }

  newTokens[currentPlayer][tokenIndex] = newPos;

  // Win condition
  if (newTokens[currentPlayer].every(p => p === 56)) {
    return { ...state, tokens: newTokens, phase: 'finished', winner: currentPlayer, movableTokens: [], dice: null };
  }

  // Same player rolls again on 6 or capture
  if (dice === 6 || didCapture) {
    return { ...state, tokens: newTokens, dice: null, canRoll: true, movableTokens: [], consecutiveSixes };
  }

  // Next player's turn
  const next = (currentPlayer + 1) % players.length;
  return { ...state, tokens: newTokens, currentPlayer: next, dice: null, canRoll: true, movableTokens: [], consecutiveSixes: 0 };
}

// ── Roll dice and compute next state ─────────────────────────────────────────

export function rollDice(state) {
  const dice = Math.floor(Math.random() * 6) + 1;
  const newSixes = dice === 6 ? state.consecutiveSixes + 1 : 0;

  // 3 consecutive sixes → skip turn
  if (newSixes >= 3) {
    const next = (state.currentPlayer + 1) % state.players.length;
    return {
      newState: { ...state, dice, canRoll: false, movableTokens: [], consecutiveSixes: 0 },
      dice,
      skipTurn: true,
      nextPlayer: next,
    };
  }

  const movable = getMovableTokens(state.currentPlayer, dice, state.tokens, state.players);
  const newState = { ...state, dice, canRoll: false, movableTokens: movable, consecutiveSixes: newSixes };

  return { newState, dice, skipTurn: false, noMoves: movable.length === 0 };
}

// ── Create initial game state ─────────────────────────────────────────────────

export function createInitialGameState(players) {
  return {
    phase: 'playing',
    players,
    tokens: players.map(() => [-1, -1, -1, -1]),
    currentPlayer: 0,
    dice: null,
    canRoll: true,
    movableTokens: [],
    consecutiveSixes: 0,
    winner: null,
  };
}
