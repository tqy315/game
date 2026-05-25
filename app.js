/* ===== app.js — 应用主逻辑、UI 控制、数据持久化 ===== */

/* ========== 存储管理 ========== */
const STORAGE_KEY = 'huarongdao_data';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultData();
  } catch {
    return getDefaultData();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDefaultData() {
  return {
    username: '',
    totalPoints: 0,
    earnedRewards: [],
    history: [],
    settings: {
      sound: true,
      animation: true,
      highlightHint: true,
    },
  };
}

/* ========== 全局状态 ========== */
let appData = loadData();
let currentTheme = THEMES[0];
let currentDifficulty = 3;
let puzzle = null;
let gameActive = false;
let timerInterval = null;
let gameStartTime = 0;
let gameElapsed = 0;
let hintsUsed = 0;
let themeImageDataUrl = ''; // 当前主题图片的 data URL
let hintHighlightTimeout = null;

/* ========== 初始化 ========== */
document.addEventListener('DOMContentLoaded', () => {
  initParticleBg();
  bindEvents();
  // 如果有已登录用户，直接进入菜单
  if (appData.username) {
    showScreen('menu-screen');
    updateMenuUI();
  } else {
    showScreen('login-screen');
  }
});

/* ========== 背景粒子 ========== */
function initParticleBg() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const maxParticles = 50;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height;
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = -10;
      this.size = Math.random() * 2 + 0.5;
      this.speed = Math.random() * 0.5 + 0.2;
      this.opacity = Math.random() * 0.4 + 0.1;
    }
    update() {
      this.y += this.speed;
      if (this.y > canvas.height + 10) this.reset();
    }
    draw() {
      ctx.fillStyle = `rgba(200,169,110,${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ========== 事件绑定 ========== */
function bindEvents() {
  // 登录
  document.getElementById('btn-login').addEventListener('click', handleLogin);
  document.getElementById('username').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  // 退出
  document.getElementById('btn-logout').addEventListener('click', handleLogout);

  // 菜单导航
  document.querySelectorAll('[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });

  // 开始游戏
  document.getElementById('btn-start').addEventListener('click', startGame);

  // 游戏内按钮
  document.getElementById('btn-back-menu').addEventListener('click', () => {
    stopGame();
    showScreen('menu-screen');
  });
  document.getElementById('btn-hint').addEventListener('click', showHint);
  document.getElementById('btn-shuffle').addEventListener('click', reshufflePuzzle);
  document.getElementById('btn-show-preview').addEventListener('click', togglePreview);

  // 完成界面
  document.getElementById('btn-next-puzzle').addEventListener('click', () => {
    startGame();
  });
  document.getElementById('btn-menu-from-complete').addEventListener('click', () => {
    showScreen('menu-screen');
  });

  // 返回菜单按钮
  document.getElementById('btn-back-from-history').addEventListener('click', () => {
    showScreen('menu-screen');
  });
  document.getElementById('btn-back-from-settings').addEventListener('click', () => {
    showScreen('menu-screen');
  });

  // 设置
  document.getElementById('setting-sound').addEventListener('change', function () {
    appData.settings.sound = this.checked;
    saveData(appData);
  });
  document.getElementById('setting-animation').addEventListener('change', function () {
    appData.settings.animation = this.checked;
    saveData(appData);
  });
  document.getElementById('setting-highlight-hint').addEventListener('change', function () {
    appData.settings.highlightHint = this.checked;
    saveData(appData);
  });
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
      localStorage.removeItem(STORAGE_KEY);
      appData = getDefaultData();
      saveData(appData);
      showScreen('login-screen');
      document.getElementById('username').value = '';
    }
  });
}

/* ========== 登录处理 ========== */
function handleLogin() {
  const input = document.getElementById('username');
  const username = input.value.trim();
  if (!username) {
    input.focus();
    input.style.borderColor = 'var(--red)';
    setTimeout(() => { input.style.borderColor = ''; }, 1000);
    return;
  }
  appData.username = username;
  saveData(appData);
  updateMenuUI();
  showScreen('menu-screen');
}

function handleLogout() {
  appData.username = '';
  saveData(appData);
  document.getElementById('username').value = '';
  showScreen('login-screen');
}

/* ========== 界面切换 ========== */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  // 切换到某些界面时刷新内容
  if (screenId === 'menu-screen') {
    updateMenuUI();
    renderThemeGrid();
    renderRewards();
  }
  if (screenId === 'history-screen') renderHistory();
  if (screenId === 'settings-screen') loadSettingsUI();
}

function updateMenuUI() {
  document.getElementById('nick-menu').textContent = appData.username;
  document.getElementById('points-menu').textContent = appData.totalPoints;
}

/* ========== 主题网格 ========== */
function renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';

  THEMES.forEach((theme, index) => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (theme.id === currentTheme.id ? ' selected' : '');
    card.dataset.themeId = theme.id;

    const canvas = generateThemeImage(theme.id, 200);
    const img = document.createElement('img');
    img.className = 'theme-preview';
    img.src = canvas.toDataURL();
    img.alt = theme.name;

    const name = document.createElement('div');
    name.className = 'theme-name';
    name.textContent = theme.name;

    const desc = document.createElement('div');
    desc.className = 'theme-desc';
    desc.textContent = theme.shortDesc;

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(desc);

    card.addEventListener('click', () => {
      currentTheme = theme;
      renderThemeGrid();
    });

    grid.appendChild(card);
  });
}

/* ========== 难度选择 ========== */
document.querySelectorAll('.diff-card input').forEach(input => {
  input.addEventListener('change', function () {
    if (this.checked) currentDifficulty = parseInt(this.value);
  });
});

/* ========== 奖励展示 ========== */
function renderRewards() {
  const row = document.getElementById('rewards-row');
  row.innerHTML = '';
  REWARDS.forEach(r => {
    const earned = appData.earnedRewards.includes(r.id);
    const div = document.createElement('div');
    div.className = 'reward-badge' + (earned ? ' earned' : ' locked');
    div.innerHTML = `
      <div class="badge-icon">${r.icon}</div>
      <div class="badge-name">${r.name}</div>
      <div class="badge-points">${earned ? '已获得' : r.points + ' 积分'}</div>
    `;
    row.appendChild(div);
  });
}

/* ========== 开始游戏 ========== */
function startGame() {
  stopGame();

  const size = currentDifficulty;
  const theme = currentTheme;

  puzzle = new PuzzleEngine(size, theme.id);
  puzzle.reset();
  puzzle.shuffle();

  // 生成主题图片并拆分为图块
  const imgCanvas = generateThemeImage(theme.id, 600);
  themeImageDataUrl = imgCanvas.toDataURL();

  // 设置游戏界面
  document.getElementById('game-theme-name').textContent = theme.name;
  document.getElementById('game-diff').textContent =
    `${size}×${size} · ${DIFFICULTIES[size].label}`;

  // 渲染拼图板
  renderBoard();

  // 渲染预览
  const previewCanvas = document.getElementById('preview-canvas');
  const previewCtx = previewCanvas.getContext('2d');
  previewCanvas.width = 150;
  previewCanvas.height = 150;
  const previewImg = new Image();
  previewImg.onload = () => {
    previewCtx.drawImage(previewImg, 0, 0, 150, 150);
  };
  previewImg.src = themeImageDataUrl;

  // 重置游戏状态
  gameActive = true;
  hintsUsed = 0;
  gameElapsed = 0;
  document.getElementById('game-timer').textContent = '00:00';
  document.getElementById('game-moves').textContent = '0';
  document.getElementById('game-hints-used').textContent = '0';
  document.getElementById('game-score-estimate').textContent = '—';
  document.getElementById('move-list').innerHTML = '';

  // 启动计时器
  gameStartTime = Date.now();
  timerInterval = setInterval(updateTimer, 200);

  showScreen('game-screen');
}

function stopGame() {
  gameActive = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (hintHighlightTimeout) {
    clearTimeout(hintHighlightTimeout);
    hintHighlightTimeout = null;
  }
}

/* ========== 渲染拼图板 ========== */
function renderBoard() {
  const board = document.getElementById('puzzle-board');
  board.innerHTML = '';
  board.className = 'puzzle-board size-' + puzzle.size;

  // 计算每个图块的尺寸（CSS会处理等分，这里只是设置）
  const img = new Image();
  img.onload = () => {
    const tileCount = puzzle.size;
    const imgW = img.width;
    const imgH = img.height;
    const tileW = imgW / tileCount;
    const tileH = imgH / tileCount;

    // 棋盘固定尺寸
    const boardSize = Math.min(480, window.innerWidth - 320);
    board.style.width = boardSize + 'px';
    board.style.height = boardSize + 'px';

    for (let i = 0; i < puzzle.N; i++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.index = i;

      const tileVal = puzzle.state[i];
      if (tileVal === 0) {
        tile.classList.add('empty');
      } else {
        // 计算该图块对应的原图区域
        const srcRow = Math.floor((tileVal - 1) / tileCount);
        const srcCol = (tileVal - 1) % tileCount;
        const bgX = (srcCol / tileCount) * 100;
        const bgY = (srcRow / tileCount) * 100;
        const bgSize = tileCount * 100;

        tile.style.backgroundImage = `url(${themeImageDataUrl})`;
        tile.style.backgroundSize = `${bgSize}% ${bgSize}%`;
        tile.style.backgroundPosition = `${bgX}% ${bgY}%`;

        // 图块编号标签（可关闭）
        const numLabel = document.createElement('span');
        numLabel.className = 'tile-num';
        numLabel.textContent = tileVal;
        tile.appendChild(numLabel);
      }

      tile.addEventListener('click', () => onTileClick(i));
      board.appendChild(tile);
    }
  };
  img.src = themeImageDataUrl;
}

/* ========== 图块点击处理 ========== */
function onTileClick(index) {
  if (!gameActive) return;
  if (puzzle.state[index] === 0) return;

  const moved = puzzle.moveTile(index);
  if (!moved) return;

  // 更新步数显示
  document.getElementById('game-moves').textContent = puzzle.moves.length;

  // 记录操作
  if (puzzle.moves.length > 0) {
    const lastMove = puzzle.moves[puzzle.moves.length - 1];
    addMoveRecord(lastMove);
  }

  // 重新渲染棋盘
  updateBoardTiles();

  // 更新预计得分
  updateScoreEstimate();

  // 检查是否完成
  if (puzzle.isSolved()) {
    onPuzzleComplete();
  }
}

function updateBoardTiles() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    const i = parseInt(tile.dataset.index);
    const val = puzzle.state[i];
    tile.classList.remove('empty');
    tile.style.backgroundImage = '';
    tile.style.backgroundSize = '';
    tile.style.backgroundPosition = '';
    // 移除旧编号
    const oldNum = tile.querySelector('.tile-num');
    if (oldNum) oldNum.remove();

    if (val === 0) {
      tile.classList.add('empty');
    } else {
      const tileCount = puzzle.size;
      const srcRow = Math.floor((val - 1) / tileCount);
      const srcCol = (val - 1) % tileCount;
      tile.style.backgroundImage = `url(${themeImageDataUrl})`;
      tile.style.backgroundSize = `${tileCount * 100}% ${tileCount * 100}%`;
      tile.style.backgroundPosition = `${(srcCol / tileCount) * 100}% ${(srcRow / tileCount) * 100}%`;

      const numLabel = document.createElement('span');
      numLabel.className = 'tile-num';
      numLabel.textContent = val;
      tile.appendChild(numLabel);
    }
  });
}

function addMoveRecord(move) {
  const list = document.getElementById('move-list');
  const span = document.createElement('span');
  span.textContent = `${move.tile}→${move.dir} `;
  span.style.marginRight = '6px';
  list.appendChild(span);
  list.scrollTop = list.scrollHeight;
}

/* ========== 计时器 ========== */
function updateTimer() {
  if (!gameActive) return;
  gameElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const min = Math.floor(gameElapsed / 60);
  const sec = gameElapsed % 60;
  document.getElementById('game-timer').textContent =
    String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  updateScoreEstimate();
}

/* ========== 得分估算 ========== */
function updateScoreEstimate() {
  const diff = DIFFICULTIES[currentDifficulty];
  let score = diff.basePoints;
  // 时间奖励
  const timeBonus = Math.max(0, (diff.timeLimit - gameElapsed) * (currentDifficulty * 0.5));
  score += Math.floor(timeBonus);
  // 步数奖励
  const moveBonus = Math.max(0, (diff.moveLimit - puzzle.moves.length) * 2);
  score += moveBonus;
  // 提示扣分
  score -= hintsUsed * 50;
  score = Math.max(score, 10);

  document.getElementById('game-score-estimate').textContent = Math.floor(score);
}

/* ========== 提示系统 ========== */
function showHint() {
  if (!gameActive) return;

  const hint = puzzle.getHint();
  hintsUsed++;
  document.getElementById('game-hints-used').textContent = hintsUsed;
  updateScoreEstimate();

  if (hint) {
    // 显示提示文字
    showHintOverlay(`移动 <strong>#${hint.tileNum}</strong> 号图块，方向：<strong>${hint.direction}</strong>${hint.totalSteps ? '（预计还需 ' + hint.totalSteps + ' 步）' : ''}`);

    // 高亮提示图块
    if (appData.settings.highlightHint) {
      highlightTile(hint.tileIndex);
    }
  } else {
    showHintOverlay('提示系统暂时无法找到解法，请尝试自由移动！');
  }
}

function showHintOverlay(text) {
  const overlay = document.getElementById('hint-overlay');
  document.getElementById('hint-text').innerHTML = text;
  overlay.classList.add('show');
  setTimeout(() => { overlay.classList.remove('show'); }, 2500);
}

function highlightTile(tileIndex) {
  // 清除之前的高亮
  document.querySelectorAll('.tile.hint-highlight').forEach(t => t.classList.remove('hint-highlight'));

  const tile = document.querySelector(`.tile[data-index="${tileIndex}"]`);
  if (tile && !tile.classList.contains('empty')) {
    tile.classList.add('hint-highlight');
    if (hintHighlightTimeout) clearTimeout(hintHighlightTimeout);
    hintHighlightTimeout = setTimeout(() => {
      tile.classList.remove('hint-highlight');
    }, 3000);
  }
}

/* ========== 重新洗牌 ========== */
function reshufflePuzzle() {
  if (!gameActive) return;
  puzzle.shuffle();
  hintsUsed = 0;
  document.getElementById('game-hints-used').textContent = '0';
  document.getElementById('game-moves').textContent = '0';
  document.getElementById('move-list').innerHTML = '';
  updateBoardTiles();
  updateScoreEstimate();
}

/* ========== 查看原图 ========== */
function togglePreview() {
  // 在原预览区域短暂放大显示
  const preview = document.getElementById('preview-mini');
  preview.style.transform = preview.style.transform ? '' : 'scale(1.5)';
  preview.style.transition = 'transform 0.3s ease';
  preview.style.zIndex = preview.style.zIndex ? '' : '50';
  if (preview.style.transform) {
    setTimeout(() => {
      preview.style.transform = '';
      preview.style.zIndex = '';
    }, 2000);
  }
}

/* ========== 完成拼图 ========== */
function onPuzzleComplete() {
  stopGame();

  // 计算得分
  const diff = DIFFICULTIES[currentDifficulty];
  let score = diff.basePoints;
  const timeBonus = Math.max(0, Math.floor((diff.timeLimit - gameElapsed) * (currentDifficulty * 0.5)));
  score += timeBonus;
  const moveBonus = Math.max(0, (diff.moveLimit - puzzle.moves.length) * 2);
  score += moveBonus;
  score -= hintsUsed * 50;
  score = Math.max(score, 10);

  // 更新积分
  appData.totalPoints += score;
  saveData(appData);

  // 保存历史记录
  const record = {
    id: Date.now(),
    themeId: currentTheme.id,
    themeName: currentTheme.name,
    difficulty: currentDifficulty,
    time: gameElapsed,
    moves: puzzle.moves.length,
    hintsUsed,
    score,
    date: new Date().toLocaleString('zh-CN'),
    imageDataUrl: themeImageDataUrl,
  };
  appData.history.unshift(record);
  // 只保留最近 50 条
  if (appData.history.length > 50) appData.history = appData.history.slice(0, 50);
  saveData(appData);

  // 检查奖励
  checkRewards();

  // 显示完成界面
  showCompleteScreen(record, score);
}

function showCompleteScreen(record, score) {
  const theme = THEMES.find(t => t.id === record.themeId);

  document.getElementById('complete-theme-name').textContent = theme.name;

  document.getElementById('complete-stats').innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${formatTime(record.time)}</div>
      <div class="stat-label">用时</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${record.moves}</div>
      <div class="stat-label">步数</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${record.hintsUsed}</div>
      <div class="stat-label">提示</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="color: var(--gold)">+${score}</div>
      <div class="stat-label">得分</div>
    </div>
  `;

  document.getElementById('culture-content').innerHTML = `
    <h4 style="color:var(--gold);margin-bottom:8px;">${theme.culture.title}</h4>
    <p>${theme.culture.content.replace(/\n\n/g, '</p><p>')}</p>
  `;

  showScreen('complete-screen');
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

/* ========== 奖励检查 ========== */
function checkRewards() {
  REWARDS.forEach(r => {
    if (!appData.earnedRewards.includes(r.id) && appData.totalPoints >= r.points) {
      appData.earnedRewards.push(r.id);
      setTimeout(() => {
        alert(`🎉 恭喜获得徽章：${r.name}！`);
      }, 500);
    }
  });
  saveData(appData);
}

/* ========== 历史记录 ========== */
function renderHistory() {
  const grid = document.getElementById('history-grid');
  grid.innerHTML = '';

  if (appData.history.length === 0) {
    grid.innerHTML = '<p class="empty-hint" id="history-empty">还没有完成任何拼图，快去挑战吧！</p>';
    return;
  }

  appData.history.forEach(record => {
    const card = document.createElement('div');
    card.className = 'history-card';

    // 缩略图
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 240, 240);
      card.prepend(canvas);
    };
    img.src = record.imageDataUrl;

    const info = document.createElement('div');
    info.className = 'history-info';
    info.innerHTML = `
      <div class="history-theme">${record.themeName}</div>
      <div class="history-meta">
        ${record.difficulty}×${record.difficulty} · ${formatTime(record.time)} · ${record.moves}步<br>
        +${record.score}分 · ${record.date}
      </div>
    `;
    card.appendChild(info);
    grid.appendChild(card);
  });
}

/* ========== 设置界面 ========== */
function loadSettingsUI() {
  document.getElementById('setting-sound').checked = appData.settings.sound;
  document.getElementById('setting-animation').checked = appData.settings.animation;
  document.getElementById('setting-highlight-hint').checked = appData.settings.highlightHint;
}

/* ========== 键盘快捷键 ========== */
document.addEventListener('keydown', e => {
  if (!gameActive || !puzzle) return;

  const empty = puzzle.emptyIndex;
  let target = -1;

  switch (e.key) {
    case 'ArrowUp':
    case 'w': case 'W':
      target = empty + puzzle.size;
      break;
    case 'ArrowDown':
    case 's': case 'S':
      target = empty - puzzle.size;
      break;
    case 'ArrowLeft':
    case 'a': case 'A':
      target = empty + 1;
      break;
    case 'ArrowRight':
    case 'd': case 'D':
      target = empty - 1;
      break;
    case 'h': case 'H':
      showHint();
      return;
    default: return;
  }

  // 检查是否有效
  if (target >= 0 && target < puzzle.N && puzzle.state[target] !== 0) {
    // 额外检查：不能跨行左右移动
    const emptyCol = empty % puzzle.size;
    const targetCol = target % puzzle.size;
    const emptyRow = Math.floor(empty / puzzle.size);
    const targetRow = Math.floor(target / puzzle.size);

    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && emptyCol === puzzle.size - 1) return;
    if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && emptyCol === 0) return;

    onTileClick(target);
  }
});

/* ===== 初始渲染 ===== */
renderThemeGrid();
renderRewards();
