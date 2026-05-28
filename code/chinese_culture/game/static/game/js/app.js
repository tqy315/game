/**
 * Main application logic for the Chinese Culture Puzzle game.
 */
(function () {
    'use strict';

    // ========== Background Particles (all pages) ==========
    if (document.getElementById('bgParticles')) {
        createParticles();
    }

    function createParticles() {
        const container = document.getElementById('bgParticles');
        if (!container) return;
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = particle.style.height = (Math.random() * 4 + 2) + 'px';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (Math.random() * 6 + 6) + 's';
            container.appendChild(particle);
        }
    }

    // ========== User Dropdown Menu (all pages) ==========
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }

    // ========== Message Toast Auto-Dismiss ==========
    const toasts = document.querySelectorAll('.message-toast');
    toasts.forEach(t => {
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 3500);
    });

    // ========== Puzzle Page Only ==========
    if (!window.PUZZLE_DATA) return;

    const PUZZLE = window.PUZZLE_DATA;

    // ---- State ----
    let engine = null;
    let currentSize = 3;
    let timerInterval = null;
    let seconds = 0;
    let hintCount = 0;
    let gameStarted = false;
    let pointsEarned = 0;
    let saveInProgress = false;
    let hasImageData = false;
    let imageUrls = [];
    let imageRefUrl = '';

    // ---- DOM Elements ----
    const board = document.getElementById('puzzleBoard');
    const timerEl = document.getElementById('timer');
    const moveCountEl = document.getElementById('moveCount');
    const hintCountEl = document.getElementById('hintCount');
    const winMessage = document.getElementById('winMessage');
    const winTime = document.getElementById('winTime');
    const winMoves = document.getElementById('winMoves');
    const winHints = document.getElementById('winHints');
    const winPoints = document.getElementById('winPoints');
    const winPointsBlock = document.getElementById('winPointsBlock');
    const btnHint = document.getElementById('btnHint');
    const btnShuffle = document.getElementById('btnShuffle');
    const btnReset = document.getElementById('btnReset');
    const btnPlayAgain = document.getElementById('btnPlayAgain');
    const diffBtns = document.querySelectorAll('.diff-btn');
    const pointsEl = document.querySelector('.points-value');

    // ---- Color palette for tiles ----
    const TILE_COLORS_3 = [
        '#c41e3a', '#e8481e', '#c48a1e',
        '#3a8b1e', '#1e7a8b', '#8b1e8b',
        '#4a6cf7', '#c8a96e', ''
    ];

    const TILE_COLORS_4 = [
        '#c41e3a', '#d43f2a', '#e8481e', '#f06020',
        '#c48a1e', '#d4a030', '#3a8b1e', '#4d9f28',
        '#1e7a8b', '#2d8fa0', '#8b1e8b', '#a030a0',
        '#4a6cf7', '#6d8af8', '#c8a96e', ''
    ];

    // ---- Initialization ----
    function initPuzzle(size) {
        if (size !== 3 && size !== 4) size = 3;
        currentSize = size;
        engine = new PuzzleEngine(size);
        engine.shuffle(120);
        seconds = 0;
        hintCount = 0;
        gameStarted = false;
        pointsEarned = 0;
        saveInProgress = false;

        // Detect image data for current difficulty
        const imgData = PUZZLE.imageData && PUZZLE.imageData[String(size)];
        if (imgData && imgData.urls && imgData.urls.length >= size * size) {
            hasImageData = true;
            imageUrls = imgData.urls;
            imageRefUrl = imgData.referenceUrl || '';
        } else {
            hasImageData = false;
            imageUrls = [];
            imageRefUrl = '';
        }

        updateTargetImage();
        updateStats();
        renderBoard();
        stopTimer();
        timerEl.textContent = '00:00';
        winMessage.classList.add('hidden');
    }

    function updateTargetImage() {
        const targetImg = document.getElementById('targetImage');
        const targetLabel = document.getElementById('targetLabel');
        if (!targetImg || !targetLabel) return;

        if (hasImageData && imageRefUrl) {
            targetImg.src = imageRefUrl;
            targetImg.style.display = 'block';
        } else {
            targetImg.style.display = 'none';
        }
    }

    function renderBoard() {
        board.innerHTML = '';
        board.className = 'puzzle-board size-' + currentSize;
        if (hasImageData) board.classList.add('image-mode');

        const colors = currentSize === 3 ? TILE_COLORS_3 : TILE_COLORS_4;
        const N = engine.N;

        board.style.gridTemplateColumns = `repeat(${currentSize}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${currentSize}, 1fr)`;

        for (let i = 0; i < N; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.index = i;

            const val = engine.state[i];
            if (val === 0) {
                tile.classList.add('empty');
            } else if (hasImageData) {
                tile.classList.add('image-tile');
                tile.style.backgroundImage = `url(${imageUrls[val - 1]})`;
                tile.style.backgroundSize = '100% 100%';
                tile.style.backgroundPosition = 'center';
                tile.style.backgroundRepeat = 'no-repeat';
                tile.addEventListener('click', () => onTileClick(i));
            } else {
                tile.textContent = val;
                tile.style.background = colors[val - 1] || '#555';
                tile.addEventListener('click', () => onTileClick(i));
            }

            board.appendChild(tile);
        }
    }

    // ---- Game Logic ----
    function onTileClick(index) {
        if (!engine) return;
        if (winMessage && !winMessage.classList.contains('hidden')) return;

        const success = engine.moveTile(index);
        if (success) {
            if (!gameStarted) {
                gameStarted = true;
                startTimer();
            }
            renderBoard();
            updateStats();

            if (engine.isSolved()) {
                onWin();
            }
        }
    }

    function updateStats() {
        if (!engine) return;
        moveCountEl.textContent = engine.moves;
        hintCountEl.textContent = hintCount;
    }

    // ---- Timer ----
    function startTimer() {
        stopTimer();
        timerInterval = setInterval(() => {
            seconds++;
            timerEl.textContent = formatTime(seconds);
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }

    // ---- Win ----
    function onWin() {
        stopTimer();
        winTime.textContent = formatTime(seconds);
        winMoves.textContent = engine.moves;
        winHints.textContent = hintCount;

        // Calculate local points estimate
        const basePoints = currentSize === 3 ? 100 : 200;
        const timeBonus = currentSize === 3
            ? Math.max(0, 30 - seconds) * 2
            : Math.max(0, 60 - seconds);
        const hintPenalty = hintCount * 20;
        pointsEarned = Math.max(10, basePoints + timeBonus - hintPenalty);
        winPoints.textContent = '+' + pointsEarned;

        winMessage.classList.remove('hidden');

        // Save result to server
        saveResult();
    }

    function saveResult() {
        if (!PUZZLE.isAuthenticated || saveInProgress) return;
        saveInProgress = true;

        const body = JSON.stringify({
            theme_id: PUZZLE.themeId,
            theme_name: PUZZLE.themeName,
            item_name: PUZZLE.itemName,
            difficulty: String(currentSize),
            time_seconds: seconds,
            moves: engine.moves,
            hints_used: hintCount,
        });

        fetch(PUZZLE.saveUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': PUZZLE.csrfToken,
            },
            body: body,
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                winPoints.textContent = '+' + data.points_earned;
                pointsEarned = data.points_earned;
                // Update points in header
                if (pointsEl) {
                    pointsEl.textContent = data.total_points;
                }
            }
        })
        .catch(() => {})
        .finally(() => { saveInProgress = false; });
    }

    // ---- Button Handlers ----
    let hintPending = false;

    function onHint() {
        if (!engine || !gameStarted) return;
        if (engine.isSolved()) return;
        if (hintPending) return;

        hintPending = true;
        const body = JSON.stringify({
            state: Array.from(engine.state),
            size: currentSize,
        });

        fetch(PUZZLE.hintUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': PUZZLE.csrfToken,
            },
            body: body,
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok && data.hint_index !== undefined) {
                hintCount++;
                updateStats();

                const tiles = board.querySelectorAll('.tile');
                const targetTile = tiles[data.hint_index];
                if (targetTile && !targetTile.classList.contains('empty')) {
                    targetTile.classList.add('hint-highlight');
                    setTimeout(() => targetTile.classList.remove('hint-highlight'), 1500);
                }
            }
        })
        .catch(() => {})
        .finally(() => { hintPending = false; });
    }

    function onShuffle() {
        if (!engine) return;
        engine.shuffle(120);
        seconds = 0;
        hintCount = 0;
        gameStarted = false;
        pointsEarned = 0;
        timerEl.textContent = '00:00';
        winMessage.classList.add('hidden');
        updateStats();
        renderBoard();
        stopTimer();
    }

    function onReset() {
        if (!engine) return;
        engine.initState();
        seconds = 0;
        hintCount = 0;
        gameStarted = false;
        pointsEarned = 0;
        timerEl.textContent = '00:00';
        winMessage.classList.add('hidden');
        updateStats();
        renderBoard();
        stopTimer();
    }

    function onDifficultyChange(size) {
        stopTimer();
        initPuzzle(size);

        // Switch target image for the new difficulty
        const targetImg = document.getElementById('targetImage');
        if (targetImg && hasImageData) {
            const imgData = PUZZLE.imageData && PUZZLE.imageData[String(size)];
            if (imgData && imgData.referenceUrl) {
                targetImg.src = imgData.referenceUrl;
                targetImg.style.display = 'block';
            }
        }

        diffBtns.forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.size) === size);
        });
    }

    // ---- Keyboard Controls ----
    function onKeyDown(e) {
        if (!engine || !gameStarted) return;
        if (winMessage && !winMessage.classList.contains('hidden')) return;

        let targetIdx = -1;
        const er = Math.floor(engine.emptyIndex / currentSize);
        const ec = engine.emptyIndex % currentSize;

        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W':
                if (er < currentSize - 1) targetIdx = (er + 1) * currentSize + ec;
                break;
            case 'ArrowDown': case 's': case 'S':
                if (er > 0) targetIdx = (er - 1) * currentSize + ec;
                break;
            case 'ArrowLeft': case 'a': case 'A':
                if (ec < currentSize - 1) targetIdx = er * currentSize + (ec + 1);
                break;
            case 'ArrowRight': case 'd': case 'D':
                if (ec > 0) targetIdx = er * currentSize + (ec - 1);
                break;
            case 'h': case 'H':
                e.preventDefault();
                onHint();
                return;
            default:
                return;
        }

        if (targetIdx >= 0) {
            e.preventDefault();
            onTileClick(targetIdx);
        }
    }

    // ---- Event Bindings ----
    btnHint.addEventListener('click', onHint);
    btnShuffle.addEventListener('click', onShuffle);
    btnReset.addEventListener('click', onReset);
    if (btnPlayAgain) btnPlayAgain.addEventListener('click', onShuffle);

    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const size = parseInt(btn.dataset.size);
            if (size !== currentSize) onDifficultyChange(size);
        });
    });

    document.addEventListener('keydown', onKeyDown);

    // ---- Initialize ----
    initPuzzle(3);
    diffBtns.forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.size) === 3);
    });

})();
