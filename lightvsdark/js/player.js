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
      facing: 'right',
      attacking: false, attackTimer: 0, attackCd: 0,
      dodging: false, dodgeTimer: 0, dodgeCd: 0, dodgeDir: { x: 0, y: 0 },
      invincible: false, invTimer: 0,
      weapon: 'wooden_sword',
      armor: 'none',
      armorBonus: 0,
      hotbar: ['wooden_sword', null, null, null, null, null, null, null, null],
      hotbarIdx: 0,
      resources: { wood: 20, stone: 10, iron: 0, copper: 0, tin: 0, coal: 0, bronze: 0, steel: 0, crystal: 0 },
      drops: { shadow_dust: 0, dark_chitin: 0, void_shards: 0, corruption_gel: 0, shadow_silk: 0, dark_steel: 0, umbra_core: 0, leather: 0 },
      inventory: [],
      kills: 0,
      arrows: 0,
      voidArrows: 0
    };
  }
  
  const WEAPONS = {
    wooden_sword: { name: 'Wooden Sword', dmg: 5, speed: 0.35, range: 36, type: 'melee', color: '#a0522d', tier: 0 },
    wooden_axe: { name: 'Wooden Axe', dmg: 4, speed: 0.5, range: 34, type: 'melee', color: '#8b6914', gather: 'wood', gatherTier: 1, tier: 0 },
    wooden_pickaxe: { name: 'Wooden Pickaxe', dmg: 3, speed: 0.55, range: 34, type: 'melee', color: '#8b6914', gather: 'stone', gatherTier: 1, tier: 0 },
    stone_axe: { name: 'Stone Axe', dmg: 8, speed: 0.5, range: 38, type: 'melee', color: '#888', gather: 'wood', gatherTier: 2, tier: 1 },
    stone_pickaxe: { name: 'Stone Pickaxe', dmg: 6, speed: 0.55, range: 36, type: 'melee', color: '#999', gather: 'stone', gatherTier: 2, tier: 1 },
    iron_blade: { name: 'Iron Blade', dmg: 15, speed: 0.45, range: 42, type: 'melee', color: '#b0b0b0', tier: 2 },
    iron_axe: { name: 'Iron Axe', dmg: 10, speed: 0.45, range: 38, type: 'melee', color: '#aaa', gather: 'wood', gatherTier: 3, tier: 2 },
    iron_pickaxe: { name: 'Iron Pickaxe', dmg: 8, speed: 0.5, range: 38, type: 'melee', color: '#aaa', gather: 'stone', gatherTier: 3, tier: 2 },
    bronze_sword: { name: 'Bronze Sword', dmg: 18, speed: 0.4, range: 40, type: 'melee', color: '#cd7f32', tier: 3 },
    bronze_axe: { name: 'Bronze Axe', dmg: 12, speed: 0.45, range: 38, type: 'melee', color: '#cd7f32', gather: 'wood', gatherTier: 4, tier: 3 },
    bronze_pickaxe: { name: 'Bronze Pickaxe', dmg: 10, speed: 0.5, range: 38, type: 'melee', color: '#cd7f32', gather: 'stone', gatherTier: 4, tier: 3 },
    steel_sword: { name: 'Steel Sword', dmg: 20, speed: 0.35, range: 44, type: 'melee', color: '#d0d0d0', tier: 4 },
    steel_axe: { name: 'Steel Axe', dmg: 14, speed: 0.4, range: 40, type: 'melee', color: '#d0d0d0', gather: 'wood', gatherTier: 5, tier: 4 },
    steel_pickaxe: { name: 'Steel Pickaxe', dmg: 12, speed: 0.45, range: 40, type: 'melee', color: '#d0d0d0', gather: 'stone', gatherTier: 5, tier: 4 },
    crystal_sword: { name: 'Crystal Sword', dmg: 25, speed: 0.3, range: 44, type: 'melee', color: '#66ccff', tier: 5 },
    wooden_bow: { name: 'Wooden Bow', dmg: 7, speed: 0.8, range: 250, type: 'ranged', color: '#8b6914', ammo: 'arrows', tier: 1 },
    iron_crossbow: { name: 'Iron Crossbow', dmg: 18, speed: 0.6, range: 300, type: 'ranged', color: '#777', ammo: 'arrows', tier: 2 },
    umbra_blade: { name: 'Umbra Blade', dmg: 35, speed: 0.25, range: 48, type: 'melee', color: '#9b59b6', tier: 5 }
  };
  
  // Tool tier requirements for gathering different resource types
  // gatherTier on tool must be >= required tier for the resource
  const GATHER_REQUIREMENTS = {
    // resource node type -> { minTier, toolType, needMessage }
    wood: { minTier: 0, toolType: 'wood', need: null }, // bare hands or any axe
    stone: { minTier: 1, toolType: 'stone', need: 'Wooden Pickaxe' },
    iron_ore: { minTier: 2, toolType: 'stone', need: 'Stone Pickaxe' },
    copper_ore: { minTier: 2, toolType: 'stone', need: 'Stone Pickaxe' },
    tin_ore: { minTier: 2, toolType: 'stone', need: 'Stone Pickaxe' },
    coal: { minTier: 3, toolType: 'stone', need: 'Iron Pickaxe' },
    crystal: { minTier: 4, toolType: 'stone', need: 'Bronze Pickaxe' }
  };
  
  const ARMORS = {
    none: { name: 'None', bonus: 0 },
    leather_armor: { name: 'Leather Armor', bonus: 10 },
    chitin_armor: { name: 'Chitin Armor', bonus: 20 },
    bronze_armor: { name: 'Bronze Armor', bonus: 35, speedMult: 0.95 },
    steel_armor: { name: 'Steel Armor', bonus: 45, speedMult: 0.9 },
    dark_steel_armor: { name: 'Dark Steel Armor', bonus: 60, speedMult: 0.8 }
  };
  
  function equip(itemId) {
    if (WEAPONS[itemId]) {
      state.weapon = itemId;
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
  
  // Check if current tool can gather a resource type, returns { canGather, bonusMultiplier, needMessage }
  function canGatherResource(resourceType) {
    const req = GATHER_REQUIREMENTS[resourceType];
    if (!req) return { canGather: true, bonus: 1, need: null };
    
    const w = WEAPONS[state.weapon];
    if (!w) return { canGather: resourceType === 'wood', bonus: 1, need: req.need };
    
    // Check tool type matches
    if (req.toolType === 'wood' && w.gather !== 'wood') {
      // Any weapon can hit trees for wood, but axes are better
      return { canGather: true, bonus: w.gather === 'wood' ? 1 : 0.5, need: null };
    }
    if (req.toolType === 'stone' && w.gather !== 'stone') {
      return { canGather: false, bonus: 0, need: req.need };
    }
    
    // Check tier
    const toolTier = w.gatherTier || 0;
    if (toolTier < req.minTier) {
      return { canGather: false, bonus: 0, need: req.need };
    }
    
    // Steel pickaxe gets 2x bonus
    const bonus = (toolTier >= 5) ? 2 : 1;
    return { canGather: true, bonus, need: null };
  }
  
  function update(dt, keys, mouseWorld) {
    if (state.dodging) {
      state.dodgeTimer -= dt;
      state.x += state.dodgeDir.x * DODGE_SPEED * dt;
      state.y += state.dodgeDir.y * DODGE_SPEED * dt;
      if (state.dodgeTimer <= 0) {
        state.dodging = false;
        state.invincible = false;
      }
    } else {
      let dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy = -1;
      if (keys['s'] || keys['arrowdown']) dy = 1;
      if (keys['a'] || keys['arrowleft']) dx = -1;
      if (keys['d'] || keys['arrowright']) dx = 1;
      
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len; dy /= len;
        
        const canMoveX = canWalk(state.x + dx * state.speed * dt, state.y);
        const canMoveY = canWalk(state.x, state.y + dy * state.speed * dt);
        
        if (canMoveX) state.x += dx * state.speed * dt;
        if (canMoveY) state.y += dy * state.speed * dt;
      }
    }
    
    state.x = clamp(state.x, 10, MAP_PX_W - 10);
    state.y = clamp(state.y, 10, MAP_PX_H - 10);
    
    if (state.dodgeCd > 0) state.dodgeCd -= dt;
    if (state.attackCd > 0) state.attackCd -= dt;
    if (state.attacking) {
      state.attackTimer -= dt;
      if (state.attackTimer <= 0) state.attacking = false;
    }
    if (state.invTimer > 0) {
      state.invTimer -= dt;
      if (state.invTimer <= 0) state.invincible = false;
    }
    
    if (mouseWorld) {
      const dx = mouseWorld.x - state.x;
      const dy = mouseWorld.y - state.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        state.facing = dx > 0 ? 'right' : 'left';
      } else {
        state.facing = dy > 0 ? 'down' : 'up';
      }
    }
    
    if (!Lighting.isNight()) {
      const crystalDist = dist(state, { x: MAP_PX_W / 2, y: MAP_PX_H / 2 });
      if (crystalDist < 100) {
        state.hp = Math.min(state.maxHp, state.hp + 3 * dt);
      }
    }
  }
  
  function canWalk(nx, ny) {
    const margin = 8;
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
    if (dx === 0 && dy === 0) {
      if (state.facing === 'right') dx = 1;
      else if (state.facing === 'left') dx = -1;
      else if (state.facing === 'up') dy = -1;
      else dy = 1;
    }
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
    let w = WEAPONS[state.weapon];
    if (!w) {
      const fallback = state.hotbar.find(h => h && WEAPONS[h]);
      if (fallback) { state.weapon = fallback; w = WEAPONS[fallback]; }
      else { w = WEAPONS['wooden_sword']; state.weapon = 'wooden_sword'; }
    }
    
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
    
    if (state.dodging) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#4af';
      ctx.fillRect(sx - 10, sy - 10, 20, 20);
      ctx.globalAlpha = 1;
    }
    
    if (state.invincible && !state.dodging && Math.floor(Date.now() / 80) % 2) return;
    
    const f = state.facing;
    const fx = f === 'right' ? 1 : f === 'left' ? -1 : 0;
    const fy = f === 'down' ? 1 : f === 'up' ? -1 : 0;
    
    // Body
    ctx.fillStyle = '#3498db';
    ctx.fillRect(sx - 8, sy - 10, 16, 20);
    
    // Head
    ctx.fillStyle = '#f5c890';
    if (f === 'up') {
      ctx.fillRect(sx - 5, sy - 16, 10, 8);
    } else if (f === 'down') {
      ctx.fillRect(sx - 5, sy - 16, 10, 8);
      ctx.fillStyle = '#333';
      ctx.fillRect(sx - 3, sy - 13, 2, 2);
      ctx.fillRect(sx + 1, sy - 13, 2, 2);
    } else {
      ctx.fillRect(sx - 5, sy - 16, 10, 8);
      ctx.fillStyle = '#333';
      ctx.fillRect(sx + (fx > 0 ? 1 : -4), sy - 14, 2, 2);
    }
    
    // Weapon
    const w = WEAPONS[state.weapon];
    if (w) {
      ctx.fillStyle = w.color;
      if (state.attacking) {
        ctx.save();
        ctx.translate(sx, sy);
        if (f === 'up' || f === 'down') {
          const swingDir = f === 'up' ? 1 : -1;
          const swingAngle = (state.attackTimer / 0.15) * Math.PI * 0.5 * swingDir;
          ctx.rotate(swingAngle);
          ctx.fillRect(-1, fy * 8, 3, fy * 16);
        } else {
          const swingAngle = (state.attackTimer / 0.15) * Math.PI * 0.5 * fx;
          ctx.rotate(swingAngle - Math.PI * 0.25 * fx);
          ctx.fillRect(fx * 8, -2, fx * 16, 3);
        }
        ctx.restore();
      } else {
        if (f === 'up' || f === 'down') {
          ctx.fillRect(sx + (f === 'up' ? 8 : -10), sy + fy * 8, 3, fy * 12);
        } else {
          ctx.fillRect(sx + fx * 8, sy - 4, fx * 12, 3);
        }
      }
    }
    
    // Armor indicator
    if (state.armor !== 'none') {
      const armorColors = {
        leather_armor: '#8b6914',
        chitin_armor: '#8b6914',
        bronze_armor: '#cd7f32',
        steel_armor: '#d0d0d0',
        dark_steel_armor: '#555'
      };
      ctx.strokeStyle = armorColors[state.armor] || '#8b6914';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 9, sy - 11, 18, 22);
    }
  }
  
  return {
    init, update, dodge, attack, takeDamage, draw, equip, addToInventory,
    addResource, hasResources, spendResources, canWalk, canGatherResource,
    state: () => state,
    WEAPONS, ARMORS, GATHER_REQUIREMENTS
  };
})();
