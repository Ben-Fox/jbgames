/**
 * Generate OG images (1200x630) for each published game + landing page.
 * Uses @napi-rs/canvas for PNG generation.
 * Run: node generate-og-images.js
 */
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBranding(ctx) {
  // BrainSmacks branding bottom-right
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('brainsmacks.com', W - 40, H - 30);
}

function drawGradientBg(ctx, colors) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ── LANDING PAGE ──
function generateLanding() {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  drawGradientBg(ctx, ['#0a0a0f', '#12121a', '#1a1a2e']);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(139,92,246,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff69b4';
  ctx.font = 'bold 80px sans-serif';
  ctx.fillText('Brain', W/2 - 120, 260);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Smacks', W/2 + 130, 260);

  // Tagline
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '28px sans-serif';
  ctx.fillText('Games that hit different', W/2, 320);

  // Game icons row
  const games = ['⚖️', '✏️', '🃏', '🎲', '🔗'];
  const startX = W/2 - (games.length * 70) / 2;
  games.forEach((emoji, i) => {
    const x = startX + i * 80 + 30;
    ctx.fillStyle = 'rgba(139,92,246,0.15)';
    roundRect(ctx, x - 28, 380, 56, 56, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139,92,246,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, x, 418);
  });

  // Free to play badge
  ctx.fillStyle = 'rgba(139,92,246,0.2)';
  roundRect(ctx, W/2 - 100, 470, 200, 36, 18);
  ctx.fill();
  ctx.fillStyle = 'rgba(167,139,250,0.9)';
  ctx.font = '14px sans-serif';
  ctx.fillText('FREE BROWSER GAMES', W/2, 494);

  drawBranding(ctx);
  return c.toBuffer('image/png');
}

// ── HEAVY EYE ──
function generateHeavyEye() {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  drawGradientBg(ctx, ['#1a1508', '#2d1f04', '#3d2906']);

  // Scale illustration
  const cx = W/2, baseY = 420;
  // Pole
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.lineTo(cx, 180); ctx.stroke();
  // Base
  ctx.fillStyle = '#d97706';
  roundRect(ctx, cx - 60, baseY, 120, 16, 8); ctx.fill();
  // Pivot
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(cx, 180, 16, 0, Math.PI * 2); ctx.fill();
  // Beam (tilted)
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 6;
  ctx.save(); ctx.translate(cx, 180); ctx.rotate(-0.15);
  ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(200, 0); ctx.stroke();
  // Left pan (lower)
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(-220, 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(-180, 100); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-200, 105, 45, 14, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(245,158,11,0.3)'; ctx.fill(); ctx.stroke();
  // Right pan (higher)
  ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(180, 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(220, 100); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(200, 105, 45, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Question mark on right
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('?', 200, 95);
  ctx.restore();

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText('Heavy Eye', W/2, 100);
  ctx.fillStyle = 'rgba(251,191,36,0.5)';
  ctx.font = '26px sans-serif';
  ctx.fillText('Can you guess the weight?', W/2, 145);

  drawBranding(ctx);
  return c.toBuffer('image/png');
}

// ── CIRCLE ──
function generateCircle() {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  drawGradientBg(ctx, ['#0f1115', '#1a1c24', '#22252e']);

  // Chalkboard texture effect
  ctx.fillStyle = '#2d3748';
  roundRect(ctx, 80, 80, W - 160, H - 160, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(226,232,240,0.15)'; ctx.lineWidth = 3;
  roundRect(ctx, 80, 80, W - 160, H - 160, 16); ctx.stroke();

  // Target circle (dashed)
  ctx.setLineDash([12, 8]);
  ctx.strokeStyle = 'rgba(226,232,240,0.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(W/2, H/2 + 20, 160, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);

  // Hand-drawn circle (imperfect)
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2.1; a += 0.05) {
    const r = 160 + Math.sin(a * 3) * 8 + Math.cos(a * 7) * 5;
    const x = W/2 + Math.cos(a) * r;
    const y = H/2 + 20 + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Score
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('92%', W/2, H/2 + 30);
  ctx.fillStyle = 'rgba(226,232,240,0.4)'; ctx.font = '20px sans-serif';
  ctx.fillText('How perfect is your circle?', W/2, H/2 + 65);

  // Title
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 64px sans-serif';
  ctx.fillText('Circle', W/2, 130);

  drawBranding(ctx);
  return c.toBuffer('image/png');
}

// ── BREAKPOINT ──
function generateBreakpoint() {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  drawGradientBg(ctx, ['#1a0808', '#2d0f0f', '#3d1515']);

  // Cards
  function drawCard(x, y, w, h, value, suit, faceUp) {
    ctx.fillStyle = faceUp ? '#1a1a2e' : '#2a1a1a';
    roundRect(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = faceUp ? '#ef4444' : '#666'; ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 12); ctx.stroke();
    ctx.textAlign = 'center';
    if (faceUp) {
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 42px sans-serif';
      ctx.fillText(value, x + w/2, y + h/2 - 10);
      ctx.font = '36px sans-serif';
      ctx.fillText(suit, x + w/2, y + h/2 + 35);
    } else {
      ctx.fillStyle = '#555'; ctx.font = 'bold 52px sans-serif';
      ctx.fillText('?', x + w/2, y + h/2 + 15);
    }
  }

  // Player cards
  drawCard(200, 180, 140, 200, 'A', '♠', true);
  drawCard(360, 180, 140, 200, 'K', '♥', true);
  // VS
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('VS', W/2, H/2 + 15);
  // Opponent cards
  drawCard(700, 180, 140, 200, '?', '', false);
  drawCard(860, 180, 140, 200, '?', '', false);

  // Title
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 64px sans-serif';
  ctx.fillText('BreakPoint', W/2, 120);
  ctx.fillStyle = 'rgba(239,68,68,0.5)'; ctx.font = '24px sans-serif';
  ctx.fillText('Tactical card duel vs AI', W/2, 160);

  // Health bars
  ctx.fillStyle = 'rgba(239,68,68,0.2)';
  roundRect(ctx, 200, 430, 300, 16, 8); ctx.fill();
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, 200, 430, 240, 16, 8); ctx.fill();
  ctx.fillStyle = 'rgba(100,100,100,0.3)';
  roundRect(ctx, 700, 430, 300, 16, 8); ctx.fill();
  ctx.fillStyle = '#666';
  roundRect(ctx, 700, 430, 180, 16, 8); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '14px sans-serif';
  ctx.textAlign = 'left'; ctx.fillText('YOU', 200, 465);
  ctx.textAlign = 'right'; ctx.fillText('AI', 1000, 465);

  drawBranding(ctx);
  return c.toBuffer('image/png');
}

// ── LIKELIHOOD ──
function generateLikelihood() {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  drawGradientBg(ctx, ['#0f0a1a', '#1a1128', '#251838']);

  // Big % symbol
  ctx.fillStyle = 'rgba(167,139,250,0.1)';
  ctx.font = 'bold 300px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('%', W/2 + 100, 420);

  // Bar chart
  const bars = [
    { h: 180, opacity: 0.5 },
    { h: 260, opacity: 0.6 },
    { h: 340, opacity: 0.8 },
    { h: 200, opacity: 0.55 },
    { h: 140, opacity: 0.45 },
    { h: 290, opacity: 0.7 },
    { h: 220, opacity: 0.6 },
  ];
  const barW = 60, gap = 16, startX = 160;
  bars.forEach((b, i) => {
    const x = startX + i * (barW + gap);
    const y = H - 80 - b.h;
    ctx.fillStyle = `rgba(167,139,250,${b.opacity})`;
    roundRect(ctx, x, y, barW, b.h, 6); ctx.fill();
  });

  // Title
  ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Likelihood', W/2, 100);
  ctx.fillStyle = 'rgba(167,139,250,0.5)'; ctx.font = '24px sans-serif';
  ctx.fillText('How well do you know the odds?', W/2, 145);

  drawBranding(ctx);
  return c.toBuffer('image/png');
}

// ── FIVEFOLD ──
function generateFivefold() {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  drawGradientBg(ctx, ['#f5f0e8', '#ede8db', '#e4ddd0']);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1a1814';
  ctx.font = 'bold 80px serif';
  ctx.fillText('Five', W/2 - 90, 180);
  ctx.fillStyle = '#b8860b';
  ctx.fillText('fold', W/2 + 90, 180);

  // Tagline
  ctx.fillStyle = '#8a7f70';
  ctx.font = '22px monospace';
  ctx.fillText('FIVE GAMES · ONE WEEK · INFINITE CURIOSITY', W/2, 230);

  // Game cards row
  const games = [
    { name: 'Nexus', emoji: '🔗', color: '#b8860b' },
    { name: 'Cipher', emoji: '🔐', color: '#4a6741' },
    { name: 'Chronicle', emoji: '📜', color: '#3d4f5c' },
    { name: 'Wavelength', emoji: '🌊', color: '#8b3a2a' },
    { name: 'Mimic', emoji: '🪞', color: '#6b3a7d' },
  ];
  const cardW = 160, cardH = 200, cardGap = 20;
  const totalW = games.length * cardW + (games.length - 1) * cardGap;
  const sx = (W - totalW) / 2;

  games.forEach((g, i) => {
    const x = sx + i * (cardW + cardGap);
    const y = 280;
    // Card bg
    ctx.fillStyle = '#ede8db';
    roundRect(ctx, x, y, cardW, cardH, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(26,24,20,0.15)'; ctx.lineWidth = 1;
    roundRect(ctx, x, y, cardW, cardH, 8); ctx.stroke();
    // Top accent bar
    ctx.fillStyle = g.color;
    ctx.fillRect(x, y, cardW, 4);
    // Emoji
    ctx.font = '40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(g.emoji, x + cardW/2, y + 80);
    // Name
    ctx.fillStyle = '#1a1814'; ctx.font = 'bold 22px serif';
    ctx.fillText(g.name, x + cardW/2, y + 130);
    // Type label
    ctx.fillStyle = '#8a7f70'; ctx.font = '11px monospace';
    ctx.fillText('WEEKLY', x + cardW/2, y + 160);
  });

  drawBranding(ctx);
  return c.toBuffer('image/png');
}

// ── GENERATE ALL ──
const images = {
  'og-image.png': generateLanding,
  'heavyeye/og-image.png': generateHeavyEye,
  'circle/og-image.png': generateCircle,
  'breakpoint/og-image.png': generateBreakpoint,
  'likelihood/og-image.png': generateLikelihood,
  'fivefold/og-image.png': generateFivefold,
};

for (const [filePath, generator] of Object.entries(images)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const buf = generator();
  fs.writeFileSync(fullPath, buf);
  const kb = Math.round(buf.length / 1024);
  console.log(`✅ ${filePath} (${kb} KB)`);
}

console.log('\nDone! Add og:image meta tags to each page.');
