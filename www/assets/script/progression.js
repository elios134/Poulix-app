// ─────────────────────────────────────────────
// PROGRESSION — XP, Niveaux, Succès, Défis quotidiens
// ─────────────────────────────────────────────

// ─── Niveaux ───
const LEVELS = [
    { level: 1,  xpRequired: 0,    title: 'Poussin',      reward: 0   },
    { level: 2,  xpRequired: 100,  title: 'Oisillon',     reward: 50  },
    { level: 3,  xpRequired: 250,  title: 'Plumeux',      reward: 80  },
    { level: 4,  xpRequired: 500,  title: 'Volailleur',   reward: 100 },
    { level: 5,  xpRequired: 900,  title: 'Flapmaster',   reward: 150 },
    { level: 6,  xpRequired: 1400, title: 'Aéronaute',    reward: 200 },
    { level: 7,  xpRequired: 2000, title: 'Esquiveur',    reward: 250 },
    { level: 8,  xpRequired: 2800, title: 'Chasseur',     reward: 300 },
    { level: 9,  xpRequired: 3800, title: 'Légende',      reward: 400 },
    { level: 10, xpRequired: 5000, title: 'GOD CHICKEN',  reward: 500 },
];

// ─── Succès ───
const ACHIEVEMENTS = [
    { id: 'first_game',    title: 'Premier vol',     desc: 'Joue ta première partie',          xp: 20,  check: (s) => s.gamesPlayed >= 1 },
    { id: 'score_10',      title: 'Débutant',        desc: 'Atteins un score de 10',           xp: 30,  check: (s) => s.bestClassic >= 10 || s.bestMario >= 10 },
    { id: 'score_20',      title: 'Intermédiaire',   desc: 'Atteins un score de 20',           xp: 50,  check: (s) => s.bestClassic >= 20 || s.bestMario >= 20 },
    { id: 'score_50',      title: 'Expert',          desc: 'Atteins un score de 50',           xp: 100, check: (s) => s.bestClassic >= 50 || s.bestMario >= 50 },
    { id: 'mario_10',      title: 'Esquiveur',       desc: 'Esquive 10 boules en mode Mario',  xp: 40,  check: (s) => s.bestMario >= 10 },
    { id: 'mario_30',      title: 'Ninja',           desc: 'Esquive 30 boules en mode Mario',  xp: 80,  check: (s) => s.bestMario >= 30 },
    { id: 'games_10',      title: 'Habitué',         desc: 'Joue 10 parties',                  xp: 50,  check: (s) => s.gamesPlayed >= 10 },
    { id: 'games_50',      title: 'Accro',           desc: 'Joue 50 parties',                  xp: 100, check: (s) => s.gamesPlayed >= 50 },
    { id: 'buy_skin',      title: 'Fashionista',     desc: 'Achète un skin',                   xp: 30,  check: (s) => s.skinsOwned >= 2 },
    { id: 'all_skins',     title: 'Collectionneur',  desc: 'Possède tous les skins',            xp: 200, check: (s) => s.skinsOwned >= 6 },
    { id: 'record_beat',   title: 'Record brisé',    desc: 'Bats ton propre record',           xp: 40,  check: (s) => s.recordBeaten >= 1 },
];

// ─── Défis quotidiens ───
const DAILY_POOL = [
    { id: 'd_score5',   title: 'Score 5',        desc: 'Atteins 5 points en une partie',       target: 5,  type: 'score',      reward: 30  },
    { id: 'd_score15',  title: 'Score 15',        desc: 'Atteins 15 points en une partie',      target: 15, type: 'score',      reward: 60  },
    { id: 'd_score25',  title: 'Score 25',        desc: 'Atteins 25 points en une partie',      target: 25, type: 'score',      reward: 100 },
    { id: 'd_play3',    title: 'Joueur du jour',  desc: 'Joue 3 parties aujourd\'hui',          target: 3,  type: 'gamestoday', reward: 40  },
    { id: 'd_play5',    title: 'Entraîneur',      desc: 'Joue 5 parties aujourd\'hui',          target: 5,  type: 'gamestoday', reward: 70  },
    { id: 'd_mario5',   title: 'Esquiveur',       desc: 'Esquive 5 boules en mode Mario',       target: 5,  type: 'marioscore', reward: 50  },
    { id: 'd_classic5', title: 'Tuyautier',       desc: 'Passe 5 tuyaux en mode classique',     target: 5,  type: 'classicscore', reward: 50 },
    { id: 'd_nodie',    title: 'Intouchable',     desc: 'Score 3 sans mourir sur le sol',       target: 3,  type: 'score',      reward: 80  },
];

// ─── Persistance stats ───
function getStats() {
    const def = {
        xp: 0, level: 1,
        gamesPlayed: 0,
        bestClassic: 0,
        bestMario: 0,
        skinsOwned: 1,
        recordBeaten: 0,
        gamesPlayedToday: 0,
        lastPlayDate: '',
        unlockedAchievements: [],
        dailyChallenge: null,
        dailyChallengeProgress: 0,
        dailyChallengeCompleted: false,
    };
    try {
        return Object.assign(def, JSON.parse(localStorage.getItem('px_stats') || '{}'));
    } catch(e) { return def; }
}

function saveStats(s) {
    localStorage.setItem('px_stats', JSON.stringify(s));
}

function getXP()    { return getStats().xp; }
function getLevel() { return getStats().level; }

function getLevelData(level) {
    return LEVELS.find(l => l.level === level) || LEVELS[LEVELS.length - 1];
}

function getNextLevelData(level) {
    return LEVELS.find(l => l.level === level + 1) || null;
}

function getXPProgress() {
    const s    = getStats();
    const curr = getLevelData(s.level);
    const next = getNextLevelData(s.level);
    if (!next) return { current: s.xp, required: s.xp, percent: 100 };
    const xpInLevel  = s.xp - curr.xpRequired;
    const xpNeeded   = next.xpRequired - curr.xpRequired;
    return {
        current:  xpInLevel,
        required: xpNeeded,
        percent:  Math.min(100, Math.floor(xpInLevel / xpNeeded * 100)),
    };
}

// ─── Ajouter XP et vérifier level up ───
// Retourne { leveledUp, newLevel, reward } ou null
function addXP(amount) {
    const s = getStats();
    s.xp += amount;
    const oldLevel = s.level;

    // Vérifier level up
    let newLevel = oldLevel;
    for (const l of LEVELS) {
        if (s.xp >= l.xpRequired) newLevel = l.level;
    }

    let result = null;
    if (newLevel > oldLevel) {
        s.level = newLevel;
        const reward = getLevelData(newLevel).reward;
        result = { leveledUp: true, newLevel, title: getLevelData(newLevel).title, reward };
        addCoins(reward);
    }

    saveStats(s);
    return result;
}

// ─── Mettre à jour les stats après une partie ───
// Retourne les nouveaux succès débloqués
function updateStatsAfterGame(gameMode, score, currentBest) {
    const s = getStats();
    s.gamesPlayed++;

    // Vérifier date pour les parties du jour
    const today = new Date().toDateString();
    if (s.lastPlayDate !== today) {
        s.gamesPlayedToday = 0;
        s.lastPlayDate = today;
    }
    s.gamesPlayedToday++;

    // Mettre à jour bests
    if (gameMode === 'classic' && score > s.bestClassic) {
        s.bestClassic = score;
        s.recordBeaten++;
    }
    if (gameMode === 'mario' && score > s.bestMario) {
        s.bestMario = score;
        s.recordBeaten++;
    }

    // Skins possédés
    s.skinsOwned = getUnlocked().length;

    // Défi quotidien
    updateDailyChallengeProgress(s, gameMode, score);

    saveStats(s);

    // Vérifier nouveaux succès
    const newlyUnlocked = [];
    for (const ach of ACHIEVEMENTS) {
        if (!s.unlockedAchievements.includes(ach.id) && ach.check(s)) {
            s.unlockedAchievements.push(ach.id);
            newlyUnlocked.push(ach);
            addXP(ach.xp);
        }
    }
    saveStats(s);

    // XP de base pour avoir joué
    const baseXP = Math.max(5, Math.floor(score * 1.5));
    const levelResult = addXP(baseXP);

    return { newlyUnlocked, baseXP, levelResult };
}

// ─── Défi quotidien ───
function initDailyChallenge() {
    const s = getStats();
    const today = new Date().toDateString();

    // Nouveau défi chaque jour
    if (!s.dailyChallenge || s.dailyChallenge.date !== today) {
        const idx = Math.floor(new Date().getDate() % DAILY_POOL.length);
        s.dailyChallenge = { ...DAILY_POOL[idx], date: today };
        s.dailyChallengeProgress  = 0;
        s.dailyChallengeCompleted = false;
        saveStats(s);
    }
    return s.dailyChallenge;
}

function updateDailyChallengeProgress(s, gameMode, score) {
    if (!s.dailyChallenge || s.dailyChallengeCompleted) return;
    const c = s.dailyChallenge;

    if (c.type === 'score'        && score >= c.target)                            s.dailyChallengeProgress = c.target;
    if (c.type === 'gamestoday')                                                    s.dailyChallengeProgress = s.gamesPlayedToday;
    if (c.type === 'marioscore'   && gameMode === 'mario'   && score >= c.target)  s.dailyChallengeProgress = c.target;
    if (c.type === 'classicscore' && gameMode === 'classic' && score >= c.target)  s.dailyChallengeProgress = c.target;

    if (s.dailyChallengeProgress >= c.target && !s.dailyChallengeCompleted) {
        s.dailyChallengeCompleted = true;
        addCoins(c.reward);
        addXP(50);
    }
}

function getDailyStatus() {
    const s = getStats();
    return {
        challenge:   s.dailyChallenge,
        progress:    s.dailyChallengeProgress || 0,
        completed:   s.dailyChallengeCompleted || false,
    };
}

// ─── Rendu DOM — écran progression ───
function renderProgression() {
    const s    = getStats();
    const prog = getXPProgress();
    const lvl  = getLevelData(s.level);
    const next = getNextLevelData(s.level);
    const daily = getDailyStatus();

    // Niveau + XP
    document.getElementById('prog-level').textContent   = `NIVEAU ${s.level}`;
    document.getElementById('prog-title').textContent   = lvl.title;
    document.getElementById('prog-xp').textContent      = next
        ? `${prog.current} / ${prog.required} XP`
        : 'NIVEAU MAX';
    document.getElementById('prog-bar-fill').style.width = prog.percent + '%';

    // Stats
    document.getElementById('prog-games').textContent   = s.gamesPlayed;
    document.getElementById('prog-best-c').textContent  = s.bestClassic;
    document.getElementById('prog-best-m').textContent  = s.bestMario;

    // Défi du jour
    if (daily.challenge) {
        document.getElementById('daily-title').textContent = daily.challenge.title;
        document.getElementById('daily-desc').textContent  = daily.challenge.desc;
        document.getElementById('daily-reward').textContent = `🪙 ${daily.challenge.reward}`;
        const pct = Math.min(100, Math.floor(daily.progress / daily.challenge.target * 100));
        document.getElementById('daily-bar-fill').style.width = pct + '%';
        document.getElementById('daily-progress').textContent =
            daily.completed ? '✔ COMPLÉTÉ !' : `${daily.progress} / ${daily.challenge.target}`;
        document.getElementById('daily-progress').style.color =
            daily.completed ? '#00ffc8' : 'rgba(255,255,255,0.5)';
    }

    // Succès
    const grid = document.getElementById('ach-grid');
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
        const done = s.unlockedAchievements.includes(ach.id);
        const div  = document.createElement('div');
        div.className = 'ach-card' + (done ? ' done' : '');
        div.innerHTML = `
            <div class="ach-icon">${done ? '✅' : '🔒'}</div>
            <div class="ach-name">${ach.title}</div>
            <div class="ach-desc">${ach.desc}</div>
            <div class="ach-xp">+${ach.xp} XP</div>
        `;
        grid.appendChild(div);
    });
}
