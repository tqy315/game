/* ===== puzzle.js — 拼图引擎、洗牌算法、逆序数判断、BFS 提示 ===== */

class PuzzleEngine {
  /**
   * @param {number} size - 网格尺寸 (3, 4, 5)
   * @param {string} themeId - 主题ID
   */
  constructor(size, themeId) {
    this.size = size;
    this.N = size * size;
    this.themeId = themeId;
    this.state = [];       // 一维数组，state[i] = 该位置的图块编号（0 表示空格）
    this.goalState = [];   // 目标状态 [1,2,...,N-1,0]
    this.emptyIndex = 0;   // 空格位置
    this.moves = [];       // 移动历史
  }

  /** 初始化目标状态 */
  initGoal() {
    this.goalState = [];
    for (let i = 1; i < this.N; i++) this.goalState.push(i);
    this.goalState.push(0);
  }

  /** 重置到目标状态 */
  reset() {
    this.initGoal();
    this.state = [...this.goalState];
    this.emptyIndex = this.N - 1;
    this.moves = [];
  }

  /**
   * Fisher-Yates 洗牌 + 逆序数校验，保证有解
   */
  shuffle() {
    // 从目标状态开始
    this.initGoal();
    const arr = [...this.goalState];

    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    // 逆序数判断是否可解
    if (!this.isSolvable(arr)) {
      this.makeSolvable(arr);
    }

    this.state = arr;
    this.emptyIndex = arr.indexOf(0);
    this.moves = [];
  }

  /**
   * 判断当前状态是否为目标状态
   */
  isSolved() {
    for (let i = 0; i < this.N; i++) {
      if (this.state[i] !== this.goalState[i]) return false;
    }
    return true;
  }

  /**
   * 通过逆序数判断给定数组是否有解
   * 原理：
   *   - 奇数宽度（3x3, 5x5）：逆序数为偶数时有解
   *   - 偶数宽度（4x4）：(逆序数 + 空格行号从底部算起) 为偶数时有解
   * @param {number[]} arr - 包含 0 的完整状态数组
   */
  isSolvable(arr) {
    const flat = arr.filter(v => v !== 0);
    const invCount = this.countInversions(flat);

    if (this.size % 2 === 1) {
      // 奇数宽度：逆序数为偶数即可解
      return invCount % 2 === 0;
    } else {
      // 偶数宽度：还需考虑空格位置
      const zeroIdx = arr.indexOf(0);
      const zeroRowFromBottom = this.size - Math.floor(zeroIdx / this.size);
      return (invCount + zeroRowFromBottom) % 2 === 0;
    }
  }

  /**
   * 计算逆序数
   */
  countInversions(arr) {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) count++;
      }
    }
    return count;
  }

  /**
   * 将无解的排列修正为有解：交换前两个非空格元素
   */
  makeSolvable(arr) {
    const nonZero = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== 0) nonZero.push(i);
    }
    // 交换前两个非零元素
    const i1 = nonZero[0], i2 = nonZero[1];
    [arr[i1], arr[i2]] = [arr[i2], arr[i1]];
  }

  /**
   * 获取空格的可移动方向
   * @returns {number[]} 可移动到的位置索引数组
   */
  getValidMoves() {
    const row = Math.floor(this.emptyIndex / this.size);
    const col = this.emptyIndex % this.size;
    const moves = [];

    if (row > 0) moves.push(this.emptyIndex - this.size);             // 上
    if (row < this.size - 1) moves.push(this.emptyIndex + this.size); // 下
    if (col > 0) moves.push(this.emptyIndex - 1);                     // 左
    if (col < this.size - 1) moves.push(this.emptyIndex + 1);         // 右

    return moves;
  }

  /**
   * 移动指定位置的图块到空格
   * @param {number} tileIndex - 要移动的图块索引
   * @returns {boolean} 是否成功
   */
  moveTile(tileIndex) {
    const validMoves = this.getValidMoves();
    if (!validMoves.includes(tileIndex)) return false;

    // 记录移动（图块编号 + 方向）
    const tileNum = this.state[tileIndex];
    const dir = this.getDirection(tileIndex);
    this.moves.push({ tile: tileNum, dir });

    // 交换
    [this.state[this.emptyIndex], this.state[tileIndex]] =
      [this.state[tileIndex], this.state[this.emptyIndex]];
    this.emptyIndex = tileIndex;

    return true;
  }

  /** 获取移动方向描述（图块向空格滑动的方向） */
  getDirection(fromIndex) {
    const diff = fromIndex - this.emptyIndex;
    if (diff === -this.size) return '下';  // tile在上方，向下滑入空格
    if (diff === this.size) return '上';   // tile在下方，向上滑入空格
    if (diff === -1) return '右';          // tile在左边，向右滑入空格
    if (diff === 1) return '左';           // tile在右边，向左滑入空格
    return '';
  }

  /**
   * BFS 求解器 — 从当前状态搜索到目标状态
   * @param {number} maxDepth - 最大搜索深度（默认 0 表示不限制）
   * @param {number} timeout - 超时时间（毫秒，默认 5000）
   * @returns {object|null} { moves: [{tile, dir}], states: [...] } 或 null
   */
  bfsSolve(maxDepth = 0, timeout = 5000) {
    const startTime = Date.now();
    const startState = [...this.state];
    const goalKey = this.goalState.join(',');

    // 已在目标状态
    if (startState.join(',') === goalKey) return { moves: [], states: [] };

    const visited = new Map();
    const queue = [];
    const startKey = startState.join(',');
    visited.set(startKey, null);  // null 表示根节点
    queue.push({ state: startState, key: startKey, depth: 0 });

    let head = 0;

    while (head < queue.length) {
      // 超时检查
      if (Date.now() - startTime > timeout) return null;

      // 深度限制
      if (maxDepth > 0 && queue[head].depth >= maxDepth) {
        head++;
        continue;
      }

      const current = queue[head];
      head++;

      const empty = current.state.indexOf(0);
      const row = Math.floor(empty / this.size);
      const col = empty % this.size;

      // 四个方向的邻居
      const neighbors = [];
      if (row > 0) neighbors.push(empty - this.size);           // 上
      if (row < this.size - 1) neighbors.push(empty + this.size); // 下
      if (col > 0) neighbors.push(empty - 1);                   // 左
      if (col < this.size - 1) neighbors.push(empty + 1);       // 右

      for (const neighbor of neighbors) {
        const newState = [...current.state];
        [newState[empty], newState[neighbor]] = [newState[neighbor], newState[empty]];
        const newKey = newState.join(',');

        if (!visited.has(newKey)) {
          visited.set(newKey, { prevKey: current.key, movedTile: current.state[neighbor] });
          queue.push({ state: newState, key: newKey, depth: current.depth + 1 });

          if (newKey === goalKey) {
            // 找到目标，回溯路径
            return this.reconstructPath(visited, goalKey);
          }
        }
      }
    }

    return null; // 未找到
  }

  /** 回溯 BFS 访问记录，重建移动路径 */
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

  /**
   * 获取提示：返回下一步应该移动哪个图块
   * @returns {object|null} { tileIndex, tileNum, direction }
   */
  getHint() {
    // 3x3 用完整 BFS
    if (this.size === 3) {
      const result = this.bfsSolve(0, 3000);
      if (result && result.moves.length > 0) {
        const nextMove = result.moves[0];
        const tileIndex = this.state.indexOf(nextMove.tile);
        return {
          tileIndex,
          tileNum: nextMove.tile,
          direction: this.getDirectionForTile(tileIndex),
          totalSteps: result.length,
        };
      }
      return null;
    }

    // 4x4 / 5x5：BFS 带深度限制
    const maxDepth = this.size === 4 ? 18 : 12;
    const timeout = this.size === 4 ? 4000 : 3000;
    const result = this.bfsSolve(maxDepth, timeout);

    if (result && result.moves.length > 0) {
      const nextMove = result.moves[0];
      const tileIndex = this.state.indexOf(nextMove.tile);
      return {
        tileIndex,
        tileNum: nextMove.tile,
        direction: this.getDirectionForTile(tileIndex),
        totalSteps: result.length,
      };
    }

    // BFS 未找到，使用贪心策略（最小化曼哈顿距离）
    return this.getGreedyHint();
  }

  /** 贪心提示：选择最能减少曼哈顿距离的移动 */
  getGreedyHint() {
    const validMoves = this.getValidMoves();
    let bestMove = null;
    let bestHeuristic = Infinity;

    for (const move of validMoves) {
      // 模拟移动
      [this.state[this.emptyIndex], this.state[move]] =
        [this.state[move], this.state[this.emptyIndex]];
      const origEmpty = this.emptyIndex;
      this.emptyIndex = move;

      const h = this.manhattanDistance();

      // 恢复
      this.emptyIndex = origEmpty;
      [this.state[this.emptyIndex], this.state[move]] =
        [this.state[move], this.state[this.emptyIndex]];

      if (h < bestHeuristic) {
        bestHeuristic = h;
        bestMove = move;
      }
    }

    if (bestMove !== null) {
      return {
        tileIndex: bestMove,
        tileNum: this.state[bestMove],
        direction: this.getDirectionForTile(bestMove),
        totalSteps: null,
      };
    }
    return null;
  }

  /** 曼哈顿距离启发值 */
  manhattanDistance() {
    let dist = 0;
    for (let i = 0; i < this.N; i++) {
      const val = this.state[i];
      if (val === 0) continue;
      // 在目标状态中，值 val 应在位置 val-1（0-indexed）
      const goalRow = Math.floor((val - 1) / this.size);
      const goalCol = (val - 1) % this.size;
      const curRow = Math.floor(i / this.size);
      const curCol = i % this.size;
      dist += Math.abs(goalRow - curRow) + Math.abs(goalCol - curCol);
    }
    return dist;
  }

  /** 获取图块移动方向（图块向空格滑动的方向） */
  getDirectionForTile(tileIndex) {
    const diff = tileIndex - this.emptyIndex;
    if (diff === -this.size) return '下';  // tile在上方，向下滑入空格
    if (diff === this.size) return '上';   // tile在下方，向上滑入空格
    if (diff === -1) return '右';          // tile在左边，向右滑入空格
    if (diff === 1) return '左';           // tile在右边，向左滑入空格
    return '';
  }

  /** 获取图块在第几行第几列 */
  getRowCol(index) {
    return { row: Math.floor(index / this.size), col: index % this.size };
  }
}
