#include <iostream>
#include <fstream>
#include <vector>
#include "../include/BruteForceSolver.h"
#include "../include/DPSolver.h"
#include "../include/GameState.h"
using namespace std;

int main(int argc, char* argv[]) {
    // ── Board configs ─────────────────────────────────────────────────────────
    // Depths must match run_benchmark.cpp exactly: {2, 4, 6, 8}
    // Timeout rules (same as run_benchmark.cpp):
    //   BF: 4x4 depth>=8 TIMEOUT; 5x5 depth>=6 TIMEOUT
    //   DP: 5x5 depth>=8 TIMEOUT
    struct TraceConfig { int n; int k; vector<int> depths; };
    vector<TraceConfig> configs = {
        {3, 3, {2, 4, 6, 8}},
        {4, 4, {2, 4, 6, 8}},
        {5, 5, {2, 4, 6, 8}}
    };

    // Override with command-line args: run_game_trace.exe N K depth
    if (argc >= 4) {
        int n = atoi(argv[1]), k = atoi(argv[2]), d = atoi(argv[3]);
        configs = {{n, k, {d}}};
    }

    ofstream trace("results/game_trace.csv", ios::out);
    if (!trace.is_open()) {
        cout << "ERROR: Could not open results/game_trace.csv\n";
        return 1;
    }
    trace << "solver,n,k,maxDepth,moveNum,player,row,col,nodes,timeMs,cacheHits\n";

    for (const auto& cfg : configs) {
        for (int d : cfg.depths) {
            cout << "Generating trace for N=" << cfg.n << " K=" << cfg.k << " Depth=" << d << "...\n";

            // ── Brute Force ──────────────────────────────────────────────────
            bool bfTimeout = (cfg.n == 4 && d >= 8) || (cfg.n == 5 && d >= 6);
            if (!bfTimeout) {
                GameState state(cfg.n, cfg.k);
                BruteForceSolver solver(d);
                int moveNum = 1;
                while (!state.isTerminal()) {
                    solver.resetMetrics();
                    Cell player = state.getCurrentPlayer();
                    Move best = solver.getBestMove(state);
                    Metrics m = solver.getMetrics();
                    trace << "BruteForce," << cfg.n << "," << cfg.k << "," << d << ","
                            << moveNum << "," << (player == Cell::X ? "X" : "O") << ","
                            << best.row << "," << best.col << ","
                            << m.nodesExplored << "," << m.timeMs << "," << m.cacheHits << "\n";
                    state.getBoard().placeMark(best.row, best.col, player);
                    state.switchPlayer();
                    moveNum++;
                }
            }

            // ── DP ───────────────────────────────────────────────────────────
            bool dpTimeout = (cfg.n == 5 && d >= 8);
            if (!dpTimeout) {
                GameState state(cfg.n, cfg.k);
                DPSolver solver(d);
                int moveNum = 1;
                while (!state.isTerminal()) {
                    solver.resetMetrics();
                    Cell player = state.getCurrentPlayer();
                    Move best = solver.getBestMove(state);
                    Metrics m = solver.getMetrics();
                    trace << "DP," << cfg.n << "," << cfg.k << "," << d << ","
                            << moveNum << "," << (player == Cell::X ? "X" : "O") << ","
                            << best.row << "," << best.col << ","
                            << m.nodesExplored << "," << m.timeMs << "," << m.cacheHits << "\n";
                    state.getBoard().placeMark(best.row, best.col, player);
                    state.switchPlayer();
                    moveNum++;
                }
            }
        }
    }

    trace.close();
    cout << "Game trace(s) saved to results/game_trace.csv\n";
    return 0;
}
