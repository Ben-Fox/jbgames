// map.js — Tile map, terrain generation, environment objects, camera
const GameMap = (() => {
  // Tile types
  const T = { GRASS:0, GRASS2:1, GRASS3:2, DIRT:3, DIRT2:4, FLOWER:5, ROCK_FLOOR:6, MOSS:7, PUDDLE:8, SAND:9 };
  const TILE_COLORS = {
    [T.GRASS]: '#3a7d44', [T.GRASS2]: '#4a8d54', [T.GRASS3]: '#2d6b37',
    [T.DIRT]: '#8b7355', [T.DIRT2]: '#7a6548', [T.FLOWER]: '#3a7d44',
    [T.ROCK_FLOOR]: '#6b6b6b', [T.MOSS]: '#3d7a3d', [T.PUDDLE]: '#3a5f8a',
    [T.SAND]: '#c2b280'
  };
  
  let tiles = [];
  let envObjects = []; // trees, rocks, bushes, etc.
  let camera = { x: 0, y: 0 };
  let rng;
  
  function generate(seed = 42) {
    rng = seededRandom(seed);
    tiles = [];
    envObjects = [];
    
    for (let y = 0; y < MAP_H; y++) {
      tiles[y] = [];
      for (let x = 0; x < MAP_W; x++) {
        const r = rng();
        const distFromCenter = Math.hypot(x - MAP_W/2, y - MAP_H/2);
        
        // Dirt paths radiating from center
        const angle = Math.atan2(y - MAP_H/2, x - MAP_W/2);
        const onPath = (Math.abs(Math.sin(angle * 2)) < 0.15) && distFromCenter > 5 && distFromCenter < 25;
        
        if (onPath) {
          tiles[y][x] = r < 0.3 ? T.DIRT2 : T.DIRT;
        } else if (distFromCenter < 4) {
          tiles[y][x] = T.SAND; // crystal area
        } else if (r < 0.05) {
          tiles[y][x] = T.FLOWER;
        } else if (r < 0.1) {
          tiles[y][x] = T.PUDDLE;
        } else if (r < 0.15) {
          tiles[y][x] = T.ROCK_FLOOR;
        } else if (r < 0.22) {
          tiles[y][x] = T.MOSS;
        } else if (r < 0.45) {
          tiles[y][x] = T.GRASS2;
        } else if (r < 0.65) {
          tiles[y][x] = T.GRASS3;
        } else {
          tiles[y][x] = T.GRASS;
        }
      }
    }
    
    // Generate environment objects
    for (let y = 2; y < MAP_H - 2; y++) {
      for (let x = 2; x < MAP_W - 2; x++) {
        const dc = Math.hypot(x - MAP_W/2, y - MAP_H/2);
        if (dc < 6) continue; // keep center clear for base
        const r = rng();
        
        if (r < 0.02 && dc > 8) {
          envObjects.push({ type: 'tree_large', tx: x, ty: y, variant: Math.floor(rng()*3), sway: rng()*Math.PI*2, hp: 20, maxHp: 20 });
        } else if (r < 0.045 && dc > 7) {
          envObjects.push({ type: 'tree_small', tx: x, ty: y, variant: Math.floor(rng()*2), sway: rng()*Math.PI*2, hp: 12, maxHp: 12 });
        } else if (r < 0.06) {
          envObjects.push({ type: 'bush', tx: x, ty: y, variant: Math.floor(rng()*3), hp: 5, maxHp: 5 });
        } else if (r < 0.07) {
          envObjects.push({ type: 'rock', tx: x, ty: y, size: rng()*0.5+0.5, hp: 15, maxHp: 15 });
        } else if (r < 0.075 && dc > 10) {
          envObjects.push({ type: 'crystal_deposit', tx: x, ty: y, glow: rng()*Math.PI*2, hp: 20, maxHp: 20 });
        } else if (r < 0.08) {
          envObjects.push({ type: 'mushroom', tx: x, ty: y, color: rng() < 0.5 ? '#e74c3c' : '#f39c12' });
        } else if (r < 0.085 && dc > 8) {
          envObjects.push({ type: 'stump', tx: x, ty: y, hp: 6, maxHp: 6 });
        } else if (r < 0.09 && dc > 10) {
          envObjects.push({ type: 'fallen_log', tx: x, ty: y, angle: rng()*Math.PI, hp: 8, maxHp: 8 });
        } else if (r < 0.1) {
          envObjects.push({ type: 'tall_grass', tx: x, ty: y, sway: rng()*Math.PI*2 });
        } else if (r < 0.105) {
          envObjects.push({ type: 'boulder', tx: x, ty: y, size: rng()*0.4+0.8, hp: 25, maxHp: 25 });
        }
      }
    }
  }
  
  function isEnvBlocking(tx, ty) {
    return envObjects.some(o => o.tx === tx && o.ty === ty && 
      (o.type === 'tree_large' || o.type === 'tree_small' || o.type === 'rock' || o.type === 'boulder'));
  }
  
  function removeEnvAt(tx, ty) {
    envObjects = envObjects.filter(o => !(o.tx === tx && o.ty === ty));
  }
  
  function updateCamera(px, py, canvasW, canvasH) {
    camera.x = clamp(px - canvasW / 2, 0, MAP_PX_W - canvasW);
    camera.y = clamp(py - canvasH / 2, 0, MAP_PX_H - canvasH);
  }
  
  function drawTerrain(ctx, canvasW, canvasH) {
    const startTx = Math.floor(camera.x / TILE);
    const startTy = Math.floor(camera.y / TILE);
    const endTx = Math.min(MAP_W, startTx + Math.ceil(canvasW / TILE) + 2);
    const endTy = Math.min(MAP_H, startTy + Math.ceil(canvasH / TILE) + 2);
    
    for (let ty = startTy; ty < endTy; ty++) {
      for (let tx = startTx; tx < endTx; tx++) {
        if (ty < 0 || tx < 0 || ty >= MAP_H || tx >= MAP_W) continue;
        const sx = tx * TILE - camera.x;
        const sy = ty * TILE - camera.y;
        ctx.fillStyle = TILE_COLORS[tiles[ty][tx]] || '#3a7d44';
        ctx.fillRect(sx, sy, TILE + 1, TILE + 1);
        
        // Flowers
        if (tiles[ty][tx] === T.FLOWER) {
          const colors = ['#ff6b6b','#feca57','#ff9ff3','#fff'];
          ctx.fillStyle = colors[(tx*7+ty*13) % colors.length];
          ctx.fillRect(sx + 12, sy + 10, 4, 4);
          ctx.fillRect(sx + 20, sy + 18, 3, 3);
        }
        // Puddle shine
        if (tiles[ty][tx] === T.PUDDLE) {
          ctx.fillStyle = 'rgba(150,200,255,0.3)';
          ctx.fillRect(sx + 8, sy + 6, 6, 3);
        }
      }
    }
  }
  
  function drawEnvObjects(ctx, time, nightAmount) {
    for (const o of envObjects) {
      const sx = o.tx * TILE - camera.x;
      const sy = o.ty * TILE - camera.y;
      if (sx < -64 || sy < -64 || sx > ctx.canvas.width + 64 || sy > ctx.canvas.height + 64) continue;
      
      const sway = Math.sin(time * 0.001 + (o.sway || 0)) * 2;
      
      switch (o.type) {
        case 'tree_large':
          // Trunk
          ctx.fillStyle = '#5d4037';
          ctx.fillRect(sx + 12, sy + 10, 8, 22);
          // Canopy
          ctx.fillStyle = ['#2d7a2d','#1e6b1e','#3d8a3d'][o.variant];
          ctx.beginPath();
          ctx.arc(sx + 16 + sway, sy + 4, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = ['#238b23','#1a7a1a','#2d9a2d'][o.variant];
          ctx.beginPath();
          ctx.arc(sx + 16 + sway - 4, sy + 0, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'tree_small':
          ctx.fillStyle = '#6d5037';
          ctx.fillRect(sx + 13, sy + 14, 6, 18);
          ctx.fillStyle = o.variant ? '#3a8a3a' : '#2a7a2a';
          ctx.beginPath();
          ctx.arc(sx + 16 + sway * 0.7, sy + 10, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'bush':
          ctx.fillStyle = ['#2d6b2d','#3d7b3d','#4d6b2d'][o.variant];
          ctx.beginPath();
          ctx.arc(sx + 16 + sway * 0.3, sy + 20, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = ['#3d7b3d','#4d8b4d','#5d7b3d'][o.variant];
          ctx.beginPath();
          ctx.arc(sx + 14 + sway * 0.3, sy + 18, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'rock':
          ctx.fillStyle = '#777';
          ctx.beginPath();
          const rs = o.size * 10;
          ctx.ellipse(sx + 16, sy + 22, rs, rs * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#999';
          ctx.beginPath();
          ctx.ellipse(sx + 14, sy + 20, rs * 0.5, rs * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'boulder':
          ctx.fillStyle = '#666';
          const bs = o.size * 14;
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 18, bs, bs * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#888';
          ctx.beginPath();
          ctx.ellipse(sx + 12, sy + 14, bs * 0.4, bs * 0.3, -0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'crystal_deposit':
          const glow = Math.sin(time * 0.002 + o.glow) * 0.3 + 0.7;
          if (nightAmount > 0.3) {
            ctx.fillStyle = `rgba(100,200,255,${glow * 0.3 * nightAmount})`;
            ctx.beginPath();
            ctx.arc(sx + 16, sy + 16, 16, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = `rgba(100,200,255,${glow})`;
          ctx.fillRect(sx + 10, sy + 12, 5, 12);
          ctx.fillRect(sx + 17, sy + 14, 4, 10);
          ctx.fillRect(sx + 13, sy + 10, 3, 8);
          ctx.fillStyle = `rgba(180,230,255,${glow})`;
          ctx.fillRect(sx + 11, sy + 12, 2, 4);
          break;
        case 'mushroom':
          ctx.fillStyle = '#ddd';
          ctx.fillRect(sx + 15, sy + 22, 3, 8);
          ctx.fillStyle = o.color;
          ctx.beginPath();
          ctx.arc(sx + 16, sy + 22, 6, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillRect(sx + 13, sy + 19, 2, 2);
          ctx.fillRect(sx + 18, sy + 20, 2, 2);
          break;
        case 'stump':
          ctx.fillStyle = '#5d4037';
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 24, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#7d5a47';
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 22, 7, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#8d6a57';
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 22, 4, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'fallen_log':
          ctx.save();
          ctx.translate(sx + 16, sy + 20);
          ctx.rotate(o.angle);
          ctx.fillStyle = '#5d4037';
          ctx.fillRect(-16, -4, 32, 8);
          ctx.fillStyle = '#7d5a47';
          ctx.fillRect(-16, -4, 32, 3);
          ctx.restore();
          break;
        case 'tall_grass':
          ctx.fillStyle = '#4a9d44';
          for (let i = 0; i < 5; i++) {
            const gx = sx + 8 + i * 4;
            const gs = Math.sin(time * 0.002 + o.sway + i) * 3;
            ctx.fillRect(gx + gs, sy + 10, 2, 16);
          }
          break;
      }
    }
  }
  
  // Damage a gatherable environment object. Returns resource drop when destroyed.
  function gatherHit(tx, ty, gatherType, dmg) {
    const obj = envObjects.find(o => o.tx === tx && o.ty === ty);
    if (!obj || obj.hp === undefined) return null;
    
    const woodTypes = ['tree_large', 'tree_small', 'stump', 'fallen_log', 'bush'];
    const stoneTypes = ['rock', 'boulder'];
    const crystalTypes = ['crystal_deposit'];
    
    const isWood = woodTypes.includes(obj.type);
    const isStone = stoneTypes.includes(obj.type) || crystalTypes.includes(obj.type);
    
    if (gatherType === 'wood' && !isWood) return null;
    if (gatherType === 'stone' && !isStone) return null;
    
    obj.hp -= dmg;
    
    // Show hit particles
    const px = tx * TILE + TILE / 2;
    const py = ty * TILE + TILE / 2;
    Particles.hitSparks(px, py);
    
    // Not destroyed yet — return partial indicator
    if (obj.hp > 0) return { hit: true, hp: obj.hp, maxHp: obj.maxHp, x: px, y: py };
    
    // Destroyed! Drop resources
    removeEnvAt(tx, ty);
    Particles.deathPoof(px, py, isWood ? '#8b6914' : '#888');
    
    let resource, amount;
    if (obj.type === 'tree_large') { resource = 'wood'; amount = 5; }
    else if (obj.type === 'tree_small') { resource = 'wood'; amount = 3; }
    else if (obj.type === 'bush') { resource = 'wood'; amount = 1; }
    else if (obj.type === 'stump') { resource = 'wood'; amount = 1; }
    else if (obj.type === 'fallen_log') { resource = 'wood'; amount = 2; }
    else if (obj.type === 'boulder') { resource = 'stone'; amount = 5; }
    else if (obj.type === 'rock') { resource = 'stone'; amount = 3; }
    else if (obj.type === 'crystal_deposit') { resource = 'crystal'; amount = 2; }
    
    return { destroyed: true, resource, amount, x: px, y: py };
  }
  
  // Draw HP bar for damaged env objects
  function drawEnvHpBars(ctx) {
    for (const o of envObjects) {
      if (o.hp !== undefined && o.hp < o.maxHp) {
        const sx = o.tx * TILE + TILE / 2 - camera.x;
        const sy = o.ty * TILE - camera.y;
        const barW = 24;
        ctx.fillStyle = '#333';
        ctx.fillRect(sx - barW / 2, sy - 4, barW, 4);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(sx - barW / 2, sy - 4, barW * (o.hp / o.maxHp), 4);
      }
    }
  }
  
  return {
    T, tiles: () => tiles, envObjects: () => envObjects, camera: () => camera,
    generate, isEnvBlocking, removeEnvAt, gatherHit, drawEnvHpBars, updateCamera, drawTerrain, drawEnvObjects,
    isWalkable(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
      return !isEnvBlocking(tx, ty);
    }
  };
})();
