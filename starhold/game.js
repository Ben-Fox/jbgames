/* STARHOLD engine + UI. Hotseat 2-4 players, bots supported. */
(function () {
'use strict';

/* ── hex math (pointy-top axial) ─────────────────────────────── */
const SQ3 = Math.sqrt(3);
function hexCenter(q, r) {
  return { x: HEX_R * SQ3 * (q + r / 2) + 120, y: HEX_R * 1.5 * r + 100 };
}
function corner(c, i) { // i 0..5, pointy-top
  const a = Math.PI / 180 * (60 * i - 90);
  return { x: c.x + HEX_R * Math.cos(a), y: c.y + HEX_R * Math.sin(a) };
}
const nk = (x, y) => Math.round(x) + ',' + Math.round(y);

/* ── build board graph ───────────────────────────────────────── */
const nodes = new Map();   // key -> {x, y, key, hexes:[], structure:null, ship:null}
const edges = new Map();   // "k1|k2" sorted -> {a, b}
const hexes = MAP_HEXES.map((h, i) => ({ ...h, id: i, cleared: false }));

for (const h of hexes) {
  const c = hexCenter(h.q, h.r);
  h.cx = c.x; h.cy = c.y;
  h.corners = [];
  for (let i = 0; i < 6; i++) {
    const p = corner(c, i);
    const key = nk(p.x, p.y);
    if (!nodes.has(key)) nodes.set(key, { x: p.x, y: p.y, key, hexes: [], structure: null, ship: null });
    nodes.get(key).hexes.push(h.id);
    h.corners.push(key);
  }
  for (let i = 0; i < 6; i++) {
    const a = h.corners[i], b = h.corners[(i + 1) % 6];
    const ek = [a, b].sort().join('|');
    if (!edges.has(ek)) edges.set(ek, { a, b });
  }
}
const adj = new Map();
for (const { a, b } of edges.values()) {
  if (!adj.has(a)) adj.set(a, []);
  if (!adj.has(b)) adj.set(b, []);
  adj.get(a).push(b); adj.get(b).push(a);
}
/* planet dock nodes: top and bottom corners (0 is top point, 3 bottom) */
for (const h of hexes) {
  if (h.t === 'planet' || h.t === 'home') h.docks = [h.corners[0], h.corners[3]];
  if (h.t === 'alien') {
    h.stations = [0, 1, 2, 3, 4].map(i => ({ node: h.corners[i], num: i + 1, owner: null }));
  }
}

/* ── game state ──────────────────────────────────────────────── */
const S = {
  players: [], turn: 0, cur: 0, phase: 'setup',
  speedMod: 0, moved: new Set(), rolledFlag: false, over: false,
  eventDeck: [], bank11: false,
};

function newPlayer(i, name, kind) {
  return {
    i, name, kind, res: { fuel: 0, alloy: 0, carbon: 0, biomass: 0, goods: 0 },
    ships: [], thrusters: 0, railguns: 0, cargopods: 0, renown: 0,
    favors: [], medallions: 0, clearedChips: 0,
    colonies: [], starports: [],
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function vp(p) {
  return p.colonies.length + 2 * p.starports.length + 2 * p.medallions +
         p.clearedChips + Math.floor(p.renown / 2);
}

function hasFavor(p, id) { return p.favors.includes(id); }

/* ── setup ───────────────────────────────────────────────────── */
function startGame(cfg) {
  S.players = cfg.map((c, i) => newPlayer(i, c.name, c.kind));
  S.eventDeck = shuffle(EVENTS.slice());
  // home colonies: each player's 2 home hexes -> colony on first dock + starport on second hex's dock
  for (const p of S.players) {
    const mine = hexes.filter(h => h.t === 'home' && h.owner === p.i);
    mine.forEach((h, idx) => {
      const node = nodes.get(h.docks[0]);
      const kind = idx === 0 ? 'starport' : 'colony';
      node.structure = { owner: p.i, kind, hex: h.id };
      (kind === 'starport' ? p.starports : p.colonies).push(node.key);
    });
    // 2 starting transporters parked at home starport
    const port = nodes.get(mine[0].docks[0]);
    p.ships.push({ id: p.i + '-s0', kind: 'settler', node: port.key, done: false });
    p.ships.push({ id: p.i + '-s1', kind: 'envoy',  node: port.key, done: false });
    // starting hand
    p.res.fuel = 1; p.res.carbon = 1; p.res.alloy = 1;
  }
  S.phase = 'produce'; S.cur = 0; S.turn = 1;
  log(`— Game start. ${S.players.map(p => p.name).join(', ')} —`);
  beginTurn();
}

/* ── turn flow ───────────────────────────────────────────────── */
function cur() { return S.players[S.cur]; }

function beginTurn() {
  const p = cur();
  S.speedMod = 0; S.rolledFlag = false; S.moved = new Set(); S.bank11 = false;
  for (const sh of p.ships) sh.done = false;
  banner(`${p.name} — turn ${S.turn}`);
  rollProduction();
  if (vp(p) < RESUPPLY_BELOW) {
    const r = RES[Math.floor(Math.random() * RES.length)];
    p.res[r]++;
    log(`${p.name} receives resupply: 1 ${RES_META[r].label}.`);
  }
  S.phase = 'main';
  render();
  if (p.kind === 'bot') setTimeout(botTurn, 600);
}

function rollProduction() {
  const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
  const roll = d1 + d2;
  log(`Production roll: ${d1}+${d2} = ${roll}`);
  if (roll === 7) { tribute(); return; }
  for (const h of hexes) {
    if ((h.t !== 'planet' && h.t !== 'home') || h.n !== roll) continue;
    if (h.hz && !h.cleared) continue;
    for (const dk of h.docks) {
      const st = nodes.get(dk).structure;
      if (!st) continue;
      const owner = S.players[st.owner];
      const amt = 1; // starports produce like colonies (they're worth VP, not yield)
      owner.res[h.res] += amt;
      log(`${owner.name} +${amt} ${RES_META[h.res].label} (${h.res} world ${h.n})`);
    }
  }
}

function tribute() {
  log('A 7! Pirate tribute demanded.');
  for (const p of S.players) {
    const n = RES.reduce((s, r) => s + p.res[r], 0);
    if (n > HAND_LIMIT) {
      let toDrop = Math.floor(n / 2);
      const dropped = [];
      while (toDrop > 0) {
        const have = RES.filter(r => p.res[r] > 0);
        const r = have[Math.floor(Math.random() * have.length)];
        p.res[r]--; toDrop--; dropped.push(r);
      }
      log(`${p.name} pays tribute: loses ${dropped.length} cards.`);
    }
    if (hasFavor(p, 'oduma3')) { p.res.biomass++; log(`${p.name} gains 1 Biomass (Oduma Communion).`); }
  }
  // current player commandeers 1 random card from richest rival
  const p = cur();
  const rivals = S.players.filter(x => x !== p && RES.reduce((s, r) => s + x.res[r], 0) > 0);
  if (rivals.length) {
    rivals.sort((a, b) => RES.reduce((s, r) => s + b.res[r], 0) - RES.reduce((s, r) => s + a.res[r], 0));
    const v = rivals[0];
    const have = RES.filter(r => v.res[r] > 0);
    const r = have[Math.floor(Math.random() * have.length)];
    v.res[r]--; p.res[r]++;
    log(`${p.name} commandeers a card from ${v.name}.`);
  }
}

function rollFlagship() {
  if (S.rolledFlag) return;
  const p = cur();
  const bag = shuffle(ORB_BAG.slice());
  const draw = [bag[0], bag[1]];
  let speed = BASE_SPEED + p.thrusters +
              (hasFavor(p, 'veyr2') ? 1 : 0) + (hasFavor(p, 'kelth2') ? 1 : 0);
  let flare = false;
  for (const o of draw) { speed += ORB_SPEED[o]; if (o === 'flare') flare = true; }
  S.rolledFlag = true;
  S.speed = speed;
  log(`${p.name} rolls the flagship: ${draw.join(' + ')} -> speed ${speed}${flare ? ' and a FLARE' : ''}`);
  if (flare) {
    if (hasFavor(p, 'kelth3')) {
      const r = RES[Math.floor(Math.random() * RES.length)];
      p.res[r]++; log(`${p.name} draws 1 ${RES_META[r].label} (Kelth Pact).`);
    }
    drawEvent();
  }
  render();
}

function drawEvent() {
  if (!S.eventDeck.length) S.eventDeck = shuffle(EVENTS.slice());
  const ev = S.eventDeck.pop();
  const p = cur();
  if (p.kind === 'bot') { resolveEventAuto(ev, p); return; }
  showEventModal(ev, p);
}

function applyEffect(p, eff) {
  if (!eff) return;
  if (eff.renown) { p.renown = Math.max(0, p.renown + eff.renown);
    log(`${p.name} ${eff.renown > 0 ? 'gains' : 'loses'} ${Math.abs(eff.renown)} renown.`); }
  if (eff.gain) for (const r in eff.gain) { p.res[r] += eff.gain[r]; log(`${p.name} +${eff.gain[r]} ${RES_META[r].label}.`); }
  if (eff.speedThisTurn) { S.speed = Math.max(0, (S.speed || 0) + eff.speedThisTurn);
    log(`Speed this turn ${eff.speedThisTurn > 0 ? '+' : ''}${eff.speedThisTurn} (now ${S.speed}).`); }
  if (eff.trade11) { S.bank11 = true; log('Bank trades are 1:1 for the rest of this turn!'); }
  if (eff.discard) {
    let n = eff.discard;
    while (n > 0) {
      const have = RES.filter(r => p.res[r] > 0);
      if (!have.length) break;
      p.res[have[Math.floor(Math.random() * have.length)]]--; n--;
    }
    log(`${p.name} loses ${eff.discard} cards.`);
  }
  if (eff.pick) {
    if (p.kind === 'bot') {
      for (let i = 0; i < eff.pick; i++) p.res[RES[Math.floor(Math.random() * RES.length)]]++;
      log(`${p.name} gains ${eff.pick} resources.`);
    } else {
      showPickModal(p, eff.pick);
    }
  }
  checkWin(); render();
}

function resolveEventCheck(ev, p) {
  const r = ev.resolve;
  let stat = p[r.stat];
  if (r.stat === 'railguns' && hasFavor(p, 'sarn2')) stat += 0; // sarn2 applies to dens, not events
  const ok = stat >= r.num;
  log(`${ev.title}: ${p.name} ${ok ? 'succeeds' : 'fails'} (${r.stat} ${stat} vs ${r.num}).`);
  applyEffect(p, ok ? r.win : r.lose);
}

function resolveEventAuto(ev, p) {
  const r = ev.resolve;
  log(`Event: ${ev.title} — ${ev.text}`);
  if (r.kind === 'auto') applyEffect(p, r.effect);
  else if (r.kind === 'check') resolveEventCheck(ev, p);
  else if (r.kind === 'pay') {
    const can = Object.entries(r.cost).every(([k, v]) => p.res[k] >= v);
    if (can) { for (const k in r.cost) p.res[k] -= r.cost[k]; applyEffect(p, r.win); }
    else applyEffect(p, r.lose);
  }
}

/* ── building ────────────────────────────────────────────────── */
function canAfford(p, cost) { return Object.entries(cost).every(([k, v]) => p.res[k] >= v); }
function pay(p, cost) { for (const k in cost) p.res[k] -= cost[k]; }

function buildShip(p, kind) {
  if (p.ships.length >= 5) { toast('Fleet limit reached (5 ships).'); return; }
  const cost = COSTS[kind];
  if (!canAfford(p, cost)) return;
  pay(p, cost);
  const home = hexes.find(h => h.t === 'home' && h.owner === p.i);
  p.ships.push({ id: p.i + '-s' + Math.random().toString(36).slice(2, 6),
                 kind, node: home.docks[0], done: false });
  log(`${p.name} launches a ${kind === 'settler' ? 'settler ship' : 'envoy ship'}.`);
  checkWin(); render();
}

function buildUpgrade(p, kind) {
  const lim = { thruster: MAX_THRUSTERS, railgun: MAX_RAILGUNS, cargopod: MAX_CARGOPODS };
  const cur_n = { thruster: p.thrusters, railgun: p.railguns, cargopod: p.cargopods }[kind];
  if (cur_n >= lim[kind]) { toast('At maximum.'); return; }
  if (!canAfford(p, COSTS[kind])) return;
  pay(p, COSTS[kind]);
  if (kind === 'thruster') p.thrusters++;
  if (kind === 'railgun') p.railguns++;
  if (kind === 'cargopod') p.cargopods++;
  log(`${p.name} installs a ${kind}.`);
  render();
}

function buildStarport(p) {
  if (!canAfford(p, COSTS.starport)) return;
  const target = p.colonies.find(k => {
    const st = nodes.get(k).structure;
    return st && st.kind === 'colony';
  });
  if (!target) { toast('No colony to upgrade.'); return; }
  pay(p, COSTS.starport);
  nodes.get(target).structure.kind = 'starport';
  p.colonies = p.colonies.filter(k => k !== target);
  p.starports.push(target);
  log(`${p.name} upgrades a colony to a starport (+1 VP).`);
  checkWin(); render();
}

/* ── movement & settling ─────────────────────────────────────── */
function reachable(fromKey, maxDist) {
  const dist = new Map([[fromKey, 0]]);
  const q = [fromKey];
  while (q.length) {
    const k = q.shift();
    const d = dist.get(k);
    if (d >= maxDist) continue;
    for (const nb of (adj.get(k) || [])) {
      // may pass through anything; may not END on an occupied ship node (checked at move)
      if (!dist.has(nb)) { dist.set(nb, d + 1); q.push(nb); }
    }
  }
  dist.delete(fromKey);
  return dist;
}

function tryMoveShip(ship, destKey) {
  const p = cur();
  if (!S.rolledFlag) { toast('Roll the flagship first.'); return false; }
  if (ship.done) { toast('That ship already moved.'); return false; }
  const r = reachable(ship.node, S.speed);
  if (!r.has(destKey)) return false;
  const destNode = nodes.get(destKey);
  const occupied = S.players.some(pl => pl.ships.some(s2 => s2 !== ship && s2.node === destKey));
  if (occupied || destNode.structure) { toast('That waypoint is occupied.'); return false; }
  ship.node = destKey; ship.done = true;
  trySettle(ship, p);
  render();
  return true;
}

function trySettle(ship, p) {
  const node = nodes.get(ship.node);
  if (ship.kind === 'settler') {
    for (const hid of node.hexes) {
      const h = hexes[hid];
      if (h.t !== 'planet' || !h.docks.includes(node.key)) continue;
      if (h.hz && !h.cleared) { offerHazard(h, ship, p); return; }
      // found colony
      node.structure = { owner: p.i, kind: 'colony', hex: h.id };
      p.colonies.push(node.key);
      p.ships = p.ships.filter(s => s !== ship);
      log(`${p.name} founds a colony on a ${RES_META[h.res].label} world! (+1 VP)`);
      if (hasFavor(p, 'veyr3')) { p.res.goods++; log(`${p.name} +1 Goods (Veyr Envoyship).`); }
      checkWin();
      return;
    }
  }
  if (ship.kind === 'envoy') {
    for (const hid of node.hexes) {
      const h = hexes[hid];
      if (h.t !== 'alien') continue;
      const st = h.stations.find(s => s.node === node.key);
      if (!st || st.owner !== null) continue;
      const lowestOpen = h.stations.filter(s => s.owner === null)
                          .reduce((m, s) => Math.min(m, s.num), 9);
      if (st.num !== lowestOpen) { toast(`Dock ${lowestOpen} must be claimed first.`); return; }
      if (p.cargopods < st.num) { toast(`Need ${st.num} cargo pods to dock here.`); return; }
      st.owner = p.i;
      p.ships = p.ships.filter(s => s !== ship);
      const first = h.stations.every(s2 => s2.owner === null || s2 === st) ||
                    h.stations.filter(s2 => s2.owner !== null).length === 1;
      log(`${p.name} docks an envoy with ${ALIENS[h.race].name}.`);
      if (first) { p.medallions++; log(`First contact! ${p.name} earns a friendship medallion (+2 VP).`); }
      offerFavor(p, h.race);
      checkWin();
      return;
    }
  }
}

function offerHazard(h, ship, p) {
  const need = h.hz.num - ((h.hz.kind === 'raider' && hasFavor(p, 'sarn2')) ? 1 : 0)
                        - ((h.hz.kind === 'frozen' && hasFavor(p, 'oduma2')) ? 1 : 0);
  const stat = h.hz.kind === 'raider' ? p.railguns : p.cargopods;
  const kind = h.hz.kind === 'raider' ? 'raider den' : 'frozen world';
  const statName = h.hz.kind === 'raider' ? 'railguns' : 'cargo pods';
  if (stat >= need) {
    h.cleared = true; p.clearedChips++;
    log(`${p.name} clears the ${kind} (${statName} ${stat} vs ${need}) — +1 VP! The world is open.`);
    trySettle(ship, p); // settle immediately now that it's open
  } else {
    log(`${p.name} cannot clear the ${kind} yet (needs ${statName} ${need}, has ${stat}).`);
  }
  checkWin();
}

function offerFavor(p, race) {
  const pool = ALIENS[race].favors.filter(f =>
    !S.players.some(pl => pl.favors.includes(f)));
  if (!pool.length) return;
  if (p.kind === 'bot') { grantFavor(p, pool[0]); return; }
  showFavorModal(p, race, pool);
}

function grantFavor(p, fid) {
  p.favors.push(fid);
  const f = FAVORS[fid];
  log(`${p.name} receives a favor: ${f.name} — ${f.text}`);
  if (fid === 'veyr3' || fid === 'kelth3' || fid === 'oduma3') p.renown += 1;
  if (fid === 'sarn3') p.renown += 2;
  checkWin(); render();
}

/* ── trading ─────────────────────────────────────────────────── */
function tradeRate(p, give) {
  if (S.bank11) return 1;
  if (give === 'alloy' && hasFavor(p, 'veyr1')) return 2;
  if (give === 'fuel' && hasFavor(p, 'kelth1')) return 2;
  if (give === 'biomass' && hasFavor(p, 'oduma1')) return 2;
  if (give === 'carbon' && hasFavor(p, 'sarn1')) return 2;
  return 3;
}
function bankTrade(p, give, get) {
  const rate = tradeRate(p, give);
  if (p.res[give] < rate) { toast(`Need ${rate} ${RES_META[give].label}.`); return; }
  p.res[give] -= rate; p.res[get]++;
  log(`${p.name} trades ${rate} ${RES_META[give].label} for 1 ${RES_META[get].label}.`);
  render();
}

/* ── end / win ───────────────────────────────────────────────── */
function endTurn() {
  if (S.over) return;
  closeModal();
  S.cur = (S.cur + 1) % S.players.length;
  if (S.cur === 0) S.turn++;
  beginTurn();
}

function checkWin() {
  for (const p of S.players) {
    if (vp(p) >= WIN_VP && !S.over) {
      S.over = true;
      banner(`${p.name} WINS with ${vp(p)} victory points!`);
      log(`*** ${p.name} wins the game! ***`);
      showWinModal(p);
    }
  }
}

/* ── bot ─────────────────────────────────────────────────────── */
function botTurn() {
  const p = cur();
  if (S.over || p.kind !== 'bot') return;
  // build priorities
  const tryAll = () => {
    if (p.cargopods < 2 && canAfford(p, COSTS.cargopod)) return buildUpgrade(p, 'cargopod');
    if (p.railguns < 2 && canAfford(p, COSTS.railgun)) return buildUpgrade(p, 'railgun');
    if (!p.ships.some(s => s.kind === 'settler') && canAfford(p, COSTS.settler)) return buildShip(p, 'settler');
    if (canAfford(p, COSTS.starport) && p.colonies.length) return buildStarport(p);
    if (p.thrusters < 3 && canAfford(p, COSTS.thruster)) return buildUpgrade(p, 'thruster');
    if (!p.ships.some(s => s.kind === 'envoy') && canAfford(p, COSTS.envoy)) return buildShip(p, 'envoy');
    return null;
  };
  for (let i = 0; i < 6; i++) if (tryAll() === null) break;
  // 3:1 dump excess
  for (const r of RES) {
    while (p.res[r] > 4) {
      const want = RES.find(x => p.res[x] === 0) || 'carbon';
      bankTrade(p, r, want);
      if (S.bank11) break;
    }
  }
  rollFlagship();
  setTimeout(() => {
    // move each ship toward nearest goal
    for (const ship of p.ships) {
      if (ship.done || S.over) continue;
      const goals = [];
      for (const h of hexes) {
        if (ship.kind === 'settler' && h.t === 'planet') {
          for (const dk of h.docks) {
            if (!nodes.get(dk).structure &&
                (!h.hz || h.cleared ||
                 (h.hz.kind === 'raider' ? p.railguns : p.cargopods) >= h.hz.num))
              goals.push(dk);
          }
        }
        if (ship.kind === 'envoy' && h.t === 'alien') {
          const open = h.stations.filter(s => s.owner === null);
          if (open.length) {
            const lowest = open.reduce((m, s) => s.num < m.num ? s : m, open[0]);
            if (p.cargopods >= lowest.num) goals.push(lowest.node);
          }
        }
      }
      if (!goals.length) continue;
      // BFS full distances from ship
      const dist = reachable(ship.node, 99);
      goals.sort((a, b) => (dist.get(a) || 999) - (dist.get(b) || 999));
      const target = goals[0];
      if (!dist.has(target)) continue;
      // walk backwards to find the furthest reachable step toward target
      const within = reachable(ship.node, S.speed);
      let best = null, bestD = dist.get(target);
      for (const [k, d] of within) {
        const occupied = S.players.some(pl => pl.ships.some(s2 => s2 !== ship && s2.node === k));
        if (occupied || nodes.get(k).structure) continue;
        const dt = reachable(k, 99).get(target);
        const rem = dt === undefined ? 999 : dt;
        if (rem < bestD) { bestD = rem; best = k; }
      }
      if (target && within.has(target)) best = target;
      if (best) { ship.node = best; ship.done = true; trySettle(ship, p); }
    }
    render();
    setTimeout(() => { if (!S.over) endTurn(); }, 700);
  }, 700);
}

/* ── rendering ───────────────────────────────────────────────── */
const svg = document.getElementById('board');
const NS = 'http://www.w3.org/2000/svg';
let selectedShip = null;

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  (parent || svg).appendChild(e);
  return e;
}

function render() {
  svg.innerHTML = '';
  // starfield
  const defs = el('defs', {});
  defs.innerHTML = `
    <radialGradient id="space" cx="50%" cy="35%">
      <stop offset="0%" stop-color="#101a33"/><stop offset="100%" stop-color="#05070f"/>
    </radialGradient>`;
  el('rect', { x: 0, y: 0, width: 1060, height: 950, fill: 'url(#space)' });
  let seed = 7;
  for (let i = 0; i < 130; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 1000; seed = (seed * 16807) % 2147483647;
    const y = seed % 950; seed = (seed * 16807) % 2147483647;
    el('circle', { cx: x, cy: y, r: (seed % 10) / 9 + 0.3, fill: '#cdd6e8', opacity: 0.5 });
  }
  // lanes
  for (const { a, b } of edges.values()) {
    const A = nodes.get(a), B = nodes.get(b);
    el('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 'lane' });
  }
  // hexes content
  for (const h of hexes) {
    if (h.t === 'planet' || h.t === 'home') {
      const g = el('g', { class: 'planet' });
      el('circle', { cx: h.cx, cy: h.cy, r: 34, fill: RES_META[h.res].color, opacity: 0.92 }, g);
      el('circle', { cx: h.cx - 9, cy: h.cy - 10, r: 34, fill: '#fff', opacity: 0.07 }, g);
      const chip = el('g', {}, g);
      el('circle', { cx: h.cx, cy: h.cy, r: 15, fill: '#0d1322', stroke: '#3c4c68' }, chip);
      const hot = h.n === 6 || h.n === 8;
      const t = el('text', { x: h.cx, y: h.cy + 5, class: 'chip-num' + (hot ? ' hot' : '') }, chip);
      t.textContent = h.n;
      if (h.hz && !h.cleared) {
        const hz = el('g', { class: 'hazard' }, g);
        el('circle', { cx: h.cx + 26, cy: h.cy - 26, r: 14,
                       fill: h.hz.kind === 'raider' ? '#8c2f2f' : '#2f6d8c', stroke: '#0d1322' }, hz);
        const ht = el('text', { x: h.cx + 26, y: h.cy - 21, class: 'hz-num' }, hz);
        ht.textContent = (h.hz.kind === 'raider' ? 'R' : 'I') + h.hz.num;
      }
      // dock markers
      for (const dk of h.docks) {
        const n = nodes.get(dk);
        if (!n.structure) el('circle', { cx: n.x, cy: n.y, r: 5, class: 'dock' });
      }
    }
    if (h.t === 'alien') {
      const g = el('g', { class: 'alien' });
      el('circle', { cx: h.cx, cy: h.cy, r: 30, fill: 'none', stroke: ALIENS[h.race].color, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, g);
      el('circle', { cx: h.cx, cy: h.cy, r: 12, fill: ALIENS[h.race].color, opacity: 0.85 }, g);
      const t = el('text', { x: h.cx, y: h.cy - 40, class: 'alien-name', fill: ALIENS[h.race].color }, g);
      t.textContent = ALIENS[h.race].name;
      for (const stn of h.stations) {
        const n = nodes.get(stn.node);
        const sg = el('g', {}, g);
        el('rect', { x: n.x - 9, y: n.y - 9, width: 18, height: 18, rx: 4,
                     fill: stn.owner === null ? '#131b2e' : PCOLOR[stn.owner],
                     stroke: ALIENS[h.race].color }, sg);
        const st = el('text', { x: n.x, y: n.y + 4, class: 'stn-num' }, sg);
        st.textContent = stn.num;
      }
    }
  }
  // structures
  for (const n of nodes.values()) {
    if (!n.structure) continue;
    const c = PCOLOR[n.structure.owner];
    if (n.structure.kind === 'colony')
      el('rect', { x: n.x - 8, y: n.y - 8, width: 16, height: 16, rx: 3, fill: c, stroke: '#05070f', class: 'structure' });
    else {
      el('polygon', { points: starPts(n.x, n.y, 13, 6), fill: c, stroke: '#05070f', class: 'structure' });
    }
  }
  // movement highlights
  if (selectedShip && S.rolledFlag && !selectedShip.done && cur().kind === 'human') {
    const r = reachable(selectedShip.node, S.speed);
    for (const [k] of r) {
      const n = nodes.get(k);
      const occupied = S.players.some(pl => pl.ships.some(s2 => s2 !== selectedShip && s2.node === k));
      if (occupied || n.structure) continue;
      const c = el('circle', { cx: n.x, cy: n.y, r: 10, class: 'move-target' });
      c.addEventListener('click', () => { tryMoveShip(selectedShip, k); selectedShip = null; });
    }
  }
  // ships
  for (const p of S.players) {
    for (const ship of p.ships) {
      const n = nodes.get(ship.node);
      const sel = ship === selectedShip;
      const g = el('g', { class: 'ship' + (sel ? ' sel' : '') + (ship.done ? ' done' : '') });
      const shape = ship.kind === 'settler'
        ? el('polygon', { points: triPts(n.x, n.y - 14, 11), fill: PCOLOR[p.i], stroke: '#fff', 'stroke-width': sel ? 2 : 0.8 }, g)
        : el('polygon', { points: diamondPts(n.x, n.y - 14, 10), fill: PCOLOR[p.i], stroke: '#fff', 'stroke-width': sel ? 2 : 0.8 }, g);
      shape.addEventListener('click', (e) => {
        e.stopPropagation();
        if (cur().i !== p.i || cur().kind !== 'human') return;
        selectedShip = (selectedShip === ship) ? null : ship;
        render();
      });
    }
  }
  renderSidebar();
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

const PCOLOR = ['#e4593b', '#4f9dde', '#e8c14a', '#69c778'];

function renderSidebar() {
  const p = cur();
  const pl = document.getElementById('players');
  pl.innerHTML = S.players.map(x => `
    <div class="pcard ${x.i === S.cur ? 'active' : ''}">
      <div class="pcard-head">
        <span class="pdot" style="background:${PCOLOR[x.i]}"></span>
        <b>${x.name}</b>${x.kind === 'bot' ? ' <span class="bot-tag">BOT</span>' : ''}
        <span class="vp">${vp(x)} VP</span>
      </div>
      <div class="pcard-stats">
        <span title="thrusters">THR ${x.thrusters}</span>
        <span title="railguns">GUN ${x.railguns}</span>
        <span title="cargo pods">POD ${x.cargopods}</span>
        <span title="renown stars">REN ${x.renown}</span>
        <span title="cards">CARDS ${RES.reduce((s, r) => s + x.res[r], 0)}</span>
      </div>
      ${x.favors.length ? `<div class="pcard-favors">${x.favors.map(f => FAVORS[f].name).join(' | ')}</div>` : ''}
    </div>`).join('');

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
  document.getElementById('btn-build').disabled = p.kind !== 'human';
  document.getElementById('btn-trade').disabled = p.kind !== 'human';
  document.getElementById('board-hint').textContent =
    !S.rolledFlag ? 'Trade and build, then roll the flagship.'
    : (S.speed > 0 ? `Speed ${S.speed}: click a ship, then a highlighted waypoint.` : 'No movement this turn.');
}

function banner(msg) { document.getElementById('turn-banner').textContent = msg; }
function log(msg) {
  const box = document.getElementById('log');
  const d = document.createElement('div');
  d.textContent = msg;
  box.prepend(d);
  while (box.children.length > 60) box.removeChild(box.lastChild);
}
function toast(msg) {
  const hint = document.getElementById('board-hint');
  hint.textContent = msg;
  hint.classList.add('flash');
  setTimeout(() => hint.classList.remove('flash'), 1200);
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
  const rows = [
    ['settler', 'Settler Ship', 'Found colonies on open planet docks.'],
    ['envoy', 'Envoy Ship', 'Dock at alien stations for medallions and favors.'],
    ['starport', 'Starport', 'Upgrade a colony. +1 VP.'],
    ['thruster', 'Thruster', `+1 flagship speed (${p.thrusters}/${MAX_THRUSTERS}).`],
    ['railgun', 'Railgun', `Fight raiders and events (${p.railguns}/${MAX_RAILGUNS}).`],
    ['cargopod', 'Cargo Pod', `Needed for alien docking and frozen worlds (${p.cargopods}/${MAX_CARGOPODS}).`],
  ];
  const m = modal(`
    <h2>Build</h2>
    ${rows.map(([id, name, desc]) => `
      <div class="build-row">
        <div><b>${name}</b><div class="build-desc">${desc}</div><div>${costHtml(COSTS[id])}</div></div>
        <button class="btn" data-build="${id}" ${canAfford(p, COSTS[id]) ? '' : 'disabled'}>Build</button>
      </div>`).join('')}
    <button class="btn btn-accent" data-close>Done</button>`);
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-build]');
    if (b) {
      const id = b.dataset.build;
      if (id === 'settler' || id === 'envoy') buildShip(p, id);
      else if (id === 'starport') buildStarport(p);
      else buildUpgrade(p, id);
      closeModal(); showBuildModal();
    }
    if (e.target.closest('[data-close]')) closeModal();
  });
}

function showTradeModal() {
  const p = cur();
  const m = modal(`
    <h2>Bank Trade</h2>
    <p class="modal-sub">Give ${S.bank11 ? '1 (wandering traders!)' : 'rate shown'} : receive 1.</p>
    <div class="trade-grid">
      <div class="trade-col"><h3>Give</h3>${RES.map(r =>
        `<button class="btn trade-give ${p.res[r] >= tradeRate(p, r) ? '' : 'dim'}" data-give="${r}">
          ${tradeRate(p, r)} ${RES_META[r].label}</button>`).join('')}</div>
      <div class="trade-col"><h3>Receive</h3>${RES.map(r =>
        `<button class="btn trade-get" data-get="${r}">${RES_META[r].label}</button>`).join('')}</div>
    </div>
    <button class="btn btn-accent" data-close>Done</button>`);
  let give = null;
  m.addEventListener('click', (e) => {
    const g = e.target.closest('[data-give]');
    if (g) { give = g.dataset.give; m.querySelectorAll('.trade-give').forEach(x => x.classList.remove('sel'));
             g.classList.add('sel'); }
    const t = e.target.closest('[data-get]');
    if (t && give) { bankTrade(p, give, t.dataset.get); closeModal(); showTradeModal(); }
    if (e.target.closest('[data-close]')) closeModal();
  });
}

function showEventModal(ev, p) {
  const r = ev.resolve;
  let body = '';
  if (ev.choice) {
    body = `<button class="btn" data-a>${ev.choice.a}</button>
            <button class="btn" data-b>${ev.choice.b}</button>`;
  } else {
    body = `<button class="btn btn-accent" data-ok>Continue</button>`;
  }
  const m = modal(`<h2>Deep-Space Event</h2><h3>${ev.title}</h3><p>${ev.text}</p>${body}`);
  m.addEventListener('click', (e) => {
    if (e.target.closest('[data-ok]')) { closeModal(); resolveEventAuto(ev, p); }
    if (e.target.closest('[data-a]')) {
      closeModal();
      if (r.kind === 'check') resolveEventCheck(ev, p);
      else if (r.kind === 'pay') {
        if (canAfford(p, r.cost)) { pay(p, r.cost); applyEffect(p, r.win); }
        else applyEffect(p, r.lose);
      }
    }
    if (e.target.closest('[data-b]')) {
      closeModal();
      if (r.kind === 'pay') applyEffect(p, r.lose);
      // choice b on checks = walk away, nothing happens
      render();
    }
  });
}

function showFavorModal(p, race, pool) {
  const m = modal(`
    <h2>${ALIENS[race].name}</h2>
    <p class="modal-sub">${ALIENS[race].desc}. Choose a diplomatic favor:</p>
    ${pool.map(f => `
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
      `<button class="btn" data-pick="${r}">${RES_META[r].label}</button>`).join('')}</div>`);
  let left = n;
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    p.res[b.dataset.pick]++; left--;
    log(`${p.name} takes 1 ${RES_META[b.dataset.pick].label}.`);
    if (left <= 0) { closeModal(); render(); }
  });
}

function showWinModal(p) {
  modal(`<h2>Victory</h2>
    <p><b style="color:${PCOLOR[p.i]}">${p.name}</b> reaches ${vp(p)} victory points and claims the frontier.</p>
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
svg.addEventListener('click', () => { if (selectedShip) { selectedShip = null; render(); } });


/* autotest: #autotest starts an all-bot game; errors surface in the log */
if (location.hash === '#autotest') {
  const stateDiv = document.createElement('div'); stateDiv.id = 'autotest-state'; stateDiv.style.display = 'none'; document.body.appendChild(stateDiv);
  setInterval(() => { stateDiv.textContent = window.__state(); }, 1500);
  window.__state = () => JSON.stringify({turn: S.turn, players: S.players.map(p => ({name: p.name, vp: vp(p), colonies: p.colonies.length, starports: p.starports.length, medallions: p.medallions, pods: p.cargopods, guns: p.railguns, thr: p.thrusters, ships: p.ships.length, cards: RES.reduce((a,r)=>a+p.res[r],0)})), over: S.over});
  window.onerror = (m, src, line) => { log('JSERROR: ' + m + ' @' + line); return false; };
  document.getElementById('setup-screen').hidden = true;
  document.getElementById('game-screen').hidden = false;
  startGame([{ name: 'BotA', kind: 'bot' }, { name: 'BotB', kind: 'bot' }, { name: 'BotC', kind: 'bot' }]);
}

})();
