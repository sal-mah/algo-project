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

  function buildSummaryTable(rows, containerId) {
    const tableEl = document.getElementById('benchmark-table');
    if (!tableEl) return;

    const sorted = [...rows].sort((a,b) => {
      if (a.solver !== b.solver) return a.solver.localeCompare(b.solver);
      if (a.board !== b.board) return a.board - b.board;
      return a.depth - b.depth;
    });

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="border-bottom:1px solid var(--color-border-tertiary)">
          <th style="text-align:left;padding:8px 10px;font-weight:500;color:var(--color-text-secondary)">Solver</th>
          <th style="text-align:center;padding:8px 10px;font-weight:500;color:var(--color-text-secondary)">Board</th>
          <th style="text-align:center;padding:8px 10px;font-weight:500;color:var(--color-text-secondary)">Depth</th>
          <th style="text-align:right;padding:8px 10px;font-weight:500;color:var(--color-text-secondary)">Nodes</th>
          <th style="text-align:right;padding:8px 10px;font-weight:500;color:var(--color-text-secondary)">Time (ms)</th>
          <th style="text-align:right;padding:8px 10px;font-weight:500;color:var(--color-text-secondary)">Cache hits</th>
        </tr>
      </thead><tbody>`;

    sorted.forEach((r, i) => {
      const isTimeout = r.nodes === 'TIMEOUT' || r.timeMs === 'TIMEOUT';
      const isMoneyResult = r.board === 5 && r.depth === 8;
      const bg = isMoneyResult ? 'background:var(--color-background-warning);' : (i%2===0 ? '' : 'background:var(--color-background-secondary);');
      const timeoutStyle = isTimeout ? 'color:var(--color-text-danger);font-weight:500;' : '';
      const nodesStr = r.nodes === 'TIMEOUT' ? 'TIMEOUT' : Number(r.nodes).toLocaleString();
      const timeStr  = r.timeMs === 'TIMEOUT' ? 'TIMEOUT' : Number(r.timeMs).toFixed(1);
      const hitsStr  = r.cacheHits === 'TIMEOUT' || r.cacheHits === 0 ? (r.solver === 'DP' ? '0' : '—') : Number(r.cacheHits).toLocaleString();

      // Hit rate % for DP
      let hitRate = '';
      if (r.solver === 'DP' && r.nodes !== 'TIMEOUT' && r.nodes > 0) {
        hitRate = ` <span style="color:var(--color-text-secondary);font-size:11px">(${Math.round((r.cacheHits/r.nodes)*100)}%)</span>`;
      }

      html += `<tr style="${bg}border-bottom:0.5px solid var(--color-border-tertiary)">
        <td style="padding:7px 10px">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;
            background:${r.solver==='DP' ? 'var(--color-background-info)' : 'var(--color-background-danger)'};
            color:${r.solver==='DP' ? 'var(--color-text-info)' : 'var(--color-text-danger)'}">
            ${r.solver}
          </span>
        </td>
        <td style="text-align:center;padding:7px 10px">${r.board}×${r.board}</td>
        <td style="text-align:center;padding:7px 10px">${r.depth}</td>
        <td style="text-align:right;padding:7px 10px;${timeoutStyle}">${nodesStr}</td>
        <td style="text-align:right;padding:7px 10px;${timeoutStyle}">${timeStr}</td>
        <td style="text-align:right;padding:7px 10px">${hitsStr}${hitRate}</td>
      </tr>`;
    });

    html += `</tbody></table>`;
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
