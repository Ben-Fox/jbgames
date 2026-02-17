// BreakPoint - Tactical Card Duel
(function() {
'use strict';

const SUITS = ['♠','♥','♦','♣'];
const SUIT_NAMES = {'♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs'};
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const VAL_NUM = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10,'A':11};
const VAL_SEQ = {'A':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13};
const MAX_CHARGE_ATTACK = 25;
const BREAKPOINT_THRESHOLD = 2;
const BREAKPOINT_BONUS_DMG = 3;
const FACE_VALUES = ['J','Q','K'];

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
let playerPlayedSpadeThisTurn = false;
let oppPlayedSpadeThisTurn = false;
let playerNoAttackTurns = 0, oppNoAttackTurns = 0;
let playerPreparedGuard = null;
let oppPreparedGuard = null;

// NEW: Suit streak tracking
let playerLastSuit = null, oppLastSuit = null;
// NEW: Power Surge flag (1.5x charge multiplier)
let playerPowerSurge = false, oppPowerSurge = false;
// NEW: Royal Combo tracking - arrays of face card values played consecutively
let playerRoyalProgress = [], oppRoyalProgress = [];
// NEW: Royal turn counters (to ensure 3 consecutive turns)
let playerRoyalTurns = 0, oppRoyalTurns = 0;

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
function isFaceCard(c) { return FACE_VALUES.includes(c.value); }

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
  // NEW resets
  playerLastSuit = null; oppLastSuit = null;
  playerPowerSurge = false; oppPowerSurge = false;
  playerRoyalProgress = []; oppRoyalProgress = [];
  playerRoyalTurns = 0; oppRoyalTurns = 0;
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
  hand.forEach((c, i) => {
    const card = faceUp ? makeCardEl(c) : makeCardBack();
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
        card.classList.add('disabled-club');
        card.title = 'Counters can only be played when attacked';
      } else {
        card.classList.add('playable');
        card.addEventListener('click', () => selectCard(i));
        card.addEventListener('dblclick', () => { selectCard(i); playSelected(); });
      }
    }
    if (faceUp && selectedCard === i) card.classList.add('selected');
    card.classList.add('card-enter');
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
  // Value sequence
  const valText = playerCombo.length ? playerCombo.join(' → ') : 'none';
  // Suit streak
  let suitText = '';
  if (playerLastSuit && playerLastSuit !== '♣') {
    suitText = ` | SUIT: ${playerLastSuit} x1`;
  }
  // Royal progress
  let royalText = '';
  if (playerRoyalProgress.length > 0) {
    const hasJ = playerRoyalProgress.includes('J');
    const hasQ = playerRoyalProgress.includes('Q');
    const hasK = playerRoyalProgress.includes('K');
    royalText = ` | ROYAL: J ${hasJ ? '✓' : '?'} Q ${hasQ ? '✓' : '?'} K ${hasK ? '✓' : '?'}`;
  }
  $('combo-values').textContent = valText + suitText + royalText;
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
    if (playerLastSuit === '♠') parts += ` + 2 (Double Strike)`;
    if (charge > 0) {
      let ch = charge;
      if (playerPowerSurge) ch = Math.floor(ch * 1.5);
      parts += `<br>With charge: ${Math.min(MAX_CHARGE_ATTACK, total + ch + (playerLastSuit === '♠' ? 2 : 0))} damage`;
    } else {
      parts += `<br>Total: ${total + (playerLastSuit === '♠' ? 2 : 0)} damage`;
    }
    if (c.value === 'A') parts += `<br>🩸 Life Steal: heal 3 HP if damage lands`;
    return parts;
  }
  if (c.suit === '♥') {
    let extra = '';
    if (playerLastSuit === '♥') extra = '<br>💚 Healing Aura: +3 HP bonus!';
    return `<b>♥ Guard: blocks ${v}</b><br>Play now to prepare a guard for the next attack. Excess blocks heal (max 5).${extra}`;
  }
  if (c.suit === '♦') {
    let surgeNote = playerLastSuit === '♦' ? '<br>⚡ Power Surge: charge will be 1.5x!' : '';
    return `<b>♦ Charge: +${v}</b><br>Current charge: ${totalCharge(playerCharge)}<br>After: ${totalCharge(playerCharge) + v}${totalCharge(playerCharge) + v > 12 ? ' ⚠ OVERCHARGE' : ''}${surgeNote}`;
  }
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

function showRoyalComboAnim() {
  const flash = document.createElement('div');
  flash.className = 'breakpoint-flash royal-flash';
  document.body.appendChild(flash);
  const txt = document.createElement('div');
  txt.className = 'breakpoint-text royal-text';
  txt.textContent = '👑 ROYAL COMBO 👑';
  document.body.appendChild(txt);
  setTimeout(() => { flash.remove(); txt.remove(); }, 1500);
}

function showSuitStreakFlash(suit) {
  const flash = document.createElement('div');
  flash.className = 'suit-streak-flash';
  if (suit === '♠') flash.style.background = 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, transparent 70%)';
  else if (suit === '♥') flash.style.background = 'radial-gradient(circle, rgba(255,0,0,0.4) 0%, transparent 70%)';
  else if (suit === '♦') flash.style.background = 'radial-gradient(circle, rgba(0,100,255,0.4) 0%, transparent 70%)';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);
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

// ---- SACRIFICE ----
function playerSacrifice() {
  if (selectedCard === null || waitingForResponse || gameOver) return;
  const card = playerHand[selectedCard];
  if (card.suit === '♣') return;
  const val = cardNum(card);
  const heal = Math.min(val, 30 - playerHP);
  playerHand.splice(selectedCard, 1);
  selectedCard = null;
  allPlayed.push(card);
  playerCardsPlayed++;
  playerHP = Math.min(30, playerHP + val);
  log(`Sacrificed ${card.value}${card.suit} for ${heal} HP!`, 'log-heal');
  floatText('+' + heal + ' HP', window.innerWidth/2, window.innerHeight - 160, '#4f4');

  // Track suit/royal as normal
  const streakResult = checkSuitStreak('player', card.suit);
  // Healing Aura still triggers on heart streak sacrifice
  trackRoyalProgress('player', card);
  setSuitAfterPlay('player', card.suit);

  $('play-btn').classList.add('hidden');
  $('use-charge-btn').classList.add('hidden');
  $('sacrifice-btn').classList.add('hidden');
  finishAfterAttack();
}

function aiSacrifice(playable) {
  if (difficulty === 'easy') return null;
  if (difficulty === 'medium') {
    if (oppHP < 8) {
      const low = playable.filter(c => cardNum(c) <= 4);
      if (low.length > 0) return low[0];
    }
    return null;
  }
  // Hard
  if (oppHP < 5) {
    return playable.sort((a,b) => cardNum(a) - cardNum(b))[0];
  }
  if (oppHP < 12) {
    const low = playable.filter(c => cardNum(c) <= 4);
    if (low.length > 0) return low[0];
  }
  return null;
}

// ---- SUIT STREAK ----
function checkSuitStreak(who, suit) {
  const lastSuit = who === 'player' ? playerLastSuit : oppLastSuit;
  if (suit === '♣') return; // clubs can't streak
  
  if (lastSuit === suit) {
    // Streak triggered!
    showSuitStreakFlash(suit);
    if (suit === '♠') {
      // Double Strike: +2 bonus damage (applied in attack resolution)
      if (who === 'player') {
        log('Double Strike! +2 damage', 'log-important');
      } else {
        log('Opponent Double Strike! +2 damage', 'log-important');
      }
      return 'double-strike';
    } else if (suit === '♥') {
      // Healing Aura: +3 HP
      if (who === 'player') {
        playerHP = Math.min(30, playerHP + 3);
        log('Healing Aura! +3 HP', 'log-heal');
        floatText('+3 HP', window.innerWidth/2, window.innerHeight - 160, '#4f4');
      } else {
        oppHP = Math.min(30, oppHP + 3);
        log('Opponent Healing Aura! +3 HP', 'log-heal');
        floatText('+3 HP', window.innerWidth/2, 80, '#4f4');
      }
      return 'healing-aura';
    } else if (suit === '♦') {
      // Power Surge: 1.5x charge flag
      if (who === 'player') {
        playerPowerSurge = true;
        log('Power Surge! Charge amplified to 1.5x', 'log-important');
      } else {
        oppPowerSurge = true;
        log('Opponent Power Surge! Charge amplified to 1.5x', 'log-important');
      }
      return 'power-surge';
    }
  }
  return null;
}

function setSuitAfterPlay(who, suit) {
  if (suit === '♣') return; // don't track clubs
  if (who === 'player') playerLastSuit = suit;
  else oppLastSuit = suit;
}

// ---- ROYAL COMBO ----
function trackRoyalProgress(who, card) {
  const isPlayer = who === 'player';
  let progress = isPlayer ? playerRoyalProgress : oppRoyalProgress;
  
  if (isFaceCard(card)) {
    // Add if not already tracked
    if (!progress.includes(card.value)) {
      progress.push(card.value);
    }
    if (isPlayer) playerRoyalTurns++;
    else oppRoyalTurns++;
    
    // Check if all 3 collected within 3 consecutive turns
    if (progress.includes('J') && progress.includes('Q') && progress.includes('K')) {
      const turns = isPlayer ? playerRoyalTurns : oppRoyalTurns;
      if (turns <= 3) {
        // ROYAL COMBO!
        return true;
      }
    }
  } else {
    // Non-face card resets royal progress
    if (isPlayer) { playerRoyalProgress = []; playerRoyalTurns = 0; }
    else { oppRoyalProgress = []; oppRoyalTurns = 0; }
  }
  return false;
}

function applyRoyalCombo(who) {
  showRoyalComboAnim();
  if (who === 'player') {
    log('👑 ROYAL COMBO! 8 unblockable damage!', 'log-important');
    oppHP -= 8;
    stats.playerDmg += 8;
    floatText('-8', window.innerWidth/2, 80, '#ffd700');
    playerRoyalProgress = [];
    playerRoyalTurns = 0;
  } else {
    log('👑 Opponent ROYAL COMBO! 8 unblockable damage!', 'log-important');
    playerHP -= 8;
    stats.oppDmg += 8;
    floatText('-8', window.innerWidth/2, window.innerHeight - 160, '#ffd700');
    oppRoyalProgress = [];
    oppRoyalTurns = 0;
  }
}

// ---- LIFE STEAL ----
function applyLifeSteal(who, card, damageDealt) {
  if (card.value === 'A' && card.suit === '♠' && damageDealt > 0) {
    if (who === 'player') {
      const heal = Math.min(3, 30 - playerHP);
      if (heal > 0) {
        playerHP = Math.min(30, playerHP + 3);
        log('Life Steal! Healed 3 HP', 'log-heal');
        floatText('+3 HP', window.innerWidth/2, window.innerHeight - 160, '#c084fc');
      }
    } else {
      const heal = Math.min(3, 30 - oppHP);
      if (heal > 0) {
        oppHP = Math.min(30, oppHP + 3);
        log('Opponent Life Steal! Healed 3 HP', 'log-heal');
        floatText('+3 HP', window.innerWidth/2, 80, '#c084fc');
      }
    }
  }
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
  
  if (isRed(flipped)) {
    log(`Flipped ${flipped.value}${flipped.suit} — RED! Safe.`, 'log-heal');
  } else {
    log(`Flipped ${flipped.value}${flipped.suit} — BLACK! Overcharge explodes!`, 'log-damage');
    showOverchargeExplosion();
    if (who === 'player') {
      playerHP -= 10; stats.oppDmg += 10; playerCharge = []; playerPowerSurge = false;
      floatText('-10', window.innerWidth/2, window.innerHeight - 160, '#f44');
    } else {
      oppHP -= 10; stats.playerDmg += 10; oppCharge = []; oppPowerSurge = false;
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
  $('sacrifice-btn').classList.add('hidden');
  selectedCard = null;

  const playable = playerHand.filter(c => c.suit !== '♣');
  if (playable.length === 0) {
    $('play-btn').classList.add('hidden');
    $('pass-btn').classList.remove('hidden');
    if (playerHand.length > 0) {
      log('No playable cards — only counters in hand. You must pass.');
    } else {
      log('No cards in hand. You must pass.');
    }
  } else {
    $('play-btn').classList.remove('hidden');
    $('pass-btn').classList.remove('hidden');
  }
  render();
}

function selectCard(i) {
  if (waitingForResponse || gameOver) return;
  const c = playerHand[i];
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
  if (selectedCard !== null && playerHP < 30) {
    $('sacrifice-btn').classList.remove('hidden');
  } else {
    $('sacrifice-btn').classList.add('hidden');
  }
}

$('play-btn').addEventListener('click', playSelected);
$('use-charge-btn').addEventListener('click', () => playSelected(true));
$('sacrifice-btn').addEventListener('click', playerSacrifice);

function playSelected(useCharge) {
  if (selectedCard === null || waitingForResponse || gameOver) return;
  const card = playerHand[selectedCard];
  if (card.suit === '♣') return;
  
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

  // Track value combo
  const seqVal = cardSeq(card);
  if (playerCombo.length === 0 || seqVal === playerCombo[playerCombo.length - 1] + 1) {
    playerCombo.push(seqVal);
  } else {
    playerCombo = [seqVal];
  }
  renderCombo();

  // Check breakpoint
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
  // Check suit streak BEFORE resolving (so bonus applies)
  const streakResult = checkSuitStreak('player', suit);
  
  // Track royal progress
  const royalTriggered = trackRoyalProgress('player', card);

  if (suit === '♠') {
    let dmg = val + playerBonusDmg;
    playerBonusDmg = 0;
    // Double Strike bonus
    if (streakResult === 'double-strike') dmg += 2;
    if (useCharge) {
      let ch = totalCharge(playerCharge);
      if (playerPowerSurge) {
        ch = Math.floor(ch * 1.5);
        log(`Power Surge amplifies charge to ${ch}!`, 'log-important');
        playerPowerSurge = false;
      }
      dmg += ch;
      log(`Unleashing ${ch} stored charge!`, 'log-important');
      playerCharge = [];
    }
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
        applyLifeSteal('player', card, netDmg);
      } else {
        log('Attack fully blocked by prepared guard!');
      }
      if (heal > 0) {
        oppHP = Math.min(30, oppHP + heal);
        log(`Opponent heals ${heal} HP!`, 'log-heal');
      }
      setSuitAfterPlay('player', suit);
      // Royal combo after normal resolution
      if (royalTriggered) applyRoyalCombo('player');
      finishAfterAttack();
      return;
    }

    // Opponent responds
    const guards = oppHand.filter(c => c.suit === '♥');
    const counters = oppHand.filter(c => c.suit === '♣');
    const aiResponse = aiChooseResponse(dmg, guards, counters);

    let actualDmg = 0;
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
          actualDmg = netDmg;
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
          actualDmg = dmg;
        }
      }
    } else {
      oppHP -= dmg; stats.playerDmg += dmg;
      log(`Opponent takes ${dmg} damage!`, 'log-damage');
      floatText('-' + dmg, window.innerWidth/2, 80, '#f44');
      if (dmg >= 10) screenFlash();
      checkMomentum('player', dmg);
      actualDmg = dmg;
    }
    applyLifeSteal('player', card, actualDmg);
  } else if (suit === '♥') {
    playerPreparedGuard = card;
    log(`You prepare a guard (${card.value}♥, blocks ${val}). Will auto-apply when attacked.`, 'log-heal');
  } else if (suit === '♦') {
    playerCharge.push(card);
    log(`You charge +${val} (total: ${totalCharge(playerCharge)}).`);
  }

  setSuitAfterPlay('player', suit);
  // Royal combo after normal resolution
  if (royalTriggered) applyRoyalCombo('player');
  finishAfterAttack();
}

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
    checkPressureEndOfTurn('opponent', oppPlayedSpadeThisTurn);
    render();
    if (checkGameOver()) return;
    setTimeout(() => startPlayerTurn(), 600);
    return;
  }

  // Check if AI wants to sacrifice instead
  const playableForSac = oppHand.filter(c => c.suit !== '♣');
  const sacCard = aiSacrifice(playableForSac);
  if (sacCard && oppHP < 30) {
    const si = oppHand.indexOf(sacCard);
    oppHand.splice(si, 1);
    allPlayed.push(sacCard);
    const sacVal = cardNum(sacCard);
    const sacHeal = Math.min(sacVal, 30 - oppHP);
    oppHP = Math.min(30, oppHP + sacVal);
    log(`Opponent sacrificed ${sacCard.value}${sacCard.suit} for ${sacHeal} HP!`, 'log-heal');
    floatText('+' + sacHeal + ' HP', window.innerWidth/2, 80, '#4f4');
    checkSuitStreak('opponent', sacCard.suit);
    trackRoyalProgress('opponent', sacCard);
    setSuitAfterPlay('opponent', sacCard.suit);
    render();
    if (checkGameOver()) return;
    setTimeout(() => playAICards(remaining - 1), 300);
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
  const suit = card.suit;
  
  // Check suit streak
  const streakResult = checkSuitStreak('opponent', suit);
  
  // Track royal progress
  const royalTriggered = trackRoyalProgress('opponent', card);

  if (suit === '♠') {
    let dmg = val + oppBonusDmg;
    oppBonusDmg = 0;
    // Double Strike bonus
    if (streakResult === 'double-strike') dmg += 2;
    if (useCharge) {
      let ch = totalCharge(oppCharge);
      if (oppPowerSurge) {
        ch = Math.floor(ch * 1.5);
        log(`Opponent Power Surge amplifies charge to ${ch}!`, 'log-important');
        oppPowerSurge = false;
      }
      dmg += ch;
      log(`Opponent unleashes ${ch} stored charge!`, 'log-important');
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
      const origDmg = dmg;
      playerPreparedGuard = null;
      dmg = Math.max(0, dmg - prepGuardBlock);
      if (dmg === 0) {
        log('Attack fully blocked by prepared guard!');
        const heal = Math.min(5, Math.max(0, prepGuardBlock - origDmg));
        if (heal > 0) {
          playerHP = Math.min(30, playerHP + heal);
          log(`You heal ${heal} HP from excess guard!`, 'log-heal');
          floatText('+' + heal, window.innerWidth/2, window.innerHeight - 160, '#4f4');
        }
        setSuitAfterPlay('opponent', suit);
        if (royalTriggered) applyRoyalCombo('opponent');
        render();
        if (checkGameOver()) return;
        setTimeout(() => playAICards(remaining - 1), 300);
        return;
      }
      log(`${dmg} damage remaining after prepared guard.`);
    }

    // Player can still respond
    const guards = playerHand.filter(c => c.suit === '♥');
    const counters = playerHand.filter(c => c.suit === '♣');
    
    if ((guards.length > 0 || counters.length > 0) && dmg > 0) {
      const capturedCard = card;
      const capturedDmg = dmg;
      setTimeout(() => {
        showResponseModal(capturedDmg, guards, counters, (response) => {
          let actualDmg = 0;
          if (response) {
            const ri = playerHand.indexOf(response);
            playerHand.splice(ri, 1);
            allPlayed.push(response);
            showCardPlayed(response, 'player');

            if (response.suit === '♥') {
              const block = cardNum(response);
              const netDmg = Math.max(0, capturedDmg - block);
              const heal = Math.min(5, Math.max(0, block - capturedDmg));
              log(`You guard with ${response.value}♥ (blocks ${block}).`);
              if (netDmg > 0) {
                playerHP -= netDmg; stats.oppDmg += netDmg;
                log(`${netDmg} damage gets through!`, 'log-damage');
                floatText('-' + netDmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
                if (netDmg >= 10) screenFlash();
                checkMomentum('opponent', netDmg);
                actualDmg = netDmg;
              } else { log('Attack fully blocked!'); }
              if (heal > 0) {
                playerHP = Math.min(30, playerHP + heal);
                log(`You heal ${heal} HP!`, 'log-heal');
                floatText('+' + heal, window.innerWidth/2, window.innerHeight - 160, '#4f4');
              }
            } else if (response.suit === '♣') {
              const cval = cardNum(response);
              if (cval > capturedDmg) {
                const reflect = Math.ceil(capturedDmg / 3);
                log(`Counter succeeds! Attack negated, ${reflect} reflected!`, 'log-important');
                oppHP -= reflect; stats.playerDmg += reflect;
                floatText('-' + reflect, window.innerWidth/2, 80, '#f44');
              } else {
                log(`Counter fails! (${cval} ≤ ${capturedDmg})`);
                playerHP -= capturedDmg; stats.oppDmg += capturedDmg;
                floatText('-' + capturedDmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
                if (capturedDmg >= 10) screenFlash();
                checkMomentum('opponent', capturedDmg);
                actualDmg = capturedDmg;
              }
            }
          } else {
            playerHP -= capturedDmg; stats.oppDmg += capturedDmg;
            log(`You take ${capturedDmg} damage!`, 'log-damage');
            floatText('-' + capturedDmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
            if (capturedDmg >= 10) screenFlash();
            checkMomentum('opponent', capturedDmg);
            actualDmg = capturedDmg;
          }
          applyLifeSteal('opponent', capturedCard, actualDmg);
          setSuitAfterPlay('opponent', suit);
          if (royalTriggered) applyRoyalCombo('opponent');
          render();
          if (checkGameOver()) return;
          setTimeout(() => playAICards(remaining - 1), 300);
        });
      }, 500);
      return;
    } else {
      let actualDmg = 0;
      if (dmg > 0) {
        playerHP -= dmg; stats.oppDmg += dmg;
        log(`You take ${dmg} damage!`, 'log-damage');
        floatText('-' + dmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
        if (dmg >= 10) screenFlash();
        checkMomentum('opponent', dmg);
        actualDmg = dmg;
      }
      applyLifeSteal('opponent', card, actualDmg);
    }
  } else if (suit === '♥') {
    oppPreparedGuard = card;
    log(`Opponent prepares a guard (${card.value}♥, blocks ${val}).`);
  } else if (suit === '♦') {
    oppCharge.push(card);
    log(`Opponent charges +${val} (total: ${totalCharge(oppCharge)}).`);
  } else if (suit === '♣') {
    log(`Opponent plays a club out of turn. Discarded.`);
  }

  setSuitAfterPlay('opponent', suit);
  if (royalTriggered) applyRoyalCombo('opponent');

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
  
  const content = $('response-modal-content');
  content.classList.remove('attack-flash');
  void content.offsetWidth;
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

  // Try breakpoint
  const bp = aiFindBreakpointCard(playable);
  if (bp) return bp;

  // Suit streak preference: if last suit matches a good card, prefer it
  if (oppLastSuit && oppLastSuit !== '♣') {
    const samesuit = playable.filter(c => c.suit === oppLastSuit);
    if (samesuit.length > 0 && Math.random() < 0.4) {
      // Prefer high-value same-suit card
      return samesuit.sort((a,b) => cardNum(b) - cardNum(a))[0];
    }
  }

  // Life steal: prefer Ace of Spades when available
  const aceSpade = spades.find(c => c.value === 'A');
  if (aceSpade && oppHP < 20) return aceSpade;

  if (oppNoAttackTurns >= 1 && spades.length > 0) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];
  if (spades.length > 0 && totalCharge(oppCharge) >= 8) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];
  if (diamonds.length > 0 && totalCharge(oppCharge) < 10 && Math.random() < 0.3) return diamonds[0];
  if (spades.length > 0) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];
  if (oppHP < 15 && hearts.length > 0) return hearts[0];
  if (diamonds.length > 0) return diamonds[0];
  return playable[0];
}

function aiHard(playable) {
  const spades = playable.filter(c => c.suit === '♠');
  const diamonds = playable.filter(c => c.suit === '♦');
  const hearts = playable.filter(c => c.suit === '♥');
  const faceCards = playable.filter(c => isFaceCard(c));

  // Royal Combo pursuit: if we have 2+ face cards in royal progress, try to complete
  if (oppRoyalProgress.length >= 1 && oppRoyalProgress.length < 3) {
    const needed = FACE_VALUES.filter(v => !oppRoyalProgress.includes(v));
    const completionCard = faceCards.find(c => needed.includes(c.value));
    if (completionCard && oppRoyalProgress.length >= 2) {
      return completionCard; // Complete the combo!
    }
  }
  // Start royal combo if we have 2+ face cards in hand
  if (oppRoyalProgress.length === 0 && faceCards.length >= 2) {
    const uniqueFaces = [...new Set(faceCards.map(c => c.value))];
    if (uniqueFaces.length >= 2) {
      return faceCards[0]; // Start the sequence
    }
  }

  // Suit streak: actively pursue
  if (oppLastSuit && oppLastSuit !== '♣') {
    const samesuit = playable.filter(c => c.suit === oppLastSuit);
    if (samesuit.length > 0) {
      // Especially valuable for spades (double strike) and diamonds (power surge)
      if (oppLastSuit === '♠' && samesuit.length > 0) return samesuit.sort((a,b) => cardNum(b) - cardNum(a))[0];
      if (oppLastSuit === '♦' && samesuit.length > 0 && !oppPowerSurge) return samesuit.sort((a,b) => cardNum(b) - cardNum(a))[0];
      if (oppLastSuit === '♥' && oppHP < 20 && samesuit.length > 0) return samesuit.sort((a,b) => cardNum(b) - cardNum(a))[0];
    }
  }

  // Life steal: Ace of Spades when opponent is low
  const aceSpade = spades.find(c => c.value === 'A');
  if (aceSpade && playerHP <= 15) return aceSpade;

  // Preemptively guard when low HP
  if (oppHP < 10 && hearts.length > 0 && !oppPreparedGuard) {
    return hearts.sort((a,b) => cardNum(b) - cardNum(a))[0];
  }

  // Try breakpoint
  const bp = aiFindBreakpointCard(playable);
  if (bp) return bp;
  const bpStart = aiFindBreakpointStart(playable);
  if (bpStart) return bpStart;

  if (playerHand.length < 3 && spades.length > 0) {
    return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];
  }

  if (spades.length >= 2 && playerHand.length > 3) {
    const sorted = spades.sort((a,b) => cardNum(a) - cardNum(b));
    if (oppCharge.length > 0 && totalCharge(oppCharge) >= 8) return sorted[sorted.length - 1];
    return sorted[0];
  }

  if (spades.length > 0 && oppCharge.length > 0 && totalCharge(oppCharge) >= 8) {
    return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];
  }

  if (oppNoAttackTurns >= 1 && spades.length > 0) return spades[0];
  if (spades.length > 0) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];
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

function aiFindBreakpointStart(playable) {
  if (oppCombo.length > 0) return null;
  const seqVals = playable.map(c => cardSeq(c)).sort((a,b) => a - b);
  for (let i = 0; i < seqVals.length - 1; i++) {
    if (seqVals[i+1] === seqVals[i] + 1) {
      return playable.find(c => cardSeq(c) === seqVals[i]);
    }
  }
  return null;
}

function aiChooseResponse(dmg, guards, counters) {
  if (difficulty === 'easy') {
    if (Math.random() < 0.10 && guards.length > 0) return guards[0];
    return null;
  }

  if (difficulty === 'medium') {
    if (dmg >= 8 && counters.length > 0) {
      const valid = counters.filter(c => cardNum(c) > dmg);
      if (valid.length > 0) return valid[0];
    }
    if (dmg >= 6 && guards.length > 0) {
      return guards.sort((a,b) => cardNum(a) - cardNum(b)).find(c => cardNum(c) >= dmg) || guards[guards.length - 1];
    }
    if (oppHP < 12 && dmg >= 4 && guards.length > 0) return guards[0];
    return null;
  }

  // Hard
  if (counters.length > 0 && dmg >= 6) {
    const valid = counters.filter(c => cardNum(c) > dmg);
    if (valid.length > 0) return valid.sort((a,b) => cardNum(a) - cardNum(b))[0];
  }
  if (guards.length > 0 && dmg >= 4) {
    const sorted = guards.sort((a,b) => cardNum(a) - cardNum(b));
    return sorted.find(c => cardNum(c) >= dmg) || (dmg >= 7 ? sorted[sorted.length-1] : null);
  }
  if (oppHP <= dmg && guards.length > 0) return guards[0];
  if (oppHP <= dmg && counters.length > 0) return counters[0];
  return null;
}

function aiWantsCharge(attackVal) {
  if (difficulty === 'easy') return Math.random() < 0.2;
  if (difficulty === 'medium') return totalCharge(oppCharge) >= 8;
  return attackVal + totalCharge(oppCharge) >= 12;
}

function aiBreakpointChoice() {
  if (difficulty === 'easy') return ['damage','draw','steal'][Math.floor(Math.random()*3)];
  if (difficulty === 'medium') {
    if (oppHand.length <= 2) return 'draw';
    if (playerCharge.length > 0) return 'steal';
    return 'damage';
  }
  if (playerCharge.length > 0 && totalCharge(playerCharge) >= 6) return 'steal';
  if (oppHand.length <= 2) return 'draw';
  return 'damage';
}

})();
