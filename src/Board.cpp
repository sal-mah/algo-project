#include "../include/Board.h"
using namespace std;

// Initializes an empty NxN grid with the given win condition.
Board::Board(int n, int k)   // n is boardSize / k is winLength
    : N(n), K(k)
{
    grid = vector<vector<Cell>>(N, vector<Cell>(N, Cell::EMPTY));
}


// Places a mark at the specified position.
void Board::placeMark(int row, int col, Cell cell) {
    grid[row][col] = cell;
}

// Clears a mark at the specified position.
void Board::undoMark(int row, int col) {
    grid[row][col] = Cell::EMPTY;
}

// Checks whether the given player has K in a row in any direction.
bool Board::checkWin(Cell cell) const {
    const int directions[4][2] = {
        //{row change, column change}
        {0, 1},   // horizontal
        {1, 0},   // vertical
        {1, 1},   // move diagonally down-right
        {1, -1}   // move diagonally down-left
    };

    //Loop Through Entire Board
    for (int row = 0; row < N; ++row) {
        for (int col = 0; col < N; ++col) {
            if (grid[row][col] != cell) { //If the current cell is not the player we're checking, skip it.
                continue;
            }

            for (const auto& dir : directions) { //Try All 4 Directions
                //Start Counting
                int count = 0; // tracks consecutive matches
                int r = row;
                int c = col; //r and c move through the board

                // Continue while:
                while (r >= 0 && r < N &&  //1. still inside board boundaries
                       c >= 0 && c < N &&
                       grid[r][c] == cell) { //2. current cell matches player

                    ++count; // Count Consecutive Cells

                    // Win Condition
                    if (count >= K) {
                        return true;
                    }
                    r += dir[0];
                    c += dir[1];
                }
            }
        }
    }

    return false;
}

// Determines whether the board has any empty cells left.
bool Board::isFull() const {
    for (int row = 0; row < N; ++row) {
        for (int col = 0; col < N; ++col) {
            if (grid[row][col] == Cell::EMPTY) {
                return false;
            }
        }
    }
    return true;
}

// Collects all empty positions as legal moves.
vector<Move> Board::getEmptyCells() const {
    vector<Move> moves;
    for (int row = 0; row < N; ++row) {
        for (int col = 0; col < N; ++col) {
            if (grid[row][col] == Cell::EMPTY) {
                moves.push_back({row, col});
            }
        }
    }
    return moves;
}

// Builds a row-major string key for the current grid.
string Board::getKey() const {
    string key;
    key.reserve(static_cast<size_t>(N) * static_cast<size_t>(N));

    for (int row = 0; row < N; ++row) {
        for (int col = 0; col < N; ++col) {
            switch (grid[row][col]) {
                case Cell::X:
                    key.push_back('X');
                    break;

                case Cell::O:
                    key.push_back('O');
                    break;
                    
                case Cell::EMPTY:
                default:
                    key.push_back('_');
                    break;
                    
            }
        }
    }

    return key;
}

// Returns the cell value at the given position.
Cell Board::getCell(int row, int col) const {
    return grid[row][col];
}

// Returns the board dimension.
int Board::getN() const {
    return N;
}

// Returns the win-condition length.
int Board::getK() const {
    return K;
}
