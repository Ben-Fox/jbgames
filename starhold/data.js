/* STARHOLD — static data (v2: mechanics adopted from the classic Starfarers
   ruleset; all names, prose, and art remain original). */

const RES = ['fuel', 'alloy', 'carbon', 'biomass', 'goods'];
const RES_META = {
  fuel:    { label: 'Fuel',    color: '#e4593b', icon: 'F' },
  alloy:   { label: 'Alloy',   color: '#9aa7b8', icon: 'A' },   // = ore
  carbon:  { label: 'Carbon',  color: '#5d6d7e', icon: 'C' },
  biomass: { label: 'Biomass', color: '#5cb85c', icon: 'B' },   // = food
  goods:   { label: 'Goods',   color: '#c9a227', icon: 'G' },   // = trade goods
};

/* exact build costs */
const COSTS = {
  settler:  { alloy: 1, carbon: 1, fuel: 1, biomass: 1 }, // colony ship
  envoy:    { alloy: 1, fuel: 1, goods: 2 },              // trade ship
  starport: { carbon: 3, biomass: 2 },                    // spaceport ring on a colony
  thruster: { fuel: 2 },                                  // booster
  railgun:  { carbon: 2 },                                // cannon
  cargopod: { alloy: 2 },                                 // freight ring
};

/* component limits (per player) */
const LIMITS = {
  transporters: 3,   // max ships on the board
  colonies: 9,
  outposts: 7,
  starports: 3,      // spaceport rings (1 used at setup)
  thrusters: 6, railguns: 6, cargopods: 5,
  fameMax: 11,       // max fame rings on the flagship
};

const WIN_VP = 15;
const RESUPPLY_BELOW = 9;
const HAND_LIMIT = 7;

/* Flagship holds 4 orbs; every roll shows 2. sun=3, ember=2, comet=2,
   flare=encounter (base speed 3 after any flare). */
const ORBS = [ { id: 'sun', v: 3 }, { id: 'ember', v: 2 },
               { id: 'comet', v: 2 }, { id: 'flare', v: 0 } ];
const FLARE_BASE = 3;

/* Galactic Bank: 20 cards per resource, 12 of each seeded into the shuffled
   reserve pile (leaving 8 per stack in the bank). Reserve refills with 6 of
   each from the bank when exhausted. */
const BANK_PER_RES = 20;
const RESERVE_SEED = 12;
const RESERVE_REFILL = 6;

/* ── Map ──────────────────────────────────────────────────────────
   Pointy-top axial hexes. A planetary SYSTEM is a triangle of 3 planet
   hexes {(q,r),(q+1,r),(q,r+1)}; the 3 corners shared by exactly two of
   its planets are the colony intersections. The corner shared by all
   three is removed (ships cannot cut through a system).
   Home systems carry fixed face-up numbers; frontier chips are dealt
   face-down from CHIP_POOL. */
const HEX_R = 36;

const SYSTEMS = [
  // 4 home systems across the bottom, 1 blank hex between groups
  { anchor: [-7, 17], home: 0, planets: [
    { res: 'fuel', n: 8 }, { res: 'carbon', n: 10 }, { res: 'biomass', n: 5 } ] },
  { anchor: [-4, 17], home: 1, planets: [
    { res: 'biomass', n: 6 }, { res: 'goods', n: 12 }, { res: 'fuel', n: 9 } ] },
  { anchor: [-1, 17], home: 2, planets: [
    { res: 'alloy', n: 5 }, { res: 'goods', n: 2 }, { res: 'carbon', n: 9 } ] },
  { anchor: [2, 17], home: 3, planets: [
    { res: 'carbon', n: 9 }, { res: 'biomass', n: 11 }, { res: 'alloy', n: 4 } ] },
];

/* 15 face-down SITES in 5 rows of 3 (never more than 3 across a line).
   At setup their contents are shuffled: 7 planetary systems, the 4
   civilizations, and 4 stretches of empty space. Nobody knows which is
   which until a ship reaches them. */
const SITE_ANCHORS = [
  [-5, 13], [-1, 13], [3, 13],
  [-3, 10], [1, 10], [4, 10],
  [-2, 7],  [2, 7],  [6, 7],
  [0, 4],   [4, 4],  [7, 4],
  [1, 1],   [5, 1],  [9, 1],
];

/* resource triples for the 7 planetary systems among the sites */
const FRONTIER_DEFS = [
  [ 'fuel', 'alloy', 'goods' ],
  [ 'carbon', 'biomass', 'fuel' ],
  [ 'goods', 'carbon', 'alloy' ],
  [ 'alloy', 'biomass', 'carbon' ],
  [ 'fuel', 'goods', 'biomass' ],
  [ 'carbon', 'fuel', 'alloy' ],
  [ 'biomass', 'alloy', 'goods' ],
];

/* frontier chip pool: 16 numbers + 3 raider dens + 2 frozen worlds */
const CHIP_POOL = [
  { n: 3 }, { n: 3 }, { n: 4 }, { n: 4 }, { n: 5 }, { n: 5 },
  { n: 6 }, { n: 6 }, { n: 8 }, { n: 8 }, { n: 9 }, { n: 9 },
  { n: 10 }, { n: 10 }, { n: 11 }, { n: 11 },
  { hz: 'raider', num: 3 }, { hz: 'raider', num: 5 }, { hz: 'raider', num: 7 },
  { hz: 'frozen', num: 2 }, { hz: 'frozen', num: 3 },
];
/* reserve chips replace captured hazard chips (drawn at random) */
const RESERVE_CHIPS = [4, 5, 6, 9, 10];

const ALIENS = [
  { name: 'The Concord',  desc: 'Silver-tongued mediators of the spiral arm', color: '#7fd4e8' },
  { name: 'The Verdani',  desc: 'Gardeners who coax life from bare rock',     color: '#8fd68a' },
  { name: 'The Guilders', desc: 'Shrewd traders who price entire worlds',     color: '#e8c14a' },
  { name: 'The Makers',   desc: 'Reclusive engineers of impossible ships',    color: '#c58bde' },
];
/* The Wayfarers: no home base; met only through deep-space events. */

/* Diplomatic favors — 5 per race, exact effects (original names) */
const FAVORS = {
  // Concord (diplomat-style)
  con_hand:   { race: 0, name: 'Open Hand',        text: 'Each turn: draw 1 random card from up to two players with more VP than you (unusable while you lead).' },
  con_shield: { race: 0, name: 'Tribute Shield',   text: 'On a 7, you only discard if holding more than 12 cards.' },
  con_star1:  { race: 0, name: 'Star of Renown',   text: 'During your build phase, buy renown stars for 1 Goods each (flagship max 6 stars via purchase).' },
  con_star2:  { race: 0, name: 'Star of Renown',   text: 'During your build phase, buy renown stars for 1 Goods each (flagship max 6 stars via purchase).' },
  con_relief: { race: 0, name: 'Relief Convoy',    text: 'If a production roll (not a 7) pays you nothing, take 1 resource of your choice.' },
  // Verdani (green-folk-style production increases)
  ver_fuel:   { race: 1, name: 'Bloom: Fuel',      text: 'Whenever production pays you Fuel, gain 1 extra Fuel.' },
  ver_alloy:  { race: 1, name: 'Bloom: Alloy',     text: 'Whenever production pays you Alloy, gain 1 extra Alloy.' },
  ver_carbon: { race: 1, name: 'Bloom: Carbon',    text: 'Whenever production pays you Carbon, gain 1 extra Carbon.' },
  ver_bio:    { race: 1, name: 'Bloom: Biomass',   text: 'Whenever production pays you Biomass, gain 1 extra Biomass.' },
  ver_goods:  { race: 1, name: 'Bloom: Goods',     text: 'Whenever production pays you Goods, gain 1 extra Goods.' },
  // Guilders (merchant-style trade rates)
  gui_carbon: { race: 2, name: 'Charter: Carbon',  text: 'Trade Carbon with the bank at 2:1.' },
  gui_alloy:  { race: 2, name: 'Charter: Alloy',   text: 'Trade Alloy with the bank at 2:1.' },
  gui_fuel:   { race: 2, name: 'Charter: Fuel',    text: 'Trade Fuel with the bank at 2:1.' },
  gui_bio:    { race: 2, name: 'Charter: Biomass', text: 'Trade Biomass with the bank at 2:1.' },
  gui_goods:  { race: 2, name: 'Golden Ledger',    text: 'Once per turn, trade 1 Goods for any 1 resource.' },
  // Makers (scientist-style ship tech)
  mak_gun:    { race: 3, name: 'Gunwright Codex',  text: '+2 combat strength, always.' },
  mak_speed:  { race: 3, name: 'Drive Schematics', text: '+2 flagship speed, always.' },
  mak_both1:  { race: 3, name: 'Hull Refit',       text: '+1 speed and +1 combat strength, always.' },
  mak_both2:  { race: 3, name: 'Hull Refit',       text: '+1 speed and +1 combat strength, always.' },
  mak_both3:  { race: 3, name: 'Hull Refit',       text: '+1 speed and +1 combat strength, always.' },
};
const RACE_FAVORS = [
  ['con_hand', 'con_shield', 'con_star1', 'con_star2', 'con_relief'],
  ['ver_fuel', 'ver_alloy', 'ver_carbon', 'ver_bio', 'ver_goods'],
  ['gui_carbon', 'gui_alloy', 'gui_fuel', 'gui_bio', 'gui_goods'],
  ['mak_gun', 'mak_speed', 'mak_both1', 'mak_both2', 'mak_both3'],
];

/* ── Deep-space event deck: 32 cards, original prose, effect types drawn
   from the classic taxonomy: resource gifts/losses, fame gains/losses,
   lose-an-expansion, first-ship-grounded, free expansion, free trade ship,
   space jumps, raider combat (fresh flagship roll + railguns vs theirs),
   speed contests, and donation appeals. 2 "Hullwear" cards hit everyone. */
const EVENTS = [
  { n: 2, id: 'hullwear', title: 'Hullwear', all: true,
    text: 'Micrometeorite season. Every fleet limps a little.',
    resolve: { kind: 'allpay', cost: { fuel: 1 }, elsegrounded: true } },
  { n: 3, id: 'raiders', title: 'Raider Skirmish',
    text: 'A raider wing slides out of an asteroid shadow, weapons live.',
    resolve: { kind: 'combat', foe: 1, win: { fame: 1 }, lose: { cards: 2 } } },
  { n: 2, id: 'raidboss', title: 'Corsair Flotilla',
    text: 'Three hulls, one black banner. They want your cargo, not your company.',
    resolve: { kind: 'combat', foe: 3, win: { fame: 2 }, lose: { cards: 3 } } },
  { n: 2, id: 'race', title: 'Drift Race',
    text: 'A rival captain flashes a challenge: first through the shoal wins bragging rights.',
    resolve: { kind: 'speedduel', win: { fame: 1 }, lose: {} } },
  { n: 3, id: 'derelict', title: 'Derelict Freighter',
    text: 'A dead freighter drifts across your bow, holds ajar.',
    choice: { a: 'Board it', b: 'Pass by' },
    resolve: { kind: 'combat', foe: 0, win: { pick: 2 }, lose: { fame: -1 } } },
  { n: 3, id: 'distress', title: 'Distress Call',
    text: 'An escape pod pings your channel from a tumbling wreck.',
    choice: { a: 'Rescue them (pay 1 Fuel)', b: 'Ignore it' },
    resolve: { kind: 'pay', cost: { fuel: 1 }, win: { fame: 1 }, lose: { fame: -1 } } },
  { n: 3, id: 'wayfarers', title: 'The Wayfarers',
    text: 'A silent silver needle of a ship matches your vector. The Wayfarers are listening.',
    resolve: { kind: 'donate', threshold: 2, win: { fame: 1, jump: true }, lose: { fame: -1 } } },
  { n: 2, id: 'guilder_gift', title: 'Guilder Toll',
    text: 'A merchant convoy demands a courtesy gift before sharing the lane.',
    resolve: { kind: 'donate', threshold: 1, win: { pick: 2 }, lose: { grounded: true } } },
  { n: 2, id: 'storm', title: 'Ion Storm',
    text: 'A crackling ion front swallows the route ahead.',
    resolve: { kind: 'auto', effect: { grounded: true } } },
  { n: 2, id: 'slipstream', title: 'Slipstream',
    text: 'Sensors find a fold in space bending in your favor.',
    resolve: { kind: 'auto', effect: { jump: true } } },
  { n: 2, id: 'yard', title: 'Abandoned Shipyard',
    text: 'A mothballed orbital yard, still humming on standby power.',
    resolve: { kind: 'auto', effect: { freeExpansion: true } } },
  { n: 1, id: 'flotsam', title: 'Flotsam Field',
    text: 'The debris of somebody’s bad day is your good one.',
    resolve: { kind: 'auto', effect: { gain: { alloy: 1, carbon: 1 } } } },
  { n: 1, id: 'comet', title: 'Comet Harvest',
    text: 'Your crew scoops volatiles off a passing comet tail.',
    resolve: { kind: 'auto', effect: { gain: { fuel: 2 } } } },
  { n: 1, id: 'envoy', title: 'Grateful Colonists',
    text: 'A struggling colony you once resupplied broadcasts your name with honor.',
    resolve: { kind: 'auto', effect: { fame: 1 } } },
  { n: 1, id: 'sabotage', title: 'Saboteur Aboard',
    text: 'Someone paid a dockhand to loosen the wrong bolts.',
    resolve: { kind: 'auto', effect: { loseExpansion: true } } },
  { n: 1, id: 'freeship', title: 'Salvaged Hull',
    text: 'A sound trade hull, adrift and unclaimed. Finders keepers.',
    resolve: { kind: 'auto', effect: { freeTradeShip: true } } },
  { n: 1, id: 'blight', title: 'Hull Blight',
    text: 'A corrosive spore colony is eating your plating.',
    resolve: { kind: 'pay', cost: { alloy: 1 }, win: {}, lose: { grounded: true } } },
];
