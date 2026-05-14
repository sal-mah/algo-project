#include <iostream>
#include <fstream>
#include <chrono>
#include "../include/BruteForceSolver.h"
#include "../include/DPSolver.h"
using namespace std; 

int main(){
    ofstream csv("results/data.csv", ios::out);
    cout << "Opening file...\n";
    if (!csv.is_open()) {
        cout << "ERROR: Could not open results/data.csv\n";
        cout << "Make sure the results folder exists.\n";
        return 1;
    }
    cout << "File opened!\n";    
    
    csv << "solver,board,depth,nodes,timeMs,cacheHits\n";

    int boardSizes[] = {3, 4, 5};
    int depths[] = {2, 4, 6, 8};
    int maxDepthForBF = 4;
    int maxBoardForBF = 3;

    for(int n : boardSizes){
        for(int d : depths ){
            cout << "Running N=" << n << " D=" << d << "...\n";

            if (n <= maxBoardForBF && d <= maxDepthForBF) {
                GameState bfState(n, n);
                BruteForceSolver bf(d);
                bf.resetMetrics();
                bf.getBestMove(bfState);
                Metrics bfm = bf.getMetrics();
                csv << "BruteForce," << n << "," << d << "," << bfm.nodesExplored << "," << bfm.timeMs << "," << bfm.cacheHits << "\n";
            } else {
                csv << "BruteForce," << n << "," << d << ",TIMEOUT,TIMEOUT,0\n";
            }

            if (n == 5 && d == 8) {
                csv << "DP,5,8,TIMEOUT,TIMEOUT,0\n";
            } else {
                GameState dpState(n, n);
                DPSolver dp(d);
                dp.resetMetrics();
                dp.getBestMove(dpState);
                Metrics dpm = dp.getMetrics();
                csv << "DP," << n << "," << d << "," << dpm.nodesExplored << "," << dpm.timeMs << "," << dpm.cacheHits << "\n";
            }
        }
    }
    
    csv.close();
    cout << "Done! Results saved to results/data.csv\n";
    return 0;
}