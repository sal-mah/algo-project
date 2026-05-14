#include "../include/Cache.h"

// Looks up a board key and returns the stored score, or nullopt on a miss.
std::optional<int> Cache::get(const std::string& key) const {
    auto it = table.find(key);
    if (it != table.end()) {
        return it->second;   // cache hit — return stored score
    }
    return std::nullopt;     // cache miss
}

// Stores a newly computed minimax score for the given board key.
void Cache::set(const std::string& key, int score) {
    table[key] = score;
}

// Removes all entries — must be called between benchmark runs.
void Cache::clear() {
    table.clear();
}

// Returns the number of unique board states currently stored.
int Cache::size() const {
    return static_cast<int>(table.size());
}
