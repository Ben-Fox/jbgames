// player.js — Player movement, combat, inventory, dodge
const Player = (() => {
  const SPEED = 150;
  const DODGE_SPEED = 350;
  const DODGE_DUR = 0.2;
  const DODGE_CD = 0.8;
  const PICKUP_RANGE = 40;
  
  let state = {};
  
  function init() {
    state = {
      x: MAP_PX_W / 2, y: MAP_PX_H / 2,
      w: 20, h: 20,
      hp: 100, maxHp: 100,
      speed: SPEED,
      facing: 1, // 1=right, -1=left
      attacking: false, attackTimer: 0, attackCd: 0,
      dodging: false, dodgeTimer: 0, dodgeCd: 0, dodgeDir: { x: 0, y: 0 },
      invincible: false, invTimer: 0,
      weapon: 'wooden_sword',
      armor: 'none',
      armorBonus: 0,
      hotbar: ['wooden_sword', null, null, null, null, null, null, null, null],
      hotbarIdx: 0,
      resources: { wood: 20, stone: 10, iron: 0, crystal: 0 },
      drops: { shadow_dust: 0, dark_chitin: 0, void_shards: 0, corruption_gel: 0, shadow_silk: 0, dark_steel: 0, umbra_core: 0 },
      inventory: [], // crafted items
      kills: 0,
      arrows: 0,
      voidArrows: 0
    };
  }
  
  const WEAPONS = {
    wooden_sword: { name: 'Wooden Sword', dmg: 5, speed: 0.35, range: 36, type: 'melee', color: '#a0522d' },
    stone_axe: { name: 'Stone Axe', dmg: 8, speed: 0.5, range: 38, type: 'melee', color: '#888' },
    iron_blade: { name: 'Iron Blade', dmg: 15, speed: 0.45, range: 42, type: 'melee', color: '#b0b0b0' },
    crystal_sword: { name: 'Crystal Sword', dmg: 25, speed: 0.3, range: 44, type: 'melee', color: '#66ccff' },
    wooden_bow: { name: 'Wooden Bow', dmg: 7, speed: 0.8, range: 250, type: 'ranged', color: '#8b6914', ammo: 'arrows' },
    iron_crossbow: { name: 'Iron Crossbow', dmg: 18, speed: 0.6, range: 300, type: 'ranged', color: '#777', ammo: 'arrows' },
    umbra_blade: { name: 'Umbra Blade', dmg: 35, speed: 0.25, range: 48, type: 'melee', color: '#9b59b6' }
  };
  
  const ARMORS = {
    none: { name: 'None', bonus: 0 },
    chitin_armor: { name: 'Chitin Armor', bonus: 30 },
    dark_steel_armor: { name: 'Dark Steel Armor', bonus: 60, speedMult: 0.8 }
  };
  
  function equip(itemId) {
    if (WEAPONS[itemId]) {
      state.weapon = itemId;
      // Add to hotbar if not there
      if (!state.hotbar.includes(itemId)) {
        const empty = state.hotbar.indexOf(null);
        if (empty >= 0) state.hotbar[empty] = itemId;
      }
    } else if (ARMORS[itemId]) {
      state.armor = itemId;
      state.armorBonus = ARMORS[itemId].bonus;
      state.maxHp = 100 + state.armorBonus;
      state.hp = Math.min(state.hp, state.maxHp);
      state.speed = SPEED * (ARMORS[itemId].speedMult || 1);
    }
  }
  
  function addToInventory(itemId) {
    if (!state.inventory.includes(itemId)) state.inventory.push(itemId);
    equip(itemId);
  }
  
  function addResource(type, amount) {
    if (state.resources[type] !== undefined) state.resources[type] += amount;
    else if (state.drops[type] !== undefined) state.drops[type] += amount;
  }
  
  function hasResources(costs) {
    for (const [k, v] of Object.entries(costs)) {
      const have = state.resources[k] !== undefined ? state.resources[k] : (state.drops[k] || 0);
      if (have < v) return false;
    }
    return true;
  }
  
  function spendResources(costs) {
    for (const [k, v] of Object.entries(costs)) {
      if (state.resources[k] !== undefined) state.resources[k] -= v;
      else if (state.drops[k] !== undefined) state.drops[k] -= v;
    }
  }
  
  function update(dt, keys, mouseWorld) {
    // Dodge
    if (state.dodging) {
      state.dodgeTimer -= dt;
      state.x += state.dodgeDir.x * DODGE_SPEED * dt;
      state.y += state.dodgeDir.y * DODGE_SPEED * dt;
      if (state.dodgeTimer <= 0) {
        state.dodging = false;
        state.invincible = false;
      }
    } else {
      // Movement
      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy = -1;
      if (keys['s'] || keys['arrowdown']) dy = 1;
      if (keys['a'] || keys['arrowleft']) dx = -1;
      if (keys['d'] || keys['arrowright']) dx = 1;
      
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len; dy /= len;
        const nx = state.x + dx * state.speed * dt;
        const ny = state.y + dy * state.speed * dt;
        
        // Collision check
        const ntx = Math.floor(nx / TILE);
        const nty = Math.floor(ny / TILE);
        
        const canMoveX = canWalk(state.x + dx * state.speed * dt, state.y);
        const canMoveY = canWalk(state.x, state.y + dy * state.speed * dt);
        
        if (canMoveX) state.x += dx * state.speed * dt;
        if (canMoveY) state.y += dy * state.speed * dt;
        
        if (dx !== 0) state.facing = dx > 0 ? 1 : -1;
      }
    }
    
    state.x = clamp(state.x, 10, MAP_PX_W - 10);
    state.y = clamp(state.y, 10, MAP_PX_H - 10);
    
    // Dodge cooldown
    if (state.dodgeCd > 0) state.dodgeCd -= dt;
    
    // Attack cooldown
    if (state.attackCd > 0) state.attackCd -= dt;
    if (state.attacking) {
      state.attackTimer -= dt;
      if (state.attackTimer <= 0) state.attacking = false;
    }
    
    // Invincibility
    if (state.invTimer > 0) {
      state.invTimer -= dt;
      if (state.invTimer <= 0) state.invincible = false;
    }
    
    // Face mouse
    if (mouseWorld) {
      state.facing = mouseWorld.x > state.x ? 1 : -1;
    }
    
    // Heal near crystal during day
    if (!Lighting.isNight()) {
      const crystalDist = dist(state, { x: MAP_PX_W / 2, y: MAP_PX_H / 2 });
      if (crystalDist < 100) {
        state.hp = Math.min(state.maxHp, state.hp + 3 * dt);
      }
    }
  }
  
  function canWalk(nx, ny) {
    const margin = 8;
    // Check corners
    const points = [
      { x: nx - margin, y: ny - margin },
      { x: nx + margin, y: ny - margin },
      { x: nx - margin, y: ny + margin },
      { x: nx + margin, y: ny + margin }
    ];
    for (const p of points) {
      const tx = Math.floor(p.x / TILE);
      const ty = Math.floor(p.y / TILE);
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
      if (GameMap.isEnvBlocking(tx, ty)) return false;
      if (Building.isBlocking(tx, ty)) return false;
    }
    return true;
  }
  
  function dodge(keys) {
    if (state.dodgeCd > 0 || state.dodging) return;
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;
    if (dx === 0 && dy === 0) dx = state.facing;
    const len = Math.hypot(dx, dy) || 1;
    state.dodgeDir = { x: dx / len, y: dy / len };
    state.dodging = true;
    state.dodgeTimer = DODGE_DUR;
    state.dodgeCd = DODGE_CD;
    state.invincible = true;
    state.invTimer = DODGE_DUR;
    Audio.dodge();
  }
  
  function attack(mouseWorld) {
    if (state.attackCd > 0 || state.attacking) return null;
    const w = WEAPONS[state.weapon];
    if (!w) return null;
    
    state.attacking = true;
    state.attackTimer = 0.15;
    state.attackCd = w.speed;
    Audio.swing();
    
    if (w.type === 'ranged') {
      const ammoKey = w.ammo === 'arrows' ? 'arrows' : 'voidArrows';
      if (state[ammoKey] <= 0 && state.arrows <= 0) { Audio.error(); return null; }
      if (state[ammoKey] > 0) state[ammoKey]--;
      else state.arrows--;
      Audio.shoot();
      const angle = angleTo(state, mouseWorld);
      return { type: 'projectile', x: state.x, y: state.y, angle, dmg: w.dmg, range: w.range, speed: 400, color: w.color };
    }
    
    // Melee hit zone
    const angle = angleTo(state, mouseWorld);
    return { type: 'melee', x: state.x + Math.cos(angle) * 20, y: state.y + Math.sin(angle) * 20, radius: w.range, dmg: w.dmg, angle, knockback: 5 };
  }
  
  function takeDamage(amount) {
    if (state.invincible || state.dodging) return false;
    state.hp -= amount;
    state.invincible = true;
    state.invTimer = 0.3;
    Audio.playerHit();
    Particles.shake(6);
    Particles.damageNumber(state.x, state.y - 15, amount, '#ff4444');
    return state.hp <= 0;
  }
  
  function draw(ctx, cam) {
    const sx = state.x - cam.x;
    const sy = state.y - cam.y;
    
    // Dodge trail
    if (state.dodging) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#4af';
      ctx.fillRect(sx - 10, sy - 10, 20, 20);
      ctx.globalAlpha = 1;
    }
    
    // Blink when invincible
    if (state.invincible && !state.dodging && Math.floor(Date.now() / 80) % 2) return;
    
    // Body
    ctx.fillStyle = '#3498db';
    ctx.fillRect(sx - 8, sy - 10, 16, 20);
    
    // Head
    ctx.fillStyle = '#f5c890';
    ctx.fillRect(sx - 5, sy - 16, 10, 8);
    
    // Eyes
    ctx.fillStyle = '#333';
    ctx.fillRect(sx + (state.facing > 0 ? 1 : -4), sy - 14, 2, 2);
    
    // Weapon
    const w = WEAPONS[state.weapon];
    if (w) {
      ctx.fillStyle = w.color;
      if (state.attacking) {
        const swingAngle = (state.attackTimer / 0.15) * Math.PI * 0.5 * state.facing;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(swingAngle - Math.PI * 0.25 * state.facing);
        ctx.fillRect(state.facing * 8, -2, state.facing * 16, 3);
        ctx.restore();
      } else {
        ctx.fillRect(sx + state.facing * 8, sy - 4, state.facing * 12, 3);
      }
    }
    
    // Armor indicator
    if (state.armor !== 'none') {
      ctx.strokeStyle = state.armor === 'dark_steel_armor' ? '#555' : '#8b6914';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 9, sy - 11, 18, 22);
    }
  }
  
  return {
    init, update, dodge, attack, takeDamage, draw, equip, addToInventory,
    addResource, hasResources, spendResources, canWalk,
    state: () => state,
    WEAPONS, ARMORS
  };
})();
