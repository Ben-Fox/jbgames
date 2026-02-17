// ═══════════════════════════════════════════
// MAGNITUDE — Earthquake Engineering Game
// ═══════════════════════════════════════════
//
// STRUCTURAL ENGINEERING RULES:
// 1. You must build a STRUCTURE, not just a triangle — a platform at the top is required
// 2. The rescue person stands on the highest horizontal platform beam
// 3. Structure must connect to at least 2 ground anchor points (wide base)
// 4. Triangulation is key — rectangles collapse, triangles hold
// 5. Diagonal bracing converts lateral quake forces into axial beam forces
// 6. Wider base = more stable. Taller = needs more bracing.
// 7. The earthquake shakes ground horizontally. Forces propagate up through connections.
//
// PLATFORM RULES:
// - A "platform" is any beam that is mostly horizontal (angle < 25° from horizontal)
// - The person stands on the highest platform beam
// - Platform must stay above the survival line during the quake
// - If no valid platform exists above survival line → you lose

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ── Constants ──
const GRID = 40;
const GRAVITY = 400;
const DAMPING = 0.97;
const SUB_STEPS = 10;
const GROUND_Y_RATIO = 0.82;
const JOINT_RADIUS = 8;
const SNAP_DIST = 20;
const PLATFORM_ANGLE_MAX = 25; // degrees — max angle from horizontal to count as "platform"
const MIN_PLATFORM_WIDTH = 60; // pixels — minimum platform beam length

const MATERIALS = {
  wood:  { cost: 1, stiffness: 2500, maxStress: 180,  weight: 0.8, color: '#c8874a', snapColor: '#8B5E3C', label: '🪵', tensionOnly: false },
  steel: { cost: 3, stiffness: 6000, maxStress: 500,  weight: 2.0, color: '#8899aa', snapColor: '#ffaa00', label: '🔩', tensionOnly: false },
  cable: { cost: 2, stiffness: 1800, maxStress: 300,  weight: 0.1, color: '#44aaff', snapColor: '#0066cc', label: '🔗', tensionOnly: true },
};

// Level design: each level requires building a real multi-story structure
// Budget is calibrated so you need efficient engineering, not brute force
const LEVELS = [
  { name: "First Steps",       height: 120, budget: 12, targetMag: 2.5, minAnchors: 2, hint: "Build a box frame with a diagonal brace. Platform on top!" },
  { name: "Getting Taller",    height: 160, budget: 16, targetMag: 3.0, minAnchors: 2, hint: "Two stories — brace each level with diagonals" },
  { name: "Triangle Power",    height: 200, budget: 20, targetMag: 3.5, minAnchors: 2, hint: "Every rectangle needs at least one diagonal to be rigid" },
  { name: "Steel Nerves",      height: 240, budget: 22, targetMag: 4.0, minAnchors: 2, hint: "Use steel for the base — it handles the most stress" },
  { name: "Cable Bracing",     height: 280, budget: 26, targetMag: 4.5, minAnchors: 3, hint: "Cables make cheap X-bracing — they only resist pulling" },
  { name: "Sky High",          height: 320, budget: 30, targetMag: 5.0, minAnchors: 3, hint: "Taper your structure — wider base, narrower top" },
  { name: "The Swayer",        height: 360, budget: 28, targetMag: 5.5, minAnchors: 3, hint: "X-bracing on every level stops lateral sway" },
  { name: "Magnitude 7",       height: 400, budget: 26, targetMag: 6.5, minAnchors: 3, hint: "Mix materials: steel base, wood upper, cable bracing" },
  { name: "Impossible Tower",  height: 440, budget: 24, targetMag: 7.5, minAnchors: 3, hint: "Every joint needs triangulation. No shortcuts." },
  { name: "God of Structures", height: 480, budget: 22, targetMag: 8.5, minAnchors: 4, hint: "Perfect triangulated truss. The only way." },
];

// ── State ──
let W, H, groundY;
let joints = [], beams = [], particles = [];
let selectedMat = 'wood';
let selectedJoint = null;
let deleteMode = false;
let phase = 'build';
let currentLevel = 0;
let budgetUsed = 0;
let undoStack = [];
let bestScores = JSON.parse(localStorage.getItem('magnitude_scores') || '{}');
let unlockedLevel = parseInt(localStorage.getItem('magnitude_unlocked') || '0');

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
let buildWarning = '';
let warningTimer = 0;

// ── Resize ──
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  groundY = H * GROUND_Y_RATIO;
}
window.addEventListener('resize', resize);
resize();

// ── Joint/Beam ──
function makeJoint(x, y, fixed) {
  return { x, y, ox: x, oy: y, vx: 0, vy: 0, fixed, mass: 1 };
}

function makeBeam(j1, j2, mat) {
  const dx = j2.x - j1.x, dy = j2.y - j1.y;
  const restLen = Math.sqrt(dx * dx + dy * dy);
  return { j1, j2, mat, restLen, stress: 0, broken: false, weakened: false, maxStressMul: 1.0 };
}

function snapPos(mx, my) {
  for (const j of joints) {
    if (Math.hypot(mx - j.x, my - j.y) < SNAP_DIST) return { x: j.x, y: j.y, joint: j };
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

// ── Structure Validation ──
// Check if structure meets requirements before shaking
function validateStructure() {
  const lvl = LEVELS[currentLevel];
  const activeBeams = beams.filter(b => !b.broken);
  const activeJoints = joints.filter(j => !j.fixed && activeBeams.some(b => b.j1 === j || b.j2 === j));

  // 1. Must have at least one beam
  if (activeBeams.length === 0) return "Place some beams first!";

  // 2. Check ground anchor count
  const anchoredGroundJoints = new Set();
  for (const b of activeBeams) {
    if (b.j1.fixed) anchoredGroundJoints.add(b.j1);
    if (b.j2.fixed) anchoredGroundJoints.add(b.j2);
  }
  if (anchoredGroundJoints.size < lvl.minAnchors) {
    return `Need at least ${lvl.minAnchors} ground anchor points (have ${anchoredGroundJoints.size})`;
  }

  // 3. Check base width (distance between outermost anchors)
  const anchorXs = [...anchoredGroundJoints].map(j => j.ox);
  const baseWidth = Math.max(...anchorXs) - Math.min(...anchorXs);
  if (baseWidth < GRID * 1.5) {
    return "Base too narrow! Spread your ground anchors wider.";
  }

  // 4. Check for platform beam near target height
  const platform = findHighestPlatform();
  if (!platform) {
    return "Need a horizontal platform beam for the rescue person to stand on!";
  }

  const platformY = (platform.j1.y + platform.j2.y) / 2;
  const targetY = groundY - lvl.height;
  if (platformY > targetY + 50) {
    return `Platform too low! Build higher. (Need ${Math.round(platformY - targetY)}px more)`;
  }

  // 5. Check connectivity — all non-ground joints must connect to ground
  const connected = new Set();
  const queue = [];
  // Start BFS from ground joints
  for (const j of joints) {
    if (j.fixed) { connected.add(j); queue.push(j); }
  }
  while (queue.length) {
    const j = queue.shift();
    for (const b of activeBeams) {
      const other = b.j1 === j ? b.j2 : (b.j2 === j ? b.j1 : null);
      if (other && !connected.has(other)) {
        connected.add(other);
        queue.push(other);
      }
    }
  }
  const disconnected = activeJoints.filter(j => !connected.has(j));
  if (disconnected.length > 0) {
    return "Some joints aren't connected to the ground!";
  }

  return null; // All good!
}

// Find the highest beam that qualifies as a platform
function findHighestPlatform() {
  let best = null;
  let bestY = Infinity;

  for (const b of beams) {
    if (b.broken) continue;
    // Check angle from horizontal
    const dx = Math.abs(b.j2.x - b.j1.x);
    const dy = Math.abs(b.j2.y - b.j1.y);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    if (angle > PLATFORM_ANGLE_MAX) continue; // Too steep

    // Check minimum width
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < MIN_PLATFORM_WIDTH) continue; // Too short

    // Must not be a ground beam
    if (b.j1.fixed && b.j2.fixed) continue;

    const midY = (b.j1.y + b.j2.y) / 2;
    if (midY < bestY) {
      bestY = midY;
      best = b;
    }
  }
  return best;
}

// Find platform beam during physics (using current positions)
function findHighestPlatformDynamic() {
  let best = null;
  let bestY = Infinity;

  for (const b of beams) {
    if (b.broken) continue;
    const dx = Math.abs(b.j2.x - b.j1.x);
    const dy = Math.abs(b.j2.y - b.j1.y);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle > 45) continue; // More lenient during shaking — 45° before it "fell"
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < MIN_PLATFORM_WIDTH * 0.5) continue; // Allow some compression
    if (b.j1.fixed && b.j2.fixed) continue;

    const midY = (b.j1.y + b.j2.y) / 2;
    if (midY < bestY) {
      bestY = midY;
      best = b;
    }
  }
  return best;
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
  buildWarning = '';
  warningTimer = 0;

  // Ground joints
  const startX = W * 0.15;
  const endX = W * 0.85;
  for (let x = startX; x <= endX; x += GRID) {
    joints.push(makeJoint(x, groundY, true));
  }

  rescuePerson = { y: groundY - lvl.height, alive: true, platformBeam: null };

  document.getElementById('level-num').textContent = idx + 1;
  document.getElementById('level-name').textContent = lvl.name;
  document.getElementById('height-val').textContent = lvl.height;
  updateBudgetUI();

  const hintEl = document.getElementById('hint-text');
  if (hintEl) hintEl.textContent = lvl.hint || '';

  document.getElementById('btn-shake').classList.remove('hidden');
  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('btn-retry').classList.add('hidden');
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('level-select').classList.add('hidden');
}

// ── Input ──
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
        showWarning("Not enough budget!");
      }
    } else {
      selectedJoint = joint === selectedJoint ? null : joint;
    }
  }
});

canvas.addEventListener('pointermove', (e) => { hoverPos = getCanvasPos(e); });

function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function showWarning(msg) {
  buildWarning = msg;
  warningTimer = 3;
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

// ── UI ──
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

document.getElementById('btn-shake').addEventListener('click', () => {
  if (phase !== 'build') return;

  // Validate structure before shaking
  const error = validateStructure();
  if (error) {
    showWarning(error);
    return;
  }

  startShake();
});

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
// PHYSICS
// ══════════════════════════════════

function startShake() {
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

  for (const j of joints) {
    if (j.fixed) continue;
    j.vx = 0; j.vy = 0;
    j.mass = 0.3;
  }
  for (const b of beams) {
    if (b.broken) continue;
    const w = MATERIALS[b.mat].weight * b.restLen / 300;
    if (!b.j1.fixed) b.j1.mass += w;
    if (!b.j2.fixed) b.j2.mass += w;
  }
}

function quakeOffset(t, mag) {
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
    if (phase === 'shake' || phase === 'aftershock' || phase === 'richter') {
      groundOffsetX = quakeOffset(shakeTime, shakeMagnitude);
      for (const j of joints) {
        if (j.fixed) j.x = j.ox + groundOffsetX;
      }
    }

    // Spring forces
    for (const b of beams) {
      if (b.broken) continue;
      const dx = b.j2.x - b.j1.x, dy = b.j2.y - b.j1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const strain = (len - b.restLen) / b.restLen;
      const mat = MATERIALS[b.mat];

      if (mat.tensionOnly && strain < 0) { b.stress = 0; continue; }

      const force = mat.stiffness * strain;
      b.stress = Math.abs(force);

      const nx = dx / len, ny = dy / len;
      const fx = nx * force * subDt;
      const fy = ny * force * subDt;

      if (!b.j1.fixed) { b.j1.vx += fx / b.j1.mass; b.j1.vy += fy / b.j1.mass; }
      if (!b.j2.fixed) { b.j2.vx -= fx / b.j2.mass; b.j2.vy -= fy / b.j2.mass; }

      const maxS = mat.maxStress * b.maxStressMul;
      if (b.stress > maxS) {
        b.broken = true;
        spawnBreakParticles(b);
      }
    }

    // Position constraints (Verlet-style stability)
    for (const b of beams) {
      if (b.broken) continue;
      const dx = b.j2.x - b.j1.x, dy = b.j2.y - b.j1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const diff = (len - b.restLen) / len;
      const mat = MATERIALS[b.mat];

      if (mat.tensionOnly && diff < 0) continue;

      const cx = dx * diff * 0.3;
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

    // Gravity + integrate
    for (const j of joints) {
      if (j.fixed) continue;
      j.vy += GRAVITY * subDt;
      j.vx *= DAMPING;
      j.vy *= DAMPING;
      j.x += j.vx * subDt;
      j.y += j.vy * subDt;

      if (j.y > groundY) { j.y = groundY; j.vy = -j.vy * 0.2; j.vx *= 0.7; }
      if (j.x < 0) { j.x = 0; j.vx = Math.abs(j.vx) * 0.3; }
      if (j.x > W) { j.x = W; j.vx = -Math.abs(j.vx) * 0.3; }
    }
  }
}

function updateShake(dt) {
  if (phase === 'settle') {
    settleTime += dt;
    if (settleTime > 0.8) {
      phase = 'shake';
      shakeTime = 0;
    }
    return;
  }

  shakeTime += dt;

  if (phase === 'shake') {
    const rampTime = 3;
    const holdTime = 4;
    const t = Math.min(shakeTime / rampTime, 1);
    shakeMagnitude = targetMagnitude * t;

    if (shakeTime > rampTime + holdTime) {
      if (checkStructureSurvived()) {
        maxSurvivedMag = targetMagnitude;
        phase = 'aftershock';
        shakeTime = 0;
        shakeMagnitude = 0;
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
      if (checkStructureSurvived()) {
        richterTestMode = true;
        richterMag = targetMagnitude + 0.5;
        targetMagnitude = richterMag;
        phase = 'richter';
        shakeTime = 0;
        shakeMagnitude = 0;
        maxSurvivedMag = LEVELS[currentLevel].targetMag;
      } else {
        finishShake(maxSurvivedMag >= LEVELS[currentLevel].targetMag);
      }
    }
  } else if (phase === 'richter') {
    const rampTime = 2;
    const holdTime = 3;
    const t = Math.min(shakeTime / rampTime, 1);
    shakeMagnitude = targetMagnitude * t;

    if (!checkStructureSurvived()) {
      maxSurvivedMag = Math.max(maxSurvivedMag, richterMag - 0.5);
      finishShake(true);
    } else if (shakeTime > rampTime + holdTime) {
      maxSurvivedMag = richterMag;
      richterMag += 0.5;
      targetMagnitude = richterMag;
      shakeTime = 0;
      shakeMagnitude = 0;
      for (const b of beams) {
        if (!b.broken) b.maxStressMul *= 0.95;
      }
    }
  }

  // Collapse check during main quake
  if (phase === 'shake' && !checkStructureSurvived()) {
    finishShake(false);
  }

  // Screen shake
  if (phase === 'shake' || phase === 'aftershock' || phase === 'richter') {
    screenShakeX = (Math.random() - 0.5) * shakeMagnitude * 2.5;
    screenShakeY = (Math.random() - 0.5) * shakeMagnitude * 1.5;
  } else {
    screenShakeX *= 0.9;
    screenShakeY *= 0.9;
  }
}

// Check if the platform is still above survival line
function checkStructureSurvived() {
  if (!rescuePerson) return true;

  const platform = findHighestPlatformDynamic();
  if (!platform) {
    rescuePerson.alive = false;
    rescuePerson.platformBeam = null;
    return false;
  }

  const platformMidY = (platform.j1.y + platform.j2.y) / 2;
  const survivalLine = rescuePerson.y + 50; // 50px grace

  rescuePerson.alive = platformMidY < survivalLine;
  rescuePerson.platformBeam = platform;
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
  document.getElementById('result-title').textContent = win ? '🏗️ SURVIVED!' : '💥 COLLAPSED!';
  document.getElementById('result-title').style.color = win ? '#44ff44' : '#ff4444';
  document.getElementById('result-magnitude').textContent = win ? `${mag.toFixed(1)} Richter` : 'STRUCTURAL FAILURE';
  document.getElementById('result-magnitude').style.color = win ? '#ffd700' : '#ff6644';

  const beamsLeft = beams.filter(b => !b.broken).length;
  const totalBeams = beams.length;
  const eff = totalBeams > 0 ? Math.round((beamsLeft / totalBeams) * 100) : 0;

  let d = `Beams intact: ${beamsLeft}/${totalBeams} (${eff}%)<br>Budget used: ${budgetUsed}/${LEVELS[currentLevel].budget}<br>`;
  d += win ? `<span style="color:#ffd700">Richter Score: ${mag.toFixed(1)}</span>` : `<br><span style="color:#ff8866">💡 ${LEVELS[currentLevel].hint}</span>`;
  document.getElementById('result-details').innerHTML = d;

  const buttons = document.getElementById('result-buttons');
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
  if (window.BrainSmacks) BrainSmacks.showRecommendations(document.getElementById('end-recommendations'));
}

// ── Particles ──
function spawnBreakParticles(beam) {
  const mx = (beam.j1.x + beam.j2.x) / 2, my = (beam.j1.y + beam.j2.y) / 2;
  const mat = MATERIALS[beam.mat];
  const isWood = beam.mat === 'wood';
  for (let i = 0; i < (isWood ? 12 : 8); i++) {
    particles.push({
      x: mx + (Math.random() - 0.5) * 20, y: my + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300 - 100,
      life: 1, decay: 0.5 + Math.random() * 0.5,
      size: isWood ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
      color: mat.snapColor, isSpark: beam.mat === 'steel',
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
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

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-20, -20, W + 40, H + 40);

  // Grid
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Ground
  ctx.fillStyle = '#2a2a4e';
  ctx.fillRect(-20, groundY, W + 40, H - groundY + 20);
  ctx.strokeStyle = '#00ffff44';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-20, groundY); ctx.lineTo(W + 20, groundY); ctx.stroke();

  // Target height & survival line
  if (rescuePerson) {
    const sy = rescuePerson.y + 50;
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

  // Highlight platform beam during build
  if (phase === 'build') {
    const plat = findHighestPlatform();
    if (plat) {
      ctx.strokeStyle = '#00ffcc33';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(plat.j1.x, plat.j1.y);
      ctx.lineTo(plat.j2.x, plat.j2.y);
      ctx.stroke();
      // Label
      const mx = (plat.j1.x + plat.j2.x) / 2;
      const my = (plat.j1.y + plat.j2.y) / 2;
      ctx.fillStyle = '#00ffcc66';
      ctx.font = '10px Courier New';
      ctx.fillText('PLATFORM', mx - 28, my - 10);
    }
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
      if (ratio < 0.4) color = lerpColor('#44ff44', '#ffff00', ratio / 0.4);
      else if (ratio < 0.7) color = lerpColor('#ffff00', '#ff8800', (ratio - 0.4) / 0.3);
      else color = lerpColor('#ff8800', '#ff2222', (ratio - 0.7) / 0.3);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = b.mat === 'cable' ? 2 : (b.mat === 'steel' ? 5 : 4);
    if (b.mat === 'cable') ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(b.j1.x, b.j1.y); ctx.lineTo(b.j2.x, b.j2.y); ctx.stroke();
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
      ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.stroke();
    }
  }

  // Hover preview
  if (phase === 'build' && hoverPos && selectedJoint && !deleteMode) {
    const snap = snapPos(hoverPos.x, hoverPos.y);
    ctx.strokeStyle = '#00ffff44'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(selectedJoint.x, selectedJoint.y); ctx.lineTo(snap.x, snap.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(snap.x, snap.y, 6, 0, Math.PI * 2); ctx.strokeStyle = '#00ffff66'; ctx.stroke();
  }

  // Delete highlight
  if (phase === 'build' && deleteMode && hoverPos) {
    let best = null, bestD = 25;
    for (const b of beams) {
      if (b.broken) continue;
      const d = distToSegment(hoverPos, b.j1, b.j2);
      if (d < bestD) { bestD = d; best = b; }
    }
    if (best) {
      ctx.strokeStyle = '#ff444488'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(best.j1.x, best.j1.y); ctx.lineTo(best.j2.x, best.j2.y); ctx.stroke();
    }
  }

  // Rescue person — sits on platform
  drawRescuePerson();

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.isSpark ? (Math.random() > 0.5 ? '#ffaa00' : '#fff') : p.color;
    if (p.isSpark) ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    else ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.globalAlpha = 1;
  }

  // Status text
  if (phase === 'settle') {
    ctx.fillStyle = '#ffaa0088'; ctx.font = 'bold 20px Courier New';
    ctx.fillText('Settling structure...', 20, H - 30);
  } else if (phase === 'shake' || phase === 'aftershock' || phase === 'richter') {
    ctx.fillStyle = '#ff444488'; ctx.font = 'bold 24px Courier New';
    const label = phase === 'aftershock' ? 'AFTERSHOCK' : (phase === 'richter' ? 'RICHTER TEST' : 'EARTHQUAKE');
    ctx.fillText(`${label}: ${shakeMagnitude.toFixed(1)}`, 20, H - 30);
  }

  // Build hint
  if (phase === 'build' && LEVELS[currentLevel].hint) {
    ctx.fillStyle = '#ffffff22'; ctx.font = '12px Courier New';
    ctx.fillText(`💡 ${LEVELS[currentLevel].hint}`, 20, H - 12);
  }

  // Warning message
  if (warningTimer > 0) {
    ctx.fillStyle = `rgba(255,100,50,${Math.min(warningTimer, 1)})`;
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(buildWarning, W / 2, H * 0.15);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function drawRescuePerson() {
  if (!rescuePerson) return;

  let personX, personY;
  const shaking = (phase === 'shake' || phase === 'aftershock' || phase === 'richter');

  if (phase === 'build') {
    // During build: show person at platform position or target height
    const plat = findHighestPlatform();
    if (plat) {
      personX = (plat.j1.x + plat.j2.x) / 2;
      personY = (plat.j1.y + plat.j2.y) / 2 - 18;
    } else {
      personX = W / 2;
      personY = rescuePerson.y - 5;
      // Ghost person — show where they need to be
      ctx.globalAlpha = 0.3;
    }
  } else {
    // During shake: person sits on current platform
    const plat = findHighestPlatformDynamic();
    if (plat) {
      personX = (plat.j1.x + plat.j2.x) / 2;
      personY = (plat.j1.y + plat.j2.y) / 2 - 18;
    } else {
      // No platform — person falling!
      personX = W / 2;
      personY = groundY - 20;
    }
  }

  const wobble = shaking ? Math.sin(Date.now() / 50) * shakeMagnitude * 0.8 : 0;
  const px = personX + wobble;

  ctx.fillStyle = rescuePerson.alive ? '#ffcc00' : '#ff4444';
  // Head
  ctx.beginPath(); ctx.arc(px, personY - 10, 6, 0, Math.PI * 2); ctx.fill();
  // Body
  ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px, personY - 4); ctx.lineTo(px, personY + 8); ctx.stroke();
  // Arms
  const armWave = shaking ? Math.sin(Date.now() / 80) * 12 : 0;
  ctx.beginPath(); ctx.moveTo(px - 8, personY + armWave); ctx.lineTo(px + 8, personY - armWave); ctx.stroke();
  // Legs
  ctx.beginPath();
  ctx.moveTo(px, personY + 8); ctx.lineTo(px - 5, personY + 16);
  ctx.moveTo(px, personY + 8); ctx.lineTo(px + 5, personY + 16);
  ctx.stroke();

  if (shaking && rescuePerson.alive) {
    ctx.fillStyle = '#ffffff88'; ctx.font = '10px Courier New';
    const panics = ['HELP!', 'AHHH!', '😱', 'NOOO!'];
    ctx.fillText(panics[Math.floor(Date.now() / 300) % panics.length], px + 12, personY - 8);
  }

  ctx.globalAlpha = 1; // Reset from ghost mode
}

function lerpColor(c1, c2, t) {
  t = Math.max(0, Math.min(1, t));
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

// ── Game Loop ──
let lastTime = 0;
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;

  if (phase === 'settle' || phase === 'shake' || phase === 'aftershock' || phase === 'richter') {
    physicsTick(dt);
    updateShake(dt);
  }

  if (warningTimer > 0) warningTimer -= dt;
  updateParticles(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

// ── Splash ──
document.getElementById('btn-play').addEventListener('click', () => {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  resize();
  loadLevel(0);
  requestAnimationFrame(gameLoop);
});
