#include "BruteForceSolver.h"
#include <limits>
#include <chrono>
#include <algorithm>

using namespace std;
// ── constructor ─────────────────────────────────────────────────────────────
BruteForceSolver::BruteForceSolver(int depth)
    : maxDepth(depth) {}


// ─────────────────────────────────────────────────────────────────────────────
//  BruteForceSolver.cpp
//
//  Pure recursive Minimax — no alpha-beta, no memoisation.
//
//  Key design choice: instead of copying GameState on every recursive call,
//  we mutate the shared Board with placeMark/undoMark and flip the turn with
//  switchPlayer/switchPlayer. This is the standard backtracking pattern and
//  is much cheaper than copying an NxN grid at every node.
//
//  Why no optimisations?
//  This is the BASELINE solver whose job is to demonstrate O(b^d) blow-up.
//  Adding alpha-beta or a cache would obscure the comparison with DPSolver.
//  Keep it naive on purpose.
// ─────────────────────────────────────────────────────────────────────────────


// ── resetMetrics ─────────────────────────────────────────────────────────────
void BruteForceSolver::resetMetrics() {
    metrics.reset();
}

// ── getMetrics ────────────────────────────────────────────────────────────────
Metrics BruteForceSolver::getMetrics() const {
    return metrics;
}


// ── minimax ───────────────────────────────────────────────────────────────────
// Recursively evaluates every possible future from the current state.
//
// Base cases:
//   1. state.isTerminal() → score it via state.getScore()
//   2. depth == 0         → return 0 (no heuristic at depth limit)
//
// Recursive case:
//   For every empty cell:
//     placeMark  → switchPlayer → recurse → switchPlayer → undoMark
//   Maximizer (X) keeps the highest child score.
//   Minimizer (O) keeps the lowest  child score.
//
// NOTE: The same board IS visited multiple times when different move
//       sequences lead to the same configuration. That redundancy is
//       the "overlapping subproblems" issue — exactly what DPSolver
//       eliminates with a cache key (board.getKey()).
int BruteForceSolver::minimax(GameState& state, int depth, bool isMaximizing) {
    // Count every node we visit — Dev 4 reads this from metrics
    metrics.nodesExplored++;

    // ── Base cases ───────────────────────────────────────────────────────────
    if (state.isTerminal()) {
        return state.getScore();   // +1, -1, or 0  (defined in GameState.cpp)
    }
    if (depth == 0) {
        return 0;   // Depth limit reached — no heuristic, return neutral
    }

    // ── Recursive case ───────────────────────────────────────────────────────
    Board& board          = state.getBoard();
    vector<Move> moves = board.getEmptyCells();

    // Determine which Cell token belongs to the current player
    Cell currentCell = state.getCurrentPlayer();   // Cell::X or Cell::O

    if (isMaximizing) {
        int best = numeric_limits<int>::min();

        for (const Move& m : moves) { 
            board.placeMark(m.row, m.col, currentCell);  // apply
            state.switchPlayer();                         // flip turn

            int score = minimax(state, depth - 1, false);

            state.switchPlayer();                         // undo the turn switch   <- BACKTRACK
            board.undoMark(m.row, m.col);                // undo the move           <- BACKTRACK  

            if (score > best) best = score;
        }
        return best;

    } else { // Minimizing player
        int best = numeric_limits<int>::max();

        for (const Move& m : moves) {
            board.placeMark(m.row, m.col, currentCell);  // apply
            state.switchPlayer();                         // flip turn

            int score = minimax(state, depth - 1, true);

            state.switchPlayer();                         // undo the turn switch   <- BACKTRACK
            board.undoMark(m.row, m.col);                // undo the move           <- BACKTRACK  

            if (score < best) best = score;
        }
        return best;
    }
}


// ── getBestMove ───────────────────────────────────────────────────────────────
// Entry point for the benchmark.
// Iterates over all legal moves, calls minimax for each, and returns
// the Move that gives the current player the best outcome.
//
// X (Maximizer) → pick the move with the HIGHEST minimax score.
// O (Minimizer) → pick the move with the LOWEST  minimax score.
//
// Timing is measured around the full search and stored in metrics.timeMs.
// Call resetMetrics() before calling this or counts will accumulate.
Move BruteForceSolver::getBestMove(GameState& state) {
    auto start = chrono::high_resolution_clock::now(); // Start the timer at the beginning of the search

    Board& board            = state.getBoard();
    vector<Move> moves = board.getEmptyCells();

    Move   bestMove   = {-1, -1};
    int    bestScore  = 0;
    bool   maximizing = (state.getCurrentPlayer() == Cell::X);
    Cell   currentCell = state.getCurrentPlayer();

    if (maximizing) {
        bestScore = numeric_limits<int>::min();
    } else {
        bestScore = numeric_limits<int>::max();
    }

    // Search depth defaults to a full search unless maxDepth is provided.
    int depth = static_cast<int>(moves.size());
    if (maxDepth > 0) {
        depth = min(maxDepth, depth);
    }

    for (const Move& m : moves) {
        board.placeMark(m.row, m.col, currentCell);
        state.switchPlayer();

        int score = minimax(state, depth - 1, !maximizing);

        state.switchPlayer();
        board.undoMark(m.row, m.col);

        if (maximizing && score > bestScore) {
            bestScore = score;
            bestMove  = m;
        } else if (!maximizing && score < bestScore) {
            bestScore = score;
            bestMove  = m;
        }
    }

    auto end = chrono::high_resolution_clock::now(); // Stop the timer after the full search is done
    metrics.timeMs = chrono::duration<double, milli>(end - start).count(); // Store elapsed time in metrics

    return bestMove;
}