// audio.js — Web Audio API synthesized sounds
const Audio = (() => {
  let ctx;
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function ensure() { if (!ctx) init(); if (ctx.state === 'suspended') ctx.resume(); }
  
  function playTone(freq, dur, type = 'square', vol = 0.15, detune = 0) {
    ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }
  
  function noise(dur, vol = 0.1) {
    ensure();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * vol;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }
  
  return {
    init,
    hit() { playTone(200, 0.1, 'sawtooth', 0.12); noise(0.05, 0.08); },
    swing() { playTone(300, 0.08, 'triangle', 0.06); },
    enemyDie() { playTone(150, 0.2, 'sawtooth', 0.1); playTone(100, 0.3, 'square', 0.08); },
    playerHit() { playTone(100, 0.15, 'square', 0.15); noise(0.1, 0.1); },
    build() { playTone(440, 0.1, 'triangle', 0.1); playTone(550, 0.1, 'triangle', 0.08); },
    craft() { playTone(523, 0.08, 'sine', 0.1); playTone(659, 0.08, 'sine', 0.1); playTone(784, 0.15, 'sine', 0.12); },
    pickup() { playTone(600, 0.08, 'sine', 0.1); playTone(800, 0.1, 'sine', 0.1); },
    dusk() { playTone(220, 0.5, 'sine', 0.15); playTone(165, 0.8, 'sine', 0.12); },
    dawn() { playTone(440, 0.3, 'sine', 0.15); playTone(550, 0.3, 'sine', 0.12); playTone(660, 0.4, 'sine', 0.1); },
    dodge() { noise(0.1, 0.06); playTone(400, 0.06, 'triangle', 0.05); },
    shoot() { playTone(500, 0.06, 'sawtooth', 0.08); noise(0.04, 0.06); },
    bossCry() { playTone(80, 0.6, 'sawtooth', 0.2); playTone(60, 0.8, 'square', 0.15); },
    error() { playTone(100, 0.15, 'square', 0.1); },
    victory() {
      [523,659,784,1047].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 'sine', 0.12), i * 150);
      });
    },
    gameOver() {
      [300,250,200,150].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.4, 'sawtooth', 0.1), i * 200);
      });
    },
    repair() { playTone(350, 0.08, 'triangle', 0.08); playTone(440, 0.08, 'triangle', 0.06); },
    potion() { playTone(600, 0.1, 'sine', 0.1); playTone(700, 0.15, 'sine', 0.08); }
  };
})();
