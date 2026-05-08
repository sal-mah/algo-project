// ============================================================
// PURPOSE:
//   Abstract interface that both solvers must implement.
//   This enforces a shared contract so the benchmark runner
//   can treat BruteForceSolver and DPSolver identically —
//   swap one for the other without changing any other code.
//
// RESPONSIBILITIES:
//   - Define the getBestMove() method that every solver must have
//   - Define the getMetrics() method so the benchmark can
//     collect results from either solver the same way
//
// HOW IT FITS IN THE PROJECT:
//   run_benchmark.cpp holds a pointer of type ISolver* and
//   calls getBestMove() on it. It doesn't care whether the
//   pointer points to a BruteForceSolver or a DPSolver.
//   This is the classic "program to an interface" pattern.
//
//   ISolver
//     ├── BruteForceSolver   (implements getBestMove with no cache)
//     └── DPSolver           (implements getBestMove with cache)
//
// IMPORTANT NOTES FOR TEAMMATES:
//   - This file has NO .cpp — it is pure abstract (no method bodies)
//   - Never add any algorithm logic here
//   - If you add a new solver (e.g. AlphaBetaSolver), it must
//     inherit from ISolver and implement both methods below
// ============================================================

#pragma once
#include "GameState.h"
#include "Metrics.h"

class ISolver {
public:
    // ----------------------------------------------------------
    // getBestMove(state)
    // Given the current game state, compute and return the
    // best possible move for the current player using minimax.
    // This is the core method each solver implements differently.
    // ----------------------------------------------------------
    virtual Move getBestMove(GameState& state) = 0;

    // ----------------------------------------------------------
    // getMetrics()
    // Returns the metrics collected during the last getBestMove()
    // call: how many nodes were explored, how long it took,
    // and how many cache hits occurred (DP only — BF always 0).
    // The benchmark runner calls this after every move.
    // ----------------------------------------------------------
    virtual Metrics getMetrics() const = 0;

    // ----------------------------------------------------------
    // resetMetrics()
    // Clears all counters back to zero before each new solve.
    // Call this before every getBestMove() in the benchmark loop.
    // ----------------------------------------------------------
    virtual void resetMetrics() = 0;

    // Virtual destructor — required for safe polymorphic deletion
    virtual ~ISolver() = default;
};