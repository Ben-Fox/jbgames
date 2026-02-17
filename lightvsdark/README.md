# Light vs Dark 🌓

A 2D top-down survival base-builder where you defend a Light Crystal against waves of darkness creatures. Build by day, survive by night.

## What Is This?

You start with nothing but a glowing crystal in the center of the map. During the day, you explore, gather resources, build defenses, and craft gear. When night falls, enemies pour in from the darkness — and each night is harder than the last.

The twist: the best weapons and armor require materials that only drop from enemies. You can't just hide behind walls forever. You have to fight.

## How It Plays

- **Day Phase (60-90s):** Safe to explore, gather wood/stone/iron, build structures, craft items
- **Dusk Warning (10s):** Sky darkens, get back to base
- **Night Phase (45-60s):** Enemy waves attack your base and Light Crystal
- **Dawn:** Enemies retreat, collect loot, repair buildings, repeat

A full run is ~10 nights (~25-30 minutes). Endless mode available after winning.

## Core Systems

### Combat
- Melee and ranged weapons across 4 tiers (wood → stone → iron → crystal)
- Attack direction follows your cursor (swing left or right)
- Dodge roll with brief invincibility
- Screen shake, knockback, damage numbers — it should feel punchy

### Enemies (7 types)
| Enemy | What It Does | What It Drops |
|---|---|---|
| Shadow Wisp | Rushes you, weak to light | Shadow Dust |
| Dark Crawler | Attacks buildings first | Dark Chitin |
| Void Archer | Ranged, keeps distance | Void Shards |
| Corruption Blob | Splits into 2 on death | Corruption Gel |
| Night Stalker | Invisible until close | Shadow Silk |
| Dark Knight | Shield blocks frontal attacks | Dark Steel |
| Umbra Lord (Boss) | Every 5th night, 3 phases, summons minions | Umbra Core |

### Building (Grid-Based)
Place structures on a 32x32 tile grid during the day:

- **Defensive:** Wood/Stone/Iron Walls, Gates, Spike Traps, Arrow Towers, Light Turrets
- **Resource:** Woodmill (wood), Stone Mine (stone), Iron Mine (iron), Crystal Extractor (crystal)
- **Utility:** Torches & Lanterns (light = defense), Healing Fountain, Crafting Stations

Resource buildings generate materials passively — but slowly. Manual gathering from the map is faster but riskier.

### Crafting (3 Tiers)
Unlock better recipes by building crafting stations:

- **No station:** Basic wood weapons, torches, walls
- **Workbench:** Stone weapons, bows, traps
- **Forge:** Iron weapons, crossbows, arrow towers, armor
- **Crystal Altar:** Crystal weapons, light turrets, purification items

Key design: **base resources** (from buildings) make infrastructure, **enemy drops** make combat gear. You need both.

### Resources

**From Buildings:** Wood, Stone, Iron, Crystal — the backbone of your base

**From Combat:** Shadow Dust, Dark Chitin, Void Shards, Corruption Gel, Shadow Silk, Dark Steel, Umbra Core — the edge that keeps you alive

This is the core loop: build resource generators for steady income, but venture into combat for the rare drops that make the best gear.

### Map
- Center: Light Crystal (protect this or lose)
- Surrounding area: Buildable zone for your base
- Edges: Darkness zone where enemies spawn (explorable during day for rare nodes)
- Scattered: Trees, rocks, ore deposits for manual gathering

## Tech Stack

- **Pure vanilla HTML/CSS/JS** — no frameworks, no dependencies
- **Canvas-rendered** — all graphics drawn in code (geometric shapes, procedural pixel art)
- **Web Audio API** — synthesized sound effects, no audio files
- **Target size: under 1MB** — lightweight enough for Cloudflare Pages
- **Runs in any modern browser** — desktop and mobile

## Build Plan

### Phase 1: Core Engine
- Canvas setup, camera system, tile-based map rendering
- Player movement (WASD) with collision detection
- Day/night cycle with lighting system (radial gradients for light sources)
- Basic melee combat (swing sword, deal damage)
- Simple HUD (HP, time of day, resources)

### Phase 2: Building System
- Grid-based placement UI (select building → click to place)
- Wall types with HP (enemies can damage/destroy them)
- Resource buildings that generate materials over time
- Crafting stations (Workbench, Forge, Crystal Altar)
- Building repair mechanic

### Phase 3: Enemies & Waves
- Enemy spawning system (edges of map, scaling with night number)
- Pathfinding AI (A* or simpler steering toward player/crystal)
- All 7 enemy types with unique behaviors
- Loot drop system (specific drops per enemy type)
- Boss encounter every 5th night

### Phase 4: Crafting & Inventory
- Inventory UI (grid-based backpack)
- Crafting menu with recipe discovery
- Weapon/armor equip system
- Hotbar for quick item switching
- Resource counter HUD

### Phase 5: Polish
- Particle effects (hit sparks, building dust, enemy death poof)
- Screen shake and impact feedback
- Minimap showing base layout + enemy positions
- Difficulty scaling and balance tuning
- Mobile controls (virtual joystick + tap actions)
- Splash screen, how-to-play, game over/victory screens

## File Structure (Planned)
```
lightvsdark/
├── index.html          # Entry point
├── style.css           # UI styling
├── js/
│   ├── main.js         # Game loop, initialization
│   ├── player.js       # Player movement, combat, inventory
│   ├── enemies.js      # Enemy types, AI, spawning
│   ├── building.js     # Grid placement, structures, resource generation
│   ├── crafting.js     # Recipes, crafting UI, tier system
│   ├── map.js          # Tile map, terrain, camera
│   ├── lighting.js     # Day/night cycle, light sources
│   ├── particles.js    # Visual effects
│   ├── audio.js        # Synthesized sound effects
│   ├── ui.js           # HUD, menus, inventory screen
│   └── utils.js        # Collision, math helpers, pathfinding
├── DESIGN.md           # Full game design document
└── README.md           # This file
```

## Status
🟡 **Design complete, build not started.** Ready to begin Phase 1.
