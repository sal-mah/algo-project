/**
 * board.js — Board renderer and game controller
 * Dev 5 — Visualization Layer
 *
 * Responsibilities:
 *   - Render an NxN interactive CSS grid
 *   - Handle human clicks to place marks
 *   - Call TicTacSolver to get the AI's response move
 *   - Highlight the AI's chosen cell in green
 *   - Display game status (whose turn, winner, draw)
 *   - Support reset and config changes (N, K, solver, AI player)
 *
 * Dependencies: solver.js must be loaded first (window.TicTacSolver)
 *
 * Usage:
 *   BoardController.init(containerId, {N, K, humanPlayer, aiSolver, maxDepth})
 *   BoardController.reset()
 *   BoardController.setConfig({N, K, humanPlayer, aiSolver, maxDepth})
 */
(function (global) {

  // ── State ──────────────────────────────────────────────────────────────────

  let cfg = {
    N: 3,
    K: 3,
    humanPlayer: 'X',   // human plays X (maximizer) by default
    aiSolver: 'dp',
    maxDepth: -1
  };

  let board        = [];  // flat array length N*N, 'X'|'O'|null
  let currentPlayer = 'X';
  let gameOver     = false;
  let lastAiMove   = null;
  let lastMetrics  = null;
  let containerId  = null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function idx(row, col) { return row * cfg.N + col; }

  function checkWin(player) {
    const { N, K } = cfg;
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (board[idx(row,col)] !== player) continue;
        for (const [dr,dc] of dirs) {
          let count=0, r=row, c=col;
          while (r>=0&&r<N&&c>=0&&c<N&&board[idx(r,c)]===player) {
            count++; if (count>=K) return true; r+=dr; c+=dc;
          }
        }
      }
    }
    return false;
  }

  function isFull() { return board.every(c => c !== null); }

  function getWinningCells(player) {
    const { N, K } = cfg;
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (board[idx(row,col)] !== player) continue;
        for (const [dr,dc] of dirs) {
          const cells = [];
          let r=row, c=col;
          while (r>=0&&r<N&&c>=0&&c<N&&board[idx(r,c)]===player) {
            cells.push(idx(r,c)); r+=dr; c+=dc;
          }
          if (cells.length >= K) return cells;
        }
      }
    }
    return [];
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function render() {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { N } = cfg;
    const winX = checkWin('X'), winO = checkWin('O');
    const winCells = (winX || winO) ? getWinningCells(winX ? 'X' : 'O') : [];

    // Grid wrapper — square, responsive
    const cellSize = Math.min(72, Math.floor(480 / N));
    const gridSize = cellSize * N;

    let html = `<div id="ttt-grid" style="
      display:grid;
      grid-template-columns:repeat(${N},${cellSize}px);
      grid-template-rows:repeat(${N},${cellSize}px);
      gap:3px;
      width:${gridSize + (N-1)*3}px;
      margin:0 auto 16px;
      user-select:none;
    ">`;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = idx(r, c);
        const val = board[i];
        const isAiMove  = lastAiMove && lastAiMove.row === r && lastAiMove.col === c;
        const isWinCell = winCells.includes(i);
        const isEmpty   = val === null;
        const isPlayable = isEmpty && !gameOver && currentPlayer === cfg.humanPlayer;

        let bg = 'var(--color-background-secondary)';
        let border = '1.5px solid var(--color-border-tertiary)';
        let cursor = isPlayable ? 'pointer' : 'default';
        let hoverClass = isPlayable ? 'ttt-cell-hover' : '';

        if (isWinCell)  { bg = 'var(--color-background-success)'; border = '1.5px solid var(--color-border-success)'; }
        else if (isAiMove) { bg = 'var(--color-background-info)'; border = '1.5px solid var(--color-border-info)'; }

        let symbol = '';
        if (val === 'X') {
          symbol = `<svg viewBox="0 0 40 40" width="${cellSize*0.45}" height="${cellSize*0.45}">
            <line x1="8" y1="8" x2="32" y2="32" stroke="var(--color-text-danger)" stroke-width="4" stroke-linecap="round"/>
            <line x1="32" y1="8" x2="8" y2="32" stroke="var(--color-text-danger)" stroke-width="4" stroke-linecap="round"/>
          </svg>`;
        } else if (val === 'O') {
          symbol = `<svg viewBox="0 0 40 40" width="${cellSize*0.45}" height="${cellSize*0.45}">
            <circle cx="20" cy="20" r="13" fill="none" stroke="var(--color-text-info)" stroke-width="4"/>
          </svg>`;
        } else if (isPlayable) {
          // faint hover hint
          symbol = `<svg viewBox="0 0 40 40" width="${cellSize*0.35}" height="${cellSize*0.35}" class="ttt-hint">
            <circle cx="20" cy="20" r="12" fill="none" stroke="var(--color-border-secondary)" stroke-width="3" opacity="0.5"/>
          </svg>`;
        }

        html += `<div
          class="ttt-cell ${hoverClass}"
          data-row="${r}" data-col="${c}"
          style="
            width:${cellSize}px; height:${cellSize}px;
            background:${bg}; border:${border};
            border-radius:8px; display:flex;
            align-items:center; justify-content:center;
            cursor:${cursor}; transition:background 0.15s, transform 0.1s;
            font-size:${Math.floor(cellSize*0.5)}px; font-weight:500;
          "
        >${symbol}</div>`;
      }
    }

    html += `</div>`;
    container.innerHTML = html;

    // Attach click listeners
    container.querySelectorAll('.ttt-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        handleHumanMove(r, c);
      });
    });

    // Update status + metrics
    updateStatus(winX, winO);
  }

  function updateStatus(winX, winO) {
    const statusEl  = document.getElementById('ttt-status');
    const metricsEl = document.getElementById('ttt-metrics');
    if (!statusEl) return;

    if (winX) {
      statusEl.textContent = 'X wins!';
      statusEl.style.color = 'var(--color-text-danger)';
    } else if (winO) {
      statusEl.textContent = 'O wins!';
      statusEl.style.color = 'var(--color-text-info)';
    } else if (isFull()) {
      statusEl.textContent = 'Draw!';
      statusEl.style.color = 'var(--color-text-secondary)';
    } else {
      const isHumanTurn = currentPlayer === cfg.humanPlayer;
      statusEl.textContent = isHumanTurn
        ? `Your turn (${currentPlayer})`
        : `AI thinking… (${currentPlayer})`;
      statusEl.style.color = 'var(--color-text-primary)';
    }

    if (metricsEl && lastMetrics) {
      const m = lastMetrics;
      const hitRate = m.nodesExplored > 0
        ? Math.round((m.cacheHits / m.nodesExplored) * 100)
        : 0;
      metricsEl.innerHTML = `
        <span title="Nodes explored by the solver">
          <strong>${m.nodesExplored.toLocaleString()}</strong> nodes
        </span>
        <span style="color:var(--color-border-primary);margin:0 6px">·</span>
        <span title="Time taken">${m.timeMs.toFixed(2)} ms</span>
        <span style="color:var(--color-border-primary);margin:0 6px">·</span>
        <span title="Cache hit rate (DP only)">${hitRate}% cache hits</span>
        ${cfg.aiSolver === 'dp' ? `<span style="color:var(--color-border-primary);margin:0 6px">·</span>
        <span title="Unique states cached">${m.cacheSize.toLocaleString()} cached states</span>` : ''}
      `;
    } else if (metricsEl) {
      metricsEl.innerHTML = '<span style="color:var(--color-text-secondary)">Make a move to see solver metrics</span>';
    }
  }

  // ── Game Logic ─────────────────────────────────────────────────────────────

  function handleHumanMove(row, col) {
    if (gameOver) return;
    if (board[idx(row, col)] !== null) return;
    if (currentPlayer !== cfg.humanPlayer) return;

    board[idx(row, col)] = currentPlayer;
    lastAiMove = null;

    if (checkWin(currentPlayer) || isFull()) {
      gameOver = true;
      render();
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    render();

    // AI responds
    setTimeout(triggerAiMove, 80);
  }

  function triggerAiMove() {
    if (gameOver) return;
    if (currentPlayer === cfg.humanPlayer) return;

    const result = TicTacSolver.getBestMove(
      board.slice(),
      cfg.N,
      cfg.K,
      currentPlayer,
      cfg.aiSolver,
      cfg.maxDepth
    );

    lastMetrics = result.metrics;

    if (result.move) {
      const { row, col } = result.move;
      board[idx(row, col)] = currentPlayer;
      lastAiMove = result.move;

      if (checkWin(currentPlayer) || isFull()) {
        gameOver = true;
        render();
        return;
      }

      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }

    render();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function init(id, config) {
    containerId = id;
    if (config) Object.assign(cfg, config);
    reset();
  }

  function reset() {
    board         = new Array(cfg.N * cfg.N).fill(null);
    currentPlayer = 'X';
    gameOver      = false;
    lastAiMove    = null;
    lastMetrics   = null;
    render();

    // If AI goes first (human is O)
    if (cfg.humanPlayer === 'O') {
      setTimeout(triggerAiMove, 200);
    }
  }

  function setConfig(newCfg) {
    Object.assign(cfg, newCfg);
    reset();
  }

  function getConfig() { return { ...cfg }; }

  global.BoardController = { init, reset, setConfig, getConfig };

})(window);