/**
 * solver.js — Generalized Tic-Tac-Toe Minimax Solver (JS port)
 * Dev 5 — Visualization Layer
 *
 * Mirrors the C++ logic exactly:
 *   Cell values  : 'X', 'O', null   (Cell::X, Cell::O, Cell::EMPTY)
 *   Board key    : row-major string  "XO_X__O__"  (Board::getKey())
 *   Cache key    : boardKey + "|" + depth          (DPSolver.cpp)
 *   Scores       : X wins=+1, O wins=-1, draw=0
 *
 * Public API  (window.TicTacSolver):
 *   getBestMove(board, N, K, player, solver, maxDepth)
 *     board    : flat Array length N*N, values 'X'|'O'|null
 *     N        : board size (3/4/5)
 *     K        : win streak length
 *     player   : 'X' | 'O'
 *     solver   : 'bf' | 'dp'
 *     maxDepth : int, -1 = full search
 *     returns  : { move:{row,col}|null, metrics:{nodesExplored,timeMs,cacheHits,cacheSize} }
 */
(function (global) {

  // ── Board helpers ────────────────────────────────────────────────────────────

  function idx(row, col, N) { return row * N + col; }

  function getKey(board) {
    return board.map(c => c === 'X' ? 'X' : c === 'O' ? 'O' : '_').join('');
  }

  function checkWin(board, N, K, player) {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (board[idx(row, col, N)] !== player) continue;
        for (const [dr, dc] of dirs) {
          let count = 0, r = row, c = col;
          while (r >= 0 && r < N && c >= 0 && c < N && board[idx(r,c,N)] === player) {
            count++;
            if (count >= K) return true;
            r += dr; c += dc;
          }
        }
      }
    }
    return false;
  }

  function isFull(board)           { return board.every(c => c !== null); }
  function isTerminal(board, N, K) { return checkWin(board,N,K,'X') || checkWin(board,N,K,'O') || isFull(board); }
  function getScore(board, N, K)   { return checkWin(board,N,K,'X') ? 1 : checkWin(board,N,K,'O') ? -1 : 0; }
  function switchPlayer(p)         { return p === 'X' ? 'O' : 'X'; }

  function getEmptyCells(board, N) {
    const moves = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (board[idx(r,c,N)] === null) moves.push({row:r, col:c});
    return moves;
  }

  // ── Brute Force Minimax ──────────────────────────────────────────────────────
  // Mirrors BruteForceSolver::minimax() — no cache whatsoever

  function bfMinimax(board, N, K, depth, isMax, curPlayer, metrics) {
    metrics.nodesExplored++;
    if (isTerminal(board, N, K)) return getScore(board, N, K);
    if (depth === 0) return 0;

    const moves = getEmptyCells(board, N);
    const next  = switchPlayer(curPlayer);

    if (isMax) {
      let best = -Infinity;
      for (const m of moves) {
        board[idx(m.row,m.col,N)] = curPlayer;
        const s = bfMinimax(board,N,K,depth-1,false,next,metrics);
        board[idx(m.row,m.col,N)] = null;
        if (s > best) best = s;
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of moves) {
        board[idx(m.row,m.col,N)] = curPlayer;
        const s = bfMinimax(board,N,K,depth-1,true,next,metrics);
        board[idx(m.row,m.col,N)] = null;
        if (s < best) best = s;
      }
      return best;
    }
  }

  function bfGetBestMove(board, N, K, player, maxDepth) {
    const metrics = { nodesExplored:0, timeMs:0, cacheHits:0, cacheSize:0 };
    const t0 = performance.now();
    const moves = getEmptyCells(board, N);
    const isMax = player === 'X';
    let bestMove = null, bestScore = isMax ? -Infinity : Infinity;
    let depth = moves.length;
    if (maxDepth > 0) depth = Math.min(maxDepth, depth);
    const next = switchPlayer(player);
    for (const m of moves) {
      board[idx(m.row,m.col,N)] = player;
      const s = bfMinimax(board,N,K,depth-1,!isMax,next,metrics);
      board[idx(m.row,m.col,N)] = null;
      if (isMax && s > bestScore) { bestScore=s; bestMove=m; }
      if (!isMax && s < bestScore) { bestScore=s; bestMove=m; }
    }
    metrics.timeMs = performance.now() - t0;
    return { move: bestMove, metrics };
  }

  // ── DP (Memoized) Minimax ────────────────────────────────────────────────────
  // Mirrors DPSolver::minimax() — cache key = boardKey + "|" + depth

  function dpMinimax(board, N, K, depth, isMax, curPlayer, metrics, cache) {
    metrics.nodesExplored++;

    const key    = getKey(board) + '|' + depth;
    const cached = cache.get(key);
    if (cached !== undefined) { metrics.cacheHits++; return cached; }

    if (isTerminal(board, N, K) || depth === 0) {
      const s = getScore(board, N, K);
      cache.set(key, s);
      return s;
    }

    const moves = getEmptyCells(board, N);
    const next  = switchPlayer(curPlayer);
    let score;

    if (isMax) {
      score = -Infinity;
      for (const m of moves) {
        board[idx(m.row,m.col,N)] = curPlayer;
        const v = dpMinimax(board,N,K,depth-1,false,next,metrics,cache);
        board[idx(m.row,m.col,N)] = null;
        if (v > score) score = v;
      }
    } else {
      score = Infinity;
      for (const m of moves) {
        board[idx(m.row,m.col,N)] = curPlayer;
        const v = dpMinimax(board,N,K,depth-1,true,next,metrics,cache);
        board[idx(m.row,m.col,N)] = null;
        if (v < score) score = v;
      }
    }

    cache.set(key, score);
    return score;
  }

  function dpGetBestMove(board, N, K, player, maxDepth) {
    const metrics = { nodesExplored:0, timeMs:0, cacheHits:0, cacheSize:0 };
    const cache   = new Map();
    const t0 = performance.now();
    const moves = getEmptyCells(board, N);
    const isMax = player === 'X';
    let bestMove = null, bestScore = isMax ? -Infinity : Infinity;
    let depth = moves.length;
    if (maxDepth > 0) depth = Math.min(maxDepth, depth);
    const next = switchPlayer(player);
    for (const m of moves) {
      board[idx(m.row,m.col,N)] = player;
      const s = dpMinimax(board,N,K,depth-1,!isMax,next,metrics,cache);
      board[idx(m.row,m.col,N)] = null;
      if (isMax && s > bestScore) { bestScore=s; bestMove=m; }
      if (!isMax && s < bestScore) { bestScore=s; bestMove=m; }
    }
    metrics.timeMs  = performance.now() - t0;
    metrics.cacheSize = cache.size;
    return { move: bestMove, metrics };
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  function getBestMove(board, N, K, player, solver, maxDepth) {
    const copy = board.slice();
    maxDepth = (maxDepth == null) ? -1 : maxDepth;
    return solver === 'dp'
      ? dpGetBestMove(copy, N, K, player, maxDepth)
      : bfGetBestMove(copy, N, K, player, maxDepth);
  }

  global.TicTacSolver = { getBestMove };

})(window);