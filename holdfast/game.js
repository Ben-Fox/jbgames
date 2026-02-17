// ============ CONSTANTS ============
const TILE = 32, MAP_W = 60, MAP_H = 60, MAP_PX_W = MAP_W * TILE, MAP_PX_H = MAP_H * TILE;
const PLAYER_SPEED = 160, PLAYER_LIGHT = 3 * TILE, PLAYER_HP = 100, PLAYER_ATK = 10, ATK_ARC = Math.PI / 2, ATK_RANGE = 48;
const WAVE_BREAK = 30;

const BUILDING_DEFS = [
  { name:'Torch',    cost:{wood:5,stone:0,ember:1},  light:4*TILE, hp:30,  type:'torch' },
  { name:'Lantern',  cost:{wood:10,stone:3,ember:2}, light:6*TILE, hp:60,  type:'lantern' },
  { name:'Wall',     cost:{wood:0,stone:5,ember:0},  light:0,      hp:100, type:'wall' },
  { name:'Arrow Tower',cost:{wood:15,stone:10,ember:1},light:2*TILE,hp:80, type:'arrow' },
  { name:'Fire Pit', cost:{wood:10,stone:5,ember:3}, light:5*TILE, hp:60,  type:'firepit' },
  { name:'Quarry',   cost:{wood:0,stone:20,ember:2}, light:0,      hp:50,  type:'quarry' },
  { name:'Lumber Mill',cost:{wood:20,stone:0,ember:2},light:0,     hp:50,  type:'lumber' },
];

const ENEMY_DEFS = {
  crawler: { name:'Shadow Crawler', hp:20, speed:40, dmg:5, color:'#6a2c8a', drops:{wood:2,stone:1,ember:0}, radius:10 },
  runner:  { name:'Dark Runner',    hp:15, speed:100,dmg:3, color:'#5533aa', drops:{wood:3,stone:0,ember:0}, radius:8 },
  brute:   { name:'Shadow Brute',   hp:80, speed:25, dmg:15,color:'#442266', drops:{wood:0,stone:5,ember:1}, radius:16 },
  snuffer: { name:'Torch Snuffer',  hp:30, speed:60, dmg:8, color:'#333366', drops:{wood:0,stone:0,ember:2}, radius:10 },
  wraith:  { name:'Shadow Wraith',  hp:40, speed:60, dmg:10,color:'#2a1a4a', drops:{wood:0,stone:3,ember:2}, radius:11, flying:true },
};

const BOSS_DEFS = [
  { name:'Shadow King',   baseHp:500,  speed:30, dmg:20, color:'#8b1a1a', radius:30, tier:1,
    drops:{wood:20,stone:20,ember:10}, abilities:['slam','darkpulse'] },
  { name:'The Void',      baseHp:1000, speed:45, dmg:20, color:'#4a0040', radius:40, tier:2,
    drops:{wood:50,stone:50,ember:25}, abilities:['slam','darkpulse','spawn','extinguish'] },
  { name:'Eternal Night', baseHp:2000, speed:45, dmg:20, color:'#1a0030', radius:50, tier:3,
    drops:{wood:80,stone:80,ember:40}, abilities:['slam','darkpulse','spawn','extinguish','darknesswave','teleport'] },
];

// ============ STATE ============
let canvas, ctx, lightCanvas, lightCtx, minimapCanvas, minimapCtx;
let gameRunning = false, gameOver = false;
let player, camera, keys = {}, mousePos = {x:0,y:0}, mouseWorld = {x:0,y:0};
let buildings = [], enemies = [], particles = [], resources = [];
let wave = 0, waveTimer = 0, waveActive = false, waveEnemiesLeft = 0;
let buildMode = false, selectedBuilding = 0, score = 0, buildingsBuilt = 0, enemiesKilled = 0;
let screenShake = 0, lastTime = 0;
let groundTiles = [];
let attackCooldown = 0, attackAngle = 0, attackSwing = 0;

// Boss state
let boss = null; // current boss enemy ref (also in enemies array)
let bossIncoming = 0; // countdown for dramatic entrance
let bossIncomingWave = 0;
let darkPulseTimer = 0; // >0 means light sources dimmed
let darknessWaveTimer = 0; // >0 means light borders pushed back

// ============ INIT ============
function startGame() {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  lightCanvas = document.createElement('canvas');
  lightCtx = lightCanvas.getContext('2d');
  minimapCanvas = document.getElementById('minimap');
  minimapCtx = minimapCanvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);

  groundTiles = [];
  for (let y = 0; y < MAP_H; y++) {
    groundTiles[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      const r = 35 + Math.random()*15|0, g = 45 + Math.random()*15|0, b = 25 + Math.random()*10|0;
      groundTiles[y][x] = `rgb(${r},${g},${b})`;
    }
  }

  player = {
    x: MAP_PX_W/2, y: MAP_PX_H/2, hp: PLAYER_HP, maxHp: PLAYER_HP,
    facing: 0, res: {wood:10, stone:5, ember:3}
  };
  camera = { x: player.x, y: player.y };

  buildings = [];
  enemies = [];
  particles = [];
  resources = [];
  boss = null;
  bossIncoming = 0;
  darkPulseTimer = 0;
  darknessWaveTimer = 0;
  score = 0; buildingsBuilt = 0; enemiesKilled = 0;

  // Central bonfire — HP 500, repairable
  buildings.push({
    x: Math.floor(MAP_W/2), y: Math.floor(MAP_H/2),
    def: { name:'Bonfire', light:7*TILE, hp:500, type:'bonfire' },
    hp: 500, maxHp: 500
  });

  wave = 0;
  waveTimer = 5;
  waveActive = false;
  gameRunning = true;
  gameOver = false;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  lightCanvas.width = canvas.width;
  lightCanvas.height = canvas.height;
}

// ============ INPUT ============
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'b' || e.key === 'B') toggleBuildMode();
  if (e.key >= '1' && e.key <= '7' && buildMode) selectBuilding(parseInt(e.key)-1);
  if (e.key === 'r' || e.key === 'R') tryRepairBonfire();
  if (e.key === ' ') { e.preventDefault(); tryAttack(); }
  if (e.key === 'Escape') { buildMode = false; updateBuildUI(); }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', e => {
  mousePos.x = e.clientX; mousePos.y = e.clientY;
  mouseWorld.x = e.clientX - canvas.width/2 + camera.x;
  mouseWorld.y = e.clientY - canvas.height/2 + camera.y;
});
window.addEventListener('mousedown', e => {
  if (!gameRunning || gameOver) return;
  if (buildMode) { placeBuild(); }
  else { tryAttack(); }
});
window.addEventListener('contextmenu', e => e.preventDefault());

function toggleBuildMode() { buildMode = !buildMode; updateBuildUI(); }
function selectBuilding(i) { selectedBuilding = i; buildMode = true; updateBuildUI(); }
function updateBuildUI() {
  document.getElementById('build-mode-label').style.display = buildMode ? 'inline' : 'none';
  document.querySelectorAll('.build-btn').forEach((b,i) => b.classList.toggle('selected', buildMode && i === selectedBuilding));
}

function tryRepairBonfire() {
  const bf = buildings.find(b => b.def.type === 'bonfire');
  if (!bf || bf.hp >= bf.maxHp) return;
  if (player.res.wood >= 10 && player.res.ember >= 5) {
    const bx = bf.x*TILE+16, by = bf.y*TILE+16;
    if (dist(player.x, player.y, bx, by) < 3*TILE) {
      player.res.wood -= 10;
      player.res.ember -= 5;
      bf.hp = Math.min(bf.maxHp, bf.hp + 100);
      for (let k = 0; k < 12; k++) particles.push({x:bx,y:by,vx:(Math.random()-0.5)*60,vy:-Math.random()*80,life:0.8,color:'#ffaa33'});
    }
  }
}

// ============ GAME LOOP ============
function loop(now) {
  if (!gameRunning) return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ============ UPDATE ============
function update(dt) {
  if (gameOver) return;

  // Boss incoming countdown
  if (bossIncoming > 0) {
    bossIncoming -= dt;
    screenShake = 0.5;
    // Darkness pulse effect during entrance
    if (bossIncoming <= 0) {
      spawnBoss(bossIncomingWave);
      bossIncoming = 0;
    }
    updateHUD();
    return; // freeze gameplay during boss entrance
  }

  // Dark pulse timer (dims lights)
  if (darkPulseTimer > 0) darkPulseTimer -= dt;
  if (darknessWaveTimer > 0) darknessWaveTimer -= dt;

  // Player movement
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy = -1;
  if (keys['s'] || keys['arrowdown']) dy = 1;
  if (keys['a'] || keys['arrowleft']) dx = -1;
  if (keys['d'] || keys['arrowright']) dx = 1;
  if (dx || dy) {
    const len = Math.sqrt(dx*dx+dy*dy);
    dx /= len; dy /= len;
    player.facing = Math.atan2(dy, dx);
    const inLight = isLit(player.x, player.y);
    const spd = PLAYER_SPEED * (inLight ? 1 : 0.5) * dt;
    const nx = player.x + dx * spd, ny = player.y + dy * spd;
    if (!wallAt(nx, ny)) { player.x = nx; player.y = ny; }
    else if (!wallAt(nx, player.y)) { player.x = nx; }
    else if (!wallAt(player.x, ny)) { player.y = ny; }
  }
  player.x = Math.max(8, Math.min(MAP_PX_W-8, player.x));
  player.y = Math.max(8, Math.min(MAP_PX_H-8, player.y));

  // Regen
  if (isLit(player.x, player.y)) player.hp = Math.min(player.maxHp, player.hp + dt);

  // Attack cooldown & swing anim
  if (attackCooldown > 0) attackCooldown -= dt;
  if (attackSwing > 0) attackSwing -= dt * 4;

  // Camera
  camera.x += (player.x - camera.x) * 3 * dt;
  camera.y += (player.y - camera.y) * 3 * dt;
  if (screenShake > 0) screenShake -= dt;

  // Wave logic
  if (!waveActive) {
    waveTimer -= dt;
    if (waveTimer <= 0) startWave();
  } else {
    if (enemies.length === 0 && waveEnemiesLeft <= 0) {
      waveActive = false;
      boss = null;
      waveTimer = WAVE_BREAK;
    }
  }

  // Resource generators
  buildings.forEach(b => {
    if (b.hp <= 0) return;
    if (b.def.type === 'quarry' && isLit(b.x*TILE+16, b.y*TILE+16)) {
      b._genTimer = (b._genTimer||0) + dt;
      if (b._genTimer >= 5) { b._genTimer -= 5; player.res.stone++; }
    }
    if (b.def.type === 'lumber' && isLit(b.x*TILE+16, b.y*TILE+16)) {
      b._genTimer = (b._genTimer||0) + dt;
      if (b._genTimer >= 5) { b._genTimer -= 5; player.res.wood++; }
    }
  });

  // Enemies update
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    // Light damage (bosses take reduced)
    if (isLit(e.x, e.y)) e.hp -= (e.isBoss ? 0.5 : 1) * dt;

    // === BOSS AI ===
    if (e.isBoss) {
      updateBoss(e, dt);
    }

    // Find target
    let tx, ty;
    if (e.isBoss) {
      // Boss targets bonfire
      const bf = buildings.find(b => b.def.type === 'bonfire');
      if (bf) { tx = bf.x*TILE+16; ty = bf.y*TILE+16; }
      else { tx = player.x; ty = player.y; }
    } else if (e.def === ENEMY_DEFS.snuffer) {
      const t = nearestLight(e.x, e.y);
      if (t) { tx = t.x*TILE+16; ty = t.y*TILE+16; } else { tx = player.x; ty = player.y; }
    } else {
      tx = player.x; ty = player.y;
      const t = nearestLight(e.x, e.y);
      if (t) {
        const dP = dist(e.x,e.y,player.x,player.y);
        const dL = dist(e.x,e.y,t.x*TILE+16,t.y*TILE+16);
        if (dL < dP) { tx = t.x*TILE+16; ty = t.y*TILE+16; }
      }
    }
    const ang = Math.atan2(ty-e.y, tx-e.x);
    const spd = e.speed * dt;
    let nx = e.x + Math.cos(ang)*spd, ny = e.y + Math.sin(ang)*spd;
    const isFlying = e.def?.flying || e.isBoss;
    if (!isFlying && wallAt(nx, ny)) {
      const perpX = e.x + Math.cos(ang + Math.PI/2)*spd;
      const perpY = e.y + Math.sin(ang + Math.PI/2)*spd;
      if (!wallAt(perpX, perpY)) { nx = perpX; ny = perpY; }
      else { nx = e.x; ny = e.y; }
    }
    e.x = nx; e.y = ny;

    // Attack player (melee)
    const meleeRange = e.isBoss ? e.bossRadius + 16 : 24;
    if ((!e.def || e.def !== ENEMY_DEFS.snuffer) && dist(e.x,e.y,player.x,player.y) < meleeRange) {
      e._atkTimer = (e._atkTimer||0) + dt;
      const atkSpeed = e.isBoss ? 1.5 : 1;
      if (e._atkTimer >= atkSpeed) {
        e._atkTimer = 0;
        const dmg = e.isBoss ? e.bossDmg : e.def.dmg;
        player.hp -= dmg;
        if (e.isBoss) {
          // AoE slam visual
          screenShake = 0.3;
          for (let k = 0; k < 15; k++)
            particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*120,vy:(Math.random()-0.5)*120,life:0.6,color:'#ff3333'});
        }
      }
    }

    // Boss attacks buildings (especially bonfire)
    if (e.isBoss) {
      buildings.forEach(b => {
        if (b.hp <= 0) return;
        const bx = b.x*TILE+16, by = b.y*TILE+16;
        if (dist(e.x,e.y,bx,by) < e.bossRadius + 20) {
          e._bldAtkTimer = (e._bldAtkTimer||0) + dt;
          if (e._bldAtkTimer >= 1) {
            e._bldAtkTimer = 0;
            b.hp -= e.bossDmg;
            if (b.def.type === 'bonfire' && b.hp <= 0) {
              doGameOver(false);
              return;
            }
          }
        }
      });
    }

    // Normal enemy attack buildings
    if (!e.isBoss) {
      buildings.forEach(b => {
        if (b.hp <= 0) return;
        const bx = b.x*TILE+16, by = b.y*TILE+16;
        if (dist(e.x,e.y,bx,by) < 24) {
          if (e.def === ENEMY_DEFS.snuffer || (b.def.type === 'wall' && !e.def?.flying)) {
            e._atkTimer = (e._atkTimer||0) + dt;
            if (e._atkTimer >= 1) { e._atkTimer = 0; b.hp -= e.def.dmg; }
          }
        }
      });
    }

    // Fire pit damage
    buildings.forEach(b => {
      if (b.hp <= 0 || b.def.type !== 'firepit') return;
      if (dist(e.x,e.y, b.x*TILE+16, b.y*TILE+16) < 2*TILE) e.hp -= 5*dt;
    });

    // Death
    if (e.hp <= 0) {
      const particleCount = e.isBoss ? 40 : 8;
      const particleSpeed = e.isBoss ? 200 : 80;
      for (let k = 0; k < particleCount; k++)
        particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*particleSpeed,vy:(Math.random()-0.5)*particleSpeed,life:e.isBoss?1.5:0.5,color:e.isBoss?'#ff2244':e.def.color});

      // Drops
      const drops = e.isBoss ? e.bossDrops : e.def.drops;
      if (drops.wood) resources.push({x:e.x,y:e.y,type:'wood',amount:drops.wood});
      if (drops.stone) resources.push({x:e.x+8,y:e.y,type:'stone',amount:drops.stone});
      if (drops.ember) resources.push({x:e.x-8,y:e.y,type:'ember',amount:drops.ember});

      score += e.isBoss ? wave * 50 : wave;
      enemiesKilled++;
      if (e.isBoss) {
        screenShake = 1.0;
        boss = null;
      } else if (e.def === ENEMY_DEFS.brute) {
        screenShake = 0.3;
      }
      enemies.splice(i, 1);
    }
  }

  // Arrow towers — prioritize boss
  buildings.forEach(b => {
    if (b.hp <= 0 || b.def.type !== 'arrow') return;
    b._atkTimer = (b._atkTimer||0) + dt;
    if (b._atkTimer >= 1) {
      const bx = b.x*TILE+16, by = b.y*TILE+16;
      let target = null, tDist = 5*TILE;
      // Prioritize boss
      if (boss && boss.hp > 0) {
        const d = dist(bx,by,boss.x,boss.y);
        if (d < 6*TILE) { target = boss; tDist = d; }
      }
      if (!target) {
        enemies.forEach(e => { const d = dist(bx,by,e.x,e.y); if (d < tDist) { tDist=d; target=e; } });
      }
      if (target) {
        target.hp -= 8;
        b._atkTimer = 0;
        particles.push({x:bx,y:by,vx:(target.x-bx)*2,vy:(target.y-by)*2,life:0.15,color:'#ffcc44',isArrow:true,tx:target.x,ty:target.y});
      }
    }
  });

  // Resources pickup
  for (let i = resources.length-1; i >= 0; i--) {
    const r = resources[i];
    const d = dist(r.x,r.y,player.x,player.y);
    if (d < 2*TILE) {
      const ang = Math.atan2(player.y-r.y, player.x-r.x);
      const spd = 200 * dt;
      r.x += Math.cos(ang)*spd; r.y += Math.sin(ang)*spd;
    }
    if (d < 16) {
      player.res[r.type] += r.amount;
      resources.splice(i, 1);
    }
  }

  // Clean dead buildings (bonfire stays but check game over)
  const bonfireDead = buildings.find(b => b.def.type === 'bonfire' && b.hp <= 0);
  if (bonfireDead) { doGameOver(false); return; }
  buildings = buildings.filter(b => b.hp > 0);

  // Particles
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    if (p.isArrow) { p.life -= dt; } else { p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; }
    if (p.life <= 0) particles.splice(i,1);
  }

  // Player death
  if (player.hp <= 0) doGameOver(false);

  updateHUD();
}

// ============ BOSS LOGIC ============
function updateBoss(e, dt) {
  // Ability cooldowns
  e._abilityCd = (e._abilityCd || 0) - dt;
  e._spawnCd = (e._spawnCd || 0) - dt;
  e._teleportCd = (e._teleportCd || 0) - dt;

  if (e._abilityCd <= 0) {
    const abilities = e.bossAbilities;
    // Pick a random ability
    const able = abilities.filter(a => {
      if (a === 'spawn' && e._spawnCd > 0) return false;
      if (a === 'teleport' && e._teleportCd > 0) return false;
      return true;
    });
    if (able.length > 0) {
      const pick = able[Math.random()*able.length|0];
      executeBossAbility(e, pick);
      e._abilityCd = 4 + Math.random()*3; // 4-7 sec between abilities
    }
  }
}

function executeBossAbility(e, ability) {
  switch(ability) {
    case 'slam':
      // AoE damage around boss
      if (dist(e.x,e.y,player.x,player.y) < e.bossRadius + 60) {
        player.hp -= 10;
      }
      screenShake = 0.4;
      for (let k = 0; k < 20; k++)
        particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*150,vy:(Math.random()-0.5)*150,life:0.7,color:'#aa2222'});
      break;

    case 'darkpulse':
      // Dim all light sources by 50% for 5 seconds
      darkPulseTimer = 5;
      screenShake = 0.3;
      // Purple pulse particles
      for (let k = 0; k < 30; k++)
        particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*200,vy:(Math.random()-0.5)*200,life:1.0,color:'#6622aa'});
      break;

    case 'spawn':
      // Spawn 3 crawlers
      e._spawnCd = 10;
      for (let i = 0; i < 3; i++) {
        const ang = Math.random()*Math.PI*2;
        const sx = e.x + Math.cos(ang)*60, sy = e.y + Math.sin(ang)*60;
        const def = ENEMY_DEFS.crawler;
        enemies.push({x:sx,y:sy,hp:def.hp+wave*2,maxHp:def.hp+wave*2,def,speed:def.speed,_atkTimer:0});
      }
      break;

    case 'extinguish':
      // Destroy torches within 6 tiles
      const range = 6*TILE;
      buildings.forEach(b => {
        if (b.hp <= 0) return;
        if (b.def.type === 'torch' || b.def.type === 'lantern') {
          if (dist(e.x,e.y,b.x*TILE+16,b.y*TILE+16) < range) {
            b.hp = 0;
            for (let k = 0; k < 6; k++)
              particles.push({x:b.x*TILE+16,y:b.y*TILE+16,vx:(Math.random()-0.5)*40,vy:-Math.random()*60,life:0.5,color:'#443322'});
          }
        }
      });
      break;

    case 'darknesswave':
      // Push light borders back temporarily
      darknessWaveTimer = 8;
      screenShake = 0.5;
      for (let k = 0; k < 40; k++)
        particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*250,vy:(Math.random()-0.5)*250,life:1.2,color:'#110022'});
      break;

    case 'teleport':
      // Teleport to weakest defense point (building with lowest HP)
      e._teleportCd = 15;
      let weakest = null, wHp = Infinity;
      buildings.forEach(b => {
        if (b.hp <= 0 || b.def.type === 'wall') return;
        if (b.hp < wHp) { wHp = b.hp; weakest = b; }
      });
      if (weakest) {
        // Vanish particles at old pos
        for (let k = 0; k < 15; k++)
          particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*80,vy:(Math.random()-0.5)*80,life:0.5,color:'#2a0040'});
        e.x = weakest.x*TILE+16 + (Math.random()-0.5)*TILE*2;
        e.y = weakest.y*TILE+16 + (Math.random()-0.5)*TILE*2;
        // Appear particles at new pos
        for (let k = 0; k < 15; k++)
          particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*80,vy:(Math.random()-0.5)*80,life:0.5,color:'#aa0044'});
        screenShake = 0.3;
      }
      break;
  }
}

function isBossWave(w) { return w > 0 && w % 10 === 0; }

function getBossDef(w) {
  const tier = Math.floor(w / 10); // 1,2,3,4,...
  if (tier <= 0) return null;
  if (tier === 1) return BOSS_DEFS[0];
  if (tier === 2) return BOSS_DEFS[1];
  // tier 3+: eternal night with scaling
  const base = BOSS_DEFS[2];
  const extra = (tier - 3) * 1000;
  const speedBonus = (tier - 3) * 5;
  return {
    ...base,
    baseHp: base.baseHp + extra,
    speed: base.speed + speedBonus,
    drops: { wood: 80+tier*20, stone: 80+tier*20, ember: 40+tier*10 },
  };
}

function spawnBoss(w) {
  const def = getBossDef(w);
  if (!def) return;
  const pos = getSpawnPos();
  const e = {
    x: pos.x, y: pos.y,
    hp: def.baseHp, maxHp: def.baseHp,
    speed: def.speed,
    isBoss: true,
    bossName: def.name,
    bossRadius: def.radius,
    bossColor: def.color,
    bossDmg: def.dmg,
    bossDrops: def.drops,
    bossAbilities: def.abilities,
    _atkTimer: 0, _abilityCd: 3, _spawnCd: 0, _teleportCd: 0, _bldAtkTimer: 0,
  };
  enemies.push(e);
  boss = e;
}

function tryAttack() {
  if (attackCooldown > 0 || gameOver) return;
  attackCooldown = 0.4;
  attackSwing = 1;
  const ang = Math.atan2(mouseWorld.y - player.y, mouseWorld.x - player.x);
  player.facing = ang;
  attackAngle = ang;
  enemies.forEach(e => {
    const hitRange = e.isBoss ? ATK_RANGE + e.bossRadius : ATK_RANGE;
    const d = dist(player.x,player.y,e.x,e.y);
    if (d > hitRange) return;
    const a = Math.atan2(e.y-player.y, e.x-player.x);
    let diff = a - ang; while(diff > Math.PI) diff -= 2*Math.PI; while(diff < -Math.PI) diff += 2*Math.PI;
    if (Math.abs(diff) < ATK_ARC/2) e.hp -= PLAYER_ATK;
  });
}

function placeBuild() {
  const gx = Math.floor(mouseWorld.x / TILE), gy = Math.floor(mouseWorld.y / TILE);
  if (gx < 0 || gx >= MAP_W || gy < 0 || gy >= MAP_H) return;
  if (!isLit(gx*TILE+16, gy*TILE+16)) return;
  if (buildings.some(b => b.x===gx && b.y===gy && b.hp > 0)) return;
  const def = BUILDING_DEFS[selectedBuilding];
  const c = def.cost;
  if (player.res.wood < c.wood || player.res.stone < c.stone || player.res.ember < c.ember) return;
  player.res.wood -= c.wood; player.res.stone -= c.stone; player.res.ember -= c.ember;
  const b = { x:gx, y:gy, def, hp:def.hp, maxHp:def.hp, _animRadius:0 };
  buildings.push(b);
  buildingsBuilt++;
}

function startWave() {
  wave++;
  waveActive = true;

  if (isBossWave(wave)) {
    // Boss entrance — dramatic delay
    bossIncoming = 3; // 3 second dramatic entrance
    bossIncomingWave = wave;
    return;
  }

  let count = Math.min(3 + wave * 2, 30);
  const types = ['crawler'];
  if (wave >= 4) types.push('runner');
  if (wave >= 6) types.push('brute');
  if (wave >= 9) { types.push('snuffer'); types.push('wraith'); }
  for (let i = 0; i < count; i++) {
    const type = types[Math.random()*types.length|0];
    const pos = getSpawnPos();
    const def = ENEMY_DEFS[type];
    enemies.push({x:pos.x,y:pos.y,hp:def.hp+wave*2,maxHp:def.hp+wave*2,def,speed:def.speed,_atkTimer:0});
  }
}

function getSpawnPos() {
  for (let tries = 0; tries < 50; tries++) {
    const ang = Math.random()*Math.PI*2;
    const sources = getLightSources();
    const s = sources[Math.random()*sources.length|0];
    const r = s.radius + TILE*2;
    const x = s.x + Math.cos(ang)*r, y = s.y + Math.sin(ang)*r;
    if (x > 0 && x < MAP_PX_W && y > 0 && y < MAP_PX_H && !isLit(x,y)) return {x,y};
  }
  const side = Math.random()*4|0;
  if (side===0) return {x:Math.random()*MAP_PX_W, y:0};
  if (side===1) return {x:MAP_PX_W, y:Math.random()*MAP_PX_H};
  if (side===2) return {x:Math.random()*MAP_PX_W, y:MAP_PX_H};
  return {x:0, y:Math.random()*MAP_PX_H};
}

function getLightSources() {
  const dimFactor = darkPulseTimer > 0 ? 0.5 : 1;
  const wavePushback = darknessWaveTimer > 0 ? 2*TILE : 0;
  const s = [{x:player.x, y:player.y, radius:Math.max(TILE, PLAYER_LIGHT * dimFactor - wavePushback)}];
  buildings.forEach(b => {
    if (b.hp <= 0) return;
    let baseR = b.def.light || 0;
    if (baseR <= 0) return;
    // Animate expand
    if (b._animRadius !== undefined && b._animRadius < baseR) {
      b._animRadius += TILE * 8 * (1/60);
      baseR = Math.min(baseR, b._animRadius);
    }
    let r = Math.max(TILE, baseR * dimFactor - wavePushback);
    s.push({x:b.x*TILE+16, y:b.y*TILE+16, radius:r});
  });
  return s;
}

function isLit(px, py) {
  const sources = getLightSources();
  for (const s of sources) {
    if (dist(px,py,s.x,s.y) < s.radius) return true;
  }
  return false;
}

function nearestLight(ex, ey) {
  let best = null, bDist = Infinity;
  buildings.forEach(b => {
    if (b.hp <= 0 || !b.def.light) return;
    const d = dist(ex,ey,b.x*TILE+16,b.y*TILE+16);
    if (d < bDist) { bDist=d; best=b; }
  });
  return best;
}

function wallAt(px, py) {
  const gx = Math.floor(px/TILE), gy = Math.floor(py/TILE);
  return buildings.some(b => b.x===gx && b.y===gy && b.hp>0 && b.def.type==='wall');
}

function dist(x1,y1,x2,y2) { const dx=x2-x1,dy=y2-y1; return Math.sqrt(dx*dx+dy*dy); }

function doGameOver(win) {
  gameOver = true;
  document.getElementById('game-over-screen').style.display = 'flex';
  document.getElementById('go-title').textContent = win ? 'THE LIGHT PREVAILS' : 'The darkness consumed you...';
  document.getElementById('go-title').style.color = win ? '#ffcc44' : '#ff4422';
  document.getElementById('go-stats').innerHTML =
    `Waves survived: ${wave}<br>Enemies killed: ${enemiesKilled}<br>Buildings built: ${buildingsBuilt}<br>Score: ${score}`;
  document.getElementById('hud').style.display = 'none';
}
function victory() { doGameOver(true); }

function updateHUD() {
  document.getElementById('hp-bar').style.width = (player.hp/player.maxHp*100)+'%';
  document.getElementById('hp-text').textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
  document.getElementById('res-wood').textContent = player.res.wood;
  document.getElementById('res-stone').textContent = player.res.stone;
  document.getElementById('res-ember').textContent = player.res.ember;
  document.getElementById('wave-num').textContent = wave || 1;
  const bossHpBar = document.getElementById('boss-hp-bar');
  const bossHpFill = document.getElementById('boss-hp-fill');
  const bossHpName = document.getElementById('boss-name');
  if (boss && boss.hp > 0) {
    bossHpBar.style.display = 'block';
    bossHpFill.style.width = (boss.hp/boss.maxHp*100)+'%';
    bossHpName.textContent = boss.bossName;
  } else {
    bossHpBar.style.display = 'none';
  }
  if (bossIncoming > 0) {
    document.getElementById('wave-timer').textContent = '⚠ BOSS INCOMING ⚠';
  } else if (waveActive) {
    document.getElementById('wave-timer').textContent = boss ? `BOSS FIGHT!` : 'FIGHT!';
  } else {
    document.getElementById('wave-timer').textContent = `BUILD PHASE - ${Math.ceil(waveTimer)}s`;
  }
  document.getElementById('score').textContent = score;

  // Bonfire HP indicator
  const bf = buildings.find(b => b.def.type === 'bonfire');
  const bfEl = document.getElementById('bonfire-hp');
  if (bf && bfEl) {
    bfEl.textContent = `Bonfire: ${Math.ceil(bf.hp)}/${bf.maxHp}`;
    bfEl.style.color = bf.hp < 200 ? '#ff4444' : '#ffaa44';
  }
}

// ============ RENDER ============
function render() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,W,H);

  const shakeX = screenShake > 0 ? (Math.random()-0.5)*8*Math.min(screenShake*4,1) : 0;
  const shakeY = screenShake > 0 ? (Math.random()-0.5)*8*Math.min(screenShake*4,1) : 0;
  const ox = W/2 - camera.x + shakeX, oy = H/2 - camera.y + shakeY;

  ctx.save();
  ctx.translate(ox, oy);

  // Ground tiles
  const startX = Math.max(0, Math.floor((camera.x - W/2)/TILE));
  const endX = Math.min(MAP_W, Math.ceil((camera.x + W/2)/TILE));
  const startY = Math.max(0, Math.floor((camera.y - H/2)/TILE));
  const endY = Math.min(MAP_H, Math.ceil((camera.y + H/2)/TILE));
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      ctx.fillStyle = groundTiles[y][x];
      ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
    }
  }

  // Buildings
  buildings.forEach(b => {
    if (b.hp <= 0) return;
    const bx = b.x*TILE, by = b.y*TILE;
    switch(b.def.type) {
      case 'bonfire':
        ctx.fillStyle='#884422'; ctx.fillRect(bx+4,by+4,24,24);
        ctx.fillStyle='#ff6622'; ctx.fillRect(bx+8,by+2,16,12);
        ctx.fillStyle='#ffaa44'; ctx.fillRect(bx+12,by-2,8,8);
        // Show HP bar for bonfire
        ctx.fillStyle='#333'; ctx.fillRect(bx-4,by-8,TILE+8,4);
        ctx.fillStyle= b.hp > 200 ? '#4a4' : '#c33';
        ctx.fillRect(bx-4,by-8,(TILE+8)*(b.hp/b.maxHp),4);
        break;
      case 'torch':
        ctx.fillStyle='#665533'; ctx.fillRect(bx+13,by+10,6,18);
        ctx.fillStyle='#ff8822'; ctx.beginPath(); ctx.arc(bx+16,by+10,5,0,Math.PI*2); ctx.fill();
        break;
      case 'lantern':
        ctx.fillStyle='#998866'; ctx.fillRect(bx+10,by+6,12,20);
        ctx.fillStyle='#ffcc44'; ctx.fillRect(bx+12,by+8,8,12);
        break;
      case 'wall':
        ctx.fillStyle='#777777'; ctx.fillRect(bx+2,by+2,28,28);
        ctx.fillStyle='#666666'; ctx.fillRect(bx+4,by+4,24,24);
        ctx.strokeStyle='#555'; ctx.strokeRect(bx+2,by+2,28,28);
        break;
      case 'arrow':
        ctx.fillStyle='#886644'; ctx.fillRect(bx+6,by+6,20,20);
        ctx.fillStyle='#aa8855'; ctx.fillRect(bx+10,by+2,12,4);
        ctx.fillStyle='#ffcc44'; ctx.fillRect(bx+14,by,4,4);
        break;
      case 'firepit':
        ctx.fillStyle='#664433'; ctx.beginPath(); ctx.arc(bx+16,by+16,12,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ff4411'; ctx.beginPath(); ctx.arc(bx+16,by+14,7,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ffaa33'; ctx.beginPath(); ctx.arc(bx+16,by+12,4,0,Math.PI*2); ctx.fill();
        break;
      case 'quarry':
        ctx.fillStyle='#888888'; ctx.fillRect(bx+4,by+8,24,20);
        ctx.fillStyle='#666666';
        ctx.beginPath(); ctx.moveTo(bx+4,by+8); ctx.lineTo(bx+16,by+2); ctx.lineTo(bx+28,by+8); ctx.fill();
        break;
      case 'lumber':
        ctx.fillStyle='#885522'; ctx.fillRect(bx+4,by+10,24,16);
        ctx.fillStyle='#aa7733'; ctx.fillRect(bx+6,by+6,20,6);
        break;
    }
    if (b.hp < b.maxHp && b.def.type !== 'bonfire') {
      ctx.fillStyle='#333'; ctx.fillRect(bx,by-4,TILE,3);
      ctx.fillStyle='#4a4'; ctx.fillRect(bx,by-4,TILE*(b.hp/b.maxHp),3);
    }
  });

  // Resources on ground
  resources.forEach(r => {
    const colors = {wood:'#8B5E3C', stone:'#888888', ember:'#ff6622'};
    ctx.fillStyle = colors[r.type];
    ctx.beginPath(); ctx.arc(r.x, r.y, r.type==='ember'?5:4, 0, Math.PI*2); ctx.fill();
    if (r.type === 'ember') {
      ctx.fillStyle = 'rgba(255,150,50,0.4)';
      ctx.beginPath(); ctx.arc(r.x, r.y, 8, 0, Math.PI*2); ctx.fill();
    }
  });

  // Enemies
  enemies.forEach(e => {
    if (e.isBoss) {
      renderBoss(e);
      return;
    }
    const fade = Math.min(1, e.hp / e.maxHp + 0.3);
    ctx.globalAlpha = fade;
    ctx.fillStyle = e.def.color;
    const r = e.def.radius;
    ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(e.x-3, e.y-2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x+3, e.y-2, 2, 0, Math.PI*2); ctx.fill();
    if (e.def.flying) {
      ctx.fillStyle = 'rgba(50,20,80,0.3)';
      ctx.beginPath(); ctx.arc(e.x, e.y, r+4, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (e.hp < e.maxHp) {
      ctx.fillStyle='#333'; ctx.fillRect(e.x-r,e.y-r-6,r*2,3);
      ctx.fillStyle='#c33'; ctx.fillRect(e.x-r,e.y-r-6,r*2*(e.hp/e.maxHp),3);
    }
  });

  // Player
  const px = player.x, py = player.y, f = player.facing;
  ctx.fillStyle='#cc8844';
  ctx.fillRect(px-6,py-4,12,14);
  ctx.fillStyle='#dda866';
  ctx.beginPath(); ctx.arc(px, py-7, 6, 0, Math.PI*2); ctx.fill();
  if (attackSwing > 0) {
    const swAng = attackAngle - ATK_ARC/2 + ATK_ARC*(1-attackSwing);
    ctx.strokeStyle='#cccccc'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+Math.cos(swAng)*ATK_RANGE, py+Math.sin(swAng)*ATK_RANGE); ctx.stroke();
    ctx.strokeStyle='rgba(255,200,100,0.3)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(px,py,ATK_RANGE,attackAngle-ATK_ARC/2,attackAngle+ATK_ARC/2); ctx.stroke();
  } else {
    ctx.strokeStyle='#aaaaaa'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+Math.cos(f)*20,py+Math.sin(f)*20); ctx.stroke();
  }

  // Particles
  particles.forEach(p => {
    if (p.isArrow) {
      ctx.strokeStyle=p.color; ctx.lineWidth=2;
      const t = 1 - p.life/0.15;
      const ax = p.x + (p.tx-p.x)*t, ay = p.y + (p.ty-p.y)*t;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax-4,ay-4); ctx.stroke();
    } else {
      ctx.globalAlpha = Math.min(1, p.life*2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x-2,p.y-2,4,4);
      ctx.globalAlpha = 1;
    }
  });

  // Build mode ghost
  if (buildMode) {
    const gx = Math.floor(mouseWorld.x/TILE), gy = Math.floor(mouseWorld.y/TILE);
    const def = BUILDING_DEFS[selectedBuilding];
    const canPlace = gx>=0 && gx<MAP_W && gy>=0 && gy<MAP_H && isLit(gx*TILE+16,gy*TILE+16)
      && !buildings.some(b=>b.x===gx&&b.y===gy&&b.hp>0)
      && player.res.wood>=def.cost.wood && player.res.stone>=def.cost.stone && player.res.ember>=def.cost.ember;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = canPlace ? '#44ff44' : '#ff4444';
    ctx.fillRect(gx*TILE, gy*TILE, TILE, TILE);
    if (def.light > 0) {
      ctx.strokeStyle = canPlace ? 'rgba(255,200,50,0.3)' : 'rgba(255,50,50,0.2)';
      ctx.beginPath(); ctx.arc(gx*TILE+16, gy*TILE+16, def.light, 0, Math.PI*2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // ===== LIGHTING OVERLAY =====
  lightCtx.fillStyle = '#000';
  lightCtx.fillRect(0, 0, W, H);
  lightCtx.globalCompositeOperation = 'destination-out';

  const sources = getLightSources();
  const time = performance.now()/1000;
  sources.forEach(s => {
    const sx = s.x + ox, sy = s.y + oy;
    const flicker = s.radius * (0.97 + 0.03 * Math.sin(time*8 + s.x));
    const grad = lightCtx.createRadialGradient(sx,sy,0,sx,sy,flicker);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    lightCtx.fillStyle = grad;
    lightCtx.beginPath(); lightCtx.arc(sx,sy,flicker,0,Math.PI*2); lightCtx.fill();
  });

  // Boss dark red glow (visible even in darkness)
  if (boss && boss.hp > 0) {
    const bsx = boss.x + ox, bsy = boss.y + oy;
    const bossGlow = boss.bossRadius * 3;
    const grad = lightCtx.createRadialGradient(bsx,bsy,0,bsx,bsy,bossGlow);
    grad.addColorStop(0, 'rgba(0,0,0,0.6)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    lightCtx.fillStyle = grad;
    lightCtx.beginPath(); lightCtx.arc(bsx,bsy,bossGlow,0,Math.PI*2); lightCtx.fill();
  }

  lightCtx.globalCompositeOperation = 'source-over';

  // Dark pulse tint
  if (darkPulseTimer > 0) {
    lightCtx.fillStyle = `rgba(40,0,60,${0.15 * Math.min(darkPulseTimer, 1)})`;
    lightCtx.fillRect(0,0,W,H);
  }

  ctx.drawImage(lightCanvas, 0, 0);

  // Boss incoming overlay
  if (bossIncoming > 0) {
    // Pulsing darkness
    const pulse = Math.sin(bossIncoming * 6) * 0.15 + 0.3;
    ctx.fillStyle = `rgba(20,0,0,${pulse})`;
    ctx.fillRect(0,0,W,H);
    // Text
    ctx.save();
    ctx.fillStyle = '#ff2222';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 30;
    ctx.fillText('⚠ BOSS INCOMING ⚠', W/2, H/2 - 20);
    const bDef = getBossDef(bossIncomingWave);
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#cc4444';
    ctx.fillText(bDef.name, W/2, H/2 + 40);
    ctx.restore();
  }

  // Vignette
  const vg = ctx.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.7);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,0,0,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0,0,W,H);

  // Ember particles near fire sources
  sources.forEach(s => {
    if (Math.random() > 0.03) return;
    particles.push({x:s.x+(Math.random()-0.5)*20, y:s.y, vx:(Math.random()-0.5)*15, vy:-20-Math.random()*20, life:0.8, color:'#ff8833'});
  });

  renderMinimap();
}

function renderBoss(e) {
  const r = e.bossRadius;
  const time = performance.now()/1000;

  // Dark red/purple aura
  const auraSize = r * 2 + Math.sin(time*3)*5;
  const auraGrad = ctx.createRadialGradient(e.x,e.y,r,e.x,e.y,auraSize);
  auraGrad.addColorStop(0, 'rgba(150,0,30,0.4)');
  auraGrad.addColorStop(1, 'rgba(80,0,60,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath(); ctx.arc(e.x,e.y,auraSize,0,Math.PI*2); ctx.fill();

  // Body
  ctx.fillStyle = e.bossColor;
  ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI*2); ctx.fill();

  // Inner darker core
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.arc(e.x, e.y, r*0.6, 0, Math.PI*2); ctx.fill();

  // Glowing eyes (bigger, more menacing)
  const eyeSpread = r * 0.35;
  const eyeSize = r * 0.15;
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 15;
  ctx.beginPath(); ctx.arc(e.x-eyeSpread, e.y-r*0.15, eyeSize, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(e.x+eyeSpread, e.y-r*0.15, eyeSize, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // Crown/horns for Shadow King tier
  ctx.fillStyle = '#aa1133';
  ctx.beginPath();
  ctx.moveTo(e.x-r*0.6, e.y-r*0.7);
  ctx.lineTo(e.x-r*0.3, e.y-r*1.2);
  ctx.lineTo(e.x, e.y-r*0.8);
  ctx.lineTo(e.x+r*0.3, e.y-r*1.2);
  ctx.lineTo(e.x+r*0.6, e.y-r*0.7);
  ctx.closePath();
  ctx.fill();

  // Pulsing outline
  ctx.strokeStyle = `rgba(255,0,50,${0.5+0.3*Math.sin(time*5)})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(e.x, e.y, r+2, 0, Math.PI*2); ctx.stroke();
  ctx.lineWidth = 1;
}

function renderMinimap() {
  const mw = 150, mh = 150, scale = mw/MAP_W;
  minimapCtx.fillStyle = '#000';
  minimapCtx.fillRect(0,0,mw,mh);
  const sources = getLightSources();
  sources.forEach(s => {
    minimapCtx.fillStyle = 'rgba(255,200,50,0.3)';
    const r = s.radius / TILE * scale;
    minimapCtx.beginPath(); minimapCtx.arc(s.x/TILE*scale, s.y/TILE*scale, r, 0, Math.PI*2); minimapCtx.fill();
  });
  buildings.forEach(b => {
    if (b.hp <= 0) return;
    minimapCtx.fillStyle = b.def.type === 'bonfire' ? '#ff6622' : b.def.light ? '#ffaa33' : '#888';
    minimapCtx.fillRect(b.x*scale, b.y*scale, b.def.type==='bonfire'?4:2, b.def.type==='bonfire'?4:2);
  });
  minimapCtx.fillStyle = '#44ff44';
  minimapCtx.fillRect(player.x/TILE*scale-1, player.y/TILE*scale-1, 3, 3);
  minimapCtx.fillStyle = '#ff3333';
  enemies.forEach(e => {
    const s = e.isBoss ? 5 : 2;
    minimapCtx.fillRect(e.x/TILE*scale-s/2, e.y/TILE*scale-s/2, s, s);
  });
  // Boss blip pulses
  if (boss && boss.hp > 0) {
    minimapCtx.fillStyle = `rgba(255,0,0,${0.5+0.5*Math.sin(performance.now()/200)})`;
    minimapCtx.beginPath();
    minimapCtx.arc(boss.x/TILE*scale, boss.y/TILE*scale, 4, 0, Math.PI*2);
    minimapCtx.fill();
  }
}
