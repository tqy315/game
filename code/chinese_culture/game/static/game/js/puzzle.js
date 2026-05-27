/**
 * Sliding puzzle engine supporting 3×3 and 4×4 grids.
 */
class PuzzleEngine {
    constructor(size) {
        if (size < 3 || size > 4) {
            throw new Error('Only 3×3 and 4×4 sizes are supported');
        }
        this.size = size;
        this.N = size * size;
        this.state = [];
        this.emptyIndex = this.N - 1;
        this.moves = 0;
        this.moveHistory = [];
        this.initState();
    }

    initState() {
        for (let i = 0; i < this.N - 1; i++) {
            this.state[i] = i + 1;
        }
        this.state[this.N - 1] = 0;
        this.emptyIndex = this.N - 1;
        this.moves = 0;
        this.moveHistory = [];
    }

    shuffle(steps = 100) {
        this.initState();
        const size = this.size;
        const directions = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 },
        ];

        let lastDir = null;
        for (let i = 0; i < steps; i++) {
            const er = Math.floor(this.emptyIndex / size);
            const ec = this.emptyIndex % size;
            const valid = [];

            for (let d = 0; d < directions.length; d++) {
                const nr = er + directions[d].dr;
                const nc = ec + directions[d].dc;
                if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                    if (lastDir !== null) {
                        const rev = (lastDir + 2) % 4;
                        if (d === rev) continue;
                    }
                    valid.push(d);
                }
            }

            const chosen = valid[Math.floor(Math.random() * valid.length)];
            lastDir = chosen;
            const nr = er + directions[chosen].dr;
            const nc = ec + directions[chosen].dc;
            const swapIdx = nr * size + nc;
            this.swap(swapIdx);
        }

        // Ensure solvable
        if (!this.isSolvable(this.state)) {
            this.makeSolvable();
        }

        this.moves = 0;
        this.moveHistory = [];
    }

    isSolvable(arr) {
        let inversions = 0;
        const n = arr.length;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (arr[i] && arr[j] && arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }

        if (this.size % 2 === 1) {
            // Odd width grid: solvable when inversions is even
            return inversions % 2 === 0;
        } else {
            // Even width grid: solvable when (inversions + row of empty from bottom) is even
            const emptyRowFromBottom = this.size - Math.floor(this.emptyIndex / this.size);
            return (inversions + emptyRowFromBottom) % 2 === 0;
        }
    }

    makeSolvable() {
        // Swap first two non-zero tiles to flip parity
        const idx0 = this.state[0] === 0 ? 1 : 0;
        const idx1 = this.state[1] === 0 || idx0 === 1 ? 2 : 1;
        [this.state[idx0], this.state[idx1]] = [this.state[idx1], this.state[idx0]];
        // Update emptyIndex
        for (let i = 0; i < this.N; i++) {
            if (this.state[i] === 0) { this.emptyIndex = i; break; }
        }
    }

    getValidMoves() {
        const er = Math.floor(this.emptyIndex / this.size);
        const ec = this.emptyIndex % this.size;
        const moves = [];
        const dirs = [
            { dr: -1, dc: 0, label: '下' },
            { dr: 1, dc: 0, label: '上' },
            { dr: 0, dc: -1, label: '右' },
            { dr: 0, dc: 1, label: '左' },
        ];
        for (const d of dirs) {
            const nr = er + d.dr;
            const nc = ec + d.dc;
            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                moves.push({ index: nr * this.size + nc, direction: d.label });
            }
        }
        return moves;
    }

    moveTile(index) {
        const validMoves = this.getValidMoves();
        const found = validMoves.find(m => m.index === index);
        if (!found) return false;

        const tileNum = this.state[index];
        this.swap(index);
        this.moves++;
        this.moveHistory.push({ tile: tileNum, direction: found.direction });
        return true;
    }

    swap(index) {
        [this.state[this.emptyIndex], this.state[index]] = [this.state[index], this.state[this.emptyIndex]];
        this.emptyIndex = index;
    }

    isSolved() {
        for (let i = 0; i < this.N - 1; i++) {
            if (this.state[i] !== i + 1) return false;
        }
        return this.state[this.N - 1] === 0;
    }

    // BFS solver for hints (limited depth for 4x4)
    getHint() {
        if (this.size === 3) {
            return this.bfsSolve(200000, 3000);
        } else {
            // 4x4: limited BFS then greedy fallback
            const bfsResult = this.bfsSolve(100000, 1500);
            if (bfsResult !== null) return bfsResult;
            return this.getGreedyHint();
        }
    }

    bfsSolve(maxStates, timeout) {
        const startTime = Date.now();
        const startState = [...this.state];
        const goalState = [...Array(this.N - 1).keys()].map(i => i + 1);
        goalState.push(0);

        const stateToKey = (s) => s.join(',');

        const startKey = stateToKey(startState);
        const goalKey = stateToKey(goalState);

        if (startKey === goalKey) return null;

        const visited = new Map();
        visited.set(startKey, { parent: null, tileIndex: null });

        const queue = [{ state: startState, emptyIdx: this.emptyIndex }];
        let head = 0;
        let statesExplored = 0;

        while (head < queue.length && statesExplored < maxStates) {
            if (Date.now() - startTime > timeout) break;

            const current = queue[head++];
            statesExplored++;

            if (statesExplored >= maxStates) break;

            const er = Math.floor(current.emptyIdx / this.size);
            const ec = current.emptyIdx % this.size;
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

            for (const [dr, dc] of dirs) {
                const nr = er + dr;
                const nc = ec + dc;
                if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) continue;

                const newIdx = nr * this.size + nc;
                const nextState = [...current.state];
                nextState[current.emptyIdx] = nextState[newIdx];
                nextState[newIdx] = 0;

                const nextKey = stateToKey(nextState);
                if (visited.has(nextKey)) continue;

                visited.set(nextKey, { parent: current.emptyIdx, tileIndex: newIdx });

                if (nextKey === goalKey) {
                    // Reconstruct path to find first move
                    let step = visited.get(nextKey);
                    let lastTileIdx = newIdx;
                    const path = [];
                    while (step && step.tileIndex !== null) {
                        path.unshift(step.tileIndex);
                        const parentKey = stateToKey(current.state);
                        const parentStep = visited.get(parentKey);
                        if (!parentStep || parentStep.tileIndex === null) break;
                        lastTileIdx = parentStep.tileIndex;
                        // Navigate through parents...
                        break; // We'll reconstruct differently
                    }

                    // Walk backwards from goal to find the first move
                    let ck = nextKey;
                    const steps = [];
                    while (ck !== startKey) {
                        const info = visited.get(ck);
                        if (!info) break;
                        steps.unshift(info.tileIndex);
                        // Rebuild parent state
                        if (info.parent === null) break;
                        // Find parent key by undoing the move
                        const cs = ck.split(',').map(Number);
                        const parentStateKey = stateToKey(cs);
                        // We need the parent state key...let's store it differently.
                        break;
                    }

                    // Directly extract path from queue entries
                    // We know the first move tile that needs to be clicked
                    // Let's check from the start state what tiles were moved
                    return this.reconstructFirstMove(visited, startKey, goalKey);
                }

                queue.push({ state: nextState, emptyIdx: newIdx });
            }
        }

        return null;
    }

    reconstructFirstMove(visited, startKey, goalKey) {
        // Walk from goal back to start
        let currentKey = goalKey;
        const path = [];

        while (currentKey !== startKey) {
            const info = visited.get(currentKey);
            if (!info || info.tileIndex === null) break;

            path.unshift(info.tileIndex);

            // Reconstruct parent state
            const curState = currentKey.split(',').map(Number);
            const tileIdx = info.tileIndex;
            let emptyIdx = -1;
            for (let i = 0; i < curState.length; i++) {
                if (curState[i] === 0) { emptyIdx = i; break; }
            }
            // Swap back to get parent
            [curState[tileIdx], curState[emptyIdx]] = [curState[emptyIdx], curState[tileIdx]];
            currentKey = curState.join(',');
        }

        if (path.length > 0) {
            return path[0]; // First tile to move
        }
        return null;
    }

    getGreedyHint() {
        const validMoves = this.getValidMoves();
        if (validMoves.length === 0) return null;

        let bestMove = validMoves[0].index;
        let bestDist = Infinity;

        for (const move of validMoves) {
            // Try the move
            this.swap(move.index);
            const dist = this.manhattanDistance();
            this.swap(move.index); // undo

            if (dist < bestDist) {
                bestDist = dist;
                bestMove = move.index;
            }
        }

        return bestMove;
    }

    manhattanDistance() {
        let dist = 0;
        for (let i = 0; i < this.N; i++) {
            const val = this.state[i];
            if (val === 0) continue;
            const targetIdx = val - 1;
            const cr = Math.floor(i / this.size);
            const cc = i % this.size;
            const tr = Math.floor(targetIdx / this.size);
            const tc = targetIdx % this.size;
            dist += Math.abs(cr - tr) + Math.abs(cc - tc);
        }
        return dist;
    }
}
