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
//   2. If X's turn (Maximizer) → try all moves, return the MAX score
//   3. If O's turn (Minimizer) → try all moves, return the MIN score
//   For each move:
//     - board.placeMark()     ← apply the move
//     - state.switchPlayer()  ← change turn
//     - recurse               ← evaluate the result
//     - board.undoMark()      ← undo the move (backtrack)
//     - state.switchPlayer()  ← restore the turn
//
// WHY IT'S SLOW:
//   Two different move sequences can reach the same board state.
//   Brute force has no memory — it recomputes the entire subtree
//   from that board every time. On a 5x5 board at depth 8,
//   this causes a timeout because the same states are recomputed
//   thousands of times.
//   Time complexity: O(b^d) where b = empty cells, d = depth
//
// HOW IT FITS IN THE PROJECT:
//   BruteForceSolver is X (the Maximizer) in the benchmark.
//   It competes against DPSolver on the same board positions.
//   The benchmark compares their metrics side by side.
//
// IMPORTANT NOTES FOR TEAMMATES:
//   - Do NOT add any caching here — the whole point of this
//     class is to show what happens WITHOUT memoization
//   - resetMetrics() must be called before each new getBestMove()
//     or the node counts will accumulate across runs
//   - The depth parameter limits how deep minimax searches —
//     without it the solver would run until a terminal state
// ============================================================

#pragma once
#include "ISolver.h"
#include "GameState.h"
#include "Metrics.h"

class BruteForceSolver : public ISolver {
public:
    // ----------------------------------------------------------
    // Constructor
    // depth = maximum search depth for minimax.
    // Lower depth = faster but less optimal play.
    // Higher depth = more accurate but exponentially slower.
    // ----------------------------------------------------------
    BruteForceSolver(int depth);

    // ----------------------------------------------------------
    // getBestMove(state)
    // Runs minimax from the current game state and returns
    // the best move for whoever's turn it is.
    // Also records time taken in metrics.timeMs.
    // ----------------------------------------------------------
    Move getBestMove(GameState& state) override;

    // Returns metrics collected during the last getBestMove() call
    Metrics getMetrics() const override;

    // Resets all metric counters to zero — call before each run
    void resetMetrics() override;

private:
    int maxDepth;      // Depth limit for minimax search
    Metrics metrics;   // Tracks nodes explored and time

    // ----------------------------------------------------------
    // minimax(state, depth, isMaximizing)
    // The core recursive function.
    // isMaximizing = true when it's X's turn (wants highest score)
    // isMaximizing = false when it's O's turn (wants lowest score)
    // Increments metrics.nodesExplored on every call.
    // ----------------------------------------------------------
    int minimax(GameState& state, int depth, bool isMaximizing);
};