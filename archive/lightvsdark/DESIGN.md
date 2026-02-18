# Light vs Dark — Game Design Blueprint 🌓

## Core Concept
A 2D survival/base-building game where the player defends against waves of darkness creatures while expanding their settlement. Day = build & explore. Night = survive & defend.

---

## 🕹️ Game Flow

### Day/Night Cycle
- **Day Phase** (~60-90 seconds): Safe to explore, gather, build, craft. Light pushes darkness back.
- **Dusk Warning** (~10 seconds): Sky shifts, warning chime. Get back to base or prepare.
- **Night Phase** (~45-60 seconds): Enemies spawn from darkness at map edges. Waves get harder each night.
- **Dawn**: Surviving enemies retreat. Loot left behind. Repairs needed.

### Progression Loop
```
Night 1: 3-5 weak enemies → learn combat basics
Night 2: 6-8 enemies, first ranged type → need walls
Night 3: 10+ enemies, first mini-boss → need traps/turrets
Night 5: Boss wave → need crafted weapons
Night 7+: Scaling difficulty, new enemy types, corruption spread
```

### Win/Lose
- **Lose**: Player HP hits 0 OR base heart (light crystal) is destroyed
- **Win**: Survive X nights OR defeat the final boss (endless mode also available)
- **Score**: Nights survived × enemies killed × buildings standing

---

## ⚔️ Combat System

### Player Combat
- **Melee**: Click/tap to swing. Direction based on mouse/touch position relative to player (LEFT and RIGHT)
- **Ranged**: Bow/crossbow with limited ammo (crafted arrows)
- **Dodge Roll**: Quick dash with short cooldown (invincibility frames)
- **Player HP**: Starts at 100. Heals slowly near the Light Crystal during day.

### Attack Types
| Weapon | Damage | Speed | Range | Crafting Tier |
|--------|--------|-------|-------|---------------|
| Wooden Sword | 5 | Fast | Short | Starter |
| Stone Axe | 8 | Medium | Short | Tier 1 |
| Iron Blade | 15 | Medium | Medium | Tier 2 |
| Crystal Sword | 25 | Fast | Medium | Tier 3 |
| Wooden Bow | 7/arrow | Slow | Long | Tier 1 |
| Iron Crossbow | 18/bolt | Medium | Long | Tier 2 |

### Combat Feel
- Screen shake on hit
- Damage numbers float up
- Knockback on enemies
- Attack animation plays LEFT or RIGHT based on facing direction
- Brief hit-freeze (2-3 frames) for impact

---

## 👾 Enemy System

### Enemy Types
| Enemy | HP | Damage | Speed | Behavior | Drops |
|-------|-----|--------|-------|----------|-------|
| **Shadow Wisp** | 15 | 5 | Fast | Rushes player, dies to light | Shadow Dust (common) |
| **Dark Crawler** | 30 | 10 | Medium | Attacks buildings first | Dark Chitin (uncommon) |
| **Void Archer** | 20 | 12 | Slow | Ranged, stays at distance | Void Shards (uncommon) |
| **Corruption Blob** | 50 | 8 | Slow | Splits into 2 mini-blobs on death | Corruption Gel (rare) |
| **Night Stalker** | 40 | 18 | Fast | Invisible until close, ambush predator | Shadow Silk (rare) |
| **Dark Knight** | 80 | 20 | Medium | Shields block frontal damage, must flank | Dark Steel (rare) |
| **Boss: Umbra Lord** | 300 | 30 | Slow | Every 5th night. Summons minions. 3 phases | Umbra Core (legendary) |

### Enemy Behavior
- Enemies spawn from map edges (darkness zone)
- Pathfinding toward either player OR Light Crystal (whichever is closer)
- Crawlers prioritize walls/buildings
- Enemies avoid placed light sources (torches slow them, lanterns create safe zones)
- **Corruption**: Dead enemies leave dark patches that spread slowly. Must be cleansed or they spawn more enemies.

### Drop System
- Every enemy drops 1-2 items on death
- Drop table is per-enemy (specific resources, not random junk)
- Rare drops have ~15% chance
- Boss drops are guaranteed unique materials
- Loot glows on ground, auto-collected when walked over

---

## 🏗️ Building System

### Placement
- Grid-based (32x32 tiles)
- Click to select building from hotbar → click to place
- Buildings snap to grid
- Can't overlap existing structures
- Buildings have HP and can be damaged/destroyed by enemies

### Structure Types

#### Defensive
| Building | HP | Cost | Effect |
|----------|-----|------|--------|
| **Wood Wall** | 50 | 5 Wood | Basic barrier |
| **Stone Wall** | 120 | 8 Stone | Strong barrier |
| **Iron Wall** | 200 | 5 Iron + 3 Stone | Heavy barrier |
| **Wood Gate** | 40 | 8 Wood | Walkable door, blocks enemies |
| **Spike Trap** | ∞ (no HP) | 3 Wood + 2 Iron | 10 dmg to enemies walking over |
| **Arrow Tower** | 80 | 10 Wood + 5 Iron + 5 Arrows | Auto-shoots nearby enemies |
| **Light Turret** | 60 | 5 Crystal + 3 Iron | Beam attack, strong vs dark enemies |

#### Resource
| Building | Cost | Produces | Rate |
|----------|------|----------|------|
| **Woodmill** | 15 Wood + 5 Stone | Wood | 1 per 5 sec |
| **Stone Mine** | 10 Wood + 10 Stone | Stone | 1 per 8 sec |
| **Iron Mine** | 15 Stone + 5 Iron | Iron | 1 per 12 sec |
| **Crystal Extractor** | 10 Iron + 5 Crystal | Crystal | 1 per 20 sec |

#### Utility
| Building | Cost | Effect |
|----------|------|--------|
| **Torch** | 2 Wood | Small light radius, slows nearby enemies |
| **Lantern** | 3 Iron + 1 Crystal | Large light radius, safe zone |
| **Workbench** | 10 Wood + 5 Stone | Unlocks Tier 1 crafting |
| **Forge** | 10 Stone + 10 Iron | Unlocks Tier 2 crafting |
| **Crystal Altar** | 10 Iron + 10 Crystal | Unlocks Tier 3 crafting |
| **Healing Fountain** | 5 Crystal + 5 Stone | Heals player 2 HP/sec in radius |

### Repair
- Buildings take damage from enemies
- Player can repair with half the original material cost
- Unrepaired buildings eventually crumble

---

## 🎒 Resource System

### Base Resources (from buildings)
| Resource | Source | Used For |
|----------|--------|----------|
| **Wood** | Woodmill, trees | Walls, basic weapons, torches |
| **Stone** | Stone Mine, rocks | Walls, buildings, workbench |
| **Iron** | Iron Mine | Weapons, armor, advanced buildings |
| **Crystal** | Crystal Extractor | Light-based items, Tier 3 gear |

### Enemy Drop Resources
| Resource | Source | Used For |
|----------|--------|----------|
| **Shadow Dust** | Shadow Wisps | Dark resistance potions, shadow arrows |
| **Dark Chitin** | Dark Crawlers | Chitin armor (light + tough) |
| **Void Shards** | Void Archers | Void arrows (piercing), void traps |
| **Corruption Gel** | Corruption Blobs | Corruption bombs (AoE), acid traps |
| **Shadow Silk** | Night Stalkers | Cloak (brief invisibility), shadow net |
| **Dark Steel** | Dark Knights | Dark Steel armor (best defense) |
| **Umbra Core** | Umbra Lord boss | Umbra Blade (best weapon), Purification Beacon |

### Crafting Philosophy
- **Base resources** (wood/stone/iron/crystal) = infrastructure & basic gear
- **Enemy drops** = specialized combat items & advanced gear
- This creates the **risk/reward loop**: you NEED to go fight for drops, can't just turtle behind walls forever
- Resource buildings provide the foundation, combat provides the edge

---

## 🛠️ Crafting

### Tier System
- **Tier 0** (No bench): Basic wood weapons, torches, walls
- **Tier 1** (Workbench): Stone weapons, bow, traps, mines
- **Tier 2** (Forge): Iron weapons, crossbow, arrow tower, armor
- **Tier 3** (Crystal Altar): Crystal weapons, light turret, purification items

### Key Recipes
```
Wooden Sword:    5 Wood
Stone Axe:       8 Stone + 3 Wood
Iron Blade:      10 Iron + 5 Wood
Crystal Sword:   8 Crystal + 5 Iron + 3 Shadow Dust
Wooden Bow:      8 Wood + 3 Shadow Silk (string)
Shadow Arrows:   2 Wood + 1 Shadow Dust (×10)
Void Arrows:     2 Iron + 1 Void Shard (×5, piercing)
Chitin Armor:    8 Dark Chitin + 5 Iron (light, +30 HP)
Dark Steel Armor: 10 Dark Steel + 8 Iron (heavy, +60 HP, slow)
Shadow Cloak:    5 Shadow Silk + 3 Shadow Dust (invisibility 3s, 30s CD)
Corruption Bomb: 3 Corruption Gel + 2 Iron (AoE 30 dmg)
Purification Beacon: 1 Umbra Core + 10 Crystal (cleanses all corruption)
```

---

## 🗺️ Map & Exploration

### Map Layout
- Center: **Light Crystal** (your base heart, must protect)
- Surrounding: Open buildable area (where you construct your base)
- Edges: **Darkness zone** (enemies spawn here)
- Scattered: Trees, rocks, iron deposits, crystal nodes (manual gathering during day)

### Free Exploration
- Player can venture into darkness zone during day (light fades, enemies don't spawn but it's eerie)
- Rare resource nodes in darkness zone (high risk, high reward)
- Day exploration = gathering manual resources + scouting enemy spawn points
- Night = stay near base or die fast

### Map Size
- Medium (~80x60 tiles) — big enough to explore, small enough to defend
- Camera follows player, minimap in corner shows base + enemy positions

---

## 🎨 Visual Style
- **Top-down 2D** (think Vampire Survivors meets Kingdom: Two Crowns)
- Pixel art style, 32x32 tile grid
- **Day**: Warm colors, bright, peaceful music
- **Night**: Cool blues/purples, fog of war, tense music
- Light sources cast actual visible radius (canvas radial gradients)
- Darkness is literal — can't see into unlit areas at night

---

## 📱 Controls
- **WASD / Arrow Keys**: Move
- **Mouse Click**: Attack (direction based on cursor position)
- **E**: Interact / Pick up
- **B**: Toggle build mode
- **1-9**: Hotbar selection (weapons/items)
- **Tab**: Inventory/Crafting menu
- **Space**: Dodge roll
- **Mobile**: Virtual joystick + tap to attack + build button

---

## 🔄 Session Length
- Each night cycle = ~2-3 minutes total (day + night)
- Full game (10 nights to boss): ~25-30 minutes
- Endless mode: Keep going until you die
- Quick enough for web game, deep enough to replay

---

## 💡 Key Design Pillars
1. **Risk vs Reward**: Safe base-building vs dangerous loot runs
2. **Light vs Dark**: Literal and mechanical — light is defense, darkness is threat
3. **Player Agency**: Every death should feel like YOUR mistake, not RNG
4. **Escalation**: Each night harder, but your tools scale too
5. **Crafting Incentive**: Best gear requires combat drops — can't just mine your way to victory
