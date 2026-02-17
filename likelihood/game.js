// --- AUDIO ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function ensureAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }

function playSound(type) {
  ensureAudio();
  const now = audioCtx.currentTime;
  const g = audioCtx.createGain();
  g.connect(audioCtx.destination);

  if (type === 'correct') {
    const o = audioCtx.createOscillator();
    o.type = 'sine'; o.frequency.setValueAtTime(523, now); o.frequency.setValueAtTime(659, now + 0.1);
    o.frequency.setValueAtTime(784, now + 0.2);
    g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    o.connect(g); o.start(now); o.stop(now + 0.4);
  } else if (type === 'wrong') {
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(200, now); o.frequency.setValueAtTime(150, now + 0.2);
    g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    o.connect(g); o.start(now); o.stop(now + 0.3);
  } else if (type === 'tick') {
    const o = audioCtx.createOscillator();
    o.type = 'sine'; o.frequency.setValueAtTime(880, now);
    g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    o.connect(g); o.start(now); o.stop(now + 0.05);
  } else if (type === 'fanfare') {
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const gg = audioCtx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.15);
      gg.gain.setValueAtTime(0.12, now + i * 0.15);
      gg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
      o.connect(gg); gg.connect(audioCtx.destination);
      o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.4);
    });
  }
}

// --- PARTICLES ---
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnParticles(x, y, color, count = 30) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color, size: Math.random() * 4 + 2 });
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.02;
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(animateParticles);
}
animateParticles();

// --- CONFETTI ---
function spawnConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#7f5af0', '#2cb67d', '#e16162', '#f7b731', '#ff6b6b', '#48dbfb'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + '%';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.width = Math.random() * 8 + 6 + 'px';
    el.style.height = Math.random() * 8 + 6 + 'px';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.animationDuration = Math.random() * 2 + 2 + 's';
    el.style.animationDelay = Math.random() * 1.5 + 's';
    container.appendChild(el);
  }
}

// --- GAME STATE ---
let mode = 'casual';
let currentQuestions = [];
let roundIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 15;
const ROUNDS = 5;
const TIMER_SECONDS = 15;
const letters = ['A', 'B', 'C', 'D'];

function setMode(m) {
  mode = m;
  document.getElementById('mode-casual').classList.toggle('selected', m === 'casual');
  document.getElementById('mode-timed').classList.toggle('selected', m === 'timed');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function startGame() {
  ensureAudio();
  currentQuestions = shuffle(QUESTIONS).slice(0, ROUNDS);
  roundIndex = 0;
  score = 0;
  showScreen('game');
  showRound();
}

function showRound() {
  clearTimer();
  const q = currentQuestions[roundIndex];
  document.getElementById('round-label').textContent = `Round ${roundIndex + 1}/${ROUNDS}`;
  document.getElementById('progress-fill').style.width = ((roundIndex) / ROUNDS * 100) + '%';
  document.getElementById('category-tag').textContent = q.category;
  document.getElementById('score-label').textContent = `Score: ${score}`;
  document.getElementById('question-text').textContent = q.question;
  document.getElementById('result-panel').classList.add('hidden');

  const optionsEl = document.getElementById('options');
  optionsEl.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span class="option-text">${opt}</span>`;
    btn.onclick = () => selectAnswer(i);
    optionsEl.appendChild(btn);
  });

  // Timer
  const timerBar = document.getElementById('timer-bar');
  if (mode === 'timed') {
    timerBar.classList.remove('hidden', 'danger');
    timeLeft = TIMER_SECONDS;
    document.getElementById('timer-fill').style.width = '100%';
    document.getElementById('timer-text').textContent = TIMER_SECONDS;
    timerInterval = setInterval(() => {
      timeLeft -= 0.1;
      if (timeLeft <= 5) timerBar.classList.add('danger');
      if (timeLeft <= 3 && Math.round(timeLeft * 10) % 10 === 0) playSound('tick');
      document.getElementById('timer-fill').style.width = (timeLeft / TIMER_SECONDS * 100) + '%';
      document.getElementById('timer-text').textContent = Math.ceil(timeLeft);
      if (timeLeft <= 0) { clearTimer(); selectAnswer(-1); }
    }, 100);
  } else {
    timerBar.classList.add('hidden');
  }
}

function clearTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function selectAnswer(idx) {
  clearTimer();
  const q = currentQuestions[roundIndex];
  const btns = document.querySelectorAll('.option-btn');
  const correct = q.correctIndex;
  const isCorrect = idx === correct;

  btns.forEach((btn, i) => {
    btn.classList.add('disabled');
    if (i === correct) btn.classList.add('correct');
    if (i === idx && !isCorrect) btn.classList.add('wrong');
  });

  if (isCorrect) {
    let points = 1;
    if (mode === 'timed') points = Math.max(1, Math.round(timeLeft / TIMER_SECONDS * 3));
    score += points;
    playSound('correct');
    const rect = btns[correct].getBoundingClientRect();
    spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, '#2cb67d');
  } else {
    playSound('wrong');
  }

  // Show result
  const panel = document.getElementById('result-panel');
  panel.classList.remove('hidden');
  document.getElementById('result-icon').textContent = isCorrect ? '✅' : (idx === -1 ? '⏰' : '❌');
  const answerEl = document.getElementById('result-answer');
  answerEl.textContent = `Answer: ${q.answer}`;
  answerEl.className = 'result-answer ' + (isCorrect ? 'correct-text' : 'wrong-text');
  document.getElementById('result-fact').textContent = q.fact;
  document.getElementById('score-label').textContent = `Score: ${score}`;

  setTimeout(() => {
    roundIndex++;
    if (roundIndex < ROUNDS) {
      showRound();
    } else {
      showFinal();
    }
  }, 3000);
}

function showFinal() {
  document.getElementById('progress-fill').style.width = '100%';
  showScreen('final');

  const ratings = ['Just Getting Started! 💪', 'Not Bad! Keep Going 👍', 'Solid Instincts! 🎯', 'Sharp Mind! 🧠', 'Impressive! You Know Your Odds 📊', 'Perfect! You\'re an Oracle 🔮'];
  const simpleScore = Math.min(5, mode === 'timed' ? Math.round(score / 3 * 5 / ROUNDS) : score);
  const ratingIdx = Math.min(simpleScore, 5);

  document.getElementById('final-score').textContent = mode === 'timed' ? `${score} Points` : `${score} / ${ROUNDS}`;
  document.getElementById('final-rating').textContent = ratings[ratingIdx];
  document.getElementById('final-stars').textContent = '⭐'.repeat(ratingIdx) + '☆'.repeat(5 - ratingIdx);

  if (ratingIdx >= 4) { playSound('fanfare'); spawnConfetti(); }
  else if (ratingIdx >= 3) playSound('correct');
}

function goHome() { showScreen('splash'); }

// Init
document.addEventListener('DOMContentLoaded', () => showScreen('splash'));
