/* ===== puzzle.js — 拼图引擎、洗牌算法、逆序数判断、BFS 提示 ===== */

class PuzzleEngine {
  constructor(size, themeId) {
    this.size = size;
    this.N = size * size;
    this.themeId = themeId;
    this.state = [];
    this.goalState = [];
    this.emptyIndex = 0;
    this.moves = [];
  }

  initGoal() {
    this.goalState = [];
    for (let i = 1; i < this.N; i++) this.goalState.push(i);
    this.goalState.push(0);
  }

  reset() {
    this.initGoal();
    this.state = [...this.goalState];
    this.emptyIndex = this.N - 1;
    this.moves = [];
  }

  shuffle() {
    this.initGoal();
    const arr = [...this.goalState];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (!this.isSolvable(arr)) {
      this.makeSolvable(arr);
    }
    this.state = arr;
    this.emptyIndex = arr.indexOf(0);
    this.moves = [];
  }

  isSolved() {
    for (let i = 0; i < this.N; i++) {
      if (this.state[i] !== this.goalState[i]) return false;
    }
    return true;
  }

  isSolvable(arr) {
    const flat = arr.filter(v => v !== 0);
    const invCount = this.countInversions(flat);
    if (this.size % 2 === 1) {
      return invCount % 2 === 0;
    } else {
      const zeroIdx = arr.indexOf(0);
      const zeroRowFromBottom = this.size - Math.floor(zeroIdx / this.size);
      return (invCount + zeroRowFromBottom) % 2 === 0;
    }
  }

  countInversions(arr) {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) count++;
      }
    }
    return count;
  }

  makeSolvable(arr) {
    const nonZero = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== 0) nonZero.push(i);
    }
    const i1 = nonZero[0], i2 = nonZero[1];
    [arr[i1], arr[i2]] = [arr[i2], arr[i1]];
  }

  getValidMoves() {
    const row = Math.floor(this.emptyIndex / this.size);
    const col = this.emptyIndex % this.size;
    const moves = [];
    if (row > 0) moves.push(this.emptyIndex - this.size);
    if (row < this.size - 1) moves.push(this.emptyIndex + this.size);
    if (col > 0) moves.push(this.emptyIndex - 1);
    if (col < this.size - 1) moves.push(this.emptyIndex + 1);
    return moves;
  }

  moveTile(tileIndex) {
    const validMoves = this.getValidMoves();
    if (!validMoves.includes(tileIndex)) return false;
    const tileNum = this.state[tileIndex];
    const dir = this.getDirection(tileIndex);
    this.moves.push({ tile: tileNum, dir });
    [this.state[this.emptyIndex], this.state[tileIndex]] =
      [this.state[tileIndex], this.state[this.emptyIndex]];
    this.emptyIndex = tileIndex;
    return true;
  }

  getDirection(fromIndex) {
    const diff = fromIndex - this.emptyIndex;
    if (diff === -this.size) return '下';
    if (diff === this.size) return '上';
    if (diff === -1) return '右';
    if (diff === 1) return '左';
    return '';
  }

  bfsSolve(maxDepth = 0, timeout = 5000) {
    const startTime = Date.now();
    const startState = [...this.state];
    const goalKey = this.goalState.join(',');
    if (startState.join(',') === goalKey) return { moves: [], states: [] };
    const visited = new Map();
    const queue = [];
    const startKey = startState.join(',');
    visited.set(startKey, null);
    queue.push({ state: startState, key: startKey, depth: 0 });
    let head = 0;
    while (head < queue.length) {
      if (Date.now() - startTime > timeout) return null;
      if (maxDepth > 0 && queue[head].depth >= maxDepth) { head++; continue; }
      const current = queue[head];
      head++;
      const empty = current.state.indexOf(0);
      const row = Math.floor(empty / this.size);
      const col = empty % this.size;
      const neighbors = [];
      if (row > 0) neighbors.push(empty - this.size);
      if (row < this.size - 1) neighbors.push(empty + this.size);
      if (col > 0) neighbors.push(empty - 1);
      if (col < this.size - 1) neighbors.push(empty + 1);
      for (const neighbor of neighbors) {
        const newState = [...current.state];
        [newState[empty], newState[neighbor]] = [newState[neighbor], newState[empty]];
        const newKey = newState.join(',');
        if (!visited.has(newKey)) {
          visited.set(newKey, { prevKey: current.key, movedTile: current.state[neighbor] });
          queue.push({ state: newState, key: newKey, depth: current.depth + 1 });
          if (newKey === goalKey) return this.reconstructPath(visited, goalKey);
        }
      }
    }
    return null;
  }

  reconstructPath(visited, goalKey) {
    const path = [];
    let key = goalKey;
    while (visited.get(key) !== null) {
      const info = visited.get(key);
      path.unshift({ tile: info.movedTile, fromKey: info.prevKey });
      key = info.prevKey;
    }
    return { moves: path, length: path.length };
  }

  getHint() {
    if (this.size === 3) {
      const result = this.bfsSolve(0, 3000);
      if (result && result.moves.length > 0) {
        const nextMove = result.moves[0];
        const tileIndex = this.state.indexOf(nextMove.tile);
        return { tileIndex, tileNum: nextMove.tile, direction: this.getDirectionForTile(tileIndex), totalSteps: result.length };
      }
      return null;
    }
    const maxDepth = this.size === 4 ? 18 : 12;
    const timeout = this.size === 4 ? 4000 : 3000;
    const result = this.bfsSolve(maxDepth, timeout);
    if (result && result.moves.length > 0) {
      const nextMove = result.moves[0];
      const tileIndex = this.state.indexOf(nextMove.tile);
      return { tileIndex, tileNum: nextMove.tile, direction: this.getDirectionForTile(tileIndex), totalSteps: result.length };
    }
    return this.getGreedyHint();
  }

  getGreedyHint() {
    const validMoves = this.getValidMoves();
    let bestMove = null, bestHeuristic = Infinity;
    for (const move of validMoves) {
      [this.state[this.emptyIndex], this.state[move]] = [this.state[move], this.state[this.emptyIndex]];
      const origEmpty = this.emptyIndex;
      this.emptyIndex = move;
      const h = this.manhattanDistance();
      this.emptyIndex = origEmpty;
      [this.state[this.emptyIndex], this.state[move]] = [this.state[move], this.state[this.emptyIndex]];
      if (h < bestHeuristic) { bestHeuristic = h; bestMove = move; }
    }
    if (bestMove !== null) {
      return { tileIndex: bestMove, tileNum: this.state[bestMove], direction: this.getDirectionForTile(bestMove), totalSteps: null };
    }
    return null;
  }

  manhattanDistance() {
    let dist = 0;
    for (let i = 0; i < this.N; i++) {
      const val = this.state[i];
      if (val === 0) continue;
      const goalRow = Math.floor((val - 1) / this.size);
      const goalCol = (val - 1) % this.size;
      const curRow = Math.floor(i / this.size);
      const curCol = i % this.size;
      dist += Math.abs(goalRow - curRow) + Math.abs(goalCol - curCol);
    }
    return dist;
  }

  getDirectionForTile(tileIndex) {
    const diff = tileIndex - this.emptyIndex;
    if (diff === -this.size) return '下';
    if (diff === this.size) return '上';
    if (diff === -1) return '右';
    if (diff === 1) return '左';
    return '';
  }

  getRowCol(index) {
    return { row: Math.floor(index / this.size), col: index % this.size };
  }
}
