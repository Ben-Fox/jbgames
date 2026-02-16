// ═══════════════════════════════════════════
// MAGNITUDE — Earthquake Engineering Game
// ═══════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ── Constants ──
const GRID = 40;
const GRAVITY = 600;
const DAMPING = 0.98;
const SUB_STEPS = 8;
const GROUND_Y_RATIO = 0.82;
const JOINT_RADIUS = 8;
const SNAP_DIST = 20;

const MATERIALS = {
  wood:  { cost: 1, stiffness: 3000, maxStress: 120, weight: 1.0, color: '#c8874a', snapColor: '#8B5E3C', label: '🪵', tensionOnly: false },
  steel: { cost: 3, stiffness: 8000, maxStress: 350, weight: 2.5, color: '#8899aa', snapColor: '#ffaa00', label: '🔩', tensionOnly: false },
  cable: { cost: 2, stiffness: 2000, maxStress: 200, weight: 0.0, color: '#44aaff', snapColor: '#0066cc', label: '🔗', tensionOnly: true },
};

const LEVELS = [
  { name: "First Steps",       height: 120, budget: 12, targetMag: 3.0 },
  { name: "Getting Taller",    height: 160, budget: 15, targetMag: 3.5 },
  { name: "Triangle Power",    height: 200, budget: 18, targetMag: 4.0 },
  { name: "Steel Nerves",      height: 240, budget: 22, targetMag: 4.5 },
  { name: "Cable Bracing",     height: 280, budget: 25, targetMag: 5.0 },
  { name: "Sky High",          height: 320, budget: 28, targetMag: 5.5 },
  { name: "The Swayer",        height: 360, budget: 30, targetMag: 6.0 },
  { name: "Magnitude 7",       height: 400, budget: 24, targetMag: 7.0 },
  { name: "Impossible Tower",  height: 440, budget: 20, targetMag: 7.5 },
  { name: "God of Structures", height: 480, budget: 18, targetMag: 8.0 },
];

// ── State ──
let W, H, groundY;
let joints = [], beams = [], particles = [], debris = [];
let selectedMat = 'wood';
let selectedJoint = null;
let deleteMode = false;
let phase = 'build'; // build, shake, aftershock, done
let currentLevel = 0;
let budgetUsed = 0;
let undoStack = [];
let bestScores = JSON.parse(localStorage.getItem('magnitude_scores') || '{}');
let unlockedLevel = parseInt(localStorage.getItem('magnitude_unlocked') || '0');

// Shake state
let shakeTime = 0;
let shakeMagnitude = 0;
let targetMagnitude = 0;
let shakePhaseNum = 0; // 0=main, 1=aftershock
let groundOffsetX = 0;
let screenShakeX = 0, screenShakeY = 0;
let maxSurvivedMag = 0;
let rescuePerson = null;
let survived = false;
let richterTestMode = false;
let richterMag = 0;

// ── Resize ──
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  groundY = H * GROUND_Y_RATIO;
}
window.addEventListener('resize', resize);
resize();

// ── Joint/Beam classes ──
function makeJoint(x, y, fixed) {
  return { x, y, ox: x, oy: y, vx: 0, vy: 0, fixed, mass: 1 };
}

function makeBeam(j1, j2, mat) {
  const dx = j2.x - j1.x, dy = j2.y - j1.y;
  const restLen = Math.sqrt(dx*dx + dy*dy);
  return { j1, j2, mat, restLen, stress: 0, broken: false, weakened: false, maxStressMul: 1.0 };
}

// ── Snap to grid/existing joint ──
function snapPos(mx, my) {
  // Snap to existing joint first
  for (const j of joints) {
    const d = Math.hypot(mx - j.x, my - j.y);
    if (d < SNAP_DIST) return { x: j.x, y: j.y, joint: j };
  }
  // Snap to grid
  const gx = Math.round(mx / GRID) * GRID;
  const gy = Math.round(my / GRID) * GRID;
  return { x: gx, y: gy, joint: null };
}

function findJointAt(x, y) {
  for (const j of joints) {
    if (Math.hypot(x - j.x, y - j.y) < SNAP_DIST) return j;
  }
  return null;
}

function beamExists(j1, j2) {
  return beams.some(b => !b.broken && ((b.j1 === j1 && b.j2 === j2) || (b.j1 === j2 && b.j2 === j1)));
}

function getBeamCost() { return MATERIALS[selectedMat].cost; }

function updateBudgetUI() {
  const lvl = LEVELS[currentLevel];
  document.getElementById('budget-val').textContent = lvl.budget - budgetUsed;
  document.getElementById('budget-max').textContent = lvl.budget;
}

// ── Save undo state ──
function saveUndo() {
  undoStack.push({
    joints: joints.map(j => ({ ...j })),
    beams: beams.map(b => ({ j1i: joints.indexOf(b.j1), j2i: joints.indexOf(b.j2), mat: b.mat, restLen: b.restLen })),
    budgetUsed
  });
  if (undoStack.length > 50) undoStack.shift();
}

function doUndo() {
  if (!undoStack.length || phase !== 'build') return;
  const state = undoStack.pop();
  joints = state.joints.map(j => makeJoint(j.x, j.y, j.fixed));
  beams = state.beams.map(b => {
    const beam = makeBeam(joints[b.j1i], joints[b.j2i], b.mat);
    beam.restLen = b.restLen;
    return beam;
  });
  budgetUsed = state.budgetUsed;
  selectedJoint = null;
  updateBudgetUI();
}

// ── Level Setup ──
function loadLevel(idx) {
  currentLevel = idx;
  const lvl = LEVELS[idx];
  joints = [];
  beams = [];
  particles = [];
  debris = [];
  budgetUsed = 0;
  undoStack = [];
  selectedJoint = null;
  deleteMode = false;
  phase = 'build';
  shakeTime = 0;
  maxSurvivedMag = 0;
  richterTestMode = false;

  // Place ground joints
  const startX = W * 0.2;
  const endX = W * 0.8;
  for (let x = startX; x <= endX; x += GRID) {
    joints.push(makeJoint(x, groundY, true));
  }

  // Rescue person target
  rescuePerson = { y: groundY - lvl.height, alive: true, panicFrame: 0 };

  document.getElementById('level-num').textContent = idx + 1;
  document.getElementById('level-name').textContent = lvl.name;
  document.getElementById('height-val').textContent = lvl.height;
  updateBudgetUI();

  document.getElementById('btn-shake').classList.remove('hidden');
  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('btn-retry').classList.add('hidden');
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('level-select').classList.add('hidden');
}

// ── Input Handling ──
let pointerDown = false;
let hoverPos = null;

function getCanvasPos(e) {
  const r = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
  return { x, y };
}

canvas.addEventListener('pointerdown', (e) => {
  if (phase !== 'build') return;
  const pos = getCanvasPos(e);

  if (deleteMode) {
    // Delete nearest beam
    let best = null, bestD = 20;
    for (const b of beams) {
      if (b.broken) continue;
      const mx = (b.j1.x + b.j2.x) / 2, my = (b.j1.y + b.j2.y) / 2;
      const d = Math.hypot(pos.x - mx, pos.y - my);
      if (d < bestD) { bestD = d; best = b; }
    }
    if (best) {
      saveUndo();
      budgetUsed -= MATERIALS[best.mat].cost;
      beams.splice(beams.indexOf(best), 1);
      // Clean orphan joints (non-ground, no beams)
      joints = joints.filter(j => j.fixed || beams.some(b => b.j1 === j || b.j2 === j));
      updateBudgetUI();
    }
    return;
  }

  const snap = snapPos(pos.x, pos.y);
  let joint = snap.joint || findJointAt(snap.x, snap.y);

  if (!selectedJoint) {
    // First click — select or create joint
    if (!joint) {
      if (snap.y >= groundY - 2) return; // Don't create above ground level in wrong spot
      saveUndo();
      joint = makeJoint(snap.x, snap.y, snap.y >= groundY - 2);
      joints.push(joint);
    }
    selectedJoint = joint;
  } else {
    // Second click — connect
    if (!joint) {
      if (snap.y > groundY + 2) { selectedJoint = null; return; }
      saveUndo();
      joint = makeJoint(snap.x, snap.y, snap.y >= groundY - 2);
      joints.push(joint);
    }
    if (joint !== selectedJoint && !beamExists(selectedJoint, joint)) {
      const cost = getBeamCost();
      if (budgetUsed + cost <= LEVELS[currentLevel].budget) {
        saveUndo();
        beams.push(makeBeam(selectedJoint, joint, selectedMat));
        budgetUsed += cost;
        updateBudgetUI();
        // Chain: new selection = second joint
        selectedJoint = joint;
      } else {
        selectedJoint = null;
      }
    } else {
      selectedJoint = joint === selectedJoint ? null : joint;
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  hoverPos = getCanvasPos(e);
});

canvas.addEventListener('pointerup', () => { pointerDown = false; });

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { selectedJoint = null; deleteMode = false; }
  if (e.key === 'z' && e.ctrlKey) doUndo();
  if (e.key === '1') selectMat('wood');
  if (e.key === '2') selectMat('steel');
  if (e.key === '3') selectMat('cable');
  if (e.key === 'd') toggleDelete();
});

// ── UI Buttons ──
function selectMat(mat) {
  selectedMat = mat;
  deleteMode = false;
  document.querySelectorAll('.mat-btn').forEach(b => b.classList.toggle('selected', b.dataset.mat === mat));
}

document.querySelectorAll('.mat-btn').forEach(btn => {
  btn.addEventListener('click', () => selectMat(btn.dataset.mat));
});

function toggleDelete() {
  deleteMode = !deleteMode;
  document.getElementById('btn-delete').style.borderColor = deleteMode ? '#ff4444' : '#555';
  selectedJoint = null;
}

document.getElementById('btn-delete').addEventListener('click', toggleDelete);
document.getElementById('btn-undo').addEventListener('click', doUndo);
document.getElementById('btn-clear').addEventListener('click', () => {
  if (phase !== 'build') return;
  saveUndo();
  // Keep only ground joints
  beams = [];
  joints = joints.filter(j => j.fixed);
  budgetUsed = 0;
  selectedJoint = null;
  updateBudgetUI();
});

document.getElementById('btn-shake').addEventListener('click', startShake);
document.getElementById('btn-retry').addEventListener('click', () => loadLevel(currentLevel));
document.getElementById('btn-next').addEventListener('click', () => {
  if (currentLevel < LEVELS.length - 1) loadLevel(currentLevel + 1);
});

document.getElementById('btn-menu').addEventListener('click', showLevelSelect);
document.getElementById('btn-close-levels').addEventListener('click', () => {
  document.getElementById('level-select').classList.add('hidden');
});

function showLevelSelect() {
  const list = document.getElementById('level-list');
  list.innerHTML = '';
  LEVELS.forEach((lvl, i) => {
    const div = document.createElement('div');
    div.className = 'level-item' + (i > unlockedLevel ? ' locked' : '');
    const best = bestScores[i] ? `Best: ${bestScores[i].toFixed(1)}` : '';
    div.innerHTML = `<span>${i+1}. ${lvl.name}</span><span class="best">${best}</span>`;
    if (i <= unlockedLevel) div.addEventListener('click', () => loadLevel(i));
    list.appendChild(div);
  });
  document.getElementById('level-select').classList.remove('hidden');
}

// ── Physics ──
function startShake() {
  if (phase !== 'build') return;
  // Check there's at least one non-ground joint
  if (!joints.some(j => !j.fixed)) return;

  phase = 'shake';
  shakeTime = 0;
  shakePhaseNum = 0;
  shakeMagnitude = 0;
  targetMagnitude = LEVELS[currentLevel].targetMag;
  maxSurvivedMag = 0;
  survived = false;
  richterTestMode = false;

  document.getElementById('btn-shake').classList.add('hidden');

  // Set masses based on connected beams
  for (const j of joints) {
    if (j.fixed) continue;
    j.vx = 0; j.vy = 0;
    j.mass = 0.5;
  }
  for (const b of beams) {
    const w = MATERIALS[b.mat].weight * b.restLen / 200;
    if (!b.j1.fixed) b.j1.mass += w;
    if (!b.j2.fixed) b.j2.mass += w;
  }
}

function quakeOffset(t, mag) {
  const amp = mag * 8;
  const freq = 2 + mag * 0.8;
  return amp * Math.sin(t * freq * Math.PI * 2) * Math.cos(t * freq * 0.7)
    + amp * 0.3 * Math.sin(t * freq * 3.7 + 1.3)
    + (Math.random() - 0.5) * amp * 0.5;
}

function physicsTick(dt) {
  const subDt = dt / SUB_STEPS;

  for (let step = 0; step < SUB_STEPS; step++) {
    // Ground oscillation
    if (phase === 'shake' || phase === 'aftershock') {
      groundOffsetX = quakeOffset(shakeTime, shakeMagnitude);
      for (const j of joints) {
        if (j.fixed) { j.x = j.ox + groundOffsetX; }
      }
    }

    // Spring forces
    for (const b of beams) {
      if (b.broken) continue;
      const dx = b.j2.x - b.j1.x, dy = b.j2.y - b.j1.y;
      const len = Math.sqrt(dx*dx + dy*dy) || 0.001;
      const strain = (len - b.restLen) / b.restLen;
      const mat = MATERIALS[b.mat];

      // Cable: tension only
      if (mat.tensionOnly && strain < 0) { b.stress = 0; continue; }

      const force = mat.stiffness * strain;
      b.stress = Math.abs(force);

      const fx = (dx / len) * force;
      const fy = (dy / len) * force;

      if (!b.j1.fixed) { b.j1.vx += fx / b.j1.mass * subDt; b.j1.vy += fy / b.j1.mass * subDt; }
      if (!b.j2.fixed) { b.j2.vx -= fx / b.j2.mass * subDt; b.j2.vy -= fy / b.j2.mass * subDt; }

      // Check break
      const maxS = mat.maxStress * b.maxStressMul;
      if (b.stress > maxS) {
        b.broken = true;
        spawnBreakParticles(b);
      }
    }

    // Gravity + integrate
    for (const j of joints) {
      if (j.fixed) continue;
      j.vy += GRAVITY * subDt;
      j.vx *= DAMPING;
      j.vy *= DAMPING;
      j.x += j.vx * subDt;
      j.y += j.vy * subDt;

      // Floor collision
      if (j.y > groundY) {
        j.y = groundY;
        j.vy = -j.vy * 0.3;
        j.vx *= 0.8;
      }
      // Walls
      if (j.x < 0) { j.x = 0; j.vx = Math.abs(j.vx) * 0.5; }
      if (j.x > W) { j.x = W; j.vx = -Math.abs(j.vx) * 0.5; }
    }
  }
}

function updateShake(dt) {
  shakeTime += dt;

  if (phase === 'shake') {
    // Ramp up magnitude over ~4 seconds
    const rampTime = 4;
    const t = Math.min(shakeTime / rampTime, 1);
    shakeMagnitude = targetMagnitude * t;

    if (shakeTime > rampTime + 3) {
      // Survived main quake
      if (checkRescueAlive()) {
        maxSurvivedMag = targetMagnitude;
        // Start aftershock
        phase = 'aftershock';
        shakeTime = 0;
        shakeMagnitude = 0;
        // Weaken damaged beams
        for (const b of beams) {
          if (!b.broken && b.stress > MATERIALS[b.mat].maxStress * b.maxStressMul * 0.5) {
            b.weakened = true;
            b.maxStressMul *= 0.6;
          }
        }
      } else {
        finishShake(false);
      }
    }
  } else if (phase === 'aftershock') {
    // Random aftershock
    const afterMag = targetMagnitude * (0.4 + Math.random() * 0.3);
    const rampTime = 2;
    const t = Math.min(shakeTime / rampTime, 1);
    shakeMagnitude = afterMag * t * Math.max(0, 1 - (shakeTime - rampTime) / 3);

    if (shakeTime > rampTime + 3) {
      if (checkRescueAlive()) {
        if (richterTestMode) {
          // Keep going, increase magnitude
          richterMag += 0.5;
          targetMagnitude = richterMag;
          phase = 'shake';
          shakeTime = 0;
          shakeMagnitude = 0;
        } else {
          // Start Richter test
          richterTestMode = true;
          richterMag = targetMagnitude + 0.5;
          targetMagnitude = richterMag;
          phase = 'shake';
          shakeTime = 0;
          shakeMagnitude = 0;
          maxSurvivedMag = LEVELS[currentLevel].targetMag;
        }
      } else {
        finishShake(richterTestMode || maxSurvivedMag >= LEVELS[currentLevel].targetMag);
      }
    }
  }

  // Check if structure totally collapsed during shake
  if (phase === 'shake' || phase === 'aftershock') {
    if (!checkRescueAlive() && !richterTestMode && shakeMagnitude >= targetMagnitude * 0.9) {
      finishShake(false);
    }
  }

  // Screen shake
  if (phase === 'shake' || phase === 'aftershock') {
    screenShakeX = (Math.random() - 0.5) * shakeMagnitude * 3;
    screenShakeY = (Math.random() - 0.5) * shakeMagnitude * 2;
  } else {
    screenShakeX *= 0.9;
    screenShakeY *= 0.9;
  }
}

function checkRescueAlive() {
  if (!rescuePerson) return true;
  // Find highest non-ground joint
  let highestY = groundY;
  for (const j of joints) {
    if (!j.fixed && j.y < highestY && beams.some(b => !b.broken && (b.j1 === j || b.j2 === j))) {
      highestY = j.y;
    }
  }
  const survivalLine = rescuePerson.y + 30;
  rescuePerson.alive = highestY < survivalLine;
  return rescuePerson.alive;
}

function finishShake(win) {
  phase = 'done';
  survived = win;
  shakeMagnitude = 0;
  groundOffsetX = 0;

  // Reset ground joints
  for (const j of joints) {
    if (j.fixed) j.x = j.ox;
  }

  const finalMag = richterTestMode ? (richterMag - 0.5) : (win ? targetMagnitude : shakeMagnitude);
  maxSurvivedMag = Math.max(maxSurvivedMag, finalMag);

  // Save score
  if (win) {
    if (!bestScores[currentLevel] || maxSurvivedMag > bestScores[currentLevel]) {
      bestScores[currentLevel] = maxSurvivedMag;
      localStorage.setItem('magnitude_scores', JSON.stringify(bestScores));
    }
    if (currentLevel >= unlockedLevel) {
      unlockedLevel = Math.min(currentLevel + 1, LEVELS.length - 1);
      localStorage.setItem('magnitude_unlocked', unlockedLevel);
    }
  }

  showResult(win, maxSurvivedMag);
}

function showResult(win, mag) {
  const rs = document.getElementById('result-screen');
  const title = document.getElementById('result-title');
  const magDiv = document.getElementById('result-magnitude');
  const details = document.getElementById('result-details');
  const buttons = document.getElementById('result-buttons');

  title.textContent = win ? '🏗️ SURVIVED!' : '💥 COLLAPSED!';
  title.style.color = win ? '#44ff44' : '#ff4444';
  magDiv.textContent = `${mag.toFixed(1)} Richter`;
  magDiv.style.color = '#ffd700';

  const beamsLeft = beams.filter(b => !b.broken).length;
  const totalBeams = beams.length;
  const efficiency = totalBeams > 0 ? Math.round((beamsLeft / totalBeams) * 100) : 0;
  details.innerHTML = `
    Beams intact: ${beamsLeft}/${totalBeams} (${efficiency}%)<br>
    Budget used: ${budgetUsed}/${LEVELS[currentLevel].budget}<br>
    ${win ? `Max magnitude survived: ${mag.toFixed(1)}` : 'Structure failed!'}
  `;

  buttons.innerHTML = '';
  const retryBtn = document.createElement('button');
  retryBtn.textContent = '🔄 Retry';
  retryBtn.className = 'result-btn-retry';
  retryBtn.onclick = () => { rs.classList.add('hidden'); loadLevel(currentLevel); };
  buttons.appendChild(retryBtn);

  if (win && currentLevel < LEVELS.length - 1) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next Level →';
    nextBtn.className = 'result-btn-next';
    nextBtn.onclick = () => { rs.classList.add('hidden'); loadLevel(currentLevel + 1); };
    buttons.appendChild(nextBtn);
  }

  rs.classList.remove('hidden');
  document.getElementById('btn-retry').classList.remove('hidden');
  if (win && currentLevel < LEVELS.length - 1) document.getElementById('btn-next').classList.remove('hidden');
}

// ── Particles ──
function spawnBreakParticles(beam) {
  const mx = (beam.j1.x + beam.j2.x) / 2;
  const my = (beam.j1.y + beam.j2.y) / 2;
  const mat = MATERIALS[beam.mat];
  const isWood = beam.mat === 'wood';
  const count = isWood ? 12 : 8;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: mx + (Math.random() - 0.5) * 20,
      y: my + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 300,
      vy: (Math.random() - 0.5) * 300 - 100,
      life: 1,
      decay: 0.5 + Math.random() * 0.5,
      size: isWood ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
      color: mat.snapColor,
      isSpark: beam.mat === 'steel',
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ── Drawing ──
function draw() {
  ctx.save();
  ctx.translate(screenShakeX, screenShakeY);

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-20, -20, W + 40, H + 40);

  // Grid
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += GRID) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += GRID) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Ground
  ctx.fillStyle = '#2a2a4e';
  ctx.fillRect(-20, groundY, W + 40, H - groundY + 20);
  ctx.strokeStyle = '#00ffff44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-20, groundY);
  ctx.lineTo(W + 20, groundY);
  ctx.stroke();

  // Survival line
  if (rescuePerson) {
    const sy = rescuePerson.y + 30;
    ctx.strokeStyle = '#ff444488';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(W, sy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ff444466';
    ctx.font = '11px Courier New';
    ctx.fillText('SURVIVAL LINE', 10, sy - 4);

    // Height marker
    ctx.strokeStyle = '#00ffff33';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, rescuePerson.y);
    ctx.lineTo(W, rescuePerson.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#00ffff44';
    ctx.fillText(`TARGET HEIGHT: ${LEVELS[currentLevel].height}px`, 10, rescuePerson.y - 4);
  }

  // Beams
  for (const b of beams) {
    if (b.broken) continue;
    const mat = MATERIALS[b.mat];
    const maxS = mat.maxStress * b.maxStressMul;
    const ratio = Math.min(b.stress / maxS, 1);

    let color;
    if (phase === 'build') {
      color = mat.color;
    } else {
      if (ratio < 0.5) color = lerpColor('#44ff44', '#ffff00', ratio * 2);
      else color = lerpColor('#ffff00', '#ff2222', (ratio - 0.5) * 2);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = b.mat === 'cable' ? 2 : (b.mat === 'steel' ? 5 : 4);
    if (b.mat === 'cable') ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(b.j1.x, b.j1.y);
    ctx.lineTo(b.j2.x, b.j2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Weakened indicator
    if (b.weakened) {
      ctx.strokeStyle = '#ff880044';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(b.j1.x, b.j1.y);
      ctx.lineTo(b.j2.x, b.j2.y);
      ctx.stroke();
    }
  }

  // Joints
  for (const j of joints) {
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.fixed ? 5 : JOINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = j.fixed ? '#666' : (j === selectedJoint ? '#00ffff' : '#aabbcc');
    ctx.fill();
    if (j === selectedJoint) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Hover preview
  if (phase === 'build' && hoverPos && selectedJoint && !deleteMode) {
    const snap = snapPos(hoverPos.x, hoverPos.y);
    ctx.strokeStyle = '#00ffff44';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(selectedJoint.x, selectedJoint.y);
    ctx.lineTo(snap.x, snap.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(snap.x, snap.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ffff66';
    ctx.stroke();
  }

  // Rescue person
  if (rescuePerson) {
    let highestY = groundY;
    for (const j of joints) {
      if (!j.fixed && j.y < highestY && beams.some(b => !b.broken && (b.j1 === j || b.j2 === j))) {
        highestY = j.y;
      }
    }
    const personY = Math.min(highestY - 15, rescuePerson.y);
    const personX = W / 2;
    const shaking = (phase === 'shake' || phase === 'aftershock');
    const wobble = shaking ? Math.sin(Date.now() / 50) * 5 : 0;

    // Body
    ctx.fillStyle = rescuePerson.alive ? '#ffcc00' : '#ff4444';
    // Head
    ctx.beginPath();
    ctx.arc(personX + wobble, personY - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(personX + wobble, personY - 4);
    ctx.lineTo(personX + wobble, personY + 8);
    ctx.stroke();
    // Arms
    const armWave = shaking ? Math.sin(Date.now() / 80) * 15 : 0;
    ctx.beginPath();
    ctx.moveTo(personX + wobble - 8, personY + armWave);
    ctx.lineTo(personX + wobble + 8, personY - armWave);
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(personX + wobble, personY + 8);
    ctx.lineTo(personX + wobble - 5, personY + 16);
    ctx.moveTo(personX + wobble, personY + 8);
    ctx.lineTo(personX + wobble + 5, personY + 16);
    ctx.stroke();

    // Panic text
    if (shaking && rescuePerson.alive) {
      ctx.fillStyle = '#ffffff88';
      ctx.font = '10px Courier New';
      const panics = ['HELP!', 'AHHH!', '😱', 'NOOO!'];
      const pi = Math.floor(Date.now() / 300) % panics.length;
      ctx.fillText(panics[pi], personX + 12 + wobble, personY - 8);
    }
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    if (p.isSpark) {
      ctx.fillStyle = Math.random() > 0.5 ? '#ffaa00' : '#ffffff';
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // Magnitude display during shake
  if (phase === 'shake' || phase === 'aftershock') {
    ctx.fillStyle = '#ff444488';
    ctx.font = 'bold 24px Courier New';
    const label = phase === 'aftershock' ? 'AFTERSHOCK' : (richterTestMode ? 'RICHTER TEST' : 'EARTHQUAKE');
    ctx.fillText(`${label}: ${shakeMagnitude.toFixed(1)}`, 20, H - 30);
  }

  ctx.restore();
}

function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1,3),16), g1 = parseInt(c1.slice(3,5),16), b1 = parseInt(c1.slice(5,7),16);
  const r2 = parseInt(c2.slice(1,3),16), g2 = parseInt(c2.slice(3,5),16), b2 = parseInt(c2.slice(5,7),16);
  const r = Math.round(r1 + (r2-r1)*t), g = Math.round(g1 + (g2-g1)*t), b = Math.round(b1 + (b2-b1)*t);
  return `rgb(${r},${g},${b})`;
}

// ── Game Loop ──
let lastTime = 0;
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (phase === 'shake' || phase === 'aftershock') {
    physicsTick(dt);
    updateShake(dt);
  }

  updateParticles(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

// ── Init ──
loadLevel(0);
requestAnimationFrame(gameLoop);
