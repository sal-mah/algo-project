#include "../include/GameState.h"

using namespace std;

// Initializes a new game with X as the starting player.
GameState::GameState(int n, int k)   // n is boardSize / k is winLength
    : board(n, k), currentPlayer(Cell::X) {}


// Returns whether the game has reached a terminal state (the game is finished).
bool GameState::isTerminal() const {
    return board.checkWin(Cell::X) || board.checkWin(Cell::O) || board.isFull();
}

// Returns the terminal score for the current board.
int GameState::getScore() const {
    if (board.checkWin(Cell::X)) {
        return 1;
    }
    if (board.checkWin(Cell::O)) {
        return -1;
    }
    return 0;
}

// Switches the current player between X and O.
void GameState::switchPlayer() {
    currentPlayer = (currentPlayer == Cell::X) ? Cell::O : Cell::X;
}

// Returns the current player.
Cell GameState::getCurrentPlayer() const {
    return currentPlayer;
}

// Returns a mutable reference to the board.
Board& GameState::getBoard() {
    return board;
}

// Returns a const reference to the board.
const Board& GameState::getBoard() const {
    return board;
}
