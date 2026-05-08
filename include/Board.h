//===========================================================
// PURPOSE:
//   Represents the NxN game board. This is the lowest-level
//   class in the project — it knows nothing about players,
//   turns, or algorithms. It only manages the grid itself.
//
// RESPONSIBILITIES:
//   - Store the NxN grid of cells (EMPTY, X, or O)
//   - Place and undo marks on cells
//   - Check if a player has won (K in a row)
//   - Return a list of all empty cells (legal moves)
//   - Generate a unique string key for the current board state
//     (used by the DP solver's cache)
//
// HOW IT FITS IN THE PROJECT:
//   Board is used by GameState, which wraps it with turn info.
//   Both BruteForceSolver and DPSolver operate on GameState,
//   which internally calls Board methods.
//
// IMPORTANT NOTES FOR TEAMMATES:
//   - N and K are set once in the constructor and never change
//   - placeMark() and undoMark() must always be paired —
//     the solvers apply a move, recurse, then undo it (backtracking)
//   - getKey() returns a string like "XO_X__O__" — this is
//     what the DP cache uses as its lookup key
//   - Do NOT add any AI or minimax logic here — this class
//     is purely about the grid state
// ============================================================

#pragma once
#include <vector>
#include <string>

// Represents what's in a single cell on the board
enum class Cell {
    EMPTY,  // Cell has no mark yet
    X,      // X has been placed here (Maximizer)
    O       // O has been placed here (Minimizer)
};

// A move is just a (row, col) pair
struct Move {
    int row;
    int col;
};

class Board {
public:
    // ----------------------------------------------------------
    // Constructor
    // n = board size (3 for 3x3, 4 for 4x4, 5 for 5x5)
    // k = how many in a row to win (usually same as n, but configurable)
    // ----------------------------------------------------------
    Board(int n, int k);

    // ----------------------------------------------------------
    // placeMark(row, col, cell)
    // Places X or O on the given cell.
    // Called by the solver before recursing into a child state.
    // ----------------------------------------------------------
    void placeMark(int row, int col, Cell cell);

    // ----------------------------------------------------------
    // undoMark(row, col)
    // Clears the given cell back to EMPTY.
    // Called by the solver AFTER recursing (backtracking step).
    // Always call this after placeMark once recursion returns.
    // ----------------------------------------------------------
    void undoMark(int row, int col);

    // ----------------------------------------------------------
    // checkWin(cell)
    // Returns true if the given player (X or O) has K marks
    // in a row horizontally, vertically, or diagonally.
    // Call this after every placeMark to detect terminal states.
    // ----------------------------------------------------------
    bool checkWin(Cell cell) const;

    // ----------------------------------------------------------
    // isFull()
    // Returns true if every cell is occupied (draw condition).
    // ----------------------------------------------------------
    bool isFull() const;

    // ----------------------------------------------------------
    // getEmptyCells()
    // Returns all cells that are currently EMPTY.
    // The solvers call this to generate the list of legal moves
    // at each step of the minimax recursion.
    // ----------------------------------------------------------
    std::vector<Move> getEmptyCells() const;

    // ----------------------------------------------------------
    // getKey()
    // Converts the board state into a unique string.
    // Example: "XO_X__O__" for a 3x3 board.
    // Used by DPSolver as the cache lookup key.
    // NOTE: BruteForceSolver never calls this — only DPSolver does.
    // ----------------------------------------------------------
    std::string getKey() const;

    // ----------------------------------------------------------
    // getCell(row, col)
    // Returns the Cell value at a given position.
    // Used by win-checking and rendering logic.
    // ----------------------------------------------------------
    Cell getCell(int row, int col) const;

    // Getters for board dimensions
    int getN() const;   // Board size (N x N)
    int getK() const;   // Win condition (K in a row)

private:
    int N;                          // Board dimension
    int K;                          // Win condition
    std::vector<std::vector<Cell>> grid;  // The actual NxN grid
};