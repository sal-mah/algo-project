/**
 * board.js — Board renderer and game controller (multi-board)
 * Dev 5 — Visualization Layer
 *
 * Supports:
 *   human-vs-ai       — human clicks, AI responds
 *   ai-vs-ai          — both players use cfg.aiSolver, logs moves into tableId trace table
 *   human-vs-human    — no AI
 *
 * Dependencies: solver.js must be loaded first (window.TicTacSolver)
 */
(function (global) {

  // ── Multi-board state ─────────────────────────────────────────────────────

  const boards = new Map();
  let defaultId = null;

  function normalizeConfig(cfg) {
    if (cfg.K > cfg.N) cfg.K = cfg.N;
    if (cfg.maxDepth == null) cfg.maxDepth = -1;
    if (!cfg.mode) cfg.mode = 'human-vs-ai';
    if (cfg.autoDelay == null) cfg.autoDelay = 120;
  }

  function createState(containerId, config) {
    const cfg = {
      N: 3,
      K: 3,
      humanPlayer: 'X',
      aiSolver: 'dp',
      maxDepth: -1,
      mode: 'human-vs-ai',
      autoDelay: 120
    };

    let statusId = 'ttt-status';
    let metricsId = 'ttt-metrics';
    let tableId = null;   // for move-trace table

    if (config) {
      const { statusId: sid, metricsId: mid, tableId: tid, ...rest } = config;
      Object.assign(cfg, rest);
      if (sid) statusId = sid;
      if (mid) metricsId = mid;
      if (tid) tableId = tid;
    }

    normalizeConfig(cfg);

    return {
      cfg,
      board: [],
      currentPlayer: 'X',
      gameOver: false,
      lastAiMove: null,
      lastMetrics: null,
      containerId,
      statusId,
      metricsId,
      tableId,
      pendingTimer: null,
      moveLog: [],    // [{moveNum, player, nodes, timeMs, cacheHits, cacheSize}]
      totals: { nodes: 0, timeMs: 0, cacheHits: 0 }
    };
  }

  function getState(containerId) { return boards.get(containerId); }

  function clearTimer(state) {
    if (state && state.pendingTimer) {
      clearTimeout(state.pendingTimer);
      state.pendingTimer = null;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function idx(state, row, col) { return row * state.cfg.N + col; }

  function checkWin(state, player) {
    const { N, K } = state.cfg;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (state.board[idx(state, row, col)] !== player) continue;
        for (const [dr, dc] of dirs) {
          let count = 0, r = row, c = col;
          while (r >= 0 && r < N && c >= 0 && c < N && state.board[idx(state, r, c)] === player) {
            count++;
            if (count >= K) return true;
            r += dr; c += dc;
          }
        }
      }
    }
    return false;
  }

  function isFull(state) { return state.board.every(c => c !== null); }

  function getWinningCells(state, player) {
    const { N, K } = state.cfg;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (state.board[idx(state, row, col)] !== player) continue;
        for (const [dr, dc] of dirs) {
          const cells = [];
          let r = row, c = col;
          while (r >= 0 && r < N && c >= 0 && c < N && state.board[idx(state, r, c)] === player) {
            cells.push(idx(state, r, c));
            r += dr; c += dc;
          }
          if (cells.length >= K) return cells;
        }
      }
    }
    return [];
  }

  function isHumanTurn(state) {
    if (state.cfg.mode === 'human-vs-human') return true;
    if (state.cfg.mode === 'human-vs-ai') return state.currentPlayer === state.cfg.humanPlayer;
    return false;
  }

  function isAiTurn(state) {
    if (state.cfg.mode === 'human-vs-ai') return state.currentPlayer !== state.cfg.humanPlayer;
    if (state.cfg.mode === 'ai-vs-ai') return true;
    return false;
  }

  function isPlayable(state, row, col) {
    if (state.gameOver) return false;
    if (state.board[idx(state, row, col)] !== null) return false;
    if (state.cfg.mode === 'human-vs-human') return true;
    if (state.cfg.mode === 'human-vs-ai') return state.currentPlayer === state.cfg.humanPlayer;
    return false;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  function render(state) {
    const container = document.getElementById(state.containerId);
    if (!container) return;

    const { N } = state.cfg;
    const winX = checkWin(state, 'X');
    const winO = checkWin(state, 'O');
    const winCells = (winX || winO) ? getWinningCells(state, winX ? 'X' : 'O') : [];

    const cellSize = Math.min(72, Math.floor(480 / N));
    const gridSize = cellSize * N;

    let html = `<div class="ttt-grid" style="
      display:grid;
      grid-template-columns:repeat(${N},${cellSize}px);
      grid-template-rows:repeat(${N},${cellSize}px);
      gap:3px;
      width:${gridSize + (N - 1) * 3}px;
      margin:0 auto 16px;
      user-select:none;
    ">`;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = idx(state, r, c);
        const val = state.board[i];
        const isAiMove = state.lastAiMove && state.lastAiMove.row === r && state.lastAiMove.col === c;
        const isWinCell = winCells.includes(i);
        const playable = isPlayable(state, r, c);

        let bg = 'var(--color-background-secondary)';
        let border = '1.5px solid var(--color-border-tertiary)';
        let cursor = playable ? 'pointer' : 'default';
        let hoverClass = playable ? 'ttt-cell-hover' : '';

        if (isWinCell) { bg = 'var(--color-background-success)'; border = '1.5px solid var(--color-border-success)'; }
        else if (isAiMove) { bg = 'var(--color-background-info)'; border = '1.5px solid var(--color-border-info)'; }

        let symbol = '';
        if (val === 'X') {
          symbol = `<svg viewBox="0 0 40 40" width="${cellSize * 0.45}" height="${cellSize * 0.45}">
            <line x1="8" y1="8" x2="32" y2="32" stroke="var(--color-text-danger)" stroke-width="4" stroke-linecap="round"/>
            <line x1="32" y1="8" x2="8" y2="32" stroke="var(--color-text-danger)" stroke-width="4" stroke-linecap="round"/>
          </svg>`;
        } else if (val === 'O') {
          symbol = `<svg viewBox="0 0 40 40" width="${cellSize * 0.45}" height="${cellSize * 0.45}">
            <circle cx="20" cy="20" r="13" fill="none" stroke="var(--color-text-info)" stroke-width="4"/>
          </svg>`;
        } else if (playable) {
          symbol = `<svg viewBox="0 0 40 40" width="${cellSize * 0.35}" height="${cellSize * 0.35}" class="ttt-hint">
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
            font-size:${Math.floor(cellSize * 0.5)}px; font-weight:500;
          "
        >${symbol}</div>`;
      }
    }

    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.ttt-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        handleHumanMove(state, r, c);
      });
    });

    updateStatus(state, winX, winO);

    // Render per-move trace table for ai-vs-ai boards
    if (state.cfg.mode === 'ai-vs-ai' && state.tableId) {
      renderTraceTable(state);
    }
  }

  function updateStatus(state, winX, winO) {
    const statusEl = document.getElementById(state.statusId);
    const metricsEl = document.getElementById(state.metricsId);
    if (!statusEl) return;

    if (winX) {
      statusEl.textContent = 'X wins!';
      statusEl.style.color = 'var(--color-text-danger)';
    } else if (winO) {
      statusEl.textContent = 'O wins!';
      statusEl.style.color = 'var(--color-text-info)';
    } else if (isFull(state)) {
      statusEl.textContent = 'Draw!';
      statusEl.style.color = 'var(--color-text-secondary)';
    } else if (state.cfg.mode === 'human-vs-human') {
      statusEl.textContent = `Player ${state.currentPlayer} turn`;
      statusEl.style.color = 'var(--color-text-primary)';
    } else if (state.cfg.mode === 'ai-vs-ai') {
      statusEl.textContent = `${state.currentPlayer} thinking…`;
      statusEl.style.color = 'var(--color-text-primary)';
    } else {
      statusEl.textContent = isHumanTurn(state)
        ? `Your turn (${state.currentPlayer})`
        : `AI thinking… (${state.currentPlayer})`;
      statusEl.style.color = 'var(--color-text-primary)';
    }

    if (!metricsEl) return;

    if (state.cfg.mode === 'human-vs-human') {
      metricsEl.textContent = 'No AI metrics (human vs human)';
      return;
    }

    if (state.lastMetrics) {
      const m = state.lastMetrics;
      const hitRate = m.nodesExplored > 0
        ? Math.round((m.cacheHits / m.nodesExplored) * 100) : 0;
      const solver = state.cfg.aiSolver;
      metricsEl.innerHTML = `
        <span title="Nodes explored"><strong>${m.nodesExplored.toLocaleString()}</strong> nodes</span>
        <span style="color:var(--color-border-primary);margin:0 6px">·</span>
        <span>${m.timeMs.toFixed(2)} ms</span>
        <span style="color:var(--color-border-primary);margin:0 6px">·</span>
        <span>${hitRate}% cache hits</span>
        ${solver === 'dp' ? `<span style="color:var(--color-border-primary);margin:0 6px">·</span>
        <span>${m.cacheSize.toLocaleString()} cached</span>` : ''}
      `;
    } else {
      metricsEl.innerHTML = '<span style="color:var(--color-text-secondary)">Auto-playing… metrics update each move</span>';
    }
  }

  // ── Per-move Trace Table ──────────────────────────────────────────────────
  // Renders a scrollable table for a single ai-vs-ai board

  function renderTraceTable(state) {
    const el = document.getElementById(state.tableId);
    if (!el) return;

    const solver = state.cfg.aiSolver;
    const isBF = solver === 'bf';
    const accentColor = isBF ? 'var(--color-text-danger)' : '#1d9e75';

    if (state.moveLog.length === 0) {
      el.innerHTML = `<div style="text-align:center;color:var(--text3);font-size:12px;padding:16px 0">
        Game starting — move trace will appear here…
      </div>`;
      return;
    }

    const tot = state.totals;
    const avgNodes = state.moveLog.length > 0
      ? Math.round(tot.nodes / state.moveLog.length) : 0;
    const hitRate = tot.nodes > 0
      ? Math.round((tot.cacheHits / tot.nodes) * 100) : 0;

    // Totals strip
    let html = `<div class="trace-totals" style="
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:8px;
        margin-bottom:12px;
      ">
      <div class="trace-kpi">
        <div class="trace-kpi-label">Total Nodes</div>
        <div class="trace-kpi-value" style="color:${accentColor}">${tot.nodes.toLocaleString()}</div>
      </div>
      <div class="trace-kpi">
        <div class="trace-kpi-label">Total Time</div>
        <div class="trace-kpi-value" style="color:${accentColor}">${tot.timeMs.toFixed(1)} ms</div>
      </div>
      <div class="trace-kpi">
        <div class="trace-kpi-label">${isBF ? 'Avg Nodes/Move' : 'Cache Hit Rate'}</div>
        <div class="trace-kpi-value" style="color:${accentColor}">${isBF ? avgNodes.toLocaleString() : hitRate + '%'}</div>
      </div>
    </div>`;

    // Move trace table
    html += `<div style="max-height:280px;overflow-y:auto;border-radius:8px;border:1px solid var(--border)">
    <table class="trace-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Nodes</th>
          <th>Time (ms)</th>
          ${isBF
        ? `<th style="color:var(--color-text-danger)">Cache</th>`
        : `<th style="color:#1d9e75">Hits</th><th style="color:#1d9e75">Cached</th>`}
        </tr>
      </thead>
      <tbody>`;

    for (const row of state.moveLog) {
      const rowHitRate = row.nodes > 0 ? Math.round((row.cacheHits / row.nodes) * 100) : 0;
      const playerSvg = row.player === 'X'
        ? `<svg viewBox="0 0 20 20" width="13" height="13"><line x1="4" y1="4" x2="16" y2="16" stroke="var(--color-text-danger)" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="4" x2="4" y2="16" stroke="var(--color-text-danger)" stroke-width="2.5" stroke-linecap="round"/></svg>`
        : `<svg viewBox="0 0 20 20" width="13" height="13"><circle cx="10" cy="10" r="6" fill="none" stroke="var(--color-text-info)" stroke-width="2.5"/></svg>`;

      html += `<tr>
        <td style="text-align:center;font-weight:600;color:var(--text3)">${row.moveNum}</td>
        <td style="text-align:center">${playerSvg}</td>
        <td style="font-variant-numeric:tabular-nums;font-weight:600;color:${accentColor}">${row.nodes.toLocaleString()}</td>
        <td style="font-variant-numeric:tabular-nums">${row.timeMs.toFixed(3)}</td>
        ${isBF
          ? `<td style="color:var(--text3);font-size:11px;text-align:center">none</td>`
          : `<td style="font-variant-numeric:tabular-nums;color:#1d9e75">${row.cacheHits.toLocaleString()} <span style="color:var(--text3);font-size:10px">(${rowHitRate}%)</span></td>
             <td style="font-variant-numeric:tabular-nums">${row.cacheSize.toLocaleString()}</td>`}
      </tr>`;
    }

    // Totals row
    html += `<tr style="background:var(--surface2);font-weight:700;border-top:2px solid var(--border2)">
        <td colspan="2" style="text-align:right;font-size:11px;color:var(--text3)">TOTAL</td>
        <td style="color:${accentColor};font-variant-numeric:tabular-nums">${tot.nodes.toLocaleString()}</td>
        <td style="font-variant-numeric:tabular-nums">${tot.timeMs.toFixed(2)}</td>
        ${isBF
        ? `<td style="color:var(--text3);text-align:center">—</td>`
        : `<td style="color:#1d9e75;font-variant-numeric:tabular-nums">${tot.cacheHits.toLocaleString()} <span style="color:var(--text3);font-size:10px">(${hitRate}%)</span></td><td>—</td>`}
      </tr>
    </tbody></table></div>`;

    el.innerHTML = html;

    // Auto-scroll to bottom so latest move is always visible
    const scrollEl = el.querySelector('div');
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  // ── Game Logic ───────────────────────────────────────────────────────────

  function handleHumanMove(state, row, col) {
    if (!isPlayable(state, row, col)) return;

    state.board[idx(state, row, col)] = state.currentPlayer;
    state.lastAiMove = null;

    if (checkWin(state, state.currentPlayer) || isFull(state)) {
      state.gameOver = true;
      render(state);
      return;
    }

    state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    render(state);

    if (isAiTurn(state)) {
      scheduleAiMove(state, state.cfg.autoDelay);
    }
  }

  function triggerAiMove(state) {
    if (state.gameOver) return;
    if (!isAiTurn(state)) return;

    const solver = state.cfg.aiSolver;

    let result = null;

    if (state.cfg.mode === 'ai-vs-ai' && window._aiGameTrace && window._aiGameTrace.length > 0) {
      const solverName = solver === 'bf' ? 'BruteForce' : 'DP';
      const moveNum    = state.moveLog.length + 1;
      const targetDepth = state.cfg.maxDepth;
      const n = state.cfg.N;
      const k = state.cfg.K;

      const traceRow = window._aiGameTrace.find(r =>
        r.solver === solverName &&
        r.n === n && r.k === k &&
        r.maxDepth === targetDepth &&
        r.moveNum === moveNum
      );

      if (traceRow) {
        result = {
          move: { row: traceRow.row, col: traceRow.col },
          metrics: {
            nodesExplored: traceRow.nodes,
            timeMs: traceRow.timeMs,
            cacheHits: traceRow.cacheHits,
            cacheSize: 0
          }
        };
      }
    }

    // In AI-vs-AI mode, never fall back to JS — it would freeze the browser on large boards
    if (!result) {
      if (state.cfg.mode === 'ai-vs-ai') {
        console.warn(`No C++ trace found for solver=${solver} N=${state.cfg.N} K=${state.cfg.K} depth=${state.cfg.maxDepth} move=${state.moveLog.length + 1}`);
        return;
      }
      result = TicTacSolver.getBestMove(
        state.board.slice(),
        state.cfg.N,
        state.cfg.K,
        state.currentPlayer,
        solver,
        state.cfg.maxDepth
      );
    }

    state.lastMetrics = result.metrics;

    // Log move for ai-vs-ai trace table
    if (state.cfg.mode === 'ai-vs-ai' && state.tableId) {
      const m = result.metrics;
      state.moveLog.push({
        moveNum: state.moveLog.length + 1,
        player: state.currentPlayer,
        nodes: m.nodesExplored,
        timeMs: m.timeMs,
        cacheHits: m.cacheHits,
        cacheSize: m.cacheSize
      });
      state.totals.nodes += m.nodesExplored;
      state.totals.timeMs += m.timeMs;
      state.totals.cacheHits += m.cacheHits;

      // Fire external sync event so the summary bar can update
      if (window._onBoardMoveLogged) window._onBoardMoveLogged();
    }

    if (result.move) {
      const { row, col } = result.move;
      state.board[idx(state, row, col)] = state.currentPlayer;
      state.lastAiMove = result.move;

      if (checkWin(state, state.currentPlayer) || isFull(state)) {
        state.gameOver = true;
        render(state);
        return;
      }

      state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    } else {
      state.gameOver = true;
    }

    render(state);

    if (!state.gameOver && state.cfg.mode === 'ai-vs-ai') {
      scheduleAiMove(state, state.cfg.autoDelay);
    }
  }

  function scheduleAiMove(state, delay) {
    clearTimer(state);
    state.pendingTimer = setTimeout(() => triggerAiMove(state), delay);
  }

  // ── Public API ───────────────────────────────────────────────────────────

  function init(id, config) {
    const state = createState(id, config);
    boards.set(id, state);
    if (!defaultId) defaultId = id;
    reset(id);
  }

  function reset(containerId) {
    const id = containerId || defaultId;
    const state = getState(id);
    if (!state) return;

    clearTimer(state);
    state.board = new Array(state.cfg.N * state.cfg.N).fill(null);
    state.currentPlayer = 'X';
    state.gameOver = false;
    state.lastAiMove = null;
    state.lastMetrics = null;
    state.moveLog = [];
    state.totals = { nodes: 0, timeMs: 0, cacheHits: 0 };

    render(state);

    if (state.cfg.mode === 'ai-vs-ai') {
      scheduleAiMove(state, state.cfg.autoDelay);
    } else if (state.cfg.mode === 'human-vs-ai' && state.cfg.humanPlayer === 'O') {
      scheduleAiMove(state, state.cfg.autoDelay);
    }
  }

  function setConfig(arg1, arg2) {
    let id = defaultId;
    let newCfg = arg1;
    if (typeof arg1 === 'string') { id = arg1; newCfg = arg2; }

    const state = getState(id);
    if (!state || !newCfg) return;

    const { statusId, metricsId, tableId, ...rest } = newCfg;
    Object.assign(state.cfg, rest);
    if (statusId) state.statusId = statusId;
    if (metricsId) state.metricsId = metricsId;
    if (tableId) state.tableId = tableId;

    normalizeConfig(state.cfg);
    reset(id);
  }

  function getConfig(containerId) {
    const id = containerId || defaultId;
    const state = getState(id);
    return state ? { ...state.cfg } : null;
  }

  // Expose getState so the summary bar script can read totals
  function getTotals(containerId) {
    const state = getState(containerId);
    return state ? { ...state.totals, moves: state.moveLog.length, gameOver: state.gameOver } : null;
  }

  global.BoardController = { init, reset, setConfig, getConfig, getTotals };

})(window);