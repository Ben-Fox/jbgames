// SHATTERFORM - A BrainSmacks Game
// Grow your geometric form. Shatter it to destroy enemies. Survive.

(() => {
'use strict';

// ============ CANVAS SETUP ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H, cx, cy;

function resize() {
    W = canvas.width = window.innerWidth * devicePixelRatio;
    H = canvas.height = window.innerHeight * devicePixelRatio;
    cx = W / 2;
    cy = H / 2;
    ctx.scale(1, 1); // reset
}
resize();
window.addEventListener('resize', resize);

// ============ AUDIO ============
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, dur, type = 'sine', vol = 0.15, detune = 0) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

function playNoise(dur, vol = 0.1) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * dur;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    src.connect(gain).connect(audioCtx.destination);
    src.start();
}

function sfxShatter(size) {
    const intensity = Math.min(size / 80, 1);
    playNoise(0.2 + intensity * 0.3, 0.08 + intensity * 0.12);
    playTone(200 + intensity * 100, 0.15, 'sawtooth', 0.06);
    playTone(80, 0.3, 'sine', 0.05 * intensity);
}

function sfxHit() {
    playTone(150, 0.2, 'sawtooth', 0.12);
    playTone(80, 0.3, 'sine', 0.08);
    playNoise(0.15, 0.1);
}

function sfxKill(combo) {
    const base = 400 + combo * 80;
    playTone(base, 0.12, 'sine', 0.1);
    playTone(base * 1.5, 0.08, 'sine', 0.06, 10);
}

function sfxOrb() {
    playTone(600, 0.1, 'sine', 0.08);
    playTone(900, 0.08, 'sine', 0.05);
}

function sfxWave() {
    playTone(300, 0.3, 'triangle', 0.08);
    setTimeout(() => playTone(450, 0.3, 'triangle', 0.08), 100);
    setTimeout(() => playTone(600, 0.4, 'triangle', 0.1), 200);
}

function sfxGameOver() {
    playTone(300, 0.4, 'sawtooth', 0.1);
    setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.1), 150);
    setTimeout(() => playTone(100, 0.8, 'sawtooth', 0.12), 300);
}

// ============ GAME STATE ============
const DIFF_SETTINGS = [
    { name: 'CHILL', enemySpeedMult: 0.6, spawnMult: 0.6, lives: 5, growRate: 1.2 },
    { name: 'NORMAL', enemySpeedMult: 1.0, spawnMult: 1.0, lives: 3, growRate: 1.0 },
    { name: 'INTENSE', enemySpeedMult: 1.4, spawnMult: 1.5, lives: 2, growRate: 0.8 },
];

let difficulty = 1;
let state = 'menu'; // menu, playing, gameover
let score, lives, wave, enemiesKilled, bestCombo, biggestShatter;
let playerSize, playerMaxSize, playerAngle;
let enemies, fragments, particles, orbs;
let comboCount, comboTimer, comboMultiplier;
let shakeX, shakeY, shakeDur;
let waveTimer, waveEnemies, waveEnemiesSpawned;
let spawnTimer;
let tutorialShown, tutorialTimer;
let gameTime;
let slowMoTimer, slowMoFactor;

const MIN_SIZE = 15;
const MAX_SIZE = 120;
const COMBO_WINDOW = 1.5; // seconds

function resetGame() {
    const diff = DIFF_SETTINGS[difficulty];
    score = 0;
    lives = diff.lives;
    wave = 1;
    enemiesKilled = 0;
    bestCombo = 0;
    biggestShatter = 0;
    playerSize = MIN_SIZE;
    playerMaxSize = MAX_SIZE;
    playerAngle = 0;
    enemies = [];
    fragments = [];
    particles = [];
    orbs = [];
    comboCount = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    shakeX = 0;
    shakeY = 0;
    shakeDur = 0;
    waveTimer = 3;
    waveEnemies = 5;
    waveEnemiesSpawned = 0;
    spawnTimer = 0;
    tutorialShown = false;
    tutorialTimer = 0;
    gameTime = 0;
    slowMoTimer = 0;
    slowMoFactor = 1;
}

// ============ ENTITIES ============
function spawnEnemy() {
    const diff = DIFF_SETTINGS[difficulty];
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(W, H) * 0.6;
    const speed = (40 + Math.random() * 30 + wave * 3) * diff.enemySpeedMult;
    const size = 10 + Math.random() * 12;
    // Type weights shift with waves
    let type;
    const r = Math.random();
    if (wave < 3) {
        type = r < 0.7 ? 'circle' : 'triangle';
    } else if (wave < 6) {
        type = r < 0.5 ? 'circle' : r < 0.8 ? 'triangle' : 'diamond';
    } else {
        type = r < 0.35 ? 'circle' : r < 0.65 ? 'triangle' : r < 0.85 ? 'diamond' : 'dasher';
    }
    
    const colors = { circle: '#ff3366', triangle: '#ff9900', diamond: '#cc33ff', dasher: '#ff5555' };
    
    // Dasher behavior: pauses then dashes quickly
    const isDasher = type === 'dasher';
    
    enemies.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        speed: isDasher ? speed * 0.3 : speed,
        dashSpeed: speed * 2.5,
        size: isDasher ? size * 0.8 : size,
        type,
        color: colors[type],
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 4,
        hp: type === 'diamond' ? 2 : 1,
        flashTimer: 0,
        dashTimer: isDasher ? 2 + Math.random() : 0,
        isDashing: false,
        orbitAngle: Math.random() * Math.PI * 2,
        // Triangles orbit slightly
        orbitSpeed: type === 'triangle' ? (Math.random() - 0.5) * 2 : 0,
    });
}

function spawnOrb() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * Math.min(W, H) * 0.3;
    orbs.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        size: 8,
        pulse: Math.random() * Math.PI * 2,
        life: 8, // seconds
    });
}

function addFragment(x, y, angle, speed, size, color) {
    fragments.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 10,
    });
}

function addParticle(x, y, color, speed, life, size) {
    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        color,
        life,
        maxLife: life,
        size: size || 3,
    });
}

function shatter() {
    if (playerSize <= MIN_SIZE + 2) return; // too small to shatter
    
    const sizeRatio = (playerSize - MIN_SIZE) / (playerMaxSize - MIN_SIZE);
    const fragmentCount = Math.floor(8 + sizeRatio * 24);
    const fragmentSpeed = 200 + sizeRatio * 400;
    const fragmentSize = 4 + sizeRatio * 8;
    
    biggestShatter = Math.max(biggestShatter, fragmentCount);
    
    sfxShatter(playerSize);
    
    // Create fragments
    for (let i = 0; i < fragmentCount; i++) {
        const angle = (Math.PI * 2 * i / fragmentCount) + (Math.random() - 0.5) * 0.3;
        const speed = fragmentSpeed * (0.7 + Math.random() * 0.6);
        const hue = 190 + Math.random() * 40;
        addFragment(cx, cy, angle, speed, fragmentSize * (0.6 + Math.random() * 0.8), `hsl(${hue}, 100%, 70%)`);
    }
    
    // Particle burst
    for (let i = 0; i < 20; i++) {
        addParticle(cx, cy, '#00c8ff', 300, 0.4, 2);
    }
    
    // Screen shake proportional to size
    shakeDur = 0.1 + sizeRatio * 0.2;
    
    // Brief slowmo for big shatters
    if (sizeRatio > 0.5) {
        slowMoTimer = 0.15;
        slowMoFactor = 0.3;
    }
    
    // Score bonus for size when shattering
    const sizeBonus = Math.floor(sizeRatio * 50);
    score += sizeBonus;
    
    playerSize = MIN_SIZE;
}

function triggerScreenShake(duration, intensity) {
    shakeDur = duration;
    // shakeX/Y computed in update
}

// ============ COLLISION ============
function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// ============ UPDATE ============
function update(dt) {
    if (state !== 'playing') return;
    
    // Slow motion
    if (slowMoTimer > 0) {
        slowMoTimer -= dt;
        dt *= slowMoFactor;
    }
    
    gameTime += dt;
    const diff = DIFF_SETTINGS[difficulty];
    
    // Tutorial
    if (!tutorialShown && gameTime < 5) {
        tutorialTimer = 5 - gameTime;
    } else {
        tutorialShown = true;
        tutorialTimer = 0;
    }
    
    // Player grows
    const growRate = (8 + wave * 0.5) * diff.growRate;
    playerSize = Math.min(playerSize + growRate * dt, playerMaxSize);
    playerAngle += dt * 0.5;
    
    // Score from size (bigger = more points per second)
    const sizeRatio = (playerSize - MIN_SIZE) / (playerMaxSize - MIN_SIZE);
    score += Math.floor((10 + sizeRatio * 40) * comboMultiplier * dt);
    
    // Combo timer
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            comboCount = 0;
            comboMultiplier = 1;
        }
    }
    
    // Wave management
    waveTimer -= dt;
    if (waveTimer <= 0) {
        spawnTimer -= dt;
        const spawnInterval = Math.max(0.3, 1.5 - wave * 0.08) / diff.spawnMult;
        if (spawnTimer <= 0 && waveEnemiesSpawned < waveEnemies) {
            spawnEnemy();
            waveEnemiesSpawned++;
            spawnTimer = spawnInterval;
        }
        
        // Wave complete when all enemies spawned and destroyed
        if (waveEnemiesSpawned >= waveEnemies && enemies.length === 0) {
            wave++;
            waveEnemies = Math.floor(5 + wave * 3 + wave * wave * 0.3);
            waveEnemiesSpawned = 0;
            waveTimer = 2;
            sfxWave();
            // Spawn orbs between waves
            for (let i = 0; i < 2 + Math.floor(wave / 3); i++) spawnOrb();
        }
    }
    
    // Random orb spawns
    if (Math.random() < 0.005 * dt * 60) spawnOrb();
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const angle = Math.atan2(cy - e.y, cx - e.x);
        
        // Dasher logic
        if (e.type === 'dasher') {
            if (!e.isDashing) {
                e.dashTimer -= dt;
                if (e.dashTimer <= 0) {
                    e.isDashing = true;
                    e.dashTimer = 0.4; // dash duration
                }
                e.vx = Math.cos(angle) * e.speed;
                e.vy = Math.sin(angle) * e.speed;
            } else {
                e.dashTimer -= dt;
                if (e.dashTimer <= 0) {
                    e.isDashing = false;
                    e.dashTimer = 1.5 + Math.random();
                }
                e.vx = Math.cos(angle) * e.dashSpeed;
                e.vy = Math.sin(angle) * e.dashSpeed;
            }
        } else if (e.type === 'triangle') {
            // Triangles spiral inward
            const d = dist(e.x, e.y, cx, cy);
            e.orbitAngle += e.orbitSpeed * dt;
            const perpAngle = angle + Math.PI / 2;
            const orbitStr = Math.min(1, d / 200) * 0.4;
            e.vx = Math.cos(angle) * e.speed + Math.cos(perpAngle) * e.speed * orbitStr * Math.sin(e.orbitAngle);
            e.vy = Math.sin(angle) * e.speed + Math.sin(perpAngle) * e.speed * orbitStr * Math.sin(e.orbitAngle);
        } else {
            e.vx = Math.cos(angle) * e.speed;
            e.vy = Math.sin(angle) * e.speed;
        }
        
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.angle += e.spinSpeed * dt;
        if (e.flashTimer > 0) e.flashTimer -= dt;
        
        // Hit player
        const d = dist(e.x, e.y, cx, cy);
        if (d < playerSize + e.size) {
            enemies.splice(i, 1);
            lives--;
            sfxHit();
            shakeDur = 0.3;
            
            // Hit particles
            for (let j = 0; j < 15; j++) {
                addParticle(cx, cy, '#ff3366', 200, 0.5, 4);
            }
            
            if (lives <= 0) {
                gameOver();
                return;
            }
            
            // Invincibility flash handled visually
            continue;
        }
    }
    
    // Update fragments - check collisions with enemies
    for (let i = fragments.length - 1; i >= 0; i--) {
        const f = fragments[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vx *= 0.97;
        f.vy *= 0.97;
        f.life -= dt;
        f.angle += f.spin * dt;
        
        if (f.life <= 0) {
            fragments.splice(i, 1);
            continue;
        }
        
        // Check vs enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (dist(f.x, f.y, e.x, e.y) < f.size + e.size) {
                e.hp--;
                e.flashTimer = 0.1;
                
                if (e.hp <= 0) {
                    // Kill enemy
                    for (let k = 0; k < 8; k++) {
                        addParticle(e.x, e.y, e.color, 150, 0.3, 3);
                    }
                    
                    enemies.splice(j, 1);
                    enemiesKilled++;
                    
                    // Combo
                    comboCount++;
                    comboTimer = COMBO_WINDOW;
                    comboMultiplier = 1 + Math.floor(comboCount / 3) * 0.5;
                    bestCombo = Math.max(bestCombo, comboCount);
                    
                    // Score per kill
                    score += Math.floor((25 + wave * 5) * comboMultiplier);
                    
                    sfxKill(comboCount);
                }
                
                f.life = 0;
                break;
            }
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.pulse += dt * 3;
        o.life -= dt;
        
        if (o.life <= 0) {
            orbs.splice(i, 1);
            continue;
        }
        
        // Player collects orb
        if (dist(o.x, o.y, cx, cy) < playerSize + o.size + 5) {
            playerSize = Math.min(playerSize + 15, playerMaxSize);
            score += 50;
            sfxOrb();
            for (let j = 0; j < 6; j++) {
                addParticle(o.x, o.y, '#00ffaa', 100, 0.3, 3);
            }
            orbs.splice(i, 1);
        }
    }
    
    // Screen shake
    if (shakeDur > 0) {
        shakeDur -= dt;
        const intensity = shakeDur * 30;
        shakeX = (Math.random() - 0.5) * intensity;
        shakeY = (Math.random() - 0.5) * intensity;
    } else {
        shakeX = 0;
        shakeY = 0;
    }
    
    // Update HUD
    updateHUD();
}

// ============ RENDER ============
function drawPlayer() {
    const x = cx + shakeX;
    const y = cy + shakeY;
    const s = playerSize;
    const sizeRatio = (s - MIN_SIZE) / (playerMaxSize - MIN_SIZE);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(playerAngle);
    
    // Glow
    const glowSize = s * 1.5;
    const glow = ctx.createRadialGradient(0, 0, s * 0.5, 0, 0, glowSize);
    const hue = 190 + sizeRatio * 30;
    glow.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.3)`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Main shape - hexagon
    const sides = 6;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const a = (Math.PI * 2 * i / sides) - Math.PI / 2;
        const wobble = 1 + Math.sin(gameTime * 3 + i) * 0.05 * sizeRatio;
        const r = s * wobble;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    
    // Fill gradient
    const fillGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
    fillGrad.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.9)`);
    fillGrad.addColorStop(0.6, `hsla(${hue}, 100%, 55%, 0.7)`);
    fillGrad.addColorStop(1, `hsla(${hue}, 80%, 40%, 0.5)`);
    ctx.fillStyle = fillGrad;
    ctx.fill();
    
    // Border
    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.8)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Inner detail
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const a = (Math.PI * 2 * i / sides) - Math.PI / 2;
        const r = s * 0.4;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
}

function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x + shakeX, e.y + shakeY);
    ctx.rotate(e.angle);
    
    const color = e.flashTimer > 0 ? '#fff' : e.color;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    if (e.type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 1.4, 0, Math.PI * 2);
        ctx.stroke();
    } else if (e.type === 'triangle') {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const a = (Math.PI * 2 * i / 3) - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(a) * e.size, Math.sin(a) * e.size);
            else ctx.lineTo(Math.cos(a) * e.size, Math.sin(a) * e.size);
        }
        ctx.closePath();
        ctx.fill();
    } else if (e.type === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(0, -e.size);
        ctx.lineTo(e.size * 0.7, 0);
        ctx.lineTo(0, e.size);
        ctx.lineTo(-e.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        if (e.hp > 1) {
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (e.type === 'dasher') {
        // Star/bolt shape
        const s = e.size;
        const glow = e.isDashing ? 0.6 : 0.2;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = e.isDashing ? 15 : 0;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a1 = (Math.PI * 2 * i / 5) - Math.PI / 2;
            const a2 = a1 + Math.PI / 5;
            ctx.lineTo(Math.cos(a1) * s, Math.sin(a1) * s);
            ctx.lineTo(Math.cos(a2) * s * 0.4, Math.sin(a2) * s * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    ctx.restore();
}

function drawFragment(f) {
    const alpha = f.life / f.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(f.x + shakeX, f.y + shakeY);
    ctx.rotate(f.angle);
    ctx.fillStyle = f.color;
    
    // Small polygon
    ctx.beginPath();
    const sides = 4;
    for (let i = 0; i < sides; i++) {
        const a = Math.PI * 2 * i / sides;
        const r = f.size;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawParticle(p) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x + shakeX, p.y + shakeY, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawOrb(o) {
    const alpha = o.life < 2 ? o.life / 2 : 1;
    const pulse = 1 + Math.sin(o.pulse) * 0.2;
    const r = o.size * pulse;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(o.x + shakeX, o.y + shakeY);
    
    // Glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3);
    glow.addColorStop(0, 'rgba(0, 255, 170, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.fillStyle = '#00ffaa';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawBackground() {
    // Dark gradient background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);
    
    // Subtle grid
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    const offsetX = (shakeX * 0.3) % gridSize;
    const offsetY = (shakeY * 0.3) % gridSize;
    for (let x = offsetX; x < W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = offsetY; y < H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    
    // Radial vignette
    const vig = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.2, cx, cy, Math.max(W, H) * 0.7);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    
    // Low health red vignette
    if (state === 'playing' && lives <= 1) {
        const pulse = 0.15 + Math.sin(gameTime * 4) * 0.1;
        const dangerVig = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.3, cx, cy, Math.max(W, H) * 0.6);
        dangerVig.addColorStop(0, 'transparent');
        dangerVig.addColorStop(1, `rgba(255, 0, 0, ${pulse})`);
        ctx.fillStyle = dangerVig;
        ctx.fillRect(0, 0, W, H);
    }
}

function drawTutorial() {
    if (tutorialTimer > 0 && gameTime < 5) {
        ctx.save();
        ctx.globalAlpha = Math.min(tutorialTimer / 2, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `${16 * devicePixelRatio}px Rajdhani, sans-serif`;
        ctx.textAlign = 'center';
        const isMobile = 'ontouchstart' in window;
        const text = isMobile ? 'TAP to SHATTER!' : 'CLICK to SHATTER!';
        ctx.fillText(text, cx, cy + playerSize + 40 * devicePixelRatio);
        
        // Pulsing ring hint
        const ringSize = playerSize + 20 + Math.sin(gameTime * 4) * 10;
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 + Math.sin(gameTime * 4) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, ringSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
}

function render() {
    drawBackground();
    
    if (state === 'playing' || state === 'gameover') {
        // Draw orbs
        orbs.forEach(drawOrb);
        
        // Draw enemies
        enemies.forEach(drawEnemy);
        
        // Draw fragments
        fragments.forEach(drawFragment);
        
        // Draw particles
        particles.forEach(drawParticle);
        
        // Draw player (if playing)
        if (state === 'playing') {
            drawPlayer();
            drawTutorial();
        }
        
        // Wave announcement
        if (waveTimer > 0 && wave > 1) {
            ctx.save();
            const alpha = Math.min(waveTimer, 1);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#00c8ff';
            ctx.font = `bold ${32 * devicePixelRatio}px Orbitron, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(`WAVE ${wave}`, cx, cy - 80 * devicePixelRatio);
            ctx.restore();
        }
    }
    
    // Menu background animation
    if (state === 'menu') {
        drawMenuBg();
    }
}

// Ambient floating shapes for menu
let menuShapes = [];
function initMenuShapes() {
    menuShapes = [];
    for (let i = 0; i < 15; i++) {
        menuShapes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: 10 + Math.random() * 30,
            speed: 10 + Math.random() * 20,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 2,
            hue: 190 + Math.random() * 40,
            alpha: 0.05 + Math.random() * 0.1,
        });
    }
}
initMenuShapes();

function drawMenuBg() {
    menuShapes.forEach(s => {
        s.y -= s.speed * 0.016;
        s.angle += s.spin * 0.016;
        if (s.y < -50) { s.y = H + 50; s.x = Math.random() * W; }
        
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.strokeStyle = `hsl(${s.hue}, 100%, 60%)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = Math.PI * 2 * i / 6;
            if (i === 0) ctx.moveTo(Math.cos(a) * s.size, Math.sin(a) * s.size);
            else ctx.lineTo(Math.cos(a) * s.size, Math.sin(a) * s.size);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    });
}

// ============ HUD ============
function updateHUD() {
    document.getElementById('hud-score-val').textContent = Math.floor(score).toLocaleString();
    document.getElementById('hud-wave-val').textContent = wave;
    
    // Size bar
    const sizeRatio = (playerSize - MIN_SIZE) / (playerMaxSize - MIN_SIZE);
    const sizeBar = document.getElementById('size-bar');
    sizeBar.style.width = (sizeRatio * 100) + '%';
    sizeBar.classList.toggle('full', sizeRatio > 0.85);
    
    // Combo
    const comboEl = document.getElementById('hud-combo');
    if (comboCount >= 3 && comboTimer > 0) {
        comboEl.classList.remove('hidden');
        document.getElementById('hud-combo-val').textContent = `x${comboMultiplier.toFixed(1)}`;
    } else {
        comboEl.classList.add('hidden');
    }
    
    // Lives
    const livesEl = document.getElementById('hud-lives');
    const totalLives = DIFF_SETTINGS[difficulty].lives;
    if (livesEl.children.length !== totalLives) {
        livesEl.innerHTML = '';
        for (let i = 0; i < totalLives; i++) {
            const pip = document.createElement('div');
            pip.className = 'life-pip';
            livesEl.appendChild(pip);
        }
    }
    const pips = livesEl.children;
    for (let i = 0; i < totalLives; i++) {
        pips[i].className = i < lives ? 'life-pip' : 'life-pip lost';
    }
}

// ============ SCREENS ============
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (id) document.getElementById(id).classList.add('active');
}

function startGame() {
    initAudio();
    resetGame();
    state = 'playing';
    showScreen(null);
    document.getElementById('hud').classList.remove('hidden');
}

function gameOver() {
    state = 'gameover';
    sfxGameOver();
    document.getElementById('hud').classList.add('hidden');
    
    // Save high score
    const key = `shatterform_best_${difficulty}`;
    const best = parseInt(localStorage.getItem(key) || '0');
    const finalScore = Math.floor(score);
    const isNew = finalScore > best;
    if (isNew) localStorage.setItem(key, finalScore);
    
    document.getElementById('go-score').textContent = finalScore.toLocaleString();
    document.getElementById('go-best').textContent = Math.max(finalScore, best).toLocaleString();
    document.getElementById('go-wave').textContent = wave;
    document.getElementById('go-kills').textContent = enemiesKilled;
    document.getElementById('go-combo').textContent = 'x' + (1 + Math.floor(bestCombo / 3) * 0.5).toFixed(1) + ` (${bestCombo} chain)`;
    document.getElementById('go-shatter').textContent = biggestShatter + ' fragments';
    document.getElementById('new-record').classList.toggle('hidden', !isNew);
    
    setTimeout(() => {
        showScreen('gameover-screen');
        if (window.BrainSmacks) BrainSmacks.showRecommendations(document.getElementById('end-recommendations'));
    }, 500);
}

function showMenu() {
    state = 'menu';
    showScreen('menu-screen');
    document.getElementById('hud').classList.add('hidden');
    updateMenuHighScore();
}

function updateMenuHighScore() {
    const key = `shatterform_best_${difficulty}`;
    document.getElementById('menu-highscore').textContent = 
        parseInt(localStorage.getItem(key) || '0').toLocaleString();
}

// ============ INPUT ============
function handleShatter(e) {
    if (e) e.preventDefault();
    if (state === 'playing') {
        initAudio();
        shatter();
        tutorialShown = true;
    }
}

canvas.addEventListener('mousedown', handleShatter);
canvas.addEventListener('touchstart', handleShatter, { passive: false });

// Keyboard
document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'Enter') {
        if (state === 'playing') handleShatter();
        else if (state === 'menu') startGame();
    }
});

// UI buttons
document.getElementById('btn-play').addEventListener('click', () => { initAudio(); startGame(); });
document.getElementById('btn-retry').addEventListener('click', () => { initAudio(); startGame(); });
// btn-menu replaced with direct link to home
document.getElementById('btn-how').addEventListener('click', () => showScreen('how-screen'));
document.getElementById('btn-back').addEventListener('click', () => showScreen('menu-screen'));

// Difficulty buttons
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = parseInt(btn.dataset.diff);
        updateMenuHighScore();
    });
});

// ============ GAME LOOP ============
let lastTime = 0;
function loop(time) {
    requestAnimationFrame(loop);
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    
    update(dt);
    render();
}

// Init
showMenu();
requestAnimationFrame(loop);

})();
