/* ===== app.js — 国风华容道 主逻辑 ===== */
var APP = {
  themeId: '', themeName: '', subtopicId: '', subtopicName: '',
  difficulty: 3, puzzle: null, gameActive: false, gamePaused: false,
  timerInterval: null, timeSpent: 0, moves: 0, hintsUsed: 0, maxHints: 3,
  score: 0, hintTimeout: null,
};

// ——— init ———
document.addEventListener('DOMContentLoaded', function() {
  initParticleBg();
  initSettings();
  var page = detectPage();
  if (page === 'menu') initMenuPage();
  else if (page === 'subtopic') initSubtopicPage();
  else if (page === 'game') initGamePage();
  else if (page === 'complete') initCompletePage();
  else if (page === 'history') initHistoryPage();
});

function detectPage() {
  if (document.getElementById('menu-screen')) return 'menu';
  if (document.getElementById('subtopic-screen')) return 'subtopic';
  if (document.getElementById('game-screen')) return 'game';
  if (document.getElementById('complete-screen')) return 'complete';
  if (document.getElementById('history-screen')) return 'history';
  return '';
}

// ——— particle background ———
function initParticleBg() {
  var c = document.getElementById('bg-canvas');
  if (!c) return;
  var ctx = c.getContext('2d');
  var particles = [];
  function resize() { c.width = window.innerWidth; c.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  for (var i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      color: Math.random() < 0.4 ? '#c41e3a' : '#b8860b',
    });
  }
  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + '22'; ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > c.width) p.vx *= -1;
      if (p.y < 0 || p.y > c.height) p.vy *= -1;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ——— settings ———
function initSettings() {
  if (localStorage.getItem('setting_sound') === '0') SoundFX.setEnabled(false);
  var ts = document.getElementById('toggle-sound');
  if (ts) { ts.checked = SoundFX.isEnabled(); }
  var ta = document.getElementById('toggle-anim');
  if (ta && localStorage.getItem('setting_anim') === '0') ta.checked = false;
  var th = document.getElementById('toggle-hints');
  if (th && localStorage.getItem('setting_hints') === '0') th.checked = false;
}

// ——— menu page ———
function initMenuPage() {
  loadProgress();
}

function loadProgress() {
  fetch(URLS.menu.replace('/menu/', '/api/get-progress/'), { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var cards = document.querySelectorAll('.theme-card');
      cards.forEach(function(card) {
        var tid = card.getAttribute('onclick') || '';
        if (!tid) return;
      });
    }).catch(function() {});
}

// ——— subtopic page ———
function initSubtopicPage() {}

// ——— game page ———
function initGamePage() {
  APP.themeId = window.GAME_THEME_ID || sessionStorage.getItem('theme_id') || '';
  APP.themeName = window.GAME_THEME_NAME || sessionStorage.getItem('theme_name') || '';
  APP.subtopicId = window.GAME_SUBTOPIC_ID || sessionStorage.getItem('subtopic_id') || '';
  APP.subtopicName = window.GAME_SUBTOPIC_NAME || sessionStorage.getItem('subtopic_name') || '';
  APP.difficulty = parseInt(window.GAME_DIFFICULTY) || parseInt(sessionStorage.getItem('difficulty')) || 3;
  APP.maxHints = 3;
  APP.hintsUsed = 0;
  APP.moves = 0;
  APP.timeSpent = 0;

  var size = APP.difficulty;
  APP.puzzle = new PuzzleEngine(size);
  APP.puzzle.shuffle();
  APP.gameActive = true;
  APP.gamePaused = false;

  renderBoard();
  updateMoves();
  updateHints();
  startTimer();
  bindGameControls();
  bindKeyboard();
}

function renderBoard() {
  var board = document.getElementById('puzzle-board');
  if (!board) return;
  board.className = 'puzzle-board size-' + APP.puzzle.size;
  board.innerHTML = '';
  var theme = THEMES.find(function(t) { return t.id === APP.themeId; });
  for (var i = 0; i < APP.puzzle.N; i++) {
    var val = APP.puzzle.state[i];
    var tile = document.createElement('div');
    tile.className = 'tile' + (val === 0 ? ' empty' : '');
    tile.setAttribute('data-index', i);
    if (val !== 0) {
      // draw number and style
      tile.style.background = 'linear-gradient(135deg,' + (theme ? theme.colors[0] : '#c41e3a') + ',' + (theme ? theme.colors[1] : '#a01830') + ')';
      tile.textContent = val;
      tile.addEventListener('click', function(idx) { return function() { onTileClick(idx); }; }(i));
    }
    board.appendChild(tile);
  }
}

function onTileClick(index) {
  if (!APP.gameActive || APP.gamePaused) return;
  var result = APP.puzzle.moveTile(index);
  if (result) {
    APP.moves++;
    SoundFX.move();
    renderBoard();
    updateMoves();
    updateScore();
    addMoveHistory(APP.puzzle.moves[APP.puzzle.moves.length - 1]);
    if (APP.puzzle.isSolved()) onPuzzleComplete();
  }
}

function updateMoves() {
  var el = document.getElementById('moves-display');
  if (el) el.textContent = APP.moves;
}

function updateHints() {
  var el = document.getElementById('hints-display');
  if (el) el.textContent = APP.hintsUsed + ' / ' + APP.maxHints;
}

function updateScore() {
  var base = APP.difficulty === 3 ? 300 : 500;
  var penalty = APP.moves * 2 + APP.timeSpent * 0.5 + APP.hintsUsed * 15;
  APP.score = Math.max(10, Math.round(base - penalty));
  var el = document.getElementById('score-display');
  if (el) el.textContent = APP.score;
}

function addMoveHistory(move) {
  var el = document.getElementById('move-history');
  if (!el) return;
  var span = document.createElement('span');
  span.textContent = move.tile + '→' + move.dir;
  el.appendChild(span);
  el.scrollTop = el.scrollHeight;
}

function startTimer() {
  APP.timeSpent = 0;
  var display = document.getElementById('timer-display');
  APP.timerInterval = setInterval(function() {
    if (!APP.gamePaused && APP.gameActive) {
      APP.timeSpent++;
      if (display) {
        var m = Math.floor(APP.timeSpent / 60);
        var s = APP.timeSpent % 60;
        display.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      }
      updateScore();
    }
  }, 1000);
}

function bindGameControls() {
  var btnUndo = document.getElementById('btn-undo');
  var btnHint = document.getElementById('btn-hint');
  var btnPause = document.getElementById('btn-pause');
  var btnResume = document.getElementById('btn-resume');
  var btnShuffle = document.getElementById('btn-shuffle');
  var btnRestart = document.getElementById('btn-restart');

  if (btnUndo) btnUndo.addEventListener('click', undoMove);
  if (btnHint) btnHint.addEventListener('click', showHint);
  if (btnPause) btnPause.addEventListener('click', togglePause);
  if (btnResume) btnResume.addEventListener('click', togglePause);
  if (btnShuffle) btnShuffle.addEventListener('click', function() { APP.puzzle.shuffle(); APP.moves = 0; APP.hintsUsed = 0; APP.timeSpent = 0; renderBoard(); updateMoves(); updateHints(); updateScore(); var el = document.getElementById('move-history'); if (el) el.innerHTML = ''; SoundFX.shuffle(); });
  if (btnRestart) btnRestart.addEventListener('click', function() { togglePause(); APP.puzzle.shuffle(); APP.moves = 0; APP.hintsUsed = 0; APP.timeSpent = 0; renderBoard(); updateMoves(); updateHints(); updateScore(); var el = document.getElementById('move-history'); if (el) el.innerHTML = ''; SoundFX.shuffle(); });
}

function undoMove() {
  if (!APP.gameActive || APP.gamePaused) return;
  if (APP.puzzle.undo()) {
    APP.moves = Math.max(0, APP.moves - 1);
    SoundFX.undo();
    renderBoard();
    updateMoves();
    updateScore();
    var el = document.getElementById('move-history');
    if (el && el.lastChild) el.removeChild(el.lastChild);
  }
}

function showHint() {
  if (!APP.gameActive || APP.gamePaused) return;
  if (APP.hintsUsed >= APP.maxHints) return;
  var hint = APP.puzzle.getHint();
  if (!hint) return;
  APP.hintsUsed++;
  SoundFX.hint();
  updateHints();
  updateScore();
  var overlay = document.getElementById('hint-overlay');
  var tileNum = document.getElementById('hint-tile-num');
  if (overlay && tileNum) {
    tileNum.textContent = hint.tileNum + ' → ' + hint.direction;
    overlay.style.display = 'block';
    clearTimeout(APP.hintTimeout);
    APP.hintTimeout = setTimeout(function() { overlay.style.display = 'none'; }, 2000);
  }
  // glow effect
  var tiles = document.querySelectorAll('.tile');
  tiles.forEach(function(t) {
    if (parseInt(t.getAttribute('data-index')) === hint.tileIndex) {
      t.classList.add('hint-glow');
      setTimeout(function() { t.classList.remove('hint-glow'); }, 2000);
    }
  });
}

function togglePause() {
  var overlay = document.getElementById('pause-overlay');
  if (!overlay) return;
  APP.gamePaused = !APP.gamePaused;
  overlay.style.display = APP.gamePaused ? 'flex' : 'none';
  if (APP.gamePaused) SoundFX.pause(); else SoundFX.resume();
}

function onPuzzleComplete() {
  APP.gameActive = false;
  clearInterval(APP.timerInterval);
  SoundFX.complete();
  var diffText = APP.difficulty + '×' + APP.difficulty;
  saveGameRecord(function(resp) {
    var params = '?theme=' + encodeURIComponent(APP.themeName) +
      '&subtopic=' + encodeURIComponent(APP.subtopicName) +
      '&diff=' + encodeURIComponent(diffText) +
      '&time=' + APP.timeSpent +
      '&moves=' + APP.moves +
      '&hints=' + APP.hintsUsed +
      '&score=' + APP.score;
    if (resp && resp.new_badges && resp.new_badges.length > 0) {
      params += '&badges=' + encodeURIComponent(resp.new_badges.join(','));
    }
    window.location.href = URLS.complete + params;
  });
}

function saveGameRecord(cb) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', URLS.saveRecord);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-CSRFToken', CSRF_TOKEN);
  xhr.onload = function() { cb(JSON.parse(xhr.responseText)); };
  xhr.onerror = function() { cb(null); };
  xhr.send(JSON.stringify({
    theme_id: APP.themeId,
    theme_name: APP.themeName,
    subtopic_id: APP.subtopicId,
    subtopic_name: APP.subtopicName,
    difficulty: APP.difficulty,
    time_spent: APP.timeSpent,
    moves: APP.moves,
    hints_used: APP.hintsUsed,
    score: APP.score,
  }));
}

function bindKeyboard() {
  document.addEventListener('keydown', function(e) {
    if (!APP.gameActive || APP.gamePaused) return;
    var empty = APP.puzzle.emptyIndex;
    var size = APP.puzzle.size;
    var row = Math.floor(empty / size), col = empty % size;
    var target = -1;
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': if (row < size - 1) target = empty + size; break;
      case 'ArrowDown': case 's': case 'S': if (row > 0) target = empty - size; break;
      case 'ArrowLeft': case 'a': case 'A': if (col < size - 1) target = empty + 1; break;
      case 'ArrowRight': case 'd': case 'D': if (col > 0) target = empty - 1; break;
      case 'h': case 'H': showHint(); return;
      case 'u': case 'U': case 'z': case 'Z': undoMove(); return;
      case ' ': e.preventDefault(); togglePause(); return;
    }
    if (target >= 0) onTileClick(target);
  });
}

// ——— complete page ———
function initCompletePage() {
  var params = new URLSearchParams(window.location.search);
  var el = function(id) { return document.getElementById(id); };
  var set = function(id, val) { var e = el(id); if (e) e.textContent = val; };
  set('cs-theme', params.get('theme') || '-');
  set('cs-subtopic', params.get('subtopic') || '-');
  set('cs-diff', params.get('diff') || '-');
  set('cs-time', (params.get('time') || '0') + ' 秒');
  set('cs-moves', params.get('moves') || '0');
  set('cs-hints', params.get('hints') || '0');
  set('cs-score', params.get('score') || '0');

  var badgesStr = params.get('badges');
  if (badgesStr) {
    var badges = badgesStr.split(',');
    var container = document.getElementById('new-badges');
    if (container) {
      badges.forEach(function(b) {
        var span = document.createElement('span');
        span.className = 'badge-item earned';
        span.textContent = '🏆 ' + b;
        span.style.margin = '4px';
        container.appendChild(span);
      });
    }
  }
}

// ——— history page ———
function initHistoryPage() {
  var thumbs = document.querySelectorAll('.record-thumb');
  thumbs.forEach(function(c) {
    var tid = c.getAttribute('data-theme');
    if (tid) {
      var img = generateThemeImage(tid, 60);
      if (img) {
        var ctx2 = c.getContext('2d');
        ctx2.drawImage(img, 0, 0, 60, 60);
      }
    }
  });
}
