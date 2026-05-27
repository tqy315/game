"""
华容道算法模块 (3x3)
提供：随机可解布局、可解性校验、最优提示（下一步）
"""

import random
import heapq
from copy import deepcopy

# ==================== 3x3 常量 ====================
GOAL3 = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 0]
]

# ==================== 随机可解布局（3x3） ====================
def random_solvable_board(moves=200):
    """
    生成一个随机且可解的 3x3 初始布局。
    :param moves: 随机移动次数，默认200
    :return: 3x3 二维列表，0 代表空格
    """
    board = [row[:] for row in GOAL3]
    blank_r, blank_c = 2, 2          # 目标状态空格在右下角
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    for _ in range(moves):
        random.shuffle(dirs)
        for dr, dc in dirs:
            r, c = blank_r + dr, blank_c + dc
            if 0 <= r < 3 and 0 <= c < 3:
                board[blank_r][blank_c], board[r][c] = board[r][c], board[blank_r][blank_c]
                blank_r, blank_c = r, c
                break
    return board

# ==================== 可解性校验（3x3） ====================
def is_solvable(board):
    """
    判断 3x3 华容道布局是否可解。
    8数码问题判定规则：展开成一维（忽略0），逆序数为偶数则可解。
    :param board: 3x3 列表，0 代表空格
    :return: True 可解，False 不可解
    """
    flat = [num for row in board for num in row if num != 0]
    inversions = 0
    n = len(flat)   # n = 8
    for i in range(n):
        for j in range(i + 1, n):
            if flat[i] > flat[j]:
                inversions += 1
    return inversions % 2 == 0

# ==================== A* 提示算法（3x3） ====================
def _get_zero_pos(board):
    for i in range(3):
        for j in range(3):
            if board[i][j] == 0:
                return i, j
    return -1, -1

def _manhattan_distance(board):
    dist = 0
    for i in range(3):
        for j in range(3):
            val = board[i][j]
            if val == 0:
                continue
            target_i = (val - 1) // 3
            target_j = (val - 1) % 3
            dist += abs(i - target_i) + abs(j - target_j)
    return dist

def _linear_conflict(board):
    """线性冲突（对3x3同样有效）"""
    conflict = 0
    # 行冲突
    for i in range(3):
        row_vals = []
        for j in range(3):
            val = board[i][j]
            if val != 0 and (val - 1) // 3 == i:
                row_vals.append(val)
        for a in range(len(row_vals)):
            for b in range(a+1, len(row_vals)):
                if row_vals[a] > row_vals[b]:
                    conflict += 2
    # 列冲突
    for j in range(3):
        col_vals = []
        for i in range(3):
            val = board[i][j]
            if val != 0 and (val - 1) % 3 == j:
                col_vals.append(val)
        for a in range(len(col_vals)):
            for b in range(a+1, len(col_vals)):
                if col_vals[a] > col_vals[b]:
                    conflict += 2
    return conflict

def _heuristic(board):
    return _manhattan_distance(board) + _linear_conflict(board)

def _get_neighbors(board):
    zero_i, zero_j = _get_zero_pos(board)
    neighbors = []
    for di, dj in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        ni, nj = zero_i + di, zero_j + dj
        if 0 <= ni < 3 and 0 <= nj < 3:
            new_board = deepcopy(board)
            new_board[zero_i][zero_j], new_board[ni][nj] = new_board[ni][nj], new_board[zero_i][zero_j]
            move_num = new_board[zero_i][zero_j]
            neighbors.append((new_board, move_num))
    return neighbors

def _serialize(board):
    return tuple(num for row in board for num in row)

def _astar_shortest_path(start_board):
    if start_board == GOAL3:
        return []
    start_key = _serialize(start_board)
    g_score = {start_key: 0}
    heap = [(_heuristic(start_board), 0, start_board, [])]
    while heap:
        f, g, board, path = heapq.heappop(heap)
        if board == GOAL3:
            return path
        cur_key = _serialize(board)
        if g > g_score.get(cur_key, float('inf')):
            continue
        for neighbor, move_num in _get_neighbors(board):
            nb_key = _serialize(neighbor)
            new_g = g + 1
            if new_g < g_score.get(nb_key, float('inf')):
                g_score[nb_key] = new_g
                new_f = new_g + _heuristic(neighbor)
                heapq.heappush(heap, (new_f, new_g, neighbor, path + [move_num]))
    return None

def get_hint(board):
    """
    返回下一步应该移动的数字（最优提示）。
    如果已经胜利或无法求解，返回 None。
    """
    path = _astar_shortest_path(board)
    return path[0] if path else None

# ==================== 使用示例 ====================
if __name__ == "__main__":
    # 生成随机可解布局
    board = random_solvable_board()
    print("初始棋盘：")
    for row in board:
        print(row)
    print("是否可解：", is_solvable(board))
    hint = get_hint(board)
    print("提示移动数字：", hint)