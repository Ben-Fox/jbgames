// crafting.js — Recipes, crafting UI, tier system
const Crafting = (() => {
  const RECIPES = [
    // Tier 0 — no station needed
    { id: 'wooden_sword', name: 'Wooden Sword', tier: 0, type: 'weapon', cost: { wood: 5 }, desc: '5 dmg, fast' },
    { id: 'wooden_axe', name: 'Wooden Axe', tier: 0, type: 'weapon', cost: { wood: 3 }, desc: 'Gather wood from trees' },
    { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', tier: 0, type: 'weapon', cost: { wood: 3, stone: 2 }, desc: 'Gather stone from rocks' },
    { id: 'wooden_shield', name: 'Wooden Shield', tier: 0, type: 'shield', cost: { wood: 8 }, desc: 'Blocks 20% damage' },
    { id: 'torch_item', name: 'Torch (placeable)', tier: 0, type: 'building', buildType: 'torch', cost: { wood: 2 }, desc: 'Small light source' },
    { id: 'wood_wall_item', name: 'Wood Wall', tier: 0, type: 'building', buildType: 'wood_wall', cost: { wood: 5 }, desc: '50 HP barrier' },
    { id: 'wood_gate_item', name: 'Wood Gate', tier: 0, type: 'building', buildType: 'wood_gate', cost: { wood: 8 }, desc: 'Walk-through door' },
    
    // Tier 1 — Workbench
    { id: 'stone_axe', name: 'Stone Axe', tier: 1, type: 'weapon', cost: { stone: 8, wood: 3 }, desc: '8 dmg, gathers wood' },
    { id: 'stone_pickaxe', name: 'Stone Pickaxe', tier: 1, type: 'weapon', cost: { stone: 5, wood: 3 }, desc: 'Mines iron, copper, tin' },
    { id: 'leather_armor', name: 'Leather Armor', tier: 1, type: 'armor', cost: { leather: 5, wood: 3 }, desc: '+10 HP, light' },
    { id: 'wooden_bow', name: 'Wooden Bow', tier: 1, type: 'weapon', cost: { wood: 8, shadow_silk: 3 }, desc: '7 dmg ranged' },
    { id: 'shadow_arrows', name: 'Shadow Arrows (x10)', tier: 1, type: 'ammo', ammoType: 'arrows', amount: 10, cost: { wood: 2, shadow_dust: 1 }, desc: '10 arrows' },
    { id: 'stone_wall_item', name: 'Stone Wall', tier: 1, type: 'building', buildType: 'stone_wall', cost: { stone: 8 }, desc: '120 HP barrier' },
    { id: 'spike_trap_item', name: 'Spike Trap', tier: 1, type: 'building', buildType: 'spike_trap', cost: { wood: 3, iron: 2 }, desc: '10 dmg to enemies' },
    { id: 'woodmill_item', name: 'Woodmill', tier: 1, type: 'building', buildType: 'woodmill', cost: { wood: 15, stone: 5 }, desc: 'Produces wood' },
    { id: 'stone_mine_item', name: 'Stone Mine', tier: 1, type: 'building', buildType: 'stone_mine', cost: { wood: 10, stone: 10 }, desc: 'Produces stone' },
    { id: 'copper_mine_item', name: 'Copper Mine', tier: 1, type: 'building', buildType: 'copper_mine', cost: { wood: 10, stone: 8 }, desc: 'Produces copper' },
    { id: 'tin_mine_item', name: 'Tin Mine', tier: 1, type: 'building', buildType: 'tin_mine', cost: { wood: 10, stone: 8 }, desc: 'Produces tin' },
    { id: 'health_potion', name: 'Health Potion', tier: 1, type: 'consumable', consumableId: 'health_potion', cost: { mushroom: 3, wood: 2 }, desc: 'Heals 25 HP instantly' },
    { id: 'antidote', name: 'Antidote', tier: 1, type: 'consumable', consumableId: 'antidote', cost: { mushroom: 3, shadow_dust: 1 }, desc: 'Clears corruption' },
    { id: 'fire_pit_item', name: 'Fire Pit', tier: 1, type: 'building', buildType: 'fire_pit', cost: { wood: 5, coal: 2 }, desc: 'Light + burns enemies' },
    { id: 'barracks_item', name: 'Barracks', tier: 1, type: 'building', buildType: 'barracks', cost: { wood: 20, stone: 15, iron: 10 }, desc: 'Recruit defenders' },
    { id: 'workbench_item', name: 'Workbench', tier: 0, type: 'building', buildType: 'workbench', cost: { wood: 10, stone: 5 }, desc: 'Tier 1 crafting' },
    { id: 'smelter_item', name: 'Smelter', tier: 1, type: 'building', buildType: 'smelter', cost: { stone: 10, wood: 5 }, desc: 'Smelt ores into alloys' },
    
    // Tier 2 — Forge (iron tier + smelting)
    { id: 'iron_blade', name: 'Iron Blade', tier: 2, type: 'weapon', cost: { iron: 10, wood: 5 }, desc: '15 dmg, medium' },
    { id: 'iron_axe', name: 'Iron Axe', tier: 2, type: 'weapon', cost: { iron: 5, wood: 3 }, desc: '10 dmg, fast wood gather' },
    { id: 'iron_pickaxe', name: 'Iron Pickaxe', tier: 2, type: 'weapon', cost: { iron: 5, wood: 3 }, desc: 'Mines coal, faster mining' },
    { id: 'spear', name: 'Spear', tier: 2, type: 'weapon', cost: { iron: 8, wood: 5 }, desc: '12 dmg, long range melee' },
    { id: 'iron_shield', name: 'Iron Shield', tier: 2, type: 'shield', cost: { iron: 8, wood: 3 }, desc: 'Blocks 35% damage' },
    { id: 'iron_crossbow', name: 'Iron Crossbow', tier: 2, type: 'weapon', cost: { iron: 8, wood: 5, shadow_silk: 2 }, desc: '18 dmg ranged' },
    { id: 'void_arrows', name: 'Void Arrows (x5)', tier: 2, type: 'ammo', ammoType: 'voidArrows', amount: 5, cost: { iron: 2, void_shards: 1 }, desc: '5 piercing arrows' },
    { id: 'chitin_armor', name: 'Chitin Armor', tier: 2, type: 'armor', cost: { dark_chitin: 8, iron: 5 }, desc: '+20 HP, light' },
    { id: 'smelt_bronze', name: 'Smelt Bronze (x1)', tier: 2, type: 'smelting', resource: 'bronze', amount: 1, cost: { copper: 2, tin: 1 }, desc: 'Requires Smelter', station: 'smelter' },
    { id: 'bronze_sword', name: 'Bronze Sword', tier: 2, type: 'weapon', cost: { bronze: 5, wood: 3 }, desc: '18 dmg, balanced' },
    { id: 'bronze_axe', name: 'Bronze Axe', tier: 2, type: 'weapon', cost: { bronze: 5 }, desc: '12 dmg, good gather' },
    { id: 'bronze_pickaxe', name: 'Bronze Pickaxe', tier: 2, type: 'weapon', cost: { bronze: 5, wood: 2 }, desc: 'Mines crystal deposits' },
    { id: 'war_hammer', name: 'War Hammer', tier: 2, type: 'weapon', cost: { bronze: 10, iron: 5 }, desc: '22 dmg, AoE knockback' },
    { id: 'greater_health_potion', name: 'Greater Health Potion', tier: 2, type: 'consumable', consumableId: 'greater_health_potion', cost: { health_potion: 2, corruption_gel: 3 }, desc: 'Heals 50 HP' },
    { id: 'regen_salve', name: 'Regeneration Salve', tier: 2, type: 'consumable', consumableId: 'regen_salve', cost: { mushroom: 5, shadow_dust: 3, crystal: 1 }, desc: '5 HP/s for 10s' },
    { id: 'bronze_armor', name: 'Bronze Armor', tier: 2, type: 'armor', cost: { bronze: 8, leather: 3 }, desc: '+35 HP, slight slow' },
    { id: 'iron_wall_item', name: 'Iron Wall', tier: 2, type: 'building', buildType: 'iron_wall', cost: { iron: 5, stone: 3 }, desc: '200 HP barrier' },
    { id: 'arrow_tower_item', name: 'Arrow Tower', tier: 2, type: 'building', buildType: 'arrow_tower', cost: { wood: 10, iron: 5 }, desc: 'Auto-shoots enemies' },
    { id: 'ballista_tower_item', name: 'Ballista Tower', tier: 2, type: 'building', buildType: 'ballista_tower', cost: { iron: 15, bronze: 10 }, desc: '25 dmg heavy tower' },
    { id: 'iron_mine_item', name: 'Iron Mine', tier: 2, type: 'building', buildType: 'iron_mine', cost: { stone: 15, iron: 5 }, desc: 'Produces iron' },
    { id: 'coal_mine_item', name: 'Coal Mine', tier: 2, type: 'building', buildType: 'coal_mine', cost: { stone: 10, iron: 5 }, desc: 'Produces coal' },
    { id: 'forge_item', name: 'Forge', tier: 1, type: 'building', buildType: 'forge', cost: { stone: 10, iron: 10 }, desc: 'Tier 2 crafting' },
    { id: 'lantern_item', name: 'Lantern', tier: 2, type: 'building', buildType: 'lantern', cost: { iron: 3, crystal: 1 }, desc: 'Large light radius' },
    { id: 'healing_fountain_item', name: 'Healing Fountain', tier: 2, type: 'building', buildType: 'healing_fountain', cost: { crystal: 5, stone: 5 }, desc: 'Heals 2 HP/s' },
    { id: 'shadow_cloak', name: 'Shadow Cloak', tier: 2, type: 'special', cost: { shadow_silk: 5, shadow_dust: 3 }, desc: 'Brief invisibility (use)' },
    { id: 'corruption_bomb', name: 'Corruption Bomb', tier: 2, type: 'special', cost: { corruption_gel: 3, iron: 2 }, desc: 'AoE 30 dmg' },
    { id: 'advanced_forge_item', name: 'Advanced Forge', tier: 2, type: 'building', buildType: 'advanced_forge', cost: { iron: 10, bronze: 5 }, desc: 'Tier 3 crafting, steel' },
    
    // Tier 3 — Advanced Forge / Crystal Altar (steel + crystal tier)
    { id: 'smelt_steel', name: 'Smelt Steel (x1)', tier: 3, type: 'smelting', resource: 'steel', amount: 1, cost: { iron: 2, coal: 1 }, desc: 'Requires Advanced Forge', station: 'advanced_forge' },
    { id: 'steel_sword', name: 'Steel Sword', tier: 3, type: 'weapon', cost: { steel: 5, wood: 3 }, desc: '20 dmg, fast' },
    { id: 'steel_axe', name: 'Steel Axe', tier: 3, type: 'weapon', cost: { steel: 5 }, desc: '14 dmg, fastest wood' },
    { id: 'steel_pickaxe', name: 'Steel Pickaxe', tier: 3, type: 'weapon', cost: { steel: 5, wood: 2 }, desc: 'Fastest mining, 2x crystal' },
    { id: 'steel_shield', name: 'Steel Shield', tier: 3, type: 'shield', cost: { steel: 8 }, desc: 'Blocks 50% damage' },
    { id: 'steel_armor', name: 'Steel Armor', tier: 3, type: 'armor', cost: { steel: 8, bronze: 5 }, desc: '+45 HP, slight slow' },
    { id: 'crystal_sword', name: 'Crystal Sword', tier: 3, type: 'weapon', cost: { crystal: 5, steel: 3, shadow_dust: 3 }, desc: '25 dmg, fast' },
    { id: 'crystal_staff', name: 'Crystal Staff', tier: 3, type: 'weapon', cost: { crystal: 10, steel: 5, void_shards: 3 }, desc: '15 dmg ranged, pierces enemies' },
    { id: 'castle_item', name: 'Castle', tier: 3, type: 'building', buildType: 'castle', cost: { stone: 20, iron: 15, steel: 10 }, desc: 'Recruit Knights' },
    { id: 'dark_steel_armor', name: 'Dark Steel Armor', tier: 3, type: 'armor', cost: { dark_steel: 8, steel: 5 }, desc: '+60 HP, slow' },
    { id: 'light_turret_item', name: 'Light Turret', tier: 3, type: 'building', buildType: 'light_turret', cost: { crystal: 5, steel: 3 }, desc: 'Beam attack + light' },
    { id: 'crystal_extractor_item', name: 'Crystal Extractor', tier: 3, type: 'building', buildType: 'crystal_extractor', cost: { steel: 5, crystal: 5 }, desc: 'Produces crystal' },
    { id: 'crystal_altar_item', name: 'Crystal Altar', tier: 2, type: 'building', buildType: 'crystal_altar', cost: { iron: 10, crystal: 10 }, desc: 'Tier 3 crafting' },
    { id: 'umbra_blade', name: 'Umbra Blade', tier: 3, type: 'weapon', cost: { umbra_core: 1, steel: 5, dark_steel: 5 }, desc: '35 dmg, fastest' },
    { id: 'purification_beacon', name: 'Purification Beacon', tier: 3, type: 'special', cost: { umbra_core: 1, crystal: 10 }, desc: 'Cleanses all corruption' }
  ];
  
  function getAvailable(tier) {
    return RECIPES.filter(r => r.tier <= tier);
  }
  
  function canCraft(recipe) {
    const ps = Player.state();
    for (const [k, v] of Object.entries(recipe.cost)) {
      // Check consumables as cost (e.g., health_potion for greater)
      if (ps.consumables && ps.consumables[k] !== undefined) {
        if (ps.consumables[k] < v) return false;
        continue;
      }
      const have = ps.resources[k] !== undefined ? ps.resources[k] : (ps.drops[k] || 0);
      if (have < v) return false;
    }
    // Check station requirement for smelting
    if (recipe.station) {
      const buildings = Building.buildings();
      if (!buildings.some(b => b.type === recipe.station)) return false;
    }
    return true;
  }
  
  function craft(recipe) {
    if (!canCraft(recipe)) { Audio.error(); Effects.notEnoughResources(); return false; }
    // Spend consumable costs first
    const ps = Player.state();
    const normalCost = {};
    for (const [k, v] of Object.entries(recipe.cost)) {
      if (ps.consumables && ps.consumables[k] !== undefined) {
        ps.consumables[k] -= v;
      } else {
        normalCost[k] = v;
      }
    }
    Player.spendResources(normalCost);
    Audio.craft();
    Effects.craftedItem(recipe.name);
    
    if (recipe.type === 'weapon') {
      Player.addToInventory(recipe.id);
    } else if (recipe.type === 'armor') {
      Player.addToInventory(recipe.id);
    } else if (recipe.type === 'ammo') {
      Player.state()[recipe.ammoType] = (Player.state()[recipe.ammoType] || 0) + recipe.amount;
    } else if (recipe.type === 'smelting') {
      Player.addResource(recipe.resource, recipe.amount);
      Particles.damageNumber(Player.state().x, Player.state().y - 20, '+' + recipe.amount + ' ' + recipe.resource, '#ffd700');
    } else if (recipe.type === 'building') {
      for (const [k, v] of Object.entries(recipe.cost)) Player.addResource(k, v);
      Building.setBuildMode(true);
      Building.setSelected(recipe.buildType);
      return true;
    } else if (recipe.type === 'consumable') {
      Player.state().consumables[recipe.consumableId] = (Player.state().consumables[recipe.consumableId] || 0) + 1;
      // Add to hotbar if not already there
      const hotbar = Player.state().hotbar;
      if (!hotbar.includes(recipe.consumableId)) {
        const empty = hotbar.indexOf(null);
        if (empty >= 0) hotbar[empty] = recipe.consumableId;
      }
    } else if (recipe.type === 'shield') {
      Player.addToInventory(recipe.id);
    } else if (recipe.type === 'special') {
      Player.state().inventory.push(recipe.id);
    }
    return true;
  }
  
  return { RECIPES, getAvailable, canCraft, craft };
})();
