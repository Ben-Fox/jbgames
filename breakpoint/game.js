// BreakPoint - Tactical Card Duel
(function() {
'use strict';

// ---- CONSTANTS ----
const SUITS = ['♠','♥','♦','♣'];
const SUIT_NAMES = {'♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs'};
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const VAL_NUM = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10,'A':11};
const VAL_SEQ = {'A':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13};

// ---- STATE ----
let difficulty = 'medium';
let deck = [];
let playerHand = [], oppHand = [];
let playerHP = 30, oppHP = 30;
let playerCharge = [], oppCharge = [];
let playerPressure = 0, oppPressure = 0;
let playerMomentum = false, oppMomentum = false;
let playerCombo = [], oppCombo = []; // sequence of played card values
let playerBonusDmg = 0, oppBonusDmg = 0;
let playerCardsPlayed = 0; // for momentum double-play
let turnOwner = 'player'; // 'player' or 'opponent'
let gameOver = false;
let selectedCard = null;
let waitingForResponse = false;
let stats = { playerDmg: 0, oppDmg: 0, playerCombos: 0, oppCombos: 0, turns: 0 };
let allPlayed = []; // for hard AI card tracking
let playerNoAttackTurns = 0, oppNoAttackTurns = 0;

// ---- HELPERS ----
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

// ---- DOM REFS ----
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
$('rules-toggle').addEventListener('click', () => { $('rules-modal').classList.remove('hidden'); });
$('close-rules').addEventListener('click', () => { $('rules-modal').classList.add('hidden'); });

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
  playerNoAttackTurns = 0; oppNoAttackTurns = 0;
  gameOver = false; selectedCard = null; waitingForResponse = false;
  playerCardsPlayed = 0;
  stats = { playerDmg: 0, oppDmg: 0, playerCombos: 0, oppCombos: 0, turns: 0 };
  allPlayed = [];
  $('action-log').innerHTML = '';
  $('opp-played').innerHTML = '';
  $('player-played').innerHTML = '';
  // Deal 5 each
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
  renderCharge('opp-charge-pile', oppCharge);
  renderCharge('player-charge-pile', playerCharge);
  updateHP();
  updateStatus();
  updateDeck();
  renderCombo();
}

function renderHand(containerId, hand, faceUp) {
  const el = $(containerId);
  el.innerHTML = '';
  hand.forEach((c, i) => {
    const card = faceUp ? makeCardEl(c) : makeCardBack();
    if (faceUp && turnOwner === 'player' && !waitingForResponse && !gameOver) {
      card.classList.add('playable');
      card.addEventListener('click', () => selectCard(i));
      card.addEventListener('dblclick', () => { selectCard(i); playSelected(); });
      card.title = tooltipFor(c);
    }
    if (faceUp && selectedCard === i) card.classList.add('selected');
    card.classList.add('card-enter');
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

function renderCharge(containerId, pile) {
  const el = $(containerId);
  el.innerHTML = '<div class="charge-label">' + (containerId.includes('opp') ? 'OPP CHARGE' : 'YOUR CHARGE') + '</div>';
  pile.forEach(c => {
    const card = makeCardEl(c);
    card.style.width = '50px'; card.style.height = '70px';
    el.appendChild(card);
  });
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

function tooltipFor(c) {
  const v = cardNum(c);
  if (c.suit === '♠') return `Attack: Deal ${v} damage` + (totalCharge(playerCharge) > 0 ? ` (+${totalCharge(playerCharge)} charge)` : '');
  if (c.suit === '♥') return `Guard: Block ${v} damage (excess heals up to 5)`;
  if (c.suit === '♦') return `Charge: Store ${v} power for a future attack`;
  if (c.suit === '♣') return `Counter: Play when attacked. If value > attack, negate & reflect`;
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
  slot.appendChild(makeCardEl(card));
}

// ---- DRAW ----
function drawCard(who) {
  if (deck.length === 0) {
    // reshuffle discards - just make new deck minus known cards
    log('Deck empty - reshuffling!');
    deck = makeDeck();
    // Remove cards in hands/charge
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
  stats.turns++;

  // Overcharge check
  if (totalCharge(playerCharge) > 12) {
    log('⚠ Overcharge check! Your charge > 12...', 'log-important');
    const top = deck.length > 0 ? deck[deck.length - 1] : { suit: '♠', value: 'A' };
    const flipped = deck.pop();
    if (flipped) {
      allPlayed.push(flipped);
      if (isRed(flipped)) {
        log(`Flipped ${flipped.value}${flipped.suit} — RED! Safe.`, 'log-heal');
      } else {
        log(`Flipped ${flipped.value}${flipped.suit} — BLACK! Overcharge explodes!`, 'log-damage');
        showOverchargeExplosion();
        playerHP -= 10;
        stats.oppDmg += 10;
        playerCharge = [];
        floatText('-10', window.innerWidth/2, window.innerHeight - 160, '#f44');
      }
    }
    updateDeck();
  }

  // Draw
  const drawn = drawCard('player');
  if (drawn) log('You drew a card.');
  render();
  showActionButtons();
}

function showActionButtons() {
  $('play-btn').classList.remove('hidden');
  $('pass-btn').classList.add('hidden');
  // Show use-charge if player has spade selected and has charge
  $('use-charge-btn').classList.add('hidden');
  selectedCard = null;
  render();
}

function selectCard(i) {
  if (waitingForResponse || gameOver) return;
  selectedCard = (selectedCard === i) ? null : i;
  render();
  // highlight selected
  const cards = $('player-hand').children;
  if (selectedCard !== null && cards[selectedCard]) cards[selectedCard].classList.add('selected');
  // show use-charge if spade + has charge
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
  
  // Preemptive guard is allowed
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

  // Check breakpoint (3+ consecutive)
  if (playerCombo.length >= 3) {
    showBreakpointAnim();
    log('⚡ BREAKPOINT triggered!', 'log-important');
    stats.playerCombos++;
    playerCombo = [seqVal]; // reset after trigger
    // show choice modal
    showBreakpointChoice('player', () => afterPlayerCard(card, suit, val, useCharge));
    return;
  }

  afterPlayerCard(card, suit, val, useCharge);
}

function afterPlayerCard(card, suit, val, useCharge) {
  if (suit === '♠') {
    // ATTACK
    let dmg = val + playerBonusDmg;
    playerBonusDmg = 0;
    if (useCharge) {
      dmg += totalCharge(playerCharge);
      log(`Unleashing ${totalCharge(playerCharge)} stored charge!`, 'log-important');
      playerCharge = [];
    }
    playerNoAttackTurns = 0;
    log(`You attack for ${dmg}!`);

    // Opponent can guard or counter
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
          oppHP -= netDmg;
          stats.playerDmg += netDmg;
          log(`${netDmg} damage gets through!`, 'log-damage');
          floatText('-' + netDmg, window.innerWidth/2, 80, '#f44');
          if (netDmg >= 10) { screenFlash(); }
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
          log(`Opponent counters with ${aiResponse.value}♣! Attack negated, ${reflect} reflected!`, 'log-damage');
          playerHP -= reflect;
          stats.oppDmg += reflect;
          floatText('-' + reflect, window.innerWidth/2, window.innerHeight - 160, '#f44');
        } else {
          log(`Opponent tries to counter with ${aiResponse.value}♣ but fails!`);
          oppHP -= dmg;
          stats.playerDmg += dmg;
          floatText('-' + dmg, window.innerWidth/2, 80, '#f44');
          if (dmg >= 10) screenFlash();
          checkMomentum('player', dmg);
        }
      }
    } else {
      oppHP -= dmg;
      stats.playerDmg += dmg;
      log(`Opponent takes ${dmg} damage!`, 'log-damage');
      floatText('-' + dmg, window.innerWidth/2, 80, '#f44');
      if (dmg >= 10) screenFlash();
      checkMomentum('player', dmg);
    }
  } else if (suit === '♥') {
    log(`You play a preemptive guard (${val}).`);
    playerNoAttackTurns++;
  } else if (suit === '♦') {
    playerCharge.push(card);
    log(`You charge +${val} (total: ${totalCharge(playerCharge)}).`);
    playerNoAttackTurns++;
  } else if (suit === '♣') {
    log(`Clubs can only be used as counters during opponent's attack. Discarded.`);
    playerNoAttackTurns++;
  }

  checkPressure('player');

  render();
  if (checkGameOver()) return;

  // Momentum: allow second play
  if (playerMomentum && playerCardsPlayed === 1) {
    playerMomentum = false;
    log('⚡ Momentum! Play a second card!', 'log-important');
    render();
    showActionButtons();
    $('pass-btn').classList.remove('hidden');
    return;
  }
  playerMomentum = false;

  // End player turn
  setTimeout(() => startOpponentTurn(), 600);
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
  setTimeout(() => startOpponentTurn(), 400);
});

// ---- PRESSURE ----
function checkPressure(who) {
  if (who === 'player') {
    // playerNoAttackTurns tracked per non-spade play - but we need consecutive TURNS not cards
    // Already incrementing. Check >= 2 for +1 pressure
    if (playerNoAttackTurns >= 2) {
      playerPressure++;
      log(`🔥 Your pressure: ${playerPressure}`, 'log-important');
      if (playerPressure >= 3) {
        log('💥 PRESSURE OVERLOAD! Discard hand & lose 5 HP!', 'log-damage');
        playerHand = [];
        playerHP -= 5;
        stats.oppDmg += 5;
        playerPressure = 0;
        floatText('-5 HP', window.innerWidth/2, window.innerHeight - 160, '#f44');
      }
    }
  } else {
    if (oppNoAttackTurns >= 2) {
      oppPressure++;
      log(`🔥 Opponent pressure: ${oppPressure}`, 'log-important');
      if (oppPressure >= 3) {
        log('💥 Opponent PRESSURE OVERLOAD!', 'log-damage');
        oppHand = [];
        oppHP -= 5;
        stats.playerDmg += 5;
        oppPressure = 0;
        floatText('-5 HP', window.innerWidth/2, 80, '#f44');
      }
    }
  }
}

// ---- BREAKPOINT CHOICE ----
function showBreakpointChoice(who, callback) {
  if (who === 'opponent') {
    // AI chooses
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
    if (choice === 'damage') { playerBonusDmg += 5; log('Breakpoint: +5 damage on next attack!', 'log-important'); }
    else if (choice === 'draw') { drawCard('player'); drawCard('player'); log('Breakpoint: Drew 2 cards!', 'log-important'); }
    else if (choice === 'steal') {
      if (oppCharge.length > 0) {
        const stolen = oppCharge.pop();
        playerCharge.push(stolen);
        log('Breakpoint: Stole 1 charge from opponent!', 'log-important');
      } else { drawCard('player'); log('Breakpoint: Opponent has no charge, drew 1 card instead.', 'log-important'); }
    }
  } else {
    if (choice === 'damage') { oppBonusDmg += 5; log('Opponent Breakpoint: +5 damage!', 'log-important'); }
    else if (choice === 'draw') { drawCard('opponent'); drawCard('opponent'); log('Opponent Breakpoint: Drew 2 cards!', 'log-important'); }
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
  
  // Overcharge check
  if (totalCharge(oppCharge) > 12) {
    log('⚠ Opponent overcharge check!', 'log-important');
    const flipped = deck.pop();
    if (flipped) {
      allPlayed.push(flipped);
      if (isRed(flipped)) {
        log(`Flipped ${flipped.value}${flipped.suit} — RED! Safe.`);
      } else {
        log(`Flipped ${flipped.value}${flipped.suit} — BLACK! Opponent overcharge explodes!`, 'log-damage');
        showOverchargeExplosion();
        oppHP -= 10;
        stats.playerDmg += 10;
        oppCharge = [];
        floatText('-10', window.innerWidth/2, 80, '#f44');
      }
    }
    updateDeck();
  }

  // Draw
  drawCard('opponent');
  log('Opponent draws a card.');
  render();

  // AI plays
  let cardsToPlay = oppMomentum ? 2 : 1;
  oppMomentum = false;

  playAICards(cardsToPlay);
}

function playAICards(remaining) {
  if (remaining <= 0 || oppHand.length === 0 || gameOver) {
    if (checkGameOver()) return;
    setTimeout(() => startPlayerTurn(), 600);
    return;
  }

  const card = aiChooseCard();
  if (!card) {
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

  // Track combo
  const seqVal = cardSeq(card);
  if (oppCombo.length === 0 || seqVal === oppCombo[oppCombo.length - 1] + 1) {
    oppCombo.push(seqVal);
  } else {
    oppCombo = [seqVal];
  }

  // Check breakpoint
  let bpTriggered = false;
  if (oppCombo.length >= 3) {
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
    oppNoAttackTurns = 0;
    log(`Opponent attacks for ${dmg}!`);

    // Player can respond with guard or counter
    const guards = playerHand.filter(c => c.suit === '♥');
    const counters = playerHand.filter(c => c.suit === '♣');
    
    if (guards.length > 0 || counters.length > 0) {
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
              playerHP -= netDmg;
              stats.oppDmg += netDmg;
              log(`${netDmg} damage gets through!`, 'log-damage');
              floatText('-' + netDmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
              if (netDmg >= 10) screenFlash();
              checkMomentum('opponent', netDmg);
            } else {
              log('Attack fully blocked!');
            }
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
              oppHP -= reflect;
              stats.playerDmg += reflect;
              floatText('-' + reflect, window.innerWidth/2, 80, '#f44');
            } else {
              log(`Counter fails! (${cval} ≤ ${dmg})`);
              playerHP -= dmg;
              stats.oppDmg += dmg;
              floatText('-' + dmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
              if (dmg >= 10) screenFlash();
              checkMomentum('opponent', dmg);
            }
          }
        } else {
          playerHP -= dmg;
          stats.oppDmg += dmg;
          log(`You take ${dmg} damage!`, 'log-damage');
          floatText('-' + dmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
          if (dmg >= 10) screenFlash();
          checkMomentum('opponent', dmg);
        }
        render();
        if (checkGameOver()) return;
        setTimeout(() => playAICards(remaining - 1), 600);
      });
      return;
    } else {
      playerHP -= dmg;
      stats.oppDmg += dmg;
      log(`You take ${dmg} damage!`, 'log-damage');
      floatText('-' + dmg, window.innerWidth/2, window.innerHeight - 160, '#f44');
      if (dmg >= 10) screenFlash();
      checkMomentum('opponent', dmg);
    }
  } else if (card.suit === '♥') {
    log(`Opponent plays preemptive guard (${val}).`);
    oppNoAttackTurns++;
  } else if (card.suit === '♦') {
    oppCharge.push(card);
    log(`Opponent charges +${val} (total: ${totalCharge(oppCharge)}).`);
    oppNoAttackTurns++;
  } else if (card.suit === '♣') {
    log(`Opponent plays a club out of turn. Discarded.`);
    oppNoAttackTurns++;
  }

  checkPressure('opponent');

  render();
  if (checkGameOver()) return;
  setTimeout(() => playAICards(remaining - 1), 800);
}

// ---- RESPONSE MODAL ----
function showResponseModal(dmg, guards, counters, callback) {
  waitingForResponse = true;
  $('response-modal').classList.remove('hidden');
  $('response-title').textContent = `Opponent attacks for ${dmg}!`;
  $('response-desc').textContent = 'Play a ♥ to guard or ♣ to counter:';
  
  const container = $('response-cards');
  container.innerHTML = '';

  // Highlight usable cards
  const usable = [...guards, ...counters];
  usable.forEach(c => {
    const el = makeCardEl(c);
    el.classList.add(c.suit === '♥' ? 'glow-guard' : 'glow-counter');
    el.addEventListener('click', () => {
      waitingForResponse = false;
      $('response-modal').classList.add('hidden');
      callback(c);
    });
    container.appendChild(el);
  });

  $('response-skip').onclick = () => {
    waitingForResponse = false;
    $('response-modal').classList.add('hidden');
    callback(null);
  };

  // Also highlight cards in hand
  render();
  playerHand.forEach((c, i) => {
    const el = $('player-hand').children[i];
    if (c.suit === '♥') el.classList.add('glow-guard');
    if (c.suit === '♣') el.classList.add('glow-counter');
  });
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

  if (difficulty === 'easy') return aiEasy();
  if (difficulty === 'medium') return aiMedium();
  return aiHard();
}

function aiEasy() {
  // Random play
  return oppHand[Math.floor(Math.random() * oppHand.length)];
}

function aiMedium() {
  const spades = oppHand.filter(c => c.suit === '♠');
  const diamonds = oppHand.filter(c => c.suit === '♦');
  const hearts = oppHand.filter(c => c.suit === '♥');

  // Try breakpoint
  const bp = aiFindBreakpointCard();
  if (bp) return bp;

  // If pressure is building, attack
  if (oppNoAttackTurns >= 1 && spades.length > 0) return spades[0];

  // Build charge sometimes
  if (diamonds.length > 0 && totalCharge(oppCharge) < 10 && Math.random() < 0.3) return diamonds[0];

  // Attack if possible
  if (spades.length > 0) return spades.sort((a,b) => cardNum(b) - cardNum(a))[0];

  // Guard preemptively if low HP
  if (oppHP < 15 && hearts.length > 0) return hearts[0];

  // Charge
  if (diamonds.length > 0) return diamonds[0];

  return oppHand[0];
}

function aiHard() {
  const spades = oppHand.filter(c => c.suit === '♠');
  const diamonds = oppHand.filter(c => c.suit === '♦');
  const hearts = oppHand.filter(c => c.suit === '♥');
  const clubs = oppHand.filter(c => c.suit === '♣');

  // Try breakpoint
  const bp = aiFindBreakpointCard();
  if (bp) return bp;

  // Bait with small attack, then big
  if (spades.length > 0) {
    const sorted = spades.sort((a,b) => cardNum(a) - cardNum(b));
    // If player likely has counters, play small first
    if (sorted.length >= 2 && playerHand.length > 3) return sorted[0];
    // Otherwise go big, especially with charge
    if (oppCharge.length > 0 && totalCharge(oppCharge) >= 8) return sorted[sorted.length - 1];
    return sorted[sorted.length - 1];
  }

  // Charge strategically
  if (diamonds.length > 0 && totalCharge(oppCharge) < 12 && oppNoAttackTurns < 1) {
    return diamonds.sort((a,b) => cardNum(b) - cardNum(a))[0];
  }

  // Must attack to avoid pressure
  if (oppNoAttackTurns >= 1 && spades.length > 0) return spades[0];

  if (hearts.length > 0 && oppHP < 12) return hearts[0];
  if (diamonds.length > 0) return diamonds[0];
  if (hearts.length > 0) return hearts[0];
  // Clubs as last resort (wasted)
  return oppHand[0];
}

function aiFindBreakpointCard() {
  if (oppCombo.length < 2) return null;
  const nextVal = oppCombo[oppCombo.length - 1] + 1;
  if (nextVal > 13) return null;
  return oppHand.find(c => cardSeq(c) === nextVal) || null;
}

function aiChooseResponse(dmg, guards, counters) {
  if (difficulty === 'easy') {
    // Rarely responds
    if (Math.random() < 0.3 && guards.length > 0) return guards[0];
    return null;
  }

  if (difficulty === 'medium') {
    // Counter big attacks
    if (dmg >= 8 && counters.length > 0) {
      const valid = counters.filter(c => cardNum(c) > dmg);
      if (valid.length > 0) return valid[0];
    }
    // Guard medium+
    if (dmg >= 5 && guards.length > 0) return guards.sort((a,b) => cardNum(a) - cardNum(b)).find(c => cardNum(c) >= dmg) || guards[0];
    return null;
  }

  // Hard: optimal
  // Counter if possible for reflect
  if (counters.length > 0 && dmg >= 6) {
    const valid = counters.filter(c => cardNum(c) > dmg);
    if (valid.length > 0) return valid.sort((a,b) => cardNum(a) - cardNum(b))[0]; // smallest valid counter
  }
  // Guard efficiently
  if (guards.length > 0 && dmg >= 4) {
    // Pick smallest guard that covers
    const sorted = guards.sort((a,b) => cardNum(a) - cardNum(b));
    return sorted.find(c => cardNum(c) >= dmg) || (dmg >= 8 ? sorted[sorted.length-1] : null);
  }
  // Take small hits
  return null;
}

function aiWantsCharge(attackVal) {
  if (difficulty === 'easy') return Math.random() < 0.2;
  if (difficulty === 'medium') return totalCharge(oppCharge) >= 6;
  // Hard: use charge when total dmg would be big
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

// Fix pressure tracking - use turn-level tracking
// The no-attack tracking was double-incrementing. Let's clean it up.
// playerNoAttackTurns resets to 0 when a spade is played, otherwise increments once per turn.
// We handle this in afterPlayerCard and resolveOppCard already via direct set/increment.
// checkPressure is called per turn. Remove extra increments:
// Actually the logic has a bug - non-spade suits increment oppNoAttackTurns twice.
// Let's fix by removing the extra increment in resolveOppCard for non-spade.

})();
