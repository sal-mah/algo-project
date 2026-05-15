// ============================================================
// PURPOSE:
//   A simple data container that holds performance numbers
//   collected during a single solver run. No logic, no methods —
//   just three variables that get filled in as minimax runs.
//
// RESPONSIBILITIES:
//   - Count how many nodes (board states) were explored
//   - Record how long the solve took in milliseconds
//   - Count how many times the DP cache was hit
//     (this will always be 0 for BruteForceSolver)
//
// HOW IT FITS IN THE PROJECT:
//   Each solver holds one Metrics object internally.
//   During minimax, the solver increments nodesExplored every
//   time it visits a state, and increments cacheHits every time
//   it finds the board in the cache instead of recursing.
//   After getBestMove() returns, the benchmark calls getMetrics()
//   to retrieve these numbers and write them to data.csv.
//
// IMPORTANT NOTES FOR TEAMMATES:
//   - This file has NO .cpp — it is just a struct with defaults
//   - Both solvers track nodesExplored and timeMs
//   - Only DPSolver will ever have cacheHits > 0
//   - Reset all values to 0 before each new solve using reset()
//     (or call ISolver::resetMetrics() which does this for you)
// ============================================================

#pragma once

using namespace std;

struct Metrics {
    // Total number of board states visited during minimax.
    // Incremented once per recursive call in both solvers.
    // This is the primary measure of work done.
    int nodesExplored = 0;

    // How long getBestMove() took to complete, in milliseconds.
    // Measured using chrono in the solver's getBestMove().
    double timeMs = 0.0;

    // How many times the DP cache returned an instant result
    // instead of recursing into the full subtree.
    // BruteForceSolver always leaves this at 0.
    // DPSolver increments this on every cache hit.
    int cacheHits = 0;

    // ----------------------------------------------------------
    // reset()
    // Sets all counters back to zero.
    // Call this before every new getBestMove() in the benchmark.
    // ----------------------------------------------------------
    void reset() {
        nodesExplored = 0;
        timeMs        = 0.0;
        cacheHits     = 0;
    }
};