# Generalized Tic-Tac-Toe Solver
### Minimax Algorithm — Brute Force vs Dynamic Programming (Memoization)

> Algorithms Course Project · Misr International University · 2026

---

## What is this?

A generalized Tic-Tac-Toe solver that finds the **optimal move** on an N×N board with a configurable K-in-a-row win condition, using the **Minimax** adversarial game-tree search algorithm.

Two implementations are compared side by side:

| Approach | Strategy | Time Complexity | Space Complexity |
|----------|----------|-----------------|------------------|
| **Brute Force** | Recursive search, no memory | O(b^d) | O(d) |
| **DP Memoized** | Transposition table caching | O(U·b) | O(U) |

**Key result:** On a 5×5 board at depth 8 — Brute Force times out (>30s). DP completes in ~210ms with a **91% cache hit rate**.

---

## The core idea

Different move sequences can reach the same board configuration:

```
Sequence A: X→(0,0), O→(1,1), X→(0,2)
Sequence B: X→(0,2), O→(1,1), X→(0,0)
```

Both produce the exact same board. Brute Force recomputes the full subtree both times. DP computes it once, caches the result under key `"X_X_O____|depth"`, and returns it instantly on every subsequent visit.

This is the **overlapping subproblems** condition that makes Dynamic Programming applicable here.

---

## Project structure

```
ALGO-project/
├── include/                  ← Header files
│   ├── Board.h               NxN grid · placeMark · undoMark · checkWin · getKey
│   ├── GameState.h           Board + player turn · isTerminal · getScore
│   ├── ISolver.h             Abstract interface · getBestMove · getMetrics
│   ├── BruteForceSolver.h    Pure Minimax · no cache · O(b^d)
│   ├── DPSolver.h            Memoized Minimax · transposition table · O(U·b)
│   ├── Cache.h               unordered_map<string, int> · get · set · clear
│   └── Metrics.h             nodesExplored · timeMs · cacheHits
├── src/                      ← Implementations
│   ├── Board.cpp
│   ├── GameState.cpp
│   ├── BruteForceSolver.cpp
│   ├── DPSolver.cpp
│   └── Cache.cpp
├── benchmark/
│   └── run_benchmark.cpp     Runs both solvers · outputs results/data.csv
├── results/
│   └── data.csv              Benchmark output (solver · board · depth · nodes · time · cacheHits)
├── visualization/
│   ├── Index.html            Main page · 3 tabs · MIU theme
│   ├── Solver.js             JS port of both solvers · mirrors C++ exactly
│   ├── Board.js              Interactive board · Human vs AI · AI vs AI · Human vs Human
│   └── Charts.js             Chart.js graphs from data.csv
└── report/
    └── report.tex            IEEE-format research paper (LaTeX)
```

---

## How to build and run (C++)

**Requirements:** GCC via MSYS2, CMake, Windows

```bash
# Clone the repo
git clone https://github.com/sal-mah/ALGO-project.git
cd ALGO-project

# Create build folder and compile
mkdir build && cd build
cmake ..
cmake --build . --config Release

# Run the benchmark
./run_benchmark
```

Output will be saved to `results/data.csv`.

---

## How to open the visualization

No server needed. Just open the file directly in any browser:

```
visualization/Index.html  →  double-click to open
```

**Three tabs:**
- **Live Demo** — play against the AI, switch between BF and DP solvers, see live metrics
- **Benchmark Charts** — graphs loaded from `results/data.csv` (run benchmark first)
- **How It Works** — algorithm explanations and the overlapping subproblems argument

**Three game modes:**
- Human vs AI
- AI vs AI (BF board vs DP board side by side — metrics update live)
- Human vs Human

> The visualization is also deployed at: **[your Vercel URL here]**

---

## Benchmark results

| Solver | Board | Depth | Nodes | Time (ms) | Cache Hits |
|--------|-------|-------|-------|-----------|------------|
| BruteForce | 3×3 | 2 | 72 | <1 | — |
| BruteForce | 3×3 | 4 | 6,048 | 2 | — |
| BruteForce | 4×4 | 4 | 126,400 | 340 | — |
| BruteForce | 4×4 | 6 | TIMEOUT | TIMEOUT | — |
| DP | 3×3 | 4 | 2,097 | <1 | 48% |
| DP | 4×4 | 6 | 636,976 | 180 | 66% |
| DP | 4×4 | 8 | 5,822,376 | 4,513 | 74% |
| **DP** | **5×5** | **8** | **~420,000** | **~210** | **91%** |
| BruteForce | 5×5 | 8 | **TIMEOUT** | **TIMEOUT** | — |

---

## Cache key design

```cpp
// DPSolver.cpp
std::string key = state.getBoard().getKey() + "|" + std::to_string(depth);
```

`getKey()` returns a row-major string: `"X_XOO____"` for a 3×3 board.

Depth is included in the key because the same board at depth 2 may score 0 (no win reachable) but score −1 at depth 6 (O wins in 5 moves). Without depth, cached shallow results would be incorrectly returned for deep queries.

---

## Team

| Developer | Role |
|-----------|------|
| Mahmoud Sayed Fawzy | Dev 1 — Board & GameState |
| Salma Mahmoud | Dev 2 — BruteForceSolver & ISolver |
| Razan Ismail Fawzy | Dev 3 — DPSolver & Cache |
| Sama Mohamed | Dev 4 — Benchmark & Metrics |
| Mina Samaan Zakaria | Dev 5 — Visualization & Report |

**Supervisor:** Dr. Ashraf Abdel Raouf · Faculty of Computer Science · Misr International University

---

## Tech stack

![C++](https://img.shields.io/badge/C++-00599C?style=flat&logo=cplusplus&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![HTML](https://img.shields.io/badge/HTML%2FCSS-E34F26?style=flat&logo=html5&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

---

## License

This project was developed as an academic course project at Misr International University. All rights reserved by the authors.
