// effects.js — Visual feedback: combat log, announcements, damage indicators, kill streaks, HUD pulses
const Effects = (() => {
  let combatLog = [];
  let announcements = [];
  let screenFlash = { active: false, color: '', alpha: 0, decay: 0 };
  let damageIndicators = [];
  let lowHpWarning = { active: false, pulse: 0 };
  let killStreak = { count: 0, timer: 0 };
  let enemyNameplate = null;
  let nameplateTimer = 0;
  let hudPulses = {}; // resource key -> pulse timer
  let vignetteAlpha = 0;

  // DOM refs
  let logEl, announceEl, overlayEl, vignetteEl;

  function init() {
    combatLog = [];
    announcements = [];
    screenFlash = { active: false, color: '', alpha: 0, decay: 0 };
    damageIndicators = [];
    lowHpWarning = { active: false, pulse: 0 };
    killStreak = { count: 0, timer: 0 };
    enemyNameplate = null;
    hudPulses = {};
    vignetteAlpha = 0;

    // Create/reset DOM elements
    logEl = document.getElementById('combat-log');
    if (!logEl) {
      logEl = document.createElement('div');
      logEl.id = 'combat-log';
      document.getElementById('game-container').appendChild(logEl);
    }
    logEl.innerHTML = '';

    announceEl = document.getElementById('announce-text');
    if (!announceEl) {
      announceEl = document.createElement('div');
      announceEl.id = 'announce-text';
      document.getElementById('game-container').appendChild(announceEl);
    }
    announceEl.className = 'hidden';

    overlayEl = document.getElementById('effects-overlay');
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.id = 'effects-overlay';
      document.getElementById('game-container').appendChild(overlayEl);
    }

    vignetteEl = document.getElementById('vignette-overlay');
    if (!vignetteEl) {
      vignetteEl = document.createElement('div');
      vignetteEl.id = 'vignette-overlay';
      document.getElementById('game-container').appendChild(vignetteEl);
    }
  }

  // === COMBAT LOG ===
  function log(text, color = '#ccc') {
    combatLog.push({ text, color, time: Date.now() });
    if (combatLog.length > 6) combatLog.shift();
    renderLog();
  }

  function renderLog() {
    if (!logEl) return;
    logEl.innerHTML = '';
    const now = Date.now();
    for (const entry of combatLog) {
      const age = (now - entry.time) / 1000;
      const alpha = Math.max(0, 1 - age / 8);
      if (alpha <= 0) continue;
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.style.color = entry.color;
      div.style.opacity = alpha;
      div.textContent = entry.text;
      logEl.appendChild(div);
    }
  }

  // === ANNOUNCEMENTS ===
  function announce(text, color = '#f1c40f', size = '42px', duration = 2.5) {
    if (!announceEl) return;
    announceEl.textContent = text;
    announceEl.style.color = color;
    announceEl.style.fontSize = size;
    announceEl.className = 'announce-show';
    announcements.push({ timer: duration });
  }

  // === SCREEN FLASH ===
  function flashScreen(color, alpha = 0.4, decay = 3) {
    screenFlash = { active: true, color, alpha, decay };
  }

  // === DAMAGE DIRECTION INDICATOR ===
  function addDamageIndicator(fromX, fromY, playerX, playerY) {
    const angle = Math.atan2(fromY - playerY, fromX - playerX);
    damageIndicators.push({ angle, life: 1.2, maxLife: 1.2 });
  }

  // === KILL STREAK ===
  function registerKill() {
    killStreak.count++;
    killStreak.timer = 3;
    if (killStreak.count >= 3) {
      announce(`🔥 x${killStreak.count} Kill Streak!`, '#ff6b00', '36px', 1.5);
      log(`x${killStreak.count} Kill Streak!`, '#ff6b00');
    }
  }

  // === ENEMY NAMEPLATE ===
  function setNameplate(enemy) {
    if (!enemy) { enemyNameplate = null; return; }
    enemyNameplate = { name: enemy.name, hp: enemy.hp, maxHp: enemy.maxHp, x: enemy.x, y: enemy.y, size: enemy.size };
    nameplateTimer = 2;
  }

  // === HUD PULSE ===
  function pulseResource(key) {
    hudPulses[key] = 0.4;
    const el = document.getElementById('res-' + key);
    if (el) {
      el.classList.remove('res-pulse');
      void el.offsetWidth; // reflow
      el.classList.add('res-pulse');
    }
  }

  // === UPDATE ===
  function update(dt) {
    // Screen flash
    if (screenFlash.active) {
      screenFlash.alpha -= screenFlash.decay * dt;
      if (screenFlash.alpha <= 0) screenFlash.active = false;
    }

    // Damage indicators
    for (let i = damageIndicators.length - 1; i >= 0; i--) {
      damageIndicators[i].life -= dt;
      if (damageIndicators[i].life <= 0) damageIndicators.splice(i, 1);
    }

    // Kill streak timer
    if (killStreak.timer > 0) {
      killStreak.timer -= dt;
      if (killStreak.timer <= 0) killStreak.count = 0;
    }

    // Low HP warning
    const ps = Player.state();
    const hpPct = ps.hp / ps.maxHp;
    if (hpPct < 0.25 && hpPct > 0) {
      if (!lowHpWarning.active) {
        lowHpWarning.active = true;
        announce('⚠️ DANGER!', '#ff0000', '48px', 1.5);
      }
      lowHpWarning.pulse += dt * 4;
      vignetteAlpha = 0.3 + Math.sin(lowHpWarning.pulse) * 0.15;
    } else {
      lowHpWarning.active = false;
      lowHpWarning.pulse = 0;
      vignetteAlpha = Math.max(0, vignetteAlpha - dt * 2);
    }

    // Nameplate timer
    if (nameplateTimer > 0) {
      nameplateTimer -= dt;
      if (nameplateTimer <= 0) enemyNameplate = null;
    }

    // HUD pulses
    for (const k in hudPulses) {
      hudPulses[k] -= dt;
      if (hudPulses[k] <= 0) delete hudPulses[k];
    }

    // Announcements
    for (let i = announcements.length - 1; i >= 0; i--) {
      announcements[i].timer -= dt;
      if (announcements[i].timer <= 0) {
        announcements.splice(i, 1);
        if (announcements.length === 0 && announceEl) {
          announceEl.className = 'announce-hide';
        }
      }
    }

    // Fade old log entries
    const now = Date.now();
    combatLog = combatLog.filter(e => (now - e.time) < 8000);
    renderLog();
  }

  // === DRAW (canvas-based overlays) ===
  function draw(ctx, canvasW, canvasH) {
    // Screen flash
    if (screenFlash.active && screenFlash.alpha > 0) {
      ctx.fillStyle = screenFlash.color;
      ctx.globalAlpha = Math.min(1, screenFlash.alpha);
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.globalAlpha = 1;
    }

    // Damage direction indicators
    for (const di of damageIndicators) {
      const alpha = di.life / di.maxLife;
      const cx = canvasW / 2;
      const cy = canvasH / 2;
      const edgeDist = Math.min(canvasW, canvasH) * 0.42;
      const ax = cx + Math.cos(di.angle) * edgeDist;
      const ay = cy + Math.sin(di.angle) * edgeDist;

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(di.angle);
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-8, -7);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Low HP vignette
    if (vignetteAlpha > 0.01) {
      const grad = ctx.createRadialGradient(canvasW/2, canvasH/2, canvasW*0.3, canvasW/2, canvasH/2, canvasW*0.7);
      grad.addColorStop(0, 'rgba(255,0,0,0)');
      grad.addColorStop(1, `rgba(255,0,0,${vignetteAlpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Enemy nameplate
    if (enemyNameplate) {
      const cam = GameMap.camera();
      const sx = enemyNameplate.x - cam.x;
      const sy = enemyNameplate.y - cam.y - enemyNameplate.size - 18;
      
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#000';
      ctx.fillText(enemyNameplate.name, sx + 1, sy + 1);
      ctx.fillStyle = '#fff';
      ctx.fillText(enemyNameplate.name, sx, sy);
      
      // HP text
      ctx.font = '10px sans-serif';
      const hpText = `${Math.ceil(enemyNameplate.hp)}/${enemyNameplate.maxHp}`;
      ctx.fillStyle = '#000';
      ctx.fillText(hpText, sx + 1, sy + 13);
      ctx.fillStyle = '#e74c3c';
      ctx.fillText(hpText, sx, sy + 12);
    }
  }

  // === WAVE/NIGHT EVENTS ===
  function nightBegins(nightNum) {
    announce(`🌙 NIGHT ${nightNum} BEGINS!`, '#ff4444', '48px', 3);
    log(`Night ${nightNum} begins!`, '#ff6b6b');
    flashScreen('rgba(80,0,0,1)', 0.3, 1.5);
  }

  function waveComplete() {
    announce('✨ WAVE COMPLETE!', '#2ecc71', '42px', 2);
    log('Wave complete!', '#2ecc71');
  }

  function dawnArrives() {
    announce('☀️ DAWN!', '#f1c40f', '48px', 2.5);
    log('Dawn arrives! You survived!', '#f1c40f');
    flashScreen('rgba(255,200,50,1)', 0.2, 1);
  }

  function bossIncoming() {
    announce('💀 BOSS INCOMING!', '#ff0000', '54px', 3);
    log('BOSS INCOMING!', '#ff0000');
    Particles.shake(15);
    flashScreen('rgba(100,0,0,1)', 0.4, 1);
  }

  function buildingPlaced(name) {
    log(`Built ${name}!`, '#2ecc71');
  }

  function buildingDestroyed(name) {
    announce(`⚠️ ${name} Destroyed!`, '#e74c3c', '32px', 2);
    log(`${name} destroyed!`, '#e74c3c');
  }

  function craftedItem(name) {
    announce(`🔨 Crafted ${name}!`, '#f1c40f', '28px', 1.5);
    log(`Crafted ${name}!`, '#f1c40f');
  }

  function notEnoughResources() {
    announce('❌ Not enough resources!', '#e74c3c', '24px', 1.2);
  }

  function resourceGathered(amount, type) {
    const icon = { wood: '🪵', stone: '🪨', iron: '⛏️', copper: '🟤', tin: '⬜', coal: '⬛', crystal: '💎' }[type] || '';
    log(`+${amount} ${type} ${icon}`, '#2ecc71');
    pulseResource(type);
  }

  function enemyHitPlayer(enemyName, dmg) {
    log(`${enemyName} hit you for ${Math.round(dmg)} damage`, '#ff6b6b');
  }

  function playerKilledEnemy(enemyName) {
    log(`You killed ${enemyName}`, '#ffd700');
    registerKill();
  }

  return {
    init, update, draw, log,
    announce, flashScreen, addDamageIndicator,
    setNameplate, pulseResource,
    nightBegins, waveComplete, dawnArrives, bossIncoming,
    buildingPlaced, buildingDestroyed, craftedItem, notEnoughResources,
    resourceGathered, enemyHitPlayer, playerKilledEnemy,
    killStreak: () => killStreak
  };
})();
