#include <iostream>
#include <fstream>
#include <chrono>
#include "../include/BruteForceSolver.h"
#include "../include/DPSolver.h"
#include "../include/GameState.h"
using namespace std;

// Plays a full game and returns total nodes, time, cacheHits summed across all moves.
struct GameTotals { long long nodes; double timeMs; long long cacheHits; };

GameTotals runFullGame_BF(int n, int depth) {
    GameState state(n, n);
    BruteForceSolver solver(depth);
    GameTotals t{0, 0.0, 0};
    while (!state.isTerminal()) {
        solver.resetMetrics();
        Cell p = state.getCurrentPlayer();
        Move best = solver.getBestMove(state);
        Metrics m = solver.getMetrics();
        t.nodes += m.nodesExplored;
        t.timeMs += m.timeMs;
        t.cacheHits += m.cacheHits;
        state.getBoard().placeMark(best.row, best.col, p);
        state.switchPlayer();
    }
    return t;
}

GameTotals runFullGame_DP(int n, int depth) {
    GameState state(n, n);
    DPSolver solver(depth);
    GameTotals t{0, 0.0, 0};
    while (!state.isTerminal()) {
        solver.resetMetrics();
        Cell p = state.getCurrentPlayer();
        Move best = solver.getBestMove(state);
        Metrics m = solver.getMetrics();
        t.nodes += m.nodesExplored;
        t.timeMs += m.timeMs;
        t.cacheHits += m.cacheHits;
        state.getBoard().placeMark(best.row, best.col, p);
        state.switchPlayer();
    }
    return t;
}

int main(){
    ofstream csv("results/data.csv", ios::out);
    cout << "Opening file...\n";
    if (!csv.is_open()) {
        cout << "ERROR: Could not open results/data.csv\n";
        return 1;
    }
    cout << "File opened!\n";
    csv << "solver,board,depth,nodes,timeMs,cacheHits\n";

    // ── Timeout rules (same as run_game_trace.cpp) ───────────────────────────
    // BF: 4x4 depth>=8 too slow; 5x5 depth>=6 too slow
    // DP: 5x5 depth>=8 too slow

    int boardSizes[] = {3, 4, 5};
    int depths[]     = {2, 4, 6, 8};

    for (int n : boardSizes) {
        for (int d : depths) {
            cout << "Running N=" << n << " D=" << d << "...\n";

            bool bfTimeout = (n == 4 && d >= 8) || (n == 5 && d >= 6);
            if (!bfTimeout) {
                GameTotals t = runFullGame_BF(n, d);
                csv << "BruteForce," << n << "," << d << "," << t.nodes << "," << t.timeMs << "," << t.cacheHits << "\n";
            } else {
                csv << "BruteForce," << n << "," << d << ",TIMEOUT,TIMEOUT,0\n";
            }

            bool dpTimeout = (n == 5 && d >= 8);
            if (!dpTimeout) {
                GameTotals t = runFullGame_DP(n, d);
                csv << "DP," << n << "," << d << "," << t.nodes << "," << t.timeMs << "," << t.cacheHits << "\n";
            } else {
                csv << "DP," << n << "," << d << ",TIMEOUT,TIMEOUT,0\n";
            }
        }
    }

    csv.close();
    cout << "Done! Results saved to results/data.csv\n";
    return 0;
}