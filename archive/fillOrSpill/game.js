(() => {
  // --- State ---
  let p1Name = 'Player 1', p2Name = 'Player 2';
  let waterLevel = 0; // 0-1 (1 = rim, >1 = overflow)
  let currentPlayer = 1; // 1 or 2
  let turnCount = 1;
  let isHolding = false;
  let holdStart = 0;
  let gameActive = false;
  let spillHappened = false;
  let waveTime = 0;
  let fillSpeed = 0; // ramps up
  let particles = [];
  let spillWater = []; // overflow streams
  let poolLevel = 0;

  // --- Elements ---
  const $ = id => document.getElementById(id);
  const screens = {
    start: $('start-screen'),
    countdown: $('countdown-screen'),
    game: $('game-screen'),
    end: $('end-screen')
  };

  const gameCanvas = $('game-canvas');
  const ctx = gameCanvas.getContext('2d');
  const bgCanvas = $('bg-canvas');
  const bgCtx = bgCanvas.getContext('2d');
  const endCanvas = $('end-canvas');
  const endCtx = endCanvas.getContext('2d');

  // --- Glass dimensions (relative to canvas) ---
  const CANVAS_W = 360, CANVAS_H = 500;
  // Glass: pint glass shape
  const GLASS = {
    topY: 60, botY: 420, rimThick: 6,
    topW: 160, botW: 110, // half-widths at top/bottom
    baseY: 450, baseW: 70, // foot
    cx: CANVAS_W / 2
  };

  function glassLeftAt(y) {
    const t = (y - GLASS.topY) / (GLASS.botY - GLASS.topY);
    const hw = GLASS.topW + (GLASS.botW - GLASS.topW) * t;
    return GLASS.cx - hw;
  }
  function glassRightAt(y) {
    const t = (y - GLASS.topY) / (GLASS.botY - GLASS.topY);
    const hw = GLASS.topW + (GLASS.botW - GLASS.topW) * t;
    return GLASS.cx + hw;
  }
  function waterYFromLevel(level) {
    // level 0 = botY, level 1 = topY + rimThick
    const rimY = GLASS.topY + GLASS.rimThick;
    return GLASS.botY - level * (GLASS.botY - rimY);
  }

  // --- Screen management ---
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // --- BG water animation for start screen ---
  let bgTime = 0;
  function drawBg() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    bgTime += 0.02;
    const w = bgCanvas.width, h = bgCanvas.height;
    bgCtx.fillStyle = '#0a0a1a';
    bgCtx.fillRect(0, 0, w, h);
    const waterH = h * 0.35;
    const waterY = h - waterH;
    bgCtx.beginPath();
    bgCtx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      const y = waterY + Math.sin(x * 0.008 + bgTime) * 12 + Math.sin(x * 0.015 - bgTime * 0.7) * 6;
      bgCtx.lineTo(x, y);
    }
    bgCtx.lineTo(w, h);
    bgCtx.closePath();
    const grad = bgCtx.createLinearGradient(0, waterY, 0, h);
    grad.addColorStop(0, 'rgba(93,173,226,0.15)');
    grad.addColorStop(1, 'rgba(26,82,118,0.25)');
    bgCtx.fillStyle = grad;
    bgCtx.fill();
    if (screens.start.classList.contains('active')) requestAnimationFrame(drawBg);
  }

  // --- End screen water bg ---
  let endTime = 0;
  function drawEndBg() {
    endCanvas.width = window.innerWidth;
    endCanvas.height = window.innerHeight;
    endTime += 0.015;
    const w = endCanvas.width, h = endCanvas.height;
    endCtx.fillStyle = '#0a0a1a';
    endCtx.fillRect(0, 0, w, h);
    // Red-tinted water
    const waterH = h * 0.45;
    const waterY = h - waterH;
    endCtx.beginPath();
    endCtx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      const y = waterY + Math.sin(x * 0.006 + endTime) * 15 + Math.sin(x * 0.012 - endTime * 0.8) * 8;
      endCtx.lineTo(x, y);
    }
    endCtx.lineTo(w, h);
    endCtx.closePath();
    const grad = endCtx.createLinearGradient(0, waterY, 0, h);
    grad.addColorStop(0, 'rgba(231,76,60,0.15)');
    grad.addColorStop(1, 'rgba(142,68,173,0.2)');
    endCtx.fillStyle = grad;
    endCtx.fill();
    if (screens.end.classList.contains('active')) requestAnimationFrame(drawEndBg);
  }

  // --- Init ---
  function init() {
    gameCanvas.width = CANVAS_W;
    gameCanvas.height = CANVAS_H;
    drawBg();

    $('start-btn').onclick = startGame;
    $('play-again-btn').onclick = () => { resetGame(); startCountdown(); };
    $('switch-btn').onclick = () => { [p1Name, p2Name] = [p2Name, p1Name]; resetGame(); startCountdown(); };
    $('share-text').onclick = function() {
      navigator.clipboard?.writeText(this.textContent).then(() => {
        this.style.background = 'rgba(46,204,113,0.2)';
        setTimeout(() => this.style.background = '', 600);
      });
    };

    // Input events (game area)
    const target = gameCanvas;
    const onDown = e => { e.preventDefault(); if (gameActive && !spillHappened) { isHolding = true; holdStart = performance.now(); fillSpeed = 0; } };
    const onUp = e => { e.preventDefault(); if (isHolding) { isHolding = false; if (gameActive && !spillHappened) endTurn(); } };
    target.addEventListener('mousedown', onDown);
    target.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);
    // Prevent context menu
    target.addEventListener('contextmenu', e => e.preventDefault());
  }

  function startGame() {
    p1Name = $('p1-name').value.trim() || 'Player 1';
    p2Name = $('p2-name').value.trim() || 'Player 2';
    $('left-name').textContent = p1Name;
    $('right-name').textContent = p2Name;
    resetGame();
    startCountdown();
  }

  function resetGame() {
    waterLevel = 0;
    currentPlayer = 1;
    turnCount = 1;
    isHolding = false;
    gameActive = false;
    spillHappened = false;
    fillSpeed = 0;
    particles = [];
    spillWater = [];
    spillDroplets = [];
    spillFloodLevel = 0;
    screenShakeAmount = 0;
    poolLevel = 0;
    $('turn-num').textContent = '1';
    $('water-pct').textContent = '0%';
    $('danger-overlay').style.opacity = '0';
    $('game-screen').style.background = '#0a0a1a';
    updatePlayerIndicators();
  }

  function startCountdown() {
    showScreen('countdown');
    let count = 3;
    $('countdown-num').textContent = count;
    $('countdown-num').style.animation = 'none';
    void $('countdown-num').offsetHeight;
    $('countdown-num').style.animation = '';
    const iv = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(iv);
        $('countdown-num').textContent = 'GO!';
        $('countdown-num').style.color = '#2ecc71';
        setTimeout(() => {
          $('countdown-num').style.color = '#5dade2';
          showScreen('game');
          gameActive = true;
          updatePlayerIndicators();
          gameLoop();
        }, 400);
      } else {
        $('countdown-num').textContent = count;
        $('countdown-num').style.animation = 'none';
        void $('countdown-num').offsetHeight;
        $('countdown-num').style.animation = '';
      }
    }, 700);
  }

  function updatePlayerIndicators() {
    const left = $('player-left'), right = $('player-right');
    left.classList.toggle('active', currentPlayer === 1);
    left.classList.toggle('inactive', currentPlayer !== 1);
    right.classList.toggle('active', currentPlayer === 2);
    right.classList.toggle('inactive', currentPlayer !== 2);
    const prompt = $('fill-prompt');
    prompt.classList.toggle('visible', gameActive && !spillHappened);
  }

  function endTurn() {
    if (spillHappened) return;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    turnCount++;
    $('turn-num').textContent = turnCount;
    gameActive = false;
    updatePlayerIndicators();
    // Brief pause
    setTimeout(() => {
      if (!spillHappened) {
        gameActive = true;
        updatePlayerIndicators();
      }
    }, 500);
  }

  let spillDroplets = [];
  let screenShakeAmount = 0;
  let spillFloodLevel = 0;
  
  function triggerSpill() {
    spillHappened = true;
    gameActive = false;
    isHolding = false;
    $('fill-prompt').classList.remove('visible');
    
    // Big screen flash
    const flash = $('spill-flash');
    flash.style.opacity = '1';
    setTimeout(() => flash.style.opacity = '0.5', 150);
    setTimeout(() => flash.style.opacity = '0', 600);
    
    // Screen shake
    screenShakeAmount = 15;
    
    // Eruption burst — big splash particles flying upward
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: GLASS.cx + (Math.random() - 0.5) * GLASS.topW,
        y: GLASS.topY - Math.random() * 10,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 10 - 3,
        r: Math.random() * 5 + 2,
        life: 1.2
      });
    }
    
    // Side splash droplets
    for (let i = 0; i < 40; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      spillDroplets.push({
        x: GLASS.cx + side * GLASS.topW * 0.5 * Math.random(),
        y: GLASS.topY + Math.random() * 20,
        vx: side * (Math.random() * 5 + 2),
        vy: -Math.random() * 4 - 1,
        r: Math.random() * 3 + 1,
        life: 1.5,
        trail: []
      });
    }
    
    // Rising flood effect
    spillFloodLevel = 0;
    
    // After animation, show end screen
    setTimeout(showEndScreen, 3500);
  }

  function showEndScreen() {
    const loser = currentPlayer === 1 ? p1Name : p2Name;
    const winner = currentPlayer === 1 ? p2Name : p1Name;
    $('end-loser').textContent = `${loser} spilled! 💀`;
    $('end-winner').textContent = `🏆 ${winner} wins!`;
    $('end-stats').textContent = `${turnCount} turns · Glass was ${Math.min(100, Math.round(waterLevel * 100))}% full`;
    $('share-text').textContent = `🥛 Fill Or Spill — ${winner} beat ${loser} in ${turnCount} turns! 💧`;
    showScreen('end');
    drawEndBg();
    if (window.BrainSmacks) BrainSmacks.showRecommendations($('end-recommendations'));
  }

  // --- Main game loop ---
  let lastTime = 0;
  function gameLoop(time = 0) {
    const dt = Math.min(time - lastTime, 50); // cap delta
    lastTime = time;
    waveTime += dt * 0.001;

    // Fill water
    if (isHolding && gameActive && !spillHappened) {
      const holdDuration = performance.now() - holdStart;
      // Ease-in: ramp up over 200ms
      const ramp = Math.min(1, holdDuration / 200);
      // Base rate: 1% per 80ms = 0.0125 per ms... wait, 1% per 80ms = 0.01/80 per ms
      const baseRate = 0.01 / 80; // per ms
      const randomFactor = 1 + (Math.sin(time * 0.01) * 0.05);
      fillSpeed = baseRate * ramp * randomFactor;
      waterLevel += fillSpeed * dt;

      if (waterLevel >= 1.08) {
        triggerSpill();
      }
    }

    // Danger effects
    const pct = Math.min(1, waterLevel);
    if (pct > 0.8) {
      const danger = (pct - 0.8) / 0.2;
      $('danger-overlay').style.opacity = danger * 0.6;
      // Shift bg color
      const r = Math.round(10 + danger * 30);
      const g = Math.round(10 - danger * 5);
      const b = Math.round(26 - danger * 15);
      $('game-screen').style.background = `rgb(${r},${g},${b})`;
    }

    $('water-pct').textContent = `${Math.min(100, Math.round(waterLevel * 100))}%`;

    // Update particles
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= 0.012;
      return p.life > 0 && p.y < CANVAS_H;
    });

    // Pool grows during spill
    if (spillHappened) {
      poolLevel = Math.min(40, poolLevel + dt * 0.02);
    }

    draw();

    if (screens.game.classList.contains('active')) {
      requestAnimationFrame(gameLoop);
    }
  }

  // --- Draw ---
  function draw() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const level = Math.min(waterLevel, 1.08);
    const surfaceY = waterYFromLevel(Math.min(level, 1.05));
    const isFilling = isHolding && gameActive;
    const danger = Math.max(0, (waterLevel - 0.85) / 0.15);

    // --- Draw water ---
    if (waterLevel > 0) {
      ctx.save();
      // Clip to glass interior
      ctx.beginPath();
      // If spilling, extend clip above glass
      const clipTop = spillHappened ? 0 : GLASS.topY + GLASS.rimThick;
      ctx.moveTo(glassLeftAt(clipTop), clipTop);
      for (let y = clipTop; y <= GLASS.botY; y += 2) {
        ctx.lineTo(glassLeftAt(y) + 3, y);
      }
      ctx.lineTo(glassRightAt(GLASS.botY) - 3, GLASS.botY);
      for (let y = GLASS.botY; y >= clipTop; y -= 2) {
        ctx.lineTo(glassRightAt(y) - 3, y);
      }
      ctx.closePath();
      ctx.clip();

      // Water body
      ctx.beginPath();
      // Wave surface
      const waveAmp1 = 2 * (1 + (isFilling ? 0.8 : 0) + danger * 1.2);
      const waveAmp2 = 1 * (1 + (isFilling ? 0.5 : 0) + danger * 0.8);
      const leftEdge = glassLeftAt(surfaceY);
      const rightEdge = glassRightAt(surfaceY);

      ctx.moveTo(leftEdge, surfaceY);
      for (let x = leftEdge; x <= rightEdge; x += 2) {
        const normX = (x - leftEdge) / (rightEdge - leftEdge);
        // Meniscus: curve up at edges
        const edgeDist = Math.min(normX, 1 - normX) * 2; // 0 at edges, 1 in middle
        const meniscus = (1 - Math.pow(edgeDist, 0.5)) * -2;
        const wave = Math.sin(x * 0.02 + waveTime * 3) * waveAmp1
                   + Math.sin(x * 0.04 - waveTime * 2) * waveAmp2;
        ctx.lineTo(x, surfaceY + wave + meniscus);
      }
      // Close at bottom
      ctx.lineTo(glassRightAt(GLASS.botY), GLASS.botY);
      ctx.lineTo(glassLeftAt(GLASS.botY), GLASS.botY);
      ctx.closePath();

      const wGrad = ctx.createLinearGradient(0, GLASS.botY, 0, surfaceY);
      wGrad.addColorStop(0, 'rgba(26,82,118,0.85)');
      wGrad.addColorStop(0.5, 'rgba(41,128,185,0.8)');
      wGrad.addColorStop(1, 'rgba(93,173,226,0.75)');
      ctx.fillStyle = wGrad;
      ctx.fill();

      // Light caustics
      ctx.globalAlpha = 0.08;
      for (let i = 0; i < 5; i++) {
        const cx = GLASS.cx + Math.sin(waveTime * 0.7 + i * 1.3) * 40;
        const cy = GLASS.botY - 50 - i * 50;
        if (cy > surfaceY) {
          const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
          rg.addColorStop(0, '#fff');
          rg.addColorStop(1, 'transparent');
          ctx.fillStyle = rg;
          ctx.fillRect(cx - 30, cy - 30, 60, 60);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // --- Draw glass ---
    drawGlass();

    // --- Screen shake ---
    if (screenShakeAmount > 0.5) {
      const shakeX = (Math.random() - 0.5) * screenShakeAmount;
      const shakeY = (Math.random() - 0.5) * screenShakeAmount;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      screenShakeAmount *= 0.92;
    }

    // --- Draw overflow ---
    if (spillHappened) {
      // Water streaming down ALL sides of the glass
      ctx.save();
      const streams = [];
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        streams.push({
          x: GLASS.cx + (t - 0.5) * GLASS.topW * 2.2,
          w: 6 + Math.random() * 10,
          speed: 0.8 + Math.random() * 0.4
        });
      }
      const spillProgress = Math.min(1, poolLevel / 15);
      streams.forEach(s => {
        const grad = ctx.createLinearGradient(0, GLASS.topY, 0, CANVAS_H);
        grad.addColorStop(0, 'rgba(93,173,226,0.7)');
        grad.addColorStop(0.5, 'rgba(41,128,185,0.5)');
        grad.addColorStop(1, 'rgba(26,82,118,0.3)');
        ctx.fillStyle = grad;
        const streamBottom = GLASS.topY + (CANVAS_H - GLASS.topY) * spillProgress;
        const wobble = Math.sin(waveTime * 5 + s.x * 0.1) * 3;
        ctx.fillRect(s.x - s.w/2 + wobble, GLASS.topY, s.w, streamBottom - GLASS.topY);
      });

      // Rising flood at bottom — water filling the whole scene
      spillFloodLevel = Math.min(CANVAS_H * 0.35, spillFloodLevel + 0.8);
      const floodY = CANVAS_H - spillFloodLevel;
      if (spillFloodLevel > 5) {
        ctx.beginPath();
        // Wavy flood surface
        ctx.moveTo(0, CANVAS_H);
        ctx.lineTo(0, floodY);
        for (let x = 0; x <= CANVAS_W; x += 3) {
          const wave = Math.sin(x * 0.015 + waveTime * 3) * 4 + Math.sin(x * 0.03 - waveTime * 2) * 2;
          ctx.lineTo(x, floodY + wave);
        }
        ctx.lineTo(CANVAS_W, CANVAS_H);
        ctx.closePath();
        const floodGrad = ctx.createLinearGradient(0, floodY, 0, CANVAS_H);
        floodGrad.addColorStop(0, 'rgba(52,152,219,0.6)');
        floodGrad.addColorStop(0.5, 'rgba(41,128,185,0.7)');
        floodGrad.addColorStop(1, 'rgba(26,82,118,0.8)');
        ctx.fillStyle = floodGrad;
        ctx.fill();
      }
      ctx.restore();
      
      // Update spill droplets
      for (let i = spillDroplets.length - 1; i >= 0; i--) {
        const d = spillDroplets[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.2;
        d.life -= 0.01;
        if (d.life <= 0 || d.y > CANVAS_H) { spillDroplets.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(93,173,226,${d.life * 0.6})`;
        ctx.fill();
      }
    }

    // --- Particles ---
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(93,173,226,${p.life * 0.7})`;
      ctx.fill();
    });

    // Spill text — big dramatic pulsing
    if (spillHappened && poolLevel > 5) {
      ctx.save();
      const pulse = 1 + Math.sin(waveTime * 8) * 0.08;
      ctx.font = `bold ${Math.round(56 * pulse)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e74c3c';
      ctx.shadowColor = 'rgba(231,76,60,0.8)';
      ctx.shadowBlur = 30;
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      const textY = Math.min(GLASS.topY - 30, CANVAS_H - spillFloodLevel - 20);
      ctx.strokeText('SPILL!', GLASS.cx, textY);
      ctx.fillText('SPILL!', GLASS.cx, textY);
      ctx.restore();
    }
    
    // End screen shake transform
    if (screenShakeAmount > 0.5) {
      ctx.restore();
    }
  }

  function drawGlass() {
    ctx.save();
    // Main glass body
    ctx.beginPath();
    ctx.moveTo(glassLeftAt(GLASS.topY), GLASS.topY);
    for (let y = GLASS.topY; y <= GLASS.botY; y += 2) {
      ctx.lineTo(glassLeftAt(y), y);
    }
    // Bottom curve
    ctx.quadraticCurveTo(GLASS.cx, GLASS.botY + 15, glassRightAt(GLASS.botY), GLASS.botY);
    for (let y = GLASS.botY; y >= GLASS.topY; y -= 2) {
      ctx.lineTo(glassRightAt(y), y);
    }
    ctx.closePath();

    // Glass fill - very subtle transparent
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glass highlight streaks
    ctx.save();
    ctx.globalAlpha = 0.08;
    // Left highlight
    ctx.beginPath();
    for (let y = GLASS.topY + 20; y <= GLASS.botY - 20; y += 2) {
      const x = glassLeftAt(y) + 12;
      ctx.lineTo(x, y);
    }
    for (let y = GLASS.botY - 20; y >= GLASS.topY + 20; y -= 2) {
      const x = glassLeftAt(y) + 18;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Right highlight
    ctx.beginPath();
    for (let y = GLASS.topY + 40; y <= GLASS.botY - 40; y += 2) {
      const x = glassRightAt(y) - 15;
      ctx.lineTo(x, y);
    }
    for (let y = GLASS.botY - 40; y >= GLASS.topY + 40; y -= 2) {
      const x = glassRightAt(y) - 10;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Rim
    ctx.beginPath();
    ctx.ellipse(GLASS.cx, GLASS.topY, GLASS.topW, GLASS.rimThick, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();

    // Base/foot
    ctx.beginPath();
    ctx.moveTo(glassLeftAt(GLASS.botY) + 10, GLASS.botY);
    ctx.lineTo(GLASS.cx - GLASS.baseW, GLASS.baseY);
    ctx.lineTo(GLASS.cx + GLASS.baseW, GLASS.baseY);
    ctx.lineTo(glassRightAt(GLASS.botY) - 10, GLASS.botY);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Base bottom
    ctx.beginPath();
    ctx.ellipse(GLASS.cx, GLASS.baseY, GLASS.baseW, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // --- Start ---
  init();
})();
