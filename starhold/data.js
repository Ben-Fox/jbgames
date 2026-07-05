/* STARHOLD — static data: resources, costs, map, aliens, event deck.
   All names, text, and art are original. Mechanics are classic
   space-colonization boardgame fare. */

const RES = ['fuel', 'alloy', 'carbon', 'biomass', 'goods'];
const RES_META = {
  fuel:    { label: 'Fuel',    color: '#e4593b', icon: 'F' },
  alloy:   { label: 'Alloy',   color: '#9aa7b8', icon: 'A' },
  carbon:  { label: 'Carbon',  color: '#5d6d7e', icon: 'C' },
  biomass: { label: 'Biomass', color: '#5cb85c', icon: 'B' },
  goods:   { label: 'Goods',   color: '#c9a227', icon: 'G' },
};

const COSTS = {
  settler:  { fuel: 1, alloy: 1, carbon: 1, biomass: 1 },  // settler ship
  envoy:    { fuel: 1, alloy: 1, carbon: 1, goods: 1 },    // envoy (trade) ship
  starport: { carbon: 3, biomass: 2 },                     // upgrade colony
  thruster: { fuel: 1, carbon: 1 },
  railgun:  { alloy: 1, carbon: 1 },
  cargopod: { goods: 1, carbon: 1 },
};
const MAX_THRUSTERS = 6, MAX_RAILGUNS = 6, MAX_CARGOPODS = 5;
const WIN_VP = 15;
const RESUPPLY_BELOW = 9;
const HAND_LIMIT = 7;

/* Flagship roll: draw 2 orbs from the bag. suns add speed, flare = event. */
const ORB_BAG = ['sun', 'sun', 'sun', 'nova', 'flare', 'flare'];
const ORB_SPEED = { sun: 1, nova: 2, flare: 0 };
const BASE_SPEED = 2;

/* ── Map ─────────────────────────────────────────────────────────────
   Axial hex grid, pointy-top. Hexes hold planets / hazards / alien
   stations / empty space. Ships travel corner-to-corner along lanes.
   Rows 0-1 (bottom) = home zone. */
const HEX_R = 74;
const MAP_HEXES = [
  // q, r, type, extra  — r grows downward visually; home row has larger r
  // Alien stations (top corners and flanks)
  { q: 1, r: 0, t: 'alien', race: 0 },
  { q: 4, r: 0, t: 'alien', race: 1 },
  { q: 0, r: 3, t: 'alien', race: 2 },
  { q: 5, r: 2, t: 'alien', race: 3 },

  // Planet systems: 11 systems of 3 planets each -> here each hex IS a planet.
  // res: which resource, n: production number, hz: hazard {kind, num} or null
  { q: 2, r: 0, t: 'planet', res: 'goods',   n: 9 },
  { q: 3, r: 0, t: 'planet', res: 'fuel',    n: 5, hz: { kind: 'raider', num: 2 } },
  { q: 1, r: 1, t: 'planet', res: 'alloy',   n: 6 },
  { q: 2, r: 1, t: 'planet', res: 'biomass', n: 10 },
  { q: 4, r: 1, t: 'planet', res: 'carbon',  n: 8 },
  { q: 5, r: 1, t: 'planet', res: 'goods',   n: 4, hz: { kind: 'frozen', num: 3 } },
  { q: 1, r: 2, t: 'planet', res: 'fuel',    n: 3 },
  { q: 2, r: 2, t: 'planet', res: 'carbon',  n: 11, hz: { kind: 'raider', num: 1 } },
  { q: 3, r: 2, t: 'planet', res: 'alloy',   n: 12 },
  { q: 4, r: 2, t: 'planet', res: 'biomass', n: 9 },
  { q: 2, r: 3, t: 'planet', res: 'fuel',    n: 6, hz: { kind: 'frozen', num: 2 } },
  { q: 3, r: 3, t: 'planet', res: 'carbon',  n: 5 },
  { q: 4, r: 3, t: 'planet', res: 'goods',   n: 8 },
  { q: 1, r: 4, t: 'planet', res: 'biomass', n: 4 },
  { q: 2, r: 4, t: 'planet', res: 'alloy',   n: 10 },
  { q: 3, r: 4, t: 'planet', res: 'fuel',    n: 11, hz: { kind: 'raider', num: 3 } },
  { q: 4, r: 4, t: 'planet', res: 'carbon',  n: 3 },

  // Home planets (bottom rows) — fixed starting colonies, modest numbers
  { q: 0, r: 5, t: 'home', res: 'fuel',    n: 8,  owner: 0 },
  { q: 1, r: 5, t: 'home', res: 'biomass', n: 6,  owner: 1 },
  { q: 2, r: 5, t: 'home', res: 'alloy',   n: 5,  owner: 2 },
  { q: 3, r: 5, t: 'home', res: 'carbon',  n: 9,  owner: 3 },
  { q: 0, r: 6, t: 'home', res: 'carbon',  n: 10, owner: 0 },
  { q: 1, r: 6, t: 'home', res: 'goods',   n: 12, owner: 1 },
  { q: 2, r: 6, t: 'home', res: 'goods',   n: 2,  owner: 2 },
  { q: 3, r: 6, t: 'home', res: 'biomass', n: 11, owner: 3 },
];

const ALIENS = [
  { name: 'The Veyr',  desc: 'Crystal-silicate collectors', color: '#7fd4e8',
    favors: ['veyr1', 'veyr2', 'veyr3'] },
  { name: 'The Kelth', desc: 'Nomadic gas-miners',          color: '#c58bde',
    favors: ['kelth1', 'kelth2', 'kelth3'] },
  { name: 'The Oduma', desc: 'Fungal collective',           color: '#8fd68a',
    favors: ['oduma1', 'oduma2', 'oduma3'] },
  { name: 'The Sarn',  desc: 'Proud warrior-shipwrights',   color: '#e8a06a',
    favors: ['sarn1', 'sarn2', 'sarn3'] },
];

const FAVORS = {
  veyr1:  { name: 'Crystal Lens',    text: 'Trade Alloy with the bank at 2:1.' },
  veyr2:  { name: 'Beacon Charts',   text: '+1 flagship speed, always.' },
  veyr3:  { name: 'Veyr Envoyship',  text: 'Gain 1 renown star now, and 1 Goods each time you found a colony.' },
  kelth1: { name: 'Gas Skimmers',    text: 'Trade Fuel with the bank at 2:1.' },
  kelth2: { name: 'Drift Maps',      text: '+1 flagship speed, always.' },
  kelth3: { name: 'Kelth Pact',      text: 'Gain 1 renown star now, and draw 1 free resource when you roll a flare.' },
  oduma1: { name: 'Spore Vats',      text: 'Trade Biomass with the bank at 2:1.' },
  oduma2: { name: 'Symbiont Hull',   text: 'Frozen worlds count as 1 easier for you.' },
  oduma3: { name: 'Oduma Communion', text: 'Gain 1 renown star now, and 1 Biomass each time a 7 is rolled.' },
  sarn1:  { name: 'Forge Rights',    text: 'Trade Carbon with the bank at 2:1.' },
  sarn2:  { name: 'Sarn Escort',     text: 'Raider dens count as 1 easier for you.' },
  sarn3:  { name: 'Honor Banner',    text: 'Gain 2 renown stars now.' },
};

/* ── Event deck (drawn on a flare) — original text, classic outcomes ── */
const EVENTS = [
  { id: 'derelict', title: 'Derelict Freighter',
    text: 'A dead freighter drifts across your bow, holds ajar.',
    choice: { a: 'Board it (need railguns 2+: gain 2 resources of choice, else lose 1 renown)',
              b: 'Pass by (nothing happens)' },
    resolve: { kind: 'check', stat: 'railguns', num: 2, win: { pick: 2 }, lose: { renown: -1 } } },
  { id: 'distress', title: 'Distress Call',
    text: 'An escape pod pings your channel from a tumbling wreck.',
    choice: { a: 'Rescue them (pay 1 Fuel: gain 1 renown star)',
              b: 'Ignore it (lose 1 renown star)' },
    resolve: { kind: 'pay', cost: { fuel: 1 }, win: { renown: 1 }, lose: { renown: -1 } } },
  { id: 'storm', title: 'Ion Storm',
    text: 'A crackling ion front swallows your route.',
    resolve: { kind: 'auto', effect: { speedThisTurn: -2 } } },
  { id: 'traders', title: 'Wandering Traders',
    text: 'A caravan of independent haulers offers a fair exchange.',
    resolve: { kind: 'auto', effect: { trade11: true } } },
  { id: 'raidamb', title: 'Raider Ambush',
    text: 'Raiders drop out of the dark, guns hot.',
    resolve: { kind: 'check', stat: 'railguns', num: 3, win: { renown: 1 }, lose: { discard: 2 } } },
  { id: 'comet', title: 'Comet Harvest',
    text: 'Your crew scoops volatiles off a passing comet tail.',
    resolve: { kind: 'auto', effect: { gain: { fuel: 1 } } } },
  { id: 'plague', title: 'Hull Blight',
    text: 'A corrosive spore colony is eating your plating.',
    resolve: { kind: 'pay', cost: { alloy: 1 }, win: {}, lose: { speedThisTurn: -2 } } },
  { id: 'envoys', title: 'Alien Emissary',
    text: 'A sleek unaligned craft matches your vector and extends greetings.',
    resolve: { kind: 'auto', effect: { renown: 1 } } },
  { id: 'blackbox', title: 'Black Box',
    text: 'You recover a flight recorder from a famous lost expedition.',
    resolve: { kind: 'auto', effect: { gain: { goods: 1 } } } },
  { id: 'mutiny', title: 'Restless Crew',
    text: 'Long months in the void. The crew wants shore leave you cannot give.',
    resolve: { kind: 'pay', cost: { biomass: 1 }, win: {}, lose: { renown: -1 } } },
  { id: 'wormhole', title: 'Slipstream',
    text: 'Sensors find a fold in space bending in your favor.',
    resolve: { kind: 'auto', effect: { speedThisTurn: 3 } } },
  { id: 'salvage', title: 'Battlefield Salvage',
    text: 'The silent wreckage of an old fleet action litters the sector.',
    choice: { a: 'Salvage (need railguns 1+: gain 1 Alloy and 1 Carbon, else nothing)',
              b: 'Leave it be' },
    resolve: { kind: 'check', stat: 'railguns', num: 1, win: { gain: { alloy: 1, carbon: 1 } }, lose: {} } },
];
