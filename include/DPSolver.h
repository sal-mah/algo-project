// ============================================================
// PURPOSE:
//   Implements Minimax WITH memoization (Dynamic Programming).
//   Identical logic to BruteForceSolver, but before recursing
//   it checks a cache. If the board state was seen before,
//   it returns the stored result instantly — no recursion needed.
//
// RESPONSIBILITIES:
//   - Implement getBestMove() from ISolver
//   - Run Minimax with cache lookup at every recursive step
//   - Count every node visited in Metrics.nodesExplored
//   - Count every cache hit in Metrics.cacheHits
//   - Measure how long the solve takes in Metrics.timeMs
//   - Store new results in the cache after computing them
//
// HOW IT DIFFERS FROM BRUTEFORCESOLVER:
//   At the top of every minimax call, DPSolver does this first:
//     auto cached = cache.get(board.getKey());
//     if (cached.has_value()) {
//         metrics.cacheHits++;
//         return cached.value();   ← skip the entire subtree
//     }
//   After computing a score normally, it stores it:
//     cache.set(board.getKey(), score);
//   That is the ONLY difference. Everything else is identical.
//
// WHY IT'S FAST (the DP argument):
//   Different move sequences often reach the same board state.
//   Example: X→(0,0) then X→(0,2) = X→(0,2) then X→(0,0).
//   Without cache: full subtree recomputed every time (BruteForce).
//   With cache: computed once, retrieved in O(1) every other time.
//   At depth 8 on a 5x5 board: BruteForce times out, DP handles it.
//   Time complexity: O(U × b) where U = unique board states
//
// HOW IT FITS IN THE PROJECT:
//   DPSolver is O (the Minimizer) in the benchmark.
//   It runs on the same board positions as BruteForceSolver.
//   The cache hit rate growing with depth is a key result —
//   it proves that overlapping subproblems exist and are being
//   exploited, which is the core DP argument in the report.
//
// IMPORTANT NOTES FOR TEAMMATES:
//   - cache.clear() is called automatically in resetMetrics()
//     so stale entries never carry over between benchmark runs
//   - The cache key is board.getKey() — the board configuration
//     as a string. It is NOT the move sequence. This is critical:
//     two different paths to the same board must map to the same key
//   - cacheHits in metrics will grow significantly with depth —
//     verify this in your benchmark output before writing the report
// ============================================================

#pragma once
#include "ISolver.h"
#include "GameState.h"
#include "Metrics.h"
#include "Cache.h"

class DPSolver : public ISolver {
public:
    // ----------------------------------------------------------
    // Constructor
    // depth = maximum search depth for minimax.
    // Same parameter as BruteForceSolver for fair comparison.
    // ----------------------------------------------------------
    DPSolver(int depth);

    // ----------------------------------------------------------
    // getBestMove(state)
    // Runs memoized minimax from the current game state and
    // returns the best move for whoever's turn it is.
    // Also records time taken in metrics.timeMs.
    // ----------------------------------------------------------
    Move getBestMove(GameState& state) override;

    // Returns metrics collected during the last getBestMove() call
    Metrics getMetrics() const override;

    // Resets all metric counters AND clears the cache.
    // Must be called before each benchmark run.
    void resetMetrics() override;
    
    std::string name() const override { return "DP"; }
    

private:
    int maxDepth;      // Depth limit for minimax search
    Metrics metrics;   // Tracks nodes, time, and cache hits
    Cache cache;       // The transposition table (board → score)

    // ----------------------------------------------------------
    // minimax(state, depth, isMaximizing)
    // The core recursive function — same structure as BruteForce
    // but with cache.get() at the top and cache.set() at the end.
    // isMaximizing = true for X's turn, false for O's turn.
    // ----------------------------------------------------------
    int minimax(GameState& state, int depth, bool isMaximizing);
};