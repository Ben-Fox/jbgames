/**
 * BrainSmacks — End-of-Game Recommendation Cards
 * Mini versions of homepage game cards. Only published games.
 */
(function() {
  // Only include games that are on the landing page (published)
  const ALL_GAMES = [
    {
      name: 'Heavy Eye', path: '/heavyeye/',
      gradient: 'linear-gradient(160deg,#1a1508 0%,#2d1f04 40%,#3d2906 100%)',
      border: 'rgba(245,158,11,.25)',
      thumb: '<svg viewBox="0 0 80 60" fill="none" width="80" height="60"><rect x="35" y="52" width="10" height="3" rx="1.5" fill="#d97706"/><rect x="39" y="25" width="2" height="28" rx="1" fill="#fbbf24"/><circle cx="40" cy="23" r="3" fill="#f59e0b"/><line x1="18" y1="23" x2="62" y2="23" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="18" cy="38" rx="10" ry="3" fill="rgba(245,158,11,.3)" stroke="#fbbf24" stroke-width="1"/><ellipse cx="62" cy="38" rx="10" ry="3" fill="rgba(245,158,11,.3)" stroke="#fbbf24" stroke-width="1"/><line x1="18" y1="23" x2="12" y2="37" stroke="#fbbf24" stroke-width=".8"/><line x1="18" y1="23" x2="24" y2="37" stroke="#fbbf24" stroke-width=".8"/><line x1="62" y1="23" x2="56" y2="37" stroke="#fbbf24" stroke-width=".8"/><line x1="62" y1="23" x2="68" y2="37" stroke="#fbbf24" stroke-width=".8"/><circle cx="18" cy="33" r="3" fill="rgba(245,158,11,.4)"/><text x="62" y="36" text-anchor="middle" font-size="6" fill="#fbbf24" font-weight="700">?</text></svg>'
    },
    {
      name: 'Circle', path: '/circle/',
      gradient: 'linear-gradient(160deg,#0f1115 0%,#1a1c24 40%,#22252e 100%)',
      border: 'rgba(226,232,240,.2)',
      thumb: '<svg viewBox="0 0 80 60" fill="none" width="80" height="60"><rect x="5" y="5" width="70" height="50" rx="4" fill="#2d3748" opacity=".5"/><circle cx="40" cy="30" r="18" fill="none" stroke="rgba(226,232,240,.4)" stroke-width="1" stroke-dasharray="3 2"/><path d="M25,38 C28,18 38,14 44,14 C52,14 58,22 56,34 C54,42 46,46 40,45 C34,44 24,44 25,38Z" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/><text x="40" y="55" text-anchor="middle" font-size="6" fill="#e2e8f0" opacity=".6">87%</text></svg>'
    },
    {
      name: 'BreakPoint', path: '/breakpoint/',
      gradient: 'linear-gradient(160deg,#1a0808 0%,#2d0f0f 40%,#3d1515 100%)',
      border: 'rgba(239,68,68,.25)',
      thumb: '<svg viewBox="0 0 80 60" fill="none" width="80" height="60"><rect x="10" y="8" width="22" height="30" rx="3" fill="#1a1a2e" stroke="#ef4444" stroke-width="1.5"/><text x="21" y="20" text-anchor="middle" font-size="8" fill="#ef4444" font-weight="700">A</text><text x="21" y="32" text-anchor="middle" font-size="7" fill="#ef4444">♠</text><rect x="48" y="8" width="22" height="30" rx="3" fill="#1a1a2e" stroke="#666" stroke-width="1.5"/><text x="59" y="20" text-anchor="middle" font-size="8" fill="#888">?</text><text x="59" y="32" text-anchor="middle" font-size="7" fill="#888">?</text><text x="40" y="52" text-anchor="middle" font-size="7" fill="#ef4444" font-weight="700">VS</text></svg>'
    },
    {
      name: 'Likelihood', path: '/likelihood/',
      gradient: 'linear-gradient(160deg,#0f0a1a 0%,#1a1128 40%,#251838 100%)',
      border: 'rgba(167,139,250,.25)',
      thumb: '<svg viewBox="0 0 80 60" fill="none" width="80" height="60"><text x="40" y="28" text-anchor="middle" font-size="22" fill="rgba(167,139,250,.3)" font-weight="700">%</text><rect x="12" y="35" width="8" height="14" rx="1.5" fill="rgba(167,139,250,.4)"/><rect x="24" y="28" width="8" height="21" rx="1.5" fill="rgba(167,139,250,.5)"/><rect x="36" y="22" width="8" height="27" rx="1.5" fill="rgba(167,139,250,.6)"/><rect x="48" y="32" width="8" height="17" rx="1.5" fill="rgba(167,139,250,.45)"/><rect x="60" y="38" width="8" height="11" rx="1.5" fill="rgba(167,139,250,.35)"/></svg>'
    },
    {
      name: 'Fivefold', path: '/fivefold/', textColor: '#1a1814',
      gradient: 'linear-gradient(160deg,#f5f0e8 0%,#ede8db 40%,#e4ddd0 100%)',
      border: 'rgba(184,134,11,.3)',
      thumb: '<svg viewBox="0 0 80 60" fill="none" width="80" height="60"><text x="22" y="30" font-size="16" fill="#1a1814" font-weight="700" font-family="serif">Five</text><text x="52" y="30" font-size="16" fill="#b8860b" font-weight="700" font-family="serif">fold</text><rect x="8" y="38" width="12" height="16" rx="2" fill="#ede8db" stroke="rgba(26,24,20,.15)"/><rect x="8" y="38" width="12" height="2" fill="#b8860b"/><rect x="23" y="38" width="12" height="16" rx="2" fill="#ede8db" stroke="rgba(26,24,20,.15)"/><rect x="23" y="38" width="12" height="2" fill="#4a6741"/><rect x="38" y="38" width="12" height="16" rx="2" fill="#ede8db" stroke="rgba(26,24,20,.15)"/><rect x="38" y="38" width="12" height="2" fill="#3d4f5c"/><rect x="53" y="38" width="12" height="16" rx="2" fill="#ede8db" stroke="rgba(26,24,20,.15)"/><rect x="53" y="38" width="12" height="2" fill="#8b3a2a"/><rect x="68" y="38" width="12" height="16" rx="2" fill="#ede8db" stroke="rgba(26,24,20,.15)"/><rect x="68" y="38" width="12" height="2" fill="#6b3a7d"/></svg>'
    },
  ];

  const currentPath = window.location.pathname.replace(/\/+$/, '/');

  function getRecommendations(count) {
    const others = ALL_GAMES.filter(g => !currentPath.endsWith(g.path) && currentPath.indexOf(g.path) === -1);
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
      games.map(g => `<a href="${g.path}" class="bs-rec-card" style="background:${g.gradient};border-color:${g.border}${g.textColor ? ';color:'+g.textColor : ''}">
        <div class="bs-rec-thumb">${g.thumb}</div>
        <span class="bs-rec-name">${g.name}</span>
      </a>`).join('') + '</div>';
    return wrapper;
  }

  const style = document.createElement('style');
  style.textContent = `
    .bs-rec-cards{margin-top:1.2rem;text-align:center;animation:bsRecFadeIn .5s ease both;animation-delay:.3s}
    .bs-rec-label{font-size:.7rem;color:#888;text-transform:uppercase;letter-spacing:2px;margin-bottom:.6rem;font-family:'Space Grotesk',system-ui,sans-serif}
    .bs-rec-row{display:flex;gap:.7rem;justify-content:center;flex-wrap:wrap}
    .bs-rec-card{display:flex;flex-direction:column;align-items:center;gap:.3rem;padding:.7rem .8rem .6rem;
      border:1px solid rgba(255,255,255,.1);border-radius:14px;
      text-decoration:none;color:#f0f0f0;font-family:'Space Grotesk',system-ui,sans-serif;
      transition:transform .2s,border-color .2s,box-shadow .2s;min-width:100px;max-width:120px;cursor:pointer}
    .bs-rec-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.4)}
    .bs-rec-thumb{display:flex;align-items:center;justify-content:center;height:50px;overflow:hidden}
    .bs-rec-thumb svg{width:70px;height:auto}
    .bs-rec-name{font-size:.75rem;font-weight:600;white-space:nowrap}
    @keyframes bsRecFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  `;
  document.head.appendChild(style);

  window.BrainSmacks = window.BrainSmacks || {};
  window.BrainSmacks.createRecommendationCards = createRecommendationCards;
  window.BrainSmacks.showRecommendations = function(container) {
    if (!container) return;
    const existing = container.querySelector('.bs-rec-cards');
    if (existing) existing.remove();
    container.appendChild(createRecommendationCards());
  };
})();
