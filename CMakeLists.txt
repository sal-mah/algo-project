cmake_minimum_required(VERSION 3.20)

project(AlgoProject)

set(CMAKE_CXX_STANDARD 17)

include_directories(include)

add_executable(AlgoProject
        benchmark/run_benchmark.cpp

        src/GameState.cpp
        src/BruteForceSolver.cpp
        src/DPSolver.cpp

        src/Board.cpp
        src/Cache.cpp
)