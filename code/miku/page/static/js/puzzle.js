/* ===== puzzle.js — BFS 拼图引擎 ===== */

class PuzzleEngine {
  constructor(size) {
    this.size = size || 3;
    this.N = this.size * this.size;
    this.state = [];
    this.emptyIndex = this.N - 1;
    this.moves = [];
    this.solutionPath = [];
    this.reset();
  }

  reset() {
    this.state = [];
    for (var i = 0; i < this.N; i++) {
      this.state[i] = i + 1;
    }
    this.state[this.N - 1] = 0;
    this.emptyIndex = this.N - 1;
    this.moves = [];
  }

  shuffle() {
    this.reset();
    var n = this.N;
    for (var i = n - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = this.state[i];
      this.state[i] = this.state[j];
      this.state[j] = tmp;
    }
    for (var k = 0; k < n; k++) {
      if (this.state[k] === 0) {
        this.emptyIndex = k;
        break;
      }
    }
    if (!this.isSolvable()) {
      this.fixSolvability();
    }
    this.moves = [];
  }

  isEmptySolvable() {
    var inv = 0;
    var arr = [];
    for (var i = 0; i < this.N; i++) {
      if (this.state[i] !== 0) arr.push(this.state[i]);
    }
    for (var i = 0; i < arr.length; i++) {
      for (var j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) inv++;
      }
    }
    if (this.size % 2 === 1) {
      return inv % 2 === 0;
    } else {
      var emptyRow = Math.floor(this.emptyIndex / this.size);
      var bottomRow = this.size - 1;
      return (inv % 2 === 0) === ((bottomRow - emptyRow) % 2 === 0);
    }
  }

  fixSolvability() {
    if (this.isSolvable()) return;
    for (var i = 0; i < this.N; i++) {
      if (this.state[i] !== 0 && this.state[(i + 1) % this.N] !== 0) {
        var tmp = this.state[i];
        this.state[i] = this.state[(i + 1) % this.N];
        this.state[(i + 1) % this.N] = tmp;
        break;
      }
    }
    if (!this.isSolvable()) this.reset();
  }

  isSolved() {
    for (var i = 0; i < this.N - 1; i++) {
      if (this.state[i] !== i + 1) return false;
    }
    return this.state[this.N - 1] === 0;
  }

  getMovableTiles() {
    var empty = this.emptyIndex;
    var row = Math.floor(empty / this.size);
    var col = empty % this.size;
    var tiles = [];
    if (col > 0) tiles.push({ index: empty - 1, dir: '右' });
    if (col < this.size - 1) tiles.push({ index: empty + 1, dir: '左' });
    if (row > 0) tiles.push({ index: empty - this.size, dir: '下' });
    if (row < this.size - 1) tiles.push({ index: empty + this.size, dir: '上' });
    return tiles;
  }

  moveTile(tileIndex) {
    var movable = this.getMovableTiles();
    for (var i = 0; i < movable.length; i++) {
      if (movable[i].index === tileIndex) {
        this.state[this.emptyIndex] = this.state[tileIndex];
        this.state[tileIndex] = 0;
        this.moves.push({ tile: this.state[this.emptyIndex], dir: movable[i].dir });
        this.emptyIndex = tileIndex;
        return true;
      }
    }
    return false;
  }

  getHint() {
    var target = this.getTargetState();
    var startKey = this.stateToString(this.state);
    if (startKey === this.stateToString(target)) return null;

    var queue = [{ state: this.state.slice(), empty: this.emptyIndex, path: [] }];
    var visited = {};
    visited[startKey] = true;
    var maxDepth = this.size <= 3 ? 40 : 20;
    var head = 0;

    while (head < queue.length) {
      var node = queue[head++];
      if (node.path.length >= maxDepth) continue;

      var row = Math.floor(node.empty / this.size);
      var col = node.empty % this.size;
      var dirs = [];
      if (col > 0) dirs.push({ di: -1, dir: '右', label: 'r' });
      if (col < this.size - 1) dirs.push({ di: 1, dir: '左', label: 'l' });
      if (row > 0) dirs.push({ di: -this.size, dir: '下', label: 'd' });
      if (row < this.size - 1) dirs.push({ di: this.size, dir: '上', label: 'u' });

      for (var d = 0; d < dirs.length; d++) {
        var ni = node.empty + dirs[d].di;
        var newState = node.state.slice();
        newState[node.empty] = newState[ni];
        newState[ni] = 0;
        var key = this.stateToString(newState);

        if (!visited[key]) {
          visited[key] = true;
          var newPath = node.path.concat([{ index: ni, dir: dirs[d].dir, label: dirs[d].label }]);

          if (key === this.stateToString(target)) {
            var tileNum = this.state[ni];
            return {
              tileIndex: ni,
              tileNum: tileNum,
              direction: dirs[d].dir,
              totalSteps: newPath.length,
              path: newPath
            };
          }
          queue.push({ state: newState, empty: ni, path: newPath });
        }
      }
    }

    // BFS failed, try greedy
    var movable = this.getMovableTiles();
    if (movable.length > 0) {
      var best = movable[0];
      for (var m = 1; m < movable.length; m++) {
        var currDist = Math.abs(movable[m].index - (this.state[movable[m].index] - 1));
        var bestDist = Math.abs(best.index - (this.state[best.index] - 1));
        if (currDist < bestDist) best = movable[m];
      }
      return { tileIndex: best.index, tileNum: this.state[best.index], direction: best.dir, totalSteps: null, path: [] };
    }
    return null;
  }

  stateToString(state) {
    return state.join(',');
  }

  getTargetState() {
    var s = [];
    for (var i = 0; i < this.N - 1; i++) s.push(i + 1);
    s.push(0);
    return s;
  }
}
