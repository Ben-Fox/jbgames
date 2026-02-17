// map.js — Tile map, terrain generation, environment objects, camera
const GameMap = (() => {
  const T = { GRASS:0, GRASS2:1, GRASS3:2, DIRT:3, DIRT2:4, FLOWER:5, ROCK_FLOOR:6, MOSS:7, PUDDLE:8, SAND:9 };
  const TILE_COLORS = {
    [T.GRASS]: '#3a7d44', [T.GRASS2]: '#4a8d54', [T.GRASS3]: '#2d6b37',
    [T.DIRT]: '#8b7355', [T.DIRT2]: '#7a6548', [T.FLOWER]: '#3a7d44',
    [T.ROCK_FLOOR]: '#6b6b6b', [T.MOSS]: '#3d7a3d', [T.PUDDLE]: '#3a5f8a',
    [T.SAND]: '#c2b280'
  };
  
  let tiles = [];
  let envObjects = [];
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
        
        const angle = Math.atan2(y - MAP_H/2, x - MAP_W/2);
        const onPath = (Math.abs(Math.sin(angle * 2)) < 0.15) && distFromCenter > 5 && distFromCenter < 25;
        
        if (onPath) {
          tiles[y][x] = r < 0.3 ? T.DIRT2 : T.DIRT;
        } else if (distFromCenter < 4) {
          tiles[y][x] = T.SAND;
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
        if (dc < 6) continue;
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
          // Iron ore — darker metallic deposits
          envObjects.push({ type: 'iron_ore', tx: x, ty: y, size: rng()*0.4+0.6, hp: 20, maxHp: 20, resourceType: 'iron_ore' });
        } else if (r < 0.08 && dc > 12) {
          // Copper ore — orange-brown
          envObjects.push({ type: 'copper_ore', tx: x, ty: y, size: rng()*0.4+0.6, hp: 15, maxHp: 15, resourceType: 'copper_ore' });
        } else if (r < 0.085 && dc > 12) {
          // Tin ore — silvery
          envObjects.push({ type: 'tin_ore', tx: x, ty: y, size: rng()*0.4+0.6, hp: 15, maxHp: 15, resourceType: 'tin_ore' });
        } else if (r < 0.088 && dc > 15) {
          // Coal deposit — black
          envObjects.push({ type: 'coal_deposit', tx: x, ty: y, size: rng()*0.4+0.6, hp: 20, maxHp: 20, resourceType: 'coal' });
        } else if (r < 0.091 && dc > 18) {
          // Crystal deposit — rare, far from center
          envObjects.push({ type: 'crystal_deposit', tx: x, ty: y, glow: rng()*Math.PI*2, hp: 25, maxHp: 25, resourceType: 'crystal' });
        } else if (r < 0.095) {
          envObjects.push({ type: 'mushroom', tx: x, ty: y, color: rng() < 0.5 ? '#e74c3c' : '#f39c12' });
        } else if (r < 0.1 && dc > 8) {
          envObjects.push({ type: 'stump', tx: x, ty: y, hp: 6, maxHp: 6 });
        } else if (r < 0.105 && dc > 10) {
          envObjects.push({ type: 'fallen_log', tx: x, ty: y, angle: rng()*Math.PI, hp: 8, maxHp: 8 });
        } else if (r < 0.11) {
          envObjects.push({ type: 'tall_grass', tx: x, ty: y, sway: rng()*Math.PI*2 });
        } else if (r < 0.115) {
          envObjects.push({ type: 'boulder', tx: x, ty: y, size: rng()*0.4+0.8, hp: 25, maxHp: 25 });
        }
      }
    }
  }
  
  function isEnvBlocking(tx, ty) {
    return envObjects.some(o => o.tx === tx && o.ty === ty && 
      (o.type === 'tree_large' || o.type === 'tree_small' || o.type === 'rock' || o.type === 'boulder'
       || o.type === 'iron_ore' || o.type === 'copper_ore' || o.type === 'tin_ore' || o.type === 'coal_deposit'));
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
        
        if (tiles[ty][tx] === T.FLOWER) {
          const colors = ['#ff6b6b','#feca57','#ff9ff3','#fff'];
          ctx.fillStyle = colors[(tx*7+ty*13) % colors.length];
          ctx.fillRect(sx + 12, sy + 10, 4, 4);
          ctx.fillRect(sx + 20, sy + 18, 3, 3);
        }
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
          ctx.fillStyle = '#5d4037';
          ctx.fillRect(sx + 12, sy + 10, 8, 22);
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
          ctx.ellipse(sx + 16, sy + 22, o.size * 10, o.size * 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#999';
          ctx.beginPath();
          ctx.ellipse(sx + 14, sy + 20, o.size * 5, o.size * 3.5, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'boulder':
          ctx.fillStyle = '#666';
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 18, o.size * 14, o.size * 10.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#888';
          ctx.beginPath();
          ctx.ellipse(sx + 12, sy + 14, o.size * 5.6, o.size * 4.2, -0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'iron_ore':
          // Dark metallic rock with reddish tint
          ctx.fillStyle = '#5a5a6a';
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 20, o.size * 10, o.size * 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#8a7060';
          ctx.fillRect(sx + 8, sy + 16, 5, 4);
          ctx.fillRect(sx + 18, sy + 18, 4, 3);
          ctx.fillStyle = '#6a6a7a';
          ctx.fillRect(sx + 12, sy + 14, 6, 3);
          break;
        case 'copper_ore':
          // Orange-brown deposits
          ctx.fillStyle = '#7a6050';
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 20, o.size * 9, o.size * 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#b87333';
          ctx.fillRect(sx + 9, sy + 16, 5, 5);
          ctx.fillRect(sx + 17, sy + 18, 4, 4);
          ctx.fillRect(sx + 13, sy + 14, 3, 3);
          break;
        case 'tin_ore':
          // Silvery-white deposits
          ctx.fillStyle = '#8a8a8a';
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 20, o.size * 9, o.size * 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#d0d0d8';
          ctx.fillRect(sx + 10, sy + 16, 4, 4);
          ctx.fillRect(sx + 18, sy + 19, 3, 3);
          ctx.fillStyle = '#c0c0c8';
          ctx.fillRect(sx + 14, sy + 14, 4, 3);
          break;
        case 'coal_deposit':
          // Black/dark deposits
          ctx.fillStyle = '#2a2a2a';
          ctx.beginPath();
          ctx.ellipse(sx + 16, sy + 20, o.size * 10, o.size * 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111';
          ctx.fillRect(sx + 9, sy + 16, 5, 5);
          ctx.fillRect(sx + 17, sy + 18, 4, 4);
          ctx.fillStyle = '#3a3a3a';
          ctx.fillRect(sx + 13, sy + 14, 4, 3);
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
    const oreTypes = ['iron_ore', 'copper_ore', 'tin_ore', 'coal_deposit', 'crystal_deposit'];
    
    const isWood = woodTypes.includes(obj.type);
    const isStone = stoneTypes.includes(obj.type);
    const isOre = oreTypes.includes(obj.type);
    
    // Determine resource type for tool check
    let resourceCategory = null;
    if (isWood) resourceCategory = 'wood';
    else if (isStone) resourceCategory = 'stone';
    else if (obj.resourceType) resourceCategory = obj.resourceType;
    
    // Check if tool type matches (axes for wood, pickaxes for stone/ore)
    if (gatherType === 'wood' && !isWood) return null;
    if (gatherType === 'stone' && !isStone && !isOre) return null;
    
    // Check tool tier requirement
    if (resourceCategory) {
      const check = Player.canGatherResource(resourceCategory);
      if (!check.canGather) {
        // Show "Need X!" message
        const px = tx * TILE + TILE / 2;
        const py = ty * TILE + TILE / 2;
        Particles.damageNumber(px, py - 20, 'Need ' + check.need + '!', '#ff6666');
        return { blocked: true };
      }
    }
    
    obj.hp -= dmg;
    
    const px = tx * TILE + TILE / 2;
    const py = ty * TILE + TILE / 2;
    Particles.hitSparks(px, py);
    
    if (obj.hp > 0) return { hit: true, hp: obj.hp, maxHp: obj.maxHp, x: px, y: py };
    
    // Destroyed! Drop resources
    removeEnvAt(tx, ty);
    
    const resColors = { wood: '#8b6914', stone: '#888', iron: '#aaa', copper: '#b87333', tin: '#c0c0c0', coal: '#333', crystal: '#66ccff' };
    
    let resource, amount;
    if (obj.type === 'tree_large') { resource = 'wood'; amount = 5; }
    else if (obj.type === 'tree_small') { resource = 'wood'; amount = 3; }
    else if (obj.type === 'bush') { resource = 'wood'; amount = 1; }
    else if (obj.type === 'stump') { resource = 'wood'; amount = 1; }
    else if (obj.type === 'fallen_log') { resource = 'wood'; amount = 2; }
    else if (obj.type === 'boulder') { resource = 'stone'; amount = 5; }
    else if (obj.type === 'rock') { resource = 'stone'; amount = 3; }
    else if (obj.type === 'iron_ore') { resource = 'iron'; amount = 3; }
    else if (obj.type === 'copper_ore') { resource = 'copper'; amount = 2; }
    else if (obj.type === 'tin_ore') { resource = 'tin'; amount = 2; }
    else if (obj.type === 'coal_deposit') { resource = 'coal'; amount = 2; }
    else if (obj.type === 'crystal_deposit') { resource = 'crystal'; amount = 2; }
    
    // Apply tool bonus (steel pickaxe = 2x)
    if (resource) {
      const check = Player.canGatherResource(obj.resourceType || resource);
      if (check.bonus > 1) amount = Math.floor(amount * check.bonus);
    }
    
    Particles.deathPoof(px, py, resColors[resource] || '#888');
    
    return { destroyed: true, resource, amount, x: px, y: py };
  }
  
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
