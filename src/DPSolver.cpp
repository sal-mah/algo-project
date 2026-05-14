//
// Created by asus on 5/8/2026.
//

#include "../include/DPSolver.h"
#include <chrono>
#include <limits>

// Sets the maximum search depth and initializes an empty cache.
DPSolver::DPSolver(int depth)
    : maxDepth(depth) {}

// Runs memoized minimax and returns the best move for the current player.
Move DPSolver::getBestMove(GameState& state) {
    auto start = std::chrono::high_resolution_clock::now();

    bool isMaximizing = (state.getCurrentPlayer() == Cell::X);

    Move bestMove = {-1, -1};
    int bestScore = isMaximizing
        ? std::numeric_limits<int>::min()
        : std::numeric_limits<int>::max();

    Board& board = state.getBoard();
    std::vector<Move> moves = board.getEmptyCells();

    for (const Move& move : moves) {
        board.placeMark(move.row, move.col, state.getCurrentPlayer());
        state.switchPlayer();

        int score = minimax(state, maxDepth - 1, !isMaximizing);

        state.switchPlayer();
        board.undoMark(move.row, move.col);

        if (isMaximizing) {
            if (score > bestScore) {
                bestScore = score;
                bestMove  = move;
            }
        } else {
            if (score < bestScore) {
                bestScore = score;
                bestMove  = move;
            }
        }
    }

    auto end = std::chrono::high_resolution_clock::now();
    metrics.timeMs = std::chrono::duration<double, std::milli>(end - start).count();

    return bestMove;
}

// Core memoized minimax — identical structure to BruteForceSolver
// except for the cache.get() check at the top and cache.set() at the end.
int DPSolver::minimax(GameState& state, int depth, bool isMaximizing) {
    metrics.nodesExplored++;

    // --- Cache lookup (the only difference from BruteForce) ---
    std::string key = state.getBoard().getKey() + "|" + std::to_string(depth);
    auto cached = cache.get(key);
    if (cached.has_value()) {
        metrics.cacheHits++;
        return cached.value();   // instant result — skip entire subtree
    }

    // --- Terminal / depth-limit check ---
    if (state.isTerminal() || depth == 0) {
        int score = state.getScore();
        cache.set(key, score);
        return score;
    }

    Board& board = state.getBoard();
    std::vector<Move> moves = board.getEmptyCells();

    int score;

    if (isMaximizing) {
        score = std::numeric_limits<int>::min();
        for (const Move& move : moves) {
            Cell currentCell = state.getCurrentPlayer();
            board.placeMark(move.row, move.col, currentCell);
            state.switchPlayer();

            int val = minimax(state, depth - 1, false);

            state.switchPlayer();
            board.undoMark(move.row, move.col);

            if (val > score) score = val;
        }
    } else {
        score = std::numeric_limits<int>::max();
        for (const Move& move : moves) {
            Cell currentCell = state.getCurrentPlayer();
            board.placeMark(move.row, move.col, currentCell);
            state.switchPlayer();

            int val = minimax(state, depth - 1, true);

            state.switchPlayer();
            board.undoMark(move.row, move.col);

            if (val < score) score = val;
        }
    }

    // --- Store result before returning ---
    cache.set(key, score);
    return score;
}

// Returns the metrics collected during the last getBestMove() call.
Metrics DPSolver::getMetrics() const {
    return metrics;
}

// Resets all metric counters AND clears the transposition table.
void DPSolver::resetMetrics() {
    metrics.reset();
    cache.clear();
}
