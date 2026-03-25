// ─────────────────────────────────────────────
// LEADERBOARD — Top 10 scores locaux
// ─────────────────────────────────────────────

function getLeaderboard(mode) {
    const key = mode === 'mario' ? 'px_lb_mario' : 'px_lb_classic';
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch(e) { return []; }
}

function saveLeaderboard(mode, data) {
    const key = mode === 'mario' ? 'px_lb_mario' : 'px_lb_classic';
    localStorage.setItem(key, JSON.stringify(data));
}

// Ajoute un score et retourne le nouveau classement
// Retourne aussi le rang obtenu (1-10) ou null si hors top 10
function addLeaderboardEntry(mode, score) {
    const lb = getLeaderboard(mode);
    const date = new Date().toLocaleDateString('fr-FR');
    lb.push({ score, date });
    lb.sort((a, b) => b.score - a.score);
    const trimmed = lb.slice(0, 10);
    saveLeaderboard(mode, trimmed);
    const rank = trimmed.findIndex(e => e.score === score && e.date === date) + 1;
    return rank > 0 ? rank : null;
}

function renderLeaderboard(mode) {
    const lb  = getLeaderboard(mode);
    const list = document.getElementById('lb-list');
    list.innerHTML = '';

    // Titre
    document.getElementById('lb-mode-title').textContent =
        mode === 'mario' ? '🍄 BOSS MARIO' : '🐔 CLASSIQUE';

    if (lb.length === 0) {
        list.innerHTML = '<div class="lb-empty">Aucun score encore</div>';
        return;
    }

    lb.forEach((entry, i) => {
        const div = document.createElement('div');
        div.className = 'lb-row' + (i === 0 ? ' gold' : i === 1 ? ' silver' : i === 2 ? ' bronze' : '');
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        div.innerHTML = `
            <span class="lb-rank">${medal}</span>
            <span class="lb-score">${String(entry.score).padStart(4, '0')}</span>
            <span class="lb-date">${entry.date}</span>
        `;
        list.appendChild(div);
    });
}
