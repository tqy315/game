/* ===== app.js — 国风华容道：应用主逻辑 ===== */

const STORAGE_KEY = 'guofeng_huarongdao';

/* ===== 数据管理 ===== */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultData();
  } catch { return getDefaultData(); }
}
function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function getDefaultData() {
  return {
    username: '',
    totalPoints: 0,
    earnedRewards: [],
    completedSubtopics: {},  // { subtopicId: true }
    history: [],
    settings: { sound: true, animation: true, highlightHint: true },
  };
}

/* ===== 全局状态 ===== */
let appData = loadData();
let currentTheme = THEMES[0];
let currentSubtopic = null;
let currentDifficulty = 3;
let puzzle = null;
let gameActive = false;
let timerInterval = null;
let gameStartTime = 0;
let gameElapsed = 0;
let hintsUsed = 0;
let themeImageDataUrl = '';
let hintHighlightTimeout = null;

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded', () => {
  initParticleBg();
  bindEvents();
  if (appData.username) {
    showScreen('menu-screen');
    updateMenuUI();
  } else {
    showScreen('login-screen');
  }
});

/* ===== 粒子背景（轻盈暖色花瓣效果） ===== */
function initParticleBg() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const maxParticles = 40;

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
      this.y = -20;
      this.size = Math.random() * 3 + 1;
      this.speed = Math.random() * 0.4 + 0.1;
      this.opacity = Math.random() * 0.25 + 0.05;
      this.drift = Math.random() * 0.3 - 0.15;
      this.color = Math.random() > 0.5 ? '184,134,11' : '196,30,58';
    }
    update() {
      this.y += this.speed;
      this.x += this.drift;
      if (this.y > canvas.height + 20) this.reset();
    }
    draw() {
      ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < maxParticles; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ===== 事件绑定 ===== */
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

  // 主菜单-开始挑战 → 进入子主题选择
  document.getElementById('btn-start').addEventListener('click', openSubtopicScreen);

  // 子主题-返回
  document.getElementById('btn-back-from-subtopic').addEventListener('click', () => {
    showScreen('menu-screen');
    updateMenuUI();
  });

  // 游戏内按钮
  document.getElementById('btn-back-menu-from-game').addEventListener('click', () => {
    stopGame();
    showScreen('menu-screen');
    updateMenuUI();
  });
  document.getElementById('btn-hint').addEventListener('click', showHint);
  document.getElementById('btn-shuffle').addEventListener('click', reshufflePuzzle);
  document.getElementById('btn-show-preview').addEventListener('click', togglePreview);

  // 完成界面
  document.getElementById('btn-next-level').addEventListener('click', goToNextLevel);
  document.getElementById('btn-menu-from-complete').addEventListener('click', () => {
    showScreen('menu-screen');
    updateMenuUI();
  });

  // 历史/设置返回
  document.getElementById('btn-back-from-history').addEventListener('click', () => showScreen('menu-screen'));
  document.getElementById('btn-back-from-settings').addEventListener('click', () => showScreen('menu-screen'));

  // 设置
  document.getElementById('setting-sound').addEventListener('change', function () {
    appData.settings.sound = this.checked; saveData(appData);
  });
  document.getElementById('setting-animation').addEventListener('change', function () {
    appData.settings.animation = this.checked; saveData(appData);
  });
  document.getElementById('setting-highlight-hint').addEventListener('change', function () {
    appData.settings.highlightHint = this.checked; saveData(appData);
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

  // 难度选择
  document.querySelectorAll('.diff-card input').forEach(input => {
    input.addEventListener('change', function () {
      if (this.checked) currentDifficulty = parseInt(this.value);
    });
  });
}

/* ===== 登录/退出 ===== */
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

/* ===== 屏幕切换 ===== */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

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

/* ===== 主题网格渲染 ===== */
function renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';

  THEMES.forEach(theme => {
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
    const completed = theme.subTopics.filter(s => appData.completedSubtopics[s.id]).length;
    desc.textContent = `${theme.shortDesc} · ${completed}/${theme.subTopics.length}`;

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

/* ===== 奖励渲染 ===== */
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

/* ===== 子主题选择界面 ===== */
function openSubtopicScreen() {
  document.getElementById('subtopic-theme-name').textContent = currentTheme.icon + ' ' + currentTheme.name;
  const completed = currentTheme.subTopics.filter(s => appData.completedSubtopics[s.id]).length;
  document.getElementById('subtopic-progress').textContent = `已完成 ${completed}/${currentTheme.subTopics.length}`;
  renderSubtopicGrid();
  showScreen('subtopic-screen');
}

function renderSubtopicGrid() {
  const grid = document.getElementById('subtopic-grid');
  grid.innerHTML = '';

  currentTheme.subTopics.forEach(sub => {
    const card = document.createElement('div');
    card.className = 'subtopic-card';
    const isDone = appData.completedSubtopics[sub.id];
    if (isDone) card.classList.add('completed');

    card.innerHTML = `
      <div class="subtopic-icon">${sub.icon}</div>
      <div class="subtopic-name">${sub.name}</div>
      <div class="subtopic-desc">${sub.desc}</div>
      ${isDone ? '<div class="completed-badge">✓ 已通关</div>' : ''}
    `;

    card.addEventListener('click', () => {
      currentSubtopic = sub;
      startGame();
    });

    grid.appendChild(card);
  });
}

/* ===== 开始游戏 ===== */
function startGame() {
  stopGame();
  const size = currentDifficulty;
  const theme = currentTheme;

  puzzle = new PuzzleEngine(size, theme.id);
  puzzle.reset();
  puzzle.shuffle();

  const imgCanvas = generateThemeImage(theme.id, 600);
  themeImageDataUrl = imgCanvas.toDataURL();

  const subtopicName = currentSubtopic ? ` · ${currentSubtopic.name}` : '';
  document.getElementById('game-theme-name').textContent = theme.name + subtopicName;
  document.getElementById('game-diff').textContent =
    `${size}×${size} · ${DIFFICULTIES[size].label}`;

  renderBoard();

  const previewCanvas = document.getElementById('preview-canvas');
  const previewCtx = previewCanvas.getContext('2d');
  previewCanvas.width = 150;
  previewCanvas.height = 150;
  const previewImg = new Image();
  previewImg.onload = () => { previewCtx.drawImage(previewImg, 0, 0, 150, 150); };
  previewImg.src = themeImageDataUrl;

  gameActive = true;
  hintsUsed = 0;
  gameElapsed = 0;
  document.getElementById('game-timer').textContent = '00:00';
  document.getElementById('game-moves').textContent = '0';
  document.getElementById('game-hints-used').textContent = '0';
  document.getElementById('game-score-estimate').textContent = '—';
  document.getElementById('move-list').innerHTML = '';

  gameStartTime = Date.now();
  timerInterval = setInterval(updateTimer, 200);

  showScreen('game-screen');
}

function stopGame() {
  gameActive = false;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (hintHighlightTimeout) { clearTimeout(hintHighlightTimeout); hintHighlightTimeout = null; }
}

/* ===== 拼图板渲染 ===== */
function renderBoard() {
  const board = document.getElementById('puzzle-board');
  board.innerHTML = '';
  board.className = 'puzzle-board size-' + puzzle.size;

  const img = new Image();
  img.onload = () => {
    const tileCount = puzzle.size;
    const imgW = img.width;
    const imgH = img.height;
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
        const srcRow = Math.floor((tileVal - 1) / tileCount);
        const srcCol = (tileVal - 1) % tileCount;
        tile.style.backgroundImage = `url(${themeImageDataUrl})`;
        tile.style.backgroundSize = `${tileCount * 100}% ${tileCount * 100}%`;
        tile.style.backgroundPosition = `${(srcCol / tileCount) * 100}% ${(srcRow / tileCount) * 100}%`;
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

/* ===== 图块点击 ===== */
function onTileClick(index) {
  if (!gameActive) return;
  if (puzzle.state[index] === 0) return;
  const moved = puzzle.moveTile(index);
  if (!moved) return;

  document.getElementById('game-moves').textContent = puzzle.moves.length;
  if (puzzle.moves.length > 0) {
    const lastMove = puzzle.moves[puzzle.moves.length - 1];
    addMoveRecord(lastMove);
  }
  updateBoardTiles();
  updateScoreEstimate();
  if (puzzle.isSolved()) onPuzzleComplete();
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

/* ===== 计时器 ===== */
function updateTimer() {
  if (!gameActive) return;
  gameElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const min = Math.floor(gameElapsed / 60);
  const sec = gameElapsed % 60;
  document.getElementById('game-timer').textContent =
    String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  updateScoreEstimate();
}

/* ===== 得分估算 ===== */
function updateScoreEstimate() {
  const diff = DIFFICULTIES[currentDifficulty];
  let score = diff.basePoints;
  const timeBonus = Math.max(0, (diff.timeLimit - gameElapsed) * (currentDifficulty * 0.5));
  score += Math.floor(timeBonus);
  const moveBonus = Math.max(0, (diff.moveLimit - puzzle.moves.length) * 2);
  score += moveBonus;
  score -= hintsUsed * 50;
  score = Math.max(score, 10);
  document.getElementById('game-score-estimate').textContent = Math.floor(score);
}

/* ===== 提示 ===== */
function showHint() {
  if (!gameActive) return;
  const hint = puzzle.getHint();
  hintsUsed++;
  document.getElementById('game-hints-used').textContent = hintsUsed;
  updateScoreEstimate();

  if (hint) {
    showHintOverlay(`移动 <strong>#${hint.tileNum}</strong> 号图块，方向：<strong>${hint.direction}</strong>${hint.totalSteps ? '（预计还需 ' + hint.totalSteps + ' 步）' : ''}`);
    if (appData.settings.highlightHint) highlightTile(hint.tileIndex);
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
  document.querySelectorAll('.tile.hint-highlight').forEach(t => t.classList.remove('hint-highlight'));
  const tile = document.querySelector(`.tile[data-index="${tileIndex}"]`);
  if (tile && !tile.classList.contains('empty')) {
    tile.classList.add('hint-highlight');
    if (hintHighlightTimeout) clearTimeout(hintHighlightTimeout);
    hintHighlightTimeout = setTimeout(() => { tile.classList.remove('hint-highlight'); }, 3000);
  }
}

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

function togglePreview() {
  const preview = document.getElementById('preview-mini');
  preview.style.transform = preview.style.transform ? '' : 'scale(1.5)';
  preview.style.transition = 'transform 0.3s ease';
  preview.style.zIndex = preview.style.zIndex ? '' : '50';
  if (preview.style.transform) {
    setTimeout(() => { preview.style.transform = ''; preview.style.zIndex = ''; }, 2000);
  }
}

/* ===== 完成拼图 ===== */
function onPuzzleComplete() {
  stopGame();

  const diff = DIFFICULTIES[currentDifficulty];
  let score = diff.basePoints;
  score += Math.max(0, Math.floor((diff.timeLimit - gameElapsed) * (currentDifficulty * 0.5)));
  score += Math.max(0, (diff.moveLimit - puzzle.moves.length) * 2);
  score -= hintsUsed * 50;
  score = Math.max(score, 10);

  appData.totalPoints += score;

  // 标记子主题为完成
  if (currentSubtopic) {
    appData.completedSubtopics[currentSubtopic.id] = true;
  }
  saveData(appData);

  // 历史记录
  const record = {
    id: Date.now(),
    themeId: currentTheme.id,
    themeName: currentTheme.name,
    subtopicName: currentSubtopic ? currentSubtopic.name : '',
    subtopicId: currentSubtopic ? currentSubtopic.id : '',
    difficulty: currentDifficulty,
    time: gameElapsed,
    moves: puzzle.moves.length,
    hintsUsed,
    score,
    date: new Date().toLocaleString('zh-CN'),
    imageDataUrl: themeImageDataUrl,
  };
  appData.history.unshift(record);
  if (appData.history.length > 50) appData.history = appData.history.slice(0, 50);
  saveData(appData);

  checkRewards();
  showCompleteScreen(record, score);
}

function showCompleteScreen(record, score) {
  const theme = THEMES.find(t => t.id === record.themeId);
  document.getElementById('complete-theme-name').textContent =
    theme.name + (record.subtopicName ? ' · ' + record.subtopicName : '');

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

  // 文化介绍
  let cultureHTML = '';
  if (currentSubtopic) {
    cultureHTML = `<h4 style="color:var(--gold);margin-bottom:8px;">${currentSubtopic.name}</h4><p>${currentSubtopic.desc}</p>`;
  }
  cultureHTML += `<p style="margin-top:12px;font-size:13px;color:var(--text-dim);">所属主题：${theme.name}（${theme.shortDesc}）</p>`;
  document.getElementById('culture-content').innerHTML = cultureHTML;

  showScreen('complete-screen');
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

/* ===== 下一关 ===== */
function goToNextLevel() {
  if (!currentSubtopic || !currentTheme) { startGame(); return; }
  const idx = currentTheme.subTopics.findIndex(s => s.id === currentSubtopic.id);
  if (idx >= 0 && idx < currentTheme.subTopics.length - 1) {
    currentSubtopic = currentTheme.subTopics[idx + 1];
    startGame();
  } else {
    // 当前主题全部完成，返回子主题页
    openSubtopicScreen();
  }
}

/* ===== 奖励 ===== */
function checkRewards() {
  REWARDS.forEach(r => {
    if (!appData.earnedRewards.includes(r.id) && appData.totalPoints >= r.points) {
      appData.earnedRewards.push(r.id);
      setTimeout(() => { alert(`🎉 恭喜获得徽章：${r.name}！`); }, 500);
    }
  });
  saveData(appData);
}

/* ===== 历史记录 ===== */
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
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = 240; canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 240, 240);
      card.prepend(canvas);
    };
    img.src = record.imageDataUrl;
    const info = document.createElement('div');
    info.className = 'history-info';
    info.innerHTML = `
      <div class="history-theme">${record.themeName}${record.subtopicName ? ' · ' + record.subtopicName : ''}</div>
      <div class="history-meta">
        ${record.difficulty}×${record.difficulty} · ${formatTime(record.time)} · ${record.moves}步<br>
        +${record.score}分 · ${record.date}
      </div>
    `;
    card.appendChild(info);
    grid.appendChild(card);
  });
}

function loadSettingsUI() {
  document.getElementById('setting-sound').checked = appData.settings.sound;
  document.getElementById('setting-animation').checked = appData.settings.animation;
  document.getElementById('setting-highlight-hint').checked = appData.settings.highlightHint;
}

/* ===== 键盘快捷键 ===== */
document.addEventListener('keydown', e => {
  if (!gameActive || !puzzle) return;
  const empty = puzzle.emptyIndex;
  let target = -1;
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': target = empty + puzzle.size; break;
    case 'ArrowDown': case 's': case 'S': target = empty - puzzle.size; break;
    case 'ArrowLeft': case 'a': case 'A': target = empty + 1; break;
    case 'ArrowRight': case 'd': case 'D': target = empty - 1; break;
    case 'h': case 'H': showHint(); return;
    default: return;
  }
  if (target >= 0 && target < puzzle.N && puzzle.state[target] !== 0) {
    const emptyCol = empty % puzzle.size;
    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && emptyCol === puzzle.size - 1) return;
    if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && emptyCol === 0) return;
    onTileClick(target);
  }
});

/* ===== 初始渲染 ===== */
renderThemeGrid();
renderRewards();
