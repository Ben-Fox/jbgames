// Tree Fall - game.js (Overhauled: two-click cut, painterly graphics, subtle wind)
(function() {
'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const menuScreen = document.getElementById('menu-screen');
const levelSelect = document.getElementById('level-select');
const levelGrid = document.getElementById('level-grid');
const hud = document.getElementById('hud');
const levelTitle = document.getElementById('level-title');
const objectiveText = document.getElementById('objective-text');
const windArrow = document.getElementById('wind-arrow');
const windStrength = document.getElementById('wind-strength');
const timberBtn = document.getElementById('btn-timber');
const cutHint = document.getElementById('cut-hint');
const resultOverlay = document.getElementById('result-overlay');
const resultTitle = document.getElementById('result-title');
const resultStars = document.getElementById('result-stars');
const resultMessage = document.getElementById('result-message');

// State
let W, H, scale;
let state = 'menu';
let currentLevel = 0;
let progress = JSON.parse(localStorage.getItem('treefall_progress') || '{}');
let trees = [];
let objects = [];
let particles = [];
let ambientParticles = [];
let windLines = [];
let cutLine = null;
let activeTreeIndex = 0;
let fallTime = 0;
let shakeX = 0, shakeY = 0;
let windCurrent = 0;
let windTimer = 0;
let quakeTimer = 0;
let objectiveTimer = 0;
let slowMoFactor = 1;
let damageTotal = 0;
let hitObjects = [];
let groundCracks = [];
let audioCtx = null;
let mousePos = { x: 0, y: 0 };
let levelData = null;
let animFrame = 0;
let lastTime = 0;
let ballPhysics = null;
let walkerState = null;
let dunked = false;
let pinsKnocked = 0;

// Audio (unchanged)
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    switch(type) {
      case 'chainsaw': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 120;
        osc.frequency.linearRampToValueAtTime(180, now + 0.3);
        gain.gain.value = 0.15;
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.4);
        break;
      }
      case 'creak': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 80;
        osc.frequency.linearRampToValueAtTime(40, now + 0.8);
        gain.gain.value = 0.2;
        gain.gain.linearRampToValueAtTime(0, now + 0.8);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.8);
        break;
      }
      case 'crash': {
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        const src = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        src.buffer = buffer; gain.gain.value = 0.4;
        src.connect(gain).connect(audioCtx.destination); src.start(now);
        break;
      }
      case 'glass': {
        const bufferSize = audioCtx.sampleRate * 0.3;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05)) * Math.sin(i * 0.3);
        const src = audioCtx.createBufferSource(); src.buffer = buffer;
        const gain = audioCtx.createGain(); gain.gain.value = 0.2;
        src.connect(gain).connect(audioCtx.destination); src.start(now);
        break;
      }
      case 'cheer': {
        const bufferSize = audioCtx.sampleRate * 1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.3 * (1 - i / bufferSize);
          data[i] += Math.sin(i * 0.05) * 0.1 * (1 - i / bufferSize);
        }
        const src = audioCtx.createBufferSource(); src.buffer = buffer;
        src.connect(audioCtx.destination); src.start(now);
        break;
      }
      case 'trombone': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.setValueAtTime(220, now + 0.3);
        osc.frequency.setValueAtTime(196, now + 0.6);
        osc.frequency.linearRampToValueAtTime(130, now + 1.2);
        gain.gain.value = 0.15;
        gain.gain.linearRampToValueAtTime(0, now + 1.5);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 1.5);
        break;
      }
      case 'splash': {
        const bufferSize = audioCtx.sampleRate * 0.4;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1)) * 0.5;
        const src = audioCtx.createBufferSource(); src.buffer = buffer;
        src.connect(audioCtx.destination); src.start(now);
        break;
      }
      case 'wind': {
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.05 * Math.sin(i / bufferSize * Math.PI);
        const src = audioCtx.createBufferSource(); src.buffer = buffer;
        src.connect(audioCtx.destination); src.start(now);
        break;
      }
      case 'bowling': {
        for (let i = 0; i < 3; i++) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle'; osc.frequency.value = 200 + i * 100;
          gain.gain.value = 0.1; gain.gain.linearRampToValueAtTime(0, now + 0.3 + i * 0.1);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now + i * 0.05); osc.stop(now + 0.3 + i * 0.1);
        }
        break;
      }
      case 'crunch': {
        const bufferSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.03));
        const src = audioCtx.createBufferSource(); src.buffer = buffer;
        const gain = audioCtx.createGain(); gain.gain.value = 0.3;
        src.connect(gain).connect(audioCtx.destination); src.start(now);
        break;
      }
    }
  } catch(e) {}
}

// Resize
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  scale = Math.min(W / 800, H / 600);
}
window.addEventListener('resize', resize);
resize();

// Save/Load
function saveProgress() {
  localStorage.setItem('treefall_progress', JSON.stringify(progress));
}

// Level Select
function buildLevelSelect() {
  levelGrid.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    const unlocked = i === 0 || progress[i - 1];
    if (unlocked) btn.classList.add('unlocked');
    else btn.classList.add('locked');
    const stars = progress[i] || 0;
    btn.innerHTML = `<span class="num">${i + 1}</span><span class="name" style="font-size:0.7em;display:block">${lv.name}</span><span class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>`;
    if (unlocked) btn.onclick = () => startLevel(i);
    levelGrid.appendChild(btn);
  });
}

function showScreen(name) {
  menuScreen.classList.remove('active');
  levelSelect.classList.remove('active');
  hud.classList.remove('active');
  if (name === 'menu') { menuScreen.classList.add('active'); state = 'menu'; }
  else if (name === 'levelselect') { levelSelect.classList.add('active'); state = 'levelselect'; buildLevelSelect(); }
  else if (name === 'hud') { hud.classList.add('active'); }
}

// ============ PAINTERLY DRAWING HELPERS ============

function drawPainterlySky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#2a5fa8');
  grad.addColorStop(0.25, '#4a8fd9');
  grad.addColorStop(0.5, '#7bb8e8');
  grad.addColorStop(0.7, '#a8d4f0');
  grad.addColorStop(0.85, '#d4e8c8');
  grad.addColorStop(1, '#e8dcc0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Atmospheric haze layers
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 3; i++) {
    const y = H * 0.3 + i * H * 0.15;
    const hGrad = ctx.createLinearGradient(0, y - 30, 0, y + 30);
    hGrad.addColorStop(0, 'transparent');
    hGrad.addColorStop(0.5, '#d4c8b0');
    hGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, y - 30, W, 60);
  }
  ctx.globalAlpha = 1;
}

function drawPainterlyClouds() {
  const cloudT = animFrame * 0.0002;
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 220 + cloudT * 40 * (i + 1)) % (W + 300)) - 150;
    const cy = 30 + i * 40 + Math.sin(i * 2.3) * 15;
    const sz = 0.7 + Math.sin(i * 1.7) * 0.3;

    // Shadow
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#556';
    drawCloudShape(cx + 3, cy + 4, sz);

    // Main cloud body
    ctx.globalAlpha = 0.7;
    const cGrad = ctx.createRadialGradient(cx + 20, cy - 10, 5, cx + 20, cy, 50 * sz);
    cGrad.addColorStop(0, '#fff');
    cGrad.addColorStop(0.6, 'rgba(240,245,255,0.8)');
    cGrad.addColorStop(1, 'rgba(200,215,235,0.3)');
    ctx.fillStyle = cGrad;
    drawCloudShape(cx, cy, sz);

    ctx.globalAlpha = 1;
  }
}

function drawCloudShape(cx, cy, sz) {
  ctx.beginPath();
  ctx.arc(cx, cy, 28 * sz, 0, Math.PI * 2);
  ctx.arc(cx + 30 * sz, cy - 8 * sz, 24 * sz, 0, Math.PI * 2);
  ctx.arc(cx + 55 * sz, cy + 2 * sz, 26 * sz, 0, Math.PI * 2);
  ctx.arc(cx + 25 * sz, cy + 8 * sz, 20 * sz, 0, Math.PI * 2);
  ctx.fill();
}

function drawPainterlyGround(gy) {
  if (levelData?.customGround === 'cliffs') {
    drawCliffGround(gy);
    return;
  }

  // Deep earth
  const earthGrad = ctx.createLinearGradient(0, gy, 0, H);
  earthGrad.addColorStop(0, '#5a7a2a');
  earthGrad.addColorStop(0.05, '#4a6a20');
  earthGrad.addColorStop(0.15, '#6b4a26');
  earthGrad.addColorStop(0.5, '#5a3a1a');
  earthGrad.addColorStop(1, '#3a2510');
  ctx.fillStyle = earthGrad;
  ctx.fillRect(0, gy - 8, W, H - gy + 20);

  // Grass blades layer
  const grassGrad = ctx.createLinearGradient(0, gy - 12, 0, gy + 5);
  grassGrad.addColorStop(0, '#6aaa30');
  grassGrad.addColorStop(0.4, '#5a9425');
  grassGrad.addColorStop(1, '#4a7a1a');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, gy - 8, W, 16);

  // Grass highlight strip
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#8ccc44';
  ctx.fillRect(0, gy - 8, W, 3);
  ctx.globalAlpha = 1;

  // Textured grass tufts
  ctx.strokeStyle = '#6aaa30';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < W; x += 8 + Math.random() * 6) {
    const h = 4 + Math.random() * 8;
    const lean = Math.sin(animFrame * 0.003 + x * 0.1) * 1.5;
    ctx.globalAlpha = 0.4 + Math.random() * 0.3;
    ctx.strokeStyle = `hsl(${95 + Math.random() * 25}, ${50 + Math.random() * 20}%, ${35 + Math.random() * 15}%)`;
    ctx.beginPath();
    ctx.moveTo(x, gy - 3);
    ctx.quadraticCurveTo(x + lean, gy - 3 - h * 0.6, x + lean * 1.5, gy - 3 - h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Dirt texture dots
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 40; i++) {
    const dx = Math.random() * W;
    const dy = gy + 15 + Math.random() * (H - gy - 15);
    const dr = 1 + Math.random() * 3;
    ctx.fillStyle = Math.random() > 0.5 ? '#8a6a3a' : '#5a4020';
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCliffGround(gy) {
  // Left cliff
  const lGrad = ctx.createLinearGradient(0, gy - 10, 0, H);
  lGrad.addColorStop(0, '#7a6b4a');
  lGrad.addColorStop(0.1, '#6b5b3a');
  lGrad.addColorStop(1, '#4a3a20');
  ctx.fillStyle = lGrad;
  ctx.fillRect(0, gy, W * 0.42, H - gy + 50);

  // Right cliff
  ctx.fillStyle = lGrad;
  ctx.fillRect(W * 0.58, gy, W * 0.42 + 50, H - gy + 50);

  // Gap (deep dark)
  const gapGrad = ctx.createLinearGradient(0, gy, 0, H);
  gapGrad.addColorStop(0, '#1a1a3e');
  gapGrad.addColorStop(1, '#0a0a15');
  ctx.fillStyle = gapGrad;
  ctx.fillRect(W * 0.42, gy, W * 0.16, H - gy + 50);

  // Fog in gap
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#668';
  ctx.fillRect(W * 0.42, gy + 20, W * 0.16, 40);
  ctx.globalAlpha = 1;

  // Cliff edge highlights
  ctx.fillStyle = '#8a7b5a';
  ctx.fillRect(0, gy - 2, W * 0.42, 5);
  ctx.fillRect(W * 0.58, gy - 2, W * 0.42 + 50, 5);

  // Grass on cliffs
  const cGrass = ctx.createLinearGradient(0, gy - 8, 0, gy + 3);
  cGrass.addColorStop(0, '#6aaa30');
  cGrass.addColorStop(1, '#4a8a1a');
  ctx.fillStyle = cGrass;
  ctx.fillRect(0, gy - 6, W * 0.42, 10);
  ctx.fillRect(W * 0.58, gy - 6, W * 0.42 + 50, 10);
}

// ============ AMBIENT PARTICLES (floating leaves, dust motes) ============

function initAmbientParticles() {
  ambientParticles = [];
  for (let i = 0; i < 15; i++) {
    ambientParticles.push(createAmbientParticle());
  }
}

function createAmbientParticle() {
  const isLeaf = Math.random() > 0.5;
  return {
    x: Math.random() * W,
    y: Math.random() * H * 0.8,
    vx: (Math.random() - 0.5) * 0.3,
    vy: 0.1 + Math.random() * 0.3,
    size: isLeaf ? (3 + Math.random() * 4) : (1 + Math.random() * 2),
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.02,
    type: isLeaf ? 'leaf' : 'dust',
    alpha: 0.15 + Math.random() * 0.25,
    color: isLeaf
      ? `hsl(${90 + Math.random() * 50}, ${40 + Math.random() * 30}%, ${30 + Math.random() * 25}%)`
      : `rgba(200,190,160,${0.2 + Math.random() * 0.2})`
  };
}

function updateAmbientParticles(dt) {
  for (const p of ambientParticles) {
    p.x += (p.vx + windCurrent * 0.05) * dt;
    p.y += p.vy * dt;
    p.rot += p.rotV * dt;
    if (p.y > H || p.x < -20 || p.x > W + 20) {
      Object.assign(p, createAmbientParticle());
      p.y = -10;
      p.x = Math.random() * W;
    }
  }
}

function drawAmbientParticles() {
  for (const p of ambientParticles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    if (p.type === 'leaf') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ============ TREE CLASS (painterly) ============

class Tree {
  constructor(cfg, idx) {
    this.idx = idx;
    this.baseX = cfg.x * W;
    this.groundY = (levelData.groundLevel || 0.85) * H;
    this.height = cfg.height * scale;
    this.trunkW = cfg.trunk * scale;
    this.lean = (cfg.lean || 0) * Math.PI / 180;
    this.x = this.baseX;
    this.y = this.groundY;
    this.cutY = 0;
    this.cutAngle = 0;
    this.angle = this.lean;
    this.angularVel = 0;
    this.falling = false;
    this.fallen = false;
    this.detached = false;
    this.pivotX = 0;
    this.pivotY = 0;
    this.settled = false;
    this.settleTime = 0;
    this.branches = [];
    this.canopySeeds = [];
    this.generateBranches();
    this.generateCanopySeeds();
  }

  generateBranches() {
    const n = Math.floor(3 + Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const h = 0.3 + Math.random() * 0.55;
      const side = Math.random() > 0.5 ? 1 : -1;
      const len = (20 + Math.random() * 30) * scale;
      this.branches.push({ h, side, len, angle: side * (0.3 + Math.random() * 0.5) });
    }
  }

  generateCanopySeeds() {
    // Pre-generate organic canopy blob positions
    for (let i = 0; i < 8; i++) {
      this.canopySeeds.push({
        ox: (Math.random() - 0.5) * this.trunkW * 4,
        oy: (Math.random() - 0.5) * this.trunkW * 2,
        r: this.trunkW * (1.2 + Math.random() * 1.2),
        hue: 95 + Math.random() * 40,
        sat: 40 + Math.random() * 25,
        lit: 25 + Math.random() * 20
      });
    }
  }

  get tipX() {
    return this.pivotX + Math.sin(this.angle) * (this.height - this.cutY);
  }
  get tipY() {
    return this.pivotY - Math.cos(this.angle) * (this.height - this.cutY);
  }

  startFall(cutAngle) {
    this.cutY = this.height * 0.15;
    this.cutAngle = cutAngle;
    this.pivotX = this.x;
    this.pivotY = this.y - this.cutY;
    this.falling = true;
    this.angularVel = cutAngle;
    playSound('creak');
  }

  update(dt, wind) {
    if (!this.falling || this.settled) return;
    const gravity = 9.8 * scale * 0.001;
    const windForce = wind * 0.0003;
    const massDist = (this.height - this.cutY) * 0.5;
    const torque = gravity * Math.sin(this.angle) * massDist * 0.01 + windForce * Math.cos(this.angle) * massDist * 0.01;
    this.angularVel += torque * dt;
    this.angularVel *= 0.999;
    this.angle += this.angularVel * dt;
    const tipY = this.pivotY - Math.cos(this.angle) * (this.height - this.cutY);
    if (tipY >= this.groundY) {
      this.fallen = true;
      this.settled = true;
      const maxAngle = Math.acos(Math.max(-1, Math.min(1, (this.pivotY - this.groundY) / (this.height - this.cutY))));
      if (this.angle > 0) this.angle = maxAngle || this.angle;
      else this.angle = -(maxAngle || -this.angle);
      this.settleTime = 0;
    }
  }

  getFallTipWorldX() {
    return this.pivotX + Math.sin(this.angle) * (this.height - this.cutY);
  }

  draw(ctx) {
    // Subtle sway when not falling (very gentle, 1-2 degrees max)
    let swayAngle = 0;
    if (!this.falling) {
      swayAngle = Math.sin(animFrame * 0.008 + this.idx * 2) * 0.02
                + Math.sin(animFrame * 0.013 + this.idx * 5) * 0.01;
    }

    ctx.save();
    if (this.falling) {
      ctx.translate(this.pivotX, this.pivotY);
      ctx.rotate(this.angle - this.lean);
      this.drawTree(ctx, -(this.height - this.cutY));
    } else {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.lean + swayAngle);
      this.drawTree(ctx, -this.height);
    }
    ctx.restore();

    // Stump
    if (this.falling) {
      ctx.save();
      const stumpH = this.cutY;
      // Stump gradient
      const sGrad = ctx.createLinearGradient(this.x - this.trunkW / 2, this.y - stumpH, this.x + this.trunkW / 2, this.y);
      sGrad.addColorStop(0, '#5a3a1a');
      sGrad.addColorStop(0.5, '#6b4a26');
      sGrad.addColorStop(1, '#4a2a10');
      ctx.fillStyle = sGrad;
      ctx.fillRect(this.x - this.trunkW / 2, this.y - stumpH, this.trunkW, stumpH);
      // Cut surface (rings)
      const cGrad = ctx.createRadialGradient(this.x, this.y - stumpH, 0, this.x, this.y - stumpH, this.trunkW / 2 + 2);
      cGrad.addColorStop(0, '#e8c878');
      cGrad.addColorStop(0.3, '#d4aa50');
      cGrad.addColorStop(0.6, '#c09040');
      cGrad.addColorStop(1, '#8a6020');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - stumpH, this.trunkW / 2 + 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Rings
      ctx.strokeStyle = 'rgba(120,80,30,0.3)';
      ctx.lineWidth = 0.5;
      for (let r = 3; r < this.trunkW / 2; r += 3) {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - stumpH, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Drop shadow on ground
    if (!this.falling) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(this.x + 5, this.y + 2, this.trunkW * 2.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawTree(ctx, startY) {
    const h = this.height - (this.falling ? this.cutY : 0);

    // Trunk with gradient and bark
    const tw = this.trunkW;
    const tGrad = ctx.createLinearGradient(-tw / 2, startY, tw / 2, startY);
    tGrad.addColorStop(0, '#3a2010');
    tGrad.addColorStop(0.2, '#5a3518');
    tGrad.addColorStop(0.5, '#7a5030');
    tGrad.addColorStop(0.8, '#5a3518');
    tGrad.addColorStop(1, '#3a2010');
    ctx.fillStyle = tGrad;

    // Slightly tapered trunk
    ctx.beginPath();
    ctx.moveTo(-tw / 2, startY + h);
    ctx.lineTo(-tw * 0.35, startY);
    ctx.lineTo(tw * 0.35, startY);
    ctx.lineTo(tw / 2, startY + h);
    ctx.closePath();
    ctx.fill();

    // Bark texture lines
    ctx.strokeStyle = 'rgba(40,20,5,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 10 * scale) {
      const t = i / h;
      const w = tw * 0.5 * (1 - t * 0.3);
      ctx.beginPath();
      ctx.moveTo(-w + 2 + Math.sin(i * 0.7) * 2, startY + i);
      ctx.bezierCurveTo(
        -w * 0.3 + Math.sin(i * 0.5) * 3, startY + i + 3,
        w * 0.3 + Math.cos(i * 0.3) * 3, startY + i + 6,
        w - 2 + Math.sin(i * 0.9) * 2, startY + i + 4
      );
      ctx.stroke();
    }

    // Highlight strip on trunk
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#c8a060';
    ctx.fillRect(-tw * 0.1, startY, tw * 0.15, h);
    ctx.globalAlpha = 1;

    // Branches with gradient
    for (const b of this.branches) {
      const by = startY + h * (1 - b.h);
      ctx.save();
      ctx.translate(0, by);
      ctx.rotate(b.angle);

      const bGrad = ctx.createLinearGradient(0, 0, b.len, 0);
      bGrad.addColorStop(0, '#5a3518');
      bGrad.addColorStop(1, '#7a5530');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.moveTo(0, -3 * scale);
      ctx.lineTo(b.len, -1.5 * scale);
      ctx.lineTo(b.len, 1.5 * scale);
      ctx.lineTo(0, 3 * scale);
      ctx.closePath();
      ctx.fill();

      // Leaves on branch (painterly blobs)
      for (let j = 0; j < 3; j++) {
        const lx = b.len * (0.4 + j * 0.25);
        const lr = (10 + Math.random() * 4) * scale;
        const lGrad = ctx.createRadialGradient(lx - 2, -7 * scale, 1, lx, -3 * scale, lr);
        lGrad.addColorStop(0, '#5cc840');
        lGrad.addColorStop(0.5, '#3a9a28');
        lGrad.addColorStop(1, '#1e6818');
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.arc(lx, -5 * scale, lr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Canopy (organic blobby shapes with gradients)
    const canopyBaseY = startY + h * 0.05;
    const canopyR = tw * 2.5;

    // Shadow layer under canopy
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#000';
    for (const s of this.canopySeeds) {
      ctx.beginPath();
      ctx.arc(s.ox + 4, canopyBaseY + s.oy + 6, s.r * 0.95, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Main canopy blobs
    for (const s of this.canopySeeds) {
      const cGrad = ctx.createRadialGradient(
        s.ox - s.r * 0.3, canopyBaseY + s.oy - s.r * 0.3, s.r * 0.1,
        s.ox, canopyBaseY + s.oy, s.r
      );
      cGrad.addColorStop(0, `hsl(${s.hue}, ${s.sat + 15}%, ${s.lit + 20}%)`);
      cGrad.addColorStop(0.5, `hsl(${s.hue}, ${s.sat}%, ${s.lit + 5}%)`);
      cGrad.addColorStop(1, `hsl(${s.hue + 10}, ${s.sat - 5}%, ${s.lit - 5}%)`);
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(s.ox, canopyBaseY + s.oy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Highlight blobs on top
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#8ce060';
    for (let i = 0; i < 3; i++) {
      const hx = (i - 1) * canopyR * 0.4;
      const hy = canopyBaseY - canopyR * 0.15 + i * 3;
      ctx.beginPath();
      ctx.arc(hx, hy, canopyR * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ============ OBJECT DRAWING (painterly) ============

function drawObject(obj) {
  const ox = obj.x * W;
  const ow = obj.w * W;
  const gy = (levelData.groundLevel || 0.85) * H;
  const oh = obj.h * scale;
  const oy = gy - oh + (obj.yOff || 0) * scale;

  if (obj.hit && obj.type !== 'pin') ctx.globalAlpha = 0.5;

  // Drop shadow
  ctx.save();
  if (obj.type !== 'cliff' && obj.type !== 'powerline' && obj.type !== 'pool') {
    ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.1;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(ox, gy + 3, ow / 2 + 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = obj.hit && obj.type !== 'pin' ? 0.5 : 1;
  }

  switch(obj.type) {
    case 'house': {
      // Wall with gradient
      const wGrad = ctx.createLinearGradient(ox - ow / 2, oy, ox + ow / 2, oy + oh);
      wGrad.addColorStop(0, obj.hit ? '#888' : '#f0e4cc');
      wGrad.addColorStop(0.5, obj.hit ? '#777' : '#e8d4b0');
      wGrad.addColorStop(1, obj.hit ? '#666' : '#d8c4a0');
      ctx.fillStyle = wGrad;
      ctx.fillRect(ox - ow / 2, oy, ow, oh);

      // Wall shadow on left side
      ctx.globalAlpha = (obj.hit ? 0.5 : 1) * 0.15;
      ctx.fillStyle = '#000';
      ctx.fillRect(ox - ow / 2, oy, ow * 0.15, oh);
      ctx.globalAlpha = obj.hit ? 0.5 : 1;

      // Roof gradient
      const rGrad = ctx.createLinearGradient(ox, oy - oh * 0.4, ox, oy);
      rGrad.addColorStop(0, obj.hit ? '#555' : '#a82818');
      rGrad.addColorStop(1, obj.hit ? '#666' : '#c83828');
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(ox - ow / 2 - 10, oy);
      ctx.lineTo(ox, oy - oh * 0.4);
      ctx.lineTo(ox + ow / 2 + 10, oy);
      ctx.closePath();
      ctx.fill();

      // Roof highlight
      ctx.globalAlpha = (obj.hit ? 0.5 : 1) * 0.2;
      ctx.fillStyle = '#f88';
      ctx.beginPath();
      ctx.moveTo(ox - ow / 4, oy);
      ctx.lineTo(ox, oy - oh * 0.35);
      ctx.lineTo(ox + ow / 8, oy);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = obj.hit ? 0.5 : 1;

      // Door gradient
      const dGrad = ctx.createLinearGradient(ox - 8 * scale, oy + oh * 0.4, ox + 8 * scale, oy + oh);
      dGrad.addColorStop(0, '#9a5520');
      dGrad.addColorStop(1, '#6a3510');
      ctx.fillStyle = dGrad;
      ctx.fillRect(ox - 8 * scale, oy + oh * 0.4, 16 * scale, oh * 0.6);

      // Door knob
      ctx.fillStyle = '#d4aa40';
      ctx.beginPath();
      ctx.arc(ox + 4 * scale, oy + oh * 0.7, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Windows with glow
      const winCol = obj.hit ? '#555' : '#88ccee';
      ctx.fillStyle = winCol;
      ctx.fillRect(ox - ow / 3, oy + oh * 0.15, 14 * scale, 12 * scale);
      ctx.fillRect(ox + ow / 6, oy + oh * 0.15, 14 * scale, 12 * scale);

      // Window shine
      if (!obj.hit) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox - ow / 3 + 1, oy + oh * 0.15 + 1, 4 * scale, 5 * scale);
        ctx.fillRect(ox + ow / 6 + 1, oy + oh * 0.15 + 1, 4 * scale, 5 * scale);
        ctx.globalAlpha = 1;
      }

      // Window frames
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox - ow / 3, oy + oh * 0.15, 14 * scale, 12 * scale);
      ctx.strokeRect(ox + ow / 6, oy + oh * 0.15, 14 * scale, 12 * scale);

      if (obj.hit) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox - 10, oy + 10);
        ctx.lineTo(ox + 15, oy + oh / 2);
        ctx.lineTo(ox - 5, oy + oh);
        ctx.stroke();
      }
      break;
    }
    case 'car': {
      const carY = gy - oh;
      // Body gradient
      const bGrad = ctx.createLinearGradient(ox, carY, ox, carY + oh * 0.6);
      bGrad.addColorStop(0, obj.hit ? '#777' : '#f05040');
      bGrad.addColorStop(1, obj.hit ? '#555' : '#b02818');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.roundRect(ox - ow / 2, carY, ow, oh * 0.6, 5);
      ctx.fill();

      // Car top
      const tGrad = ctx.createLinearGradient(ox, carY - oh * 0.35, ox, carY + oh * 0.05);
      tGrad.addColorStop(0, obj.hit ? '#666' : '#d83020');
      tGrad.addColorStop(1, obj.hit ? '#555' : '#c02818');
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.roundRect(ox - ow / 3, carY - oh * 0.35, ow * 0.6, oh * 0.4, 4);
      ctx.fill();

      // Windows
      ctx.fillStyle = obj.hit ? '#444' : '#88ccee';
      ctx.fillRect(ox - ow / 4, carY - oh * 0.3, ow * 0.2, oh * 0.25);
      ctx.fillRect(ox + ow / 12, carY - oh * 0.3, ow * 0.2, oh * 0.25);

      // Shine on body
      ctx.globalAlpha = (obj.hit ? 0.5 : 1) * 0.15;
      ctx.fillStyle = '#fff';
      ctx.fillRect(ox - ow / 2 + 5, carY + 3, ow - 10, oh * 0.15);
      ctx.globalAlpha = obj.hit ? 0.5 : 1;

      // Wheels with depth
      for (const wx of [ox - ow / 3, ox + ow / 3]) {
        const wGrad = ctx.createRadialGradient(wx - 1, gy - 1, 1, wx, gy, 8 * scale);
        wGrad.addColorStop(0, '#444');
        wGrad.addColorStop(0.6, '#222');
        wGrad.addColorStop(1, '#111');
        ctx.fillStyle = wGrad;
        ctx.beginPath();
        ctx.arc(wx, gy, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        // Hubcap
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(wx, gy, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      if (obj.hit) {
        ctx.fillStyle = '#888';
        ctx.fillRect(ox - ow / 2, carY, ow, oh * 0.3);
      }
      break;
    }
    case 'fence': {
      const fColor = obj.hit ? '#999' : '#f5eedd';
      const fShadow = obj.hit ? '#777' : '#d4c8aa';
      const posts = 6;
      for (let i = 0; i < posts; i++) {
        const px = ox - ow / 2 + (ow / (posts - 1)) * i;
        const pGrad = ctx.createLinearGradient(px - 2 * scale, gy - oh, px + 2 * scale, gy);
        pGrad.addColorStop(0, fColor);
        pGrad.addColorStop(1, fShadow);
        ctx.fillStyle = pGrad;
        ctx.fillRect(px - 2 * scale, gy - oh, 4 * scale, oh);
        // Post cap
        ctx.fillStyle = fColor;
        ctx.beginPath();
        ctx.moveTo(px - 3 * scale, gy - oh);
        ctx.lineTo(px, gy - oh - 4);
        ctx.lineTo(px + 3 * scale, gy - oh);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = fShadow;
      ctx.fillRect(ox - ow / 2, gy - oh * 0.7, ow, 3 * scale);
      ctx.fillRect(ox - ow / 2, gy - oh * 0.35, ow, 3 * scale);
      break;
    }
    case 'playground': {
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox - ow / 3, gy);
      ctx.lineTo(ox, gy - oh);
      ctx.lineTo(ox + ow / 3, gy);
      ctx.stroke();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox - 5, gy - oh);
      ctx.lineTo(ox - 8, gy - 10);
      ctx.stroke();
      ctx.fillStyle = '#d04030';
      ctx.fillRect(ox - 14, gy - 12, 12, 3);
      // Slide gradient
      const sGrad = ctx.createLinearGradient(ox + ow / 4, gy - oh * 0.8, ox + ow / 2, gy);
      sGrad.addColorStop(0, '#5ab8ee');
      sGrad.addColorStop(1, '#2878aa');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.moveTo(ox + ow / 4, gy - oh * 0.8);
      ctx.lineTo(ox + ow / 2, gy);
      ctx.lineTo(ox + ow / 2 - 5, gy);
      ctx.lineTo(ox + ow / 4 - 5, gy - oh * 0.8);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'stickfigure': {
      const sfx = obj.fleeX != null ? obj.fleeX : ox;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      const headY = gy - 25 * scale;
      ctx.beginPath(); ctx.arc(sfx, headY, 4 * scale, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sfx, headY + 4 * scale); ctx.lineTo(sfx, gy - 8 * scale); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sfx - 8 * scale, gy - 18 * scale); ctx.lineTo(sfx + 8 * scale, gy - 18 * scale); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sfx, gy - 8 * scale); ctx.lineTo(sfx - 6 * scale, gy); ctx.moveTo(sfx, gy - 8 * scale); ctx.lineTo(sfx + 6 * scale, gy); ctx.stroke();
      break;
    }
    case 'powerline': {
      const plY = gy + (obj.yOff || 0) * scale;
      // Pole gradient
      const polGrad = ctx.createLinearGradient(0, plY, 0, gy);
      polGrad.addColorStop(0, '#9a8565');
      polGrad.addColorStop(1, '#6a5535');
      ctx.fillStyle = polGrad;
      ctx.fillRect(ox - ow / 2, plY, 6, gy - plY);
      ctx.fillRect(ox + ow / 2 - 6, plY, 6, gy - plY);
      // Cross bar
      ctx.fillStyle = '#7a6545';
      ctx.fillRect(ox - ow / 2 - 5, plY, ow + 10, 4);
      // Wires
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        const wy = plY + w * 8;
        ctx.moveTo(ox - ow / 2 + 3, wy);
        ctx.quadraticCurveTo(ox, wy + 15, ox + ow / 2 - 3, wy);
        ctx.stroke();
      }
      break;
    }
    case 'pool': {
      // Water gradient
      const pGrad = ctx.createLinearGradient(ox - ow / 2, gy - oh, ox - ow / 2, gy);
      pGrad.addColorStop(0, '#5ac8ff');
      pGrad.addColorStop(0.5, '#3898dd');
      pGrad.addColorStop(1, '#2070aa');
      ctx.fillStyle = pGrad;
      ctx.fillRect(ox - ow / 2, gy - oh, ow, oh);
      // Pool edge
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 3;
      ctx.strokeRect(ox - ow / 2, gy - oh, ow, oh);
      // Water surface shimmer
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#8ae';
      ctx.fillRect(ox - ow / 2 + 3, gy - oh + 2, ow - 6, 4);
      ctx.globalAlpha = 1;
      // Ripples
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      for (let r = 0; r < 3; r++) {
        const rx = ox + (r - 1) * ow / 4 + Math.sin(animFrame * 0.02 + r) * 3;
        ctx.beginPath();
        ctx.arc(rx, gy - oh / 2, 5 + Math.sin(animFrame * 0.03 + r * 2) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'can': {
      if (!obj.hit) {
        const canGrad = ctx.createLinearGradient(ox - 4 * scale, 0, ox + 4 * scale, 0);
        canGrad.addColorStop(0, '#c82818');
        canGrad.addColorStop(0.3, '#f04030');
        canGrad.addColorStop(0.7, '#e83828');
        canGrad.addColorStop(1, '#a01808');
        ctx.fillStyle = canGrad;
        ctx.fillRect(ox - 4 * scale, gy - oh, 8 * scale, oh);
        // Top
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.ellipse(ox, gy - oh, 4 * scale, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `${6 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Cola', ox, gy - oh / 3);
      } else {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(ox - 6 * scale, gy - 3, 12 * scale, 3);
      }
      break;
    }
    case 'truck': {
      const trY = gy - oh;
      // Cab gradient
      const cabGrad = ctx.createLinearGradient(ox + ow / 4, trY, ox + ow / 4, trY + oh * 0.7);
      cabGrad.addColorStop(0, '#3898dd');
      cabGrad.addColorStop(1, '#2070aa');
      ctx.fillStyle = cabGrad;
      ctx.beginPath(); ctx.roundRect(ox + ow / 4, trY, ow / 3, oh * 0.7, 3); ctx.fill();
      ctx.fillStyle = '#88ccee';
      ctx.fillRect(ox + ow / 4 + 3, trY + 3, ow / 4, oh * 0.3);
      // Bed
      const bedGrad = ctx.createLinearGradient(0, trY + oh * 0.3, 0, trY + oh * 0.7);
      bedGrad.addColorStop(0, '#666');
      bedGrad.addColorStop(1, '#444');
      ctx.fillStyle = bedGrad;
      ctx.fillRect(ox - ow / 2, trY + oh * 0.3, ow * 0.75, oh * 0.4);
      ctx.fillStyle = '#555';
      ctx.fillRect(ox - ow / 2, trY + oh * 0.2, 3, oh * 0.5);
      ctx.fillRect(ox + ow / 4 - 3, trY + oh * 0.2, 3, oh * 0.5);
      // Wheels
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(ox - ow / 3, gy, 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ox + ow / 3, gy, 8 * scale, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cliff': break;
    case 'pin': {
      if (!obj.hit) {
        const pinGrad = ctx.createLinearGradient(ox - 4 * scale, gy - oh, ox + 4 * scale, gy);
        pinGrad.addColorStop(0, '#fff');
        pinGrad.addColorStop(0.7, '#eee');
        pinGrad.addColorStop(1, '#ccc');
        ctx.fillStyle = pinGrad;
        ctx.beginPath();
        ctx.moveTo(ox - 4 * scale, gy);
        ctx.lineTo(ox - 2 * scale, gy - oh * 0.6);
        ctx.quadraticCurveTo(ox, gy - oh, ox, gy - oh);
        ctx.quadraticCurveTo(ox, gy - oh, ox + 2 * scale, gy - oh * 0.6);
        ctx.lineTo(ox + 4 * scale, gy);
        ctx.closePath();
        ctx.fill();
        // Stripe
        ctx.fillStyle = '#e83828';
        ctx.beginPath();
        ctx.arc(ox, gy - oh + 3, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ddd';
        ctx.save();
        ctx.translate(ox, gy);
        ctx.rotate(obj.fallAngle || Math.PI / 2);
        ctx.fillRect(-2, -oh, 4, oh);
        ctx.restore();
      }
      break;
    }
    case 'dunktank': {
      const dtGrad = ctx.createLinearGradient(ox - ow / 2, gy - oh, ox - ow / 2, gy);
      dtGrad.addColorStop(0, '#5ac8ff');
      dtGrad.addColorStop(1, '#2070aa');
      ctx.fillStyle = dtGrad;
      ctx.fillRect(ox - ow / 2, gy - oh, ow, oh);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox - ow / 2, gy - oh, ow, oh);
      ctx.fillStyle = '#e83828';
      ctx.beginPath();
      ctx.arc(ox + ow / 2 + 10, gy - oh * 0.7, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      // White ring on target
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox + ow / 2 + 10, gy - oh * 0.7, 4 * scale, 0, Math.PI * 2);
      ctx.stroke();
      if (!dunked) {
        ctx.fillStyle = '#f5c542';
        ctx.beginPath(); ctx.arc(ox, gy - oh - 10, 6 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.fillRect(ox - 3, gy - oh - 4, 6, 8);
      }
      break;
    }
    case 'ramp': {
      const rGrad = ctx.createLinearGradient(ox - ow / 2, gy, ox - ow / 2, gy - oh);
      rGrad.addColorStop(0, '#6a4a2a');
      rGrad.addColorStop(1, '#9a7a5a');
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(ox - ow / 2, gy);
      ctx.lineTo(ox + ow / 2, gy);
      ctx.lineTo(ox - ow / 2, gy - oh);
      ctx.closePath();
      ctx.fill();
      if (!obj.hit) {
        const ballGrad = ctx.createRadialGradient(ox - ow / 4 - 2, gy - oh / 2 - 8, 1, ox - ow / 4, gy - oh / 2 - 6, 6 * scale);
        ballGrad.addColorStop(0, '#f0a040');
        ballGrad.addColorStop(1, '#c06010');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(ox - ow / 4, gy - oh / 2 - 6, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'hoop': {
      const hoopY = gy - oh;
      const polGrad = ctx.createLinearGradient(0, hoopY, 0, gy);
      polGrad.addColorStop(0, '#aaa'); polGrad.addColorStop(1, '#666');
      ctx.fillStyle = polGrad;
      ctx.fillRect(ox - 2, hoopY, 4, oh);
      ctx.fillStyle = '#fff';
      ctx.fillRect(ox - 12 * scale, hoopY, 24 * scale, 18 * scale);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox - 12 * scale, hoopY, 24 * scale, 18 * scale);
      // Inner box
      ctx.strokeStyle = '#e83828';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox - 6 * scale, hoopY + 4 * scale, 12 * scale, 10 * scale);
      // Rim
      ctx.strokeStyle = '#e83828';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox - 10 * scale, hoopY + 18 * scale);
      ctx.lineTo(ox + 10 * scale, hoopY + 18 * scale);
      ctx.stroke();
      // Net
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      for (let n = 0; n < 5; n++) {
        ctx.beginPath();
        ctx.moveTo(ox - 9 * scale + n * 4.5 * scale, hoopY + 18 * scale);
        ctx.lineTo(ox - 5 * scale + n * 2.5 * scale, hoopY + 30 * scale);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ============ PARTICLES ============

function spawnParticles(x, y, type, count) {
  const maxParticles = 150;
  if (particles.length > maxParticles) return;
  count = Math.min(count, maxParticles - particles.length);
  for (let i = 0; i < count; i++) {
    const p = {
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 5 - 2,
      life: 1,
      decay: 0.01 + Math.random() * 0.02,
      size: 2 + Math.random() * 4,
      type
    };
    if (type === 'sawdust') { p.color = '#c9a55a'; p.size = 1 + Math.random() * 3; }
    else if (type === 'leaf') { p.color = `hsl(${100 + Math.random() * 40}, 60%, ${30 + Math.random() * 20}%)`; p.size = 3 + Math.random() * 5; p.rot = Math.random() * 6; p.rotV = (Math.random() - 0.5) * 0.2; }
    else if (type === 'dust') { p.color = '#b8a88a'; p.size = 4 + Math.random() * 8; p.decay = 0.008; }
    else if (type === 'splinter') { p.color = '#8b6914'; p.size = 2 + Math.random() * 3; p.vy = -Math.random() * 8; }
    else if (type === 'confetti') { p.color = `hsl(${Math.random() * 360}, 90%, 60%)`; p.size = 3 + Math.random() * 4; p.vy = -Math.random() * 3 - 1; p.decay = 0.005; p.rot = Math.random() * 6; p.rotV = (Math.random() - 0.5) * 0.3; }
    else if (type === 'splash') { p.color = '#4aa3df'; p.vy = -Math.random() * 8 - 3; p.decay = 0.015; }
    else { p.color = '#aaa'; }
    particles.push(p);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt * 0.3;
    p.y += p.vy * dt * 0.3;
    p.vy += 0.15 * dt * 0.3;
    p.life -= p.decay * dt;
    if (p.rot != null) p.rot += (p.rotV || 0) * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    if (p.type === 'leaf' || p.type === 'confetti') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot || 0);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Wind lines
function updateWindLines(dt) {
  if (Math.abs(windCurrent) > 0.3 && Math.random() < 0.05 * dt && windLines.length < 20) {
    windLines.push({
      x: windCurrent > 0 ? -20 : W + 20,
      y: Math.random() * H * 0.7,
      len: 20 + Math.random() * 40,
      speed: (2 + Math.random() * 3) * Math.sign(windCurrent),
      life: 1
    });
  }
  for (let i = windLines.length - 1; i >= 0; i--) {
    const wl = windLines[i];
    wl.x += wl.speed * dt * 2;
    wl.life -= 0.01 * dt;
    if (wl.life <= 0 || wl.x < -50 || wl.x > W + 50) windLines.splice(i, 1);
  }
}

function drawWindLines() {
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  for (const wl of windLines) {
    ctx.globalAlpha = wl.life * 0.4;
    ctx.beginPath();
    ctx.moveTo(wl.x, wl.y);
    ctx.lineTo(wl.x + wl.len * Math.sign(wl.speed), wl.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ============ CUT LINE DRAWING ============

function drawCutLine() {
  if (!cutLine || state !== 'cutting') return;
  const tree = trees[activeTreeIndex];
  const cx = tree.x;
  const cy = tree.y - tree.height * 0.15;
  const len = tree.trunkW * 2;

  ctx.save();

  // Cut line at base
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = '#ff0';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ff0';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(cutLine.angle) * len, cy + Math.sin(cutLine.angle) * len);
  ctx.lineTo(cx - Math.cos(cutLine.angle) * len, cy - Math.sin(cutLine.angle) * len);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // Arrow showing fall direction
  const fallDir = Math.cos(cutLine.angle) > 0 ? 1 : -1;
  const arrowLen = 60;
  const arrowX = cx + fallDir * arrowLen;
  const arrowY = cy - 50;

  // Arrow shaft with glow
  ctx.strokeStyle = '#f80';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#f80';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 35);
  ctx.lineTo(arrowX, arrowY);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = '#f80';
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX - fallDir * 12, arrowY + 6);
  ctx.lineTo(arrowX - fallDir * 8, arrowY + 14);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // "Aim" text
  ctx.fillStyle = 'rgba(255,200,50,0.7)';
  ctx.font = `bold ${12 * scale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('← Move mouse to aim →', cx, cy + 40);

  ctx.restore();
}

// Ball physics for ramp level
function updateBall(dt) {
  if (!ballPhysics) return;
  const b = ballPhysics;
  b.x += b.vx * dt * 0.5;
  b.y += b.vy * dt * 0.5;
  b.vy += 0.2 * dt;
  const hoop = objects.find(o => o.type === 'hoop');
  if (hoop) {
    const hx = hoop.x * W;
    const hy = (levelData.groundLevel || 0.85) * H - hoop.h * scale + 18 * scale;
    if (Math.abs(b.x - hx) < 15 * scale && Math.abs(b.y - hy) < 15 * scale) {
      b.scored = true;
      playSound('cheer');
      spawnParticles(hx, hy, 'confetti', 30);
    }
  }
  const bGrad = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, 6 * scale);
  bGrad.addColorStop(0, '#f0a040');
  bGrad.addColorStop(1, '#c06010');
  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  if (b.y > H) ballPhysics = null;
}

// ============ START LEVEL ============

function startLevel(idx) {
  currentLevel = idx;
  levelData = LEVELS[idx];
  showScreen('hud');
  state = 'playing';
  initAudio();

  trees = [];
  objects = [];
  particles = [];
  windLines = [];
  groundCracks = [];
  cutLine = null;
  activeTreeIndex = 0;
  fallTime = 0;
  shakeX = 0; shakeY = 0;
  damageTotal = 0;
  hitObjects = [];
  ballPhysics = null;
  walkerState = null;
  dunked = false;
  pinsKnocked = 0;
  slowMoFactor = 1;

  trees.push(new Tree(levelData.tree, 0));
  if (levelData.doubleTree && levelData.tree2) {
    trees.push(new Tree(levelData.tree2, 1));
  }

  objects = levelData.objects.map(o => ({ ...o, hit: false, bounceTime: 0, fleeX: null, fallAngle: null }));

  windCurrent = levelData.wind.base;
  windTimer = 0;

  levelTitle.textContent = `${idx + 1}. ${levelData.name}`;
  objectiveText.textContent = levelData.objective;
  objectiveText.classList.add('show');
  objectiveTimer = 180;
  timberBtn.style.display = 'none';
  cutHint.style.display = 'block';
  resultOverlay.style.display = 'none';

  initAmbientParticles();
}

// ============ COLLISIONS ============

function checkCollisions(tree) {
  if (!tree.fallen) return;
  const tipX = tree.getFallTipWorldX();
  const tipNorm = tipX / W;
  const gy = (levelData.groundLevel || 0.85) * H;
  for (const obj of objects) {
    if (obj.hit) continue;
    const ox = obj.x;
    const hw = obj.w / 2;
    if (tipNorm > ox - hw && tipNorm < ox + hw) {
      if (obj.type === 'powerline') {
        const wireY = gy + (obj.yOff || 0) * scale;
        const tipY = tree.pivotY - Math.cos(tree.angle) * (tree.height - tree.cutY);
        if (tipY < wireY + 20) hitObject(obj, tipX);
        continue;
      }
      hitObject(obj, tipX);
    }
    for (let t = 0.2; t < 1; t += 0.2) {
      const bx = tree.pivotX + Math.sin(tree.angle) * (tree.height - tree.cutY) * t;
      const bn = bx / W;
      if (bn > ox - hw && bn < ox + hw) {
        if (obj.type === 'powerline') {
          const wireY = gy + (obj.yOff || 0) * scale;
          const by = tree.pivotY - Math.cos(tree.angle) * (tree.height - tree.cutY) * t;
          if (by < wireY + 20) hitObject(obj, bx);
        } else {
          hitObject(obj, bx);
        }
      }
    }
  }
}

function hitObject(obj, x) {
  if (obj.hit) return;
  obj.hit = true;
  hitObjects.push(obj);
  const gy = (levelData.groundLevel || 0.85) * H;
  switch (obj.type) {
    case 'house':
      playSound('crash'); playSound('glass');
      spawnParticles(x, gy - obj.h * scale * 0.5, 'dust', 20);
      spawnParticles(x, gy - obj.h * scale * 0.5, 'splinter', 10);
      shakeX = 15; shakeY = 10; damageTotal += obj.cost || 0; break;
    case 'car':
      playSound('crash');
      spawnParticles(x, gy - 20, 'dust', 15); spawnParticles(x, gy - 20, 'splinter', 8);
      shakeX = 10; shakeY = 8; damageTotal += obj.cost || 0; break;
    case 'fence':
      playSound('crunch'); spawnParticles(x, gy - 20, 'splinter', 12);
      shakeX = 3; shakeY = 2; damageTotal += obj.cost || 0; break;
    case 'playground':
      playSound('crash'); spawnParticles(x, gy - 25, 'dust', 15);
      shakeX = 8; shakeY = 5; damageTotal += obj.cost || 0; break;
    case 'powerline':
      playSound('crash'); spawnParticles(obj.x * W, gy + (obj.yOff || 0) * scale, 'splinter', 10);
      shakeX = 5; shakeY = 3; damageTotal += obj.cost || 0; break;
    case 'can':
      playSound('crunch'); spawnParticles(x, gy - 5, 'dust', 8);
      shakeX = 2; shakeY = 2; break;
    case 'truck':
      playSound('crash'); obj.bounceTime = 2;
      spawnParticles(x, gy - 20, 'dust', 10); shakeX = 6; shakeY = 4; break;
    case 'pin':
      playSound('bowling'); obj.fallAngle = (Math.random() - 0.5) * Math.PI;
      pinsKnocked++; break;
    case 'dunktank':
      playSound('splash'); dunked = true;
      spawnParticles(obj.x * W, gy - obj.h * scale, 'splash', 25);
      shakeX = 4; shakeY = 3; break;
    case 'ramp':
      playSound('crash');
      const gy2 = (levelData.groundLevel || 0.85) * H;
      ballPhysics = { x: obj.x * W, y: gy2 - obj.h * scale, vx: 4, vy: -12, scored: false };
      shakeX = 4; shakeY = 3; break;
    case 'pool':
      playSound('splash'); spawnParticles(obj.x * W, gy - 10, 'splash', 30); break;
  }
}

// ============ EVALUATE RESULT ============

function evaluateResult() {
  const lv = levelData;
  let stars = 0;
  let success = true;
  let message = '';
  const tree = trees[0];
  const tipNorm = tree.getFallTipWorldX() / W;
  const destructibleHits = hitObjects.filter(o => o.destructible && o.type !== 'can');

  if (lv.starCriteria.any) { stars = 3; message = 'Great job!'; }
  else if (lv.starCriteria.avoidAll) {
    if (destructibleHits.length === 0) { stars = 3; message = 'Perfect! No damage!'; }
    else { stars = 0; success = false; message = `$${damageTotal.toLocaleString()} in damages!`; }
  }

  if (lv.starCriteria.hitTarget) {
    const targetHit = hitObjects.find(o => o.target);
    if (targetHit) {
      stars = Math.max(stars, 2); message = 'Target hit!';
      if (lv.starCriteria.precision) {
        const obj = lv.objects.find(o => o.target);
        if (obj && Math.abs(tipNorm - obj.x) < lv.starCriteria.precision) { stars = 3; message = 'PERFECT hit! 🎯'; }
      }
      if (lv.starCriteria.flatLanding) {
        if (Math.abs(tree.angle) > 1.3 && Math.abs(tree.angle) < 1.8) { stars = 3; message = 'Perfect flat landing! 🛻'; }
      }
    } else { stars = 0; success = false; message = 'Missed the target!'; }
  }

  if (lv.starCriteria.pinsKnocked) {
    const totalPins = objects.filter(o => o.type === 'pin').length;
    if (pinsKnocked >= totalPins) { stars = 3; message = 'STRIKE! 🎳'; }
    else if (pinsKnocked > totalPins / 2) { stars = 2; message = `${pinsKnocked}/${totalPins} pins!`; }
    else if (pinsKnocked > 0) { stars = 1; message = `Only ${pinsKnocked}/${totalPins} pins...`; }
    else { stars = 0; success = false; message = 'Gutter ball!'; }
  }

  if (lv.starCriteria.bridge) {
    if (tipNorm > 0.58 && tree.pivotX / W < 0.42) {
      stars = 3; message = 'Bridge complete! 🌉';
      walkerState = { x: tree.pivotX - 20, progress: 0 };
    } else { stars = 0; success = false; message = 'Tree fell into the gap!'; }
  }

  if (lv.starCriteria.chainReaction) {
    if (ballPhysics?.scored) { stars = 3; message = 'SWISH! Nothing but net! 🏀'; }
    else if (hitObjects.find(o => o.type === 'ramp')) { stars = 1; message = 'Hit the ramp but missed the hoop!'; }
    else { stars = 0; success = false; message = 'Missed the ramp!'; }
  }

  if (lv.starCriteria.bonusPool) {
    const poolHit = hitObjects.find(o => o.type === 'pool');
    if (poolHit) {
      if (destructibleHits.length === 0) { stars = 3; message = 'CANNONBALL! Bonus splash! 💦'; }
      else { stars = 1; message = 'Splash! But also damage...'; }
    } else if (destructibleHits.length === 0) { stars = 2; message = 'Pool is safe! (But splashing is fun...)'; }
  }

  if (lv.starCriteria.bothTrees) {
    if (trees.length > 1 && trees[0].fallen && trees[1].fallen) {
      const dir0 = trees[0].angle > 0 ? 1 : -1;
      const dir1 = trees[1].angle > 0 ? 1 : -1;
      if (dir0 !== dir1 && destructibleHits.length === 0) { stars = 3; message = 'Both trees fell perfectly! 🌲↔️🌲'; }
      else if (destructibleHits.length === 0) { stars = 1; message = 'No damage, but not opposite directions!'; }
      else { stars = 0; success = false; message = `$${damageTotal.toLocaleString()} in damages!`; }
    }
  }

  state = 'result';
  resultOverlay.style.display = 'block';
  resultTitle.textContent = success ? '🎉 TIMBER!' : '💥 Oops!';
  resultTitle.style.color = success ? '#4a2' : '#e74c3c';
  resultStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  resultMessage.textContent = message;

  if (success) { playSound('cheer'); spawnParticles(W / 2, H / 3, 'confetti', 20); }
  else playSound('trombone');

  const prev = progress[currentLevel] || 0;
  if (stars > prev) { progress[currentLevel] = stars; saveProgress(); }

  document.getElementById('btn-next').style.display = currentLevel < LEVELS.length - 1 ? 'inline-block' : 'none';
}

// ============ INPUT — TWO-CLICK SYSTEM ============

function getInputPos(e) {
  if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function onPointerDown(e) {
  e.preventDefault();
  initAudio();
  const pos = getInputPos(e);

  if (state === 'playing') {
    const tree = trees[activeTreeIndex];
    const dx = Math.abs(pos.x - tree.x);
    const dy = pos.y - (tree.y - tree.height);
    // Click on or near trunk to start aiming
    if (dx < tree.trunkW * 3 && dy > -20 && dy < tree.height + 20) {
      state = 'cutting';
      cutLine = { angle: 0 };
      playSound('chainsaw');
      spawnParticles(tree.x, tree.y - tree.height * 0.15, 'sawdust', 15);
      timberBtn.style.display = 'block';
      cutHint.style.display = 'none';
      updateCutAngle(pos);
    }
  } else if (state === 'cutting') {
    // Second click = execute the cut
    executeCut();
  }
}

function onPointerMove(e) {
  e.preventDefault();
  const pos = getInputPos(e);
  mousePos = pos;
  if (state === 'cutting' && cutLine) {
    updateCutAngle(pos);
  }
}

function onPointerUp(e) {
  e.preventDefault();
  // No action on pointer up in two-click system
}

function updateCutAngle(pos) {
  if (!cutLine) return;
  const tree = trees[activeTreeIndex];
  const cx = tree.x;
  const cy = tree.y - tree.height * 0.15;
  cutLine.angle = Math.atan2(pos.y - cy, pos.x - cx);
}

function executeCut() {
  if (state !== 'cutting' || !cutLine) return;
  const tree = trees[activeTreeIndex];
  const cosA = Math.cos(cutLine.angle);
  const fallDir = cosA > 0 ? 0.05 : -0.05;
  tree.startFall(fallDir);
  state = 'falling';
  fallTime = 0;
  timberBtn.style.display = 'none';
  cutHint.style.display = 'none';
  cutLine = null;
  if (levelData.slowMo) slowMoFactor = 0.3;
  spawnParticles(tree.x, tree.y - tree.height * 0.15, 'sawdust', 15);
}

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('mouseup', onPointerUp);
canvas.addEventListener('touchstart', onPointerDown, { passive: false });
canvas.addEventListener('touchmove', onPointerMove, { passive: false });
canvas.addEventListener('touchend', onPointerUp, { passive: false });

timberBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  executeCut();
});

// Menu buttons
document.getElementById('btn-play').addEventListener('click', () => showScreen('levelselect'));
document.getElementById('btn-back-menu').addEventListener('click', () => showScreen('menu'));
document.getElementById('btn-back-levels').addEventListener('click', () => { showScreen('levelselect'); state = 'levelselect'; });
document.getElementById('btn-restart').addEventListener('click', () => startLevel(currentLevel));
document.getElementById('btn-retry').addEventListener('click', () => startLevel(currentLevel));
document.getElementById('btn-next').addEventListener('click', () => {
  if (currentLevel < LEVELS.length - 1) startLevel(currentLevel + 1);
});

// ============ MAIN LOOP ============

function update(dt) {
  if (state === 'falling' || state === 'result') {
    const adt = dt * slowMoFactor;
    fallTime += adt;
    windTimer += adt;
    if (levelData.wind.changing) {
      windCurrent = levelData.wind.base * Math.sin(windTimer * 0.02) + (Math.random() - 0.5) * levelData.wind.gust * 0.1;
    } else if (windTimer > 60 + Math.random() * 120) {
      windCurrent = levelData.wind.base + (Math.random() - 0.5) * levelData.wind.gust * 2;
      windTimer = 0;
      if (Math.abs(windCurrent) > 0.5) playSound('wind');
    }
    if (levelData.earthquake) {
      quakeTimer += adt;
      if (Math.random() < 0.02 * adt) {
        shakeX += (Math.random() - 0.5) * 8;
        shakeY += (Math.random() - 0.5) * 4;
        groundCracks.push({ x: Math.random() * W, dx: (Math.random() - 0.5) * 30, dy: Math.random() * 20, life: 1 });
      }
    }
    for (const tree of trees) tree.update(adt, windCurrent);
    const allSettled = trees.filter(t => t.falling).every(t => t.settled);
    if (allSettled && trees.some(t => t.falling)) {
      for (const tree of trees) {
        if (tree.settled && tree.settleTime === 0) {
          tree.settleTime = 1;
          const tipX = tree.getFallTipWorldX();
          const gy = (levelData.groundLevel || 0.85) * H;
          playSound('crash');
          spawnParticles(tipX, gy - 10, 'dust', 25);
          spawnParticles(tipX, gy - 20, 'leaf', 15);
          spawnParticles(tipX, gy - 10, 'splinter', 10);
          shakeX = Math.max(shakeX, 10 * (levelData.tree.height / 250));
          shakeY = Math.max(shakeY, 8 * (levelData.tree.height / 250));
        }
      }
      for (const tree of trees) checkCollisions(tree);
      for (const obj of objects) {
        if (obj.flee && !obj.fleeing) {
          obj.fleeing = true;
          const dir = trees[0].angle > 0 ? -1 : 1;
          obj.fleeX = obj.x * W + dir * 100;
        }
      }
      if (levelData.doubleTree && activeTreeIndex === 0 && trees.length > 1 && !trees[1].falling) {
        activeTreeIndex = 1;
        state = 'playing';
        timberBtn.style.display = 'none';
        cutHint.style.display = 'block';
        cutLine = null;
        objectiveText.textContent = 'Now chop the second tree!';
        objectiveText.classList.add('show');
        objectiveTimer = 120;
        return;
      }
      if (fallTime > 30 && state === 'falling') {
        const waitForBall = ballPhysics && !ballPhysics.scored && ballPhysics.y < H;
        if (!waitForBall) {
          setTimeout(() => { if (state === 'falling') evaluateResult(); }, 500);
        }
      }
    }
    if (slowMoFactor < 1) slowMoFactor = Math.min(1, slowMoFactor + 0.001 * dt);
  }

  if (state === 'playing' || state === 'cutting') {
    windTimer += dt;
    if (levelData.wind.changing) {
      windCurrent = levelData.wind.base * Math.sin(windTimer * 0.02) + Math.sin(windTimer * 0.007) * levelData.wind.gust;
    } else {
      if (windTimer > 120 + Math.random() * 180) {
        windCurrent = levelData.wind.base + (Math.random() - 0.5) * levelData.wind.gust * 2;
        windTimer = 0;
      }
    }
    if (levelData.earthquake && Math.random() < 0.01) {
      shakeX += (Math.random() - 0.5) * 5;
      shakeY += (Math.random() - 0.5) * 3;
    }
  }

  for (const obj of objects) {
    if (obj.fleeing && obj.fleeX != null) {
      const current = obj._currentFleeX || obj.x * W;
      obj._currentFleeX = current + (obj.fleeX - current) * 0.05;
      obj.fleeX = obj._currentFleeX;
    }
  }

  shakeX *= 0.9; shakeY *= 0.9;
  if (Math.abs(shakeX) < 0.1) shakeX = 0;
  if (Math.abs(shakeY) < 0.1) shakeY = 0;

  for (let i = groundCracks.length - 1; i >= 0; i--) {
    groundCracks[i].life -= 0.005 * dt;
    if (groundCracks[i].life <= 0) groundCracks.splice(i, 1);
  }

  if (objectiveTimer > 0) {
    objectiveTimer -= dt;
    if (objectiveTimer <= 0) objectiveText.classList.remove('show');
  }

  for (const obj of objects) {
    if (obj.bounceTime > 0) obj.bounceTime -= 0.02 * dt;
  }

  updateParticles(dt);
  updateWindLines(dt);
  updateAmbientParticles(dt);

  if (state === 'playing' || state === 'cutting' || state === 'falling') {
    const dir = windCurrent > 0 ? '→' : windCurrent < 0 ? '←' : '·';
    windArrow.textContent = dir;
    const str = Math.abs(windCurrent);
    windStrength.textContent = str < 0.5 ? 'Calm' : str < 1.5 ? 'Light' : str < 3 ? 'Strong' : 'GALE!';
  }
}

function draw() {
  ctx.save();
  ctx.translate(shakeX * (Math.random() - 0.5), shakeY * (Math.random() - 0.5));

  drawPainterlySky();
  drawPainterlyClouds();

  const gy = (levelData?.groundLevel || 0.85) * H;

  if (state === 'playing' || state === 'cutting' || state === 'falling' || state === 'result') {
    drawPainterlyGround(gy);

    // Ground cracks
    for (const c of groundCracks) {
      ctx.strokeStyle = `rgba(80,60,30,${c.life})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x, gy);
      ctx.lineTo(c.x + c.dx, gy + c.dy);
      ctx.lineTo(c.x + c.dx * 1.5, gy + c.dy * 0.5);
      ctx.stroke();
    }

    for (const obj of objects) drawObject(obj);
    for (const tree of trees) tree.draw(ctx);
    drawCutLine();
    drawWindLines();
    if (ballPhysics) updateBall(1);

    // Walker for bridge level
    if (walkerState) {
      walkerState.progress += 0.005;
      const tree = trees[0];
      const t = walkerState.progress;
      if (t < 1) {
        const wx = tree.pivotX + Math.sin(tree.angle) * (tree.height - tree.cutY) * t;
        const wy = tree.pivotY - Math.cos(tree.angle) * (tree.height - tree.cutY) * t - 15;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(wx, wy - 8, 4, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx, wy - 4); ctx.lineTo(wx, wy + 8);
        ctx.moveTo(wx - 5, wy); ctx.lineTo(wx + 5, wy);
        ctx.moveTo(wx, wy + 8); ctx.lineTo(wx - 4, wy + 14);
        ctx.moveTo(wx, wy + 8); ctx.lineTo(wx + 4, wy + 14); ctx.stroke();
      }
    }

    drawAmbientParticles();
  } else {
    // Menu/level select background
    drawPainterlyGround(H * 0.85);
  }

  drawParticles();

  // Vignette overlay for painterly feel
  if (state === 'playing' || state === 'cutting' || state === 'falling' || state === 'result') {
    const vGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
    vGrad.addColorStop(0, 'transparent');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

function gameLoop(time) {
  const dt = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1;
  lastTime = time;
  animFrame++;
  try { update(dt); } catch(e) { console.error('Update error:', e); }
  try { draw(); } catch(e) { console.error('Draw error:', e); }
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

})();
