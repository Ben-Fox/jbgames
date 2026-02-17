/**
 * BrainSmacks — End-of-Game Recommendation Cards
 * Include this script in any game page. Call showRecommendations(containerEl) at game end.
 * Or it auto-injects if it detects known end-screen patterns.
 */
(function() {
  const ALL_GAMES = [
    { name: 'Heavy Eye',    emoji: '⚖️', path: '/heavyeye/',    color: '#f59e0b', desc: 'Guess the weight' },
    { name: 'Circle',       emoji: '✏️', path: '/circle/',      color: '#e2e8f0', desc: 'Draw perfection' },
    { name: 'BreakPoint',   emoji: '🃏', path: '/breakpoint/',  color: '#ef4444', desc: 'Card duel vs AI' },
    { name: 'Likelihood',   emoji: '🎲', path: '/likelihood/',  color: '#a78bfa', desc: 'Probability trivia' },
    { name: 'Fill or Spill',emoji: '🫗', path: '/fillOrSpill/', color: '#3b82f6', desc: '2-player fill game' },
    { name: 'Zoom Out',     emoji: '🔍', path: '/zoomout/',     color: '#10b981', desc: 'Guess the zoomed image' },
    { name: 'Magnitude',    emoji: '🏢', path: '/magnitude/',   color: '#f97316', desc: 'Survive the quake' },
    { name: 'Shatterform',  emoji: '🔷', path: '/shatterform/', color: '#06b6d4', desc: 'Hex grow & shatter' },
    { name: 'Catastrophe',  emoji: '🐱', path: '/catastrophe/', color: '#ec4899', desc: 'Cat chaos' },
  ];

  // Determine current game from path
  const currentPath = window.location.pathname.replace(/\/+$/, '/');

  function getRecommendations(count) {
    const others = ALL_GAMES.filter(g => !currentPath.endsWith(g.path) && currentPath.indexOf(g.path) === -1);
    // Shuffle and pick
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    return others.slice(0, count || 3);
  }

  function createRecommendationCards() {
    const games = getRecommendations(3);
    const wrapper = document.createElement('div');
    wrapper.className = 'bs-rec-cards';
    wrapper.innerHTML = '<div class="bs-rec-label">Try next</div><div class="bs-rec-row">' +
      games.map(g => `<a href="${g.path}" class="bs-rec-card" style="--accent:${g.color}">
        <span class="bs-rec-emoji">${g.emoji}</span>
        <span class="bs-rec-name">${g.name}</span>
      </a>`).join('') + '</div>';
    return wrapper;
  }

  // Inject styles once
  const style = document.createElement('style');
  style.textContent = `
    .bs-rec-cards{margin-top:1.2rem;text-align:center;animation:bsRecFadeIn .5s ease both;animation-delay:.3s}
    .bs-rec-label{font-size:.75rem;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem;font-family:'Space Grotesk',system-ui,sans-serif}
    .bs-rec-row{display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap}
    .bs-rec-card{display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.6rem .8rem;
      background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;
      text-decoration:none;color:#f0f0f0;font-family:'Space Grotesk',system-ui,sans-serif;
      transition:transform .2s,border-color .2s,box-shadow .2s;min-width:100px;cursor:pointer}
    .bs-rec-card:hover{transform:translateY(-3px);border-color:var(--accent,#888);box-shadow:0 4px 16px rgba(0,0,0,.3)}
    .bs-rec-emoji{font-size:1.5rem}
    .bs-rec-name{font-size:.8rem;font-weight:600;white-space:nowrap}
    @keyframes bsRecFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  `;
  document.head.appendChild(style);

  // Expose globally
  window.BrainSmacks = window.BrainSmacks || {};
  window.BrainSmacks.createRecommendationCards = createRecommendationCards;
  window.BrainSmacks.showRecommendations = function(container) {
    if (!container) return;
    // Remove existing if re-shown
    const existing = container.querySelector('.bs-rec-cards');
    if (existing) existing.remove();
    container.appendChild(createRecommendationCards());
  };
})();
