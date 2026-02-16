const ZOOM_LEVELS = [10, 4, 2.5, 1.7, 1.3, 1];
const MAX_GUESSES = 5;

let state = {
    puzzle: null,
    puzzleIndex: -1,
    guessNum: 0,
    guesses: [],
    won: false,
    finished: false,
    isDaily: false
};

// --- Screens ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// --- Puzzle Selection ---
function getDailyIndex() {
    const now = new Date();
    const epoch = new Date(2024, 0, 1);
    const days = Math.floor((now - epoch) / 86400000);
    return days % PUZZLES.length;
}

function startGame(puzzleIndex, isDaily) {
    state = {
        puzzle: PUZZLES[puzzleIndex],
        puzzleIndex,
        guessNum: 0,
        guesses: [],
        won: false,
        finished: false,
        isDaily
    };

    // Check localStorage for daily
    if (isDaily) {
        const saved = loadDaily();
        if (saved && saved.puzzleIndex === puzzleIndex) {
            state.guesses = saved.guesses;
            state.guessNum = saved.guessNum;
            state.won = saved.won;
            state.finished = saved.finished;
        }
    }

    setupGameUI();
    showScreen('game-screen');

    if (state.finished) {
        showResult();
    }
}

function setupGameUI() {
    const img = document.getElementById('puzzle-image');
    img.src = state.puzzle.image;
    img.style.transformOrigin = `${state.puzzle.focusX}% ${state.puzzle.focusY}%`;
    
    // Disable transition for initial load, then re-enable
    img.style.transition = 'none';
    img.style.transform = `scale(${ZOOM_LEVELS[state.guessNum]})`;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            img.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
        });
    });

    updateDots();
    updateGuessText();
    renderGuesses();
    updateCategoryHint();

    const input = document.getElementById('guess-input');
    input.value = '';
    input.disabled = state.finished;
    if (!state.finished) input.focus();
}

function updateDots() {
    const container = document.getElementById('guess-dots');
    container.innerHTML = '';
    for (let i = 0; i < MAX_GUESSES; i++) {
        const dot = document.createElement('div');
        dot.className = 'guess-dot';
        if (i < state.guessNum) {
            dot.classList.add(state.won && i === state.guessNum - 1 ? 'correct' : 'wrong');
        } else if (i === state.guessNum && !state.finished) {
            dot.classList.add('active');
        }
        container.appendChild(dot);
    }
}

function updateGuessText() {
    const el = document.getElementById('guess-text');
    if (state.finished) {
        el.textContent = state.won ? `Got it in ${state.guessNum}!` : 'No more guesses';
    } else {
        el.textContent = `Guess ${state.guessNum + 1} of ${MAX_GUESSES}`;
    }
}

function updateCategoryHint() {
    const el = document.getElementById('category-hint');
    if (state.guessNum >= 3 && !state.won) {
        el.textContent = `💡 Category: ${state.puzzle.category}`;
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function renderGuesses() {
    const list = document.getElementById('guesses-list');
    list.innerHTML = '';
    state.guesses.forEach((g, i) => {
        const item = document.createElement('div');
        item.className = 'guess-item';
        const isCorrect = state.won && i === state.guesses.length - 1;
        item.innerHTML = `<span class="icon">${isCorrect ? '✅' : '❌'}</span><span class="text" style="${isCorrect ? 'text-decoration:none;opacity:1;color:#2ecc71' : ''}">${g}</span>`;
        list.appendChild(item);
    });
}

// --- Answer Matching ---
function normalize(str) {
    return str.toLowerCase().replace(/\b(the|a|an)\b/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function checkAnswer(guess) {
    const ng = normalize(guess);
    if (!ng) return false;
    
    // Check each accepted answer
    const accepted = [normalize(state.puzzle.answer), ...state.puzzle.accept.map(normalize)];
    for (const ans of accepted) {
        if (ng === ans || ng.includes(ans) || ans.includes(ng)) return true;
        // Check keyword overlap
        const guessWords = ng.split(' ').filter(w => w.length > 2);
        const ansWords = ans.split(' ').filter(w => w.length > 2);
        const overlap = ansWords.filter(w => guessWords.includes(w));
        if (overlap.length >= Math.ceil(ansWords.length * 0.6)) return true;
    }
    return false;
}

// --- Submit Guess ---
function submitGuess() {
    if (state.finished) return;
    const input = document.getElementById('guess-input');
    const guess = input.value.trim();
    if (!guess) return;

    state.guesses.push(guess);
    state.guessNum++;

    if (checkAnswer(guess)) {
        state.won = true;
        state.finished = true;
    } else if (state.guessNum >= MAX_GUESSES) {
        state.finished = true;
    }

    // Zoom out
    const img = document.getElementById('puzzle-image');
    img.style.transform = `scale(${ZOOM_LEVELS[state.finished ? 5 : state.guessNum]})`;

    updateDots();
    updateGuessText();
    renderGuesses();
    updateCategoryHint();

    input.value = '';

    if (state.finished) {
        input.disabled = true;
        if (state.isDaily) saveDaily();
        setTimeout(() => showResult(), 1200);
    } else {
        if (state.isDaily) saveDaily();
        input.focus();
    }
}

// --- Result ---
function showResult() {
    const p = state.puzzle;
    const resultImg = document.getElementById('result-image');
    resultImg.src = p.image;
    resultImg.style.transform = 'scale(1)';

    const msg = document.getElementById('result-message');
    const emojis = ['', '🤩', '🎉', '😎', '👍', '😅'];
    if (state.won) {
        msg.className = 'result-message win';
        msg.textContent = `You got it in ${state.guessNum}/5! ${emojis[state.guessNum] || '🎉'}`;
    } else {
        msg.className = 'result-message lose';
        msg.textContent = `The answer was: ${p.answer}`;
    }

    const info = document.getElementById('result-info');
    info.innerHTML = `
        <div class="info-title">${p.answer}</div>
        <div class="info-line">${p.category}${p.artist ? ` · <span>${p.artist}</span>` : ''}${p.year ? ` · <span>${p.year}</span>` : ''}</div>
        <div class="fun-fact">💡 ${p.funFact}</div>
    `;

    showScreen('result-screen');
}

// --- Share ---
function shareResult() {
    const num = state.puzzleIndex + 1;
    const squares = state.guesses.map((_, i) => {
        if (state.won && i === state.guesses.length - 1) return '🟩';
        return '🟥';
    }).join('');

    const text = state.won
        ? `🔍 ZoomOut #${num}\n🟩 Guessed in ${state.guessNum}/5\n${squares}`
        : `🔍 ZoomOut #${num}\n🟥 ${state.guessNum}/5\n${squares}`;

    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('share-toast');
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }).catch(() => {});
}

// --- localStorage ---
function saveDaily() {
    const data = {
        date: new Date().toDateString(),
        puzzleIndex: state.puzzleIndex,
        guesses: state.guesses,
        guessNum: state.guessNum,
        won: state.won,
        finished: state.finished
    };
    localStorage.setItem('zoomout-daily', JSON.stringify(data));
}

function loadDaily() {
    try {
        const data = JSON.parse(localStorage.getItem('zoomout-daily'));
        if (data && data.date === new Date().toDateString()) return data;
    } catch (e) {}
    return null;
}

// --- Event Listeners ---
document.getElementById('btn-daily').addEventListener('click', () => startGame(getDailyIndex(), true));
document.getElementById('btn-random').addEventListener('click', () => {
    const idx = Math.floor(Math.random() * PUZZLES.length);
    startGame(idx, false);
});
document.getElementById('btn-submit').addEventListener('click', submitGuess);
document.getElementById('guess-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitGuess();
});
document.getElementById('btn-share').addEventListener('click', shareResult);
document.getElementById('btn-random-again').addEventListener('click', () => {
    const idx = Math.floor(Math.random() * PUZZLES.length);
    startGame(idx, false);
});
