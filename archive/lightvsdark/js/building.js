// building.js — Grid placement, structures, resource generation
const Building = (() => {
  let buildings = [];
  let selectedBuilding = null;
  let buildMode = false;
  
  const TYPES = {
    // Defensive
    wood_wall: { name: 'Wood Wall', cat: 'defensive', hp: 50, cost: { wood: 5 }, color: '#8b6914', desc: 'Basic barrier', blocking: true },
    stone_wall: { name: 'Stone Wall', cat: 'defensive', hp: 120, cost: { stone: 8 }, color: '#888', desc: 'Strong barrier', blocking: true },
    iron_wall: { name: 'Iron Wall', cat: 'defensive', hp: 200, cost: { iron: 5, stone: 3 }, color: '#aaa', desc: 'Heavy barrier', blocking: true },
    wood_gate: { name: 'Wood Gate', cat: 'defensive', hp: 40, cost: { wood: 8 }, color: '#a07020', desc: 'Player walks through, blocks enemies', blocking: false, gateBlock: true },
    spike_trap: { name: 'Spike Trap', cat: 'defensive', hp: Infinity, cost: { wood: 3, iron: 2 }, color: '#666', desc: '10 dmg to enemies', trap: true, trapDmg: 10 },
    arrow_tower: { name: 'Arrow Tower', cat: 'defensive', hp: 80, cost: { wood: 10, iron: 5 }, color: '#8b7355', desc: 'Auto-shoots enemies', tower: true, towerRange: 160, towerDmg: 8, towerRate: 1.5 },
    light_turret: { name: 'Light Turret', cat: 'defensive', hp: 60, cost: { crystal: 5, steel: 3 }, color: '#66ccff', desc: 'Beam attack, strong vs dark', tower: true, towerRange: 140, towerDmg: 15, towerRate: 2, light: true, lightRadius: 80 },
    // Resource
    woodmill: { name: 'Woodmill', cat: 'resource', hp: 60, cost: { wood: 15, stone: 5 }, color: '#6d4c1d', desc: '1 wood / 10s', produces: 'wood', rate: 10 },
    stone_mine: { name: 'Stone Mine', cat: 'resource', hp: 60, cost: { wood: 10, stone: 10 }, color: '#7a7a7a', desc: '1 stone / 15s', produces: 'stone', rate: 15 },
    copper_mine: { name: 'Copper Mine', cat: 'resource', hp: 60, cost: { wood: 10, stone: 8 }, color: '#b87333', desc: '1 copper / 20s', produces: 'copper', rate: 20 },
    tin_mine: { name: 'Tin Mine', cat: 'resource', hp: 60, cost: { wood: 10, stone: 8 }, color: '#c0c0c0', desc: '1 tin / 20s', produces: 'tin', rate: 20 },
    iron_mine: { name: 'Iron Mine', cat: 'resource', hp: 60, cost: { stone: 15, iron: 5 }, color: '#999', desc: '1 iron / 25s', produces: 'iron', rate: 25 },
    coal_mine: { name: 'Coal Mine', cat: 'resource', hp: 60, cost: { stone: 10, iron: 5 }, color: '#333', desc: '1 coal / 30s', produces: 'coal', rate: 30 },
    crystal_extractor: { name: 'Crystal Extractor', cat: 'resource', hp: 60, cost: { steel: 5, crystal: 5 }, color: '#5dade2', desc: '1 crystal / 40s', produces: 'crystal', rate: 40 },
    // Utility
    torch: { name: 'Torch', cat: 'utility', hp: 20, cost: { wood: 2 }, color: '#ff9900', desc: 'Small light, slows enemies', light: true, lightRadius: 64, flicker: true },
    lantern: { name: 'Lantern', cat: 'utility', hp: 40, cost: { iron: 3, crystal: 1 }, color: '#ffdd44', desc: 'Large light radius, safe zone', light: true, lightRadius: 120 },
    workbench: { name: 'Workbench', cat: 'utility', hp: 50, cost: { wood: 10, stone: 5 }, color: '#a0845c', desc: 'Unlocks Tier 1 crafting', station: 1 },
    smelter: { name: 'Smelter', cat: 'utility', hp: 60, cost: { stone: 10, wood: 5 }, color: '#d35400', desc: 'Smelt ores into alloys', station: 0 },
    forge: { name: 'Forge', cat: 'utility', hp: 70, cost: { stone: 10, iron: 10 }, color: '#c0392b', desc: 'Unlocks Tier 2 crafting', station: 2 },
    advanced_forge: { name: 'Advanced Forge', cat: 'utility', hp: 80, cost: { iron: 10, bronze: 5 }, color: '#8b0000', desc: 'Unlocks steel smelting', station: 3 },
    crystal_altar: { name: 'Crystal Altar', cat: 'utility', hp: 80, cost: { iron: 10, crystal: 10 }, color: '#3498db', desc: 'Unlocks Tier 3 crafting', station: 3 },
    healing_fountain: { name: 'Healing Fountain', cat: 'utility', hp: 60, cost: { crystal: 5, stone: 5 }, color: '#2ecc71', desc: 'Heals 2 HP/s nearby', heals: true, healRange: 80, healRate: 2 },
    barracks: { name: 'Barracks', cat: 'utility', hp: 80, cost: { wood: 20, stone: 15, iron: 10 }, color: '#5d6d7e', desc: 'Recruit Archers & Pikemen' },
    castle: { name: 'Castle', cat: 'utility', hp: 120, cost: { stone: 20, iron: 15, steel: 10 }, color: '#7f8c8d', desc: 'Recruit Knights' },
    ballista_tower: { name: 'Ballista Tower', cat: 'defensive', hp: 100, cost: { iron: 15, bronze: 10 }, color: '#6d4c1d', desc: 'Heavy damage tower (25 dmg)', tower: true, towerRange: 220, towerDmg: 25, towerRate: 3 },
    fire_pit: { name: 'Fire Pit', cat: 'utility', hp: 30, cost: { wood: 5, coal: 2 }, color: '#e67e22', desc: 'Light + 3 dmg/s to enemies', light: true, lightRadius: 100, flicker: true, firePit: true, fireDmg: 3 }
  };
  
  function init() {
    buildings = [];
    selectedBuilding = null;
    buildMode = false;
  }
  
  function canPlace(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
    const cx = Math.floor(MAP_W / 2), cy = Math.floor(MAP_H / 2);
    if (Math.abs(tx - cx) <= 1 && Math.abs(ty - cy) <= 1) return false;
    if (buildings.some(b => b.tx === tx && b.ty === ty)) return false;
    if (GameMap.isEnvBlocking(tx, ty)) return false;
    return true;
  }
  
  function place(type, tx, ty) {
    const t = TYPES[type];
    if (!t) return false;
    if (!canPlace(tx, ty)) {
      if (typeof Effects !== 'undefined' && Effects.announce) Effects.announce('❌ Can\'t place here!');
      return false;
    }
    if (!Player.hasResources(t.cost)) {
      if (typeof Effects !== 'undefined' && Effects.announce) Effects.announce('❌ Not enough resources!');
      return false;
    }
    
    Player.spendResources(t.cost);
    GameMap.removeEnvAt(tx, ty);
    
    buildings.push({
      type, tx, ty,
      hp: t.hp, maxHp: t.hp,
      produceTimer: t.rate || 0,
      towerTimer: 0,
      flickerPhase: Math.random() * Math.PI * 2
    });
    
    Audio.build();
    const bx = tx * TILE + TILE / 2;
    const by = ty * TILE + TILE / 2;
    Particles.buildBurst(bx, by, t.color);
    Effects.buildingPlaced(t.name);
    return true;
  }
  
  function isBlocking(tx, ty) {
    return buildings.some(b => b.tx === tx && b.ty === ty && (TYPES[b.type].blocking));
  }
  
  function isGateBlocking(tx, ty) {
    return buildings.some(b => b.tx === tx && b.ty === ty && TYPES[b.type].gateBlock);
  }
  
  function damage(tx, ty, dmg) {
    const b = buildings.find(b => b.tx === tx && b.ty === ty);
    if (!b) return;
    if (b.hp === Infinity) return;
    b.hp -= dmg;
    Particles.hitSparks(tx * TILE + TILE / 2, ty * TILE + TILE / 2);
    if (b.hp <= 0) {
      Particles.deathPoof(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#8b6914');
      Effects.buildingDestroyed(TYPES[b.type].name);
      buildings = buildings.filter(bb => bb !== b);
    }
  }
  
  function repair(playerX, playerY) {
    const px = Math.floor(playerX / TILE);
    const py = Math.floor(playerY / TILE);
    for (const b of buildings) {
      if (Math.abs(b.tx - px) <= 1 && Math.abs(b.ty - py) <= 1 && b.hp < b.maxHp && b.hp !== Infinity) {
        const t = TYPES[b.type];
        const repairCost = {};
        for (const [k, v] of Object.entries(t.cost)) repairCost[k] = Math.ceil(v / 2);
        if (Player.hasResources(repairCost)) {
          Player.spendResources(repairCost);
          b.hp = b.maxHp;
          Audio.repair();
          Particles.buildDust(b.tx * TILE + TILE / 2, b.ty * TILE + TILE / 2);
          return true;
        }
      }
    }
    return false;
  }
  
  function getNearestDamageable(x, y) {
    let nearest = null, minD = Infinity;
    for (const b of buildings) {
      if (b.hp === Infinity) continue;
      const bx = b.tx * TILE + TILE / 2;
      const by = b.ty * TILE + TILE / 2;
      const d = dist({ x, y }, { x: bx, y: by });
      if (d < minD) { minD = d; nearest = { ...b, x: bx, y: by }; }
    }
    return nearest;
  }
  
  function getLightSources() {
    const sources = [];
    sources.push({
      x: MAP_PX_W / 2, y: MAP_PX_H / 2,
      radius: 100 + Math.sin(Date.now() * 0.002) * 10,
      intensity: 1, flicker: false, flickerPhase: 0
    });
    
    for (const b of buildings) {
      const t = TYPES[b.type];
      if (t.light) {
        sources.push({
          x: b.tx * TILE + TILE / 2, y: b.ty * TILE + TILE / 2,
          radius: t.lightRadius, intensity: 0.85,
          flicker: t.flicker || false, flickerPhase: b.flickerPhase
        });
      }
    }
    return sources;
  }
  
  function getMaxCraftTier() {
    let tier = 0;
    for (const b of buildings) {
      const t = TYPES[b.type];
      if (t.station && t.station > tier) tier = t.station;
    }
    return tier;
  }
  
  function update(dt) {
    const ps = Player.state();
    const resColors = { wood: '#8b6914', stone: '#888', iron: '#bbb', copper: '#b87333', tin: '#c0c0c0', coal: '#555', crystal: '#66ccff' };
    
    for (const b of buildings) {
      const t = TYPES[b.type];
      
      if (t.produces) {
        b.produceTimer -= dt;
        if (b.produceTimer <= 0) {
          b.produceTimer = t.rate;
          Player.addResource(t.produces, 1);
          const bx = b.tx * TILE + TILE / 2;
          const by = b.ty * TILE + TILE / 2;
          Particles.damageNumber(bx, by - 16, '+1 ' + t.produces, resColors[t.produces] || '#2ecc71');
          Effects.pulseResource(t.produces);
        }
      }
      
      if (t.tower) {
        b.towerTimer -= dt;
        if (b.towerTimer <= 0) {
          const bx = b.tx * TILE + TILE / 2;
          const by = b.ty * TILE + TILE / 2;
          const target = findNearestEnemy(bx, by, t.towerRange);
          if (target) {
            b.towerTimer = t.towerRate;
            target.hp -= t.towerDmg;
            Particles.hitSparks(target.x, target.y);
            Particles.damageNumber(target.x, target.y - 10, t.towerDmg, '#ffa500');
          }
        }
      }
      
      if (t.trap) {
        const bx = b.tx * TILE + TILE / 2;
        const by = b.ty * TILE + TILE / 2;
        for (const e of Enemies.enemies()) {
          if (dist(e, { x: bx, y: by }) < 18) {
            e.hp -= t.trapDmg * dt;
            if (Math.random() < 0.05) Particles.hitSparks(e.x, e.y);
          }
        }
      }
      
      if (t.firePit) {
        const bx = b.tx * TILE + TILE / 2;
        const by = b.ty * TILE + TILE / 2;
        for (const e of Enemies.enemies()) {
          if (dist(e, { x: bx, y: by }) < t.lightRadius) {
            e.hp -= t.fireDmg * dt;
            if (Math.random() < 0.02) Particles.hitSparks(e.x, e.y);
          }
        }
      }
      
      if (t.heals) {
        const bx = b.tx * TILE + TILE / 2;
        const by = b.ty * TILE + TILE / 2;
        if (dist(ps, { x: bx, y: by }) < t.healRange) {
          ps.hp = Math.min(ps.maxHp, ps.hp + t.healRate * dt);
        }
      }
    }
  }
  
  function findNearestEnemy(x, y, range) {
    let nearest = null, minD = range;
    for (const e of Enemies.enemies()) {
      const d = dist({ x, y }, e);
      if (d < minD) { minD = d; nearest = e; }
    }
    return nearest;
  }
  
  function draw(ctx, cam) {
    for (const b of buildings) {
      const t = TYPES[b.type];
      const sx = b.tx * TILE - cam.x;
      const sy = b.ty * TILE - cam.y;
      if (sx < -TILE || sy < -TILE || sx > ctx.canvas.width + TILE || sy > ctx.canvas.height + TILE) continue;
      
      ctx.fillStyle = t.color;
      
      if (t.blocking) {
        // Draw wall with connections to adjacent walls
        ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
        // Check neighbors for wall connections
        const hasLeft = buildings.some(bb => TYPES[bb.type]?.blocking && bb.tx === b.tx - 1 && bb.ty === b.ty);
        const hasRight = buildings.some(bb => TYPES[bb.type]?.blocking && bb.tx === b.tx + 1 && bb.ty === b.ty);
        const hasUp = buildings.some(bb => TYPES[bb.type]?.blocking && bb.tx === b.tx && bb.ty === b.ty - 1);
        const hasDown = buildings.some(bb => TYPES[bb.type]?.blocking && bb.tx === b.tx && bb.ty === b.ty + 1);
        // Extend to connect with neighbors
        if (hasLeft) ctx.fillRect(sx, sy + 4, 4, TILE - 8);
        if (hasRight) ctx.fillRect(sx + TILE - 4, sy + 4, 4, TILE - 8);
        if (hasUp) ctx.fillRect(sx + 4, sy, TILE - 8, 4);
        if (hasDown) ctx.fillRect(sx + 4, sy + TILE - 4, TILE - 8, 4);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(sx + 2, sy + TILE - 6, TILE - 4, 4);
      } else if (t.gateBlock) {
        ctx.fillRect(sx + 1, sy + 1, TILE - 2, 6);
        ctx.fillRect(sx + 1, sy + TILE - 7, TILE - 2, 6);
        ctx.fillRect(sx + 1, sy + 1, 6, TILE - 2);
        ctx.fillRect(sx + TILE - 7, sy + 1, 6, TILE - 2);
      } else if (t.trap) {
        ctx.fillStyle = '#555';
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            ctx.fillRect(sx + 4 + i * 7, sy + 4 + j * 7, 3, 3);
          }
        }
      } else if (t.tower) {
        ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = t.light ? '#88ddff' : '#666';
        ctx.fillRect(sx + 10, sy + 2, TILE - 20, 6);
      } else if (t.light) {
        const flicker = t.flicker ? Math.sin(Date.now() * 0.01 + b.flickerPhase) * 2 : 0;
        ctx.fillStyle = '#444';
        ctx.fillRect(sx + 14, sy + 12, 4, 18);
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(sx + 16, sy + 10 + flicker, 6, 0, Math.PI * 2);
        ctx.fill();
        if (Lighting.nightAmount() > 0.1) {
          ctx.fillStyle = `rgba(255,200,50,${0.1 * Lighting.nightAmount()})`;
          ctx.beginPath();
          ctx.arc(sx + 16, sy + 10, t.lightRadius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (t.heals) {
        ctx.fillStyle = '#5dade2';
        ctx.beginPath();
        ctx.arc(sx + TILE / 2, sy + TILE / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#85c1e9';
        const bob = Math.sin(Date.now() * 0.003) * 2;
        ctx.beginPath();
        ctx.arc(sx + TILE / 2, sy + TILE / 2 - 4 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.station) {
        ctx.fillRect(sx + 3, sy + 8, TILE - 6, TILE - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(sx + 5, sy + 10, TILE - 10, 4);
        // Smelter/forge glow
        if (b.type === 'smelter' || b.type === 'advanced_forge' || b.type === 'forge') {
          ctx.fillStyle = 'rgba(255,100,0,0.3)';
          ctx.beginPath();
          ctx.arc(sx + TILE / 2, sy + TILE / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (b.type === 'barracks') {
        ctx.fillRect(sx + 2, sy + 4, TILE - 4, TILE - 6);
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(sx + 4, sy + 6, TILE - 8, 4);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚔', sx + TILE/2, sy + TILE/2 + 6);
      } else if (b.type === 'castle') {
        ctx.fillRect(sx + 2, sy + 4, TILE - 4, TILE - 6);
        // Turrets
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(sx, sy, 6, 10);
        ctx.fillRect(sx + TILE - 6, sy, 6, 10);
        ctx.fillRect(sx + TILE/2 - 3, sy - 2, 6, 8);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏰', sx + TILE/2, sy + TILE/2 + 6);
      } else if (b.type === 'fire_pit') {
        // Fire pit base
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(sx + TILE/2, sy + TILE/2 + 4, 10, 0, Math.PI * 2);
        ctx.fill();
        // Flames
        const flicker = Math.sin(Date.now() * 0.015 + b.flickerPhase);
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(sx + TILE/2, sy + TILE/2 + flicker, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(sx + TILE/2, sy + TILE/2 - 3 + flicker, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(sx + TILE/2, sy + TILE/2 - 5 + flicker, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.produces) {
        ctx.fillRect(sx + 2, sy + 6, TILE - 4, TILE - 8);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(sx + TILE - 10, sy + 2, 6, 8);
        // Working animation - spinning gear
        const spin = (Date.now() * 0.003) % (Math.PI * 2);
        ctx.save();
        ctx.translate(sx + TILE - 7, sy + 6);
        ctx.rotate(spin);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (let g = 0; g < 4; g++) {
          ctx.fillRect(-1, -4, 2, 3);
          ctx.rotate(Math.PI / 2);
        }
        ctx.restore();
      }
      
      if (b.hp !== Infinity && b.hp < b.maxHp) {
        const pct = b.hp / b.maxHp;
        // Damage cracks overlay
        if (pct < 0.75) {
          ctx.strokeStyle = `rgba(0,0,0,${0.5 * (1 - pct)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx + 4, sy + 4); ctx.lineTo(sx + TILE/2, sy + TILE/2);
          if (pct < 0.5) { ctx.moveTo(sx + TILE - 4, sy + 6); ctx.lineTo(sx + TILE/2 + 2, sy + TILE - 4); }
          if (pct < 0.25) { ctx.moveTo(sx + 2, sy + TILE - 2); ctx.lineTo(sx + TILE - 2, sy + 4); }
          ctx.stroke();
        }
        // HP bar
        ctx.fillStyle = '#333';
        ctx.fillRect(sx, sy - 5, TILE, 3);
        ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(sx, sy - 5, TILE * pct, 3);
      }
    }
  }
  
  function drawGhost(ctx, cam, tx, ty) {
    if (!selectedBuilding) return;
    const t = TYPES[selectedBuilding];
    if (!t) return;
    const sx = tx * TILE - cam.x;
    const sy = ty * TILE - cam.y;
    const ok = canPlace(tx, ty) && Player.hasResources(t.cost);
    
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ok ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.globalAlpha = 1;
    
    if (t.tower && ok) {
      ctx.strokeStyle = 'rgba(255,165,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx + TILE / 2, sy + TILE / 2, t.towerRange, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (t.light && ok) {
      ctx.strokeStyle = 'rgba(255,200,50,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx + TILE / 2, sy + TILE / 2, t.lightRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  function drawCrystal(ctx, cam) {
    const cx = MAP_PX_W / 2 - cam.x;
    const cy = MAP_PX_H / 2 - cam.y;
    const pulse = Math.sin(Date.now() * 0.003) * 3;
    
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 + pulse);
    grad.addColorStop(0, 'rgba(100,200,255,0.4)');
    grad.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 40 + pulse, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#66ccff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 20 - pulse);
    ctx.lineTo(cx + 12, cy);
    ctx.lineTo(cx, cy + 14);
    ctx.lineTo(cx - 12, cy);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#aaddff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 20 - pulse);
    ctx.lineTo(cx + 6, cy - 5);
    ctx.lineTo(cx, cy + 14);
    ctx.closePath();
    ctx.fill();
  }
  
  return {
    TYPES, init, canPlace, place, isBlocking, isGateBlocking, damage, repair,
    getNearestDamageable, getLightSources, getMaxCraftTier, update, draw, drawGhost, drawCrystal,
    buildings: () => buildings,
    buildMode: () => buildMode,
    setBuildMode(v) { buildMode = v; },
    selectedBuilding: () => selectedBuilding,
    setSelected(v) { selectedBuilding = v; },
    buildingCount: () => buildings.length
  };
})();
