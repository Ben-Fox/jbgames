/* STARHOLD engine + UI (v2 — exact classic ruleset; original theme). */
(function () {
'use strict';

/* ── hex math ────────────────────────────────────────────────── */
const SQ3 = Math.sqrt(3);
function hexCenter(q, r) {
  return { x: HEX_R * SQ3 * (q + r / 2) + 20, y: HEX_R * 1.5 * r + 70 };
}
function corner(c, i) {
  const a = Math.PI / 180 * (60 * i - 90);
  return { x: c.x + HEX_R * Math.cos(a), y: c.y + HEX_R * Math.sin(a) };
}
const nk = (x, y) => Math.round(x) + ',' + Math.round(y);

/* ── board build ─────────────────────────────────────────────── */
const nodes = new Map();   // key -> {x,y,key,structure,planets:[],colonyInt:sysId|null,outpost:{race,num}|null}
const edges = new Map();
const planets = [];        // {id,sysId,cx,cy,res,chip:{n}|{hz,num}|null,faceUp,corners:[]}
const systems = [];        // {id,home,planetIds:[],colonyInts:[]}
const alienBases = [];     // {race,cx,cy,slots:[{node,num,owner}]}

function addHexNodes(cx, cy) {
  const keys = [];
  for (let i = 0; i < 6; i++) {
    const p = corner({ x: cx, y: cy }, i);
    const key = nk(p.x, p.y);
    if (!nodes.has(key)) nodes.set(key, { x: p.x, y: p.y, key, structure: null,
      planets: [], colonyInt: null, outpost: null, dead: false });
    keys.push(key);
  }
  return keys;
}
function addHexEdges(keys) {
  for (let i = 0; i < 6; i++) {
    const a = keys[i], b = keys[(i + 1) % 6];
    edges.set([a, b].sort().join('|'), { a, b });
  }
}

SYSTEMS.forEach((sysDef, sid) => {
  const [q, r] = sysDef.anchor;
  const hexQR = [[q, r], [q + 1, r], [q, r + 1]];
  const sys = { id: sid, home: sysDef.home ?? null, planetIds: [], colonyInts: [] };
  const cornerCount = new Map();
  hexQR.forEach(([hq, hr], pi) => {
    const c = hexCenter(hq, hr);
    const keys = addHexNodes(c.x, c.y);
    addHexEdges(keys);
    const pdef = sysDef.planets[pi];
    const planet = { id: planets.length, sysId: sid, cx: c.x, cy: c.y,
      res: pdef.res, chip: pdef.n !== undefined ? { n: pdef.n } : null,
      faceUp: pdef.n !== undefined, corners: keys };
    planets.push(planet);
    sys.planetIds.push(planet.id);
    keys.forEach(k => {
      nodes.get(k).planets.push(planet.id);
      cornerCount.set(k, (cornerCount.get(k) || 0) + 1);
    });
  });
  for (const [k, cnt] of cornerCount) {
    if (cnt === 3) nodes.get(k).dead = true;               // system core: impassable
    else if (cnt === 2) { nodes.get(k).colonyInt = sid; sys.colonyInts.push(k); }
  }
  systems.push(sys);
});

ALIEN_HEXES.forEach(({ q, r, race }) => {
  const c = hexCenter(q, r);
  const keys = addHexNodes(c.x, c.y);
  addHexEdges(keys);
  // outpost slots: 5 corners that are not colony intersections / dead cores
  const usable = keys.filter(k => !nodes.get(k).colonyInt && !nodes.get(k).dead);
  const slots = usable.slice(0, 5).map((k, i) => ({ node: k, num: i + 1, owner: null }));
  slots.forEach(s => { nodes.get(s.node).outpost = { race, num: s.num }; });
  alienBases.push({ race, cx: c.x, cy: c.y, slots });
});

const adj = new Map();
for (const { a, b } of edges.values()) {
  if (nodes.get(a).dead || nodes.get(b).dead) continue;
  if (!adj.has(a)) adj.set(a, []);
  if (!adj.has(b)) adj.set(b, []);
  adj.get(a).push(b); adj.get(b).push(a);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── game state ──────────────────────────────────────────────── */
const S = {
  players: [], cur: 0, turn: 1, over: false,
  phase: 'build',               // build | flight
  rolledFlag: false, speed: 0,
  bank: {}, reserve: [], reserveChips: RESERVE_CHIPS.slice(),
  eventDeck: [], eventDiscard: [],
  chips: [],                     // friendship chips: chips[race] = playerIdx|null
  placingShip: null, jumpShip: null, goldenUsed: false,
};

function newPlayer(i, name, kind) {
  return { i, name, kind,
    res: { fuel: 0, alloy: 0, carbon: 0, biomass: 0, goods: 0 },
    ships: [], transporters: [1, 2, 3],
    thrusters: 0, railguns: 0, cargopods: 0, fame: 0,
    colonies: [], starports: [], outposts: [], favors: [],
    capturedChips: 0, knowledge: new Set(), grounded: false,
    modulesColony: 9, modulesOutpost: 7,
  };
}

function vp(p) {
  const chips = S.chips.filter(c => c === p.i).length;
  return p.colonies.length + 2 * p.starports.length + 2 * chips +
         p.capturedChips + Math.min(Math.floor(p.fame / 2), 5);
}
function hasFavor(p, id) { return p.favors.includes(id); }
function speedBonus(p) {
  return (hasFavor(p, 'mak_speed') ? 2 : 0) +
    ['mak_both1', 'mak_both2', 'mak_both3'].filter(f => hasFavor(p, f)).length;
}
function combatBonus(p) {
  return (hasFavor(p, 'mak_gun') ? 2 : 0) +
    ['mak_both1', 'mak_both2', 'mak_both3'].filter(f => hasFavor(p, f)).length;
}
function combatStrength(p) { return p.railguns + combatBonus(p); }
function handSize(p) { return RES.reduce((s, r) => s + p.res[r], 0); }

/* bank / reserve */
function bankGive(p, r, n) {
  const got = Math.min(n, S.bank[r]);
  S.bank[r] -= got; p.res[r] += got;
  return got;
}
function playerSpend(p, cost) {
  for (const r in cost) { p.res[r] -= cost[r]; S.bank[r] += cost[r]; }
}
function reserveDraw(p, n) {
  let got = 0;
  for (let i = 0; i < n; i++) {
    if (!S.reserve.length) {
      for (const r of RES) {
        const take = Math.min(RESERVE_REFILL, S.bank[r]);
        S.bank[r] -= take;
        for (let k = 0; k < take; k++) S.reserve.push(r);
      }
      shuffle(S.reserve);
      if (!S.reserve.length) break;
    }
    const r = S.reserve.pop();
    p.res[r]++; got++;
  }
  return got;
}

/* ── setup ───────────────────────────────────────────────────── */
function startGame(cfg) {
  S.players = cfg.map((c, i) => newPlayer(i, c.name, c.kind));
  for (const r of RES) S.bank[r] = BANK_PER_RES - RESERVE_SEED;
  S.reserve = shuffle(RES.flatMap(r => Array(RESERVE_SEED).fill(r)));
  S.chips = [null, null, null, null];
  S.eventDeck = shuffle(EVENTS.flatMap(e => Array(e.n).fill(e)));

  const pool = shuffle(CHIP_POOL.slice());
  for (const pl of planets) if (!pl.chip) pl.chip = { ...pool.pop() };

  for (const p of S.players) {
    const sys = systems.find(s => s.home === p.i);
    const [c1, c2, c3] = sys.colonyInts;
    nodes.get(c1).structure = { owner: p.i, kind: 'starport' };
    p.starports.push(c1);
    nodes.get(c2).structure = { owner: p.i, kind: 'colony' };
    nodes.get(c3).structure = { owner: p.i, kind: 'colony' };
    p.colonies.push(c2, c3);
    const spot = (adj.get(c1) || []).find(k => !nodes.get(k).structure && !nodes.get(k).dead);
    p.ships.push({ kind: 'settler', node: spot, rings: p.transporters.shift(),
                   moved: false, mustVacate: null });
    reserveDraw(p, 3);
    p.fame = 1;
    for (const pl of planets) if (pl.faceUp) p.knowledge.add(pl.id);
  }
  log(`— Game start: ${S.players.map(p => p.name).join(', ')} —`);
  beginTurn();
}

/* ── helpers ─────────────────────────────────────────────────── */
function cur() { return S.players[S.cur]; }
function firstShip(p) {
  if (!p.ships.length) return null;
  return p.ships.reduce((m, s) => s.rings < m.rings ? s : m, p.ships[0]);
}
function chipKnown(pl, playerIdx) {
  return pl.faceUp || S.players[playerIdx].knowledge.has(pl.id);
}
function revealTo(p, planetId) { p.knowledge.add(planetId); }
function flipUp(planetId) {
  planets[planetId].faceUp = true;
  for (const p of S.players) p.knowledge.add(planetId);
}

/* ── turn flow ───────────────────────────────────────────────── */
function beginTurn() {
  const p = cur();
  S.rolledFlag = false; S.speed = 0; S.phase = 'build'; S.goldenUsed = false;
  S.placingShip = null; S.jumpShip = null;
  for (const sh of p.ships) sh.moved = false;
  banner(`${p.name} — turn ${S.turn}`);
  rollProduction();
  if (!S.over && vp(p) < RESUPPLY_BELOW) {
    if (reserveDraw(p, 1)) log(`${p.name} draws 1 supply card from the home reserve.`);
  }
  if (hasFavor(p, 'con_hand')) {
    const richer = S.players.filter(x => x !== p && vp(x) > vp(p));
    for (const v of richer.slice(0, 2)) {
      const have = RES.filter(r => v.res[r] > 0);
      if (have.length) {
        const r = have[Math.floor(Math.random() * have.length)];
        v.res[r]--; p.res[r]++;
        log(`${p.name} draws a card from ${v.name} (Open Hand).`);
      }
    }
  }
  render();
  if (p.kind === 'bot' && !S.over) setTimeout(botTurn, 450);
}

function rollProduction() {
  const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
  const roll = d1 + d2;
  log(`Production roll: ${d1}+${d2} = ${roll}`);
  if (roll === 7) { tribute(); return; }
  // payout order: current player first (bank stacks can run dry)
  const order = [];
  for (let k = 0; k < S.players.length; k++) order.push(S.players[(S.cur + k) % S.players.length]);
  for (const p of order) {
    const paid = {};
    for (const key of [...p.colonies, ...p.starports]) {
      for (const plid of nodes.get(key).planets) {
        const pl = planets[plid];
        if (!pl.chip || pl.chip.hz || pl.chip.n !== roll) continue;
        if (bankGive(p, pl.res, 1)) paid[pl.res] = (paid[pl.res] || 0) + 1;
      }
    }
    for (const r in paid) {
      const bloom = { fuel: 'ver_fuel', alloy: 'ver_alloy', carbon: 'ver_carbon',
                      biomass: 'ver_bio', goods: 'ver_goods' }[r];
      if (hasFavor(p, bloom) && bankGive(p, r, 1)) paid[r]++;
      log(`${p.name} +${paid[r]} ${RES_META[r].label}`);
    }
    if (!Object.keys(paid).length && hasFavor(p, 'con_relief') && p === cur()) {
      const r = 'fuel';
      if (bankGive(p, r, 1)) log(`${p.name} takes 1 ${RES_META[r].label} (Relief Convoy).`);
    }
  }
}

function tribute() {
  log('A 7! The homeworld demands tribute.');
  for (const p of S.players) {
    const limit = hasFavor(p, 'con_shield') ? 12 : HAND_LIMIT;
    const n = handSize(p);
    if (n > limit) {
      let drop = Math.floor(n / 2);
      let lost = 0;
      while (drop > 0) {
        const have = RES.filter(r => p.res[r] > 0);
        const r = have[Math.floor(Math.random() * have.length)];
        p.res[r]--; S.bank[r]++; drop--; lost++;
      }
      log(`${p.name} pays tribute: ${lost} cards.`);
    }
  }
  const p = cur();
  const victims = S.players.filter(x => x !== p && handSize(x) > 0);
  if (!victims.length) return;
  if (p.kind === 'bot') {
    victims.sort((a, b) => handSize(b) - handSize(a));
    stealFrom(p, victims[0]);
  } else {
    showVictimModal(p, victims);
  }
}
function stealFrom(p, v) {
  const have = RES.filter(r => v.res[r] > 0);
  const r = have[Math.floor(Math.random() * have.length)];
  v.res[r]--; p.res[r]++;
  log(`${p.name} collects a tribute card from ${v.name}.`);
  render();
}

/* ── flagship roll & flight ──────────────────────────────────── */
function rollOrbs() {
  const bag = shuffle(ORBS.slice());
  return [bag[0], bag[1]];
}
function rollFlagship() {
  if (S.rolledFlag) return;
  const p = cur();
  const draw = rollOrbs();
  const flare = draw.some(o => o.id === 'flare');
  const base = flare ? FLARE_BASE : draw[0].v + draw[1].v;
  S.speed = base + p.thrusters + speedBonus(p);
  S.rolledFlag = true; S.phase = 'flight';
  log(`${p.name} rolls the flagship: ${draw.map(o => o.id).join(' + ')} -> base ${base}, total ${S.speed}${flare ? ' — FLARE!' : ''}`);
  if (p.grounded) {
    const fs = firstShip(p);
    if (fs) { fs.moved = true; log(`${p.name}'s lead ship is grounded this turn (hullwear).`); }
    p.grounded = false;
  }
  if (flare) drawEvent();
  render();
}

function drawEvent() {
  if (!S.eventDeck.length) {
    S.eventDeck = shuffle(S.eventDiscard); S.eventDiscard = [];
  }
  const ev = S.eventDeck.pop();
  S.eventDiscard.push(ev);
  const p = cur();
  log(`Deep-space event: ${ev.title}`);
  if (p.kind === 'bot') resolveEvent(ev, p);
  else showEventModal(ev, p);
}

function eventCombat(p, foeMod) {
  const mine = rollOrbs().reduce((s, o) => s + o.v, 0) + combatStrength(p);
  const theirs = rollOrbs().reduce((s, o) => s + o.v, 0) + foeMod;
  log(`Battle: ${p.name} ${mine} vs raiders ${theirs}.`);
  return mine >= theirs;
}
function eventSpeedDuel(p) {
  const mine = rollOrbs().reduce((s, o) => s + o.v, 0) + p.thrusters + speedBonus(p);
  const theirs = rollOrbs().reduce((s, o) => s + o.v, 0) + 2;
  log(`Race: ${p.name} ${mine} vs rival ${theirs}.`);
  return mine >= theirs;
}

function applyEffect(p, eff) {
  if (!eff) { render(); return; }
  if (eff.fame) {
    p.fame = Math.max(0, Math.min(LIMITS.fameMax, p.fame + eff.fame));
    log(`${p.name} ${eff.fame > 0 ? 'gains' : 'loses'} ${Math.abs(eff.fame)} renown star(s).`);
  }
  if (eff.gain) for (const r in eff.gain) {
    const got = bankGive(p, r, eff.gain[r]);
    if (got) log(`${p.name} +${got} ${RES_META[r].label}.`);
  }
  if (eff.cards) {
    let n = eff.cards;
    while (n > 0 && handSize(p) > 0) {
      const have = RES.filter(r => p.res[r] > 0);
      const r = have[Math.floor(Math.random() * have.length)];
      p.res[r]--; S.bank[r]++; n--;
    }
    log(`${p.name} surrenders cards to the raiders.`);
  }
  if (eff.grounded) {
    const fs = firstShip(p);
    if (fs) { fs.moved = true; log(`${p.name}'s lead ship cannot fly this turn.`); }
  }
  if (eff.loseExpansion && (p.thrusters + p.railguns + p.cargopods) > 0) {
    if (p.kind === 'bot') {
      if (p.thrusters) p.thrusters--;
      else if (p.railguns) p.railguns--;
      else p.cargopods--;
      log(`${p.name} loses a flagship expansion.`);
    } else { showLoseExpansionModal(p); return; }
  }
  if (eff.freeExpansion) {
    if (p.kind === 'bot') {
      if (p.cargopods < LIMITS.cargopods) p.cargopods++;
      else if (p.railguns < LIMITS.railguns) p.railguns++;
      else if (p.thrusters < LIMITS.thrusters) p.thrusters++;
      log(`${p.name} gains a free flagship expansion.`);
    } else { showFreeExpansionModal(p); return; }
  }
  if (eff.freeTradeShip) {
    const spot = openSpaceportSpot(p);
    if (p.transporters.length && p.modulesOutpost > 0 && spot) {
      p.ships.push({ kind: 'envoy', node: spot, rings: p.transporters.shift(), moved: false, mustVacate: null });
      log(`${p.name} salvages a free envoy ship!`);
    } else log('No berth or hull available for the salvaged ship.');
  }
  if (eff.pick) {
    if (p.kind === 'bot') {
      for (let i = 0; i < eff.pick; i++) bankGive(p, RES[Math.floor(Math.random() * RES.length)], 1);
      log(`${p.name} claims ${eff.pick} resources.`);
    } else { showPickModal(p, eff.pick); return; }
  }
  if (eff.jump) {
    const fs = firstShip(p);
    if (fs && !fs.moved) {
      if (p.kind === 'bot') botJump(p, fs);
      else { S.jumpShip = fs; toast('Space jump! Click any legal waypoint for your lead ship.'); }
    }
  }
  checkWin(); render();
}

function resolveEvent(ev, p) {
  const r = ev.resolve;
  if (r.kind === 'allpay') {
    for (const pl of S.players) {
      if (pl.res.fuel >= 1) { playerSpend(pl, { fuel: 1 }); log(`${pl.name} patches the hull (1 Fuel).`); }
      else { pl.grounded = true; log(`${pl.name}'s lead ship will be grounded next turn.`); }
    }
    render(); return;
  }
  if (r.kind === 'auto') { applyEffect(p, r.effect); return; }
  if (r.kind === 'combat') { applyEffect(p, eventCombat(p, r.foe) ? r.win : r.lose); return; }
  if (r.kind === 'speedduel') { applyEffect(p, eventSpeedDuel(p) ? r.win : r.lose); return; }
  if (r.kind === 'pay') {
    if (RES.every(x => p.res[x] >= (r.cost[x] || 0))) { playerSpend(p, r.cost); applyEffect(p, r.win); }
    else applyEffect(p, r.lose);
    return;
  }
  if (r.kind === 'donate') {
    if (handSize(p) >= r.threshold) {
      let n = r.threshold;
      while (n > 0) {
        const have = RES.filter(x => p.res[x] > 0);
        const x = have[0]; p.res[x]--; S.bank[x]++; n--;
      }
      log(`${p.name} donates ${r.threshold} card(s).`);
      applyEffect(p, r.win);
    } else applyEffect(p, r.lose);
  }
}

/* ── movement ────────────────────────────────────────────────── */
function bfsPaths(fromKey, maxDist) {
  const dist = new Map([[fromKey, 0]]);
  const parent = new Map();
  const q = [fromKey];
  while (q.length) {
    const k = q.shift();
    const d = dist.get(k);
    if (d >= maxDist) continue;
    for (const nb of (adj.get(k) || [])) {
      if (!dist.has(nb)) { dist.set(nb, d + 1); parent.set(nb, k); q.push(nb); }
    }
  }
  return { dist, parent };
}

function legalEnd(ship, p, key) {
  const n = nodes.get(key);
  if (!n || n.dead || n.structure) return false;
  if (key === ship.node) return false;
  if (S.players.some(pl => pl.ships.some(s2 => s2 !== ship && s2.node === key))) return false;
  for (const pl of S.players) {           // no blockading rival starports
    if (pl === p) continue;
    for (const spKey of pl.starports) {
      if ((adj.get(spKey) || []).includes(key)) return false;
    }
  }
  if (ship.mustVacate === key) return false;
  if (ship.kind === 'settler' && n.outpost) return false;
  if (ship.kind === 'envoy') {
    if (n.colonyInt !== null) return false;
    if (n.outpost && !canFoundOutpost(p, n)) return false;
  }
  return true;
}

function canFoundOutpost(p, n) {
  const base = alienBases[n.outpost.race];
  const open = base.slots.filter(s => s.owner === null);
  if (!open.length) return false;
  const lowest = open.reduce((m, s) => Math.min(m, s.num), 9);
  return n.outpost.num === lowest && p.cargopods >= n.outpost.num && p.modulesOutpost > 0;
}

function pathPlanets(parent, destKey, fromKey) {
  const seen = new Set();
  let k = destKey;
  while (k && k !== fromKey) {
    for (const plid of nodes.get(k).planets) seen.add(plid);
    k = parent.get(k);
  }
  return seen;
}

function tryMoveShip(ship, destKey, jump) {
  const p = cur();
  if (!jump) {
    if (!S.rolledFlag) { toast('Roll the flagship first.'); return false; }
    if (ship.moved) { toast('That ship already flew this turn.'); return false; }
  }
  const { dist, parent } = bfsPaths(ship.node, jump ? 999 : S.speed);
  if (!jump && !dist.has(destKey)) return false;
  if (!legalEnd(ship, p, destKey)) { toast('Cannot end the flight there.'); return false; }
  if (!jump) {
    for (const plid of pathPlanets(parent, destKey, ship.node)) {
      if (!chipKnown(planets[plid], p.i)) revealTo(p, plid);
    }
  } else {
    for (const plid of nodes.get(destKey).planets) revealTo(p, plid);
  }
  ship.node = destKey; ship.moved = true; ship.mustVacate = null;
  afterLanding(ship, p);
  render();
  return true;
}

function afterLanding(ship, p) {
  const n = nodes.get(ship.node);
  for (const plid of n.planets) {
    const pl = planets[plid];
    if (pl.chip && pl.chip.hz === 'raider' && chipKnown(pl, p.i)) {
      if (ship.kind === 'envoy' && n.colonyInt !== null) continue;
      if (combatStrength(p) >= pl.chip.num) {
        p.capturedChips++;
        log(`${p.name} storms the raider den (guns ${combatStrength(p)} vs ${pl.chip.num}) — +1 VP!`);
        replaceChip(pl);
      }
    }
  }
  if (ship.kind === 'settler' && n.colonyInt !== null) {
    n.planets.forEach(plid => revealTo(p, plid));   // exploring the site
    const blocked = n.planets.some(plid => planets[plid].chip && planets[plid].chip.hz);
    if (!blocked) foundColony(ship, p, n);
    else {
      ship.mustVacate = ship.node;
      log(`${p.name} finds the site hazardous — no colony can be founded yet.`);
    }
  }
  if (ship.kind === 'envoy' && n.outpost && canFoundOutpost(p, n)) {
    foundOutpost(ship, p, n);
  }
  checkWin();
}

function foundColony(ship, p, n) {
  if (p.modulesColony <= 0) return;
  n.structure = { owner: p.i, kind: 'colony' };
  p.colonies.push(n.key);
  p.modulesColony--;
  p.transporters.push(ship.rings); p.transporters.sort();
  p.ships = p.ships.filter(s => s !== ship);
  n.planets.forEach(flipUp);
  log(`${p.name} founds a colony (+1 VP).`);
}

function foundOutpost(ship, p, n) {
  const base = alienBases[n.outpost.race];
  base.slots.find(s => s.num === n.outpost.num).owner = p.i;
  p.outposts.push({ race: n.outpost.race, num: n.outpost.num });
  p.modulesOutpost--;
  n.structure = { owner: p.i, kind: 'outpost' };
  p.transporters.push(ship.rings); p.transporters.sort();
  p.ships = p.ships.filter(s => s !== ship);
  log(`${p.name} founds a trading outpost with ${ALIENS[n.outpost.race].name}.`);
  updateFriendshipChip(n.outpost.race);
  offerFavor(p, n.outpost.race);
}

function updateFriendshipChip(race) {
  const counts = S.players.map(p => p.outposts.filter(o => o.race === race).length);
  const max = Math.max(...counts);
  if (max === 0) return;
  const tied = S.players.filter((p, i) => counts[i] === max);
  let holder = tied[0];
  if (tied.length > 1) {
    holder = tied.reduce((best, p) => {
      const lo = Math.min(...p.outposts.filter(o => o.race === race).map(o => o.num));
      const bl = Math.min(...best.outposts.filter(o => o.race === race).map(o => o.num));
      return lo < bl ? p : best;
    });
  }
  if (S.chips[race] !== holder.i) {
    if (S.chips[race] !== null)
      log(`${holder.name} takes the ${ALIENS[race].name} friendship medallion from ${S.players[S.chips[race]].name}!`);
    else
      log(`${holder.name} earns the ${ALIENS[race].name} friendship medallion (+2 VP).`);
    S.chips[race] = holder.i;
  }
}

function offerFavor(p, race) {
  const taken = S.players.flatMap(x => x.favors);
  const pool = RACE_FAVORS[race].filter(f => !taken.includes(f));
  if (!pool.length) return;
  if (p.kind === 'bot') { grantFavor(p, pool[0]); return; }
  showFavorModal(p, race, pool);
}
function grantFavor(p, fid) {
  p.favors.push(fid);
  log(`${p.name} receives a favor: ${FAVORS[fid].name}.`);
  checkWin(); render();
}

function replaceChip(pl) {
  const pick = S.reserveChips.length
    ? S.reserveChips.splice(Math.floor(Math.random() * S.reserveChips.length), 1)[0]
    : 6;
  pl.chip = { n: pick };
  pl.faceUp = false;
  for (const p of S.players) p.knowledge.delete(pl.id);
  revealTo(cur(), pl.id);
}

/* frozen worlds: the ship must END the turn adjacent */
function endTurnHazards(p) {
  for (const ship of p.ships) {
    for (const plid of nodes.get(ship.node).planets) {
      const pl = planets[plid];
      if (pl.chip && pl.chip.hz === 'frozen' && chipKnown(pl, p.i) &&
          p.cargopods >= pl.chip.num) {
        p.capturedChips++;
        log(`${p.name} thaws the frozen world (pods ${p.cargopods} vs ${pl.chip.num}) — +1 VP!`);
        replaceChip(pl);
      }
    }
  }
}

/* ── building ────────────────────────────────────────────────── */
function canAfford(p, cost) { return Object.entries(cost).every(([k, v]) => p.res[k] >= v); }

function openSpaceportSpot(p) {
  for (const spKey of p.starports) {
    for (const k of (adj.get(spKey) || [])) {
      const n = nodes.get(k);
      if (n.dead || n.structure) continue;
      if (S.players.some(pl => pl.ships.some(s => s.node === k))) continue;
      return k;
    }
  }
  return null;
}

function buildShip(p, kind) {
  if (S.phase === 'flight') { toast('No building during the flight phase.'); return; }
  if (!p.transporters.length) { toast('All 3 transporters are deployed.'); return; }
  if (kind === 'settler' && p.modulesColony <= 0) { toast('No colony modules left.'); return; }
  if (kind === 'envoy' && p.modulesOutpost <= 0) { toast('No outpost modules left.'); return; }
  const spot = openSpaceportSpot(p);
  if (!spot) { toast('No open launch berth beside your starports.'); return; }
  if (!canAfford(p, COSTS[kind])) return;
  playerSpend(p, COSTS[kind]);
  p.ships.push({ kind, node: spot, rings: p.transporters.shift(), moved: false, mustVacate: null });
  log(`${p.name} launches a${kind === 'envoy' ? 'n envoy' : ' settler'} ship.`);
  render();
}

function buildStarport(p) {
  if (S.phase === 'flight') { toast('No building during the flight phase.'); return; }
  if (p.starports.length >= LIMITS.starports) { toast('All starport rings used.'); return; }
  const target = p.colonies[0];
  if (!target) { toast('No colony to upgrade.'); return; }
  if (!canAfford(p, COSTS.starport)) return;
  playerSpend(p, COSTS.starport);
  nodes.get(target).structure.kind = 'starport';
  p.colonies = p.colonies.filter(k => k !== target);
  p.starports.push(target);
  log(`${p.name} raises a starport (+1 VP).`);
  checkWin(); render();
}

function buildUpgrade(p, kind) {
  if (S.phase === 'flight') { toast('No building during the flight phase.'); return; }
  const cur_n = { thruster: p.thrusters, railgun: p.railguns, cargopod: p.cargopods }[kind];
  const lim = { thruster: LIMITS.thrusters, railgun: LIMITS.railguns, cargopod: LIMITS.cargopods }[kind];
  if (cur_n >= lim) { toast('At maximum.'); return; }
  if (!canAfford(p, COSTS[kind])) return;
  playerSpend(p, COSTS[kind]);
  if (kind === 'thruster') p.thrusters++;
  if (kind === 'railgun') p.railguns++;
  if (kind === 'cargopod') p.cargopods++;
  log(`${p.name} installs a ${kind}.`);
  render();
}

function buyFame(p) {
  if (!(hasFavor(p, 'con_star1') || hasFavor(p, 'con_star2'))) return;
  if (p.fame >= 6) { toast('Purchased renown is capped at 6 stars.'); return; }
  if (p.res.goods < 1) { toast('Need 1 Goods.'); return; }
  playerSpend(p, { goods: 1 });
  p.fame++;
  log(`${p.name} buys a renown star.`);
  checkWin(); render();
}

/* ── trading ─────────────────────────────────────────────────── */
function tradeRate(p, give) {
  if (give === 'goods') return 2;
  const charter = { carbon: 'gui_carbon', alloy: 'gui_alloy', fuel: 'gui_fuel', biomass: 'gui_bio' }[give];
  if (charter && hasFavor(p, charter)) return 2;
  return 3;
}
function bankTrade(p, give, get) {
  if (S.phase === 'flight') { toast('No trading during the flight phase.'); return; }
  let rate = tradeRate(p, give);
  if (give === 'goods' && hasFavor(p, 'gui_goods') && !S.goldenUsed) rate = 1;
  if (p.res[give] < rate) { toast(`Need ${rate} ${RES_META[give].label}.`); return; }
  if (S.bank[get] < 1) { toast('The bank is out of that resource.'); return; }
  if (rate === 1) S.goldenUsed = true;
  for (let i = 0; i < rate; i++) { p.res[give]--; S.bank[give]++; }
  bankGive(p, get, 1);
  log(`${p.name} trades ${rate} ${RES_META[give].label} for 1 ${RES_META[get].label}.`);
  render();
}
function playerTrade(p, partner, give, get) {
  if (p.res[give] < 1 || partner.res[get] < 1) return false;
  p.res[give]--; partner.res[give]++;
  partner.res[get]--; p.res[get]++;
  log(`${p.name} trades 1 ${RES_META[give].label} to ${partner.name} for 1 ${RES_META[get].label}.`);
  render();
  return true;
}
function botAccepts(partner, give, get) {
  return partner.res[get] >= 3 && partner.res[give] <= 1;
}

/* ── end / win ───────────────────────────────────────────────── */
function endTurn() {
  if (S.over) return;
  const p = cur();
  closeModal();
  endTurnHazards(p);
  checkWin();
  if (S.over) return;
  S.cur = (S.cur + 1) % S.players.length;
  if (S.cur === 0) S.turn++;
  beginTurn();
}

function checkWin() {
  const p = cur();
  if (!S.over && vp(p) >= WIN_VP) {
    S.over = true;
    banner(`${p.name} WINS with ${vp(p)} victory points!`);
    log(`*** ${p.name} claims leadership of the frontier! ***`);
    showWinModal(p);
  }
}

/* ── bot ─────────────────────────────────────────────────────── */
function botJump(p, ship) {
  const goals = botGoals(p, ship);
  for (const g of goals) {
    if (legalEnd(ship, p, g)) { tryMoveShip(ship, g, true); return; }
  }
}
function botGoals(p, ship) {
  const out = [];
  if (ship.kind === 'settler') {
    for (const sys of systems) {
      for (const k of sys.colonyInts) {
        const n = nodes.get(k);
        if (n.structure) continue;
        const bad = n.planets.some(plid => {
          const pl = planets[plid];
          return pl.chip && pl.chip.hz && chipKnown(pl, p.i) &&
            (pl.chip.hz === 'frozen' || combatStrength(p) < pl.chip.num);
        });
        if (!bad) out.push(k);
      }
    }
  } else {
    for (const base of alienBases) {
      const open = base.slots.filter(s => s.owner === null);
      if (!open.length) continue;
      const lowest = open.reduce((m, s) => s.num < m.num ? s : m, open[0]);
      if (p.cargopods >= lowest.num) out.push(lowest.node);
    }
  }
  return out;
}
function botTurn() {
  const p = cur();
  if (S.over || p.kind !== 'bot') return;
  for (let i = 0; i < 8; i++) {
    const nSettlers = p.ships.filter(s => s.kind === 'settler').length;
    const nEnvoys = p.ships.filter(s => s.kind === 'envoy').length;
    if (p.transporters.length && nSettlers === 0 && canAfford(p, COSTS.settler) && openSpaceportSpot(p) && p.modulesColony > 0) { buildShip(p, 'settler'); continue; }
    if (p.cargopods < 1 && canAfford(p, COSTS.cargopod)) { buildUpgrade(p, 'cargopod'); continue; }
    if (p.transporters.length && nEnvoys === 0 && canAfford(p, COSTS.envoy) && openSpaceportSpot(p) && p.modulesOutpost > 0) { buildShip(p, 'envoy'); continue; }
    if (p.railguns < 3 && canAfford(p, COSTS.railgun)) { buildUpgrade(p, 'railgun'); continue; }
    if (p.colonies.length && p.starports.length < LIMITS.starports && canAfford(p, COSTS.starport)) { buildStarport(p); continue; }
    if (p.thrusters < 3 && canAfford(p, COSTS.thruster)) { buildUpgrade(p, 'thruster'); continue; }
    if (p.cargopods < 3 && canAfford(p, COSTS.cargopod)) { buildUpgrade(p, 'cargopod'); continue; }
    break;
  }
  for (const r of RES) {
    let guard = 0;
    while (p.res[r] > 4 && guard++ < 5) {
      const want = RES.find(x => p.res[x] === 0 && S.bank[x] > 0);
      if (!want) break;
      bankTrade(p, r, want);
    }
  }
  rollFlagship();
  setTimeout(() => {
    for (const ship of p.ships) {
      if (ship.moved || S.over) continue;
      const goals = botGoals(p, ship);
      if (!goals.length) continue;
      const { dist } = bfsPaths(ship.node, 999);
      goals.sort((a, b) => (dist.get(a) || 999) - (dist.get(b) || 999));
      const target = goals[0];
      if (!dist.has(target)) continue;
      const within = bfsPaths(ship.node, S.speed).dist;
      if (within.has(target) && legalEnd(ship, p, target)) { tryMoveShip(ship, target); continue; }
      let best = null, bestD = dist.get(target) ?? 999;
      for (const [k] of within) {
        if (!legalEnd(ship, p, k)) continue;
        const dd = bfsPaths(k, 999).dist.get(target);
        if (dd !== undefined && dd < bestD) { bestD = dd; best = k; }
      }
      if (best) tryMoveShip(ship, best);
      else if (ship.mustVacate) {
        for (const [k] of within) if (legalEnd(ship, p, k)) { tryMoveShip(ship, k); break; }
      }
    }
    render();
    setTimeout(() => { if (!S.over) endTurn(); }, 400);
  }, 400);
}

/* ── rendering ───────────────────────────────────────────────── */
const svg = document.getElementById('board');
const NS = 'http://www.w3.org/2000/svg';
let selectedShip = null;
const PCOLOR = ['#e4593b', '#4f9dde', '#e8c14a', '#69c778'];

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  (parent || svg).appendChild(e);
  return e;
}
function starPts(cx, cy, R, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? R / 2.2 : R;
    const a = Math.PI * i / n - Math.PI / 2;
    pts.push((cx + r * Math.cos(a)) + ',' + (cy + r * Math.sin(a)));
  }
  return pts.join(' ');
}
function triPts(cx, cy, r) {
  return `${cx},${cy - r} ${cx - r * 0.87},${cy + r / 2} ${cx + r * 0.87},${cy + r / 2}`;
}
function diamondPts(cx, cy, r) {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
}

function render() {
  svg.innerHTML = '';
  const defs = el('defs', {});
  defs.innerHTML = `<radialGradient id="space" cx="50%" cy="35%">
    <stop offset="0%" stop-color="#101a33"/><stop offset="100%" stop-color="#05070f"/>
  </radialGradient>`;
  el('rect', { x: 0, y: 0, width: 1120, height: 900, fill: 'url(#space)' });
  let seed = 7;
  for (let i = 0; i < 120; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 1120; seed = (seed * 16807) % 2147483647;
    const y = seed % 900; seed = (seed * 16807) % 2147483647;
    el('circle', { cx: x, cy: y, r: (seed % 10) / 9 + 0.3, fill: '#cdd6e8', opacity: 0.5 });
  }
  for (const { a, b } of edges.values()) {
    if (nodes.get(a).dead || nodes.get(b).dead) continue;
    const A = nodes.get(a), B = nodes.get(b);
    el('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 'lane' });
  }
  const viewer = cur() && cur().kind === 'human' ? cur().i : -1;
  for (const pl of planets) {
    const g = el('g', {});
    el('circle', { cx: pl.cx, cy: pl.cy, r: 26, fill: RES_META[pl.res].color, opacity: 0.92 }, g);
    el('circle', { cx: pl.cx - 7, cy: pl.cy - 8, r: 26, fill: '#fff', opacity: 0.07 }, g);
    const known = pl.faceUp || (viewer >= 0 && S.players[viewer].knowledge.has(pl.id));
    el('circle', { cx: pl.cx, cy: pl.cy, r: 12, fill: '#0d1322', stroke: '#3c4c68' }, g);
    if (known && pl.chip) {
      if (pl.chip.hz) {
        const t = el('text', { x: pl.cx, y: pl.cy + 4, class: 'chip-num hz' }, g);
        t.textContent = (pl.chip.hz === 'raider' ? 'R' : 'I') + pl.chip.num;
      } else {
        const hot = pl.chip.n === 6 || pl.chip.n === 8;
        const t = el('text', { x: pl.cx, y: pl.cy + 4, class: 'chip-num' + (hot ? ' hot' : '') }, g);
        t.textContent = pl.chip.n;
      }
      if (!pl.faceUp)
        el('circle', { cx: pl.cx, cy: pl.cy, r: 12, fill: 'none', stroke: '#c9a227', 'stroke-dasharray': '3 3' }, g);
    } else {
      const t = el('text', { x: pl.cx, y: pl.cy + 4, class: 'chip-num dim' }, g);
      t.textContent = '?';
    }
  }
  for (const base of alienBases) {
    const g = el('g', {});
    el('circle', { cx: base.cx, cy: base.cy, r: 24, fill: 'none', stroke: ALIENS[base.race].color, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, g);
    el('circle', { cx: base.cx, cy: base.cy, r: 10, fill: ALIENS[base.race].color, opacity: 0.85 }, g);
    const t = el('text', { x: base.cx, y: base.cy - 32, class: 'alien-name', fill: ALIENS[base.race].color }, g);
    t.textContent = ALIENS[base.race].name;
    for (const s of base.slots) {
      const n = nodes.get(s.node);
      el('rect', { x: n.x - 8, y: n.y - 8, width: 16, height: 16, rx: 4,
        fill: s.owner === null ? '#131b2e' : PCOLOR[s.owner], stroke: ALIENS[base.race].color }, g);
      const st = el('text', { x: n.x, y: n.y + 4, class: 'stn-num' }, g);
      st.textContent = s.num;
    }
  }
  for (const n of nodes.values()) {
    if (n.dead) continue;
    if (n.colonyInt !== null && !n.structure)
      el('circle', { cx: n.x, cy: n.y, r: 6, class: 'dock' });
    if (n.structure) {
      const c = PCOLOR[n.structure.owner];
      if (n.structure.kind === 'colony')
        el('rect', { x: n.x - 7, y: n.y - 7, width: 14, height: 14, rx: 3, fill: c, stroke: '#05070f', class: 'structure' });
      else if (n.structure.kind === 'starport')
        el('polygon', { points: starPts(n.x, n.y, 12, 6), fill: c, stroke: '#05070f', class: 'structure' });
      else
        el('circle', { cx: n.x, cy: n.y, r: 7, fill: c, stroke: '#05070f', class: 'structure' });
    }
  }
  const p = cur();
  if (p && p.kind === 'human') {
    if (S.placingShip) {
      for (const spKey of p.starports) {
        for (const k of (adj.get(spKey) || [])) {
          const n = nodes.get(k);
          if (n.dead || n.structure) continue;
          if (S.players.some(pl => pl.ships.some(s => s.node === k))) continue;
          const c = el('circle', { cx: n.x, cy: n.y, r: 10, class: 'move-target' });
          c.addEventListener('click', (e) => { e.stopPropagation(); placeShipAt(k); });
        }
      }
    } else if (S.jumpShip) {
      for (const [k, n] of nodes) {
        if (!(adj.get(k) || []).length) continue;
        if (!legalEnd(S.jumpShip, p, k)) continue;
        const c = el('circle', { cx: n.x, cy: n.y, r: 9, class: 'move-target' });
        c.addEventListener('click', (e) => { e.stopPropagation();
          const s = S.jumpShip; S.jumpShip = null; tryMoveShip(s, k, true); });
      }
    } else if (selectedShip && S.rolledFlag && !selectedShip.moved) {
      const { dist } = bfsPaths(selectedShip.node, S.speed);
      for (const [k] of dist) {
        if (!legalEnd(selectedShip, p, k)) continue;
        const n = nodes.get(k);
        const c = el('circle', { cx: n.x, cy: n.y, r: 9, class: 'move-target' });
        c.addEventListener('click', (e) => { e.stopPropagation();
          const s = selectedShip; selectedShip = null; tryMoveShip(s, k); });
      }
    }
  }
  for (const pl of S.players) {
    for (const ship of pl.ships) {
      const n = nodes.get(ship.node);
      if (!n) continue;
      const sel = ship === selectedShip;
      const g = el('g', { class: 'ship' + (ship.moved ? ' done' : '') });
      if (ship.kind === 'settler')
        el('polygon', { points: triPts(n.x, n.y - 13, 10), fill: PCOLOR[pl.i], stroke: '#fff', 'stroke-width': sel ? 2 : 0.8 }, g);
      else
        el('polygon', { points: diamondPts(n.x, n.y - 13, 9), fill: PCOLOR[pl.i], stroke: '#fff', 'stroke-width': sel ? 2 : 0.8 }, g);
      for (let i = 0; i < ship.rings; i++)
        el('circle', { cx: n.x - 8 + i * 8, cy: n.y - 26, r: 2.2, fill: '#fff' }, g);
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (cur().i !== pl.i || cur().kind !== 'human') return;
        selectedShip = (selectedShip === ship) ? null : ship;
        render();
      });
    }
  }
  renderSidebar();
}

function placeShipAt(k) {
  const p = cur();
  const kind = S.placingShip;
  S.placingShip = null;
  if (!canAfford(p, COSTS[kind]) || !p.transporters.length) { render(); return; }
  playerSpend(p, COSTS[kind]);
  p.ships.push({ kind, node: k, rings: p.transporters.shift(), moved: false, mustVacate: null });
  log(`${p.name} launches a${kind === 'envoy' ? 'n envoy' : ' settler'} ship.`);
  render();
}

function renderSidebar() {
  const p = cur();
  if (!p) return;
  const pl = document.getElementById('players');
  pl.innerHTML = S.players.map(x => {
    const chips = S.chips.filter(c => c === x.i).length;
    return `
    <div class="pcard ${x.i === S.cur ? 'active' : ''}">
      <div class="pcard-head">
        <span class="pdot" style="background:${PCOLOR[x.i]}"></span>
        <b>${x.name}</b>${x.kind === 'bot' ? ' <span class="bot-tag">BOT</span>' : ''}
        <span class="vp">${vp(x)} VP</span>
      </div>
      <div class="pcard-stats">
        <span>THR ${x.thrusters}</span><span>GUN ${x.railguns}</span>
        <span>POD ${x.cargopods}</span><span>REN ${x.fame}</span>
        <span>MED ${chips}</span><span>CARDS ${handSize(x)}</span>
      </div>
      ${x.favors.length ? `<div class="pcard-favors">${x.favors.map(f => FAVORS[f].name).join(' | ')}</div>` : ''}
    </div>`; }).join('');

  const hand = document.getElementById('hand');
  if (p.kind === 'human') {
    hand.innerHTML = RES.map(r =>
      `<div class="res-chip" style="border-color:${RES_META[r].color}">
        <span class="res-ico" style="background:${RES_META[r].color}">${RES_META[r].icon}</span>
        ${p.res[r]}
      </div>`).join('');
  } else {
    hand.innerHTML = `<div class="botnote">${p.name} is thinking...</div>`;
  }
  document.getElementById('btn-flagship').disabled = S.rolledFlag || p.kind !== 'human';
  document.getElementById('btn-end').disabled = !S.rolledFlag || p.kind !== 'human';
  document.getElementById('btn-build').disabled = p.kind !== 'human' || S.phase === 'flight';
  document.getElementById('btn-trade').disabled = p.kind !== 'human' || S.phase === 'flight';
  document.getElementById('board-hint').textContent =
    S.placingShip ? 'Choose a launch berth beside one of your starports.' :
    S.jumpShip ? 'Space jump: click any legal waypoint.' :
    !S.rolledFlag ? 'Trade and build, then roll the flagship.' :
    `Speed ${S.speed}: click a ship, then a highlighted waypoint.`;
}

function banner(msg) { document.getElementById('turn-banner').textContent = msg; }
function log(msg) {
  const box = document.getElementById('log');
  const d = document.createElement('div');
  d.textContent = msg;
  box.prepend(d);
  while (box.children.length > 80) box.removeChild(box.lastChild);
}
function toast(msg) {
  const hint = document.getElementById('board-hint');
  hint.textContent = msg;
  hint.classList.add('flash');
  setTimeout(() => hint.classList.remove('flash'), 1400);
}

/* ── modals ──────────────────────────────────────────────────── */
const modalRoot = document.getElementById('modal-root');
function closeModal() { modalRoot.innerHTML = ''; }
function modal(html) {
  modalRoot.innerHTML = `<div class="modal-back"><div class="modal">${html}</div></div>`;
  return modalRoot.querySelector('.modal');
}
function costHtml(cost) {
  return Object.entries(cost).map(([r, n]) =>
    `<span class="mini-chip" style="background:${RES_META[r].color}">${n} ${RES_META[r].label}</span>`).join(' ');
}

function showBuildModal() {
  const p = cur();
  const fameRow = (hasFavor(p, 'con_star1') || hasFavor(p, 'con_star2'))
    ? `<div class="build-row"><div><b>Renown Star</b><div class="build-desc">Star of Renown favor (${p.fame} stars).</div>
       <div>${costHtml({ goods: 1 })}</div></div>
       <button class="btn" data-build="fame" ${p.res.goods >= 1 && p.fame < 6 ? '' : 'disabled'}>Buy</button></div>` : '';
  const rows = [
    ['settler', 'Settler Ship', `Found colonies (${p.transporters.length} transporter(s) free, ${p.modulesColony} modules).`],
    ['envoy', 'Envoy Ship', `Dock at alien stations (${p.modulesOutpost} modules left).`],
    ['starport', 'Starport', `Upgrade a colony, +1 VP (${LIMITS.starports - p.starports.length} ring(s) left).`],
    ['thruster', 'Thruster', `+1 flagship speed (${p.thrusters}/${LIMITS.thrusters}).`],
    ['railgun', 'Railgun', `+1 combat strength (${p.railguns}/${LIMITS.railguns}).`],
    ['cargopod', 'Cargo Pod', `Alien docking + frozen worlds (${p.cargopods}/${LIMITS.cargopods}).`],
  ];
  const m = modal(`
    <h2>Build</h2>
    ${rows.map(([id, name, desc]) => `
      <div class="build-row">
        <div><b>${name}</b><div class="build-desc">${desc}</div><div>${costHtml(COSTS[id])}</div></div>
        <button class="btn" data-build="${id}" ${canAfford(p, COSTS[id]) ? '' : 'disabled'}>Build</button>
      </div>`).join('')}
    ${fameRow}
    <button class="btn btn-accent" data-close>Done</button>`);
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-build]');
    if (b) {
      const id = b.dataset.build;
      closeModal();
      if (id === 'settler' || id === 'envoy') {
        const px = cur();
        if (!px.transporters.length) { toast('All 3 transporters are deployed.'); return; }
        if (id === 'settler' && px.modulesColony <= 0) { toast('No colony modules left.'); return; }
        if (id === 'envoy' && px.modulesOutpost <= 0) { toast('No outpost modules left.'); return; }
        if (!openSpaceportSpot(px)) { toast('No open launch berth.'); return; }
        S.placingShip = id; render(); return;
      }
      if (id === 'starport') buildStarport(cur());
      else if (id === 'fame') buyFame(cur());
      else buildUpgrade(cur(), id);
      showBuildModal();
      return;
    }
    if (e.target.closest('[data-close]')) closeModal();
  });
}

function showTradeModal() {
  const p = cur();
  const others = S.players.filter(x => x !== p);
  const m = modal(`
    <h2>Trade</h2>
    <p class="modal-sub">Bank: 3:1. Goods always 2:1${hasFavor(p, 'gui_goods') && !S.goldenUsed ? ' (Golden Ledger: 1:1 once per turn)' : ''}. Charters trade their resource 2:1.</p>
    <div class="trade-grid">
      <div class="trade-col"><h3>Give the bank</h3>${RES.map(r =>
        `<button class="btn trade-give ${p.res[r] >= tradeRate(p, r) ? '' : 'dim'}" data-give="${r}">
          ${tradeRate(p, r)} ${RES_META[r].label}</button>`).join('')}</div>
      <div class="trade-col"><h3>Receive</h3>${RES.map(r =>
        `<button class="btn trade-get" data-get="${r}">${RES_META[r].label} (${S.bank[r]})</button>`).join('')}</div>
    </div>
    <h3 style="margin-top:1rem">Trade with a captain (1:1, they must agree)</h3>
    <div class="trade-grid">
      <div class="trade-col">${others.map(o =>
        `<button class="btn ptrade-partner" data-partner="${o.i}">${o.name} (${handSize(o)} cards)</button>`).join('')}</div>
      <div class="trade-col">
        <div class="mini-row">Give: ${RES.map(r => `<button class="btn mini ptg" data-pg="${r}">${RES_META[r].icon}</button>`).join('')}</div>
        <div class="mini-row">Get: ${RES.map(r => `<button class="btn mini ptr" data-pr="${r}">${RES_META[r].icon}</button>`).join('')}</div>
        <button class="btn" data-propose>Propose</button>
      </div>
    </div>
    <button class="btn btn-accent" data-close>Done</button>`);
  let give = null, partner = null, pGive = null, pGet = null;
  m.addEventListener('click', (e) => {
    const g = e.target.closest('[data-give]');
    if (g) { give = g.dataset.give; m.querySelectorAll('.trade-give').forEach(x => x.classList.remove('sel')); g.classList.add('sel'); }
    const t = e.target.closest('[data-get]');
    if (t && give) { bankTrade(p, give, t.dataset.get); closeModal(); showTradeModal(); return; }
    const pp = e.target.closest('[data-partner]');
    if (pp) { partner = S.players[+pp.dataset.partner]; m.querySelectorAll('.ptrade-partner').forEach(x => x.classList.remove('sel')); pp.classList.add('sel'); }
    const pg = e.target.closest('[data-pg]');
    if (pg) { pGive = pg.dataset.pg; m.querySelectorAll('.ptg').forEach(x => x.classList.remove('sel')); pg.classList.add('sel'); }
    const pr = e.target.closest('[data-pr]');
    if (pr) { pGet = pr.dataset.pr; m.querySelectorAll('.ptr').forEach(x => x.classList.remove('sel')); pr.classList.add('sel'); }
    if (e.target.closest('[data-propose]') && partner && pGive && pGet) {
      if (p.res[pGive] < 1) { toast('You lack that card.'); return; }
      if (partner.res[pGet] < 1) { toast(`${partner.name} lacks that card.`); return; }
      let ok;
      if (partner.kind === 'bot') {
        ok = botAccepts(partner, pGive, pGet);
        log(ok ? `${partner.name} accepts the trade.` : `${partner.name} declines the trade.`);
      } else {
        ok = confirm(`${partner.name}: accept 1 ${RES_META[pGive].label} in exchange for 1 ${RES_META[pGet].label}?`);
      }
      if (ok) playerTrade(p, partner, pGive, pGet);
      closeModal(); showTradeModal(); return;
    }
    if (e.target.closest('[data-close]')) closeModal();
  });
}

function showEventModal(ev, p) {
  const r = ev.resolve;
  let body = '';
  if (r.kind === 'donate') {
    body = `<p class="modal-sub">They expect a gift of ${r.threshold} resource card(s).</p>
      <button class="btn" data-donate ${handSize(p) >= r.threshold ? '' : 'disabled'}>Donate ${r.threshold}</button>
      <button class="btn" data-refuse>Refuse</button>`;
  } else if (ev.choice) {
    body = `<button class="btn" data-a>${ev.choice.a}</button>
            <button class="btn" data-b>${ev.choice.b}</button>`;
  } else {
    body = `<button class="btn btn-accent" data-ok>Continue</button>`;
  }
  const m = modal(`<h2>Deep-Space Event</h2><h3>${ev.title}</h3><p>${ev.text}</p>${body}`);
  m.addEventListener('click', (e) => {
    if (e.target.closest('[data-ok]')) { closeModal(); resolveEvent(ev, p); }
    if (e.target.closest('[data-a]')) {
      closeModal();
      if (r.kind === 'combat') applyEffect(p, eventCombat(p, r.foe) ? r.win : r.lose);
      else if (r.kind === 'pay') {
        if (RES.every(x => p.res[x] >= (r.cost[x] || 0))) { playerSpend(p, r.cost); applyEffect(p, r.win); }
        else applyEffect(p, r.lose);
      }
    }
    if (e.target.closest('[data-b]')) {
      closeModal();
      if (r.kind === 'pay') applyEffect(p, r.lose);
      else render();
    }
    if (e.target.closest('[data-donate]')) {
      closeModal();
      let n = r.threshold;
      while (n > 0) {
        const have = RES.filter(x => p.res[x] > 0);
        const x = have[0]; p.res[x]--; S.bank[x]++; n--;
      }
      log(`${p.name} donates ${r.threshold} card(s).`);
      applyEffect(p, r.win);
    }
    if (e.target.closest('[data-refuse]')) { closeModal(); applyEffect(p, r.lose); }
  });
}

function showFavorModal(p, race, pool) {
  const uniq = [...new Set(pool)];
  const m = modal(`
    <h2>${ALIENS[race].name}</h2>
    <p class="modal-sub">${ALIENS[race].desc}. Choose a diplomatic favor:</p>
    ${uniq.map(f => `
      <div class="build-row">
        <div><b>${FAVORS[f].name}</b><div class="build-desc">${FAVORS[f].text}</div></div>
        <button class="btn" data-favor="${f}">Choose</button>
      </div>`).join('')}`);
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-favor]');
    if (b) { closeModal(); grantFavor(p, b.dataset.favor); }
  });
}

function showPickModal(p, n) {
  const m = modal(`
    <h2>Choose ${n} resource${n > 1 ? 's' : ''}</h2>
    <div class="trade-col">${RES.map(r =>
      `<button class="btn" data-pick="${r}">${RES_META[r].label} (bank ${S.bank[r]})</button>`).join('')}</div>`);
  let left = n;
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    if (bankGive(p, b.dataset.pick, 1)) left--;
    if (left <= 0) { closeModal(); render(); }
  });
}

function showVictimModal(p, victims) {
  const m = modal(`
    <h2>Collect tribute</h2>
    <p class="modal-sub">Take one random card from a rival:</p>
    ${victims.map(v => `<button class="btn" data-v="${v.i}">${v.name} (${handSize(v)} cards)</button>`).join('')}`);
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (b) { closeModal(); stealFrom(p, S.players[+b.dataset.v]); }
  });
}

function showLoseExpansionModal(p) {
  const opts = [];
  if (p.thrusters) opts.push(['thruster', 'Thruster']);
  if (p.railguns) opts.push(['railgun', 'Railgun']);
  if (p.cargopods) opts.push(['cargopod', 'Cargo Pod']);
  const m = modal(`<h2>Sabotage</h2><p class="modal-sub">Remove one flagship expansion:</p>
    ${opts.map(([id, nm]) => `<button class="btn" data-x="${id}">${nm}</button>`).join('')}`);
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    closeModal();
    if (b.dataset.x === 'thruster') p.thrusters--;
    if (b.dataset.x === 'railgun') p.railguns--;
    if (b.dataset.x === 'cargopod') p.cargopods--;
    log(`${p.name} loses a ${b.dataset.x}.`);
    render();
  });
}

function showFreeExpansionModal(p) {
  const opts = [];
  if (p.thrusters < LIMITS.thrusters) opts.push(['thruster', 'Thruster']);
  if (p.railguns < LIMITS.railguns) opts.push(['railgun', 'Railgun']);
  if (p.cargopods < LIMITS.cargopods) opts.push(['cargopod', 'Cargo Pod']);
  const m = modal(`<h2>Abandoned Shipyard</h2><p class="modal-sub">Fit one free expansion:</p>
    ${opts.map(([id, nm]) => `<button class="btn" data-x="${id}">${nm}</button>`).join('')}`);
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    closeModal();
    if (b.dataset.x === 'thruster') p.thrusters++;
    if (b.dataset.x === 'railgun') p.railguns++;
    if (b.dataset.x === 'cargopod') p.cargopods++;
    log(`${p.name} fits a free ${b.dataset.x}.`);
    render();
  });
}

function showWinModal(p) {
  modal(`<h2>Victory</h2>
    <p><b style="color:${PCOLOR[p.i]}">${p.name}</b> reaches ${vp(p)} victory points and is named head of the Galactic Compact.</p>
    <div class="modal-sub">${S.players.map(x => `${x.name}: ${vp(x)} VP`).join(' &nbsp;|&nbsp; ')}</div>
    <button class="btn btn-accent" onclick="location.reload()">Play Again</button>`);
}

/* ── wire up ─────────────────────────────────────────────────── */
document.getElementById('start-btn').addEventListener('click', () => {
  const cfg = [];
  document.querySelectorAll('.player-slot').forEach((slot) => {
    const kind = slot.querySelector('select').value;
    if (kind === 'off') return;
    cfg.push({ name: slot.querySelector('input').value.trim() || `Player ${cfg.length + 1}`, kind });
  });
  if (cfg.length < 2) { alert('Need at least 2 players.'); return; }
  document.getElementById('setup-screen').hidden = true;
  document.getElementById('game-screen').hidden = false;
  startGame(cfg);
});
document.getElementById('btn-build').addEventListener('click', showBuildModal);
document.getElementById('btn-trade').addEventListener('click', showTradeModal);
document.getElementById('btn-flagship').addEventListener('click', rollFlagship);
document.getElementById('btn-end').addEventListener('click', endTurn);
svg.addEventListener('click', () => {
  if (selectedShip) { selectedShip = null; render(); }
  if (S.placingShip) { S.placingShip = null; render(); }
});

/* autotest: #autotest starts an all-bot game; errors surface in the log */
if (location.hash === '#autotest') {
  window.onerror = (m, src, line) => { log('JSERROR: ' + m + ' @' + line); return false; };
  const stateDiv = document.createElement('div');
  stateDiv.id = 'autotest-state'; stateDiv.style.display = 'none';
  document.body.appendChild(stateDiv);
  window.__state = () => JSON.stringify({ turn: S.turn, over: S.over,
    players: S.players.map(p => ({ name: p.name, vp: vp(p), col: p.colonies.length,
      port: p.starports.length, out: p.outposts.length, fame: p.fame,
      chips: S.chips.filter(c => c === p.i).length, cap: p.capturedChips,
      ships: p.ships.length, cards: handSize(p) })) });
  setInterval(() => { stateDiv.textContent = window.__state(); }, 1500);
  document.getElementById('setup-screen').hidden = true;
  document.getElementById('game-screen').hidden = false;
  startGame([{ name: 'BotA', kind: 'bot' }, { name: 'BotB', kind: 'bot' }, { name: 'BotC', kind: 'bot' }]);
}

})();
