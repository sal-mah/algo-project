// ============================================================
// PURPOSE:
//   Implements Minimax with NO caching. Every board state is
//   computed from scratch every time it is encountered, even
//   if it has been seen before through a different move sequence.
//
// RESPONSIBILITIES:
//   - Implement getBestMove() from ISolver
//   - Run a pure recursive Minimax from the given game state
//   - Count every node visited in Metrics.nodesExplored
//   - Measure how long the solve takes in Metrics.timeMs
//   - Leave Metrics.cacheHits always at 0 (no cache used)
//
// HOW MINIMAX WORKS HERE:
//   1. If state is terminal → return its score (+1, -1, or 0)
//   2. If depth == 0        → return 0 (no heuristic)
//   3. If X's turn (Maximizer) → try all moves, return MAX score
//   4. If O's turn (Minimizer) → try all moves, return MIN score
//
//   For each move:
//     board.placeMark(row, col, cell)  ← apply the move
//     state.switchPlayer()             ← flip the turn
//     recurse                          ← evaluate the result
//     state.switchPlayer()             ← restore the turn
//     board.undoMark(row, col)         ← undo the move (backtrack)
//
// WHY IT'S SLOW:
//   Two different move sequences can reach the same board state.
//   Brute force has no memory — it recomputes the full subtree
//   every single time. On a 5×5 board at depth 8 this causes a
//   timeout because the same states are recomputed thousands of
//   times. Time complexity: O(b^d) where b = empty cells, d = depth.
//
// IMPORTANT NOTES FOR TEAMMATES:
//   - Do NOT add any caching here — the whole point of this class
//     is to show what happens WITHOUT memoization
//   - resetMetrics() must be called before each getBestMove() or
//     node counts will accumulate across benchmark runs
// ============================================================

#pragma once
#include "ISolver.h"
#include "GameState.h"
#include "Metrics.h"
#include <string>

using namespace std;

class BruteForceSolver : public ISolver {
public:
    BruteForceSolver() = default;
    explicit BruteForceSolver(int depth);
    ~BruteForceSolver() override = default;

    // ----------------------------------------------------------
    // getBestMove(state)
    // Entry point. Iterates over all legal moves, runs minimax
    // for each, and returns the Move with the best score.
    // X (Maximizer) picks the highest score.
    // O (Minimizer) picks the lowest score.
    // Also records elapsed time in metrics.timeMs.
    // ----------------------------------------------------------
    Move getBestMove(GameState& state) override;

    // Returns metrics from the last getBestMove() call.
    Metrics getMetrics() const override;

    // Resets nodesExplored, timeMs, cacheHits to zero.
    // Call this before every benchmark run.
    void resetMetrics() override;

    string name() const override { return "BruteForce"; }

private:
    Metrics metrics;   // Filled in during each getBestMove() call
    int maxDepth = -1; // -1 means full search

    // ----------------------------------------------------------
    // minimax(state, depth, isMaximizing)
    // Core recursive function.
    // isMaximizing = true  → X's turn (maximise)
    // isMaximizing = false → O's turn (minimise)
    // Increments metrics.nodesExplored on every call.
    // Uses board.placeMark / board.undoMark for backtracking —
    // no GameState copying, mutates and restores in place.
    // ----------------------------------------------------------
    int minimax(GameState& state, int depth, bool isMaximizing);
};