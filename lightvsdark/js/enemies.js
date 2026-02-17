// enemies.js — Enemy types, AI, spawning, waves, loot
const Enemies = (() => {
  let enemies = [];
  let projectiles = []; // enemy projectiles
  let loot = []; // ground loot
  let corruptionPatches = [];
  let waveActive = false;
  let spawnTimer = 0;
  let waveEnemiesLeft = 0;
  let waveTotal = 0;
  
  const TYPES = {
    shadow_wisp: { name: 'Shadow Wisp', hp: 15, dmg: 5, speed: 90, color: '#9b59b6', size: 10, xp: 1,
      drops: [{ item: 'shadow_dust', chance: 0.7 }, { item: 'shadow_dust', chance: 0.3 }, { item: 'leather', chance: 0.25 }] },
    dark_crawler: { name: 'Dark Crawler', hp: 30, dmg: 10, speed: 60, color: '#2c3e50', size: 14, xp: 2,
      drops: [{ item: 'dark_chitin', chance: 0.5 }, { item: 'dark_chitin', chance: 0.15 }, { item: 'leather', chance: 0.35 }], targetBuildings: true },
    void_archer: { name: 'Void Archer', hp: 20, dmg: 12, speed: 40, color: '#8e44ad', size: 12, xp: 2,
      drops: [{ item: 'void_shards', chance: 0.5 }, { item: 'void_shards', chance: 0.15 }], ranged: true, range: 200, shootCd: 2 },
    corruption_blob: { name: 'Corruption Blob', hp: 50, dmg: 8, speed: 35, color: '#27ae60', size: 16, xp: 3,
      drops: [{ item: 'corruption_gel', chance: 0.4 }, { item: 'corruption_gel', chance: 0.15 }], splits: true },
    night_stalker: { name: 'Night Stalker', hp: 40, dmg: 18, speed: 80, color: '#1a1a2e', size: 13, xp: 3,
      drops: [{ item: 'shadow_silk', chance: 0.4 }, { item: 'shadow_silk', chance: 0.15 }], invisible: true },
    dark_knight: { name: 'Dark Knight', hp: 80, dmg: 20, speed: 50, color: '#34495e', size: 16, xp: 4,
      drops: [{ item: 'dark_steel', chance: 0.35 }, { item: 'dark_steel', chance: 0.15 }], shielded: true },
    umbra_lord: { name: 'Umbra Lord', hp: 300, dmg: 30, speed: 30, color: '#4a0e4e', size: 24, xp: 20,
      drops: [{ item: 'umbra_core', chance: 1 }], boss: true, phases: 3 }
  };
  
  // Mini blob (from corruption blob split)
  const MINI_BLOB = { hp: 20, dmg: 5, speed: 50, color: '#2ecc71', size: 10, xp: 1, drops: [] };
  
  function init() {
    enemies = [];
    projectiles = [];
    loot = [];
    corruptionPatches = [];
    waveActive = false;
    spawnTimer = 0;
  }
  
  function spawnWave(nightNum) {
    waveActive = true;
    spawnTimer = 0;
    
    const isBossNight = nightNum % 5 === 0 && nightNum > 0;
    let count;
    if (nightNum <= 1) count = 6;
    else if (nightNum <= 3) count = 8 + nightNum * 3;
    else count = 12 + nightNum * 4;
    
    waveTotal = count + (isBossNight ? 1 : 0);
    waveEnemiesLeft = waveTotal;
  }
  
  function getSpawnType(nightNum) {
    const r = Math.random();
    if (nightNum <= 1) return 'shadow_wisp';
    if (nightNum === 2) return r < 0.6 ? 'shadow_wisp' : 'dark_crawler';
    if (nightNum === 3) return r < 0.4 ? 'shadow_wisp' : r < 0.7 ? 'dark_crawler' : 'void_archer';
    if (nightNum === 4) return r < 0.25 ? 'shadow_wisp' : r < 0.45 ? 'dark_crawler' : r < 0.65 ? 'void_archer' : r < 0.8 ? 'corruption_blob' : 'night_stalker';
    // Night 5+
    if (r < 0.15) return 'shadow_wisp';
    if (r < 0.3) return 'dark_crawler';
    if (r < 0.45) return 'void_archer';
    if (r < 0.6) return 'corruption_blob';
    if (r < 0.75) return 'night_stalker';
    return 'dark_knight';
  }
  
  function spawnEnemy(type, x, y) {
    const t = TYPES[type] || TYPES.shadow_wisp;
    enemies.push({
      type, ...t,
      x, y, hp: t.hp, maxHp: t.hp,
      attackCd: 0, shootCd: t.shootCd || 0,
      path: null, pathTimer: 0,
      visible: !t.invisible,
      phase: 1, phaseHp: t.hp,
      knockbackX: 0, knockbackY: 0
    });
  }
  
  function spawnAtEdge(type) {
    const side = randInt(0, 3);
    let x, y;
    if (side === 0) { x = randInt(0, MAP_PX_W); y = -20; }
    else if (side === 1) { x = MAP_PX_W + 20; y = randInt(0, MAP_PX_H); }
    else if (side === 2) { x = randInt(0, MAP_PX_W); y = MAP_PX_H + 20; }
    else { x = -20; y = randInt(0, MAP_PX_H); }
    spawnEnemy(type, x, y);
  }
  
  function update(dt, playerState, nightNum) {
    const crystalPos = { x: MAP_PX_W / 2, y: MAP_PX_H / 2 };
    
    // Spawn during wave
    if (waveActive && waveEnemiesLeft > 0) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnTimer = 0.8;
        const isBossNight = nightNum % 5 === 0 && nightNum > 0;
        if (isBossNight && waveEnemiesLeft === 1) {
          spawnAtEdge('umbra_lord');
          Audio.bossCry();
        } else {
          spawnAtEdge(getSpawnType(nightNum));
        }
        waveEnemiesLeft--;
        if (waveEnemiesLeft <= 0) waveActive = false;
      }
    }
    
    // Light sources affect enemies
    const lightSources = Building.getLightSources();
    
    let result = null;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      
      // Knockback
      if (Math.abs(e.knockbackX) > 0.5 || Math.abs(e.knockbackY) > 0.5) {
        e.x += e.knockbackX;
        e.y += e.knockbackY;
        e.knockbackX *= 0.8;
        e.knockbackY *= 0.8;
        continue;
      }
      
      // Night stalker visibility
      if (e.invisible) {
        e.visible = dist(e, playerState) < 80;
      }
      
      // Light avoidance (slow down near lights)
      let lightSlow = 1;
      for (const ls of lightSources) {
        const d = dist(e, ls);
        if (d < ls.radius) {
          lightSlow = Math.min(lightSlow, 0.4);
          if (e.type === 'shadow_wisp' && d < ls.radius * 0.5) {
            e.hp -= 5 * dt;
          }
        }
      }
      
      // Choose target
      let target;
      if (e.targetBuildings) {
        const nearestBuilding = Building.getNearestDamageable(e.x, e.y);
        target = nearestBuilding || (dist(e, crystalPos) < dist(e, playerState) ? crystalPos : playerState);
      } else {
        target = dist(e, playerState) < dist(e, crystalPos) ? playerState : crystalPos;
      }
      
      // Boss phases
      if (e.boss && e.phase < e.phases) {
        const threshold = e.maxHp * (1 - e.phase / e.phases);
        if (e.hp <= threshold) {
          e.phase++;
          e.speed += 10;
          e.dmg += 5;
          for (let j = 0; j < 3; j++) {
            spawnEnemy('shadow_wisp', e.x + randFloat(-50, 50), e.y + randFloat(-50, 50));
          }
          Particles.shake(10);
          Audio.bossCry();
        }
      }
      
      // Move toward target
      const d = dist(e, target);
      if (e.ranged && d < e.range && d > 60) {
        // Stay at range
      } else if (d > (e.ranged ? e.range : 20)) {
        const angle = angleTo(e, target);
        e.x += Math.cos(angle) * e.speed * lightSlow * dt;
        e.y += Math.sin(angle) * e.speed * lightSlow * dt;
      }
      
      // Attack cooldown
      e.attackCd -= dt;
      if (e.attackCd <= 0) {
        let attacked = false;
        
        // Priority: attack player if in melee range
        if (!attacked && dist(e, playerState) < 28 + e.size) {
          e.attackCd = 1;
          attacked = true;
          if (!result) result = { type: 'playerHit', dmg: e.dmg };
        }
        
        // Attack buildings if targeting them
        if (!attacked && e.targetBuildings) {
          const nearB = Building.getNearestDamageable(e.x, e.y);
          if (nearB && dist(e, nearB) < 30 + e.size) {
            e.attackCd = 1.5;
            attacked = true;
            Building.damage(nearB.tx, nearB.ty, e.dmg);
          }
        }
        
        // Attack crystal if in range (wider range since crystal is 3x3 tiles)
        if (!attacked && dist(e, crystalPos) < 60 + e.size) {
          e.attackCd = 1;
          attacked = true;
          if (!result) result = { type: 'crystalHit', dmg: e.dmg };
        }
      }
      
      // Ranged shooting (separate cooldown)
      if (e.ranged) {
        e.shootCd -= dt;
        if (e.shootCd <= 0 && dist(e, playerState) < (e.range || 200)) {
          e.shootCd = TYPES[e.type]?.shootCd || 2;
          const angle = angleTo(e, playerState);
          projectiles.push({
            x: e.x, y: e.y, vx: Math.cos(angle) * 150, vy: Math.sin(angle) * 150,
            dmg: e.dmg, life: 3, color: '#8e44ad'
          });
        }
      }
    }
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { projectiles.splice(i, 1); continue; }
      if (dist(p, playerState) < 15) {
        projectiles.splice(i, 1);
        return { type: 'playerHit', dmg: p.dmg };
      }
    }
    
    // Corruption patches
    for (let i = corruptionPatches.length - 1; i >= 0; i--) {
      const c = corruptionPatches[i];
      c.life -= dt;
      if (c.life <= 0) { corruptionPatches.splice(i, 1); continue; }
      // Damage player standing on corruption
      if (dist(c, playerState) < 20) {
        return { type: 'playerHit', dmg: 2 * dt };
      }
    }
    
    // Auto-collect loot
    for (let i = loot.length - 1; i >= 0; i--) {
      const l = loot[i];
      l.life -= dt;
      if (l.life <= 0) { loot.splice(i, 1); continue; }
      if (dist(l, playerState) < 40) {
        Player.addResource(l.item, l.amount);
        Audio.pickup();
        Particles.lootGlow(l.x, l.y, l.color);
        const displayName = l.item.replace(/_/g, ' ');
        Particles.damageNumber(l.x, l.y - 12, '+' + l.amount + ' ' + displayName, l.color);
        loot.splice(i, 1);
      }
    }
    
    return result;
  }
  
  function hitEnemy(attackInfo) {
    let hit = false;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      let isHit = false;
      
      if (attackInfo.type === 'melee') {
        isHit = dist(e, attackInfo) < attackInfo.radius;
      }
      
      if (!isHit) continue;
      
      // Shielded: reduce damage from front
      let dmg = attackInfo.dmg;
      if (e.shielded) {
        const playerAngle = angleTo(e, Player.state());
        const attackAngle = attackInfo.angle;
        const diff = Math.abs(playerAngle - attackAngle);
        if (diff > Math.PI * 0.7) dmg = Math.floor(dmg * 0.3); // blocked
      }
      
      e.hp -= dmg;
      hit = true;
      Audio.hit();
      Particles.hitSparks(e.x, e.y);
      Particles.damageNumber(e.x, e.y - 10, dmg, '#ffd700');
      Particles.shake(3);
      
      // Knockback
      const kb = attackInfo.knockback || 3;
      const angle = angleTo(attackInfo, e);
      e.knockbackX = Math.cos(angle) * kb;
      e.knockbackY = Math.sin(angle) * kb;
      
      if (e.hp <= 0) {
        killEnemy(i);
      }
    }
    return hit;
  }
  
  function hitEnemyProjectile(proj) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (dist(e, proj) < e.size + 5) {
        e.hp -= proj.dmg;
        Audio.hit();
        Particles.hitSparks(e.x, e.y);
        Particles.damageNumber(e.x, e.y - 10, proj.dmg, '#ffd700');
        if (e.hp <= 0) killEnemy(i);
        return true;
      }
    }
    return false;
  }
  
  function killEnemy(idx) {
    const e = enemies[idx];
    Audio.enemyDie();
    Particles.deathPoof(e.x, e.y, e.color);
    Player.state().kills++;
    
    // Drops
    const drops = e.drops || TYPES[e.type]?.drops || [];
    for (const d of drops) {
      if (chance(d.chance)) {
        const COLORS = { shadow_dust: '#9b59b6', dark_chitin: '#2c3e50', void_shards: '#8e44ad',
          corruption_gel: '#27ae60', shadow_silk: '#1a1a4e', dark_steel: '#555', umbra_core: '#ff6bff', leather: '#8b6914' };
        loot.push({
          x: e.x + randFloat(-15, 15), y: e.y + randFloat(-15, 15),
          item: d.item, amount: 1, life: 30, color: COLORS[d.item] || '#fff'
        });
      }
    }
    
    // Corruption patch
    if (chance(0.3)) {
      corruptionPatches.push({ x: e.x, y: e.y, life: 20, radius: 20 });
    }
    
    // Split blobs
    if (e.splits) {
      for (let j = 0; j < 2; j++) {
        const mb = { ...MINI_BLOB, type: 'mini_blob', x: e.x + randFloat(-20, 20), y: e.y + randFloat(-20, 20),
          maxHp: MINI_BLOB.hp, attackCd: 0, knockbackX: 0, knockbackY: 0, path: null, pathTimer: 0, visible: true };
        enemies.push(mb);
      }
    }
    
    enemies.splice(idx, 1);
  }
  
  function cleanupDead() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].hp <= 0) {
        killEnemy(i);
      }
    }
  }
  
  function retreatAll() {
    // Dawn: enemies flee to edges
    for (const e of enemies) {
      const angle = angleTo({ x: MAP_PX_W / 2, y: MAP_PX_H / 2 }, e);
      e.x += Math.cos(angle) * 500;
      e.y += Math.sin(angle) * 500;
    }
    enemies = enemies.filter(e => e.x > -50 && e.x < MAP_PX_W + 50 && e.y > -50 && e.y < MAP_PX_H + 50);
    enemies = [];
    projectiles = [];
    waveActive = false;
  }
  
  function draw(ctx, cam) {
    // Corruption patches
    for (const c of corruptionPatches) {
      const sx = c.x - cam.x;
      const sy = c.y - cam.y;
      const alpha = Math.min(1, c.life / 5);
      ctx.fillStyle = `rgba(40,10,60,${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(sx, sy, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(80,20,100,${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(sx, sy, c.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Loot
    for (const l of loot) {
      const sx = l.x - cam.x;
      const sy = l.y - cam.y;
      const bob = Math.sin(Date.now() * 0.005) * 3;
      ctx.fillStyle = l.color;
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.003) * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy + bob, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    // Enemies
    for (const e of enemies) {
      if (!e.visible && dist(e, Player.state()) > 80) continue;
      const sx = e.x - cam.x;
      const sy = e.y - cam.y;
      if (sx < -30 || sy < -30 || sx > ctx.canvas.width + 30 || sy > ctx.canvas.height + 30) continue;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + e.size, e.size * 0.8, e.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      if (e.invisible && !e.visible) {
        ctx.globalAlpha = 0.15;
      }
      
      ctx.fillStyle = e.color;
      if (e.boss) {
        // Boss — larger, more detailed
        ctx.beginPath();
        ctx.arc(sx, sy, e.size, 0, Math.PI * 2);
        ctx.fill();
        // Crown
        ctx.fillStyle = '#ff0';
        ctx.fillRect(sx - 8, sy - e.size - 6, 4, 6);
        ctx.fillRect(sx + 4, sy - e.size - 6, 4, 6);
        ctx.fillRect(sx - 2, sy - e.size - 8, 4, 8);
        // Eyes
        ctx.fillStyle = '#f00';
        ctx.fillRect(sx - 6, sy - 4, 4, 4);
        ctx.fillRect(sx + 2, sy - 4, 4, 4);
      } else if (e.shielded) {
        // Dark Knight — square with shield
        ctx.fillRect(sx - e.size / 2, sy - e.size / 2, e.size, e.size);
        ctx.fillStyle = '#888';
        ctx.fillRect(sx - e.size / 2 - 4, sy - e.size / 2, 4, e.size); // shield
      } else if (e.type === 'void_archer') {
        ctx.beginPath();
        ctx.moveTo(sx, sy - e.size);
        ctx.lineTo(sx + e.size, sy + e.size);
        ctx.lineTo(sx - e.size, sy + e.size);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, e.size / 2 + 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Eyes (non-boss)
      if (!e.boss) {
        ctx.fillStyle = '#f44';
        ctx.fillRect(sx - 3, sy - 3, 2, 2);
        ctx.fillRect(sx + 1, sy - 3, 2, 2);
      }
      
      ctx.globalAlpha = 1;
      
      // HP bar
      if (e.hp < e.maxHp) {
        const barW = e.size * 1.5;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx - barW / 2, sy - e.size - 8, barW, 4);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(sx - barW / 2, sy - e.size - 8, barW * (e.hp / e.maxHp), 4);
      }
    }
    
    // Enemy projectiles
    for (const p of projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cam.x, p.y - cam.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  return {
    init, update, hitEnemy, hitEnemyProjectile, spawnWave, retreatAll, cleanupDead, draw,
    enemies: () => enemies, loot: () => loot,
    waveActive: () => waveActive || enemies.length > 0,
    enemyCount: () => enemies.length
  };
})();
