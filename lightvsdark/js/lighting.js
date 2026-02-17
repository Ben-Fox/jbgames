// lighting.js — Day/night cycle, light sources, darkness rendering
const Lighting = (() => {
  let dayTime = 0; // 0-1 within current phase
  let phase = 'day'; // day, dusk, night, dawn
  let nightCount = 0;
  let cycleTime = 0;
  let nightAmount = 0; // 0=day, 1=full night
  
  // Durations in seconds
  const DAY_DUR = 75;
  const DUSK_DUR = 8;
  const NIGHT_DUR = 50;
  const DAWN_DUR = 5;
  const TOTAL = DAY_DUR + DUSK_DUR + NIGHT_DUR + DAWN_DUR;
  
  let duskPlayed = false;
  let dawnPlayed = false;
  let stars = [];
  
  function init() {
    cycleTime = 0;
    phase = 'day';
    nightCount = 0;
    nightAmount = 0;
    duskPlayed = false;
    dawnPlayed = false;
    stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({ x: Math.random(), y: Math.random(), size: Math.random() * 2 + 0.5, twinkle: Math.random() * Math.PI * 2 });
    }
  }
  
  function update(dt) {
    cycleTime += dt;
    
    if (cycleTime < DAY_DUR) {
      phase = 'day';
      dayTime = cycleTime / DAY_DUR;
      nightAmount = 0;
      duskPlayed = false;
    } else if (cycleTime < DAY_DUR + DUSK_DUR) {
      phase = 'dusk';
      dayTime = (cycleTime - DAY_DUR) / DUSK_DUR;
      nightAmount = dayTime;
      if (!duskPlayed) { duskPlayed = true; Audio.dusk(); }
    } else if (cycleTime < DAY_DUR + DUSK_DUR + NIGHT_DUR) {
      phase = 'night';
      dayTime = (cycleTime - DAY_DUR - DUSK_DUR) / NIGHT_DUR;
      nightAmount = 1;
      dawnPlayed = false;
    } else if (cycleTime < TOTAL) {
      phase = 'dawn';
      dayTime = (cycleTime - DAY_DUR - DUSK_DUR - NIGHT_DUR) / DAWN_DUR;
      nightAmount = 1 - dayTime;
      if (!dawnPlayed) { dawnPlayed = true; Audio.dawn(); nightCount++; }
    } else {
      cycleTime = 0;
      phase = 'day';
      nightAmount = 0;
    }
  }
  
  function getNightTimeRemaining() {
    if (phase === 'night') {
      return Math.ceil((DAY_DUR + DUSK_DUR + NIGHT_DUR - cycleTime));
    }
    return 0;
  }
  
  function drawLighting(ctx, canvasW, canvasH, lightSources, playerX, playerY, cam) {
    if (nightAmount <= 0.01) return;
    
    // Create darkness overlay
    const dark = document.createElement('canvas');
    dark.width = canvasW;
    dark.height = canvasH;
    const dc = dark.getContext('2d');
    
    // Fill with darkness
    const alpha = nightAmount * 0.85;
    dc.fillStyle = `rgba(5,5,20,${alpha})`;
    dc.fillRect(0, 0, canvasW, canvasH);
    
    // Cut out light sources
    dc.globalCompositeOperation = 'destination-out';
    
    // Player has a small personal light
    const px = playerX - cam.x;
    const py = playerY - cam.y;
    const playerGrad = dc.createRadialGradient(px, py, 0, px, py, 80);
    playerGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
    playerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    dc.fillStyle = playerGrad;
    dc.fillRect(px - 80, py - 80, 160, 160);
    
    for (const ls of lightSources) {
      const lx = ls.x - cam.x;
      const ly = ls.y - cam.y;
      if (lx < -ls.radius || ly < -ls.radius || lx > canvasW + ls.radius || ly > canvasH + ls.radius) continue;
      
      const flicker = ls.flicker ? Math.sin(Date.now() * 0.01 + ls.flickerPhase) * 5 : 0;
      const r = ls.radius + flicker;
      const grad = dc.createRadialGradient(lx, ly, 0, lx, ly, r);
      grad.addColorStop(0, `rgba(0,0,0,${ls.intensity || 0.9})`);
      grad.addColorStop(0.6, `rgba(0,0,0,${(ls.intensity || 0.9) * 0.4})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      dc.fillStyle = grad;
      dc.beginPath();
      dc.arc(lx, ly, r, 0, Math.PI * 2);
      dc.fill();
    }
    
    // Draw stars + moon behind darkness
    if (nightAmount > 0.3) {
      ctx.save();
      ctx.globalAlpha = nightAmount * 0.8;
      // Moon
      ctx.fillStyle = '#ffffcc';
      ctx.beginPath();
      ctx.arc(canvasW * 0.8, 60, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(5,5,20,1)`;
      ctx.beginPath();
      ctx.arc(canvasW * 0.8 + 6, 57, 17, 0, Math.PI * 2);
      ctx.fill();
      // Stars
      ctx.fillStyle = '#fff';
      const t = Date.now() * 0.001;
      for (const s of stars) {
        const twinkle = Math.sin(t + s.twinkle) * 0.5 + 0.5;
        ctx.globalAlpha = nightAmount * twinkle * 0.8;
        ctx.fillRect(s.x * canvasW, s.y * 120, s.size, s.size);
      }
      ctx.restore();
    }
    
    // Add colored tint overlay
    if (nightAmount > 0) {
      ctx.save();
      if (phase === 'dusk') {
        ctx.fillStyle = `rgba(180,100,50,${nightAmount * 0.15})`;
      } else {
        ctx.fillStyle = `rgba(30,30,80,${nightAmount * 0.1})`;
      }
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.restore();
    }
    
    ctx.drawImage(dark, 0, 0);
  }
  
  return {
    init, update, drawLighting, getNightTimeRemaining,
    phase: () => phase,
    nightCount: () => nightCount,
    nightAmount: () => nightAmount,
    cycleTime: () => cycleTime,
    dayTime: () => dayTime,
    isNight: () => phase === 'night' || phase === 'dusk',
    DAY_DUR, NIGHT_DUR, DUSK_DUR
  };
})();
