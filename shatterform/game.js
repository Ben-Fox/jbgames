// SHATTERFORM - A BrainSmacks Game
// Grow your geometric form. Aim and shatter to destroy enemies. Survive.

(() => {
'use strict';

// ============ CANVAS SETUP ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H, cx, cy;
let WORLD_W, WORLD_H;
let camX = 0, camY = 0;
const CAM_LERP = 4; // camera smoothing factor

function resize() {
    W = canvas.width = window.innerWidth * devicePixelRatio;
    H = canvas.height = window.innerHeight * devicePixelRatio;
    cx = W / 2;
    cy = H / 2;
    WORLD_W = W * 2;
    WORLD_H = H * 2;
    // Clamp player to world bounds
    if (typeof playerX !== 'undefined') {
        playerX = Math.max(playerSize + 10, Math.min(WORLD_W - playerSize - 10, playerX));
        playerY = Math.max(playerSize + 10, Math.min(WORLD_H - playerSize - 10, playerY));
    }
    ctx.scale(1, 1);
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

function sfxBeam(size) {
    const intensity = Math.min(size / 80, 1);
    playTone(300 + intensity * 200, 0.3, 'sawtooth', 0.1);
    playTone(600 + intensity * 300, 0.2, 'sine', 0.06);
    playNoise(0.15, 0.06 + intensity * 0.06);
}

function sfxHit() {
    playTone(150, 0.2, 'sawtooth', 0.12);
    playTone(80, 0.3, 'sine', 0.08);
    playNoise(0.15, 0.1);
}

function sfxKill(combo, enemyType) {
    const base = 400 + combo * 80;
    if (enemyType === 'diamond' || enemyType === 'shielded') {
        playTone(120 + combo * 20, 0.3, 'sawtooth', 0.15);
        playNoise(0.2, 0.12);
        playTone(80, 0.4, 'sine', 0.1);
    } else if (enemyType === 'dasher') {
        playTone(base * 1.2, 0.1, 'square', 0.08, 20);
        playTone(base * 2, 0.06, 'sine', 0.05);
    } else {
        playTone(base, 0.12, 'sine', 0.1);
        playTone(base * 1.5, 0.08, 'sine', 0.06, 10 + combo * 5);
    }
    if (combo > 5) {
        playTone(600 + combo * 40, 0.06, 'sine', 0.04);
    }
}

function sfxHeal() {
    playTone(500, 0.15, 'sine', 0.1);
    playTone(700, 0.12, 'sine', 0.08);
    playTone(900, 0.1, 'sine', 0.06);
}

function sfxChainExplosion() {
    playTone(150, 0.15, 'sawtooth', 0.08);
    playNoise(0.1, 0.06);
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

function sfxModeSwitch() {
    playTone(500, 0.08, 'sine', 0.06);
    playTone(700, 0.06, 'sine', 0.04);
}

function sfxBarrierPlace() {
    playTone(250, 0.2, 'triangle', 0.08);
    playTone(400, 0.15, 'sine', 0.06);
    playNoise(0.1, 0.05);
}

function sfxBarrierExpire() {
    playTone(180, 0.3, 'sine', 0.05);
    playNoise(0.15, 0.04);
}

function sfxShieldBlock() {
    playTone(200, 0.15, 'square', 0.08);
    playTone(100, 0.2, 'sine', 0.06);
}

function sfxSpit() {
    playTone(180, 0.15, 'sawtooth', 0.06);
    playNoise(0.1, 0.05);
}

function sfxSniperCharge() {
    playTone(800, 0.5, 'sine', 0.04);
}

function sfxSniperFire() {
    playTone(600, 0.1, 'square', 0.1);
    playTone(300, 0.15, 'sawtooth', 0.08);
    playNoise(0.08, 0.06);
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
let playerX, playerY, playerVX, playerVY;
const PLAYER_SPEED = 230; // px/s max
const PLAYER_FRICTION = 6; // deceleration factor
let enemies, fragments, particles, orbs, beams;
let enemyProjectiles; // projectiles fired by enemies
let comboCount, comboTimer, comboMultiplier;
let shakeX, shakeY, shakeDur;
let waveTimer, waveEnemies, waveEnemiesSpawned;
let spawnTimer;
let tutorialShown, tutorialTimer;
let gameTime;
let slowMoTimer, slowMoFactor;
let shootMode; // 'scatter' or 'beam'
let shootCooldown; // seconds remaining
let aimAngle; // current mouse/touch aim angle
let barriers; // barrier array
let barrierPlaceMode; // true when waiting for click to place
let scorePopups; // floating score text
let screenFlashAlpha; // white flash overlay for multi-kills
let recentKillTimes; // timestamps for multi-kill detection
let healOrbs; // healing orb array
const keysDown = new Set();
const SHOOT_COOLDOWN = 0.4;
const MIN_SHOOT_SIZE = 20;
const SCATTER_CONE = Math.PI * 2 / 3;
const BEAM_CONE = Math.PI / 6;
const MAX_BARRIERS = 3;
const BARRIER_DURATION = 7;
const BARRIER_WIDTH = 140;
const BARRIER_THICKNESS = 12;
const BARRIER_SIZE_COST = 25;

const MIN_SIZE = 15;
const MAX_SIZE = 120;
const COMBO_WINDOW = 1.5;

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
    playerX = WORLD_W / 2;
    playerY = WORLD_H / 2;
    camX = playerX - W / 2;
    camY = playerY - H / 2;
    playerVX = 0;
    playerVY = 0;
    enemies = [];
    fragments = [];
    particles = [];
    orbs = [];
    beams = [];
    enemyProjectiles = [];
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
    shootMode = 'scatter';
    shootCooldown = 0;
    aimAngle = 0;
    barriers = [];
    barrierPlaceMode = false;
    scorePopups = [];
    screenFlashAlpha = 0;
    recentKillTimes = [];
    healOrbs = [];
    keysDown.clear();
    updateModeUI();
    updateBarrierUI();
}

// ============ ENTITIES ============

function getEnemyHP(type, waveNum) {
    const baseHP = {
        swarmling: 1,
        circle: 1,
        triangle: 2,
        diamond: 3,
        dasher: 2,
        shielded: 2,
        spitter: 2,
        sniper: 2,
    };
    let hp = baseHP[type] || 1;
    if (waveNum >= 8 && type === 'circle') hp = 2;
    if (waveNum >= 10 && type === 'diamond') hp = 4;
    if (waveNum >= 12 && type === 'triangle') hp = 3;
    if (waveNum >= 15 && type === 'dasher') hp = 3;
    if (waveNum >= 12 && type === 'spitter') hp = 3;
    if (waveNum >= 15 && type === 'sniper') hp = 3;
    return hp;
}

function spawnEnemy() {
    const diff = DIFF_SETTINGS[difficulty];
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(W, H) * 0.6;
    // Base speed increased ~40% for movement-era balance
    const speed = (56 + Math.random() * 42 + wave * 4.5) * diff.enemySpeedMult;
    const size = 10 + Math.random() * 12;

    // Type weights — balanced progression with new ranged enemies:
    // W1-3: circles + swarmlings, light triangles. Easy scatter targets.
    // W4-6: diamonds + first dashers appear. Beam becomes necessary.
    // W7-9: spitters appear. Player must dodge projectiles.
    // W10-12: snipers appear. Red telegraph lines force constant movement.
    // W13+: Dense mix of everything.
    let type;
    const r = Math.random();
    if (wave <= 3) {
        type = r < 0.45 ? 'circle' : r < 0.75 ? 'swarmling' : 'triangle';
    } else if (wave <= 6) {
        type = r < 0.25 ? 'circle' : r < 0.45 ? 'swarmling' : r < 0.6 ? 'triangle' : r < 0.8 ? 'diamond' : 'dasher';
    } else if (wave <= 9) {
        // Spitters join
        type = r < 0.15 ? 'circle' : r < 0.3 ? 'swarmling' : r < 0.42 ? 'triangle' : r < 0.55 ? 'diamond' : r < 0.7 ? 'dasher' : r < 0.85 ? 'shielded' : 'spitter';
    } else if (wave <= 12) {
        // Snipers join
        type = r < 0.1 ? 'circle' : r < 0.22 ? 'swarmling' : r < 0.34 ? 'triangle' : r < 0.46 ? 'diamond' : r < 0.58 ? 'dasher' : r < 0.7 ? 'shielded' : r < 0.85 ? 'spitter' : 'sniper';
    } else {
        // Late: heavy mix with shooters
        type = r < 0.08 ? 'circle' : r < 0.18 ? 'swarmling' : r < 0.3 ? 'triangle' : r < 0.42 ? 'diamond' : r < 0.55 ? 'dasher' : r < 0.65 ? 'shielded' : r < 0.8 ? 'spitter' : 'sniper';
    }

    const colors = {
        circle: '#ff3366',
        triangle: '#ff9900',
        diamond: '#cc33ff',
        dasher: '#ff5555',
        swarmling: '#ff6699',
        shielded: '#33ccff',
        spitter: '#33ff66',
        sniper: '#ff3333',
    };

    const isDasher = type === 'dasher';
    const isSwarmling = type === 'swarmling';
    const isShielded = type === 'shielded';
    const isSpitter = type === 'spitter';
    const isSniper = type === 'sniper';

    const hp = getEnemyHP(type, wave);

    // Spawn relative to camera view center (edges of visible screen)
    const viewCX = camX + W / 2;
    const viewCY = camY + H / 2;
    let spawnX = viewCX + Math.cos(angle) * dist;
    let spawnY = viewCY + Math.sin(angle) * dist;
    // Clamp to world bounds
    spawnX = Math.max(size + 5, Math.min(WORLD_W - size - 5, spawnX));
    spawnY = Math.max(size + 5, Math.min(WORLD_H - size - 5, spawnY));

    const baseEnemy = {
        x: spawnX,
        y: spawnY,
        vx: 0, vy: 0,
        speed: isDasher ? speed * 0.3 : isSwarmling ? speed * 1.5 : isSpitter ? speed * 0.7 : isSniper ? speed * 0.4 : speed,
        dashSpeed: isDasher ? speed * 3.0 : 0,
        size: isSwarmling ? size * 0.5 : isDasher ? size * 0.8 : isSpitter ? size * 1.1 : isSniper ? size * 0.9 : size,
        type,
        color: colors[type],
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 4,
        hp,
        maxHp: hp,
        flashTimer: 0,
        dashTimer: isDasher ? 1.5 + Math.random() * 0.5 : 0,
        isDashing: false,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: type === 'triangle' ? (Math.random() - 0.5) * 3.5 : 0,
        // Shielded properties
        shieldAngle: isShielded ? Math.random() * Math.PI * 2 : 0,
        shieldRotSpeed: isShielded ? 1.2 + Math.random() * 0.8 : 0,
        // Spitter properties
        shootTimer: isSpitter ? 1.5 + Math.random() * 1.5 : 0,
        shootCooldownBase: isSpitter ? 2.0 + Math.random() * 1.0 : 0,
        isStopped: false,
        stopTimer: 0,
        // Sniper properties
        sniperState: isSniper ? 'approach' : '', // approach, aim, fire, cooldown
        sniperTimer: isSniper ? 0 : 0,
        telegraphAngle: 0,
        preferredDist: isSniper ? 250 + Math.random() * 150 : 0,
    };

    // Swarmlings spawn in groups
    if (isSwarmling) {
        const groupSize = 3 + Math.floor(Math.random() * 3);
        for (let g = 0; g < groupSize; g++) {
            const offsetAngle = angle + (Math.random() - 0.5) * 0.4;
            const offsetDist = dist + (Math.random() - 0.5) * 60;
            enemies.push({
                ...baseEnemy,
                x: Math.max(size + 5, Math.min(WORLD_W - size - 5, viewCX + Math.cos(offsetAngle) * offsetDist)),
                y: Math.max(size + 5, Math.min(WORLD_H - size - 5, viewCY + Math.sin(offsetAngle) * offsetDist)),
                speed: baseEnemy.speed * (0.9 + Math.random() * 0.2),
            });
        }
    } else {
        enemies.push(baseEnemy);
    }
}

function spawnOrb() {
    const angle = Math.random() * Math.PI * 2;
    const d = 100 + Math.random() * Math.min(W, H) * 0.3;
    orbs.push({
        x: Math.max(10, Math.min(WORLD_W - 10, playerX + Math.cos(angle) * d)),
        y: Math.max(10, Math.min(WORLD_H - 10, playerY + Math.sin(angle) * d)),
        size: 8,
        pulse: Math.random() * Math.PI * 2,
        life: 8,
    });
}

function spawnHealOrb() {
    const angle = Math.random() * Math.PI * 2;
    const d = 80 + Math.random() * Math.min(W, H) * 0.3;
    healOrbs.push({
        x: Math.max(10, Math.min(WORLD_W - 10, playerX + Math.cos(angle) * d)),
        y: Math.max(10, Math.min(WORLD_H - 10, playerY + Math.sin(angle) * d)),
        size: 10,
        pulse: Math.random() * Math.PI * 2,
        life: 10,
    });
}

function addScorePopup(x, y, text, color) {
    scorePopups.push({
        x, y,
        text,
        color: color || '#fff',
        life: 1.0,
        maxLife: 1.0,
        vy: -60,
    });
}

function healPlayer() {
    const maxLives = DIFF_SETTINGS[difficulty].lives;
    if (lives < maxLives) {
        lives++;
        sfxHeal();
        for (let i = 0; i < 20; i++) {
            addParticle(playerX, playerY, '#00ff66', 120, 0.5, 4);
        }
        addScorePopup(playerX, playerY - 40, '+1 ♥', '#00ff66');
        screenFlashAlpha = 0.1;
    }
}

function addFragment(x, y, angle, speed, size, color, damage, fragType) {
    const isBeam = fragType === 'beam';
    const life = isBeam ? (1.2 + Math.random() * 0.6) : (1.5 + Math.random() * 0.8);
    fragments.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life,
        maxLife: life,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 10,
        damage: damage || 1,
        fragType: fragType || 'scatter',
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

function addBeam(targetAngle, sizeRatio) {
    const length = Math.max(W, H) * (0.6 + sizeRatio * 0.4);
    const width = 8 + sizeRatio * 20;
    beams.push({
        angle: targetAngle,
        length,
        width,
        life: 0.5,
        maxLife: 0.5,
        sizeRatio,
        damage: Math.floor(2 + sizeRatio * 4),
    });
}

function spawnEnemyProjectile(x, y, angle, speed, damage, projType) {
    enemyProjectiles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed,
        size: projType === 'sniper' ? 4 : 5,
        damage: damage || 1,
        life: projType === 'sniper' ? 2.0 : 4.0,
        maxLife: projType === 'sniper' ? 2.0 : 4.0,
        type: projType || 'spit', // 'spit' or 'sniper'
        trail: [],
    });
}

function shootScatter(targetAngle) {
    if (playerSize <= MIN_SHOOT_SIZE) return;
    if (shootCooldown > 0) return;

    const sizeRatio = (playerSize - MIN_SIZE) / (playerMaxSize - MIN_SIZE);
    const fragmentCount = Math.floor(8 + sizeRatio * 24);
    const fragmentSpeed = 400 + sizeRatio * 600;
    const fragmentSize = 4 + sizeRatio * 8;

    biggestShatter = Math.max(biggestShatter, fragmentCount);
    sfxShatter(playerSize);

    for (let i = 0; i < fragmentCount; i++) {
        const spread = (Math.random() - 0.5) * SCATTER_CONE;
        const a = targetAngle + spread;
        const speed = fragmentSpeed * (0.7 + Math.random() * 0.6);
        const hue = 190 + Math.random() * 40;
        addFragment(playerX, playerY, a, speed, fragmentSize * (0.6 + Math.random() * 0.8), `hsl(${hue}, 100%, 70%)`, 1, 'scatter');
    }

    for (let i = 0; i < 20; i++) {
        const spread = (Math.random() - 0.5) * SCATTER_CONE;
        const a = targetAngle + spread;
        const speed = 100 + Math.random() * 200;
        addParticle(playerX + Math.cos(a) * 10, playerY + Math.sin(a) * 10, '#00c8ff', speed, 0.4, 2);
    }

    shakeDur = 0.1 + sizeRatio * 0.15;
    if (sizeRatio > 0.5) {
        slowMoTimer = 0.15;
        slowMoFactor = 0.3;
    }

    const sizeBonus = Math.floor(sizeRatio * 50);
    score += sizeBonus;
    playerSize = MIN_SIZE;
    shootCooldown = SHOOT_COOLDOWN;
}

function shootBeam(targetAngle) {
    if (playerSize <= MIN_SHOOT_SIZE) return;
    if (shootCooldown > 0) return;

    const sizeRatio = (playerSize - MIN_SIZE) / (playerMaxSize - MIN_SIZE);

    sfxBeam(playerSize);
    addBeam(targetAngle, sizeRatio);

    const fragmentCount = Math.floor(3 + sizeRatio * 8);
    const fragmentSpeed = 600 + sizeRatio * 800;
    for (let i = 0; i < fragmentCount; i++) {
        const spread = (Math.random() - 0.5) * BEAM_CONE * 0.5;
        const a = targetAngle + spread;
        const speed = fragmentSpeed * (0.8 + Math.random() * 0.4);
        const hue = 190 + Math.random() * 30;
        addFragment(playerX, playerY, a, speed, 3 + sizeRatio * 4, `hsl(${hue}, 100%, 85%)`, 1, 'beam');
    }

    for (let i = 0; i < 15; i++) {
        const spread = (Math.random() - 0.5) * BEAM_CONE;
        const a = targetAngle + spread;
        addParticle(playerX + Math.cos(a) * 20, playerY + Math.sin(a) * 20, '#66ddff', 300, 0.3, 2);
    }

    shakeDur = 0.08 + sizeRatio * 0.12;
    if (sizeRatio > 0.5) {
        slowMoTimer = 0.12;
        slowMoFactor = 0.3;
    }

    const sizeBonus = Math.floor(sizeRatio * 50);
    score += sizeBonus;
    playerSize = MIN_SIZE;
    shootCooldown = SHOOT_COOLDOWN;
}

function triggerScreenShake(duration, intensity) {
    shakeDur = duration;
}

// ============ BARRIERS ============
function placeBarrier(worldX, worldY) {
    if (barriers.length >= MAX_BARRIERS) return false;
    if (playerSize < MIN_SIZE + BARRIER_SIZE_COST) return false;

    const angle = Math.atan2(worldY - playerY, worldX - playerX);

    barriers.push({
        x: worldX,
        y: worldY,
        angle: angle + Math.PI / 2,
        width: BARRIER_WIDTH,
        thickness: BARRIER_THICKNESS,
        life: BARRIER_DURATION,
        maxLife: BARRIER_DURATION,
    });

    playerSize -= BARRIER_SIZE_COST;
    sfxBarrierPlace();
    shakeDur = 0.05;
    updateBarrierUI();
    return true;
}

function updateBarrierUI() {
    const el = document.getElementById('hud-barriers');
    if (!el) return;
    const count = barriers ? barriers.length : 0;
    const remaining = MAX_BARRIERS - count;
    el.textContent = remaining;
    const container = document.getElementById('barrier-indicator');
    if (container) {
        container.classList.toggle('barrier-empty', remaining <= 0);
        container.classList.toggle('barrier-placing', barrierPlaceMode);
    }
}

function barrierBlocksPoint(px, py, radius) {
    for (const b of barriers) {
        const hw = b.width / 2;
        const dx = Math.cos(b.angle) * hw;
        const dy = Math.sin(b.angle) * hw;
        const x1 = b.x - dx, y1 = b.y - dy;
        const x2 = b.x + dx, y2 = b.y + dy;

        const segLen2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        if (segLen2 === 0) continue;
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / segLen2;
        t = Math.max(0, Math.min(1, t));
        const closestX = x1 + t * (x2 - x1);
        const closestY = y1 + t * (y2 - y1);
        const dist = Math.hypot(px - closestX, py - closestY);

        if (dist < radius + b.thickness / 2) {
            return b;
        }
    }
    return null;
}

// ============ COLLISION ============
function distFn(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function isShielded(enemy, hitAngle) {
    if (enemy.type !== 'shielded') return false;
    let diff = hitAngle - enemy.shieldAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) < Math.PI / 3;
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

    // Cooldown
    if (shootCooldown > 0) shootCooldown -= dt;

    // Tutorial
    if (!tutorialShown && gameTime < 6) {
        tutorialTimer = 6 - gameTime;
    } else {
        tutorialShown = true;
        tutorialTimer = 0;
    }

    // ---- PLAYER MOVEMENT ----
    let moveX = 0, moveY = 0;
    if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) moveX -= 1;
    if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) moveX += 1;
    if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) moveY -= 1;
    if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) moveY += 1;
    // Normalize diagonal
    const moveMag = Math.hypot(moveX, moveY);
    if (moveMag > 0) {
        moveX /= moveMag;
        moveY /= moveMag;
    }
    // Apply acceleration toward target velocity
    const targetVX = moveX * PLAYER_SPEED;
    const targetVY = moveY * PLAYER_SPEED;
    playerVX += (targetVX - playerVX) * Math.min(1, PLAYER_FRICTION * dt);
    playerVY += (targetVY - playerVY) * Math.min(1, PLAYER_FRICTION * dt);
    playerX += playerVX * dt;
    playerY += playerVY * dt;
    // Clamp to world bounds
    const margin = playerSize + 5;
    playerX = Math.max(margin, Math.min(WORLD_W - margin, playerX));
    playerY = Math.max(margin, Math.min(WORLD_H - margin, playerY));

    // Camera follows player with smooth lerp
    const targetCamX = playerX - W / 2;
    const targetCamY = playerY - H / 2;
    camX += (targetCamX - camX) * Math.min(1, CAM_LERP * dt);
    camY += (targetCamY - camY) * Math.min(1, CAM_LERP * dt);
    // Clamp camera to world
    camX = Math.max(0, Math.min(WORLD_W - W, camX));
    camY = Math.max(0, Math.min(WORLD_H - H, camY));

    // Player grows
    const growRate = (8 + wave * 0.5) * diff.growRate;
    playerSize = Math.min(playerSize + growRate * dt, playerMaxSize);
    playerAngle += dt * 0.5;

    // Score from size
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

        if (waveEnemiesSpawned >= waveEnemies && enemies.length === 0) {
            wave++;
            waveEnemies = Math.floor(5 + wave * 3 + wave * wave * 0.3);
            waveEnemiesSpawned = 0;
            waveTimer = 2;
            sfxWave();
            for (let i = 0; i < 2 + Math.floor(wave / 3); i++) spawnOrb();
            if (wave >= 5 && lives < DIFF_SETTINGS[difficulty].lives) {
                spawnHealOrb();
            }
        }
    }

    // Random orb spawns
    if (Math.random() < 0.005 * dt * 60) spawnOrb();

    // Heal orb spawns
    const healOrbChance = wave >= 7 ? 0.0015 : 0.0008;
    if (Math.random() < healOrbChance * dt * 60 && lives < DIFF_SETTINGS[difficulty].lives) {
        spawnHealOrb();
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const angle = Math.atan2(playerY - e.y, playerX - e.x);
        const distToPlayer = distFn(e.x, e.y, playerX, playerY);

        if (e.type === 'dasher') {
            if (!e.isDashing) {
                e.dashTimer -= dt;
                if (e.dashTimer <= 0) {
                    e.isDashing = true;
                    e.dashTimer = 0.35;
                }
                e.vx = Math.cos(angle) * e.speed;
                e.vy = Math.sin(angle) * e.speed;
            } else {
                e.dashTimer -= dt;
                if (e.dashTimer <= 0) {
                    e.isDashing = false;
                    e.dashTimer = 1.0 + Math.random() * 0.5;
                }
                e.vx = Math.cos(angle) * e.dashSpeed;
                e.vy = Math.sin(angle) * e.dashSpeed;
            }
        } else if (e.type === 'triangle') {
            e.orbitAngle += e.orbitSpeed * dt;
            const perpAngle = angle + Math.PI / 2;
            const orbitStr = Math.min(1, distToPlayer / 200) * 0.5;
            e.vx = Math.cos(angle) * e.speed + Math.cos(perpAngle) * e.speed * orbitStr * Math.sin(e.orbitAngle);
            e.vy = Math.sin(angle) * e.speed + Math.sin(perpAngle) * e.speed * orbitStr * Math.sin(e.orbitAngle);
        } else if (e.type === 'spitter') {
            // Spitter: approaches to medium range, stops to fire, then moves again
            e.shootTimer -= dt;
            if (e.isStopped) {
                e.stopTimer -= dt;
                e.vx *= 0.9; // friction while stopped
                e.vy *= 0.9;
                if (e.stopTimer <= 0) {
                    // Fire projectile
                    const projAngle = Math.atan2(playerY - e.y, playerX - e.x);
                    spawnEnemyProjectile(e.x, e.y, projAngle, 160 + wave * 5, 1, 'spit');
                    sfxSpit();
                    for (let k = 0; k < 4; k++) {
                        addParticle(e.x, e.y, '#33ff66', 60, 0.2, 2);
                    }
                    e.isStopped = false;
                    e.shootTimer = e.shootCooldownBase;
                }
            } else if (e.shootTimer <= 0 && distToPlayer < 400 && distToPlayer > 60) {
                // Stop to aim
                e.isStopped = true;
                e.stopTimer = 0.4; // brief pause before firing
            } else {
                // Move toward player but keep medium distance
                if (distToPlayer > 180) {
                    e.vx = Math.cos(angle) * e.speed;
                    e.vy = Math.sin(angle) * e.speed;
                } else if (distToPlayer < 120) {
                    // Back away slightly
                    e.vx = Math.cos(angle) * e.speed * -0.4;
                    e.vy = Math.sin(angle) * e.speed * -0.4;
                } else {
                    // Strafe
                    const perpAngle = angle + Math.PI / 2;
                    e.vx = Math.cos(perpAngle) * e.speed * 0.5;
                    e.vy = Math.sin(perpAngle) * e.speed * 0.5;
                }
            }
        } else if (e.type === 'sniper') {
            // Sniper: stays at long range, telegraphs then fires
            if (e.sniperState === 'approach') {
                // Move to preferred distance
                if (distToPlayer > e.preferredDist + 50) {
                    e.vx = Math.cos(angle) * e.speed;
                    e.vy = Math.sin(angle) * e.speed;
                } else if (distToPlayer < e.preferredDist - 50) {
                    e.vx = Math.cos(angle) * e.speed * -0.5;
                    e.vy = Math.sin(angle) * e.speed * -0.5;
                } else {
                    // Strafe at range
                    const perpAngle = angle + Math.PI / 2;
                    e.vx = Math.cos(perpAngle) * e.speed * 0.6;
                    e.vy = Math.sin(perpAngle) * e.speed * 0.6;
                }
                e.sniperTimer -= dt;
                if (e.sniperTimer <= 0) {
                    e.sniperState = 'aim';
                    e.sniperTimer = 0.5; // telegraph duration
                    e.telegraphAngle = Math.atan2(playerY - e.y, playerX - e.x);
                    sfxSniperCharge();
                }
            } else if (e.sniperState === 'aim') {
                // Mostly stationary during aim, slight tracking
                e.vx *= 0.85;
                e.vy *= 0.85;
                // Slowly track player during telegraph
                e.telegraphAngle += (Math.atan2(playerY - e.y, playerX - e.x) - e.telegraphAngle) * 0.3 * dt;
                e.sniperTimer -= dt;
                if (e.sniperTimer <= 0) {
                    // Fire!
                    spawnEnemyProjectile(e.x, e.y, e.telegraphAngle, 450 + wave * 8, 1, 'sniper');
                    sfxSniperFire();
                    for (let k = 0; k < 6; k++) {
                        addParticle(e.x, e.y, '#ff3333', 80, 0.2, 2);
                    }
                    e.sniperState = 'cooldown';
                    e.sniperTimer = 2.5 + Math.random() * 1.5;
                }
            } else if (e.sniperState === 'cooldown') {
                // Strafe during cooldown
                const perpAngle = angle + Math.PI / 2;
                e.vx = Math.cos(perpAngle) * e.speed * 0.7;
                e.vy = Math.sin(perpAngle) * e.speed * 0.7;
                e.sniperTimer -= dt;
                if (e.sniperTimer <= 0) {
                    e.sniperState = 'approach';
                    e.sniperTimer = 1.0 + Math.random() * 0.5;
                }
            }
        } else {
            e.vx = Math.cos(angle) * e.speed;
            e.vy = Math.sin(angle) * e.speed;
        }

        // Barrier collision
        const nextX = e.x + e.vx * dt;
        const nextY = e.y + e.vy * dt;
        const hitBarrier = barrierBlocksPoint(nextX, nextY, e.size);
        if (hitBarrier) {
            const bcos = Math.cos(hitBarrier.angle);
            const bsin = Math.sin(hitBarrier.angle);
            const cross = (nextX - hitBarrier.x) * bsin - (nextY - hitBarrier.y) * bcos;
            const pushDir = cross > 0 ? 1 : -1;
            const dot = e.vx * bcos + e.vy * bsin;
            e.vx = bcos * dot + (-bsin) * e.speed * 0.5 * pushDir;
            e.vy = bsin * dot + bcos * e.speed * 0.5 * pushDir;
        }

        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.angle += e.spinSpeed * dt;
        if (e.flashTimer > 0) e.flashTimer -= dt;

        if (e.type === 'shielded') {
            e.shieldAngle += e.shieldRotSpeed * dt;
        }

        // Hit player
        const d = distFn(e.x, e.y, playerX, playerY);
        if (d < playerSize + e.size) {
            enemies.splice(i, 1);
            lives--;
            sfxHit();
            shakeDur = 0.3;

            for (let j = 0; j < 15; j++) {
                addParticle(playerX, playerY, '#ff3366', 200, 0.5, 4);
            }

            if (lives <= 0) {
                gameOver();
                return;
            }
            continue;
        }
    }

    // Update beams - check collisions with enemies
    for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.life -= dt;
        if (b.life <= 0) {
            beams.splice(i, 1);
            continue;
        }

        const bx = Math.cos(b.angle);
        const by = Math.sin(b.angle);
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = e.x - playerX;
            const dy = e.y - playerY;
            const proj = dx * bx + dy * by;
            if (proj < 0 || proj > b.length) continue;
            const perpDist = Math.abs(dx * (-by) + dy * bx);
            if (perpDist < e.size + b.width * 0.5) {
                const hitAngle = Math.atan2(playerY - e.y, playerX - e.x);
                if (isShielded(e, hitAngle + Math.PI)) {
                    sfxShieldBlock();
                    for (let k = 0; k < 4; k++) {
                        addParticle(e.x + Math.cos(e.shieldAngle) * e.size, e.y + Math.sin(e.shieldAngle) * e.size, '#66ddff', 100, 0.2, 2);
                    }
                    continue;
                }
                e.hp -= b.damage;
                e.flashTimer = 0.15;
                if (e.hp <= 0) {
                    killEnemy(e, j);
                }
            }
        }

        // Beam also destroys enemy projectiles
        for (let j = enemyProjectiles.length - 1; j >= 0; j--) {
            const p = enemyProjectiles[j];
            const dx = p.x - playerX;
            const dy = p.y - playerY;
            const proj = dx * bx + dy * by;
            if (proj < 0 || proj > b.length) continue;
            const perpDist = Math.abs(dx * (-by) + dy * bx);
            if (perpDist < p.size + b.width * 0.5) {
                for (let k = 0; k < 4; k++) addParticle(p.x, p.y, '#ffaa00', 60, 0.2, 2);
                enemyProjectiles.splice(j, 1);
            }
        }
    }

    // Update fragments - check collisions with enemies AND enemy projectiles
    for (let i = fragments.length - 1; i >= 0; i--) {
        const f = fragments[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        const drag = f.fragType === 'beam' ? 0.995 : 0.99;
        f.vx *= drag;
        f.vy *= drag;
        f.life -= dt;
        f.angle += f.spin * dt;

        if (f.life <= 0) {
            fragments.splice(i, 1);
            continue;
        }

        // Fragment vs enemy projectile
        for (let j = enemyProjectiles.length - 1; j >= 0; j--) {
            const p = enemyProjectiles[j];
            if (distFn(f.x, f.y, p.x, p.y) < f.size + p.size) {
                for (let k = 0; k < 3; k++) addParticle(p.x, p.y, '#ffaa00', 50, 0.15, 2);
                enemyProjectiles.splice(j, 1);
                // Fragment continues (doesn't die from hitting a projectile)
                break;
            }
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (distFn(f.x, f.y, e.x, e.y) < f.size + e.size) {
                const hitAngle = Math.atan2(f.y - e.y, f.x - e.x);
                if (isShielded(e, hitAngle)) {
                    sfxShieldBlock();
                    for (let k = 0; k < 3; k++) {
                        addParticle(f.x, f.y, '#66ddff', 80, 0.15, 2);
                    }
                    f.life = 0;
                    break;
                }

                e.hp -= (f.damage || 1);
                e.flashTimer = 0.1;

                if (e.hp <= 0) {
                    killEnemy(e, j);
                }

                f.life = 0;
                break;
            }
        }
    }

    // Update enemy projectiles
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        // Trail
        p.trail.push({ x: p.x, y: p.y, life: 0.3 });
        if (p.trail.length > 12) p.trail.shift();
        for (let t = p.trail.length - 1; t >= 0; t--) {
            p.trail[t].life -= dt;
            if (p.trail[t].life <= 0) p.trail.splice(t, 1);
        }

        // Off-world or expired
        if (p.life <= 0 || p.x < -50 || p.x > WORLD_W + 50 || p.y < -50 || p.y > WORLD_H + 50) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        // Hit barrier
        const hitBarrier = barrierBlocksPoint(p.x, p.y, p.size);
        if (hitBarrier) {
            for (let k = 0; k < 5; k++) addParticle(p.x, p.y, '#00ffcc', 80, 0.2, 2);
            enemyProjectiles.splice(i, 1);
            continue;
        }

        // Hit player
        if (distFn(p.x, p.y, playerX, playerY) < playerSize + p.size) {
            lives -= p.damage;
            sfxHit();
            shakeDur = 0.2;
            for (let j = 0; j < 10; j++) {
                addParticle(playerX, playerY, '#ff3366', 150, 0.4, 3);
            }
            enemyProjectiles.splice(i, 1);
            if (lives <= 0) {
                gameOver();
                return;
            }
            continue;
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

        if (distFn(o.x, o.y, playerX, playerY) < playerSize + o.size + 5) {
            playerSize = Math.min(playerSize + 15, playerMaxSize);
            score += 50;
            sfxOrb();
            for (let j = 0; j < 6; j++) {
                addParticle(o.x, o.y, '#00ffaa', 100, 0.3, 3);
            }
            orbs.splice(i, 1);
        }
    }

    // Update barriers
    for (let i = barriers.length - 1; i >= 0; i--) {
        const b = barriers[i];
        b.life -= dt;
        if (b.life <= 0) {
            for (let j = 0; j < 8; j++) {
                addParticle(b.x, b.y, '#00ffcc', 80, 0.4, 3);
            }
            sfxBarrierExpire();
            barriers.splice(i, 1);
            updateBarrierUI();
        }
    }

    // Update heal orbs
    for (let i = healOrbs.length - 1; i >= 0; i--) {
        const o = healOrbs[i];
        o.pulse += dt * 3;
        o.life -= dt;
        if (o.life <= 0) { healOrbs.splice(i, 1); continue; }
        if (distFn(o.x, o.y, playerX, playerY) < playerSize + o.size + 5) {
            healPlayer();
            healOrbs.splice(i, 1);
        }
    }

    // Update score popups
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const p = scorePopups[i];
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) scorePopups.splice(i, 1);
    }

    // Screen flash decay
    if (screenFlashAlpha > 0) {
        screenFlashAlpha -= dt * 2;
        if (screenFlashAlpha < 0) screenFlashAlpha = 0;
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

    updateHUD();
}

function killEnemy(e, index) {
    const isTanky = e.type === 'diamond' || e.type === 'shielded';
    const particleCount = isTanky ? 20 : 14;
    const particleSpeed = isTanky ? 250 : 180;
    for (let k = 0; k < particleCount; k++) {
        const hue = parseInt(e.color.match(/\d+/)?.[0] || '0');
        const pColor = `hsl(${hue + Math.random() * 40 - 20}, 100%, ${60 + Math.random() * 30}%)`;
        addParticle(e.x, e.y, k % 3 === 0 ? '#fff' : (k % 3 === 1 ? pColor : e.color),
            particleSpeed * (0.5 + Math.random()), 0.3 + Math.random() * 0.3, 2 + Math.random() * 4);
    }

    enemies.splice(index, 1);
    enemiesKilled++;

    comboCount++;
    comboTimer = COMBO_WINDOW;
    comboMultiplier = 1 + Math.floor(comboCount / 3) * 0.5;
    bestCombo = Math.max(bestCombo, comboCount);

    const killScore = Math.floor((25 + wave * 5) * comboMultiplier);
    score += killScore;
    sfxKill(comboCount, e.type);

    const popupText = comboMultiplier > 1 ? `+${killScore} x${comboMultiplier.toFixed(1)}` : `+${killScore}`;
    const popupColor = comboMultiplier >= 2 ? '#ffdd00' : comboMultiplier > 1 ? '#00ddff' : '#ffffff';
    addScorePopup(e.x, e.y, popupText, popupColor);

    const chainChance = 0.15 + Math.min(comboCount * 0.02, 0.25);
    if (Math.random() < chainChance) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const nearby = enemies[j];
            if (distFn(e.x, e.y, nearby.x, nearby.y) < 50 + e.size) {
                nearby.hp -= 1;
                nearby.flashTimer = 0.15;
                sfxChainExplosion();
                for (let k = 0; k < 5; k++) {
                    addParticle(nearby.x, nearby.y, '#ffaa00', 100, 0.2, 3);
                }
                if (nearby.hp <= 0) {
                    killEnemy(nearby, j);
                }
            }
        }
    }

    const now = performance.now();
    recentKillTimes.push(now);
    recentKillTimes = recentKillTimes.filter(t => now - t < 500);
    if (recentKillTimes.length >= 3) {
        screenFlashAlpha = 0.25;
    }

    if (comboCount > 0 && comboCount % 10 === 0) {
        healPlayer();
    }
}

// ============ RENDER ============
function drawPlayer() {
    const x = playerX;
    const y = playerY;
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

    // Main hexagon
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

    const fillGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
    fillGrad.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.9)`);
    fillGrad.addColorStop(0.6, `hsla(${hue}, 100%, 55%, 0.7)`);
    fillGrad.addColorStop(1, `hsla(${hue}, 80%, 40%, 0.5)`);
    ctx.fillStyle = fillGrad;
    ctx.fill();

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

    if (state === 'playing') {
        drawAimIndicator(x, y, s);
    }
}

function drawAimIndicator(px, py, size) {
    const canShoot = playerSize > MIN_SHOOT_SIZE && shootCooldown <= 0;
    const alpha = canShoot ? 0.5 + Math.sin(gameTime * 4) * 0.2 : 0.15;
    const cone = shootMode === 'beam' ? BEAM_CONE : SCATTER_CONE;
    const indicatorDist = size + 15;
    const indicatorLen = shootMode === 'beam' ? 80 : 50;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(aimAngle);
    ctx.globalAlpha = alpha;

    if (shootMode === 'beam') {
        ctx.strokeStyle = '#66ddff';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(indicatorDist, 0);
        ctx.lineTo(indicatorDist + indicatorLen, 0);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(indicatorDist, 0);
        ctx.lineTo(indicatorDist + indicatorLen, Math.tan(cone / 2) * indicatorLen);
        ctx.moveTo(indicatorDist, 0);
        ctx.lineTo(indicatorDist + indicatorLen, -Math.tan(cone / 2) * indicatorLen);
        ctx.stroke();
    } else {
        ctx.strokeStyle = '#00c8ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(indicatorDist, 0);
        ctx.arc(0, 0, indicatorDist + indicatorLen, -cone / 2, cone / 2, false);
        ctx.lineTo(indicatorDist, 0);
        ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
}

function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
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
        ctx.shadowColor = e.color;
        ctx.shadowBlur = e.isDashing ? 15 : 0;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a1 = (Math.PI * 2 * i / 5) - Math.PI / 2;
            const a2 = a1 + Math.PI / 5;
            ctx.lineTo(Math.cos(a1) * e.size, Math.sin(a1) * e.size);
            ctx.lineTo(Math.cos(a2) * e.size * 0.4, Math.sin(a2) * e.size * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    } else if (e.type === 'swarmling') {
        ctx.beginPath();
        ctx.arc(0, 0, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#ffaacc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 1.3, 0, Math.PI * 2);
        ctx.stroke();
    } else if (e.type === 'shielded') {
        ctx.beginPath();
        ctx.arc(0, 0, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(e.x, e.y);
        const shieldDist = e.size + 4;
        const shieldArc = Math.PI / 3 * 2;
        ctx.strokeStyle = e.flashTimer > 0 ? '#fff' : '#00eeff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00eeff';
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, shieldDist, e.shieldAngle - shieldArc / 2, e.shieldAngle + shieldArc / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    } else if (e.type === 'spitter') {
        // Pentagon shape, toxic green
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 * i / 5) - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(a) * e.size, Math.sin(a) * e.size);
            else ctx.lineTo(Math.cos(a) * e.size, Math.sin(a) * e.size);
        }
        ctx.closePath();
        ctx.fill();
        // Inner glow when about to fire
        if (e.isStopped) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#88ff88';
            ctx.beginPath();
            ctx.arc(0, 0, e.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (e.type === 'sniper') {
        // Thin diamond/arrow shape, red
        ctx.beginPath();
        ctx.moveTo(0, -e.size * 1.2);
        ctx.lineTo(e.size * 0.5, 0);
        ctx.lineTo(0, e.size * 0.4);
        ctx.lineTo(-e.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        // Scope dot
        ctx.fillStyle = '#ff0000';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, -e.size * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Draw sniper telegraph line
    if (e.type === 'sniper' && e.sniperState === 'aim') {
        ctx.save();
        const telegraphAlpha = 0.3 + Math.sin(gameTime * 20) * 0.2;
        ctx.globalAlpha = telegraphAlpha;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        const len = Math.max(W, H);
        ctx.lineTo(e.x + Math.cos(e.telegraphAngle) * len, e.y + Math.sin(e.telegraphAngle) * len);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // Draw HP bar above enemy (only if maxHp > 1)
    if (e.maxHp > 1 && e.hp > 0) {
        drawHPBar(e);
    }
}

function drawHPBar(e) {
    const barWidth = e.size * 2;
    const barHeight = 3;
    const barY = e.y - e.size - 8;
    const barX = e.x - barWidth / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const ratio = e.hp / e.maxHp;
    const hpColor = ratio > 0.5 ? '#00ff66' : ratio > 0.25 ? '#ffcc00' : '#ff3333';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
}

function drawEnemyProjectile(p) {
    const alpha = Math.min(p.life / 0.5, 1);
    ctx.save();
    ctx.globalAlpha = alpha;

    // Draw trail
    for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const ta = (t.life / 0.3) * 0.4;
        ctx.globalAlpha = ta * alpha;
        ctx.fillStyle = p.type === 'sniper' ? '#ff4444' : '#44ff44';
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw projectile
    ctx.globalAlpha = alpha;
    const color = p.type === 'sniper' ? '#ff2222' : '#33ff66';
    const glowColor = p.type === 'sniper' ? '#ff0000' : '#00ff44';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    // Bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
}

function drawFragment(f) {
    const alpha = f.life / f.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    ctx.fillStyle = f.color;

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

function drawBeam(b) {
    const alpha = b.life / b.maxLife;
    ctx.save();
    ctx.translate(playerX, playerY);
    ctx.rotate(b.angle);
    ctx.globalAlpha = alpha;

    const grad = ctx.createLinearGradient(0, 0, b.length, 0);
    grad.addColorStop(0, `rgba(100, 220, 255, ${0.9 * alpha})`);
    grad.addColorStop(0.3, `rgba(150, 240, 255, ${0.7 * alpha})`);
    grad.addColorStop(1, `rgba(100, 220, 255, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -b.width * 0.3);
    ctx.lineTo(b.length, -b.width * 0.1);
    ctx.lineTo(b.length, b.width * 0.1);
    ctx.lineTo(0, b.width * 0.3);
    ctx.closePath();
    ctx.fill();

    const coreGrad = ctx.createLinearGradient(0, 0, b.length * 0.8, 0);
    coreGrad.addColorStop(0, `rgba(220, 250, 255, ${0.8 * alpha})`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(0, -b.width * 0.1);
    ctx.lineTo(b.length * 0.8, -1);
    ctx.lineTo(b.length * 0.8, 1);
    ctx.lineTo(0, b.width * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = '#66ddff';
    ctx.shadowBlur = 20 * alpha;
    ctx.strokeStyle = `rgba(100, 220, 255, ${0.5 * alpha})`;
    ctx.lineWidth = b.width * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(b.length * 0.7, 0);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
}

function drawParticle(p) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawOrb(o) {
    const alpha = o.life < 2 ? o.life / 2 : 1;
    const pulse = 1 + Math.sin(o.pulse) * 0.2;
    const r = o.size * pulse;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(o.x, o.y);

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3);
    glow.addColorStop(0, 'rgba(0, 255, 170, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ffaa';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawHealOrb(o) {
    const alpha = o.life < 2 ? o.life / 2 : 1;
    const pulse = 1 + Math.sin(o.pulse) * 0.25;
    const r = o.size * pulse;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(o.x, o.y);

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3);
    glow.addColorStop(0, 'rgba(0, 255, 80, 0.5)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ff55';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-r * 0.5, -r * 0.15, r, r * 0.3);
    ctx.fillRect(-r * 0.15, -r * 0.5, r * 0.3, r);

    ctx.restore();
}

function drawScorePopup(p) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.font = `bold ${14 * devicePixelRatio}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
}

function drawBarrier(b) {
    const alpha = Math.min(b.life / 1.5, 1);
    const hw = b.width / 2;
    const dx = Math.cos(b.angle) * hw;
    const dy = Math.sin(b.angle) * hw;

    ctx.save();
    ctx.globalAlpha = alpha * 0.9;

    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 15 * alpha;

    ctx.strokeStyle = `rgba(0, 255, 200, ${0.8 * alpha})`;
    ctx.lineWidth = b.thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x - dx, b.y - dy);
    ctx.lineTo(b.x + dx, b.y + dy);
    ctx.stroke();

    ctx.strokeStyle = `rgba(150, 255, 230, ${0.6 * alpha})`;
    ctx.lineWidth = b.thickness * 0.4;
    ctx.beginPath();
    ctx.moveTo(b.x - dx, b.y - dy);
    ctx.lineTo(b.x + dx, b.y + dy);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(0, 255, 200, ${alpha})`;
    for (const sign of [-1, 1]) {
        const ex = b.x + dx * sign;
        const ey = b.y + dy * sign;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = Math.PI * 2 * i / 6;
            const r = 6;
            if (i === 0) ctx.moveTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
            else ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
    }

    if (b.life < 3) {
        const flashRate = b.life < 1 ? 10 : 4;
        const flashAlpha = 0.3 + Math.sin(gameTime * flashRate) * 0.3;
        ctx.fillStyle = `rgba(255, 100, 100, ${flashAlpha})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawBackground() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);
}

function drawWorldGrid() {
    // Draw grid in world space (called inside camera transform)
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    // Only draw visible grid lines
    const startX = Math.floor(camX / gridSize) * gridSize;
    const startY = Math.floor(camY / gridSize) * gridSize;
    for (let x = startX; x < camX + W + gridSize; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, camY); ctx.lineTo(x, camY + H); ctx.stroke();
    }
    for (let y = startY; y < camY + H + gridSize; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(camX, y); ctx.lineTo(camX + W, y); ctx.stroke();
    }
}

function drawWorldBoundary() {
    // Draw world border in world space
    const borderWidth = 4;
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, WORLD_W - borderWidth, WORLD_H - borderWidth);

    // Edge glow when player is near boundary
    const edgeDist = 150;
    const glowAlpha = 0.4;
    // Left
    if (playerX < edgeDist) {
        const a = glowAlpha * (1 - playerX / edgeDist);
        const g = ctx.createLinearGradient(0, camY, edgeDist, camY);
        g.addColorStop(0, `rgba(0, 200, 255, ${a})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, camY, edgeDist, H);
    }
    // Right
    if (playerX > WORLD_W - edgeDist) {
        const a = glowAlpha * (1 - (WORLD_W - playerX) / edgeDist);
        const g = ctx.createLinearGradient(WORLD_W, camY, WORLD_W - edgeDist, camY);
        g.addColorStop(0, `rgba(0, 200, 255, ${a})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(WORLD_W - edgeDist, camY, edgeDist, H);
    }
    // Top
    if (playerY < edgeDist) {
        const a = glowAlpha * (1 - playerY / edgeDist);
        const g = ctx.createLinearGradient(camX, 0, camX, edgeDist);
        g.addColorStop(0, `rgba(0, 200, 255, ${a})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(camX, 0, W, edgeDist);
    }
    // Bottom
    if (playerY > WORLD_H - edgeDist) {
        const a = glowAlpha * (1 - (WORLD_H - playerY) / edgeDist);
        const g = ctx.createLinearGradient(camX, WORLD_H, camX, WORLD_H - edgeDist);
        g.addColorStop(0, `rgba(0, 200, 255, ${a})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(camX, WORLD_H - edgeDist, W, edgeDist);
    }
}

function drawMinimap() {
    const mmW = 120;
    const mmH = 120;
    const mmX = W - mmW - 10;
    const mmY = 10;
    const scaleX = mmW / WORLD_W;
    const scaleY = mmH / WORLD_H;

    ctx.save();
    // Draw in screen space (no camera transform)
    ctx.fillStyle = 'rgba(0, 0, 20, 0.6)';
    ctx.fillRect(mmX, mmY, mmW, mmH);
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // Camera viewport
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(mmX + camX * scaleX, mmY + camY * scaleY, W * scaleX, H * scaleY);

    // Enemies
    ctx.fillStyle = '#ff3366';
    for (const e of enemies) {
        ctx.fillRect(mmX + e.x * scaleX - 1, mmY + e.y * scaleY - 1, 2, 2);
    }

    // Orbs
    ctx.fillStyle = '#00ffaa';
    for (const o of orbs) {
        ctx.fillRect(mmX + o.x * scaleX - 1, mmY + o.y * scaleY - 1, 2, 2);
    }

    // Player
    ctx.fillStyle = '#00c8ff';
    ctx.beginPath();
    ctx.arc(mmX + playerX * scaleX, mmY + playerY * scaleY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawOverlayEffects() {
    // Vignette (screen space)
    const vig = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.2, cx, cy, Math.max(W, H) * 0.7);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

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
    if (tutorialTimer > 0 && gameTime < 6) {
        ctx.save();
        ctx.globalAlpha = Math.min(tutorialTimer / 2, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `${16 * devicePixelRatio}px Rajdhani, sans-serif`;
        ctx.textAlign = 'center';
        const isMobile = 'ontouchstart' in window;
        const line1 = isMobile ? 'TAP a direction to SHOOT!' : 'WASD to MOVE — CLICK to SHOOT!';
        const line2 = isMobile ? 'Tap MODE button to switch Scatter/Beam' : 'Press Q to switch Scatter/Beam mode';
        ctx.fillText(line1, playerX, playerY + playerSize + 40 * devicePixelRatio);
        ctx.fillText(line2, playerX, playerY + playerSize + 60 * devicePixelRatio);

        const ringSize = playerSize + 20 + Math.sin(gameTime * 4) * 10;
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.3 + Math.sin(gameTime * 4) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(playerX, playerY, ringSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }
}

function render() {
    drawBackground();

    if (state === 'playing' || state === 'gameover') {
        // World-space rendering with camera offset
        ctx.save();
        ctx.translate(-camX + shakeX, -camY + shakeY);

        drawWorldGrid();
        drawWorldBoundary();
        orbs.forEach(drawOrb);
        healOrbs.forEach(drawHealOrb);
        barriers.forEach(drawBarrier);
        enemies.forEach(drawEnemy);
        if (enemyProjectiles) enemyProjectiles.forEach(drawEnemyProjectile);
        beams.forEach(drawBeam);
        fragments.forEach(drawFragment);
        particles.forEach(drawParticle);
        scorePopups.forEach(drawScorePopup);

        if (state === 'playing') {
            drawPlayer();
            drawTutorial();

            // Barrier placement preview
            if (barrierPlaceMode) {
                const previewDist = playerSize + 60;
                const px = playerX + Math.cos(aimAngle) * previewDist;
                const py = playerY + Math.sin(aimAngle) * previewDist;
                const perpAngle = aimAngle + Math.PI / 2;
                const hw = BARRIER_WIDTH / 2;
                ctx.save();
                ctx.globalAlpha = 0.4 + Math.sin(gameTime * 5) * 0.15;
                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = BARRIER_THICKNESS;
                ctx.lineCap = 'round';
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.moveTo(px - Math.cos(perpAngle) * hw, py - Math.sin(perpAngle) * hw);
                ctx.lineTo(px + Math.cos(perpAngle) * hw, py + Math.sin(perpAngle) * hw);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }

        ctx.restore();
        // End world-space rendering

        // Screen-space overlays
        drawOverlayEffects();

        // Screen flash overlay
        if (screenFlashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = screenFlashAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }

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

        if (state === 'playing') {
            drawMinimap();
        }
    }

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

    const sizeRatio = (playerSize - MIN_SIZE) / (playerMaxSize - MIN_SIZE);
    const sizeBar = document.getElementById('size-bar');
    sizeBar.style.width = (sizeRatio * 100) + '%';
    sizeBar.classList.toggle('full', sizeRatio > 0.85);

    const comboEl = document.getElementById('hud-combo');
    if (comboCount >= 3 && comboTimer > 0) {
        comboEl.classList.remove('hidden');
        document.getElementById('hud-combo-val').textContent = `x${comboMultiplier.toFixed(1)}`;
    } else {
        comboEl.classList.add('hidden');
    }

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

    const canShoot = playerSize > MIN_SHOOT_SIZE && shootCooldown <= 0;
    sizeBar.classList.toggle('ready', canShoot && sizeRatio > 0.3);
}

function updateModeUI() {
    const btn = document.getElementById('btn-mode');
    if (!btn) return;
    if (shootMode === 'beam') {
        btn.textContent = '⟐ BEAM';
        btn.classList.add('mode-beam');
        btn.classList.remove('mode-scatter');
    } else {
        btn.textContent = '⁂ SCATTER';
        btn.classList.remove('mode-beam');
        btn.classList.add('mode-scatter');
    }
}

function toggleMode() {
    shootMode = shootMode === 'scatter' ? 'beam' : 'scatter';
    updateModeUI();
    sfxModeSwitch();
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
function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = (clientX - rect.left) * devicePixelRatio;
    const sy = (clientY - rect.top) * devicePixelRatio;
    return { x: sx + camX, y: sy + camY };
}

function getAimAngle(clientX, clientY) {
    const w = screenToWorld(clientX, clientY);
    return Math.atan2(w.y - playerY, w.x - playerX);
}

function handleShoot(e) {
    if (e) e.preventDefault();
    if (state !== 'playing') return;
    initAudio();

    let angle = aimAngle;
    if (e) {
        if (e.touches && e.touches.length > 0) {
            angle = getAimAngle(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            angle = getAimAngle(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        } else if (e.clientX !== undefined) {
            angle = getAimAngle(e.clientX, e.clientY);
        }
    }

    if (shootMode === 'beam') {
        shootBeam(angle);
    } else {
        shootScatter(angle);
    }
    tutorialShown = true;
}

// Track mouse/touch position for aim indicator
canvas.addEventListener('mousemove', e => {
    if (state === 'playing') {
        aimAngle = getAimAngle(e.clientX, e.clientY);
    }
});

canvas.addEventListener('touchmove', e => {
    if (state === 'playing' && e.touches.length > 0) {
        aimAngle = getAimAngle(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) return;
    if (barrierPlaceMode && state === 'playing') {
        e.preventDefault();
        const wc = screenToWorld(e.clientX, e.clientY);
        placeBarrier(wc.x, wc.y);
        barrierPlaceMode = false;
        updateBarrierUI();
        return;
    }
    handleShoot(e);
});

// Right-click to place barrier directly
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (state !== 'playing') return;
    const wc = screenToWorld(e.clientX, e.clientY);
    placeBarrier(wc.x, wc.y);
});

// Mobile: long-press to place barrier
let longPressTimer = null;
let longPressTriggered = false;
canvas.addEventListener('touchstart', (e) => {
    longPressTriggered = false;
    if (state === 'playing' && e.touches.length === 1) {
        const touch = e.touches[0];
        longPressTimer = setTimeout(() => {
            longPressTriggered = true;
            const wc = screenToWorld(touch.clientX, touch.clientY);
            placeBarrier(wc.x, wc.y);
        }, 400);
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    if (longPressTriggered) { longPressTriggered = false; return; }
    if (barrierPlaceMode && state === 'playing' && e.changedTouches.length > 0) {
        const wc = screenToWorld(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        placeBarrier(wc.x, wc.y);
        barrierPlaceMode = false;
        updateBarrierUI();
        return;
    }
    handleShoot(e);
}, { passive: false });

canvas.addEventListener('touchmove', () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
}, { passive: true });

// Keyboard — movement keys tracked via keysDown set
document.addEventListener('keydown', e => {
    keysDown.add(e.code);

    if (e.code === 'Space' || e.code === 'Enter') {
        if (state === 'playing') handleShoot();
        else if (state === 'menu') startGame();
    }
    if (e.code === 'KeyQ' && state === 'playing') {
        toggleMode();
    }
    // W key: only toggle barrier mode if NOT currently moving (i.e. not WASD movement)
    // We use a dedicated key for barriers now: E key or the HUD button
    // But keep W for barrier if player is not pressing other movement keys — actually
    // W is now movement. Use E for barriers via keyboard.
    if (e.code === 'KeyE' && state === 'playing') {
        barrierPlaceMode = !barrierPlaceMode;
        updateBarrierUI();
    }
});

document.addEventListener('keyup', e => {
    keysDown.delete(e.code);
});

// UI buttons
document.getElementById('btn-play').addEventListener('click', () => { initAudio(); startGame(); });
document.getElementById('btn-retry').addEventListener('click', () => { initAudio(); startGame(); });
document.getElementById('btn-how').addEventListener('click', () => showScreen('how-screen'));
document.getElementById('btn-back').addEventListener('click', () => showScreen('menu-screen'));

// Mode toggle button
const modeBtn = document.getElementById('btn-mode');
if (modeBtn) {
    modeBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (state === 'playing') toggleMode();
    });
    modeBtn.addEventListener('touchstart', e => {
        e.stopPropagation();
        e.preventDefault();
        if (state === 'playing') toggleMode();
    }, { passive: false });
}

// Barrier indicator click
const barrierBtn = document.getElementById('barrier-indicator');
if (barrierBtn) {
    barrierBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (state === 'playing') {
            barrierPlaceMode = !barrierPlaceMode;
            updateBarrierUI();
        }
    });
    barrierBtn.addEventListener('touchstart', e => {
        e.stopPropagation();
        e.preventDefault();
        if (state === 'playing') {
            barrierPlaceMode = !barrierPlaceMode;
            updateBarrierUI();
        }
    }, { passive: false });
}

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
