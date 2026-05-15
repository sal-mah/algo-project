/**
 * charts.js — Benchmark visualization
 * Dev 5 — Visualization Layer
 *
 * Reads results/data.csv produced by Dev 4's run_benchmark.cpp.
 * CSV format: solver,board,depth,nodes,timeMs,cacheHits
 *   Values can be numbers OR the string "TIMEOUT"
 *
 * Draws three Chart.js charts:
 *   1. Nodes explored vs depth   (log scale, BF vs DP per board size)
 *   2. Time (ms) vs depth        (log scale, BF vs DP per board size)
 *   3. Cache hit rate vs depth   (DP only, all board sizes)
 *
 * Usage:
 *   ChartsController.init('charts-section', csvText)
 *   ChartsController.initFromFile('charts-section', 'results/data.csv')
 */
(function (global) {

  // ── CSV parser ─────────────────────────────────────────────────────────────

  function parseCSV(text) {
    const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = vals[i] === 'TIMEOUT' ? 'TIMEOUT' : isNaN(vals[i]) ? vals[i] : Number(vals[i]);
      });
      return obj;
    });
  }

  // ── Color palette ──────────────────────────────────────────────────────────
  // BF = coral/red family, DP = teal/blue family, per board size = line style

  const COLORS = {
    BruteForce: {
      3: { border: '#C1121F', bg: 'rgba(193,18,31,0.12)' },
      4: { border: '#9B0D18', bg: 'rgba(155,13,24,0.12)' },
      5: { border: '#E01E37', bg: 'rgba(224,30,55,0.12)' }
    },
    DP: {
      3: { border: '#7A0015', bg: 'rgba(122,0,21,0.12)' },
      4: { border: '#5C0010', bg: 'rgba(92,0,16,0.12)' },
      5: { border: '#A30E1B', bg: 'rgba(163,14,27,0.12)' }
    }
  };

  const DASH = { 3: [], 4: [6,3], 5: [2,3] };

  // ── Chart defaults ─────────────────────────────────────────────────────────

  function baseOptions(yLabel, logScale) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 12, family: 'system-ui, sans-serif' },
            color: '#888',
            padding: 16,
            boxWidth: 24
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.raw;
              if (v === null) return `${ctx.dataset.label}: TIMEOUT`;
              return `${ctx.dataset.label}: ${typeof v === 'number' ? v.toLocaleString() : v}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Search depth', font: { size: 12 }, color: '#888' },
          grid: { color: 'rgba(128,128,128,0.1)' },
          ticks: { color: '#888', font: { size: 11 } }
        },
        y: {
          type: logScale ? 'logarithmic' : 'linear',
          title: { display: true, text: yLabel, font: { size: 12 }, color: '#888' },
          grid: { color: 'rgba(128,128,128,0.1)' },
          ticks: {
            color: '#888',
            font: { size: 11 },
            callback: v => logScale ? (v >= 1000000 ? (v/1000000)+'M' : v >= 1000 ? (v/1000)+'K' : v) : v
          }
        }
      }
    };
  }

  // ── Build datasets ─────────────────────────────────────────────────────────

  function buildDatasets(rows, field, solvers, boardSizes, labels) {
    const datasets = [];
    for (const solver of solvers) {
      for (const N of boardSizes) {
        const filtered = rows.filter(r => r.solver === solver && r.board === N);
        filtered.sort((a,b) => a.depth - b.depth);
        const byDepth = new Map();
        filtered.forEach(r => {
          byDepth.set(r.depth, r[field] === 'TIMEOUT' ? null : r[field]);
        });
        const values = labels.map(d => byDepth.has(d) ? byDepth.get(d) : null);

        // Only add if there's at least one non-null value
        if (values.every(v => v === null)) continue;

        const col = COLORS[solver][N];
        datasets.push({
          label: `${solver} ${N}×${N}`,
          data: values,
          borderColor: col.border,
          backgroundColor: col.bg,
          borderWidth: 2,
          borderDash: DASH[N],
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          spanGaps: false
        });
      }
    }
    return datasets;
  }

  // ── Cache hit rate ─────────────────────────────────────────────────────────

  function buildCacheDatasets(rows, boardSizes, labels) {
    const datasets = [];
    for (const N of boardSizes) {
      const filtered = rows.filter(r => r.solver === 'DP' && r.board === N && r.nodes !== 'TIMEOUT' && r.nodes > 0);
      filtered.sort((a,b) => a.depth - b.depth);
      const byDepth = new Map();
      filtered.forEach(r => {
        if (r.cacheHits === 'TIMEOUT' || r.nodes === 'TIMEOUT') {
          byDepth.set(r.depth, null);
        } else {
          byDepth.set(r.depth, Math.round((r.cacheHits / r.nodes) * 100));
        }
      });
      const values = labels.map(d => byDepth.has(d) ? byDepth.get(d) : null);

      if (values.every(v => v === null)) continue;

      const col = COLORS.DP[N];
      datasets.push({
        label: `DP ${N}×${N}`,
        data: values,
        borderColor: col.border,
        backgroundColor: col.bg,
        borderWidth: 2,
        borderDash: DASH[N],
        pointRadius: 4,
        pointHoverRadius: 6,
          tension: 0.3,
          spanGaps: false
        });
    }
    return datasets;
  }

  // ── Draw all charts ────────────────────────────────────────────────────────

  function drawCharts(containerId, rows) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const boardSizes = [3, 4, 5];
    const depthLabels = [...new Set(rows.map(r => r.depth).filter(d => typeof d === 'number'))].sort((a,b) => a - b);

    // ── Chart 1: Nodes explored ────────────────────────────────────────────
    const nodesLabels = depthLabels.slice();
    const nodesDatasets = buildDatasets(rows, 'nodes', ['BruteForce','DP'], boardSizes, nodesLabels);

    const c1 = document.getElementById('chart-nodes');
    if (c1) {
      new Chart(c1, {
        type: 'line',
        data: { labels: nodesLabels, datasets: nodesDatasets },
        options: {
          ...baseOptions('Nodes explored (log scale)', true),
          plugins: {
            ...baseOptions('', true).plugins,
            title: {
              display: true,
              text: 'Nodes explored vs depth — BF grows exponentially, DP stays low',
              font: { size: 13, weight: '500' },
              color: '#666',
              padding: { bottom: 12 }
            }
          }
        }
      });
    }

    // ── Chart 2: Time ──────────────────────────────────────────────────────
    const timeLabels = depthLabels.slice();
    const timeDatasets = buildDatasets(rows, 'timeMs', ['BruteForce','DP'], boardSizes, timeLabels);

    const c2 = document.getElementById('chart-time');
    if (c2) {
      new Chart(c2, {
        type: 'line',
        data: { labels: timeLabels, datasets: timeDatasets },
        options: {
          ...baseOptions('Time (ms, log scale)', true),
          plugins: {
            ...baseOptions('', true).plugins,
            title: {
              display: true,
              text: 'Execution time vs depth',
              font: { size: 13, weight: '500' },
              color: '#666',
              padding: { bottom: 12 }
            }
          }
        }
      });
    }

    // ── Chart 3: Cache hit rate ────────────────────────────────────────────
    const hitLabels = depthLabels.slice();
    const hitDatasets = buildCacheDatasets(rows, boardSizes, hitLabels);

    const c3 = document.getElementById('chart-cache');
    if (c3) {
      new Chart(c3, {
        type: 'line',
        data: { labels: hitLabels, datasets: hitDatasets },
        options: {
          ...baseOptions('Cache hit rate (%)', false),
          plugins: {
            ...baseOptions('', false).plugins,
            title: {
              display: true,
              text: 'DP cache hit rate grows with depth — more overlapping subproblems found',
              font: { size: 13, weight: '500' },
              color: '#666',
              padding: { bottom: 12 }
            }
          },
          scales: {
            ...baseOptions('', false).scales,
            y: {
              ...baseOptions('', false).scales.y,
              min: 0, max: 100,
              ticks: {
                color: '#888',
                font: { size: 11 },
                callback: v => v + '%'
              }
            }
          }
        }
      });
    }

    // ── Summary table ──────────────────────────────────────────────────────
    buildSummaryTable(rows, containerId);
  }

  function buildSolverTable(rows, solverKey, accentColor, isBF) {
    const boards = [...new Set(rows.map(r => r.board))].sort((a,b) => a - b);
    let html = '';

    for (const N of boards) {
      const group = rows.filter(r => r.solver === solverKey && r.board === N)
                        .sort((a,b) => a.depth - b.depth);
      if (!group.length) continue;

      html += `<div style="margin-bottom:22px">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;
             color:${accentColor};margin-bottom:8px;padding-bottom:5px;
             border-bottom:2px solid ${accentColor === 'var(--color-text-danger)' ? 'rgba(176,0,32,0.2)' : 'rgba(29,158,117,0.2)'}">
          Board ${N}×${N}
        </div>
        <table class="trace-table" style="width:100%;text-align:left;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:1px solid var(--color-border-tertiary)">
              <th style="padding:6px 0;font-weight:500;color:var(--text2)">Depth</th>
              <th style="padding:6px 0;text-align:right;font-weight:500;color:var(--text2)">Nodes</th>
              <th style="padding:6px 0;text-align:right;font-weight:500;color:var(--text2)">Time (ms)</th>
              ${isBF ? '<th style="padding:6px 0;text-align:center;color:var(--text3);font-weight:500">Cache</th>'
                     : '<th style="padding:6px 0;text-align:right;color:#1d9e75;font-weight:500">Hits</th><th style="padding:6px 0;text-align:right;color:#1d9e75;font-weight:500">Hit %</th>'}
            </tr>
          </thead>
          <tbody>`;

      for (const r of group) {
        const isTO   = r.nodes === 'TIMEOUT' || r.timeMs === 'TIMEOUT';
        const isMoneyResult = N === 5 && r.depth === 8;
        const bg = isMoneyResult ? 'background:var(--color-background-warning)' : '';
        
        const nodes  = isTO ? `<span style="color:var(--color-text-danger);font-weight:600">TIMEOUT</span>`
                            : `<span style="font-weight:600;color:${accentColor}">${Number(r.nodes).toLocaleString()}</span>`;
        const time   = isTO ? `<span style="color:var(--color-text-danger)">—</span>`
                            : Number(r.timeMs).toFixed(1);
        let cache = '';
        if (isBF) {
          cache = `<td style="padding:6px 0;color:var(--text3);font-size:11px;text-align:center">none</td>`;
        } else if (isTO) {
          cache = `<td colspan="2" style="padding:6px 0;color:var(--color-text-danger);text-align:center;font-size:11px">TIMEOUT</td>`;
        } else {
          const hits = Number(r.cacheHits), n = Number(r.nodes);
          const pct  = n > 0 ? Math.round((hits / n) * 100) : 0;
          cache = `<td style="padding:6px 0;color:#1d9e75;font-variant-numeric:tabular-nums;text-align:right">${hits.toLocaleString()}</td>
                   <td style="padding:6px 0;color:#1d9e75;font-variant-numeric:tabular-nums;text-align:right">${pct}%</td>`;
        }
        html += `<tr style="${bg};border-bottom:1px solid var(--color-border-tertiary)">
          <td style="padding:6px 0;text-align:center;font-weight:600">${r.depth}</td>
          <td style="padding:6px 0;font-variant-numeric:tabular-nums;text-align:right">${nodes}</td>
          <td style="padding:6px 0;font-variant-numeric:tabular-nums;text-align:right">${time}</td>
          ${cache}
        </tr>`;
      }
      html += `</tbody></table></div>`;
    }
    return html || `<p style="color:var(--text3);font-size:13px">No data for this solver.</p>`;
  }

  function buildSummaryTable(rows, containerId) {
    const tableEl = document.getElementById('benchmark-table');
    if (!tableEl) return;

    let html = `
      <div class="board-pair">
        <div class="card board-card-bf">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <span class="badge badge-bf">Brute Force</span>
            <span style="font-size:12px;color:var(--text2)">O(b<sup>d</sup>) — no memoization</span>
          </div>
          ${buildSolverTable(rows, 'BruteForce', 'var(--color-text-danger)', true)}
        </div>
        
        <div class="card board-card-dp">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <span class="badge badge-dp">DP Memoized</span>
            <span style="font-size:12px;color:var(--text2)">O(U·b) — transposition table</span>
          </div>
          ${buildSolverTable(rows, 'DP', '#1d9e75', false)}
        </div>
      </div>
    `;

    tableEl.innerHTML = html;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Pass parsed CSV text directly */
  function init(containerId, csvText) {
    const rows = parseCSV(csvText);
    drawCharts(containerId, rows);
  }

  /** Fetch CSV from a path then draw */
  async function initFromFile(containerId, csvPath) {
    const statusEl = document.getElementById('charts-status');
    try {
      const resp = await fetch(csvPath);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      if (statusEl) statusEl.style.display = 'none';
      init(containerId, text);
    } catch (e) {
      if (statusEl) {
        statusEl.textContent = `Could not load ${csvPath}. Run run_benchmark.cpp first to generate results/data.csv.`;
        statusEl.style.color = 'var(--color-text-danger)';
      }
    }
  }

  global.ChartsController = { init, initFromFile, parseCSV };

})(window);
