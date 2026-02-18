// particles.js — Particle effects, ambient atmosphere
const Particles = (() => {
  let particles = [];
  let ambientParticles = [];
  let screenShake = { x: 0, y: 0, amount: 0, decay: 0.9 };
  let damageNumbers = [];
  
  function init() {
    particles = [];
    ambientParticles = [];
    damageNumbers = [];
    screenShake = { x: 0, y: 0, amount: 0, decay: 0.9 };
  }
  
  function spawn(x, y, count, color, speed, life, size) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life, maxLife: life, color, size: size || 3,
        gravity: 0
      });
    }
  }
  
  function hitSparks(x, y) {
    spawn(x, y, 6, '#ffd700', 3, 0.3, 2);
    spawn(x, y, 3, '#fff', 4, 0.2, 1.5);
  }
  
  function deathPoof(x, y, color = '#8b00ff') {
    spawn(x, y, 12, color, 2.5, 0.5, 4);
    spawn(x, y, 6, '#333', 1.5, 0.6, 3);
  }
  
  function buildDust(x, y) {
    spawn(x, y, 8, '#b8a88a', 1.5, 0.4, 3);
  }
  
  function lootGlow(x, y, color) {
    spawn(x, y, 3, color, 0.5, 0.6, 2);
  }
  
  function shake(amount) {
    screenShake.amount = Math.max(screenShake.amount, amount);
  }
  
  function damageNumber(x, y, amount, color = '#ff4444', big = false) {
    damageNumbers.push({ x, y, amount: typeof amount === 'number' ? Math.round(amount) : amount, color, life: 1.0, maxLife: 1.0, big });
  }

  function gatherChips(x, y, type) {
    const colors = {
      wood: ['#8b6914', '#a0845c', '#6d4c1d'],
      stone: ['#888', '#aaa', '#666'],
      iron: ['#777', '#999', '#555'],
      copper: ['#b87333', '#d4954a', '#8a5522'],
      crystal: ['#66ccff', '#88ddff', '#44aadd']
    };
    const c = colors[type] || colors.stone;
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 3 + 1;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
        life: 0.4, maxLife: 0.4, color: c[i % c.length], size: 2.5,
        gravity: 0.15
      });
    }
  }

  function buildBurst(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const s = 2 + Math.random() * 2;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.5, maxLife: 0.5, color: color || '#f1c40f', size: 3,
        gravity: 0
      });
    }
    spawn(x, y, 6, '#fff', 1.5, 0.3, 2);
  }
  
  function updateAmbient(nightAmount, cam, canvasW, canvasH) {
    // Spawn ambient particles
    const phase = Lighting.phase();
    // Falling leaves near trees during day
    if (phase === 'day' && chance(0.02)) {
      const envObjs = GameMap.envObjects();
      const trees = envObjs.filter(o => (o.type === 'tree_large' || o.type === 'tree_small'));
      if (trees.length > 0) {
        const t = trees[randInt(0, trees.length - 1)];
        const tx = t.tx * TILE + TILE / 2;
        const ty = t.ty * TILE;
        if (tx > cam.x - 50 && tx < cam.x + canvasW + 50 && ty > cam.y - 50 && ty < cam.y + canvasH + 50) {
          ambientParticles.push({
            x: tx + randFloat(-8, 8), y: ty + randFloat(-5, 5),
            vx: randFloat(-0.5, 0.5), vy: randFloat(0.3, 0.8),
            life: 3, maxLife: 3, wobble: Math.random() * Math.PI * 2,
            color: chance(0.5) ? '#6b4' : '#a85', size: 2.5, type: 'leaf'
          });
        }
      }
    }
    if (phase === 'day' && ambientParticles.length < 30) {
      // Pollen/dust
      if (chance(0.1)) {
        ambientParticles.push({
          x: cam.x + Math.random() * canvasW,
          y: cam.y + Math.random() * canvasH,
          vx: randFloat(-0.3, 0.3), vy: randFloat(-0.2, 0.1),
          life: 4, maxLife: 4, color: 'rgba(255,255,200,0.5)', size: 1.5, type: 'pollen'
        });
      }
    }
    if ((phase === 'dusk' || (phase === 'night' && nightAmount > 0.5)) && ambientParticles.length < 25) {
      // Fireflies
      if (chance(0.05)) {
        ambientParticles.push({
          x: cam.x + Math.random() * canvasW,
          y: cam.y + Math.random() * canvasH,
          vx: 0, vy: 0, wobble: Math.random() * Math.PI * 2,
          life: 5, maxLife: 5, color: '#aaff44', size: 2, type: 'firefly'
        });
      }
    }
    if (phase === 'night' && ambientParticles.length < 40) {
      // Fog
      if (chance(0.03)) {
        ambientParticles.push({
          x: cam.x + Math.random() * canvasW,
          y: cam.y + canvasH * 0.5 + Math.random() * canvasH * 0.5,
          vx: randFloat(0.1, 0.4), vy: randFloat(-0.05, 0.05),
          life: 6, maxLife: 6, color: 'rgba(100,100,140,0.15)', size: 30, type: 'fog'
        });
      }
    }
  }
  
  function update(dt) {
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Update ambient
    for (let i = ambientParticles.length - 1; i >= 0; i--) {
      const p = ambientParticles[i];
      if (p.type === 'firefly') {
        p.wobble += 0.05;
        p.x += Math.sin(p.wobble) * 0.5;
        p.y += Math.cos(p.wobble * 0.7) * 0.3;
      } else if (p.type === 'leaf') {
        p.x += p.vx + Math.sin(p.wobble || 0) * 0.3;
        p.y += p.vy;
        p.wobble = (p.wobble || 0) + 0.03;
      } else {
        p.x += p.vx;
        p.y += p.vy;
      }
      p.life -= dt;
      if (p.life <= 0) ambientParticles.splice(i, 1);
    }
    
    // Damage numbers
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
      const d = damageNumbers[i];
      d.y -= 30 * dt;
      d.life -= dt;
      if (d.life <= 0) damageNumbers.splice(i, 1);
    }
    
    // Screen shake
    if (screenShake.amount > 0.1) {
      screenShake.x = (Math.random() - 0.5) * screenShake.amount;
      screenShake.y = (Math.random() - 0.5) * screenShake.amount;
      screenShake.amount *= screenShake.decay;
    } else {
      screenShake.x = 0;
      screenShake.y = 0;
      screenShake.amount = 0;
    }
  }
  
  function draw(ctx, cam) {
    // Regular particles
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cam.x - p.size/2, p.y - cam.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    
    // Ambient
    for (const p of ambientParticles) {
      const alpha = Math.min(1, p.life / p.maxLife * 2) * Math.min(1, (p.maxLife - p.life) * 2);
      const sx = p.x - cam.x;
      const sy = p.y - cam.y;
      if (p.type === 'leaf') {
        p.wobble += 0.04;
        p.x += Math.sin(p.wobble) * 0.4;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(sx, sy, p.size, p.size * 0.5, p.wobble, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'fog') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'firefly') {
        const glow = Math.sin(Date.now() * 0.005 + p.wobble) * 0.4 + 0.6;
        ctx.globalAlpha = alpha * glow;
        ctx.fillStyle = '#aaff44';
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#eeff88';
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(sx - p.size/2, sy - p.size/2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
    
    // Damage numbers
    ctx.textAlign = 'center';
    for (const d of damageNumbers) {
      const alpha = d.life / d.maxLife;
      const scale = d.big ? 1.3 : 1;
      const fontSize = d.big ? 22 : 16;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      const dx = d.x - cam.x;
      const dy = d.y - cam.y;
      ctx.strokeText(d.amount, dx, dy);
      ctx.fillStyle = d.color;
      ctx.fillText(d.amount, dx, dy);
      if (d.big) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#fff';
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeText(d.amount, dx, dy);
      }
    }
    ctx.globalAlpha = 1;
  }
  
  return {
    init, spawn, hitSparks, deathPoof, buildDust, lootGlow, shake, damageNumber,
    gatherChips, buildBurst,
    update, updateAmbient, draw,
    getShake: () => screenShake
  };
})();
