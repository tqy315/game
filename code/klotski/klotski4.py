
import random
import heapq
from copy import deepcopy

# ==================== 4x4 常量 ====================
GOAL4 = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 0]
]

# ==================== 随机可解布局（4x4） ====================
def random_solvable_board(moves=300):
    """生成一个随机且可解的 4x4 初始布局"""
    board = [row[:] for row in GOAL4]
    blank_r, blank_c = 3, 3
    dirs = [(-1,0), (1,0), (0,-1), (0,1)]
    for _ in range(moves):
        random.shuffle(dirs)
        for dr, dc in dirs:
            r, c = blank_r + dr, blank_c + dc
            if 0 <= r < 4 and 0 <= c < 4:
                board[blank_r][blank_c], board[r][c] = board[r][c], board[blank_r][blank_c]
                blank_r, blank_c = r, c
                break
    return board

# ==================== 可解性校验（4x4） ====================
def is_solvable(board):
    """判断 4x4 布局是否可解"""
    flat = [num for row in board for num in row if num != 0]
    inversions = 0
    for i in range(len(flat)):
        for j in range(i+1, len(flat)):
            if flat[i] > flat[j]:
                inversions += 1
    blank_row = None
    for i in range(4):
        if 0 in board[i]:
            blank_row = i
            break
    return (inversions % 2) == ((4 - blank_row) % 2)

# ==================== A* 提示算法（4x4） ====================
def _get_zero_pos(board):
    for i in range(4):
        for j in range(4):
            if board[i][j] == 0:
                return i, j
    return -1, -1

def _manhattan_distance(board):
    dist = 0
    for i in range(4):
        for j in range(4):
            val = board[i][j]
            if val == 0:
                continue
            target_i = (val - 1) // 4
            target_j = (val - 1) % 4
            dist += abs(i - target_i) + abs(j - target_j)
    return dist

def _linear_conflict(board):
    conflict = 0
    # 行冲突
    for i in range(4):
        row_vals = []
        for j in range(4):
            val = board[i][j]
            if val != 0 and (val - 1) // 4 == i:
                row_vals.append(val)
        for a in range(len(row_vals)):
            for b in range(a+1, len(row_vals)):
                if row_vals[a] > row_vals[b]:
                    conflict += 2
    # 列冲突
    for j in range(4):
        col_vals = []
        for i in range(4):
            val = board[i][j]
            if val != 0 and (val - 1) % 4 == j:
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
    for di, dj in [(-1,0),(1,0),(0,-1),(0,1)]:
        ni, nj = zero_i + di, zero_j + dj
        if 0 <= ni < 4 and 0 <= nj < 4:
            new_board = deepcopy(board)
            new_board[zero_i][zero_j], new_board[ni][nj] = new_board[ni][nj], new_board[zero_i][zero_j]
            move_num = new_board[zero_i][zero_j]
            neighbors.append((new_board, move_num))
    return neighbors

def _serialize(board):
    return tuple(num for row in board for num in row)

def _astar_shortest_path(start_board):
    if start_board == GOAL4:
        return []
    start_key = _serialize(start_board)
    g_score = {start_key: 0}
    heap = [(_heuristic(start_board), 0, start_board, [])]
    while heap:
        f, g, board, path = heapq.heappop(heap)
        if board == GOAL4:
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
    """返回下一步应该移动的数字（最优提示），如果已经胜利或无解则返回 None"""
    path = _astar_shortest_path(board)
    return path[0] if path else None

# ==================== 可选：暴露 3x3 版本 ====================
# 如果你需要提供 3x3，可以用类似的方式封装，但后端如果只需要 4x4，可以不暴露