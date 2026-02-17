// crafting.js — Recipes, crafting UI, tier system
const Crafting = (() => {
  const RECIPES = [
    // Tier 0 — no station needed
    { id: 'wooden_sword', name: 'Wooden Sword', tier: 0, type: 'weapon', cost: { wood: 5 }, desc: '5 dmg, fast' },
    { id: 'wooden_axe', name: 'Wooden Axe', tier: 0, type: 'weapon', cost: { wood: 3 }, desc: 'Gather wood from trees' },
    { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', tier: 0, type: 'weapon', cost: { wood: 3, stone: 2 }, desc: 'Gather stone from rocks' },
    { id: 'torch_item', name: 'Torch (placeable)', tier: 0, type: 'building', buildType: 'torch', cost: { wood: 2 }, desc: 'Small light source' },
    { id: 'wood_wall_item', name: 'Wood Wall', tier: 0, type: 'building', buildType: 'wood_wall', cost: { wood: 5 }, desc: '50 HP barrier' },
    { id: 'wood_gate_item', name: 'Wood Gate', tier: 0, type: 'building', buildType: 'wood_gate', cost: { wood: 8 }, desc: 'Walk-through door' },
    
    // Tier 1 — Workbench
    { id: 'stone_axe', name: 'Stone Axe', tier: 1, type: 'weapon', cost: { stone: 8, wood: 3 }, desc: '8 dmg, medium' },
    { id: 'wooden_bow', name: 'Wooden Bow', tier: 1, type: 'weapon', cost: { wood: 8, shadow_silk: 3 }, desc: '7 dmg ranged' },
    { id: 'shadow_arrows', name: 'Shadow Arrows (x10)', tier: 1, type: 'ammo', ammoType: 'arrows', amount: 10, cost: { wood: 2, shadow_dust: 1 }, desc: '10 arrows' },
    { id: 'stone_wall_item', name: 'Stone Wall', tier: 1, type: 'building', buildType: 'stone_wall', cost: { stone: 8 }, desc: '120 HP barrier' },
    { id: 'spike_trap_item', name: 'Spike Trap', tier: 1, type: 'building', buildType: 'spike_trap', cost: { wood: 3, iron: 2 }, desc: '10 dmg to enemies' },
    { id: 'woodmill_item', name: 'Woodmill', tier: 1, type: 'building', buildType: 'woodmill', cost: { wood: 15, stone: 5 }, desc: 'Produces wood' },
    { id: 'stone_mine_item', name: 'Stone Mine', tier: 1, type: 'building', buildType: 'stone_mine', cost: { wood: 10, stone: 10 }, desc: 'Produces stone' },
    { id: 'workbench_item', name: 'Workbench', tier: 0, type: 'building', buildType: 'workbench', cost: { wood: 10, stone: 5 }, desc: 'Tier 1 crafting' },
    
    // Tier 2 — Forge
    { id: 'iron_blade', name: 'Iron Blade', tier: 2, type: 'weapon', cost: { iron: 10, wood: 5 }, desc: '15 dmg, medium' },
    { id: 'iron_crossbow', name: 'Iron Crossbow', tier: 2, type: 'weapon', cost: { iron: 8, wood: 5, shadow_silk: 2 }, desc: '18 dmg ranged' },
    { id: 'void_arrows', name: 'Void Arrows (x5)', tier: 2, type: 'ammo', ammoType: 'voidArrows', amount: 5, cost: { iron: 2, void_shards: 1 }, desc: '5 piercing arrows' },
    { id: 'chitin_armor', name: 'Chitin Armor', tier: 2, type: 'armor', cost: { dark_chitin: 8, iron: 5 }, desc: '+30 HP, light' },
    { id: 'iron_wall_item', name: 'Iron Wall', tier: 2, type: 'building', buildType: 'iron_wall', cost: { iron: 5, stone: 3 }, desc: '200 HP barrier' },
    { id: 'arrow_tower_item', name: 'Arrow Tower', tier: 2, type: 'building', buildType: 'arrow_tower', cost: { wood: 10, iron: 5 }, desc: 'Auto-shoots enemies' },
    { id: 'iron_mine_item', name: 'Iron Mine', tier: 2, type: 'building', buildType: 'iron_mine', cost: { stone: 15, iron: 5 }, desc: 'Produces iron' },
    { id: 'forge_item', name: 'Forge', tier: 1, type: 'building', buildType: 'forge', cost: { stone: 10, iron: 10 }, desc: 'Tier 2 crafting' },
    { id: 'lantern_item', name: 'Lantern', tier: 2, type: 'building', buildType: 'lantern', cost: { iron: 3, crystal: 1 }, desc: 'Large light radius' },
    { id: 'healing_fountain_item', name: 'Healing Fountain', tier: 2, type: 'building', buildType: 'healing_fountain', cost: { crystal: 5, stone: 5 }, desc: 'Heals 2 HP/s' },
    { id: 'shadow_cloak', name: 'Shadow Cloak', tier: 2, type: 'special', cost: { shadow_silk: 5, shadow_dust: 3 }, desc: 'Brief invisibility (use)' },
    { id: 'corruption_bomb', name: 'Corruption Bomb', tier: 2, type: 'special', cost: { corruption_gel: 3, iron: 2 }, desc: 'AoE 30 dmg' },
    
    // Tier 3 — Crystal Altar
    { id: 'crystal_sword', name: 'Crystal Sword', tier: 3, type: 'weapon', cost: { crystal: 8, iron: 5, shadow_dust: 3 }, desc: '25 dmg, fast' },
    { id: 'dark_steel_armor', name: 'Dark Steel Armor', tier: 3, type: 'armor', cost: { dark_steel: 10, iron: 8 }, desc: '+60 HP, slow' },
    { id: 'light_turret_item', name: 'Light Turret', tier: 3, type: 'building', buildType: 'light_turret', cost: { crystal: 5, iron: 3 }, desc: 'Beam attack + light' },
    { id: 'crystal_extractor_item', name: 'Crystal Extractor', tier: 3, type: 'building', buildType: 'crystal_extractor', cost: { iron: 10, crystal: 5 }, desc: 'Produces crystal' },
    { id: 'crystal_altar_item', name: 'Crystal Altar', tier: 2, type: 'building', buildType: 'crystal_altar', cost: { iron: 10, crystal: 10 }, desc: 'Tier 3 crafting' },
    { id: 'umbra_blade', name: 'Umbra Blade', tier: 3, type: 'weapon', cost: { umbra_core: 1, crystal: 5, dark_steel: 5 }, desc: '35 dmg, fastest' },
    { id: 'purification_beacon', name: 'Purification Beacon', tier: 3, type: 'special', cost: { umbra_core: 1, crystal: 10 }, desc: 'Cleanses all corruption' }
  ];
  
  function getAvailable(tier) {
    return RECIPES.filter(r => r.tier <= tier);
  }
  
  function canCraft(recipe) {
    const ps = Player.state();
    for (const [k, v] of Object.entries(recipe.cost)) {
      const have = ps.resources[k] !== undefined ? ps.resources[k] : (ps.drops[k] || 0);
      if (have < v) return false;
    }
    return true;
  }
  
  function craft(recipe) {
    if (!canCraft(recipe)) { Audio.error(); return false; }
    Player.spendResources(recipe.cost);
    Audio.craft();
    
    if (recipe.type === 'weapon') {
      Player.addToInventory(recipe.id);
    } else if (recipe.type === 'armor') {
      Player.addToInventory(recipe.id);
    } else if (recipe.type === 'ammo') {
      Player.state()[recipe.ammoType] = (Player.state()[recipe.ammoType] || 0) + recipe.amount;
    } else if (recipe.type === 'building') {
      // Building recipes just unlock placement — cost is paid at placement, but we already took cost
      // Actually let's refund and just enter build mode with that building selected
      // Better: just add resources back and auto-select in build mode
      // Simplest: recipes for buildings are crafted into placeable items
      // Let's just auto-place via build mode:
      for (const [k, v] of Object.entries(recipe.cost)) Player.addResource(k, v); // refund
      Building.setBuildMode(true);
      Building.setSelected(recipe.buildType);
      return true;
    } else if (recipe.type === 'special') {
      Player.state().inventory.push(recipe.id);
    }
    return true;
  }
  
  return { RECIPES, getAvailable, canCraft, craft };
})();
