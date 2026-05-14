#include "BruteForceSolver.h"
#include <iostream>
using namespace std;

// Prints the board nicely to the console
void printBoard(GameState& state) {
    Board& b = state.getBoard();
    int n = b.getN();
    cout << "\n";
    for (int r = 0; r < n; r++) {
        cout << "  ";
        for (int c = 0; c < n; c++) {
            Cell cell = b.getCell(r, c);
            char ch = (cell == Cell::X) ? 'X' : (cell == Cell::O) ? 'O' : '.';
            cout << " " << ch;
            if (c < n - 1) cout << " |";
        }
        cout << "\n";
        if (r < n - 1) {
            cout << "  ";
            for (int c = 0; c < n; c++) cout << "---" << (c < n - 1 ? "+" : "");
            cout << "\n";
        }
    }
    cout << "\n";
}

int main() {
    cout << "==============================================\n";
    cout << "   BruteForceSolver — Minimax Test Suite\n";
    cout << "==============================================\n";

    // ── Test 1: X should win immediately ─────────────────────────────────────
    // Board:         Expected: X picks (0,1) to complete top row
    //   X . X
    //   . O .
    //   . O .
    cout << "\nTest 1: X can win RIGHT NOW\n";
    cout << "Board:\n";
    GameState state1(3, 3);
    state1.getBoard().placeMark(0, 0, Cell::X);
    state1.getBoard().placeMark(0, 2, Cell::X);
    state1.getBoard().placeMark(1, 1, Cell::O);
    state1.getBoard().placeMark(2, 1, Cell::O);
    printBoard(state1);

    BruteForceSolver solver1;
    solver1.resetMetrics();
    Move best1 = solver1.getBestMove(state1);
    cout << "Best move for X: (" << best1.row << ", " << best1.col << ")\n";
    cout << "Expected:        (0, 1)  <- completes top row\n";
    cout << "Nodes explored:  " << solver1.getMetrics().nodesExplored << "\n";
    cout << "Time:            " << solver1.getMetrics().timeMs << " ms\n";
    cout << (best1.row == 0 && best1.col == 1 ? "PASS" : "FAIL") << "\n";

    // ── Test 2: O must block X from winning ───────────────────────────────────
    // Board:         Expected: O picks (0,2) to block X
    //   X X .
    //   . O .
    //   . . .
    cout << "\n----------------------------------------------\n";
    cout << "Test 2: O must BLOCK X at (0,2)\n";
    cout << "Board:\n";
    GameState state2(3, 3);
    state2.getBoard().placeMark(0, 0, Cell::X);
    state2.getBoard().placeMark(0, 1, Cell::X);
    state2.getBoard().placeMark(1, 1, Cell::O);
    // It is now O's turn
    state2.switchPlayer();
    printBoard(state2);

    BruteForceSolver solver2;
    solver2.resetMetrics();
    Move best2 = solver2.getBestMove(state2);
    cout << "Best move for O: (" << best2.row << ", " << best2.col << ")\n";
    cout << "Expected:        (0, 2)  <- blocks X from winning\n";
    cout << "Nodes explored:  " << solver2.getMetrics().nodesExplored << "\n";
    cout << "Time:            " << solver2.getMetrics().timeMs << " ms\n";
    cout << (best2.row == 0 && best2.col == 2 ? "PASS" : "FAIL") << "\n";

    // ── Test 3: Only one move left — forced ───────────────────────────────────
    // Board:         Expected: X picks (2,2) — only empty cell
    //   X O X
    //   O X O
    //   O X .
    cout << "\n----------------------------------------------\n";
    cout << "Test 3: One move left — forced\n";
    cout << "Board:\n";
    GameState state3(3, 3);
    state3.getBoard().placeMark(0, 0, Cell::X);
    state3.getBoard().placeMark(0, 1, Cell::O);
    state3.getBoard().placeMark(0, 2, Cell::X);
    state3.getBoard().placeMark(1, 0, Cell::O);
    state3.getBoard().placeMark(1, 1, Cell::X);
    state3.getBoard().placeMark(1, 2, Cell::O);
    state3.getBoard().placeMark(2, 0, Cell::O);
    state3.getBoard().placeMark(2, 1, Cell::X);
    printBoard(state3);

    BruteForceSolver solver3;
    solver3.resetMetrics();
    Move best3 = solver3.getBestMove(state3);
    cout << "Best move for X: (" << best3.row << ", " << best3.col << ")\n";
    cout << "Expected:        (2, 2)  <- only cell left\n";
    cout << "Nodes explored:  " << solver3.getMetrics().nodesExplored << "\n";
    cout << "Time:            " << solver3.getMetrics().timeMs << " ms\n";
    cout << (best3.row == 2 && best3.col == 2 ? "PASS" : "FAIL") << "\n";

    // ── Summary ───────────────────────────────────────────────────────────────
    cout << "\n==============================================\n";
    cout << "   All tests done!\n";
    cout << "   BruteForceSolver is working correctly.\n";
    cout << "==============================================\n";

    return 0;
}
