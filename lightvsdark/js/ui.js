// ui.js — HUD, menus, inventory screen, build menu
const UI = (() => {
  let inventoryOpen = false;
  let currentCraftTier = 0;
  let currentBuildCat = 'defensive';
  
  function init() {
    inventoryOpen = false;
    currentCraftTier = 0;
    currentBuildCat = 'defensive';
    
    updateHotbar();
    
    document.querySelectorAll('.build-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.build-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBuildCat = btn.dataset.cat;
        updateBuildMenu();
      });
    });
    
    document.querySelectorAll('.craft-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = parseInt(btn.dataset.tier);
        if (tier > Building.getMaxCraftTier() && tier > 0) return;
        document.querySelectorAll('.craft-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCraftTier = tier;
        updateCraftMenu();
      });
    });
    
    document.getElementById('inv-close').addEventListener('click', toggleInventory);
  }
  
  function toggleInventory() {
    inventoryOpen = !inventoryOpen;
    document.getElementById('inventory-screen').classList.toggle('hidden', !inventoryOpen);
    if (inventoryOpen) {
      updateInventory();
      updateCraftMenu();
    }
  }
  
  function updateHUD() {
    const ps = Player.state();
    
    const hpPct = (ps.hp / ps.maxHp) * 100;
    document.getElementById('hp-bar').style.width = hpPct + '%';
    document.getElementById('hp-text').textContent = `${Math.ceil(ps.hp)}/${ps.maxHp}`;
    
    const night = Lighting.nightCount();
    document.getElementById('day-display').textContent = `Day ${night + 1}`;
    
    const phase = Lighting.phase();
    const icons = { day: '☀️ Day', dusk: '🌅 Dusk!', night: '🌙 Night', dawn: '🌄 Dawn' };
    document.getElementById('time-display').textContent = icons[phase] || phase;
    document.getElementById('time-display').style.color = phase === 'night' ? '#ff6b6b' : phase === 'dusk' ? '#f39c12' : '#eee';
    
    const nightRemain = Lighting.getNightTimeRemaining();
    const nightTimer = document.getElementById('night-timer');
    if (phase === 'night') {
      nightTimer.classList.remove('hidden');
      const eCount = Enemies.enemyCount();
      nightTimer.innerHTML = `⏱ ${nightRemain}s<br><span id="enemy-counter">👾 Enemies: ${eCount} remaining</span>`;
    } else {
      nightTimer.classList.add('hidden');
    }
    
    const skipBtn = document.getElementById('skip-night-btn');
    if (phase === 'day') { skipBtn.classList.remove('hidden'); } else { skipBtn.classList.add('hidden'); }
    
    // HUD resources — show primary 4 on bar
    document.getElementById('res-wood').textContent = `🪵 ${ps.resources.wood}`;
    document.getElementById('res-stone').textContent = `🪨 ${ps.resources.stone}`;
    document.getElementById('res-iron').textContent = `⛏️ ${ps.resources.iron}`;
    document.getElementById('res-crystal').textContent = `💎 ${ps.resources.crystal}`;
    
    // Extended resource display (second row)
    let extEl = document.getElementById('res-extended');
    if (!extEl) {
      extEl = document.createElement('div');
      extEl.id = 'res-extended';
      extEl.style.cssText = 'display:flex;gap:10px;font-size:12px;color:#ccc;margin-top:2px;flex-wrap:wrap;';
      const resBar = document.getElementById('resources');
      if (resBar) resBar.appendChild(extEl);
    }
    const extRes = [];
    if (ps.resources.copper > 0) extRes.push(`🟤${ps.resources.copper}`);
    if (ps.resources.tin > 0) extRes.push(`⬜${ps.resources.tin}`);
    if (ps.resources.coal > 0) extRes.push(`⬛${ps.resources.coal}`);
    if (ps.resources.bronze > 0) extRes.push(`🟠${ps.resources.bronze}`);
    if (ps.resources.steel > 0) extRes.push(`⚙️${ps.resources.steel}`);
    extEl.textContent = extRes.join('  ');
    
    const modeDisp = document.getElementById('mode-display');
    if (Building.buildMode()) {
      modeDisp.textContent = '🔨 Build Mode';
      modeDisp.style.color = '#2ecc71';
    } else {
      modeDisp.textContent = '⚔️ Combat';
      modeDisp.style.color = '#e74c3c';
    }
  }
  
  function updateHotbar() {
    const ps = Player.state();
    const container = document.getElementById('hotbar');
    container.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot' + (i === ps.hotbarIdx ? ' active' : '');
      const key = document.createElement('span');
      key.className = 'slot-key';
      key.textContent = i + 1;
      slot.appendChild(key);
      
      const item = ps.hotbar[i];
      if (item) {
        const w = Player.WEAPONS[item];
        const a = Player.ARMORS[item];
        const icons = {
          wooden_sword: '🗡️', wooden_axe: '🪓', wooden_pickaxe: '⛏️',
          stone_axe: '🪓', stone_pickaxe: '⛏️',
          iron_blade: '⚔️', iron_axe: '🪓', iron_pickaxe: '⛏️',
          bronze_sword: '⚔️', bronze_axe: '🪓', bronze_pickaxe: '⛏️',
          steel_sword: '⚔️', steel_axe: '🪓', steel_pickaxe: '⛏️',
          crystal_sword: '💎', wooden_bow: '🏹', iron_crossbow: '🏹',
          umbra_blade: '🔮',
          leather_armor: '🛡️', chitin_armor: '🛡️', bronze_armor: '🛡️',
          steel_armor: '🛡️', dark_steel_armor: '🛡️',
          shadow_cloak: '👻', corruption_bomb: '💣'
        };
        const icon = icons[item] || '📦';
        const name = w ? w.name : a ? a.name : item.replace(/_/g, ' ');
        slot.innerHTML += `<div style="font-size:16px;line-height:1">${icon}</div><span style="font-size:9px">${name}</span>`;
      }
      
      slot.addEventListener('click', () => {
        ps.hotbarIdx = i;
        if (ps.hotbar[i] && Player.WEAPONS[ps.hotbar[i]]) {
          ps.weapon = ps.hotbar[i];
        }
        updateHotbar();
      });
      container.appendChild(slot);
    }
  }
  
  function updateInventory() {
    const ps = Player.state();
    
    const weaponName = Player.WEAPONS[ps.weapon]?.name || 'None';
    document.querySelector('#equip-weapon span').textContent = weaponName;
    const armorName = Player.ARMORS[ps.armor]?.name || 'None';
    document.querySelector('#equip-armor span').textContent = armorName;
    
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    for (const item of ps.inventory) {
      const div = document.createElement('div');
      div.className = 'inv-item';
      div.textContent = item.replace(/_/g, ' ');
      div.addEventListener('click', () => Player.equip(item));
      grid.appendChild(div);
    }
    
    // Full resources display in inventory
    const resDiv = document.getElementById('inv-resources');
    let html = '<b>Materials:</b><br>';
    const resNames = { wood: '🪵 Wood', stone: '🪨 Stone', iron: '⛏️ Iron', copper: '🟤 Copper', tin: '⬜ Tin', coal: '⬛ Coal', bronze: '🟠 Bronze', steel: '⚙️ Steel', crystal: '💎 Crystal' };
    for (const [k, v] of Object.entries(ps.resources)) {
      if (v > 0 || k === 'wood' || k === 'stone' || k === 'iron' || k === 'crystal') {
        html += `${resNames[k] || k}: ${v}<br>`;
      }
    }
    html += '<br><b>Drops:</b><br>';
    const dropNames = { shadow_dust: '🟣 Shadow Dust', dark_chitin: '🪲 Dark Chitin', void_shards: '💜 Void Shards',
      corruption_gel: '🟢 Corruption Gel', shadow_silk: '🕸️ Shadow Silk', dark_steel: '⚫ Dark Steel', umbra_core: '🔮 Umbra Core', leather: '🟤 Leather' };
    for (const [k, v] of Object.entries(ps.drops)) {
      if (v > 0) html += `${dropNames[k] || k.replace(/_/g, ' ')}: ${v}<br>`;
    }
    if (ps.arrows > 0) html += `<br>🏹 Arrows: ${ps.arrows}`;
    if (ps.voidArrows > 0) html += `<br>💜 Void Arrows: ${ps.voidArrows}`;
    resDiv.innerHTML = html;
    
    const maxTier = Building.getMaxCraftTier();
    document.querySelectorAll('.craft-tab').forEach(btn => {
      const tier = parseInt(btn.dataset.tier);
      btn.disabled = tier > maxTier && tier > 0;
    });
  }
  
  function updateCraftMenu() {
    const list = document.getElementById('craft-list');
    list.innerHTML = '';
    const ps = Player.state();
    const recipes = Crafting.RECIPES.filter(r => r.tier === currentCraftTier);
    
    for (const r of recipes) {
      const div = document.createElement('div');
      const can = Crafting.canCraft(r);
      div.className = 'craft-recipe' + (can ? '' : ' cant-craft');
      
      let costHtml = '';
      for (const [k, v] of Object.entries(r.cost)) {
        const have = ps.resources[k] !== undefined ? ps.resources[k] : (ps.drops[k] || 0);
        const cls = have >= v ? 'has' : 'need';
        costHtml += `<span class="${cls}">${k.replace(/_/g, ' ')}: ${have}/${v}</span> `;
      }
      
      // Show station requirement for smelting
      let extra = r.desc;
      if (r.station) {
        const hasStation = Building.buildings().some(b => b.type === r.station);
        extra += hasStation ? ' ✅' : ' ❌ (need building)';
      }
      
      div.innerHTML = `<div class="recipe-name">${r.name}</div><div class="recipe-cost">${costHtml}</div><div style="color:#888;font-size:11px">${extra}</div>`;
      div.addEventListener('click', () => {
        if (Crafting.craft(r)) {
          updateInventory();
          updateCraftMenu();
          updateHotbar();
        }
      });
      list.appendChild(div);
    }
  }
  
  function updateBuildMenu() {
    const list = document.getElementById('build-list');
    list.innerHTML = '';
    const ps = Player.state();
    
    for (const [key, t] of Object.entries(Building.TYPES)) {
      if (t.cat !== currentBuildCat) continue;
      const can = Player.hasResources(t.cost);
      const div = document.createElement('div');
      div.className = 'build-item' + (can ? '' : ' cant-afford') + (Building.selectedBuilding() === key ? ' selected' : '');
      
      let costHtml = '';
      for (const [k, v] of Object.entries(t.cost)) {
        costHtml += `${k}: ${v} `;
      }
      
      div.innerHTML = `<div class="bi-name">${t.name}</div><div class="bi-cost">${costHtml}</div><div class="bi-desc">${t.desc}</div>`;
      div.addEventListener('click', () => {
        Building.setSelected(key);
        updateBuildMenu();
      });
      list.appendChild(div);
    }
  }
  
  function toggleBuildMode() {
    Building.setBuildMode(!Building.buildMode());
    document.getElementById('build-menu').classList.toggle('hidden', !Building.buildMode());
    if (Building.buildMode()) updateBuildMenu();
  }
  
  function drawMinimap(playerState) {
    const canvas = document.getElementById('minimap');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const sx = canvas.width / MAP_PX_W;
    const sy = canvas.height / MAP_PX_H;
    
    for (const b of Building.buildings()) {
      const t = Building.TYPES[b.type];
      ctx.fillStyle = t.color;
      ctx.fillRect(b.tx * TILE * sx, b.ty * TILE * sy, Math.max(2, TILE * sx), Math.max(2, TILE * sy));
    }
    
    ctx.fillStyle = '#66ccff';
    ctx.fillRect(MAP_PX_W / 2 * sx - 3, MAP_PX_H / 2 * sy - 3, 6, 6);
    
    ctx.fillStyle = '#e74c3c';
    for (const e of Enemies.enemies()) {
      ctx.fillRect(e.x * sx - 1, e.y * sy - 1, 2, 2);
    }
    
    ctx.fillStyle = '#3498db';
    ctx.fillRect(playerState.x * sx - 2, playerState.y * sy - 2, 4, 4);
  }
  
  function showGameOver(won, reason) {
    const screen = document.getElementById('game-over-screen');
    screen.classList.remove('hidden');
    const title = document.getElementById('gameover-title');
    title.textContent = won ? '🎉 Victory!' : '💀 Game Over';
    title.className = won ? 'victory' : 'defeat';
    document.getElementById('gameover-reason').textContent = reason;
    
    const ps = Player.state();
    const nights = Lighting.nightCount();
    const score = nights * ps.kills * Math.max(1, Building.buildingCount());
    document.getElementById('gameover-stats').innerHTML = 
      `Nights Survived: ${nights}<br>Enemies Killed: ${ps.kills}<br>Buildings: ${Building.buildingCount()}<br>Score: ${score}`;
    
    if (won) Audio.victory(); else Audio.gameOver();
  }
  
  return {
    init, toggleInventory, updateHUD, updateHotbar, updateBuildMenu,
    toggleBuildMode, drawMinimap, showGameOver,
    isInventoryOpen: () => inventoryOpen
  };
})();
