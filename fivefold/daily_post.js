#!/usr/bin/env node
// Generates today's Fivefold daily puzzle summary for Discord.
// Usage: node daily_post.js

const fs = require('fs');
const path = require('path');

// Read and eval the puzzle data from index.html
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Extract the JS between the first <script> and its close
const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.error('No script found'); process.exit(1); }

// We need the pool data. Let's extract it more carefully.
function extractArray(varName) {
  const idx = html.indexOf(`const ${varName} = [`);
  if (idx === -1) return null;
  let depth = 0, start = html.indexOf('[', idx);
  for (let i = start; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) return html.substring(start, i + 1); }
  }
  return null;
}

// getDayIndex logic from the game
const GAME_OFFSETS = { cipher: 0, chronicle: 7, wavelength: 13, mimic: 23 };

function getDayIndex(poolSize, gameOffset) {
  const epoch = new Date("2024-01-01");
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.floor((now - epoch) / msPerDay);
  return (days + (gameOffset || 0)) % poolSize;
}

// Eval the pools (they're JS object literals)
let CIPHER_POOL, CHRONICLE_POOL, WAVELENGTH_CATEGORIES, MIMIC_POOL;
try {
  CIPHER_POOL = eval(extractArray('CIPHER_POOL'));
  CHRONICLE_POOL = eval(extractArray('CHRONICLE_POOL'));
  WAVELENGTH_CATEGORIES = eval(extractArray('WAVELENGTH_CATEGORIES'));
  MIMIC_POOL = eval(extractArray('MIMIC_POOL'));
} catch(e) { console.error('Failed to parse pools:', e.message); process.exit(1); }

// Today's date label
const today = new Date();
const dayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Denver' });

// Cipher
const cipherIdx = getDayIndex(CIPHER_POOL.length, GAME_OFFSETS.cipher);
const cipher = CIPHER_POOL[cipherIdx];

// Chronicle
const chronIdx = getDayIndex(CHRONICLE_POOL.length, GAME_OFFSETS.chronicle);
const chronicle = CHRONICLE_POOL[chronIdx];
const chronEvents = [...chronicle.events].sort(() => Math.random() - 0.5); // shuffle for display

// Wavelength
const wlCatIdx = getDayIndex(WAVELENGTH_CATEGORIES.length, GAME_OFFSETS.wavelength);
const wlCat = WAVELENGTH_CATEGORIES[wlCatIdx];
const wlPuzzleIdx = getDayIndex(wlCat.puzzles.length, GAME_OFFSETS.wavelength + 100);
const wlPuzzle = wlCat.puzzles[wlPuzzleIdx];

// Mimic
const mimicIdx = getDayIndex(MIMIC_POOL.length, GAME_OFFSETS.mimic);
const mimic = MIMIC_POOL[mimicIdx];
const mimicWords = mimic.rounds.map(r => r.word);

// Build message
const categoryEmojis = {
  "Electromagnetic Wavelength": "📡",
  "Energy": "⚡",
  "Force": "💪",
  "Speed": "🏎️",
  "Temperature": "🌡️",
  "Frequency": "🎵",
  "Mass": "⚖️",
  "Pressure": "🫧",
  "Distance": "📏",
};

let msg = `🧩 **Daily Puzzles — ${dayLabel}**\n\n`;

msg += `🔐 **Cipher**\n`;
msg += `*"${cipher.plain}"* — ${cipher.author}\n`;
msg += `Crack the substitution cipher to reveal this quote!\n\n`;

msg += `📜 **Chronicle**\n`;
msg += `Put these 5 events in chronological order:\n`;
for (const e of chronEvents) {
  msg += `• ${e.text}\n`;
}
msg += `\n`;

const catEmoji = categoryEmojis[wlCat.name] || "🔬";
msg += `${catEmoji} **Wavelength — ${wlCat.name}**\n`;
msg += `Place these on the ${wlCat.name.toLowerCase()} scale (${wlCat.scaleLabel.left} → ${wlCat.scaleLabel.right}):\n`;
for (const r of wlPuzzle.rounds) {
  msg += `• ${r.item}\n`;
}
msg += `\n`;

msg += `🪞 **Mimic**\n`;
msg += `Today's 5 mystery words: ${mimicWords.join(' · ')}\n`;
msg += `Use the progressive clues to guess each one!\n\n`;

msg += `▶️ Play now: <https://brainsmacks.com/fivefold/>`;

console.log(msg);
