/* ===== app.js — 国风华容道 Django 版 ===== */

/* 全局状态（跨页面通过 sessionStorage 传递） */
let APP = {
  currentTheme: null,
  currentSubtopic: null,
  currentDifficulty: 3,
  puzzle: null,
  gameActive: false,
  timerInterval: null,
  gameStartTime: 0,
  gameElapsed: 0,
  hintsUsed: 0,
  themeImageDataUrl: '',
  hintHighlightTimeout: null,
  earnedRewardIds: (typeof EARNED_REWARD_IDS !== 'undefined') ? EARNED_REWARD_IDS : [],
  totalPoints: (typeof USER_TOTAL_POINTS !== 'undefined') ? USER_TOTAL_POINTS : 0,
  completedSubtopics: [],
};

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded', () => {
  initParticleBg();
  detectPage();
  loadSessionState();
});

function loadSessionState() {
  try {
    const saved = sessionStorage.getItem('guofeng_state');
    if (saved) {
      const s = JSON.parse(saved);
      APP.currentTheme = s.currentTheme || THEMES[0];
      APP.currentSubtopic = s.currentSubtopic || null;
      APP.currentDifficulty = s.currentDifficulty || 3;
    } else {
      APP.currentTheme = THEMES[0];
    }
  } catch(e) {
    APP.currentTheme = THEMES[0];
  }
}

function saveSessionState() {
  try {
    sessionStorage.setItem('guofeng_state', JSON.stringify({
      currentTheme: APP.currentTheme,
      currentSubtopic: APP.currentSubtopic,
      currentDifficulty: APP.currentDifficulty,
    }));
  } catch(e) {}
}

/* ===== 页面检测 ===== */
function detectPage() {
  if (document.getElementById('theme-grid')) initMenuPage();
  if (document.getElementById('subtopic-grid')) initSubtopicPage();
  if (document.getElementById('puzzle-board')) initGamePage();
  if (document.getElementById('complete-theme-name')) initCompletePage();
}

/* ===== 粒子背景 ===== */
function initParticleBg() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
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

/* ===== 首页/菜单 ===== */
function initMenuPage() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;

  THEMES.forEach(theme => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (theme.id === APP.currentTheme.id ? ' selected' : '');
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
    const done = APP.completedSubtopics.filter(id =>
      theme.subTopics.some(s => s.id === id)
    ).length;
    desc.textContent = `${theme.shortDesc} · ${done}/${theme.subTopics.length}`;

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(desc);

    card.addEventListener('click', () => {
      APP.currentTheme = theme;
      document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      saveSessionState();
    });

    grid.appendChild(card);
  });

  renderRewards();
  bindMenuEvents();
}

function renderRewards() {
  const row = document.getElementById('rewards-row');
  if (!row) return;
  row.innerHTML = '';
  REWARDS.forEach(r => {
    const earned = APP.earnedRewardIds.includes(r.id);
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

function bindMenuEvents() {
  document.querySelectorAll('.diff-card input').forEach(input => {
    input.addEventListener('change', function () {
      if (this.checked) APP.currentDifficulty = parseInt(this.value);
      saveSessionState();
    });
  });

  const startBtn = document.getElementById('btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      saveSessionState();
      window.location.href = URLS.subtopic;
    });
  }
}

/* ===== 子主题页面 ===== */
function initSubtopicPage() {
  const theme = APP.currentTheme || THEMES[0];
  document.getElementById('subtopic-theme-name').textContent = theme.icon + ' ' + theme.name;

  const done = theme.subTopics.filter(s => APP.completedSubtopics.includes(s.id)).length;
  document.getElementById('subtopic-progress').textContent = `已完成 ${done}/${theme.subTopics.length}`;

  const grid = document.getElementById('subtopic-grid');
  theme.subTopics.forEach(sub => {
    const card = document.createElement('div');
    card.className = 'subtopic-card';
    if (APP.completedSubtopics.includes(sub.id)) card.classList.add('completed');

    card.innerHTML = `
      <div class="subtopic-icon">${sub.icon}</div>
      <div class="subtopic-name">${sub.name}</div>
      <div class="subtopic-desc">${sub.desc}</div>
      ${APP.completedSubtopics.includes(sub.id) ? '<div class="completed-badge">✓ 已通关</div>' : ''}
    `;

    card.addEventListener('click', () => {
      APP.currentSubtopic = sub;
      saveSessionState();
      window.location.href = URLS.game;
    });

    grid.appendChild(card);
  });
}

/* ===== 游戏页面 ===== */
function initGamePage() {
  const theme = APP.currentTheme || THEMES[0];
  const subtopic = APP.currentSubtopic;
  const size = APP.currentDifficulty;

  if (!subtopic) {
    window.location.href = URLS.subtopic;
    return;
  }

  APP.puzzle = new PuzzleEngine(size, theme.id);
  APP.puzzle.reset();
  APP.puzzle.shuffle();

  const imgCanvas = generateThemeImage(theme.id, 600);
  APP.themeImageDataUrl = imgCanvas.toDataURL();

  document.getElementById('game-theme-name').textContent =
    theme.name + (subtopic ? ' · ' + subtopic.name : '');
  document.getElementById('game-diff').textContent =
    `${size}×${size} · ${DIFFICULTIES[size].label}`;

  renderBoard();
  renderPreview();
  bindGameEvents();

  APP.gameActive = true;
  APP.hintsUsed = 0;
  APP.gameElapsed = 0;
  document.getElementById('game-timer').textContent = '00:00';
  document.getElementById('game-moves').textContent = '0';
  document.getElementById('game-hints-used').textContent = '0';
  document.getElementById('game-score-estimate').textContent = '—';
  const moveList = document.getElementById('move-list');
  if (moveList) moveList.innerHTML = '';

  APP.gameStartTime = Date.now();
  APP.timerInterval = setInterval(updateTimer, 200);
}

function renderBoard() {
  const board = document.getElementById('puzzle-board');
  if (!board) return;
  board.innerHTML = '';
  board.className = 'puzzle-board size-' + APP.puzzle.size;

  const img = new Image();
  img.onload = () => {
    const tileCount = APP.puzzle.size;
    const boardSize = Math.min(480, window.innerWidth - 320);
    board.style.width = boardSize + 'px';
    board.style.height = boardSize + 'px';

    for (let i = 0; i < APP.puzzle.N; i++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.index = i;
      const tileVal = APP.puzzle.state[i];
      if (tileVal === 0) {
        tile.classList.add('empty');
      } else {
        const srcRow = Math.floor((tileVal - 1) / tileCount);
        const srcCol = (tileVal - 1) % tileCount;
        tile.style.backgroundImage = `url(${APP.themeImageDataUrl})`;
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
  img.src = APP.themeImageDataUrl;
}

function renderPreview() {
  const previewCanvas = document.getElementById('preview-canvas');
  if (!previewCanvas) return;
  const previewCtx = previewCanvas.getContext('2d');
  previewCanvas.width = 150;
  previewCanvas.height = 150;
  const previewImg = new Image();
  previewImg.onload = () => { previewCtx.drawImage(previewImg, 0, 0, 150, 150); };
  previewImg.src = APP.themeImageDataUrl;
}

function bindGameEvents() {
  document.getElementById('btn-hint').addEventListener('click', showHint);
  document.getElementById('btn-shuffle').addEventListener('click', reshuffle);
  document.getElementById('btn-show-preview').addEventListener('click', togglePreview);
}

function onTileClick(index) {
  if (!APP.gameActive || !APP.puzzle) return;
  if (APP.puzzle.state[index] === 0) return;
  const moved = APP.puzzle.moveTile(index);
  if (!moved) return;

  document.getElementById('game-moves').textContent = APP.puzzle.moves.length;
  if (APP.puzzle.moves.length > 0) {
    const lastMove = APP.puzzle.moves[APP.puzzle.moves.length - 1];
    addMoveRecord(lastMove);
  }
  updateBoardTiles();
  updateScoreEstimate();
  if (APP.puzzle.isSolved()) onPuzzleComplete();
}

function updateBoardTiles() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach(tile => {
    const i = parseInt(tile.dataset.index);
    const val = APP.puzzle.state[i];
    tile.classList.remove('empty');
    tile.style.backgroundImage = '';
    tile.style.backgroundSize = '';
    tile.style.backgroundPosition = '';
    const oldNum = tile.querySelector('.tile-num');
    if (oldNum) oldNum.remove();

    if (val === 0) {
      tile.classList.add('empty');
    } else {
      const tileCount = APP.puzzle.size;
      const srcRow = Math.floor((val - 1) / tileCount);
      const srcCol = (val - 1) % tileCount;
      tile.style.backgroundImage = `url(${APP.themeImageDataUrl})`;
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
  if (!list) return;
  const span = document.createElement('span');
  span.textContent = `${move.tile}→${move.dir} `;
  span.style.marginRight = '6px';
  list.appendChild(span);
  list.scrollTop = list.scrollHeight;
}

function updateTimer() {
  if (!APP.gameActive) return;
  APP.gameElapsed = Math.floor((Date.now() - APP.gameStartTime) / 1000);
  const min = Math.floor(APP.gameElapsed / 60);
  const sec = APP.gameElapsed % 60;
  document.getElementById('game-timer').textContent =
    String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  updateScoreEstimate();
}

function updateScoreEstimate() {
  const diff = DIFFICULTIES[APP.currentDifficulty];
  let score = diff.basePoints;
  score += Math.max(0, Math.floor((diff.timeLimit - APP.gameElapsed) * (APP.currentDifficulty * 0.5)));
  score += Math.max(0, (diff.moveLimit - APP.puzzle.moves.length) * 2);
  score -= APP.hintsUsed * 50;
  score = Math.max(score, 10);
  document.getElementById('game-score-estimate').textContent = Math.floor(score);
}

function showHint() {
  if (!APP.gameActive || !APP.puzzle) return;
  const hint = APP.puzzle.getHint();
  APP.hintsUsed++;
  document.getElementById('game-hints-used').textContent = APP.hintsUsed;
  updateScoreEstimate();

  if (hint) {
    showHintOverlay(`移动 <strong>#${hint.tileNum}</strong> 号图块，方向：<strong>${hint.direction}</strong>${hint.totalSteps ? '（预计还需 ' + hint.totalSteps + ' 步）' : ''}`);
    highlightTile(hint.tileIndex);
  } else {
    showHintOverlay('提示系统暂时无法找到解法，请自由移动！');
  }
}

function showHintOverlay(text) {
  const overlay = document.getElementById('hint-overlay');
  if (!overlay) return;
  document.getElementById('hint-text').innerHTML = text;
  overlay.style.display = 'flex';
  overlay.classList.add('show');
  setTimeout(() => {
    overlay.classList.remove('show');
    overlay.style.display = 'none';
  }, 2500);
}

function highlightTile(tileIndex) {
  document.querySelectorAll('.tile.hint-highlight').forEach(t => t.classList.remove('hint-highlight'));
  const tile = document.querySelector(`.tile[data-index="${tileIndex}"]`);
  if (tile && !tile.classList.contains('empty')) {
    tile.classList.add('hint-highlight');
    if (APP.hintHighlightTimeout) clearTimeout(APP.hintHighlightTimeout);
    APP.hintHighlightTimeout = setTimeout(() => { tile.classList.remove('hint-highlight'); }, 3000);
  }
}

function reshuffle() {
  if (!APP.gameActive || !APP.puzzle) return;
  APP.puzzle.shuffle();
  APP.hintsUsed = 0;
  document.getElementById('game-hints-used').textContent = '0';
  document.getElementById('game-moves').textContent = '0';
  const list = document.getElementById('move-list');
  if (list) list.innerHTML = '';
  updateBoardTiles();
  updateScoreEstimate();
}

function togglePreview() {
  const preview = document.getElementById('preview-mini');
  if (!preview) return;
  preview.style.transform = preview.style.transform ? '' : 'scale(1.5)';
  preview.style.transition = 'transform 0.3s ease';
  preview.style.zIndex = preview.style.zIndex ? '' : '50';
  if (preview.style.transform) {
    setTimeout(() => { preview.style.transform = ''; preview.style.zIndex = ''; }, 2000);
  }
}

/* ===== 完成拼图 ===== */
function onPuzzleComplete() {
  if (APP.timerInterval) { clearInterval(APP.timerInterval); APP.timerInterval = null; }
  APP.gameActive = false;

  const diff = DIFFICULTIES[APP.currentDifficulty];
  let score = diff.basePoints;
  score += Math.max(0, Math.floor((diff.timeLimit - APP.gameElapsed) * (APP.currentDifficulty * 0.5)));
  score += Math.max(0, (diff.moveLimit - APP.puzzle.moves.length) * 2);
  score -= APP.hintsUsed * 50;
  score = Math.max(score, 10);

  // 保存到服务器
  saveRecordToServer(score);

  // 本地状态
  if (APP.currentSubtopic && !APP.completedSubtopics.includes(APP.currentSubtopic.id)) {
    APP.completedSubtopics.push(APP.currentSubtopic.id);
  }
  APP.totalPoints += score;
  saveSessionState();

  // 跳转到完成页
  const params = new URLSearchParams();
  params.set('score', score);
  params.set('time', APP.gameElapsed);
  params.set('moves', APP.puzzle.moves.length);
  params.set('hints', APP.hintsUsed);
  params.set('theme', APP.currentTheme ? APP.currentTheme.name : '');
  params.set('subtopic', APP.currentSubtopic ? APP.currentSubtopic.name : '');
  params.set('subtopicDesc', APP.currentSubtopic ? APP.currentSubtopic.desc : '');
  window.location.href = URLS.complete + '?' + params.toString();
}

function saveRecordToServer(score) {
  if (typeof CSRF_TOKEN === 'undefined') return;
  const data = {
    theme_id: APP.currentTheme ? APP.currentTheme.id : '',
    theme_name: APP.currentTheme ? APP.currentTheme.name : '',
    subtopic_id: APP.currentSubtopic ? APP.currentSubtopic.id : '',
    subtopic_name: APP.currentSubtopic ? APP.currentSubtopic.name : '',
    difficulty: APP.currentDifficulty,
    time_spent: APP.gameElapsed,
    moves: APP.puzzle.moves.length,
    hints_used: APP.hintsUsed,
    score: score,
  };

  fetch(URLS.saveRecord, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': CSRF_TOKEN,
    },
    body: JSON.stringify(data),
  }).catch(e => console.error('Save failed:', e));
}

/* ===== 完成页面 ===== */
function initCompletePage() {
  const params = new URLSearchParams(window.location.search);
  const score = params.get('score') || '0';
  const time = parseInt(params.get('time') || '0');
  const moves = params.get('moves') || '0';
  const hints = params.get('hints') || '0';
  const themeName = params.get('theme') || '';
  const subtopicName = params.get('subtopic') || '';
  const subtopicDesc = params.get('subtopicDesc') || '';

  document.getElementById('complete-theme-name').textContent =
    themeName + (subtopicName ? ' · ' + subtopicName : '');

  document.getElementById('complete-stats').innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${formatTime(time)}</div>
      <div class="stat-label">用时</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${moves}</div>
      <div class="stat-label">步数</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${hints}</div>
      <div class="stat-label">提示</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="color: var(--gold)">+${score}</div>
      <div class="stat-label">得分</div>
    </div>
  `;

  document.getElementById('culture-content').innerHTML = `
    ${subtopicName ? '<h4 style="color:var(--gold);margin-bottom:8px;">' + subtopicName + '</h4>' : ''}
    <p>${subtopicDesc}</p>
    <p style="margin-top:12px;font-size:13px;color:var(--text-dim);">所属主题：${themeName}</p>
  `;

  const nextBtn = document.getElementById('btn-next-level');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (APP.currentTheme && APP.currentSubtopic) {
        const idx = APP.currentTheme.subTopics.findIndex(s => s.id === APP.currentSubtopic.id);
        if (idx >= 0 && idx < APP.currentTheme.subTopics.length - 1) {
          APP.currentSubtopic = APP.currentTheme.subTopics[idx + 1];
          saveSessionState();
          window.location.href = URLS.game;
          return;
        }
      }
      window.location.href = URLS.subtopic;
    });
  }
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

function stopGame() {
  APP.gameActive = false;
  if (APP.timerInterval) { clearInterval(APP.timerInterval); APP.timerInterval = null; }
  if (APP.hintHighlightTimeout) { clearTimeout(APP.hintHighlightTimeout); APP.hintHighlightTimeout = null; }
}

/* ===== 键盘操作 ===== */
document.addEventListener('keydown', e => {
  if (!APP.gameActive || !APP.puzzle) return;
  const empty = APP.puzzle.emptyIndex;
  let target = -1;
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': target = empty + APP.puzzle.size; break;
    case 'ArrowDown': case 's': case 'S': target = empty - APP.puzzle.size; break;
    case 'ArrowLeft': case 'a': case 'A': target = empty + 1; break;
    case 'ArrowRight': case 'd': case 'D': target = empty - 1; break;
    case 'h': case 'H': showHint(); return;
    default: return;
  }
  if (target >= 0 && target < APP.puzzle.N && APP.puzzle.state[target] !== 0) {
    const emptyCol = empty % APP.puzzle.size;
    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && emptyCol === APP.puzzle.size - 1) return;
    if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && emptyCol === 0) return;
    onTileClick(target);
  }
});
