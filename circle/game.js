(() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const startScreen = document.getElementById('start-screen');
  const resultScreen = document.getElementById('result-screen');
  const gameHud = document.getElementById('game-hud');
  const scoreNum = document.getElementById('score-num');
  const ratingText = document.getElementById('rating-text');
  const bestScoreText = document.getElementById('best-score-text');
  const toast = document.getElementById('copy-toast');

  let W, H, dpr;
  let points = [];
  let drawing = false;
  let state = 'start'; // start | draw | result
  let dustParticles = [];
  let animFrame;
  let boardTexture = null;
  let finalScore = 0;
  let bestScore = parseInt(localStorage.getItem('circle_best') || '0');

  // --- Resize ---
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    boardTexture = null;
    drawBoard();
  }
  window.addEventListener('resize', resize);

  // --- Chalkboard texture (cached to offscreen canvas) ---
  function generateBoardTexture() {
    const off = document.createElement('canvas');
    off.width = W * dpr; off.height = H * dpr;
    const oc = off.getContext('2d');
    oc.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Base color
    oc.fillStyle = '#2d4a2d';
    oc.fillRect(0, 0, W, H);
    // Grain noise
    const id = oc.getImageData(0, 0, off.width, off.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 18;
      d[i] += n; d[i+1] += n; d[i+2] += n;
    }
    oc.putImageData(id, 0, 0);
    // Subtle smudges
    for (let i = 0; i < 3; i++) {
      oc.beginPath();
      oc.ellipse(Math.random()*W, Math.random()*H, 40+Math.random()*60, 20+Math.random()*30, Math.random()*Math.PI, 0, Math.PI*2);
      oc.fillStyle = `rgba(200,200,190,${0.01+Math.random()*0.02})`;
      oc.fill();
    }
    boardTexture = off;
  }

  function drawBoard() {
    if (!boardTexture) generateBoardTexture();
    ctx.drawImage(boardTexture, 0, 0, W, H);
  }

  // --- Chalk line drawing ---
  function drawChalkSegment(x1, y1, x2, y2) {
    const dx = x2-x1, dy = y2-y1;
    const dist = Math.sqrt(dx*dx+dy*dy);
    if (dist < 0.5) return;
    const steps = Math.max(1, Math.floor(dist / 2));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = x1 + dx*t, y = y1 + dy*t;
      const alpha = 0.7 + Math.random()*0.3;
      // Main dot
      ctx.beginPath();
      ctx.arc(x + (Math.random()-0.5)*1.5, y + (Math.random()-0.5)*1.5, 1.8+Math.random()*1.2, 0, Math.PI*2);
      ctx.fillStyle = `rgba(232,232,224,${alpha})`;
      ctx.fill();
      // Scatter particles
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        const px = x + (Math.random()-0.5)*6, py = y + (Math.random()-0.5)*6;
        ctx.arc(px, py, 0.3+Math.random()*0.8, 0, Math.PI*2);
        ctx.fillStyle = `rgba(232,232,224,${0.2+Math.random()*0.4})`;
        ctx.fill();
      }
    }
    // Dust particles (disabled — too droopy/distracting)
    // if (Math.random() < 0.4) {
    //   dustParticles.push({ x: x2+(Math.random()-0.5)*4, y: y2, vy: 0.3+Math.random()*0.5, alpha: 0.5+Math.random()*0.3, size: 0.5+Math.random()*1, life: 60 });
    // }
  }

  function drawChalkCircle(cx, cy, r, color='rgba(240,230,140,0.6)', dashed=true) {
    const circumf = 2*Math.PI*r;
    const steps = Math.max(60, Math.floor(circumf/3));
    for (let i = 0; i < steps; i++) {
      if (dashed && i % 6 > 3) continue;
      const a = (i/steps)*Math.PI*2;
      const x = cx + Math.cos(a)*r + (Math.random()-0.5)*1.5;
      const y = cy + Math.sin(a)*r + (Math.random()-0.5)*1.5;
      ctx.beginPath();
      ctx.arc(x, y, 1+Math.random()*0.8, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();
      if (Math.random() < 0.3) {
        ctx.beginPath();
        ctx.arc(x+(Math.random()-0.5)*5, y+(Math.random()-0.5)*5, 0.3+Math.random()*0.5, 0, Math.PI*2);
        ctx.fillStyle = color.replace(/[\d.]+\)$/, (0.15+Math.random()*0.2).toFixed(2)+')');
        ctx.fill();
      }
    }
  }

  function drawChalkText(text, x, y, size, color='rgba(232,232,224,0.85)') {
    ctx.font = `italic ${size}px Georgia, serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    // Chalk texture overlay on text
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    for (let i = 0; i < size*2; i++) {
      const tx = x - ctx.measureText(text).width/2 + Math.random()*ctx.measureText(text).width;
      const ty = y - size/2 + Math.random()*size;
      ctx.beginPath(); ctx.arc(tx, ty, 0.3+Math.random(), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // --- Dust particle system ---
  function updateDust() {
    for (let i = dustParticles.length-1; i >= 0; i--) {
      const p = dustParticles[i];
      p.y += p.vy; p.alpha -= 0.008; p.life--;
      if (p.life <= 0 || p.alpha <= 0) { dustParticles.splice(i,1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fillStyle = `rgba(232,232,224,${p.alpha})`;
      ctx.fill();
    }
  }

  // --- Analysis: Algebraic least-squares circle fit (Taubin method) ---
  function analyzeCircle(pts) {
    if (pts.length < 10) return 0;
    const n = pts.length;
    
    // Step 1: Compute centroid for numerical stability
    let mx = 0, my = 0;
    pts.forEach(p => { mx += p.x; my += p.y; });
    mx /= n; my /= n;
    
    // Step 2: Shift coordinates to centroid
    const u = pts.map(p => p.x - mx);
    const v = pts.map(p => p.y - my);
    
    // Step 3: Compute sums for algebraic circle fit
    let Suu = 0, Svv = 0, Suv = 0, Suuu = 0, Svvv = 0, Suvv = 0, Svuu = 0;
    for (let i = 0; i < n; i++) {
      const uu = u[i]*u[i], vv = v[i]*v[i];
      Suu += uu; Svv += vv; Suv += u[i]*v[i];
      Suuu += uu*u[i]; Svvv += vv*v[i];
      Suvv += u[i]*vv; Svuu += v[i]*uu;
    }
    
    // Step 4: Solve linear system for center (relative to centroid)
    //   [Suu  Suv] [uc]   1/2 [Suuu + Suvv]
    //   [Suv  Svv] [vc] = 1/2 [Svvv + Svuu]
    const det = Suu * Svv - Suv * Suv;
    if (Math.abs(det) < 1e-10) return 0;
    
    const rhs1 = 0.5 * (Suuu + Suvv);
    const rhs2 = 0.5 * (Svvv + Svuu);
    const uc = (Svv * rhs1 - Suv * rhs2) / det;
    const vc = (Suu * rhs2 - Suv * rhs1) / det;
    
    // Step 5: Convert back to original coordinates
    const cx = uc + mx;
    const cy = vc + my;
    const r = Math.sqrt(uc*uc + vc*vc + (Suu + Svv) / n);
    
    if (r < 10) return 0;
    
    // Step 6: Score based on how well points fit the circle
    const radii = pts.map(p => Math.sqrt((p.x-cx)**2 + (p.y-cy)**2));
    const variance = radii.reduce((s, ri) => s + (ri - r)**2, 0) / n;
    const stdDev = Math.sqrt(variance);
    let score = Math.max(0, 100 - (stdDev / r) * 200);
    
    // Closure penalty
    const startEnd = Math.sqrt((pts[0].x-pts[n-1].x)**2 + (pts[0].y-pts[n-1].y)**2);
    if (startEnd > r * 0.25) score *= Math.max(0.5, 1 - (startEnd/r - 0.25) * 0.8);
    
    // Oval penalty
    const minR = Math.min(...radii), maxR = Math.max(...radii);
    const ovalRatio = minR / maxR;
    if (ovalRatio < 0.7) score *= (0.5 + ovalRatio * 0.5);
    
    // Store for overlay
    analyzeCircle._cx = cx; analyzeCircle._cy = cy; analyzeCircle._r = r;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function getRating(s) {
    if (s >= 95) return "INHUMAN! 🤯";
    if (s >= 90) return "Legendary! ✨";
    if (s >= 85) return "Amazing! 🔥";
    if (s >= 80) return "Great! 👏";
    if (s >= 70) return "Not Bad! 👍";
    if (s >= 60) return "Decent 🤷";
    if (s >= 50) return "That's... a circle? 😬";
    return "Were you even trying? 😂";
  }

  // --- Erase animation ---
  function eraseBoard(cb) {
    let eraseX = 0;
    const speed = W / 30;
    function step() {
      eraseX += speed;
      // Draw eraser stripe
      ctx.fillStyle = 'rgba(45,74,45,0.95)';
      ctx.fillRect(eraseX-speed-10, 0, speed+20, H);
      // Eraser graphic
      ctx.fillStyle = '#777';
      ctx.fillRect(eraseX-8, H/2-30, 16, 60);
      ctx.fillStyle = '#555';
      ctx.fillRect(eraseX-6, H/2-28, 12, 56);
      if (eraseX < W + speed) {
        requestAnimationFrame(step);
      } else {
        dustParticles = [];
        drawBoard();
        cb && cb();
      }
    }
    step();
  }

  // --- Score animation ---
  function showResult(score) {
    finalScore = score;
    if (score > bestScore) { bestScore = score; localStorage.setItem('circle_best', bestScore); }
    state = 'result';
    gameHud.classList.add('hidden');
    if (window.BrainSmacks) BrainSmacks.showRecommendations(document.getElementById('end-recommendations'));

    // Draw perfect circle overlay after brief pause
    setTimeout(() => {
      const cx = analyzeCircle._cx, cy = analyzeCircle._cy, r = analyzeCircle._r;
      // Animate perfect circle drawing
      // Start drawing from where the user started (find angle of first point)
      const startAngle = Math.atan2(points[0].y - cy, points[0].x - cx);
      let step = 0, totalSteps = 60;
      function drawOverlayStep() {
        if (step >= totalSteps) { animateScore(); return; }
        const a1 = startAngle + (step/totalSteps)*Math.PI*2;
        const a2 = startAngle + ((step+1)/totalSteps)*Math.PI*2;
        const x1 = cx+Math.cos(a1)*r, y1 = cy+Math.sin(a1)*r;
        const x2 = cx+Math.cos(a2)*r, y2 = cy+Math.sin(a2)*r;
        // Chalk-style
        const segs = Math.max(1, Math.floor(Math.sqrt((x2-x1)**2+(y2-y1)**2)/2));
        for (let s = 0; s < segs; s++) {
          const t = s/segs;
          const x = x1+(x2-x1)*t+(Math.random()-0.5)*1.5;
          const y = y1+(y2-y1)*t+(Math.random()-0.5)*1.5;
          if (step % 4 > 2) continue; // dashed
          ctx.beginPath();
          ctx.arc(x, y, 0.8+Math.random()*0.6, 0, Math.PI*2);
          ctx.fillStyle = `rgba(240,230,140,${0.5+Math.random()*0.3})`;
          ctx.fill();
        }
        step++;
        requestAnimationFrame(drawOverlayStep);
      }
      drawOverlayStep();
    }, 500);

    function animateScore() {
      resultScreen.classList.add('active');
      bestScoreText.textContent = `Best: ${bestScore}%`;
      let current = 0;
      const inc = Math.max(1, Math.floor(score/40));
      function tick() {
        current = Math.min(score, current+inc);
        scoreNum.textContent = current;
        if (current < score) requestAnimationFrame(tick);
        else ratingText.textContent = getRating(score);
      }
      ratingText.textContent = '';
      tick();
    }
  }

  // --- Input handling ---
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  function onDown(e) {
    if (state !== 'draw') return;
    e.preventDefault();
    drawing = true;
    points = [getPos(e)];
  }
  function onMove(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    const last = points[points.length-1];
    drawChalkSegment(last.x, last.y, p.x, p.y);
    points.push(p);
  }
  function onUp(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
    if (points.length < 10) return;
    const score = analyzeCircle(points);
    showResult(score);
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('mouseleave', onUp);
  canvas.addEventListener('touchstart', onDown, {passive:false});
  canvas.addEventListener('touchmove', onMove, {passive:false});
  canvas.addEventListener('touchend', onUp, {passive:false});

  // --- Buttons ---
  document.getElementById('btn-start').addEventListener('click', () => {
    startScreen.classList.remove('active');
    state = 'draw';
    gameHud.classList.remove('hidden');
    drawBoard();
  });

  function resetToDraw() {
    resultScreen.classList.remove('active');
    points = [];
    eraseBoard(() => { state = 'draw'; gameHud.classList.remove('hidden'); });
  }

  document.getElementById('btn-retry').addEventListener('click', resetToDraw);
  document.getElementById('btn-erase').addEventListener('click', () => {
    if (state === 'draw') { points = []; eraseBoard(() => {}); }
  });

  document.getElementById('btn-share').addEventListener('click', () => {
    const text = `⭕ Circle\nI drew a ${finalScore}% perfect circle!\n${getRating(finalScore)}\nCan you beat me?`;
    navigator.clipboard.writeText(text).then(() => {
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2000);
    }).catch(() => {});
  });

  // --- Animation loop for dust ---
  function loop() {
    if (dustParticles.length > 0) {
      // Only redraw dust area, but simpler to just draw them on top
      updateDust();
    }
    animFrame = requestAnimationFrame(loop);
  }

  // --- Init ---
  resize();
  loop();
})();
