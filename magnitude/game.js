// ═══════════════════════════════════════════
// MAGNITUDE — Earthquake Engineering Game
// ═══════════════════════════════════════════
//
// STRUCTURAL RULES:
// 1. Triangles are the strongest shape — they can't deform without breaking a beam
// 2. Rectangles/squares are WEAK — they collapse into parallelograms under lateral force
// 3. Wider bases = more stable (lower center of gravity)
// 4. Diagonal bracing converts lateral earthquake force into compression/tension along beams
// 5. Steel handles high stress, Wood is for light loads, Cable resists pulling apart
// 6. Taller structures need MORE triangulation and wider bases
// 7. The earthquake shakes the GROUND sideways — structures must resist lateral sway
//
// HOW SURVIVAL WORKS:
// - Ground joints oscillate horizontally during the quake
// - Forces propagate up through beams via spring physics
// - Each beam has a maximum stress it can handle (based on material)
// - If stress exceeds the limit → beam snaps
// - If the highest connected joint drops below the survival line → you lose
// - After surviving the main quake, weakened beams face an aftershock
//
// LEVEL 10 (God of Structures) is designed so ONLY a carefully triangulated
// steel+cable hybrid tower with a wide base can survive. Budget is extremely tight.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ── Constants ──
const GRID = 40;
const GRAVITY = 400;          // Reduced from 600 — less crushing weight on joints
const DAMPING = 0.97;         // Slightly more damping — structures settle faster
const SUB_STEPS = 10;         // More substeps = more stable simulation
const GROUND_Y_RATIO = 0.82;
const JOINT_RADIUS = 8;
const SNAP_DIST = 20;

// MATERIAL BALANCE:
// Wood:  cheap, decent for short spans, breaks under strong quakes
// Steel: expensive, very strong, heavy (adds weight = more inertia during quake)
// Cable: mid-price, tension-only (great for diagonal bracing, useless in compression)
const MATERIALS = {
  wood:  { cost: 1, stiffness: 2500, maxStress: 180,  weight: 0.8, color: '#c8874a', snapColor: '#8B5E3C', label: '🪵', tensionOnly: false },
  steel: { cost: 3, stiffness: 6000, maxStress: 500,  weight: 2.0, color: '#8899aa', snapColor: '#ffaa00', label: '🔩', tensionOnly: false },
  cable: { cost: 2, stiffness: 1800, maxStress: 300,  weight: 0.1, color: '#44aaff', snapColor: '#0066cc', label: '🔗', tensionOnly: true },
};

// LEVEL DESIGN PHILOSOPHY:
// - Heights use GRID units (40px each) so structures align to grid
// - Budget forces material choices — can't just spam steel everywhere
// - Target magnitude scales with difficulty
// - Later levels: less budget per height unit = must be more efficient
// - Level 10: only ~3.75 budget per 120px of height. Requires perfect triangulation.
const LEVELS = [
  { name: "First Steps",       height: 120, budget: 10, targetMag: 2.5,  hint: "Build a triangle from ground up!" },
  { name: "Getting Taller",    height: 160, budget: 14, targetMag: 3.0,  hint: "Stack triangles — they're the strongest shape" },
  { name: "Triangle Power",    height: 200, budget: 18, targetMag: 3.5,  hint: "Diagonal braces stop rectangles from collapsing" },
  { name: "Steel Nerves",      height: 240, budget: 20, targetMag: 4.0,  hint: "Use steel for the base where stress is highest" },
  { name: "Cable Bracing",     height: 280, budget: 24, targetMag: 4.5,  hint: "Cables are cheap diagonal braces — they resist pulling" },
  { name: "Sky High",          height: 320, budget: 28, targetMag: 5.0,  hint: "Wide base + narrow top = pyramid stability" },
  { name: "The Swayer",        height: 360, budget: 26, targetMag: 5.5,  hint: "Cross-bracing in X patterns stops lateral sway" },
  { name: "Magnitude 7",       height: 400, budget: 24, targetMag: 6.5,  hint: "Every rectangle needs at least one diagonal" },
  { name: "Impossible Tower",  height: 440, budget: 22, targetMag: 7.5,  hint: "Steel base, wood middle, cable bracing everywhere" },
  { name: "God of Structures", height: 480, budget: 20, targetMag: 8.5,  hint: "Only one path to victory. Think: triangles all the way." },
];

// ── State ──
let W, H, groundY;
let joints = [], beams = [], particles = [];
let selectedMat = 'wood';
let selectedJoint = null;
let deleteMode = false;
let phase = 'build'; // build, settle, shake, aftershock, richter, done
let currentLevel = 0;
let budgetUsed = 0;
let undoStack = [];
let bestScores = JSON.parse(localStorage.getItem('magnitude_scores') || '{}');
let unlockedLevel = parseInt(localStorage.getItem('magnitude_unlocked') || '0');

// Shake state
let shakeTime = 0;
let shakeMagnitude = 0;
let targetMagnitude = 0;
let groundOffsetX = 0;
let screenShakeX = 0, screenShakeY = 0;
let maxSurvivedMag = 0;
let rescuePerson = null;
let survived = false;
let richterTestMode = false;
let richterMag = 0;
let settleTime = 0;

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
  const restLen = Math.sqrt(dx * dx + dy * dy);
  return { j1, j2, mat, restLen, stress: 0, broken: false, weakened: false, maxStressMul: 1.0 };
}

// ── Snap to grid/existing joint ──
function snapPos(mx, my) {
  for (const j of joints) {
    const d = Math.hypot(mx - j.x, my - j.y);
    if (d < SNAP_DIST) return { x: j.x, y: j.y, joint: j };
  }
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

// ── Undo ──
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
  budgetUsed = 0;
  undoStack = [];
  selectedJoint = null;
  deleteMode = false;
  phase = 'build';
  shakeTime = 0;
  settleTime = 0;
  maxSurvivedMag = 0;
  richterTestMode = false;
  richterMag = 0;

  // Place ground joints — wide foundation area
  const startX = W * 0.15;
  const endX = W * 0.85;
  for (let x = startX; x <= endX; x += GRID) {
    joints.push(makeJoint(x, groundY, true));
  }

  rescuePerson = { y: groundY - lvl.height, alive: true };

  document.getElementById('level-num').textContent = idx + 1;
  document.getElementById('level-name').textContent = lvl.name;
  document.getElementById('height-val').textContent = lvl.height;
  updateBudgetUI();

  // Show hint
  const hintEl = document.getElementById('hint-text');
  if (hintEl) hintEl.textContent = lvl.hint || '';

  document.getElementById('btn-shake').classList.remove('hidden');
  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('btn-retry').classList.add('hidden');
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('level-select').classList.add('hidden');
}

// ── Input Handling ──
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
    let best = null, bestD = 25;
    for (const b of beams) {
      if (b.broken) continue;
      // Distance from point to line segment
      const d = distToSegment(pos, b.j1, b.j2);
      if (d < bestD) { bestD = d; best = b; }
    }
    if (best) {
      saveUndo();
      budgetUsed -= MATERIALS[best.mat].cost;
      beams.splice(beams.indexOf(best), 1);
      joints = joints.filter(j => j.fixed || beams.some(b => b.j1 === j || b.j2 === j));
      updateBudgetUI();
    }
    return;
  }

  const snap = snapPos(pos.x, pos.y);
  let joint = snap.joint || findJointAt(snap.x, snap.y);

  if (!selectedJoint) {
    if (!joint) {
      if (snap.y >= groundY - 2) return;
      saveUndo();
      joint = makeJoint(snap.x, snap.y, false);
      joints.push(joint);
    }
    selectedJoint = joint;
  } else {
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
        selectedJoint = joint;
      } else {
        selectedJoint = null;
      }
    } else {
      selectedJoint = joint === selectedJoint ? null : joint;
    }
  }
});

canvas.addEventListener('pointermove', (e) => { hoverPos = getCanvasPos(e); });
canvas.addEventListener('pointerup', () => {});

// Point-to-segment distance for better delete targeting
function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

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
  document.getElementById('btn-delete').style.borderColor = deleteMode ? '#ff4444' : '';
  selectedJoint = null;
}

document.getElementById('btn-delete').addEventListener('click', toggleDelete);
document.getElementById('btn-undo').addEventListener('click', doUndo);
document.getElementById('btn-clear').addEventListener('click', () => {
  if (phase !== 'build') return;
  saveUndo();
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
    div.innerHTML = `<span>${i + 1}. ${lvl.name}</span><span class="best">${best}</span>`;
    if (i <= unlockedLevel) div.addEventListener('click', () => loadLevel(i));
    list.appendChild(div);
  });
  document.getElementById('level-select').classList.remove('hidden');
}

// ══════════════════════════════════
// PHYSICS ENGINE
// ══════════════════════════════════

function startShake() {
  if (phase !== 'build') return;
  if (!joints.some(j => !j.fixed)) return;

  // First: settle the structure under gravity (0.5s) before shaking
  phase = 'settle';
  settleTime = 0;
  shakeTime = 0;
  shakeMagnitude = 0;
  targetMagnitude = LEVELS[currentLevel].targetMag;
  maxSurvivedMag = 0;
  survived = false;
  richterTestMode = false;
  richterMag = 0;

  document.getElementById('btn-shake').classList.add('hidden');

  // Calculate joint masses from connected beams
  for (const j of joints) {
    if (j.fixed) continue;
    j.vx = 0; j.vy = 0;
    j.mass = 0.3; // Base mass
  }
  for (const b of beams) {
    if (b.broken) continue;
    const w = MATERIALS[b.mat].weight * b.restLen / 300;
    if (!b.j1.fixed) b.j1.mass += w;
    if (!b.j2.fixed) b.j2.mass += w;
  }
}

// Earthquake ground motion — realistic multi-frequency oscillation
function quakeOffset(t, mag) {
  // Primary wave + secondary harmonics + random jitter
  // Amplitude scales with magnitude (exponential-ish, like real Richter)
  const amp = Math.pow(mag, 1.3) * 4;
  const freq = 1.5 + mag * 0.5;
  return amp * Math.sin(t * freq * Math.PI * 2)
    + amp * 0.4 * Math.sin(t * freq * 2.3 + 0.7)
    + amp * 0.2 * Math.sin(t * freq * 4.1 + 2.1)
    + (Math.random() - 0.5) * amp * 0.3;
}

function physicsTick(dt) {
  const subDt = dt / SUB_STEPS;

  for (let step = 0; step < SUB_STEPS; step++) {
    // Ground oscillation during quake phases
    if (phase === 'shake' || phase === 'aftershock' || phase === 'richter') {
      groundOffsetX = quakeOffset(shakeTime, shakeMagnitude);
      for (const j of joints) {
        if (j.fixed) j.x = j.ox + groundOffsetX;
      }
    }

    // ── Spring forces ──
    // Each beam acts as a spring. Strain = how much it's stretched/compressed from rest length.
    // Force = stiffness * strain. If force exceeds maxStress → beam breaks.
    for (const b of beams) {
      if (b.broken) continue;
      const dx = b.j2.x - b.j1.x, dy = b.j2.y - b.j1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const strain = (len - b.restLen) / b.restLen;
      const mat = MATERIALS[b.mat];

      // Cable: only resists tension (pulling apart), not compression
      if (mat.tensionOnly && strain < 0) { b.stress = 0; continue; }

      const force = mat.stiffness * strain;
      b.stress = Math.abs(force);

      // Apply force along beam direction to both joints
      const nx = dx / len, ny = dy / len;
      const fx = nx * force * subDt;
      const fy = ny * force * subDt;

      if (!b.j1.fixed) { b.j1.vx += fx / b.j1.mass; b.j1.vy += fy / b.j1.mass; }
      if (!b.j2.fixed) { b.j2.vx -= fx / b.j2.mass; b.j2.vy -= fy / b.j2.mass; }

      // Break check
      const maxS = mat.maxStress * b.maxStressMul;
      if (b.stress > maxS) {
        b.broken = true;
        spawnBreakParticles(b);
      }
    }

    // ── Position constraint (Verlet-style) ──
    // After forces, also enforce rest lengths directly for stability
    for (const b of beams) {
      if (b.broken) continue;
      const dx = b.j2.x - b.j1.x, dy = b.j2.y - b.j1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const diff = (len - b.restLen) / len;
      const mat = MATERIALS[b.mat];

      if (mat.tensionOnly && diff < 0) continue;

      // Push/pull joints toward rest length (50% each, or 100% if one is fixed)
      const cx = dx * diff * 0.3; // Constraint strength
      const cy = dy * diff * 0.3;

      if (!b.j1.fixed && !b.j2.fixed) {
        b.j1.x += cx * 0.5; b.j1.y += cy * 0.5;
        b.j2.x -= cx * 0.5; b.j2.y -= cy * 0.5;
      } else if (!b.j1.fixed) {
        b.j1.x += cx; b.j1.y += cy;
      } else if (!b.j2.fixed) {
        b.j2.x -= cx; b.j2.y -= cy;
      }
    }

    // ── Gravity + integration ──
    for (const j of joints) {
      if (j.fixed) continue;
      j.vy += GRAVITY * subDt;
      j.vx *= DAMPING;
      j.vy *= DAMPING;
      j.x += j.vx * subDt;
      j.y += j.vy * subDt;

      // Floor
      if (j.y > groundY) {
        j.y = groundY;
        j.vy = -j.vy * 0.2;
        j.vx *= 0.7;
      }
      // Walls
      if (j.x < 0) { j.x = 0; j.vx = Math.abs(j.vx) * 0.3; }
      if (j.x > W) { j.x = W; j.vx = -Math.abs(j.vx) * 0.3; }
    }
  }
}

function updateShake(dt) {
  if (phase === 'settle') {
    settleTime += dt;
    // Let structure settle under gravity for 0.8s before earthquake
    if (settleTime > 0.8) {
      phase = 'shake';
      shakeTime = 0;
    }
    return;
  }

  shakeTime += dt;

  if (phase === 'shake') {
    // Ramp up to target magnitude over 3 seconds, hold for 4 seconds
    const rampTime = 3;
    const holdTime = 4;
    const t = Math.min(shakeTime / rampTime, 1);
    shakeMagnitude = targetMagnitude * t;

    if (shakeTime > rampTime + holdTime) {
      if (checkRescueAlive()) {
        maxSurvivedMag = targetMagnitude;
        // Start aftershock phase
        phase = 'aftershock';
        shakeTime = 0;
        shakeMagnitude = 0;
        // Weaken beams that were heavily stressed
        for (const b of beams) {
          if (!b.broken && b.stress > MATERIALS[b.mat].maxStress * b.maxStressMul * 0.6) {
            b.weakened = true;
            b.maxStressMul *= 0.65;
          }
        }
      } else {
        finishShake(false);
      }
    }
  } else if (phase === 'aftershock') {
    const afterMag = targetMagnitude * (0.3 + Math.random() * 0.25);
    const rampTime = 1.5;
    const t = Math.min(shakeTime / rampTime, 1);
    shakeMagnitude = afterMag * t * Math.max(0, 1 - (shakeTime - rampTime) / 2.5);

    if (shakeTime > rampTime + 2.5) {
      if (checkRescueAlive()) {
        // Survived! Start Richter test to find max
        richterTestMode = true;
        richterMag = targetMagnitude + 0.5;
        targetMagnitude = richterMag;
        phase = 'richter';
        shakeTime = 0;
        shakeMagnitude = 0;
        maxSurvivedMag = LEVELS[currentLevel].targetMag;
      } else {
        // Failed aftershock — but if we survived the main quake, still a win
        finishShake(maxSurvivedMag >= LEVELS[currentLevel].targetMag);
      }
    }
  } else if (phase === 'richter') {
    // Richter test: keep increasing magnitude until failure
    const rampTime = 2;
    const holdTime = 3;
    const t = Math.min(shakeTime / rampTime, 1);
    shakeMagnitude = targetMagnitude * t;

    if (!checkRescueAlive()) {
      maxSurvivedMag = Math.max(maxSurvivedMag, richterMag - 0.5);
      finishShake(true);
    } else if (shakeTime > rampTime + holdTime) {
      maxSurvivedMag = richterMag;
      richterMag += 0.5;
      targetMagnitude = richterMag;
      shakeTime = 0;
      shakeMagnitude = 0;
      // Accumulate fatigue
      for (const b of beams) {
        if (!b.broken) b.maxStressMul *= 0.95;
      }
    }
  }

  // Check for total collapse during main quake
  if ((phase === 'shake') && !checkRescueAlive()) {
    finishShake(false);
  }

  // Screen shake visual
  if (phase === 'shake' || phase === 'aftershock' || phase === 'richter') {
    screenShakeX = (Math.random() - 0.5) * shakeMagnitude * 2.5;
    screenShakeY = (Math.random() - 0.5) * shakeMagnitude * 1.5;
  } else {
    screenShakeX *= 0.9;
    screenShakeY *= 0.9;
  }
}

function checkRescueAlive() {
  if (!rescuePerson) return true;
  // Find highest joint that's still connected to the structure
  let highestY = groundY;
  for (const j of joints) {
    if (!j.fixed && j.y < highestY) {
      // Must be connected to at least one non-broken beam
      if (beams.some(b => !b.broken && (b.j1 === j || b.j2 === j))) {
        highestY = j.y;
      }
    }
  }
  const survivalLine = rescuePerson.y + 40; // 40px grace zone
  rescuePerson.alive = highestY < survivalLine;
  return rescuePerson.alive;
}

function finishShake(win) {
  phase = 'done';
  survived = win;
  shakeMagnitude = 0;
  groundOffsetX = 0;

  for (const j of joints) {
    if (j.fixed) j.x = j.ox;
  }

  if (win) {
    if (!bestScores[currentLevel] || maxSurvivedMag > bestScores[currentLevel]) {
      bestScores[currentLevel] = maxSurvivedMag;
      localStorage.setItem('magnitude_scores', JSON.stringify(bestScores));
    }
    if (currentLevel >= unlockedLevel) {
      unlockedLevel = Math.min(currentLevel + 1, LEVELS.length - 1);
      localStorage.setItem('magnitude_unlocked', String(unlockedLevel));
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
  magDiv.textContent = win ? `${mag.toFixed(1)} Richter` : 'STRUCTURAL FAILURE';
  magDiv.style.color = win ? '#ffd700' : '#ff6644';

  const beamsLeft = beams.filter(b => !b.broken).length;
  const totalBeams = beams.length;
  const efficiency = totalBeams > 0 ? Math.round((beamsLeft / totalBeams) * 100) : 0;

  let detailText = `Beams intact: ${beamsLeft}/${totalBeams} (${efficiency}%)<br>`;
  detailText += `Budget used: ${budgetUsed}/${LEVELS[currentLevel].budget}<br>`;
  if (win) {
    detailText += `<span style="color:#ffd700">Richter Score: ${mag.toFixed(1)}</span>`;
  } else {
    detailText += `<br><span style="color:#ff8866">Tip: ${LEVELS[currentLevel].hint}</span>`;
  }
  details.innerHTML = detailText;

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

// ══════════════════
// DRAWING
// ══════════════════

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
  ctx.beginPath(); ctx.moveTo(-20, groundY); ctx.lineTo(W + 20, groundY); ctx.stroke();

  // Survival line + target height
  if (rescuePerson) {
    const sy = rescuePerson.y + 40;
    ctx.strokeStyle = '#ff444488';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff444466';
    ctx.font = '11px Courier New';
    ctx.fillText('▼ SURVIVAL LINE', 10, sy - 4);

    ctx.strokeStyle = '#00ffff33';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, rescuePerson.y); ctx.lineTo(W, rescuePerson.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#00ffff44';
    ctx.fillText(`▲ TARGET HEIGHT: ${LEVELS[currentLevel].height}px`, 10, rescuePerson.y - 4);
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
      // Green → Yellow → Red based on stress ratio
      if (ratio < 0.4) color = lerpColor('#44ff44', '#ffff00', ratio / 0.4);
      else if (ratio < 0.7) color = lerpColor('#ffff00', '#ff8800', (ratio - 0.4) / 0.3);
      else color = lerpColor('#ff8800', '#ff2222', (ratio - 0.7) / 0.3);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = b.mat === 'cable' ? 2 : (b.mat === 'steel' ? 5 : 4);
    if (b.mat === 'cable') ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(b.j1.x, b.j1.y);
    ctx.lineTo(b.j2.x, b.j2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (b.weakened) {
      ctx.strokeStyle = '#ff880033';
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(b.j1.x, b.j1.y); ctx.lineTo(b.j2.x, b.j2.y); ctx.stroke();
    }
  }

  // Joints
  for (const j of joints) {
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.fixed ? 5 : JOINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = j.fixed ? '#556' : (j === selectedJoint ? '#00ffff' : '#aabbcc');
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

  // Delete mode cursor highlight
  if (phase === 'build' && deleteMode && hoverPos) {
    let best = null, bestD = 25;
    for (const b of beams) {
      if (b.broken) continue;
      const d = distToSegment(hoverPos, b.j1, b.j2);
      if (d < bestD) { bestD = d; best = b; }
    }
    if (best) {
      ctx.strokeStyle = '#ff444488';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(best.j1.x, best.j1.y);
      ctx.lineTo(best.j2.x, best.j2.y);
      ctx.stroke();
    }
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
    const shaking = (phase === 'shake' || phase === 'aftershock' || phase === 'richter');
    const wobble = shaking ? Math.sin(Date.now() / 50) * shakeMagnitude * 0.8 : 0;

    ctx.fillStyle = rescuePerson.alive ? '#ffcc00' : '#ff4444';
    ctx.beginPath();
    ctx.arc(personX + wobble, personY - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(personX + wobble, personY - 4); ctx.lineTo(personX + wobble, personY + 8); ctx.stroke();
    const armWave = shaking ? Math.sin(Date.now() / 80) * 12 : 0;
    ctx.beginPath();
    ctx.moveTo(personX + wobble - 8, personY + armWave);
    ctx.lineTo(personX + wobble + 8, personY - armWave);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(personX + wobble, personY + 8); ctx.lineTo(personX + wobble - 5, personY + 16);
    ctx.moveTo(personX + wobble, personY + 8); ctx.lineTo(personX + wobble + 5, personY + 16);
    ctx.stroke();

    if (shaking && rescuePerson.alive) {
      ctx.fillStyle = '#ffffff88';
      ctx.font = '10px Courier New';
      const panics = ['HELP!', 'AHHH!', '😱', 'NOOO!'];
      ctx.fillText(panics[Math.floor(Date.now() / 300) % panics.length], personX + 12 + wobble, personY - 8);
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
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // Status display
  if (phase === 'settle') {
    ctx.fillStyle = '#ffaa0088';
    ctx.font = 'bold 20px Courier New';
    ctx.fillText('Settling structure...', 20, H - 30);
  } else if (phase === 'shake' || phase === 'aftershock' || phase === 'richter') {
    ctx.fillStyle = '#ff444488';
    ctx.font = 'bold 24px Courier New';
    let label = 'EARTHQUAKE';
    if (phase === 'aftershock') label = 'AFTERSHOCK';
    else if (phase === 'richter') label = 'RICHTER TEST';
    ctx.fillText(`${label}: ${shakeMagnitude.toFixed(1)}`, 20, H - 30);
  }

  // Hint during build phase
  if (phase === 'build' && LEVELS[currentLevel].hint) {
    ctx.fillStyle = '#ffffff22';
    ctx.font = '12px Courier New';
    ctx.fillText(`💡 ${LEVELS[currentLevel].hint}`, 20, H - 12);
  }

  ctx.restore();
}

function lerpColor(c1, c2, t) {
  t = Math.max(0, Math.min(1, t));
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

// ── Game Loop ──
let lastTime = 0;
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.033); // Cap at ~30fps min for stability
  lastTime = time;

  if (phase === 'settle' || phase === 'shake' || phase === 'aftershock' || phase === 'richter') {
    physicsTick(dt);
    updateShake(dt);
  }

  updateParticles(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

// ── Splash Screen ──
document.getElementById('btn-play').addEventListener('click', () => {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  resize();
  loadLevel(0);
  requestAnimationFrame(gameLoop);
});
