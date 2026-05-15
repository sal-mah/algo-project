// ============================================================
// PURPOSE:
//   Abstract interface that both solvers must implement.
//   This enforces a shared contract so the benchmark runner
//   can treat BruteForceSolver and DPSolver identically —
//   swap one for the other without changing any other code.
//
// RESPONSIBILITIES:
//   - Define getBestMove() that every solver must have
//   - Define getMetrics() so the benchmark collects results
//     from either solver the same way
//
// HOW IT FITS IN THE PROJECT:
//   run_benchmark.cpp holds a pointer of type ISolver* and
//   calls getBestMove() on it without caring which solver it is.
//
//   ISolver
//     ├── BruteForceSolver   (implements getBestMove with no cache)
//     └── DPSolver           (implements getBestMove with cache)
//
// IMPORTANT NOTES FOR TEAMMATES (Dev 2 & Dev 3):
//   - This file has NO .cpp — it is pure abstract (no method bodies)
//   - Never add algorithm logic here
//   - getBestMove() takes GameState& (not const) because solvers
//     mutate the internal Board with placeMark/undoMark during
//     recursion, then restore it — this is the backtracking pattern
//   - Score contract is fixed: +1 = X wins, -1 = O wins, 0 = draw
//     Both solvers MUST return the same values for fair comparison
// ============================================================

#pragma once
#include "GameState.h"
#include "Metrics.h"
#include "Board.h"      // for the Move struct
#include <string>

using namespace std;

class ISolver {
public:
    virtual ~ISolver() = default;

    // ----------------------------------------------------------
    // getBestMove(state)
    // Runs minimax from the current game state.
    // Returns the best Move {row, col} for the current player.
    // Also fills metrics.timeMs with how long it took.
    // ----------------------------------------------------------
    virtual Move getBestMove(GameState& state) = 0;

    // ----------------------------------------------------------
    // getMetrics()
    // Returns the Metrics collected during the last getBestMove().
    // Dev 4 (Benchmark) calls this after each run to write data.csv
    // ----------------------------------------------------------
    virtual Metrics getMetrics() const = 0;

    // ----------------------------------------------------------
    // resetMetrics()
    // Zeroes all metric counters.
    // For DPSolver this also clears the cache.
    // MUST be called before every getBestMove() in the benchmark
    // or node counts will accumulate across runs.
    // ----------------------------------------------------------
    virtual void resetMetrics() = 0;

    // Human-readable name used in benchmark output and the report.
    // BruteForceSolver returns "BruteForce", DPSolver returns "DP".
    virtual string name() const = 0;
};