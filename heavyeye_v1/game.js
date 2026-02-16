// HeavyEye Game Engine

let gameState = {
    mode: null,          // 'campaign' or 'wildcard'
    round: 0,
    totalRounds: 0,
    score: 0,
    results: [],         // [{correct: bool, matchup: {...}}]
    currentMatchup: null,
    answered: false,
    rounds: []           // selected matchups for this game
};

// === SCREEN MANAGEMENT ===
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// === GAME START ===
function startGame(mode) {
    gameState = {
        mode: mode,
        round: 0,
        totalRounds: mode === 'campaign' ? 5 : 3,
        score: 0,
        results: [],
        currentMatchup: null,
        answered: false,
        rounds: []
    };

    if (mode === 'campaign') {
        // Pick one random matchup from each difficulty tier
        gameState.rounds = CAMPAIGN_ROUNDS.map(tier => {
            return tier[Math.floor(Math.random() * tier.length)];
        });
    } else {
        // Wildcard: pick 3 random hard matchups
        const shuffled = [...WILDCARD_ROUNDS].sort(() => Math.random() - 0.5);
        gameState.rounds = shuffled.slice(0, 3);
    }

    showScreen('screen-game');
    loadRound();
}

// === LOAD ROUND ===
function loadRound() {
    const matchup = gameState.rounds[gameState.round];
    gameState.currentMatchup = matchup;
    gameState.answered = false;

    // Randomly swap sides so the heavier one isn't always on the same side
    const swap = Math.random() > 0.5;
    const displayA = swap ? matchup.b : matchup.a;
    const displayB = swap ? matchup.a : matchup.b;
    gameState.currentMatchup._displayA = displayA;
    gameState.currentMatchup._displayB = displayB;
    gameState.currentMatchup._swapped = swap;

    // Update header
    document.getElementById('mode-label').textContent = gameState.mode.toUpperCase();
    document.getElementById('round-label').textContent = `Round ${gameState.round + 1}/${gameState.totalRounds}`;
    document.getElementById('score-display').textContent = `Score: ${gameState.score}`;

    // Difficulty bar (campaign only)
    if (gameState.mode === 'campaign') {
        const pct = ((gameState.round + 1) / 5) * 100;
        const fill = document.getElementById('difficulty-fill');
        fill.style.width = pct + '%';
        const labels = ['Easy', 'Medium', 'Hard', 'Very Hard', 'Insane'];
        const colors = ['#4ade80', '#fbbf24', '#f97316', '#ef4444', '#dc2626'];
        document.getElementById('difficulty-label').textContent = labels[gameState.round];
        fill.style.background = colors[gameState.round];
    } else {
        document.getElementById('difficulty-fill').style.width = '100%';
        document.getElementById('difficulty-fill').style.background = '#e879f9';
        document.getElementById('difficulty-label').textContent = '🎲 WILD';
    }

    // Set cards
    document.getElementById('image-a').textContent = displayA.emoji;
    document.getElementById('name-a').textContent = displayA.name;
    document.getElementById('detail-a').textContent = displayA.detail;

    document.getElementById('image-b').textContent = displayB.emoji;
    document.getElementById('name-b').textContent = displayB.name;
    document.getElementById('detail-b').textContent = displayB.detail;

    // Reset card states
    const cardA = document.getElementById('card-a');
    const cardB = document.getElementById('card-b');
    cardA.className = 'card';
    cardB.className = 'card';

    // Hide weights and result
    document.getElementById('weight-a').classList.add('hidden');
    document.getElementById('weight-b').classList.add('hidden');
    document.getElementById('result-banner').classList.add('hidden');

    // Reset matchup tilt
    document.querySelector('.matchup').className = 'matchup';
}

// === MAKE GUESS ===
function makeGuess(choice) {
    if (gameState.answered) return;
    gameState.answered = true;

    const matchup = gameState.currentMatchup;
    const displayA = matchup._displayA;
    const displayB = matchup._displayB;

    const heavierSide = displayA.weight_lbs >= displayB.weight_lbs ? 'a' : 'b';
    const correct = choice === heavierSide;

    if (correct) gameState.score++;

    // Reveal weights
    const weightA = document.getElementById('weight-a');
    const weightB = document.getElementById('weight-b');
    weightA.textContent = formatWeight(displayA.weight_lbs);
    weightB.textContent = formatWeight(displayB.weight_lbs);
    weightA.classList.remove('hidden');
    weightB.classList.remove('hidden');
    weightA.classList.add('weight-reveal');
    weightB.classList.add('weight-reveal');

    // Style cards
    const cardA = document.getElementById('card-a');
    const cardB = document.getElementById('card-b');
    cardA.classList.add('disabled');
    cardB.classList.add('disabled');

    if (heavierSide === 'a') {
        cardA.classList.add('heavier');
        document.querySelector('.matchup').classList.add('tilt-left');
    } else {
        cardB.classList.add('heavier');
        document.querySelector('.matchup').classList.add('tilt-right');
    }

    if (correct) {
        document.getElementById('card-' + choice).classList.add('correct');
    } else {
        document.getElementById('card-' + choice).classList.add('wrong');
    }

    // Determine the heavier and lighter objects
    const heavier = displayA.weight_lbs >= displayB.weight_lbs ? displayA : displayB;
    const lighter = displayA.weight_lbs >= displayB.weight_lbs ? displayB : displayA;

    // Show result banner
    const banner = document.getElementById('result-banner');
    banner.classList.remove('hidden');

    document.getElementById('result-emoji').textContent = correct ? '🎉' : '😱';
    document.getElementById('result-text').textContent = correct ? 'Nailed it!' : 'Not quite!';

    // Build detail text
    let ratio;
    if (lighter.weight_lbs > 0) {
        ratio = heavier.weight_lbs / lighter.weight_lbs;
    }

    let detailText = `${heavier.name} weighs ${formatWeight(heavier.weight_lbs)}`;
    if (ratio && ratio < 10000) {
        detailText += ` — that's ${ratio.toFixed(1)}× heavier than ${lighter.name}!`;
    } else if (ratio) {
        detailText += ` — that's ${ratio.toExponential(1)}× heavier!`;
    }
    detailText += `\n\n💡 ${heavier.fun_fact}`;

    document.getElementById('result-detail').textContent = detailText;

    // Update button text
    const nextBtn = document.getElementById('next-btn');
    if (gameState.round >= gameState.totalRounds - 1) {
        nextBtn.textContent = 'See Results →';
    } else {
        nextBtn.textContent = 'Next Round →';
    }

    // Save result
    gameState.results.push({
        correct: correct,
        heavier: heavier.name,
        lighter: lighter.name
    });

    // Update score display
    document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
}

// === NEXT ROUND ===
function nextRound() {
    gameState.round++;
    if (gameState.round >= gameState.totalRounds) {
        showEndScreen();
    } else {
        loadRound();
    }
}

// === END SCREEN ===
function showEndScreen() {
    showScreen('screen-end');

    const pct = Math.round((gameState.score / gameState.totalRounds) * 100);
    let emoji, title, subtitle;

    if (pct === 100) {
        emoji = '🏆'; title = 'PERFECT!'; subtitle = "Your gut is calibrated to perfection.";
    } else if (pct >= 80) {
        emoji = '🔥'; title = 'Sharp Eye!'; subtitle = "You've got serious weight intuition.";
    } else if (pct >= 60) {
        emoji = '👀'; title = 'Not Bad!'; subtitle = "Your instincts are decent, but there's room to grow.";
    } else if (pct >= 40) {
        emoji = '🤔'; title = 'Tricky Stuff'; subtitle = "These comparisons are harder than they look!";
    } else {
        emoji = '😵‍💫'; title = 'Brain Broken'; subtitle = "Weight is weird. Don't feel bad.";
    }

    document.getElementById('end-emoji').textContent = emoji;
    document.getElementById('end-title').textContent = title;
    document.getElementById('end-subtitle').textContent = subtitle;
    document.getElementById('end-score').textContent = `${gameState.score} / ${gameState.totalRounds}`;

    // Build recap dots
    const recap = document.getElementById('end-recap');
    recap.innerHTML = '';
    gameState.results.forEach(r => {
        const dot = document.createElement('div');
        dot.className = `recap-dot ${r.correct ? 'correct' : 'wrong'}`;
        dot.textContent = r.correct ? '✓' : '✗';
        recap.appendChild(dot);
    });
}

// === SHARE ===
function shareResults() {
    const modeLabel = gameState.mode === 'campaign' ? '🏔️ Campaign' : '🎲 Wildcard';
    const dots = gameState.results.map(r => r.correct ? '🟩' : '🟥').join('');

    const text = `⚖️ HeavyEye ${modeLabel}\n${dots}\nScore: ${gameState.score}/${gameState.totalRounds}\n\nCan you beat my gut? 🧠`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.btn-share');
            const orig = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = orig, 2000);
        });
    } else {
        // Fallback
        prompt('Copy your results:', text);
    }
}
