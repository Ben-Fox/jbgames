// BreakPoint - Tactical Card Duel
(function() {
'use strict';

const SUITS = ['♠','♥','♦','♣'];
const SUIT_NAMES = {'♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs'};
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const VAL_NUM = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10,'A':11};
const VAL_SEQ = {'A':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13};
const MAX_CHARGE_ATTACK = 25;
const BREAKPOINT_THRESHOLD = 2; // consecutive cards needed
const BREAKPOINT_BONUS_DMG = 3;

let difficulty = 'medium';
let deck = [];
let playerHand = [], oppHand = [];
let playerHP = 30, oppHP = 30;
let playerCharge = [], oppCharge = [];
let playerPressure = 0, oppPressure = 0;
let playerMomentum = false, oppMomentum = false;
let playerCombo = [], oppCombo = [];
let playerBonusDmg = 0, oppBonusDmg = 0;
let playerCardsPlayed = 0;
let turnOwner = 'player';
let gameOver = false;
let selectedCard = null;
let waitingForResponse = false;
let stats = { playerDmg: 0, oppDmg: 0, playerCombos: 0, oppCombos: 0, turns: 0 };
let allPlayed = [];
// Pressure: track per-TURN, not per-card. These flags track if a spade was played THIS turn.
let playerPlayedSpadeThisTurn = false;
let oppPlayedSpadeThisTurn = false;
let playerNoAttackTurns = 0, oppNoAttackTurns = 0;
// Prepared guard
let playerPreparedGuard = null; // card object or null
let oppPreparedGuard = null;

const $ = id => document.getElementById(id);
const startScreen = $('start-screen');
const gameScreen = $('game-screen');

// ---- START SCREEN ----
document.querySelectorAll('.diff-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    difficulty = b.dataset.diff;
  });
});
$('deal-btn').addEventListener('click', startGame);
$('play-again-btn').addEventListener('click', () => { $('gameover-modal').classList.add('hidden'); startGame(); });
$('rules-toggle').addEventListener('click', () => $('rules-modal').classList.remove('hidden'));
$('close-rules').addEventListener('click', () => $('rules-modal').classList.add('hidden'));

function makeDeck() {
  let d = [];
  for (let s of SUITS) for (let v of VALUES) d.push({ suit: s, value: v });
  return shuffle(d);
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { let j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function cardNum(c) { return VAL_NUM[c.value]; }
function cardSeq(c) { return VAL_SEQ[c.value]; }
function isRed(c) { return c.suit === '♥' || c.suit === '♦'; }
function totalCharge(pile) { return pile.reduce((s,c) => s + cardNum(c), 0); }
function cardId(c) { return c.suit + c.value; }

function startGame() {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  deck = makeDeck();
  playerHand = []; oppHand = [];
  playerHP = 30; oppHP = 30;
  playerCharge = []; oppCharge = [];
  playerPressure = 0; oppPressure = 0;
  playerMomentum = false; oppMomentum = false;
  playerCombo = []; oppCombo = [];
  playerBonusDmg = 0; oppBonusDmg = 0;
  playerPlayedSpadeThisTurn = false; oppPlayedSpadeThisTurn = false;
  playerNoAttackTurns = 0; oppNoAttackTurns = 0;
  playerPreparedGuard = null; oppPreparedGuard = null;
  gameOver = false; selectedCard = null; waitingForResponse = false;
  playerCardsPlayed = 0;
  stats = { playerDmg: 0, oppDmg: 0, playerCombos: 0, oppCombos: 0, turns: 0 };
  allPlayed = [];
  $('action-log').innerHTML = '';
  $('opp-played').innerHTML = '';
  $('player-played').innerHTML = '';
  for (let i = 0; i < 5; i++) { playerHand.push(deck.pop()); oppHand.push(deck.pop()); }
  turnOwner = 'player';
  render();
  log('Game started! Difficulty: ' + difficulty.toUpperCase());
  startPlayerTurn();
}

// ---- RENDERING ----
function render() {
  renderHand('opponent-hand', oppHand, false);
  renderHand('player-hand', playerHand, true);
  renderCharge('opp-charge-pile', oppCharge, 'opp-charge-value');
  renderCharge('player-charge-pile', playerCharge, 'player-charge-value');
  updateHP();
  updateStatus();
  updateDeck();
  renderCombo();
  renderPreparedGuard();
  updateTurnIndicator();
}

function renderHand(containerId, hand, faceUp) {
  const el = $(containerId);
  el.innerHTML = '';
  const count = hand.length;
  const isPlayer = containerId === 'player-hand';
  hand.forEach((c, i) => {
    const card = faceUp ? makeCardEl(c) : makeCardBack();
    // Fan rotation
    if (count > 1) {
      const mid = (count - 1) / 2;
      const angle = (i - mid) * (count > 7 ? 2 : 3);
      const yOff = Math.abs(i - mid) * 3;
      card.classList.add('fan');
      if (!faceUp) {
        card.style.transform = `rotate(${angle}deg) translateY(${yOff}px)`;
      } else {
        card.style.setProperty('--fan-rotate', angle + 'deg');
        card.style.setProperty('--fan-y', yOff + 'px');
      }
      card.style.marginLeft = i === 0 ? '0' : '-8px';
    }
    if (faceUp && turnOwner === 'player' && !waitingForResponse && !gameOver) {
      if (c.suit === '♣') {
        // Clubs disabled on own turn
        card.classList.add('disabled-club');
        card.title = 'Counters can only be played when attacked';
      } else {
        card.classList.add('playable');
        card.addEventListener('click', () => selectCard(i));
        card.addEventListener('dblclick', () => { selectCard(i); playSelected(); });
      }
    }
    if (faceUp && selectedCard === i) card.classList.add('selected');
    if (faceUp && !card.classList.contains('selected') && !card.classList.contains('disabled-club')) {
      // Restore fan transform on non-hovered state
    }
    card.classList.add('card-enter');
    // Tooltip on hover
    if (faceUp) {
      card.addEventListener('mouseenter', (e) => showTooltip(c, e));
      card.addEventListener('mousemove', (e) => moveTooltip(e));
      card.addEventListener('mouseleave', hideTooltip);
    }
    el.appendChild(card);
  });
}

function makeCardEl(c) {
  const el = document.createElement('div');
  el.className = 'card card-front ' + (isRed(c) ? 'red' : 'black');
  el.innerHTML = `<span class="card-corner tl">${c.value}<br>${c.suit}</span>
    <span class="card-value">${c.value}</span><span class="card-suit">${c.suit}</span>
    <span class="card-corner br">${c.value}<br>${c.suit}</span>`;
  return el;
}

function makeCardBack() {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.textContent = '🂠';
  return el;
}

function renderCharge(containerId, pile, totalId) {
  const el = $(containerId);
  // Keep label and total, clear cards
  const cards = el.querySelectorAll('.card');
  cards.forEach(c => c.remove());
  pile.forEach(c => {
    const card = makeCardEl(c);
    card.style.width = '50px'; card.style.height = '70px';
    el.appendChild(card);
  });
  $(totalId).textContent = totalCharge(pile);
}

function updateHP() {
  const pH = Math.max(0, playerHP), oH = Math.max(0, oppHP);
  $('player-hp-bar').style.width = (pH / 30 * 100) + '%';
  $('player-hp-text').textContent = pH;
  $('opp-hp-bar').style.width = (oH / 30 * 100) + '%';
  $('opp-hp-text').textContent = oH;
}

function updateStatus() {
  setStatus('player-pressure', playerPressure, playerPressure > 0);
  setStatus('opp-pressure', oppPressure, oppPressure > 0);
  const pm = $('player-momentum'); pm.querySelector('span').textContent = playerMomentum ? 'ON' : 'off';
  if (playerMomentum) { pm.classList.add('active'); pm.classList.add('momentum-active'); }
  else { pm.classList.remove('active'); pm.classList.remove('momentum-active'); }
  const om = $('opp-momentum'); om.querySelector('span').textContent = oppMomentum ? 'ON' : 'off';
  if (oppMomentum) { om.classList.add('active'); om.classList.add('momentum-active'); }
  else { om.classList.remove('active'); om.classList.remove('momentum-active'); }
  $('player-charge-total').querySelector('span').textContent = totalCharge(playerCharge);
  $('opp-charge-total').querySelector('span').textContent = totalCharge(oppCharge);
}

function setStatus(id, val, active) {
  const el = $(id); el.querySelector('span').textContent = val;
  el.classList.toggle('active', active);
}

function updateDeck() { $('deck-count').querySelector('span').textContent = deck.length; }

function renderCombo() {
  $('combo-values').textContent = playerCombo.length ? playerCombo.join(' → ') : 'none';
}

function renderPreparedGuard() {
  const el = $('prepared-guard');
  if (playerPreparedGuard) {
    el.classList.remove('hidden');
    $('prepared-guard-text').textContent = `Prepared Guard: ${playerPreparedGuard.value}♥ (blocks ${cardNum(playerPreparedGuard)})`;
  } else {
    el.classList.add('hidden');
  }
}

function updateTurnIndicator() {
  const el = $('turn-indicator');
  el.classList.remove('hidden', 'player-turn', 'opponent-turn');
  if (gameOver) { el.classList.add('hidden'); return; }
  if (turnOwner === 'player') {
    el.classList.add('player-turn');
    el.textContent = 'YOUR TURN';
  } else {
    el.classList.add('opponent-turn');
    el.textContent = "OPPONENT'S TURN";
  }
}

// ---- TOOLTIP ----
function showTooltip(c, e) {
  const tip = $('card-tooltip');
  tip.classList.remove('hidden');
  tip.innerHTML = tooltipFor(c);
  moveTooltip(e);
}
function moveTooltip(e) {
  const tip = $('card-tooltip');
  tip.style.left = (e.clientX + 12) + 'px';
  tip.style.top = (e.clientY - 40) + 'px';
}
function hideTooltip() {
  $('card-tooltip').classList.add('hidden');
}

function tooltipFor(c) {
  const v = cardNum(c);
  if (c.suit === '♠') {
    const charge = totalCharge(playerCharge);
    let total = v + playerBonusDmg;
    let parts = `<b>♠ Attack: ${v}</b>`;
    if (playerBonusDmg > 0) parts += ` + ${playerBonusDmg} bonus`;
    if (charge > 0) parts += `<br>With charge: ${Math.min(MAX_CHARGE_ATTACK, total + charge)} damage`;
    else parts += `<br>Total: ${total} damage`;
    return parts;
  }
  if (c.suit === '♥') return `<b>♥ Guard: blocks ${v}</b><br>Play now to prepare a guard for the next attack. Excess blocks heal (max 5).`;
  if (c.suit === '♦') return `<b>♦ Charge: +${v}</b><br>Current charge: ${totalCharge(playerCharge)}<br>After: ${totalCharge(playerCharge) + v}${totalCharge(playerCharge) + v > 12 ? ' ⚠ OVERCHARGE' : ''}`;
  if (c.suit === '♣') return `<b>♣ Counter</b><br>Can only play when attacked.<br>If value (${v}) > attack damage → negate & reflect.`;
  return '';
}

// ---- LOGGING ----
function log(msg, cls) {
  const el = $('action-log');
  const div = document.createElement('div');
  div.className = 'log-entry' + (cls ? ' ' + cls : '');
  div.textContent = msg;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function logTurnSeparator(label) {
  const el = $('action-log');
  const div = document.createElement('div');
  div.className = 'log-entry log-separator';
  div.textContent = `── ${label} ──`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

// ---- VFX ----
function floatText(text, x, y, color) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.color = color || '#fff';
  $('floating-texts').appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function screenFlash() {
  $('screen-flash').classList.add('active');
  setTimeout(() => $('screen-flash').classList.remove('active'), 150);
}

function showBreakpointAnim() {
  const flash = document.createElement('div');
  flash.className = 'breakpoint-flash';
  document.body.appendChild(flash);
  const txt = document.createElement('div');
  txt.className = 'breakpoint-text';
  txt.textContent = '⚡ BREAKPOINT ⚡';
  document.body.appendChild(txt);
  setTimeout(() => { flash.remove(); txt.remove(); }, 1200);
}

function showOverchargeExplosion() {
  const el = document.createElement('div');
  el.className = 'overcharge-boom';
  document.body.appendChild(el);
  screenFlash();
  setTimeout(() => el.remove(), 800);
}

function showCardPlayed(card, who) {
  const slot = $(who === 'player' ? 'player-played' : 'opp-played');
  slot.innerHTML = '';
  const cardEl = makeCardEl(card);
  slot.appendChild(cardEl);
}

// ---- OVERCHARGE with deck composition ----
function getOverchargeOdds() {
  if (deck.length === 0) return { safe: 50, boom: 50 };
  let red = 0, black = 0;
  for (const c of deck) {
    if (isRed(c)) red++; else black++;
  }
  const safePercent = Math.round((red / deck.length) * 100);
  return { safe: safePercent, boom: 100 - safePercent };
}

function doOverchargeCheck(who, callback) {
  const odds = getOverchargeOdds();
  if (who === 'player') {
    log(`⚠ Overcharge check! Charge > 12... (${odds.safe}% safe / ${odds.boom}% boom)`, 'log-important');
  } else {
    log(`⚠ Opponent overcharge check! (${odds.safe}% safe / ${odds.boom}% boom)`, 'log-important');
  }
  
  if (deck.length === 0) { callback(); return; }
  const flipped = deck.pop();
  allPlayed.push(flipped);
  
  const isPlayerTarget = who === 'player';
  
  if (isRed(flipped)) {
    log(`Flipped ${flipped.value}${flipped.suit} — RED! Safe.`, 'log-heal');
  } else {
    log(`Flipped ${flipped.value}${flipped.suit} — BLACK! Overcharge explodes!`, 'log-damage');
    showOverchargeExplosion();
    if (isPlayerTarget) {
      playerHP -= 10; stats.oppDmg += 10; playerCharge = [];
      floatText('-10', window.innerWidth/2, window.innerHeight - 160, '#f44');
    } else {
      oppHP -= 10; stats.playerDmg += 10; oppCharge = [];
      floatText('-10', window.innerWidth/2, 80, '#f44');
    }
  }
  updateDeck();
  callback();
}

// ---- DRAW ----
function drawCard(who) {
  if (deck.length === 0) {
    log('Deck empty - reshuffling!');
    deck = makeDeck();
    const inPlay = [...playerHand, ...oppHand, ...playerCharge, ...oppCharge].map(cardId);
    deck = deck.filter(c => !inPlay.includes(cardId(c)));
    shuffle(deck);
    if (deck.length === 0) return null;
  }
  const c = deck.pop();
  if (who === 'player') playerHand.push(c);
  else oppHand.push(c);
  updateDeck();
  return c;
}

// ---- PLAYER TURN ----
function startPlayerTurn() {
  if (gameOver) return;
  turnOwner = 'player';
  playerCardsPlayed = 0;
  playerPlayedSpadeThisTurn = false;
  stats.turns++;
  logTurnSeparator(`Turn ${stats.turns} — You`);

  // BUG FIX #4: Draw FIRST, then overcharge check
  const drawn = drawCard('player');
  if (drawn) log('You drew a card.');

  if (totalCharge(playerCharge) > 12) {
    doOverchargeCheck('player', () => {
      render();
      if (checkGameOver()) return;
      showActionButtons();
    });
    return;
  }
  
  render();
  showActionButtons();
}

function showActionButtons() {
  $('use-charge-btn').classList.add('hidden');
  selectedCard = null;

  // Check if player has any playable cards (non-club)
  const playable = playerHand.filter(c => c.suit !== '♣');
  if (playable.length === 0) {
    // No playable cards — must pass (or hand is empty)
    $('play-btn').classList.add('hidden');
    $('pass-btn').classList.remove('hidden');
    if (playerHand.length > 0) {
      log('No playable cards — only counters in hand. You must pass.');
    } else {
      log('No cards in hand. You must pass.');
    }
  } else {
    $('play-btn').classList.remove('hidden');
    $('pass-btn').classList.remove('hidden'); // Always allow passing
  }
  render();
}

function selectCard(i) {
  if (waitingForResponse || gameOver) return;
  const c = playerHand[i];
  // Clubs can't be played on own turn
  if (c && c.suit === '♣') return;
  selectedCard = (selectedCard === i) ? null : i;
  render();
  const cards = $('player-hand').children;
  if (selectedCard !== null && cards[selectedCard]) cards[selectedCard].classList.add('selected');
  if (selectedCard !== null && playerHand[selectedCard].suit === '♠' && playerCharge.length > 0) {
    $('use-charge-btn').classList.remove('hidden');
  } else {
    $('use-charge-btn').classList.add('hidden');
  }
}

$('play-btn').addEventListener('click', playSelected);
$('use-charge-btn').addEventListener('click', () => playSelected(true));

function playSelected(useCharge) {
  if (selectedCard === null || waitingForResponse || gameOver) return;
  const card = playerHand[selectedCard];
  if (card.suit === '♣') return; // safety
  
  playerHand.splice(selectedCard, 1);
  selectedCard = null;
  allPlayed.push(card);
  showCardPlayed(card, 'player');
  playerCardsPlayed++;

  $('play-btn').classList.add('hidden');
  $('use-charge-btn').classList.add('hidden');

  resolvePlayerCard(card, useCharge);
}

function resolvePlayerCard(card, useCharge) {
  const suit = card.suit;
  const val = cardNum(card);

  // Track combo
  const seqVal = cardSeq(card);
  if (playerCombo.length === 0 || seqVal === playerCombo[playerCombo.length - 1] + 1) {
    playerCombo.push(seqVal);
  } else {
    playerCombo = [seqVal];
  }
  renderCombo();

  // Check breakpoint (2+ consecutive)
  if (playerCombo.length >= BREAKPOINT_THRESHOLD) {
    showBreakpointAnim();
    log('⚡ BREAKPOINT triggered!', 'log-important');
    stats.playerCombos++;
    playerCombo = [seqVal];
    showBreakpointChoice('player', () => afterPlayerCard(card, suit, val, useCharge));
    return;
  }

  afterPlayerCard(card, suit, val, useCharge);
}

function afterPlayerCard(card, suit, val, useCharge) {
  if (suit === '♠') {
    let dmg = val + playerBonusDmg;
    playerBonusDmg = 0;
    if (useCharge) {
      dmg += totalCharge(playerCharge);
      log(`Unleashing ${totalCharge(playerCharge)} stored charge!`, 'log-important');
      playerCharge = [];
    }
    // Cap charge-boosted attacks at 25
    dmg = Math.min(dmg, MAX_CHARGE_ATTACK);
    playerPlayedSpadeThisTurn = true;
    log(`You attack for ${dmg}!`);

    // Check opponent prepared guard
    if (oppPreparedGuard) {
      const guardVal = cardNum(oppPreparedGuard);
      log(`Opponent had a prepared guard (${oppPreparedGuard.value}♥, blocks ${guardVal})!`, 'log-important');
      const netDmg = Math.max(0, dmg - guardVal);
      const heal = Math.min(5, Math.max(0, guardVal - dmg));
      oppPreparedGuard = null;
      if (netDmg > 0) {
        oppHP -= netDmg; stats.playerDmg += netDmg;
        log(`${netDmg} damage gets through!`, 'log-damage');
        floatText('-' + netDmg, window.innerWidth/2, 80, '#f44');
        if (netDmg >= 10) screenFlash();
        checkMomentum('player', netDmg);
      } else {
        log('Attack fully blocked by prepared guard!');
      }
      if (heal > 0) {
        oppHP = Math.min(30, oppHP + heal);
        log(`Opponent heals ${heal} HP!`, 'log-heal');
      }
      // AI might still additionally respond
      finishAfterAttack();
      return;
    }

    // Opponent responds
    const guards = oppHand.filter(c => c.suit === '♥');
    const counters = oppHand.filter(c => c.suit === '♣');
    const aiResponse = aiChooseResponse(dmg, guards, counters);

    if (aiResponse) {
      const ri = oppHand.indexOf(aiResponse);
      oppHand.splice(ri, 1);
      allPlayed.push(aiResponse);
      showCardPlayed(aiResponse, 'opponent');

      if (aiResponse.suit === '♥') {
        const block = cardNum(aiResponse);
        const netDmg = Math.max(0, dmg - block);
        const heal = Math.min(5, Math.max(0, block - dmg));
        log(`Opponent guards with ${aiResponse.value}♥ (blocks ${block}).`);
        if (netDmg > 0) {
          oppHP -= netDmg; stats.playerDmg += netDmg;
          log(`${netDmg} damage gets through!`, 'log-damage');
          floatText('-' + netDmg, window.innerWidth/2, 80, '#f44');
          if (netDmg >= 10) screenFlash();
          checkMomentum('player', netDmg);
        } else {
          log('Attack fully blocked!');
        }
        if (heal > 0) {
          oppHP = Math.min(30, oppHP + heal);
          log(`Opponent heals ${heal} HP!`, 'log-heal');
        }
      } else if (aiResponse.suit === '♣') {
        const cval = cardNum(aiResponse);
        if (cval > dmg) {
          const reflect = Math.ceil(dmg / 3);
          log(`Opponent counters! Attack negated, ${reflect} reflected!`, 'log-damage');
          playerHP -= reflect; stats.oppDmg += reflect;
          floatText('-' + reflect, window.innerWidth/2, window.innerHeight - 160, '#f44');
        } else {
          log(`Opponent counter fails! (${cval} ≤ ${dmg})`);
          oppHP -= dmg; stats.playerDmg += dmg;
          floatText('-' + dmg, window.innerWidth/2, 80, '#f44');
          if (dmg >= 10) screenFlash();
          checkMomentum('player', dmg);
        }
      }
    } else {
      oppHP -= dmg; stats.playerDmg += dmg;
      log(`Opponent takes ${dmg} damage!`, 'log-damage');
      floatText('-' + dmg, window.innerWidth/2, 80, '#f44');
      if (dmg >= 10) screenFlash();
      checkMomentum('player', dmg);
    }
  } else if (suit === '♥') {
    // Prepared guard - store it
    playerPreparedGuard = card;
    log(`You prepare a guard (${card.value}♥, blocks ${val}). Will auto-apply when attacked.`, 'log-heal');
  } else if (suit === '♦') {
    playerCharge.push(card);
    log(`You charge +${val} (total: ${totalCharge(playerCharge)}).`);
  }
  // Clubs can't be played here (blocked in UI)

  finishAfterAttack();
}

// Pressure tracking: check once at end of each full turn
function checkPressureEndOfTurn(who, playedSpade) {
  if (who === 'player') {
    if (playedSpade) {
      playerNoAttackTurns = 0;
    } else {
      playerNoAttackTurns++;
      if (playerNoAttackTurns >= 2) {
        playerPressure++;
        log(`🔥 Your pressure: ${playerPressure}`, 'log-important');
        if (playerPressure >= 3) {
          log('💥 PRESSURE OVERLOAD! Discard hand & lose 5 HP!', 'log-damage');
          playerHand = [];
          playerHP -= 5; stats.oppDmg += 5;
          playerPressure = 0; playerNoAttackTurns = 0;
          floatText('-5 HP', window.innerWidth/2, window.innerHeight - 160, '#f44');
        }
      }
    }
  } else {
    if (playedSpade) {
      oppNoAttackTurns = 0;
    } else {
      oppNoAttackTurns++;
      if (oppNoAttackTurns >= 2) {
        oppPressure++;
        log(`🔥 Opponent pressure: ${oppPressure}`, 'log-important');
        if (oppPressure >= 3) {
          log('💥 Opponent PRESSURE OVERLOAD!', 'log-damage');
          oppHand = [];
          oppHP -= 5; stats.playerDmg += 5;
          oppPressure = 0; oppNoAttackTurns = 0;
          floatText('-5 HP', window.innerWidth/2, 80, '#f44');
        }
      }
    }
  }
}

function checkMomentum(who, dmg) {
  if (dmg >= 10) {
    if (who === 'player') { playerMomentum = true; log('⚡ You gain Momentum!', 'log-important'); }
    else { oppMomentum = true; log('⚡ Opponent gains Momentum!', 'log-important'); }
  }
}

$('pass-btn').addEventListener('click', () => {
  $('pass-btn').classList.add('hidden');
  $('play-btn').classList.add('hidden');
  $('use-charge-btn').classList.add('hidden');
  playerMomentum = false;
  // End turn with pressure check
  checkPressureEndOfTurn('player', playerPlayedSpadeThisTurn);
  render();
  if (checkGameOver()) return;
  setTimeout(() => startOpponentTurn(), 400);
});

function finishAfterAttack() {
  render();
  if (checkGameOver()) return;
  if (playerMomentum && playerCardsPlayed === 1) {
    playerMomentum = false;
    log('⚡ Momentum! Play a second card!', 'log-important');
    render();
    showActionButtons();
    $('pass-btn').classList.remove('hidden');
    return;
  }
  playerMomentum = false;
  // End of turn pressure check
  checkPressureEndOfTurn('player', playerPlayedSpadeThisTurn);
  render();
  if (checkGameOver()) return;
  setTimeout(() => startOpponentTurn(), 600);
}

// ---- BREAKPOINT CHOICE ----
function showBreakpointChoice(who, callback) {
  if (who === 'opponent') {
    const choice = aiBreakpointChoice();
    applyBreakpoint(who, choice);
    callback();
    return;
  }
  $('breakpoint-modal').classList.remove('hidden');
  document.querySelectorAll('.bp-choice').forEach(btn => {
    btn.onclick = () => {
      $('breakpoint-modal').classList.add('hidden');
      applyBreakpoint('player', btn.dataset.choice);
      callback();
    };
  });
}

function applyBreakpoint(who, choice) {
  if (who === 'player') {
    if (choice === 'damage') { playerBonusDmg += BREAKPOINT_BONUS_DMG; log(`Breakpoint: +${BREAKPOINT_BONUS_DMG} damage on next attack!`, 'log-important'); }
    else if (choice === 'draw') { drawCard('player'); log('Breakpoint: Drew 1 card!', 'log-important'); }
    else if (choice === 'steal') {
      if (oppCharge.length > 0) {
        const stolen = oppCharge.pop();
        playerCharge.push(stolen);
        log('Breakpoint: Stole 1 charge from opponent!', 'log-important');
      } else { drawCard('player'); log('Breakpoint: No charge to steal, drew 1 card.', 'log-important'); }
    }
  } else {
    if (choice === 'damage') { oppBonusDmg += BREAKPOINT_BONUS_DMG; log(`Opponent Breakpoint: +${BREAKPOINT_BONUS_DMG} damage!`, 'log-important'); }
    else if (choice === 'draw') { drawCard('opponent'); log('Opponent Breakpoint: Drew 1 card!', 'log-important'); }
    else if (choice === 'steal') {
      if (playerCharge.length > 0) {
        const stolen = playerCharge.pop();
        oppCharge.push(stolen);
        log('Opponent Breakpoint: Stole your charge!', 'log-important');
      } else { drawCard('opponent'); log('Opponent Breakpoint: Drew a card.', 'log-important'); }
    }
  }
  render();
}

// ---- OPPONENT TURN ----
function startOpponentTurn() {
  if (gameOver) return;
  turnOwner = 'opponent';
  oppPlayedSpadeThisTurn = false;
  logTurnSeparator(`Turn ${stats.turns} — Opponent`);
  render();

  // BUG FIX #4: Draw FIRST, then overcharge
  drawCard('opponent');
  log('Opponent draws a card.');

  if (totalCharge(oppCharge) > 12) {
    doOverchargeCheck('opponent', () => {
      render();
      if (checkGameOver()) return;
      let cardsToPlay = oppMomentum ? 2 : 1;
      oppMomentum = false;
      playAICards(cardsToPlay);
    });
    return;
  }

  render();
  let cardsToPlay = oppMomentum ? 2 : 1;
  oppMomentum = false;
  playAICards(cardsToPlay);
}

function playAICards(remaining) {
  if (remaining <= 0 || oppHand.length === 0 || gameOver) {
    // End of opponent turn: check pressure
    checkPressureEndOfTurn('opponent', oppPlayedSpadeThisTurn);
    render();
    if (checkGameOver()) return;
    setTimeout(() => startPlayerTurn(), 600);
    return;
  }

  const card = aiChooseCard();
  if (!card) {
    checkPressureEndOfTurn('opponent', oppPlayedSpadeThisTurn);
    render();
    if (checkGameOver()) return;
    setTimeout(() => startPlayerTurn(), 600);
    return;
  }

  const idx = oppHand.indexOf(card);
  oppHand.splice(idx, 1);
  allPlayed.push(card);
  showCardPlayed(card, 'opponent');

  const val = cardNum(card);
  const useCharge = card.suit === '♠' && oppCharge.length > 0 && aiWantsCharge(val);

  const seqVal = cardSeq(card);
  if (oppCombo.length === 0 || seqVal === oppCombo[oppCombo.length - 1] + 1) {
    oppCombo.push(seqVal);
  } else {
    oppCombo = [seqVal];
  }

  let bpTriggered = false;
  if (oppCombo.length >= BREAKPOINT_THRESHOLD) {
    showBreakpointAnim();
    log('⚡ Opponent triggers BREAKPOINT!', 'log-important');
    stats.oppCombos++;
    oppCombo = [seqVal];
    bpTriggered = true;
  }

  const afterBP = () => resolveOppCard(card, val, useCharge, remaining);
  if (bpTriggered) {
    showBreakpointChoice('opponent', afterBP);
  } else {
    afterBP();
  }
}

function resolveOppCard(card, val, useCharge, remaining) {
  if (card.suit === '♠') {
    let dmg = val + oppBonusDmg;
    oppBonusDmg = 0;
    if (useCharge) {
      dmg += totalCharge(oppCharge);
      log(`Opponent unleashes ${totalCharge(oppCharge)} stored charge!`, 'log-important');
      oppCharge = [];
    }
    dmg = Math.min(dmg, MAX_CHARGE_ATTACK);
    oppPlayedSpadeThisTurn = true;
    log(`Opponent attacks for ${dmg}!`);

    // Check player prepared guard first
    let prepGuardBlock = 0;
    if (playerPreparedGuard) {
      prepGuardBlock = cardNum(playerPreparedGuard);
      log(`Your prepared guard activates! (${playerPreparedGuard.value}♥, blocks ${prepGuardBlock})`, 'log-heal');
      playerPreparedGuard = null;
      dmg = Math.max(0, dmg - prepGuardBlock);
      if (dmg === 0) {
        log('Attack fully blocked by prepared guard!');
        const heal = Math.min(5, Math.max(0, prepGuardBlock - (val + (useCharge ? totalCharge(oppCharge) : 0))));
        if (heal > 0) {
          playerHP = Math.min(30, playerHP + heal);
          log(`You heal ${heal} HP from excess guard!`, 'log-heal');
          floatText('+' + heal, window.innerWidth/2, window.innerHeight - 160, '#4f4');
        }
        render();
        if (checkGameOver()) return;
        setTimeout(() => playAICards(remaining - 1), 300);
        return;
      }
      log(`${dmg} damage remaining after prepared guard.`);
    }

    // Player can still respond with guard or counter
    const guards = playerHand.filter(c => c.suit === '♥');
    const counters = playerHand.filter(c => c.suit === '♣');
    
    if ((guards.length > 0 || counters.length > 0) && dmg > 0) {
      // Dramatic pause + red flash before showing response
      setTimeout(() => {
        showResponseModal(dmg, guards, counters, (response) => {
          if (response) {
            const ri = playerHand.indexOf(response);
            playerHand.splice(ri, 1);
            allPlayed.push(response);
            showCardPlayed(response, 'player');

            if (response.suit === '♥') {
              const block = cardNum(response);
              const netDmg = Math.max(0, dmg - block);
              const heal = Math.min(5, Math.max(0, block - dmg));
              log(`You guard with ${response.value}♥ (blocks ${block}).`);
              if (netDmg > 0) {
                playerHP -= netDmg; stats.oppDmg += netDmg;
                log(`${netDmg} damage gets through!`, 'log-damage');
                floatText('-' + netDmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
                if (netDmg >= 10) screenFlash();
                checkMomentum('opponent', netDmg);
              } else { log('Attack fully blocked!'); }
              if (heal > 0) {
                playerHP = Math.min(30, playerHP + heal);
                log(`You heal ${heal} HP!`, 'log-heal');
                floatText('+' + heal, window.innerWidth/2, window.innerHeight - 160, '#4f4');
              }
            } else if (response.suit === '♣') {
              const cval = cardNum(response);
              if (cval > dmg) {
                const reflect = Math.ceil(dmg / 3);
                log(`Counter succeeds! Attack negated, ${reflect} reflected!`, 'log-important');
                oppHP -= reflect; stats.playerDmg += reflect;
                floatText('-' + reflect, window.innerWidth/2, 80, '#f44');
              } else {
                log(`Counter fails! (${cval} ≤ ${dmg})`);
                playerHP -= dmg; stats.oppDmg += dmg;
                floatText('-' + dmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
                if (dmg >= 10) screenFlash();
                checkMomentum('opponent', dmg);
              }
            }
          } else {
            playerHP -= dmg; stats.oppDmg += dmg;
            log(`You take ${dmg} damage!`, 'log-damage');
            floatText('-' + dmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
            if (dmg >= 10) screenFlash();
            checkMomentum('opponent', dmg);
          }
          render();
          if (checkGameOver()) return;
          setTimeout(() => playAICards(remaining - 1), 300);
        });
      }, 500); // dramatic pause
      return;
    } else {
      if (dmg > 0) {
        playerHP -= dmg; stats.oppDmg += dmg;
        log(`You take ${dmg} damage!`, 'log-damage');
        floatText('-' + dmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
        if (dmg >= 10) screenFlash();
        checkMomentum('opponent', dmg);
      }
    }
  } else if (card.suit === '♥') {
    // Opponent prepares guard
    oppPreparedGuard = card;
    log(`Opponent prepares a guard (${card.value}♥, blocks ${val}).`);
  } else if (card.suit === '♦') {
    oppCharge.push(card);
    log(`Opponent charges +${val} (total: ${totalCharge(oppCharge)}).`);
  } else if (card.suit === '♣') {
    // AI shouldn't play clubs on own turn, but just in case
    log(`Opponent plays a club out of turn. Discarded.`);
  }

  render();
  if (checkGameOver()) return;
  setTimeout(() => playAICards(remaining - 1), 300);
}

// ---- RESPONSE MODAL ----
function showResponseModal(dmg, guards, counters, callback) {
  waitingForResponse = true;
  const modal = $('response-modal');
  modal.classList.remove('hidden');
  $('response-title').textContent = `Opponent attacks for ${dmg}!`;
  $('response-desc').textContent = 'Play a ♥ to guard or ♣ to counter:';
  
  // Red flash on modal
  const content = $('response-modal-content');
  content.classList.remove('attack-flash');
  void content.offsetWidth; // force reflow
  content.classList.add('attack-flash');

  const container = $('response-cards');
  container.innerHTML = '';

  const usable = [...guards, ...counters];
  usable.forEach(c => {
    const el = makeCardEl(c);
    el.classList.add(c.suit === '♥' ? 'glow-guard' : 'glow-counter');
    el.addEventListener('click', () => {
      waitingForResponse = false;
      modal.classList.add('hidden');
      callback(c);
    });
    container.appendChild(el);
  });

  $('response-skip').onclick = () => {
    waitingForResponse = false;
    modal.classList.add('hidden');
    callback(null);
  };

  render();
}

// ---- GAME OVER ----
function checkGameOver() {
  if (playerHP <= 0 || oppHP <= 0) {
    gameOver = true;
    setTimeout(() => {
      const won = oppHP <= 0;
      $('gameover-title').textContent = won ? '🏆 VICTORY!' : '💀 DEFEAT';
      $('gameover-title').style.color = won ? '#4f4' : '#f44';
      $('gameover-stats').innerHTML = `
        <p>Turns: ${stats.turns}</p>
        <p>Your damage dealt: ${stats.playerDmg}</p>
        <p>Damage taken: ${stats.oppDmg}</p>
        <p>Breakpoints triggered: ${stats.playerCombos}</p>
        <p>Opponent breakpoints: ${stats.oppCombos}</p>
        <p>Final HP: You ${Math.max(0,playerHP)} / Opp ${Math.max(0,oppHP)}</p>
      `;
      $('gameover-modal').classList.remove('hidden');
    }, 500);
    return true;
  }
  return false;
}

// ---- AI ----
function aiChooseCard() {
  if (oppHand.length === 0) return null;
  // Never play clubs on own turn
  const playable = oppHand.filter(c => c.suit !== '♣');
  if (playable.length === 0) return null;

  if (difficulty === 'easy') return aiEasy(playable);
  if (difficulty === 'medium') return aiMedium(playable);
  return aiHard(playable);
}

function aiEasy(playable) {
  return playable[Math.floor(Math.random() * playable.length)];
}

function aiMedium(playable) {
  const spades = playable.filter(c => c.suit === '♠');
  const diamonds = playable.filter(c => c.suit === '♦');
  const hearts = playable.filter(c => c.suit === '♥');

  // Try breakpoint (look for next in sequence)
  const bp = aiFindBreakpointCard(playable);
  if (bp) return bp;

  // If pressure building, attack
  if (oppNoAttackTurns >= 1 && spades.length > 0) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];

  // Unleash charge at 8+ (was 6)
  if (spades.length > 0 && totalCharge(oppCharge) >= 8) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];

  // Build charge sometimes
  if (diamonds.length > 0 && totalCharge(oppCharge) < 10 && Math.random() < 0.3) return diamonds[0];

  // Attack
  if (spades.length > 0) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];

  if (oppHP < 15 && hearts.length > 0) return hearts[0];
  if (diamonds.length > 0) return diamonds[0];
  return playable[0];
}

function aiHard(playable) {
  const spades = playable.filter(c => c.suit === '♠');
  const diamonds = playable.filter(c => c.suit === '♦');
  const hearts = playable.filter(c => c.suit === '♥');

  // Preemptively guard when low HP
  if (oppHP < 10 && hearts.length > 0 && !oppPreparedGuard) {
    return hearts.sort((a,b) => cardNum(b) - cardNum(a))[0];
  }

  // Try breakpoint - look 2 ahead
  const bp = aiFindBreakpointCard(playable);
  if (bp) return bp;
  // Also try starting a breakpoint sequence
  const bpStart = aiFindBreakpointStart(playable);
  if (bpStart) return bpStart;

  // If player has few cards, go aggressive
  if (playerHand.length < 3 && spades.length > 0) {
    return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];
  }

  // If player has been charging (we can estimate from allPlayed), save counters for response
  // and attack aggressively
  const playerChargeVisible = totalCharge(playerCharge);

  // Bait strategy: if we have 2+ spades, play small first
  if (spades.length >= 2 && playerHand.length > 3) {
    const sorted = spades.sort((a,b) => cardNum(a) - cardNum(b));
    // If we have charge ready, play big attack with charge
    if (oppCharge.length > 0 && totalCharge(oppCharge) >= 8) return sorted[sorted.length - 1];
    return sorted[0]; // bait with small
  }

  // Big attack with charge
  if (spades.length > 0 && oppCharge.length > 0 && totalCharge(oppCharge) >= 8) {
    return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];
  }

  // Must attack to avoid pressure
  if (oppNoAttackTurns >= 1 && spades.length > 0) return spades[0];

  // Attack
  if (spades.length > 0) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];

  // Charge strategically (under 12)
  if (diamonds.length > 0 && totalCharge(oppCharge) < 12 && oppNoAttackTurns < 1) {
    return diamonds.sort((a,b) => cardNum(b) - cardNum(a))[0];
  }

  if (hearts.length > 0 && oppHP < 12) return hearts[0];
  if (diamonds.length > 0) return diamonds[0];
  if (hearts.length > 0) return hearts[0];
  return playable[0];
}

function aiFindBreakpointCard(playable) {
  if (oppCombo.length < 1) return null;
  const nextVal = oppCombo[oppCombo.length - 1] + 1;
  if (nextVal > 13) return null;
  return (playable || oppHand).find(c => c.suit !== '♣' && cardSeq(c) === nextVal) || null;
}

// Hard AI: look for a card that could START a 2-card breakpoint sequence
function aiFindBreakpointStart(playable) {
  if (oppCombo.length > 0) return null; // already in a combo
  // Look for cards where we have consecutive values
  const seqVals = playable.map(c => cardSeq(c)).sort((a,b) => a - b);
  for (let i = 0; i < seqVals.length - 1; i++) {
    if (seqVals[i+1] === seqVals[i] + 1) {
      // Found a pair - play the lower one first
      return playable.find(c => cardSeq(c) === seqVals[i]);
    }
  }
  return null;
}

function aiChooseResponse(dmg, guards, counters) {
  if (difficulty === 'easy') {
    // BUG FIX #5: reduce from 30% to 10%
    if (Math.random() < 0.10 && guards.length > 0) return guards[0];
    return null;
  }

  if (difficulty === 'medium') {
    // Counter big attacks
    if (dmg >= 8 && counters.length > 0) {
      const valid = counters.filter(c => cardNum(c) > dmg);
      if (valid.length > 0) return valid[0];
    }
    // Guard attacks > 6 damage (was 5, but also skipped small — now actually guards)
    if (dmg >= 6 && guards.length > 0) {
      return guards.sort((a,b) => cardNum(a) - cardNum(b)).find(c => cardNum(c) >= dmg) || guards[guards.length - 1];
    }
    // Also guard if HP is low
    if (oppHP < 12 && dmg >= 4 && guards.length > 0) return guards[0];
    return null;
  }

  // Hard: optimal + card tracking
  // Estimate what player might have based on allPlayed
  const spadesPlayed = allPlayed.filter(c => c.suit === '♠').length;
  const playerLikelyAggressive = spadesPlayed > 5 || playerHand.length < 3;

  // Counter if possible for reflect
  if (counters.length > 0 && dmg >= 6) {
    const valid = counters.filter(c => cardNum(c) > dmg);
    if (valid.length > 0) return valid.sort((a,b) => cardNum(a) - cardNum(b))[0];
  }
  // Guard efficiently
  if (guards.length > 0 && dmg >= 4) {
    const sorted = guards.sort((a,b) => cardNum(a) - cardNum(b));
    return sorted.find(c => cardNum(c) >= dmg) || (dmg >= 7 ? sorted[sorted.length-1] : null);
  }
  // If HP critical, guard anything
  if (oppHP <= dmg && guards.length > 0) return guards[0];
  if (oppHP <= dmg && counters.length > 0) return counters[0];
  return null;
}

function aiWantsCharge(attackVal) {
  if (difficulty === 'easy') return Math.random() < 0.2;
  if (difficulty === 'medium') return totalCharge(oppCharge) >= 8; // was 6
  return attackVal + totalCharge(oppCharge) >= 12;
}

function aiBreakpointChoice() {
  if (difficulty === 'easy') return ['damage','draw','steal'][Math.floor(Math.random()*3)];
  if (difficulty === 'medium') {
    if (oppHand.length <= 2) return 'draw';
    if (playerCharge.length > 0) return 'steal';
    return 'damage';
  }
  // Hard
  if (playerCharge.length > 0 && totalCharge(playerCharge) >= 6) return 'steal';
  if (oppHand.length <= 2) return 'draw';
  return 'damage';
}

})();
