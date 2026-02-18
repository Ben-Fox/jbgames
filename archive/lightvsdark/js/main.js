// main.js — Game loop, initialization, input handling
const Game = (() => {
  let canvas, ctx;
  let running = false;
  let lastTime = 0;
  let keys = {};
  let mouse = { x: 0, y: 0, down: false };
  let mouseWorld = { x: 0, y: 0 };
  let playerProjectiles = [];
  let wildlife = [];
  let gameMode = 'normal'; // normal or endless
  let crystalHp = 200;
  let crystalMaxHp = 200;
  let waveSpawned = false;
  let gameOver = false;
  
  const WIN_NIGHT = 10;
  
  function init(mode) {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    
    gameMode = mode;
    gameOver = false;
    crystalHp = 200;
    waveSpawned = false;
    playerProjectiles = [];
    wildlife = [];
    
    GameMap.generate(Date.now() % 10000);
    Lighting.init();
    Particles.init();
    Player.init();
    Enemies.init();
    Building.init();
    Defenders.init();
    Effects.init();
    
    // Spawn wildlife
    for (let i = 0; i < 15; i++) {
      wildlife.push({
        x: randFloat(100, MAP_PX_W - 100),
        y: randFloat(100, MAP_PX_H - 100),
        type: Math.random() < 0.6 ? 'rabbit' : 'bird',
        vx: 0, vy: 0,
        wanderTimer: randFloat(0, 3),
        fleeing: false, fleeTimer: 0
      });
    }
    UI.init();
    
    // Skip to night button
    document.getElementById('skip-night-btn').onclick = () => { if (Lighting.phase() === 'day') Lighting.skipToNight(); };
    
    // Menu button
    document.getElementById('menu-btn').onclick = () => { returnToMenu(); };
    
    // Give starting resources message
    Audio.init();
    
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    
    if (!gameOver) {
      try { update(dt); } catch(err) { console.error('Update error:', err); }
    }
    try { draw(); } catch(err) { console.error('Draw error:', err); }
    requestAnimationFrame(loop);
  }
  
  function update(dt) {
    const ps = Player.state();
    
    // Update day/night cycle
    Lighting.update(dt);
    
    // Wave spawning
    const phase = Lighting.phase();
    if (phase === 'night' && !waveSpawned) {
      waveSpawned = true;
      Enemies.spawnWave(Lighting.nightCount());
      Effects.nightBegins(Lighting.nightCount());
    }
    if (phase === 'dawn' && waveSpawned) {
      waveSpawned = false;
      Enemies.retreatAll();
      Effects.dawnArrives();
    }
    // Check wave complete (all enemies dead during night, no more spawning)
    if (phase === 'night' && !Enemies.waveActive() && Enemies.enemyCount() === 0 && waveSpawned) {
      // already handled by dawn
    }
    
    // Win condition
    if (gameMode === 'normal' && Lighting.nightCount() >= WIN_NIGHT && phase === 'day') {
      gameOver = true;
      UI.showGameOver(true, `You survived ${WIN_NIGHT} nights!`);
      return;
    }
    
    // Update player
    Player.update(dt, keys, mouseWorld);
    
    // Camera
    GameMap.updateCamera(ps.x, ps.y, canvas.width, canvas.height);
    
    // Update mouse world position
    const cam = GameMap.camera();
    mouseWorld.x = mouse.x + cam.x;
    mouseWorld.y = mouse.y + cam.y;
    
    // Update buildings
    Building.update(dt);
    
    // Update defenders
    Defenders.update(dt);
    
    // Cleanse check
    if (ps._cleanse) {
      ps._cleanse = false;
      // Remove corruption patches near player (handled via Enemies internals - just clear nearby)
    }
    
    // Update wildlife
    if (Lighting.phase() === 'day') {
      for (const w of wildlife) {
        const dToPlayer = dist(w, ps);
        if (dToPlayer < 80 && !w.fleeing) {
          w.fleeing = true;
          w.fleeTimer = 2;
          const angle = angleTo(ps, w);
          w.vx = Math.cos(angle) * 80;
          w.vy = Math.sin(angle) * 80;
        }
        if (w.fleeing) {
          w.x += w.vx * dt;
          w.y += w.vy * dt;
          w.fleeTimer -= dt;
          w.vx *= 0.98;
          w.vy *= 0.98;
          if (w.fleeTimer <= 0) { w.fleeing = false; w.vx = 0; w.vy = 0; }
        } else {
          w.wanderTimer -= dt;
          if (w.wanderTimer <= 0) {
            w.wanderTimer = randFloat(2, 5);
            w.vx = randFloat(-15, 15);
            w.vy = randFloat(-15, 15);
          }
          w.x += w.vx * dt;
          w.y += w.vy * dt;
        }
        w.x = clamp(w.x, 10, MAP_PX_W - 10);
        w.y = clamp(w.y, 10, MAP_PX_H - 10);
      }
    }
    
    // Update enemies
    const enemyResult = Enemies.update(dt, ps, Lighting.nightCount());
    if (enemyResult) {
      if (enemyResult.type === 'playerHit') {
        const dead = Player.takeDamage(enemyResult.dmg);
        Effects.flashScreen('rgba(255,0,0,1)', 0.3, 3);
        if (enemyResult.fromX !== undefined) {
          Effects.addDamageIndicator(enemyResult.fromX, enemyResult.fromY, ps.x, ps.y);
        }
        if (enemyResult.enemyName) {
          Effects.enemyHitPlayer(enemyResult.enemyName, enemyResult.dmg);
        }
        if (dead) {
          gameOver = true;
          UI.showGameOver(false, 'You were slain!');
          return;
        }
      } else if (enemyResult.type === 'crystalHit') {
        crystalHp -= enemyResult.dmg;
        Particles.shake(5);
        Particles.hitSparks(MAP_PX_W / 2, MAP_PX_H / 2);
        if (crystalHp <= 0) {
          gameOver = true;
          UI.showGameOver(false, 'The Light Crystal was destroyed!');
          return;
        }
      }
    }
    
    // Clean up dead enemies (from tower/trap damage)
    Enemies.cleanupDead();
    
    // Update player projectiles
    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
      const p = playerProjectiles[i];
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      p.dist = (p.dist || 0) + p.speed * dt;
      if (p.dist > p.range) { playerProjectiles.splice(i, 1); continue; }
      if (Enemies.hitEnemyProjectile(p)) { playerProjectiles.splice(i, 1); continue; }
    }
    
    // Particles
    Particles.update(dt);
    Particles.updateAmbient(Lighting.nightAmount(), cam, canvas.width, canvas.height);
    
    // Effects
    Effects.update(dt);
    
    // UI
    UI.updateHUD();
    UI.drawMinimap(ps);
  }
  
  function draw() {
    const cam = GameMap.camera();
    const shake = Particles.getShake();
    
    ctx.save();
    ctx.translate(shake.x, shake.y);
    
    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Terrain
    GameMap.drawTerrain(ctx, canvas.width, canvas.height);
    
    // Environment objects (below entities)
    GameMap.drawEnvObjects(ctx, performance.now(), Lighting.nightAmount());
    GameMap.drawEnvHpBars(ctx);
    
    // Buildings
    Building.draw(ctx, cam);
    Building.drawCrystal(ctx, cam);
    
    // Crystal HP bar
    if (crystalHp < crystalMaxHp) {
      const cx = MAP_PX_W / 2 - cam.x;
      const cy = MAP_PX_H / 2 - cam.y - 30;
      ctx.fillStyle = '#333';
      ctx.fillRect(cx - 25, cy, 50, 5);
      ctx.fillStyle = '#66ccff';
      ctx.fillRect(cx - 25, cy, 50 * (crystalHp / crystalMaxHp), 5);
    }
    
    // Wildlife (during day only)
    if (Lighting.phase() === 'day' || Lighting.phase() === 'dawn') {
      for (const w of wildlife) {
        const wx = w.x - cam.x;
        const wy = w.y - cam.y;
        if (wx < -10 || wy < -10 || wx > canvas.width + 10 || wy > canvas.height + 10) continue;
        if (w.type === 'rabbit') {
          ctx.fillStyle = '#c0a080';
          ctx.beginPath();
          ctx.ellipse(wx, wy, 4, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          // Ears
          ctx.fillRect(wx - 2, wy - 5, 1.5, 3);
          ctx.fillRect(wx + 1, wy - 5, 1.5, 3);
        } else {
          // Bird
          ctx.fillStyle = '#6a8caf';
          ctx.beginPath();
          ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
          ctx.fill();
          // Wings
          const flap = Math.sin(Date.now() * 0.02) * 2;
          ctx.strokeStyle = '#6a8caf';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(wx - 4, wy + flap);
          ctx.lineTo(wx, wy);
          ctx.lineTo(wx + 4, wy + flap);
          ctx.stroke();
        }
      }
    }
    
    // Defenders
    Defenders.draw(ctx, cam);
    
    // Enemies
    Enemies.draw(ctx, cam);
    
    // Player
    Player.draw(ctx, cam);
    
    // Player projectiles
    for (const p of playerProjectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cam.x, p.y - cam.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Particles
    Particles.draw(ctx, cam);
    
    // Defend mode ghost
    if (Defenders.defendMode() && Defenders.selectedDefender()) {
      Defenders.drawGhost(ctx, cam, mouseWorld.x, mouseWorld.y, Defenders.selectedDefender());
    }
    
    // Build mode ghost
    if (Building.buildMode() && Building.selectedBuilding()) {
      const tx = Math.floor(mouseWorld.x / TILE);
      const ty = Math.floor(mouseWorld.y / TILE);
      Building.drawGhost(ctx, cam, tx, ty);
    }
    
    // Lighting (darkness overlay)
    Lighting.drawLighting(ctx, canvas.width, canvas.height, Building.getLightSources(), Player.state().x, Player.state().y, cam);
    
    // Effects overlays (damage indicators, screen flash, vignette)
    Effects.draw(ctx, canvas.width, canvas.height);
    
    ctx.restore();
  }
  
  // Input handlers
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    
    if (!running || gameOver) return;
    if (UI.isInventoryOpen() && key !== 'tab') return;
    
    if (key === 'escape') { returnToMenu(); return; }
    if (key === 'tab') { e.preventDefault(); UI.toggleInventory(); }
    else if (key === 'b') { if (Defenders.defendMode()) UI.toggleDefendMode(); UI.toggleBuildMode(); }
    else if (key === 'f' && !Building.buildMode()) { UI.toggleDefendMode(); }
    else if (key === ' ') { e.preventDefault(); Player.dodge(keys); }
    else if (key === 'e') { /* pickup handled automatically */ }
    else if (key === 'r') { Building.repair(Player.state().x, Player.state().y); }
    else if (key === 'n') { if (Lighting.phase() === 'day') Lighting.skipToNight(); }
    else if (key >= '1' && key <= '9') {
      const idx = parseInt(key) - 1;
      const ps = Player.state();
      ps.hotbarIdx = idx;
      const item = ps.hotbar[idx];
      if (item && Player.CONSUMABLES[item]) {
        Player.useConsumable(item);
        UI.updateHotbar();
      } else if (item && Player.WEAPONS[item]) {
        ps.weapon = item;
        if (Building.buildMode()) UI.toggleBuildMode();
        if (Defenders.defendMode()) UI.toggleDefendMode();
      }
      UI.updateHotbar();
    }
  });
  
  document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });
  
  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const cam = GameMap.camera();
    mouseWorld.x = mouse.x + cam.x;
    mouseWorld.y = mouse.y + cam.y;
  });
  
  document.addEventListener('mousedown', e => {
    if (!running || gameOver) return;
    if (e.target.closest('#hud') || e.target.closest('#inventory-screen') || e.target.closest('#build-menu') || e.target.closest('#defend-menu') || e.target.closest('#minimap-container')) return;
    
    mouse.down = true;
    
    if (Defenders.defendMode()) {
      const sel = Defenders.selectedDefender();
      if (sel) {
        Defenders.place(sel, mouseWorld.x, mouseWorld.y);
        UI.updateDefendMenu();
      }
    } else if (Building.buildMode()) {
      const tx = Math.floor(mouseWorld.x / TILE);
      const ty = Math.floor(mouseWorld.y / TILE);
      const sel = Building.selectedBuilding();
      if (sel) {
        Building.place(sel, tx, ty);
        UI.updateBuildMenu();
      }
    } else {
      const result = Player.attack(mouseWorld);
      if (result) {
        if (result.type === 'melee') {
          const hitAny = Enemies.hitEnemy(result);
          // Try gathering mushrooms near attack point
          const mtx = Math.floor(result.x / TILE);
          const mty = Math.floor(result.y / TILE);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const envObjs = GameMap.envObjects();
              const mush = envObjs.find(o => o.tx === mtx + dx && o.ty === mty + dy && o.type === 'mushroom');
              if (mush) {
                Player.addResource('mushroom', 1);
                Audio.pickup();
                const mx = mush.tx * TILE + TILE / 2;
                const my = mush.ty * TILE + TILE / 2;
                Particles.damageNumber(mx, my - 16, '+1 mushroom 🍄', '#e74c3c', false);
                Effects.log('+1 mushroom 🍄', '#e74c3c');
                GameMap.removeEnvAt(mush.tx, mush.ty);
                break;
              }
            }
          }
          // If holding a gathering tool, try gathering env objects
          const w = Player.WEAPONS[Player.state().weapon];
          if (w && w.gather) {
            const tx = Math.floor(result.x / TILE);
            const ty = Math.floor(result.y / TILE);
            let gathered = false;
            for (let dx = -1; dx <= 1 && !gathered; dx++) {
              for (let dy = -1; dy <= 1 && !gathered; dy++) {
                const res = GameMap.gatherHit(tx + dx, ty + dy, w.gather, result.dmg);
                if (res) {
                  gathered = true;
                  if (res.destroyed) {
                    Player.addResource(res.resource, res.amount);
                    Audio.pickup();
                    const icon = { wood:'🪵', stone:'🪨', iron:'⛏️', copper:'🟤', tin:'⬜', coal:'⬛', crystal:'💎' }[res.resource] || '';
                    Particles.damageNumber(res.x, res.y - 16, `+${res.amount} ${res.resource} ${icon}`, '#2ecc71', true);
                    Effects.resourceGathered(res.amount, res.resource);
                    Particles.gatherChips(res.x, res.y, res.resource);
                  } else if (res.hit) {
                    Particles.gatherChips(res.x, res.y, w.gather);
                  }
                }
              }
            }
          }
        } else if (result.type === 'projectile') {
          playerProjectiles.push(result);
        }
      }
    }
  });
  
  document.addEventListener('mouseup', () => { mouse.down = false; });
  
  function returnToMenu() {
    running = false;
    gameOver = true;
    document.getElementById('splash-screen').classList.remove('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
  }
  
  // Splash screen buttons
  document.getElementById('start-btn').addEventListener('click', () => init('normal'));
  document.getElementById('endless-btn').addEventListener('click', () => init('endless'));
  document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('splash-screen').classList.remove('hidden');
  });
  
  return { init };
})();
