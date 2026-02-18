// Heavy Eye Game Engine
(() => {
    // ─── Sound System (Web Audio API) ───
    let audioCtx;
    function getAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    function playTone(freq, dur, type, vol, delay) {
        const ctx = getAudio();
        const t = ctx.currentTime + (delay || 0);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol || 0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
    }

    const SFX = {
        // Gentle pick/click sound
        pick() {
            playTone(880, 0.08, 'sine', 0.1);
            playTone(1320, 0.06, 'sine', 0.06, 0.03);
        },
        // Scale tilting - low warm creak
        tilt() {
            playTone(180, 0.4, 'triangle', 0.08);
            playTone(160, 0.3, 'triangle', 0.05, 0.1);
        },
        // Weight reveal - soft chime ascending
        reveal() {
            playTone(523, 0.15, 'sine', 0.08);
            playTone(659, 0.15, 'sine', 0.08, 0.1);
            playTone(784, 0.2, 'sine', 0.06, 0.2);
        },
        // Correct - happy ascending arpeggio
        correct() {
            playTone(523, 0.12, 'sine', 0.12);
            playTone(659, 0.12, 'sine', 0.12, 0.08);
            playTone(784, 0.12, 'sine', 0.12, 0.16);
            playTone(1047, 0.3, 'sine', 0.1, 0.24);
        },
        // Wrong - gentle descending two-note
        wrong() {
            playTone(400, 0.2, 'triangle', 0.1);
            playTone(300, 0.3, 'triangle', 0.08, 0.15);
        },
        // Next round - soft pop
        next() {
            playTone(660, 0.08, 'sine', 0.08);
            playTone(880, 0.1, 'sine', 0.06, 0.05);
        },
        // Game start - warm welcome chord
        start() {
            playTone(392, 0.3, 'sine', 0.08);
            playTone(494, 0.3, 'sine', 0.08, 0.05);
            playTone(587, 0.4, 'sine', 0.06, 0.1);
        },
        // Game over - gentle resolution
        end() {
            playTone(784, 0.2, 'sine', 0.08);
            playTone(659, 0.2, 'sine', 0.08, 0.15);
            playTone(523, 0.4, 'sine', 0.1, 0.3);
        }
    };

    // ─── Emoji to OpenMoji ───
    function emojiToCodePoints(emoji) {
        const codePoints = [];
        for (const ch of emoji) {
            const cp = ch.codePointAt(0);
            // Skip variation selectors (FE0F, FE0E) and low codepoints
            if (cp > 0xFF && cp !== 0xFE0F && cp !== 0xFE0E) {
                codePoints.push(cp.toString(16).toUpperCase().padStart(4, '0'));
            }
        }
        return codePoints.join('-');
    }
    
    function emojiToOpenMojiUrl(emoji) {
        const code = emojiToCodePoints(emoji);
        return `https://openmoji.org/data/color/svg/${code}.svg`;
    }
    
    function setEmojiImage(element, emoji) {
        const url = emojiToOpenMojiUrl(emoji);
        element.innerHTML = `<img src="${url}" alt="${emoji}" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentElement.textContent='${emoji}'">`;
    }
    
    // ─── State ───
    let mode = null;        // 'campaign' | 'wildcard'
    let rounds = [];        // array of matchup objects
    let roundIndex = 0;
    let score = 0;
    let results = [];       // true/false per round
    let leftObj = null, rightObj = null;
    let heavierSide = null; // 'left' | 'right'
    let revealed = false;
    let scaleTilt = 0;      // current tilt in degrees (-18 to 18)
    let targetTilt = 0;
    let idleTilt = 0;
    let animFrame = null;

    // ─── DOM refs ───
    const $ = id => document.getElementById(id);
    const screens = { start: $('screen-start'), game: $('screen-game'), end: $('screen-end') };
    const cardLeft = $('card-left'), cardRight = $('card-right');
    const resultArea = $('result-area');

    // ─── Scale SVG drawing ───
    function buildScaleSVG(svg) {
        svg.innerHTML = '';
        svg.setAttribute('viewBox', '0 0 400 320');
        const ns = 'http://www.w3.org/2000/svg';

        // Defs for gradients
        const defs = document.createElementNS(ns, 'defs');

        const grad = document.createElementNS(ns, 'linearGradient');
        grad.id = svg.id + '-beam-grad';
        grad.innerHTML = `<stop offset="0%" stop-color="#f0d078"/><stop offset="50%" stop-color="#d4a843"/><stop offset="100%" stop-color="#8a6e2a"/>`;
        defs.appendChild(grad);

        const poleGrad = document.createElementNS(ns, 'linearGradient');
        poleGrad.id = svg.id + '-pole-grad';
        poleGrad.setAttribute('x1','0'); poleGrad.setAttribute('y1','0');
        poleGrad.setAttribute('x2','1'); poleGrad.setAttribute('y2','0');
        poleGrad.innerHTML = `<stop offset="0%" stop-color="#8a6e2a"/><stop offset="50%" stop-color="#d4a843"/><stop offset="100%" stop-color="#8a6e2a"/>`;
        defs.appendChild(poleGrad);

        svg.appendChild(defs);

        // === GEOMETRY: pivot is the EXACT junction of pole top and beam center ===
        const pivotX = 200, pivotY = 130;  // pivot point — where pole meets beam
        const baseY = 290;
        const beamW = 300, beamH = 12;
        const panChainLen = 60;
        const panY = pivotY + beamH/2 + panChainLen;
        const panLeftX = pivotX - beamW/2 + 30;  // 80
        const panRightX = pivotX + beamW/2 - 30; // 320

        // Base
        const base = document.createElementNS(ns, 'ellipse');
        Object.entries({ cx: pivotX, cy: baseY, rx: 60, ry: 14, fill: '#2a2a4a', stroke: '#d4a843', 'stroke-width': 1.5 }).forEach(([k,v]) => base.setAttribute(k,v));
        svg.appendChild(base);

        // Pole — from base up to pivot point exactly
        const pole = document.createElementNS(ns, 'rect');
        Object.entries({ x: pivotX - 6, y: pivotY, width: 12, height: baseY - pivotY, rx: 4, fill: `url(#${poleGrad.id})` }).forEach(([k,v]) => pole.setAttribute(k,v));
        svg.appendChild(pole);

        // Pivot ornament — sits at junction, drawn UNDER beam group so beam overlaps it
        // Then a second one on top to cap it
        const pivotBg = document.createElementNS(ns, 'circle');
        Object.entries({ cx: pivotX, cy: pivotY, r: 12, fill: '#b8922e' }).forEach(([k,v]) => pivotBg.setAttribute(k,v));
        svg.appendChild(pivotBg);

        // Beam group — rotates around pivotX, pivotY
        const beamG = document.createElementNS(ns, 'g');
        beamG.classList.add('scale-beam');

        // Beam rod — centered vertically on pivot
        const beam = document.createElementNS(ns, 'rect');
        Object.entries({ x: pivotX - beamW/2, y: pivotY - beamH/2, width: beamW, height: beamH, rx: 6, fill: `url(#${grad.id})` }).forEach(([k,v]) => beam.setAttribute(k,v));
        beamG.appendChild(beam);

        // Chains & pans
        const panData = [{ cx: panLeftX, label: 'left' }, { cx: panRightX, label: 'right' }];
        const panGroups = [];
        panData.forEach(p => {
            const anchorY = pivotY + beamH/2; // bottom of beam

            const panG = document.createElementNS(ns, 'g');
            panG.classList.add('pan-group');
            panG.dataset.anchorX = p.cx;
            panG.dataset.anchorY = anchorY;

            // Chain lines
            for (let dx = -15; dx <= 15; dx += 15) {
                const line = document.createElementNS(ns, 'line');
                Object.entries({ x1: p.cx + dx, y1: anchorY, x2: p.cx + dx, y2: panY, stroke: '#d4a843', 'stroke-width': 1.2 }).forEach(([k,v]) => line.setAttribute(k,v));
                panG.appendChild(line);
            }
            // Pan
            const pan = document.createElementNS(ns, 'ellipse');
            Object.entries({ cx: p.cx, cy: panY, rx: 35, ry: 10, fill: '#2a2a4a', stroke: '#d4a843', 'stroke-width': 1.5 }).forEach(([k,v]) => pan.setAttribute(k,v));
            panG.appendChild(pan);

            // Emoji holder
            const txt = document.createElementNS(ns, 'text');
            Object.entries({ x: p.cx, y: panY - 7, 'text-anchor': 'middle', 'font-size': '28', class: 'pan-emoji pan-emoji-' + p.label, opacity: 0 }).forEach(([k,v]) => txt.setAttribute(k,v));
            panG.appendChild(txt);

            beamG.appendChild(panG);
            panGroups.push(panG);
        });

        svg.appendChild(beamG);

        // Pivot cap — drawn on TOP of everything so it always covers the junction
        const pivotCap = document.createElementNS(ns, 'circle');
        Object.entries({ cx: pivotX, cy: pivotY, r: 10, fill: '#d4a843', stroke: '#f0d078', 'stroke-width': 1.5 }).forEach(([k,v]) => pivotCap.setAttribute(k,v));
        svg.appendChild(pivotCap);

        // Store pivot coords for animation
        svg._pivotX = pivotX;
        svg._pivotY = pivotY;
        svg._panGroups = panGroups;
        return beamG;
    }

    // ─── Scale animation loop ───
    let idleScaleBeam, gameScaleBeam;
    let idlePhase = 0;

    function initScales() {
        idleScaleBeam = buildScaleSVG($('idle-scale'));
        gameScaleBeam = buildScaleSVG($('game-scale'));
        tick();
    }

    function tick() {
        // Idle animation
        idlePhase += 0.015;
        const idleAngle = Math.sin(idlePhase) * 4;
        if (idleScaleBeam) {
            const idleSvg = idleScaleBeam.closest('svg');
            const px = idleSvg?._pivotX || 200, py = idleSvg?._pivotY || 130;
            idleScaleBeam.setAttribute('transform', `rotate(${idleAngle} ${px} ${py})`);
            if (idleSvg?._panGroups) {
                idleSvg._panGroups.forEach(pg => {
                    const ax = pg.dataset.anchorX, ay = pg.dataset.anchorY;
                    pg.setAttribute('transform', `rotate(${-idleAngle} ${ax} ${ay})`);
                });
            }
        }

        // Game scale - spring toward target
        const diff = targetTilt - scaleTilt;
        scaleTilt += diff * 0.08;
        if (Math.abs(diff) > 0.01) {
            scaleTilt += diff * 0.02;
        }
        if (gameScaleBeam) {
            const gameSvg = gameScaleBeam.closest('svg');
            const px = gameSvg?._pivotX || 200, py = gameSvg?._pivotY || 130;
            gameScaleBeam.setAttribute('transform', `rotate(${scaleTilt} ${px} ${py})`);
            if (gameSvg?._panGroups) {
                gameSvg._panGroups.forEach(pg => {
                    const ax = pg.dataset.anchorX, ay = pg.dataset.anchorY;
                    pg.setAttribute('transform', `rotate(${-scaleTilt} ${ax} ${ay})`);
                });
            }
        }

        animFrame = requestAnimationFrame(tick);
    }

    // ─── Confetti System ───
    const confettiCanvas = $('confetti-canvas');
    const ctx = confettiCanvas.getContext('2d');
    let particles = [];

    function resizeConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    function spawnConfetti() {
        const colors = ['#d4a843','#f0d078','#4ade80','#60a5fa','#f472b6','#facc15','#a78bfa'];
        for (let i = 0; i < 120; i++) {
            particles.push({
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 14 - 4,
                w: Math.random() * 8 + 4,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                rot: Math.random() * 360,
                vr: (Math.random() - 0.5) * 12,
                life: 1,
            });
        }
        if (!confettiRunning) { confettiRunning = true; tickConfetti(); }
    }

    let confettiRunning = false;
    function tickConfetti() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        let alive = false;
        for (const p of particles) {
            p.x += p.vx;
            p.vy += 0.35;
            p.y += p.vy;
            p.rot += p.vr;
            p.life -= 0.008;
            if (p.life <= 0) continue;
            alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.globalAlpha = Math.min(p.life, 1);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
        if (alive) {
            requestAnimationFrame(tickConfetti);
        } else {
            particles = [];
            confettiRunning = false;
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    // ─── Screen transitions ───
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    // ─── Game setup ───
    function pickRounds(m) {
        mode = m;
        if (mode === 'campaign') {
            rounds = CAMPAIGN_ROUNDS.map(tier => tier[Math.floor(Math.random() * tier.length)]);
        } else {
            const shuffled = [...WILDCARD_ROUNDS].sort(() => Math.random() - 0.5);
            rounds = shuffled.slice(0, 3);
        }
        roundIndex = 0; score = 0; results = [];
    }

    function startRound() {
        revealed = false;
        const match = rounds[roundIndex];
        const swap = Math.random() < 0.5;
        leftObj = swap ? match.b : match.a;
        rightObj = swap ? match.a : match.b;
        heavierSide = leftObj.weight_lbs >= rightObj.weight_lbs ? 'left' : 'right';

        // Reset UI
        targetTilt = 0; scaleTilt = 0;
        resultArea.classList.remove('visible');
        $('fun-fact').textContent = '';

        // Update HUD
        updateHUD();

        // Hide pan emojis
        const gameSVG = $('game-scale');
        gameSVG.querySelectorAll('.pan-emoji').forEach(e => { e.setAttribute('opacity', '0'); e.textContent = ''; });

        // Cards
        [cardLeft, cardRight].forEach(c => {
            c.disabled = false;
            c.classList.remove('winner', 'loser', 'picked', 'visible');
            c.querySelector('.card-weight').classList.remove('visible');
        });

        setEmojiImage($('emoji-left'), leftObj.emoji);
        $('name-left').textContent = leftObj.name;
        $('detail-left').textContent = leftObj.detail;
        $('weight-left').textContent = '';

        setEmojiImage($('emoji-right'), rightObj.emoji);
        $('name-right').textContent = rightObj.name;
        $('detail-right').textContent = rightObj.detail;
        $('weight-right').textContent = '';

        // Animate cards in
        setTimeout(() => cardLeft.classList.add('visible'), 100);
        setTimeout(() => cardRight.classList.add('visible'), 200);
    }

    function updateHUD() {
        const total = rounds.length;
        let dots = '';
        for (let i = 0; i < total; i++) {
            let cls = 'round-dot';
            if (i === roundIndex) cls += ' current';
            if (i < results.length) cls += results[i] ? ' correct' : ' wrong';
            dots += `<div class="${cls}"></div>`;
        }
        $('round-indicator').innerHTML = dots;
        $('score-display').textContent = score + '/' + total;
    }

    // ─── Pick handler ───
    function handlePick(side) {
        if (revealed) return;
        revealed = true;

        SFX.pick();
        const pickedCard = side === 'left' ? cardLeft : cardRight;
        pickedCard.classList.add('picked');
        cardLeft.disabled = true;
        cardRight.disabled = true;

        const correct = side === heavierSide;
        if (correct) score++;
        results.push(correct);

        // Drop emojis onto pans
        const gameSVG = $('game-scale');
        const leftEmoji = gameSVG.querySelector('.pan-emoji-left');
        const rightEmoji = gameSVG.querySelector('.pan-emoji-right');
        leftEmoji.textContent = leftObj.emoji;
        rightEmoji.textContent = rightObj.emoji;
        setTimeout(() => {
            leftEmoji.setAttribute('opacity', '1');
            rightEmoji.setAttribute('opacity', '1');
        }, 200);

        // Tilt scale
        const tiltDir = heavierSide === 'left' ? -1 : 1;
        setTimeout(() => {
            SFX.tilt();
            targetTilt = tiltDir * 8;
            // Overshoot then settle
            setTimeout(() => { targetTilt = tiltDir * 6; }, 400);
            setTimeout(() => { targetTilt = tiltDir * 7; }, 700);
        }, 400);

        // Reveal weights with counter animation
        setTimeout(() => {
            SFX.reveal();
            animateWeight($('weight-left'), leftObj.weight_lbs);
            animateWeight($('weight-right'), rightObj.weight_lbs);
            $('weight-left').classList.add('visible');
            $('weight-right').classList.add('visible');
        }, 900);

        // Mark winner/loser cards
        setTimeout(() => {
            const winCard = heavierSide === 'left' ? cardLeft : cardRight;
            const loseCard = heavierSide === 'left' ? cardRight : cardLeft;
            winCard.classList.add('winner');
            loseCard.classList.add('loser');
        }, 1200);

        // Result feedback
        setTimeout(() => {
            if (correct) {
                SFX.correct();
                spawnConfetti();
                $('result-emoji').textContent = '🎉';
                $('result-text').textContent = 'Correct!';
                $('result-text').className = 'result-text correct';
            } else {
                SFX.wrong();
                // Shake + red flash
                document.body.classList.add('shake');
                $('flash-overlay').classList.add('red');
                setTimeout(() => {
                    document.body.classList.remove('shake');
                    $('flash-overlay').classList.remove('red');
                }, 500);
                $('result-emoji').textContent = '😱';
                $('result-text').textContent = 'Wrong!';
                $('result-text').className = 'result-text wrong';
            }

            // Fun fact typewriter
            const heavier = heavierSide === 'left' ? leftObj : rightObj;
            typewrite($('fun-fact'), heavier.fun_fact, 25);

            $('next-btn').textContent = roundIndex < rounds.length - 1 ? 'Next Round →' : 'See Results →';
            resultArea.classList.add('visible');
            updateHUD();
        }, 1800);
    }

    // ─── Weight counter animation ───
    function animateWeight(el, targetLbs) {
        const duration = 1500;
        const start = performance.now();
        const formatted = formatWeight(targetLbs);

        function frame(now) {
            const t = Math.min((now - start) / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - t, 3);
            const current = targetLbs * ease;
            el.textContent = formatWeight(current);
            if (t < 1) {
                requestAnimationFrame(frame);
            } else {
                el.textContent = formatted;
                // Flash effect on land
                el.style.textShadow = '0 0 20px rgba(240,208,120,0.8)';
                setTimeout(() => { el.style.textShadow = 'none'; }, 400);
            }
        }
        requestAnimationFrame(frame);
    }

    // ─── Typewriter ───
    function typewrite(el, text, speed) {
        el.textContent = '';
        let i = 0;
        function step() {
            if (i < text.length) {
                el.textContent += text[i++];
                setTimeout(step, speed);
            }
        }
        step();
    }

    // ─── End screen ───
    function showEnd() {
        showScreen('end');
        if (window.BrainSmacks) BrainSmacks.showRecommendations($('end-recommendations'));
        const total = rounds.length;

        // Animate score count-up
        const scoreEl = $('end-score');
        let count = 0;
        scoreEl.textContent = '0 / ' + total;
        const countInterval = setInterval(() => {
            count++;
            scoreEl.textContent = count + ' / ' + total;
            if (count >= score) clearInterval(countInterval);
        }, 300);

        // Recap dots with staggered pop-in
        const recap = $('end-recap');
        recap.innerHTML = '';
        results.forEach((r, i) => {
            const dot = document.createElement('span');
            dot.className = 'recap-dot';
            dot.textContent = r ? '🟩' : '🟥';
            recap.appendChild(dot);
            setTimeout(() => dot.classList.add('visible'), 400 + i * 250);
        });
    }

    // ─── Share ───
    function shareResults() {
        const modeStr = mode === 'campaign' ? 'Campaign' : 'Wildcard';
        const dots = results.map(r => r ? '🟩' : '🟥').join('');
        const text = `⚖️ Heavy Eye ${modeStr}\n${score}/${rounds.length} ${dots}`;
        navigator.clipboard.writeText(text).then(() => {
            $('share-btn').classList.add('copied');
            setTimeout(() => $('share-btn').classList.remove('copied'), 2000);
        });
    }

    // ─── Events ───
    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            SFX.start();
            pickRounds(btn.dataset.mode);
            showScreen('game');
            setTimeout(() => startRound(), 300);
        });
    });

    cardLeft.addEventListener('click', () => !revealed && handlePick('left'));
    cardRight.addEventListener('click', () => !revealed && handlePick('right'));

    $('next-btn').addEventListener('click', () => {
        SFX.next();
        roundIndex++;
        if (roundIndex >= rounds.length) {
            showEnd();
            SFX.end();
        } else {
            startRound();
        }
    });

    $('play-again-btn').addEventListener('click', () => {
        SFX.start();
        pickRounds(mode);
        showScreen('game');
        setTimeout(() => startRound(), 300);
    });
    $('home-btn').addEventListener('click', () => window.location.href = '../');
    $('exit-btn').addEventListener('click', () => window.location.href = '../');

    // ─── Init ───
    initScales();
})();
