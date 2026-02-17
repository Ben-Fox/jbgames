// Tree Fall - game.js
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
const resultOverlay = document.getElementById('result-overlay');
const resultTitle = document.getElementById('result-title');
const resultStars = document.getElementById('result-stars');
const resultMessage = document.getElementById('result-message');

// State
let W, H, scale;
let state = 'menu'; // menu, levelselect, playing, cutting, falling, result
let currentLevel = 0;
let progress = JSON.parse(localStorage.getItem('treefall_progress') || '{}');
let trees = [];
let objects = [];
let particles = [];
let windLines = [];
let cutLine = null;
let cutReady = false;
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
let confetti = [];
let groundCracks = [];
let audioCtx = null;
let dragStart = null;
let dragCurrent = null;
let mousePos = { x: 0, y: 0 };
let touchId = null;
let levelData = null;
let animFrame = 0;
let lastTime = 0;
let ballPhysics = null; // for ramp level
let walkerState = null; // for bridge level
let dunked = false;
let pinsKnocked = 0;

// Audio
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
        osc.start(now);
        osc.stop(now + 0.4);
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
        osc.start(now);
        osc.stop(now + 0.8);
        break;
      }
      case 'crash': {
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        const src = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        src.buffer = buffer;
        gain.gain.value = 0.4;
        src.connect(gain).connect(audioCtx.destination);
        src.start(now);
        break;
      }
      case 'glass': {
        const bufferSize = audioCtx.sampleRate * 0.3;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05)) * Math.sin(i * 0.3);
        const src = audioCtx.createBufferSource();
        src.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.2;
        src.connect(gain).connect(audioCtx.destination);
        src.start(now);
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
        const src = audioCtx.createBufferSource();
        src.buffer = buffer;
        src.connect(audioCtx.destination);
        src.start(now);
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
        osc.start(now);
        osc.stop(now + 1.5);
        break;
      }
      case 'splash': {
        const bufferSize = audioCtx.sampleRate * 0.4;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1)) * 0.5;
        const src = audioCtx.createBufferSource();
        src.buffer = buffer;
        src.connect(audioCtx.destination);
        src.start(now);
        break;
      }
      case 'wind': {
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.05 * Math.sin(i / bufferSize * Math.PI);
        const src = audioCtx.createBufferSource();
        src.buffer = buffer;
        src.connect(audioCtx.destination);
        src.start(now);
        break;
      }
      case 'bowling': {
        for (let i = 0; i < 3; i++) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = 200 + i * 100;
          gain.gain.value = 0.1;
          gain.gain.linearRampToValueAtTime(0, now + 0.3 + i * 0.1);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + 0.3 + i * 0.1);
        }
        break;
      }
      case 'crunch': {
        const bufferSize = audioCtx.sampleRate * 0.15;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.03));
        const src = audioCtx.createBufferSource();
        src.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.3;
        src.connect(gain).connect(audioCtx.destination);
        src.start(now);
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
    if (unlocked) {
      btn.onclick = () => startLevel(i);
    }
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

// Tree class
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
    this.cutY = 0; // height of cut from base
    this.cutAngle = 0; // angle of cut line
    this.angle = this.lean; // current rotation
    this.angularVel = 0;
    this.falling = false;
    this.fallen = false;
    this.detached = false;
    this.detachVx = 0;
    this.detachVy = 0;
    this.pivotX = 0;
    this.pivotY = 0;
    this.settled = false;
    this.settleTime = 0;
    this.branches = [];
    this.generateBranches();
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
  get tipX() {
    return this.pivotX + Math.sin(this.angle) * (this.height - this.cutY);
  }
  get tipY() {
    return this.pivotY - Math.cos(this.angle) * (this.height - this.cutY);
  }
  startFall(cutAngle) {
    this.cutY = this.height * 0.15; // cut near base
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
    // Torque from gravity
    const massDist = (this.height - this.cutY) * 0.5;
    const torque = gravity * Math.sin(this.angle) * massDist * 0.01 + windForce * Math.cos(this.angle) * massDist * 0.01;
    this.angularVel += torque * dt;
    this.angularVel *= 0.999; // slight damping
    this.angle += this.angularVel * dt;
    // Check if tree tip hits ground
    const tipY = this.pivotY - Math.cos(this.angle) * (this.height - this.cutY);
    const tipX = this.pivotX + Math.sin(this.angle) * (this.height - this.cutY);
    if (tipY >= this.groundY) {
      this.fallen = true;
      this.settled = true;
      // Clamp angle
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
    ctx.save();
    if (this.falling) {
      ctx.translate(this.pivotX, this.pivotY);
      ctx.rotate(this.angle - this.lean);
      this.drawTree(ctx, -(this.height - this.cutY));
    } else {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.lean);
      this.drawTree(ctx, -this.height);
    }
    ctx.restore();
    // Draw stump if falling
    if (this.falling) {
      ctx.save();
      ctx.fillStyle = '#5a3a1a';
      const stumpH = this.cutY;
      ctx.fillRect(this.x - this.trunkW / 2, this.y - stumpH, this.trunkW, stumpH);
      // Cut surface
      ctx.fillStyle = '#c9a55a';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - stumpH, this.trunkW / 2 + 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  drawTree(ctx, startY) {
    const h = this.height - (this.falling ? this.cutY : 0);
    // Trunk
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(-this.trunkW / 2, startY, this.trunkW, h);
    // Bark texture
    ctx.strokeStyle = '#5a3518';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 15 * scale) {
      ctx.beginPath();
      ctx.moveTo(-this.trunkW / 2 + 2, startY + i);
      ctx.lineTo(this.trunkW / 2 - 2, startY + i + 5);
      ctx.stroke();
    }
    // Branches
    for (const b of this.branches) {
      const by = startY + h * (1 - b.h);
      ctx.save();
      ctx.translate(0, by);
      ctx.rotate(b.angle);
      ctx.fillStyle = '#5a3518';
      ctx.fillRect(0, -3 * scale, b.len, 6 * scale);
      // Leaves on branch
      ctx.fillStyle = '#2d8a2d';
      for (let j = 0; j < 3; j++) {
        const lx = b.len * (0.4 + j * 0.25);
        ctx.beginPath();
        ctx.arc(lx, -5 * scale, 12 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    // Canopy
    const canopyY = startY + h * 0.05;
    const canopyR = this.trunkW * 2.5;
    ctx.fillStyle = '#2d8a2d';
    for (let i = 0; i < 5; i++) {
      const cx = (i - 2) * canopyR * 0.5;
      const cy = canopyY + (Math.abs(i - 2)) * canopyR * 0.15;
      ctx.beginPath();
      ctx.arc(cx, cy, canopyR * (0.7 + Math.random() * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }
    // Darker leaf accents
    ctx.fillStyle = '#1e6b1e';
    for (let i = 0; i < 4; i++) {
      const cx = (i - 1.5) * canopyR * 0.4;
      const cy = canopyY + 5 + Math.random() * canopyR * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, canopyR * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Object drawing functions
function drawObject(obj) {
  const ox = obj.x * W;
  const ow = obj.w * W;
  const gy = (levelData.groundLevel || 0.85) * H;
  const oh = obj.h * scale;
  const oy = gy - oh + (obj.yOff || 0) * scale;

  if (obj.hit && obj.type !== 'pin') {
    // Draw destroyed version
    ctx.globalAlpha = 0.5;
  }

  ctx.save();
  switch(obj.type) {
    case 'house':
      // Wall
      ctx.fillStyle = obj.hit ? '#888' : '#e8d4b0';
      ctx.fillRect(ox - ow / 2, oy, ow, oh);
      // Roof
      ctx.fillStyle = obj.hit ? '#666' : '#c0392b';
      ctx.beginPath();
      ctx.moveTo(ox - ow / 2 - 10, oy);
      ctx.lineTo(ox, oy - oh * 0.4);
      ctx.lineTo(ox + ow / 2 + 10, oy);
      ctx.closePath();
      ctx.fill();
      // Door
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(ox - 8 * scale, oy + oh * 0.4, 16 * scale, oh * 0.6);
      // Windows
      ctx.fillStyle = obj.hit ? '#555' : '#87ceeb';
      ctx.fillRect(ox - ow / 3, oy + oh * 0.15, 14 * scale, 12 * scale);
      ctx.fillRect(ox + ow / 6, oy + oh * 0.15, 14 * scale, 12 * scale);
      if (obj.hit) {
        // Cracks
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox - 10, oy + 10);
        ctx.lineTo(ox + 15, oy + oh / 2);
        ctx.lineTo(ox - 5, oy + oh);
        ctx.stroke();
      }
      break;
    case 'car':
      // Body
      ctx.fillStyle = obj.hit ? '#666' : '#e74c3c';
      const carY = gy - oh;
      ctx.beginPath();
      ctx.roundRect(ox - ow / 2, carY, ow, oh * 0.6, 5);
      ctx.fill();
      // Top
      ctx.fillStyle = obj.hit ? '#555' : '#c0392b';
      ctx.beginPath();
      ctx.roundRect(ox - ow / 3, carY - oh * 0.35, ow * 0.6, oh * 0.4, 4);
      ctx.fill();
      // Windows
      ctx.fillStyle = obj.hit ? '#444' : '#87ceeb';
      ctx.fillRect(ox - ow / 4, carY - oh * 0.3, ow * 0.2, oh * 0.25);
      ctx.fillRect(ox + ow / 12, carY - oh * 0.3, ow * 0.2, oh * 0.25);
      // Wheels
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(ox - ow / 3, gy, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ox + ow / 3, gy, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      if (obj.hit) {
        ctx.fillStyle = '#888';
        ctx.fillRect(ox - ow / 2, carY, ow, oh * 0.3);
      }
      break;
    case 'fence':
      ctx.fillStyle = obj.hit ? '#888' : '#f5f5dc';
      const posts = 6;
      for (let i = 0; i < posts; i++) {
        const px = ox - ow / 2 + (ow / (posts - 1)) * i;
        ctx.fillRect(px - 2 * scale, gy - oh, 4 * scale, oh);
      }
      // Rails
      ctx.fillRect(ox - ow / 2, gy - oh * 0.7, ow, 3 * scale);
      ctx.fillRect(ox - ow / 2, gy - oh * 0.35, ow, 3 * scale);
      break;
    case 'playground':
      // Swing set
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox - ow / 3, gy);
      ctx.lineTo(ox, gy - oh);
      ctx.lineTo(ox + ow / 3, gy);
      ctx.stroke();
      // Swing
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox - 5, gy - oh);
      ctx.lineTo(ox - 8, gy - 10);
      ctx.stroke();
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(ox - 14, gy - 12, 12, 3);
      // Slide
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.moveTo(ox + ow / 4, gy - oh * 0.8);
      ctx.lineTo(ox + ow / 2, gy);
      ctx.lineTo(ox + ow / 2 - 5, gy);
      ctx.lineTo(ox + ow / 4 - 5, gy - oh * 0.8);
      ctx.closePath();
      ctx.fill();
      break;
    case 'stickfigure': {
      const sfx = obj.fleeX != null ? obj.fleeX : ox;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      const headY = gy - 25 * scale;
      // Head
      ctx.beginPath();
      ctx.arc(sfx, headY, 4 * scale, 0, Math.PI * 2);
      ctx.stroke();
      // Body
      ctx.beginPath();
      ctx.moveTo(sfx, headY + 4 * scale);
      ctx.lineTo(sfx, gy - 8 * scale);
      ctx.stroke();
      // Arms
      ctx.beginPath();
      ctx.moveTo(sfx - 8 * scale, gy - 18 * scale);
      ctx.lineTo(sfx + 8 * scale, gy - 18 * scale);
      ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(sfx, gy - 8 * scale);
      ctx.lineTo(sfx - 6 * scale, gy);
      ctx.moveTo(sfx, gy - 8 * scale);
      ctx.lineTo(sfx + 6 * scale, gy);
      ctx.stroke();
      break;
    }
    case 'powerline':
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 4;
      const plY = gy + (obj.yOff || 0) * scale;
      // Poles
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(ox - ow / 2, plY, 6, gy - plY);
      ctx.fillRect(ox + ow / 2 - 6, plY, 6, gy - plY);
      // Wires
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        const wy = plY + w * 8;
        ctx.moveTo(ox - ow / 2 + 3, wy);
        ctx.quadraticCurveTo(ox, wy + 15, ox + ow / 2 - 3, wy);
        ctx.stroke();
      }
      break;
    case 'pool':
      ctx.fillStyle = '#4aa3df';
      ctx.fillRect(ox - ow / 2, gy - oh, ow, oh);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 3;
      ctx.strokeRect(ox - ow / 2, gy - oh, ow, oh);
      // Water ripples
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.arc(ox + (r - 1) * ow / 4, gy - oh / 2, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case 'can':
      if (!obj.hit) {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(ox - 4 * scale, gy - oh, 8 * scale, oh);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(ox - 4 * scale, gy - oh, 8 * scale, 3);
        ctx.fillStyle = '#fff';
        ctx.font = `${6 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Cola', ox, gy - oh / 3);
      } else {
        // Crushed can
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(ox - 6 * scale, gy - 3, 12 * scale, 3);
      }
      break;
    case 'truck':
      const trY = gy - oh;
      // Cab
      ctx.fillStyle = '#2980b9';
      ctx.beginPath();
      ctx.roundRect(ox + ow / 4, trY, ow / 3, oh * 0.7, 3);
      ctx.fill();
      // Windshield
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(ox + ow / 4 + 3, trY + 3, ow / 4, oh * 0.3);
      // Bed
      ctx.fillStyle = '#555';
      ctx.fillRect(ox - ow / 2, trY + oh * 0.3, ow * 0.75, oh * 0.4);
      // Bed walls
      ctx.fillStyle = '#444';
      ctx.fillRect(ox - ow / 2, trY + oh * 0.2, 3, oh * 0.5);
      ctx.fillRect(ox + ow / 4 - 3, trY + oh * 0.2, 3, oh * 0.5);
      // Wheels
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(ox - ow / 3, gy, 8 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ox + ow / 3, gy, 8 * scale, 0, Math.PI * 2); ctx.fill();
      // Bounce effect
      if (obj.bounceTime > 0) {
        ctx.save();
        ctx.translate(0, -Math.sin(obj.bounceTime * 10) * 5 * obj.bounceTime);
        ctx.restore();
      }
      break;
    case 'cliff':
      // Drawn in custom ground
      break;
    case 'pin':
      if (!obj.hit) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(ox - 4 * scale, gy);
        ctx.lineTo(ox - 2 * scale, gy - oh * 0.6);
        ctx.quadraticCurveTo(ox, gy - oh, ox, gy - oh);
        ctx.quadraticCurveTo(ox, gy - oh, ox + 2 * scale, gy - oh * 0.6);
        ctx.lineTo(ox + 4 * scale, gy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(ox, gy - oh + 3, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Fallen pin
        ctx.fillStyle = '#ddd';
        ctx.save();
        ctx.translate(ox, gy);
        ctx.rotate(obj.fallAngle || Math.PI / 2);
        ctx.fillRect(-2, -oh, 4, oh);
        ctx.restore();
      }
      break;
    case 'dunktank':
      // Tank
      ctx.fillStyle = '#4aa3df';
      ctx.fillRect(ox - ow / 2, gy - oh, ow, oh);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox - ow / 2, gy - oh, ow, oh);
      // Target
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(ox + ow / 2 + 10, gy - oh * 0.7, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      // Person on seat
      if (!dunked) {
        ctx.fillStyle = '#f5c542';
        ctx.beginPath();
        ctx.arc(ox, gy - oh - 10, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.fillRect(ox - 3, gy - oh - 4, 6, 8);
      }
      break;
    case 'ramp':
      ctx.fillStyle = '#8b7355';
      ctx.beginPath();
      ctx.moveTo(ox - ow / 2, gy);
      ctx.lineTo(ox + ow / 2, gy);
      ctx.lineTo(ox - ow / 2, gy - oh);
      ctx.closePath();
      ctx.fill();
      // Ball on ramp
      if (!obj.hit) {
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(ox - ow / 4, gy - oh / 2 - 6, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'hoop':
      const hoopY = gy - oh;
      // Pole
      ctx.fillStyle = '#888';
      ctx.fillRect(ox - 2, hoopY, 4, oh);
      // Backboard
      ctx.fillStyle = '#fff';
      ctx.fillRect(ox - 12 * scale, hoopY, 24 * scale, 18 * scale);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox - 12 * scale, hoopY, 24 * scale, 18 * scale);
      // Rim
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ox - 10 * scale, hoopY + 18 * scale);
      ctx.lineTo(ox + 10 * scale, hoopY + 18 * scale);
      ctx.stroke();
      // Net
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      for (let n = 0; n < 4; n++) {
        ctx.beginPath();
        ctx.moveTo(ox - 8 * scale + n * 5 * scale, hoopY + 18 * scale);
        ctx.lineTo(ox - 4 * scale + n * 3 * scale, hoopY + 30 * scale);
        ctx.stroke();
      }
      break;
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Particles
function spawnParticles(x, y, type, count) {
  // Cap total particles to prevent performance issues
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
    if (p.type === 'leaf') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot || 0);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else if (p.type === 'confetti') {
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
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  for (const wl of windLines) {
    ctx.globalAlpha = wl.life * 0.5;
    ctx.beginPath();
    ctx.moveTo(wl.x, wl.y);
    ctx.lineTo(wl.x + wl.len * Math.sign(wl.speed), wl.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Background
function drawBackground() {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#4a90d9');
  grad.addColorStop(0.6, '#87ceeb');
  grad.addColorStop(1, '#b5e7ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const cloudT = animFrame * 0.0002;
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 200 + cloudT * 50 * (i + 1)) % (W + 200)) - 100;
    const cy = 40 + i * 35;
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.arc(cx + 25, cy - 5, 20, 0, Math.PI * 2);
    ctx.arc(cx + 50, cy, 25, 0, Math.PI * 2);
    ctx.arc(cx + 25, cy + 5, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground
  const gy = (levelData?.groundLevel || 0.85) * H;

  if (levelData?.customGround === 'cliffs') {
    // Left cliff
    ctx.fillStyle = '#6b5b3a';
    ctx.fillRect(0, gy, W * 0.42, H - gy + 50);
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(0, gy, W * 0.42, 10);
    // Right cliff
    ctx.fillStyle = '#6b5b3a';
    ctx.fillRect(W * 0.58, gy, W * 0.42 + 50, H - gy + 50);
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(W * 0.58, gy, W * 0.42 + 50, 10);
    // Gap (dark)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(W * 0.42, gy, W * 0.16, H - gy + 50);
    // Grass on cliffs
    ctx.fillStyle = '#4a2';
    ctx.fillRect(0, gy - 5, W * 0.42, 8);
    ctx.fillRect(W * 0.58, gy - 5, W * 0.42 + 50, 8);
  } else {
    ctx.fillStyle = '#4a2';
    ctx.fillRect(0, gy - 3, W, H - gy + 10);
    ctx.fillStyle = '#3a8a1a';
    ctx.fillRect(0, gy - 3, W, 6);
    // Dirt
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(0, gy + 20, W, H - gy);
  }

  // Ground cracks (earthquake)
  for (const c of groundCracks) {
    ctx.strokeStyle = `rgba(80,60,30,${c.life})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x, gy);
    ctx.lineTo(c.x + c.dx, gy + c.dy);
    ctx.lineTo(c.x + c.dx * 1.5, gy + c.dy * 0.5);
    ctx.stroke();
  }
}

// Cut line
function drawCutLine() {
  if (!cutLine || state !== 'cutting') return;
  const tree = trees[activeTreeIndex];
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = '#ff0';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ff0';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  const cx = tree.x;
  const cy = tree.y - tree.height * 0.15;
  const len = tree.trunkW * 2;
  ctx.moveTo(cx + Math.cos(cutLine.angle) * len, cy + Math.sin(cutLine.angle) * len);
  ctx.lineTo(cx - Math.cos(cutLine.angle) * len, cy - Math.sin(cutLine.angle) * len);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // Arrow showing fall direction
  const fallDir = cutLine.angle > 0 ? 1 : -1;
  ctx.strokeStyle = '#f80';
  ctx.lineWidth = 2;
  const arrowX = cx + fallDir * 40;
  const arrowY = cy - 40;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 30);
  ctx.lineTo(arrowX, arrowY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX - fallDir * 8, arrowY + 5);
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX - fallDir * 5, arrowY + 10);
  ctx.stroke();

  ctx.restore();
}

// Ball physics for ramp level
function updateBall(dt) {
  if (!ballPhysics) return;
  const b = ballPhysics;
  b.x += b.vx * dt * 0.5;
  b.y += b.vy * dt * 0.5;
  b.vy += 0.2 * dt;

  // Check if ball goes through hoop
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

  // Draw ball
  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.arc(b.x, b.y, 6 * scale, 0, Math.PI * 2);
  ctx.fill();

  if (b.y > H) ballPhysics = null;
}

// Start level
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
  confetti = [];
  groundCracks = [];
  cutLine = null;
  cutReady = false;
  activeTreeIndex = 0;
  fallTime = 0;
  shakeX = 0;
  shakeY = 0;
  damageTotal = 0;
  hitObjects = [];
  ballPhysics = null;
  walkerState = null;
  dunked = false;
  pinsKnocked = 0;
  slowMoFactor = 1;

  // Create tree(s)
  trees.push(new Tree(levelData.tree, 0));
  if (levelData.doubleTree && levelData.tree2) {
    trees.push(new Tree(levelData.tree2, 1));
  }

  // Create objects
  objects = levelData.objects.map(o => ({ ...o, hit: false, bounceTime: 0, fleeX: null, fallAngle: null }));

  // Wind
  windCurrent = levelData.wind.base;
  windTimer = 0;

  // UI
  levelTitle.textContent = `${idx + 1}. ${levelData.name}`;
  objectiveText.textContent = levelData.objective;
  objectiveText.classList.add('show');
  objectiveTimer = 180;
  timberBtn.style.display = 'none';
  resultOverlay.style.display = 'none';
}

// Collision check
function checkCollisions(tree) {
  if (!tree.fallen) return;
  const tipX = tree.getFallTipWorldX();
  const tipNorm = tipX / W;
  const gy = (levelData.groundLevel || 0.85) * H;

  for (const obj of objects) {
    if (obj.hit) continue;
    const ox = obj.x;
    const hw = obj.w / 2;

    // Simple horizontal range check for tip
    if (tipNorm > ox - hw && tipNorm < ox + hw) {
      // Special handling by type
      if (obj.type === 'powerline') {
        const wireY = gy + (obj.yOff || 0) * scale;
        const tipY = tree.pivotY - Math.cos(tree.angle) * (tree.height - tree.cutY);
        // Only hit if tree reaches the wire height
        if (tipY < wireY + 20) {
          hitObject(obj, tipX);
        }
        continue;
      }
      hitObject(obj, tipX);
    }
    // Also check along tree body
    for (let t = 0.2; t < 1; t += 0.2) {
      const bx = tree.pivotX + Math.sin(tree.angle) * (tree.height - tree.cutY) * t;
      const bn = bx / W;
      if (bn > ox - hw && bn < ox + hw) {
        if (obj.type === 'powerline') {
          const wireY = gy + (obj.yOff || 0) * scale;
          const by = tree.pivotY - Math.cos(tree.angle) * (tree.height - tree.cutY) * t;
          if (by < wireY + 20) {
            hitObject(obj, bx);
          }
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
      playSound('crash');
      playSound('glass');
      spawnParticles(x, gy - obj.h * scale * 0.5, 'dust', 20);
      spawnParticles(x, gy - obj.h * scale * 0.5, 'splinter', 10);
      shakeX = 15; shakeY = 10;
      damageTotal += obj.cost || 0;
      break;
    case 'car':
      playSound('crash');
      spawnParticles(x, gy - 20, 'dust', 15);
      spawnParticles(x, gy - 20, 'splinter', 8);
      shakeX = 10; shakeY = 8;
      damageTotal += obj.cost || 0;
      break;
    case 'fence':
      playSound('crunch');
      spawnParticles(x, gy - 20, 'splinter', 12);
      shakeX = 3; shakeY = 2;
      damageTotal += obj.cost || 0;
      break;
    case 'playground':
      playSound('crash');
      spawnParticles(x, gy - 25, 'dust', 15);
      shakeX = 8; shakeY = 5;
      damageTotal += obj.cost || 0;
      break;
    case 'powerline':
      playSound('crash');
      spawnParticles(obj.x * W, gy + (obj.yOff || 0) * scale, 'splinter', 10);
      shakeX = 5; shakeY = 3;
      damageTotal += obj.cost || 0;
      break;
    case 'can':
      playSound('crunch');
      spawnParticles(x, gy - 5, 'dust', 8);
      shakeX = 2; shakeY = 2;
      break;
    case 'truck':
      playSound('crash');
      obj.bounceTime = 2;
      spawnParticles(x, gy - 20, 'dust', 10);
      shakeX = 6; shakeY = 4;
      break;
    case 'pin':
      playSound('bowling');
      obj.fallAngle = (Math.random() - 0.5) * Math.PI;
      pinsKnocked++;
      break;
    case 'dunktank':
      playSound('splash');
      dunked = true;
      spawnParticles(obj.x * W, gy - obj.h * scale, 'splash', 25);
      shakeX = 4; shakeY = 3;
      break;
    case 'ramp':
      playSound('crash');
      // Launch ball
      const gy2 = (levelData.groundLevel || 0.85) * H;
      ballPhysics = {
        x: obj.x * W,
        y: gy2 - obj.h * scale,
        vx: 4,
        vy: -12,
        scored: false
      };
      shakeX = 4; shakeY = 3;
      break;
    case 'pool':
      playSound('splash');
      spawnParticles(obj.x * W, gy - 10, 'splash', 30);
      break;
  }
}

// Evaluate level result
function evaluateResult() {
  const lv = levelData;
  let stars = 0;
  let success = true;
  let message = '';
  const tree = trees[0];
  const tipNorm = tree.getFallTipWorldX() / W;

  // Check avoidAll
  const destructibleHits = hitObjects.filter(o => o.destructible && o.type !== 'can');
  if (lv.starCriteria.any) {
    stars = 3;
    message = 'Great job!';
  } else if (lv.starCriteria.avoidAll) {
    if (destructibleHits.length === 0) {
      stars = 3;
      message = 'Perfect! No damage!';
    } else {
      stars = 0;
      success = false;
      message = `$${damageTotal.toLocaleString()} in damages!`;
    }
  }

  if (lv.starCriteria.hitTarget) {
    const targetHit = hitObjects.find(o => o.target);
    if (targetHit) {
      stars = Math.max(stars, 2);
      message = 'Target hit!';
      if (lv.starCriteria.precision) {
        const obj = lv.objects.find(o => o.target);
        if (obj && Math.abs(tipNorm - obj.x) < lv.starCriteria.precision) {
          stars = 3;
          message = 'PERFECT hit! 🎯';
        }
      }
      if (lv.starCriteria.flatLanding) {
        if (Math.abs(tree.angle) > 1.3 && Math.abs(tree.angle) < 1.8) {
          stars = 3;
          message = 'Perfect flat landing! 🛻';
        }
      }
    } else {
      stars = 0;
      success = false;
      message = 'Missed the target!';
    }
  }

  if (lv.starCriteria.pinsKnocked) {
    const totalPins = objects.filter(o => o.type === 'pin').length;
    if (pinsKnocked >= totalPins) {
      stars = 3;
      message = 'STRIKE! 🎳';
    } else if (pinsKnocked > totalPins / 2) {
      stars = 2;
      message = `${pinsKnocked}/${totalPins} pins!`;
    } else if (pinsKnocked > 0) {
      stars = 1;
      message = `Only ${pinsKnocked}/${totalPins} pins...`;
    } else {
      stars = 0;
      success = false;
      message = 'Gutter ball!';
    }
  }

  if (lv.starCriteria.bridge) {
    // Check if tree spans the gap
    if (tipNorm > 0.58 && tree.pivotX / W < 0.42) {
      stars = 3;
      message = 'Bridge complete! 🌉';
      walkerState = { x: tree.pivotX - 20, progress: 0 };
    } else {
      stars = 0;
      success = false;
      message = 'Tree fell into the gap!';
    }
  }

  if (lv.starCriteria.chainReaction) {
    if (ballPhysics?.scored) {
      stars = 3;
      message = 'SWISH! Nothing but net! 🏀';
    } else if (hitObjects.find(o => o.type === 'ramp')) {
      stars = 1;
      message = 'Hit the ramp but missed the hoop!';
    } else {
      stars = 0;
      success = false;
      message = 'Missed the ramp!';
    }
  }

  if (lv.starCriteria.bonusPool) {
    const poolHit = hitObjects.find(o => o.type === 'pool');
    if (poolHit) {
      if (destructibleHits.length === 0) {
        stars = 3;
        message = 'CANNONBALL! Bonus splash! 💦';
      } else {
        stars = 1;
        message = 'Splash! But also damage...';
      }
    } else if (destructibleHits.length === 0) {
      stars = 2;
      message = 'Pool is safe! (But splashing is fun...)';
    }
  }

  if (lv.starCriteria.bothTrees) {
    if (trees.length > 1 && trees[0].fallen && trees[1].fallen) {
      const dir0 = trees[0].angle > 0 ? 1 : -1;
      const dir1 = trees[1].angle > 0 ? 1 : -1;
      if (dir0 !== dir1 && destructibleHits.length === 0) {
        stars = 3;
        message = 'Both trees fell perfectly! 🌲↔️🌲';
      } else if (destructibleHits.length === 0) {
        stars = 1;
        message = 'No damage, but not opposite directions!';
      } else {
        stars = 0;
        success = false;
        message = `$${damageTotal.toLocaleString()} in damages!`;
      }
    }
  }

  // Show result
  state = 'result';
  resultOverlay.style.display = 'block';
  resultTitle.textContent = success ? '🎉 TIMBER!' : '💥 Oops!';
  resultTitle.style.color = success ? '#4a2' : '#e74c3c';
  resultStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  resultMessage.textContent = message;

  if (success) {
    playSound('cheer');
    spawnParticles(W / 2, H / 3, 'confetti', 20);
  } else {
    playSound('trombone');
  }

  // Save progress
  const prev = progress[currentLevel] || 0;
  if (stars > prev) {
    progress[currentLevel] = stars;
    saveProgress();
  }

  document.getElementById('btn-next').style.display = currentLevel < LEVELS.length - 1 ? 'inline-block' : 'none';
}

// Input handling
function getInputPos(e) {
  if (e.touches) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function onPointerDown(e) {
  e.preventDefault();
  initAudio();
  const pos = getInputPos(e);
  if (state === 'playing') {
    const tree = trees[activeTreeIndex];
    // Check if clicking on trunk area
    const dx = Math.abs(pos.x - tree.x);
    const dy = pos.y - (tree.y - tree.height);
    if (dx < tree.trunkW * 2 && dy > 0 && dy < tree.height) {
      state = 'cutting';
      dragStart = { x: pos.x, y: pos.y };
      cutLine = { angle: 0 };
      playSound('chainsaw');
      spawnParticles(tree.x, tree.y - tree.height * 0.15, 'sawdust', 15);
      timberBtn.style.display = 'block';
    }
  }
  if (state === 'cutting') {
    dragCurrent = pos;
    updateCutAngle(pos);
  }
}

function onPointerMove(e) {
  e.preventDefault();
  const pos = getInputPos(e);
  mousePos = pos;
  if (state === 'cutting' && dragStart) {
    dragCurrent = pos;
    updateCutAngle(pos);
  }
}

function onPointerUp(e) {
  e.preventDefault();
  dragStart = null;
  dragCurrent = null;
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
  // Determine fall direction from cut angle
  // If cut angle points right (cos > 0), the wedge is on the right, tree falls RIGHT (positive angle)
  // If cut angle points left (cos < 0), tree falls LEFT (negative angle)
  const cosA = Math.cos(cutLine.angle);
  const fallDir = cosA > 0 ? 0.05 : -0.05;
  tree.startFall(fallDir);
  state = 'falling';
  fallTime = 0;
  timberBtn.style.display = 'none';
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

// Timber button
timberBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  executeCut();
});

// Menu buttons
document.getElementById('btn-play').addEventListener('click', () => showScreen('levelselect'));
document.getElementById('btn-back-menu').addEventListener('click', () => showScreen('menu'));
document.getElementById('btn-back-levels').addEventListener('click', () => {
  showScreen('levelselect');
  state = 'levelselect';
});
document.getElementById('btn-restart').addEventListener('click', () => startLevel(currentLevel));
document.getElementById('btn-retry').addEventListener('click', () => startLevel(currentLevel));
document.getElementById('btn-next').addEventListener('click', () => {
  if (currentLevel < LEVELS.length - 1) startLevel(currentLevel + 1);
});

// Main loop
function update(dt) {
  if (state === 'falling' || state === 'result') {
    const adt = dt * slowMoFactor;
    fallTime += adt;

    // Wind
    windTimer += adt;
    if (levelData.wind.changing) {
      windCurrent = levelData.wind.base * Math.sin(windTimer * 0.02) + (Math.random() - 0.5) * levelData.wind.gust * 0.1;
    } else if (windTimer > 60 + Math.random() * 120) {
      windCurrent = levelData.wind.base + (Math.random() - 0.5) * levelData.wind.gust * 2;
      windTimer = 0;
      if (Math.abs(windCurrent) > 0.5) playSound('wind');
    }

    // Earthquake
    if (levelData.earthquake) {
      quakeTimer += adt;
      if (Math.random() < 0.02 * adt) {
        shakeX += (Math.random() - 0.5) * 8;
        shakeY += (Math.random() - 0.5) * 4;
        groundCracks.push({
          x: Math.random() * W,
          dx: (Math.random() - 0.5) * 30,
          dy: Math.random() * 20,
          life: 1
        });
      }
    }

    // Update trees
    for (const tree of trees) {
      tree.update(adt, windCurrent);
    }

    // Check tree settled
    const allSettled = trees.filter(t => t.falling).every(t => t.settled);
    if (allSettled && trees.some(t => t.falling)) {
      // Impact effects
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

      // Check collisions
      for (const tree of trees) {
        checkCollisions(tree);
      }

      // Handle flee for stick figures
      for (const obj of objects) {
        if (obj.flee && !obj.fleeing) {
          obj.fleeing = true;
          const dir = trees[0].angle > 0 ? -1 : 1;
          obj.fleeX = obj.x * W + dir * 100;
        }
      }

      // Handle double chop
      if (levelData.doubleTree && activeTreeIndex === 0 && trees.length > 1 && !trees[1].falling) {
        activeTreeIndex = 1;
        state = 'playing';
        timberBtn.style.display = 'none';
        cutLine = null;
        objectiveText.textContent = 'Now chop the second tree!';
        objectiveText.classList.add('show');
        objectiveTimer = 120;
        return;
      }

      // Delay before showing result
      if (fallTime > 30 && state === 'falling') {
        // Wait a bit more for ball physics etc
        const waitForBall = ballPhysics && !ballPhysics.scored && ballPhysics.y < H;
        if (!waitForBall) {
          setTimeout(() => {
            if (state === 'falling') evaluateResult();
          }, 500);
        }
      }
    }

    // Slow mo ramp back up
    if (slowMoFactor < 1) {
      slowMoFactor = Math.min(1, slowMoFactor + 0.001 * dt);
    }
  }

  // Playing state - wind indicator
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

    // Earthquake wobble
    if (levelData.earthquake && Math.random() < 0.01) {
      shakeX += (Math.random() - 0.5) * 5;
      shakeY += (Math.random() - 0.5) * 3;
    }
  }

  // Update fleeing stick figures
  for (const obj of objects) {
    if (obj.fleeing && obj.fleeX != null) {
      const target = obj.fleeX;
      const current = obj._currentFleeX || obj.x * W;
      obj._currentFleeX = current + (target - current) * 0.05;
      obj.fleeX = obj._currentFleeX;
    }
  }

  // Shake decay
  shakeX *= 0.9;
  shakeY *= 0.9;
  if (Math.abs(shakeX) < 0.1) shakeX = 0;
  if (Math.abs(shakeY) < 0.1) shakeY = 0;

  // Ground cracks decay
  for (let i = groundCracks.length - 1; i >= 0; i--) {
    groundCracks[i].life -= 0.005 * dt;
    if (groundCracks[i].life <= 0) groundCracks.splice(i, 1);
  }

  // Objective text timer
  if (objectiveTimer > 0) {
    objectiveTimer -= dt;
    if (objectiveTimer <= 0) objectiveText.classList.remove('show');
  }

  // Truck bounce decay
  for (const obj of objects) {
    if (obj.bounceTime > 0) obj.bounceTime -= 0.02 * dt;
  }

  updateParticles(dt);
  updateWindLines(dt);

  // Wind UI
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

  drawBackground();

  if (state === 'playing' || state === 'cutting' || state === 'falling' || state === 'result') {
    // Draw objects behind tree
    for (const obj of objects) {
      drawObject(obj);
    }

    // Draw trees
    for (const tree of trees) {
      tree.draw(ctx);
    }

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
        ctx.beginPath();
        ctx.arc(wx, wy - 8, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wx, wy - 4);
        ctx.lineTo(wx, wy + 8);
        ctx.moveTo(wx - 5, wy);
        ctx.lineTo(wx + 5, wy);
        ctx.moveTo(wx, wy + 8);
        ctx.lineTo(wx - 4, wy + 14);
        ctx.moveTo(wx, wy + 8);
        ctx.lineTo(wx + 4, wy + 14);
        ctx.stroke();
      }
    }
  }

  drawParticles();
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
