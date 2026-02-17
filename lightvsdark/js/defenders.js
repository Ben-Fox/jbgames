// defenders.js — Defensive units (Archer, Pikeman, Knight) that auto-attack enemies
const Defenders = (() => {
  let defenders = [];
  let defendMode = false;
  let selectedDefender = null;
  
  const TYPES = {
    archer: {
      name: 'Archer', hp: 40, maxHp: 40, dmg: 8, range: 180, attackRate: 2,
      speed: 0, patrolRadius: 30, color: '#5dade2', size: 8,
      cost: { wood: 15, iron: 10, bronze: 5 },
      requires: 'barracks', ranged: true
    },
    pikeman: {
      name: 'Pikeman', hp: 60, maxHp: 60, dmg: 12, range: 30, attackRate: 1.2,
      speed: 0, patrolRadius: 20, color: '#3498db', size: 9,
      cost: { wood: 10, iron: 15, bronze: 5 },
      requires: 'barracks', ranged: false
    },
    knight: {
      name: 'Knight', hp: 100, maxHp: 100, dmg: 20, range: 30, attackRate: 1.0,
      speed: 40, patrolRadius: 120, color: '#2c3e80', size: 10,
      cost: { steel: 10, bronze: 10, dark_steel: 5 },
      requires: 'castle', ranged: false
    }
  };
  
  function init() {
    defenders = [];
    defendMode = false;
    selectedDefender = null;
  }
  
  function hasBuilding(type) {
    return Building.buildings().some(b => b.type === type);
  }
  
  function canRecruit(type) {
    const t = TYPES[type];
    if (!t) return false;
    if (!hasBuilding(t.requires)) return false;
    return Player.hasResources(t.cost);
  }
  
  function place(type, x, y) {
    const t = TYPES[type];
    if (!t) return false;
    if (!canRecruit(type)) return false;
    
    Player.spendResources(t.cost);
    Audio.build();
    
    defenders.push({
      type, x, y,
      homeX: x, homeY: y,
      hp: t.maxHp, maxHp: t.maxHp,
      attackCd: 0,
      target: null,
      dmg: t.dmg, range: t.range, attackRate: t.attackRate,
      speed: t.speed, patrolRadius: t.patrolRadius,
      ranged: t.ranged,
      hitFlash: 0,
      facing: 'right'
    });
    
    Effects.log(`${t.name} deployed!`, '#5dade2');
    Particles.buildBurst(x, y, t.color);
    return true;
  }
  
  function update(dt) {
    const enemies = Enemies.enemies();
    const isNight = Lighting.isNight();
    
    for (let i = defenders.length - 1; i >= 0; i--) {
      const d = defenders[i];
      const t = TYPES[d.type];
      
      // Hit flash decay
      if (d.hitFlash > 0) d.hitFlash -= dt;
      
      // Heal from fountain
      for (const b of Building.buildings()) {
        const bt = Building.TYPES[b.type];
        if (bt && bt.heals) {
          const bx = b.tx * TILE + TILE / 2;
          const by = b.ty * TILE + TILE / 2;
          if (dist(d, { x: bx, y: by }) < bt.healRange) {
            d.hp = Math.min(d.maxHp, d.hp + bt.healRate * dt);
          }
        }
      }
      
      // Find target
      d.target = null;
      if (isNight && enemies.length > 0) {
        let nearestDist = d.ranged ? d.range : d.patrolRadius;
        for (const e of enemies) {
          const dd = dist(d, e);
          if (dd < nearestDist) {
            nearestDist = dd;
            d.target = e;
          }
        }
      }
      
      // Knight: move toward target
      if (d.speed > 0 && d.target) {
        const dd = dist(d, d.target);
        if (dd > d.range) {
          const angle = angleTo(d, d.target);
          d.x += Math.cos(angle) * d.speed * dt;
          d.y += Math.sin(angle) * d.speed * dt;
          d.facing = Math.cos(angle) > 0 ? 'right' : 'left';
        }
      } else if (d.speed > 0 && !d.target) {
        // Return home
        const homeDist = dist(d, { x: d.homeX, y: d.homeY });
        if (homeDist > 10) {
          const angle = angleTo(d, { x: d.homeX, y: d.homeY });
          d.x += Math.cos(angle) * d.speed * 0.5 * dt;
          d.y += Math.sin(angle) * d.speed * 0.5 * dt;
        }
      }
      
      // Attack
      d.attackCd -= dt;
      if (d.target && d.attackCd <= 0) {
        const dd = dist(d, d.target);
        if (dd < (d.ranged ? d.range : d.range + 10)) {
          d.attackCd = d.attackRate;
          d.target.hp -= d.dmg;
          d.target.hitFlash = 0.12;
          
          if (d.ranged) {
            // Visual: projectile handled as particle
            Particles.spawn(d.x, d.y, 1, '#5dade2', 0, 0.1, 2);
            Particles.hitSparks(d.target.x, d.target.y);
          } else {
            Particles.hitSparks(d.target.x, d.target.y);
          }
          
          Particles.damageNumber(d.target.x, d.target.y - 10, d.dmg, '#5dade2');
          
          // Facing
          d.facing = d.target.x > d.x ? 'right' : 'left';
          
          if (d.target.hp <= 0) {
            Effects.log(`${t.name} killed ${d.target.name || d.target.type}!`, '#5dade2');
          }
        }
      }
    }
  }
  
  function takeDamage(defender, amount) {
    defender.hp -= amount;
    defender.hitFlash = 0.15;
    Particles.damageNumber(defender.x, defender.y - 12, Math.round(amount), '#ff6b6b');
    
    const t = TYPES[defender.type];
    if (defender.hp <= 0) {
      Effects.log(`${t.name} was slain!`, '#e74c3c');
      Particles.deathPoof(defender.x, defender.y, t.color);
      Audio.enemyDie();
      defenders = defenders.filter(d => d !== defender);
    } else {
      Effects.log(`${t.name} took ${Math.round(amount)} damage!`, '#ff9999');
    }
  }
  
  // Called by enemies to attack nearby defenders
  function getNearestDefender(x, y, range) {
    let nearest = null, minD = range || 200;
    for (const d of defenders) {
      const dd = dist(d, { x, y });
      if (dd < minD) { minD = dd; nearest = d; }
    }
    return nearest;
  }
  
  function draw(ctx, cam) {
    for (const d of defenders) {
      const t = TYPES[d.type];
      const sx = d.x - cam.x;
      const sy = d.y - cam.y;
      if (sx < -30 || sy < -30 || sx > ctx.canvas.width + 30 || sy > ctx.canvas.height + 30) continue;
      
      const fx = d.facing === 'right' ? 1 : -1;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + t.size + 2, t.size * 0.7, t.size * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Hit flash
      if (d.hitFlash > 0 && Math.floor(Date.now() / 80) % 2) {
        ctx.fillStyle = '#fff';
      } else {
        ctx.fillStyle = t.color;
      }
      
      if (d.type === 'archer') {
        // Body
        ctx.fillRect(sx - 4, sy - 6, 8, 12);
        // Head
        ctx.fillStyle = '#f5c890';
        ctx.fillRect(sx - 3, sy - 10, 6, 5);
        // Bow
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx + fx * 6, sy - 2, 7, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        // Arrow
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(sx + fx * 3, sy - 1, fx * 10, 1);
      } else if (d.type === 'pikeman') {
        // Body
        ctx.fillRect(sx - 5, sy - 7, 10, 14);
        // Head
        ctx.fillStyle = '#f5c890';
        ctx.fillRect(sx - 3, sy - 12, 6, 6);
        // Helmet
        ctx.fillStyle = '#888';
        ctx.fillRect(sx - 4, sy - 13, 8, 3);
        // Pike
        ctx.fillStyle = '#aaa';
        ctx.fillRect(sx + fx * 5, sy - 18, 2, 24);
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(sx + fx * 6, sy - 18);
        ctx.lineTo(sx + fx * 4, sy - 14);
        ctx.lineTo(sx + fx * 8, sy - 14);
        ctx.closePath();
        ctx.fill();
      } else if (d.type === 'knight') {
        // Armored body
        ctx.fillStyle = d.hitFlash > 0 && Math.floor(Date.now() / 80) % 2 ? '#fff' : '#556';
        ctx.fillRect(sx - 6, sy - 8, 12, 16);
        // Armor plate
        ctx.fillStyle = t.color;
        ctx.fillRect(sx - 5, sy - 6, 10, 12);
        // Helmet
        ctx.fillStyle = '#778';
        ctx.fillRect(sx - 5, sy - 14, 10, 8);
        ctx.fillStyle = '#445';
        ctx.fillRect(sx - 4, sy - 10, 8, 2); // visor slit
        // Sword
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(sx + fx * 7, sy - 8, fx * 12, 3);
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(sx + fx * 5, sy - 10, 3, 7); // handle
      }
      
      // HP bar
      if (d.hp < d.maxHp) {
        const barW = 20;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx - barW / 2, sy - t.size - 14, barW, 3);
        const pct = d.hp / d.maxHp;
        ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(sx - barW / 2, sy - t.size - 14, barW * pct, 3);
      }
    }
  }
  
  function drawGhost(ctx, cam, worldX, worldY, type) {
    const t = TYPES[type];
    if (!t) return;
    const sx = worldX - cam.x;
    const sy = worldY - cam.y;
    const can = canRecruit(type);
    
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = can ? t.color : '#e74c3c';
    ctx.beginPath();
    ctx.arc(sx, sy, t.size + 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Range circle
    if (can && t.ranged) {
      ctx.strokeStyle = 'rgba(93,173,226,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, t.range, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (can && !t.ranged) {
      ctx.strokeStyle = 'rgba(93,173,226,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, t.patrolRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  
  return {
    TYPES, init, place, update, draw, drawGhost,
    takeDamage, getNearestDefender, canRecruit, hasBuilding,
    defenders: () => defenders,
    count: () => defenders.length,
    defendMode: () => defendMode,
    setDefendMode(v) { defendMode = v; },
    selectedDefender: () => selectedDefender,
    setSelected(v) { selectedDefender = v; }
  };
})();
