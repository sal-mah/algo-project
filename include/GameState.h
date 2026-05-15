// ============================================================
// PURPOSE:
//   Wraps a Board and adds game-level awareness: whose turn
//   it is, whether the game is over, and what the score is.
//   This is the object that Minimax actually operates on.
//
// RESPONSIBILITIES:
//   - Hold the current Board
//   - Track whose turn it is (X or O)
//   - Detect terminal states (win or draw)
//   - Return the score of a terminal state (+1, -1, or 0)
//   - Switch turns after each move
//
// HOW IT FITS IN THE PROJECT:
//   Both BruteForceSolver and DPSolver receive a GameState
//   and call minimax on it. At each step the solver:
//     1. Calls isTerminal() — if true, calls getScore() and returns
//     2. Calls board.getEmptyCells() to get legal moves
//     3. Calls board.placeMark() + switchPlayer() to move forward
//     4. Recurses, then calls board.undoMark() + switchPlayer() to backtrack
//
// SCORING:
//   +1  → X wins  (Maximizer)
//   -1  → O wins  (Minimizer)
//    0  → Draw
//
// IMPORTANT NOTES FOR TEAMMATES:
//   - GameState does NOT make moves itself — the solver does
//   - isTerminal() must be called AFTER every placeMark(),
//     not before, because the game ends when a mark is placed
//   - switchPlayer() simply flips currentPlayer between X and O
// ============================================================

#pragma once
#include "Board.h"

using namespace std;

class GameState {
public:
    // ----------------------------------------------------------
    // Constructor
    // Creates a fresh game on an NxN board with K-in-a-row win.
    // X always goes first.
    // ----------------------------------------------------------
    GameState(int n, int k);  // n is boardSize / k is winLength

    // ----------------------------------------------------------
    // isTerminal()
    // Returns true if the game is over — either a player has
    // won or the board is completely full (draw).
    // The solver checks this at the top of every minimax call.
    // ----------------------------------------------------------
    bool isTerminal() const;

    // ----------------------------------------------------------
    // getScore()
    // Returns the score of the current terminal state:
    //   +1 if X has won
    //   -1 if O has won
    //    0 if it's a draw
    // Only call this when isTerminal() is true.
    // ----------------------------------------------------------
    int getScore() const;

    // ----------------------------------------------------------
    // switchPlayer()
    // Flips currentPlayer from X to O or O to X.
    // Called by the solver after placing a mark (and again
    // after undoing, to restore the original turn).
    // ----------------------------------------------------------
    void switchPlayer();

    // ----------------------------------------------------------
    // getCurrentPlayer()
    // Returns whose turn it currently is (X or O).
    // Used by minimax to decide whether to maximize or minimize.
    // ----------------------------------------------------------
    Cell getCurrentPlayer() const;

    // ----------------------------------------------------------
    // getBoard()
    // Returns a reference to the underlying Board object.
    // Solvers use this to call placeMark(), undoMark(),
    // getEmptyCells(), and getKey().
    // ----------------------------------------------------------
    Board& getBoard();
    const Board& getBoard() const;

private:
    Board board;           // The current grid state
    Cell currentPlayer;    // Whose turn it is (X or O)
};