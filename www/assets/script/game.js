'use strict';

window.onerror = function (msg, src, line) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;font-size:12px;padding:8px;z-index:9999;word-break:break-all;';
    div.textContent = `ERREUR ligne ${line}: ${msg}`;
    document.body.appendChild(div);
};

// ─── Canvas ───
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ─── Constantes fixes ───
const GROUND_H = 80;
const PIPE_W   = 8 * PX;
const GRAVITY  = 0.42;
const FLAP_PWR = -7.5;
const BIRD_W   = 8 * PX;
const BIRD_H   = 8 * PX;

// ─── Difficulté progressive équilibrée ───
const PIPE_GAP_MIN  = 115;  // 100 était un peu trop cruel, 115 offre un challenge plus juste
const PIPE_GAP_BASE = 170;  // On part d'un poil plus large pour faciliter les premiers tuyaux
const PIPE_SPD_BASE = 3.0;  // Vitesse de départ légèrement ralentie

function getPipeGap(s)      { return Math.max(PIPE_GAP_MIN, PIPE_GAP_BASE - s * 1.2); }
function getPipeSpeed(s)    { return Math.min(5.5, PIPE_SPD_BASE + s * 0.03); } 
function getPipeInterval(s) { return Math.max(900, 1400 - s * 8); }

// ─── État global ───
let state    = 'mainmenu';
let gameMode = 'classic';
let score    = 0;
let best     = 0;

let bird, pipes;
let groundOffset    = 0;
let birdFrame       = 0;
let birdFrameTimer  = 0;
let screenShake     = 0;
let deathTimer      = 0;
let pipeTimer       = 0;
let bobTimer        = 0;
let marioCombo      = 0;
let marioComboTimer = 0;

// ─────────────────────────────────────────────
// INIT PARTIE
// ─────────────────────────────────────────────

function initGame() {
    bird = { x: canvas.width * 0.25, y: canvas.height * 0.45, vy: 0, rot: 0 };
    pipes = []; score = 0; groundOffset = 0; birdFrame = 0;
    screenShake = 0; deathTimer = 0; pipeTimer = 0; bobTimer = 0;
    marioCombo = 0; marioComboTimer = 0;
    resetFireballs();
    resetFlameTrail();
    if (gameMode === 'classic') resetPowerups();
    if (gameMode === 'mario')   initMarioPipe(canvas.height);
    updateScoreDOM();
}

// ─────────────────────────────────────────────
// TUYAUX
// ─────────────────────────────────────────────

function spawnPipe() {
    const groundY = canvas.height - GROUND_H;
    const gap     = getPipeGap(score);
    
    const minTopH = 80;
    // On s'assure que maxTopH n'est pas inférieur à minTopH sur les très petits écrans
    const maxTopH = Math.max(minTopH, groundY - gap - 80);
    
    let topH;
    if (pipes.length > 0) {
        const lastTopH = pipes[pipes.length - 1].topH;
        const maxVariation = 130; // La différence maximale de hauteur autorisée
        
        const clampedMin = Math.max(minTopH, lastTopH - maxVariation);
        const clampedMax = Math.min(maxTopH, lastTopH + maxVariation);
        
        topH = clampedMin + Math.random() * (clampedMax - clampedMin);
    } else {
        // Premier tuyau de la partie : position purement aléatoire
        topH = minTopH + Math.random() * (maxTopH - minTopH);
    }

    pipes.push({
        x: canvas.width + PIPE_W,
        topH,
        botY: topH + gap,
        botH: groundY - (topH + gap),
        scored: false,
    });
}

// ─────────────────────────────────────────────
// FLAP
// ─────────────────────────────────────────────

function flap() {
    if (state === 'ready') {
        state = 'playing';
        hideScreen('ready-screen');
        bird.vy = FLAP_PWR;
        SFX.flap();
        return;
    }
    if (state === 'playing') { bird.vy = FLAP_PWR; SFX.flap(); }
}

// ─────────────────────────────────────────────
// PAUSE
// ─────────────────────────────────────────────

function togglePause() {
    if (state === 'playing') {
        state = 'paused';
        showScreen('pause-screen');
        hideScreen('score-display-wrap');
    } else if (state === 'paused') {
        state = 'playing';
        hideScreen('pause-screen');
        showScreen('score-display-wrap');
    }
}

// ─────────────────────────────────────────────
// COLLISIONS
// ─────────────────────────────────────────────

function checkCollisions() {
    const groundY = canvas.height - GROUND_H;
    // Hitbox réduite à 50% (au lieu de 70%) pour pardonner les frôlements des ailes
    const bx = bird.x - BIRD_W * 0.25;
    const by = bird.y - BIRD_H * 0.25;
    const bw = BIRD_W * 0.5;
    const bh = BIRD_H * 0.5;

    if (bird.y + BIRD_H / 2 >= groundY || bird.y - BIRD_H / 2 <= 0) return true;

    if (gameMode === 'classic') {
        for (const p of pipes) {
            // On retire 2px de chaque côté du tuyau au lieu d'en rajouter
            const px = p.x + 2, pw = PIPE_W - 4;
            if (bx < px + pw && bx + bw > px && by < p.topH)     return true;
            if (bx < px + pw && bx + bw > px && by + bh > p.botY) return true;
        }
    }

    if (gameMode === 'mario' && checkFireballCollision(bird.x, bird.y, BIRD_W, BIRD_H)) return true;

    return false;
}

// ─────────────────────────────────────────────
// MISE À JOUR
// ─────────────────────────────────────────────

function isFireSkin() {
    return getActiveSkin() === 'fire';
}

function update(dt) {
    if (state === 'ready') {
        bobTimer += 0.05;
        bird.y    = canvas.height * 0.45 + Math.sin(bobTimer) * 6;
        bird.rot  = 0;
        groundOffset += gameMode === 'classic'
            ? getPipeSpeed(0) * getSlowMult()
            : PIPE_SPD_BASE;
        birdFrameTimer += dt;
        if (birdFrameTimer > 120) {
            birdFrameTimer = 0;
            birdFrame = (birdFrame + 1) % BIRD_FRAMES.length;
        }
        return;
    }

    if (state !== 'playing') return;

    bird.vy += GRAVITY;
    bird.vy  = Math.min(bird.vy, 12);
    bird.y  += bird.vy;
    bird.rot = Math.max(-25, Math.min(90, bird.vy * 4.5));

    birdFrameTimer += dt;
    if (birdFrameTimer > 100) {
        birdFrameTimer = 0;
        birdFrame = (birdFrame + 1) % BIRD_FRAMES.length;
    }

    groundOffset += gameMode === 'classic'
        ? getPipeSpeed(score) * getSlowMult()
        : PIPE_SPD_BASE;

    if (isFireSkin()) {
        spawnFlame(bird.x, bird.y);
        spawnFlame(bird.x, bird.y);
    }
    updateFlameTrail();

    if (gameMode === 'classic') {
        pipeTimer += dt;
        if (pipeTimer >= getPipeInterval(score)) { pipeTimer = 0; spawnPipe(); }

        const spd = getPipeSpeed(score) * getSlowMult();
        pipes.forEach(p => { p.x -= spd; });
        pipes = pipes.filter(p => p.x + PIPE_W > -50);

        pipes.forEach(p => {
            if (!p.scored && p.x + PIPE_W < bird.x) {
                p.scored = true;
                const pts = getScoreMult();
                score += pts;
                if (score > best) { best = score; localStorage.setItem('fb_best_classic', best); }
                updateScoreDOM();
                SFX.score();
            }
        });

        trySpawnPowerup(dt, score, canvas.width, canvas.height);
        updatePowerups(dt, score, bird, (type) => {
            SFX.achievement();
            showPowerupToast(type);
        });
    }

    if (gameMode === 'mario') {
        updateMarioPipe(dt, score);
        updateFireballs(dt, score, canvas.width, canvas.height, bird, () => {
            score++;
            marioCombo++;
            marioComboTimer = 90;
            if (score > best) { best = score; localStorage.setItem('fb_best_mario', best); }
            updateScoreDOM();
            if (typeof SFX.combo === 'function') SFX.combo(marioCombo);
            if (marioCombo > 1) showComboToast(marioCombo);
        });
        if (marioComboTimer > 0) { marioComboTimer--; } else { marioCombo = 0; }
    }

    if (gameMode === 'classic') {
        updateShootingStars(dt, canvas.width, canvas.height);
        updatePlanets(canvas.width);
    }

    if (checkCollisions()) {
        state       = 'dead';
        screenShake = 10;
        deathTimer  = 60;
        spawnExplosion(bird.x, bird.y, getActivePal()[0], 20);
        spawnExplosion(bird.x, bird.y, '#ffffff', 8);
        SFX.hit();
        setTimeout(() => SFX.die(), 200);
        if (gameMode === 'mario') setTimeout(() => SFX.marioLaugh(), 500);
    }

    if (screenShake > 0) screenShake = Math.max(0, screenShake - 0.6);
    updateParticles();
}

// ─────────────────────────────────────────────
// DESSIN
// ─────────────────────────────────────────────

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height - GROUND_H);
    grad.addColorStop(0,   '#010a1a');
    grad.addColorStop(0.6, '#020f28');
    grad.addColorStop(1,   '#051830');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBird() {
    const pal = getActivePal();
    if (isFireSkin()) drawFlameTrail(ctx);

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.rot * Math.PI) / 180);
    drawSprite(ctx, BIRD_FRAMES[birdFrame], -BIRD_W / 2, -BIRD_H / 2, pal);
    ctx.restore();
}

function drawScene() {
    if (screenShake > 0) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    if (gameMode === 'mario') {
        drawMarioBackground(ctx, canvas.width, canvas.height, groundOffset, score);
    } else {
        drawBackground();
        drawPlanets(ctx);
        drawShootingStars(ctx);
        drawStars(ctx);
    }

    if (gameMode === 'classic') {
        pipes.forEach(p => {
            if (p.topH > 0) drawPipe(ctx, p.x, 0, p.topH, true);
            drawPipe(ctx, p.x, p.botY, p.botH, false);
        });
        drawPowerups(ctx);
        drawPowerupHUD(ctx, canvas.width);
    }

    if (gameMode === 'mario') {
        drawMarioPipe(ctx, canvas.width, canvas.height, score);
        drawFireballs(ctx);
    }

    drawGround(ctx, canvas.width, canvas.height - GROUND_H, groundOffset);
    drawParticles(ctx);
    drawBird();

    if (screenShake > 0) ctx.restore();
}

// ─────────────────────────────────────────────
// ÉCRANS DOM
// ─────────────────────────────────────────────

function getEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`Poulpix: élément DOM introuvable: ${id}`);
    return el;
}
function showScreen(id) {
    const el = getEl(id);
    if (el) el.classList.add('visible');
}
function hideScreen(id) {
    const el = getEl(id);
    if (el) el.classList.remove('visible');
}
function setText(id, value) {
    const el = getEl(id);
    if (el) el.textContent = value;
}
function updateScoreDOM() { setText('score-display', String(score)); }

// ─────────────────────────────────────────────
// GAME OVER
// ─────────────────────────────────────────────

function showGameOver() {
    const coinMult = gameMode === 'mario' ? 2 : 1;
    const earned   = score * coinMult;

    addCoins(earned);
    updateCoinDisplay();
    window._pendingEarned = earned;

    if (typeof addLeaderboardEntry === 'function') addLeaderboardEntry(gameMode, score);

    let progResult = null;
    if (typeof updateStatsAfterGame === 'function') {
        progResult = updateStatsAfterGame(gameMode, score, best);
    }

    if (score > 0 && score === best && typeof SFX.newRecord === 'function') SFX.newRecord();

    setText('go-score', String(score));
    setText('go-best', String(best));
    setText('go-earned', `+${earned} 🪙`);
    setText('go-mult', gameMode === 'mario' ? '× 2 (MODE RENARD)' : '× 1');
    setText('medal', getMedal(score));

    const xpEl = document.getElementById('go-xp');
    if (xpEl && progResult) xpEl.textContent = `+${progResult.baseXP} XP`;

    if (progResult && progResult.levelResult && progResult.levelResult.leveledUp) {
        if (typeof SFX.levelUp === 'function') SFX.levelUp();
        showLevelUpToast(progResult.levelResult);
    }

    if (progResult && progResult.newlyUnlocked && progResult.newlyUnlocked.length > 0) {
        if (typeof SFX.achievement === 'function') SFX.achievement();
        showAchievementToast(progResult.newlyUnlocked[0]);
    }

    if (typeof updateMenuProgression === 'function') updateMenuProgression();

    const btnRevive = document.getElementById('btn-revive');
    if (btnRevive) {
        btnRevive.style.display = (typeof hasRevived !== 'undefined' && hasRevived) ? 'none' : 'inline-block';
        // Griser le bouton si la pub n'est pas chargée (ex: pas d'internet)
        const isAdReady = typeof adLoaded !== 'undefined' && adLoaded;
        btnRevive.disabled = !isAdReady;
        btnRevive.style.opacity = isAdReady ? '1' : '0.4';
    }

    const btnDouble = document.getElementById('btn-double');
    if (btnDouble) {
        // Griser le bouton et changer le texte si pas de pub
        const isAdReady = typeof adLoaded !== 'undefined' && adLoaded;
        btnDouble.disabled      = !isAdReady;
        btnDouble.style.opacity = isAdReady ? '1' : '0.4';
        btnDouble.textContent   = isAdReady ? `▶ DOUBLER (+${earned} 🪙)` : `PUB INDISPONIBLE`;
    }

    showScreen('gameover-screen');
}

function getMedal(s) {
    if (s >= 40) return '🥇';
    if (s >= 20) return '🥈';
    if (s >= 10) return '🥉';
    return '💀';
}

// ─────────────────────────────────────────────
// NAVIGATION MENUS
// ─────────────────────────────────────────────

function goToMainMenu() {
    state = 'mainmenu';
    ['gameover-screen', 'modeselect-screen', 'shop-screen', 'score-display-wrap',
     'pause-screen', 'pause-btn-wrap', 'ready-screen',
     'progression-screen', 'leaderboard-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('visible');
    });
    showScreen('mainmenu-screen');
    updateCoinDisplay();
    if (typeof updateMenuProgression === 'function') updateMenuProgression();
}

function goToModeSelect() { hideScreen('mainmenu-screen'); showScreen('modeselect-screen'); }

function goToShop() {
    hideScreen('mainmenu-screen');
    renderShop();
    showScreen('shop-screen');
    updateCoinDisplay();
}

function startGameMode(mode) {
    gameMode = mode;
    best = parseInt(localStorage.getItem(mode === 'mario' ? 'fb_best_mario' : 'fb_best_classic') || '0');
    if (typeof resetRevive === 'function') resetRevive();
    ['modeselect-screen', 'mainmenu-screen'].forEach(hideScreen);
    ['score-display-wrap', 'pause-btn-wrap', 'ready-screen'].forEach(showScreen);
    initGame();
    state = 'ready';
    SFX.ready();
}

// ─────────────────────────────────────────────
// BOUTONS ET INPUTS
// ─────────────────────────────────────────────

bindOptional('btn-play',       () => { initAudio(); goToModeSelect(); });
bindOptional('btn-shop',       () => { initAudio(); goToShop(); });
bindOptional('btn-back-shop',  goToMainMenu);
bindOptional('btn-back-mode',  goToMainMenu);
bindOptional('btn-classic',    () => startGameMode('classic'));
bindOptional('btn-mario',      () => startGameMode('mario'));
bindOptional('btn-menu',       goToMainMenu);
bindOptional('btn-replay',     () => { hideScreen('gameover-screen'); startGameMode(gameMode); });
bindOptional('btn-pause',      togglePause);
bindOptional('btn-resume',     togglePause);
bindOptional('btn-pause-menu', goToMainMenu);

function bindOptional(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
}

bindOptional('btn-progression', () => {
    if (typeof initDailyChallenge === 'function') initDailyChallenge();
    if (typeof renderProgression  === 'function') renderProgression();
    hideScreen('mainmenu-screen');
    showScreen('progression-screen');
});
bindOptional('btn-leaderboard', () => {
    if (typeof renderLeaderboard === 'function') renderLeaderboard('classic');
    hideScreen('mainmenu-screen');
    showScreen('leaderboard-screen');
});
bindOptional('btn-back-prog', () => { hideScreen('progression-screen'); showScreen('mainmenu-screen'); });
bindOptional('btn-back-lb',   () => { hideScreen('leaderboard-screen'); showScreen('mainmenu-screen'); });
bindOptional('btn-lb-classic', () => {
    if (typeof renderLeaderboard === 'function') renderLeaderboard('classic');
    document.getElementById('btn-lb-classic').classList.add('active');
    const m = document.getElementById('btn-lb-mario');
    if (m) m.classList.remove('active');
});
bindOptional('btn-lb-mario', () => {
    if (typeof renderLeaderboard === 'function') renderLeaderboard('mario');
    document.getElementById('btn-lb-mario').classList.add('active');
    const c = document.getElementById('btn-lb-classic');
    if (c) c.classList.remove('active');
});

// --- Actions Publicités ---
bindOptional('btn-revive', () => {
    if (typeof showReviveAd === 'function') {
        showReviveAd(success => {
            if (!success) return;
                
                // Retirer les pièces données prématurément par le Game Over 
                // car la partie continue et le score final sera calculé plus tard !
                const earned = window._pendingEarned || 0;
                addCoins(-earned);
                updateCoinDisplay();
                window._pendingEarned = 0;

            hideScreen('gameover-screen');
            ['score-display-wrap', 'pause-btn-wrap', 'ready-screen'].forEach(showScreen);
            bird.y = canvas.height * 0.45; bird.vy = 0; bird.rot = 0;
            screenShake = 0; bobTimer = 0;
            resetFireballs();
            resetFlameTrail();
            state = 'ready';
        });
    }
});

bindOptional('btn-double', () => {
    if (typeof showDoubleCoinsAd === 'function') {
        showDoubleCoinsAd(success => {
            if (!success) return;
            const bonus = window._pendingEarned || 0;
            addCoins(bonus);
            updateCoinDisplay();
            document.getElementById('go-earned').textContent = `+${bonus * 2} 🪙 ✓`;
            const btn = document.getElementById('btn-double');
            btn.disabled = true; btn.style.opacity = '0.4';
            window._pendingEarned = 0;
                
                // Interdire la résurrection si on a choisi de doubler l'or
                const btnRevive = document.getElementById('btn-revive');
                if (btnRevive) btnRevive.style.display = 'none';
        });
    }
});

document.addEventListener('touchstart', e => {
    if ((state === 'playing' || state === 'ready') && e.target.id !== 'btn-pause') {
        e.preventDefault(); flap();
    }
}, { passive: false });

document.addEventListener('mousedown', () => {
    if (state === 'playing' || state === 'ready') flap();
});

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && (state === 'playing' || state === 'ready')) flap();
    if (e.code === 'Escape') togglePause();
});

// ─────────────────────────────────────────────
// TOASTS ET UI
// ─────────────────────────────────────────────

function showPowerupToast(type) {
    const defs = {
        slow:   { label: '»» RALENTI !', color: '#00aaff', dur: '5 SEC'  },
        double: { label: '×2 SCORE !',   color: '#ffdd00', dur: '10 SEC' },
    };
    const def = defs[type];
    if (!def) return;
    const el = document.getElementById('toast-achievement');
    if (!el) return;
    const title = el.querySelector('.toast-title');
    const sub   = el.querySelector('.toast-sub');
    const label = el.querySelector('.toast-label');
    if (label) label.textContent = 'POWER-UP !';
    if (title) { title.textContent = def.label; title.style.color = def.color; }
    if (sub)   sub.textContent = def.dur;
    el.classList.add('visible');
    setTimeout(() => { el.classList.remove('visible'); if (title) title.style.color = ''; }, 2500);
}

function showLevelUpToast(data) {
    const el = document.getElementById('toast-levelup');
    if (!el) return;
    const title = el.querySelector('.toast-title');
    const sub   = el.querySelector('.toast-sub');
    if (title) title.textContent = `NIVEAU ${data.newLevel} !`;
    if (sub)   sub.textContent   = `${data.title} — +${data.reward} 🪙`;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 3000);
}

function showAchievementToast(ach) {
    const el = document.getElementById('toast-achievement');
    if (!el) return;
    const title = el.querySelector('.toast-title');
    const sub   = el.querySelector('.toast-sub');
    const label = el.querySelector('.toast-label');
    if (label) label.textContent = 'SUCCÈS DÉBLOQUÉ';
    if (title) { title.textContent = ach.title; title.style.color = ''; }
    if (sub)   sub.textContent = `+${ach.xp} XP`;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 3000);
}

function showComboToast(count) {
    const el = document.getElementById('combo-display');
    if (!el) return;
    el.textContent = `× ${count} COMBO !`;
    el.style.opacity   = '1';
    el.style.transform = 'translateX(-50%) scale(1.2)';
    setTimeout(() => {
        el.style.opacity   = '0';
        el.style.transform = 'translateX(-50%) scale(1)';
    }, 800);
}

function updateMenuProgression() {
    if (typeof getStats !== 'function') return;
    const s    = getStats();
    const prog = typeof getXPProgress === 'function' ? getXPProgress() : null;
    const lvl  = typeof getLevelData  === 'function' ? getLevelData(s.level) : null;
    const el   = document.getElementById('menu-level');
    if (el && lvl) el.textContent = `NV.${s.level} ${lvl.title}`;
    const bar = document.getElementById('menu-xp-bar');
    if (bar && prog) bar.style.width = prog.percent + '%';
    const daily = typeof getDailyStatus === 'function' ? getDailyStatus() : null;
    const dot   = document.getElementById('daily-dot');
    if (dot && daily) dot.style.display = daily.completed ? 'none' : 'block';
}

// ─────────────────────────────────────────────
// BOUCLE PRINCIPALE
// ─────────────────────────────────────────────

let lastT = 0;
function loop(t) {
    const dt = Math.min(t - lastT, 50);
    lastT = t;

    ctx.fillStyle = '#010a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state !== 'paused') updateStars(canvas.height, canvas.width);

    if (['mainmenu', 'modeselect', 'shop', 'gameover', 'progression', 'leaderboard'].includes(state)) {
        drawStars(ctx);
    }

    if (state === 'ready' || state === 'playing' || state === 'dead') {
        if (state === 'dead') {
            deathTimer--;
            bird.vy += GRAVITY; bird.y += bird.vy; bird.rot = 90;
            groundOffset += gameMode === 'classic' ? getPipeSpeed(score) * getSlowMult() : PIPE_SPD_BASE;
            updateParticles();
            updateFlameTrail();
        } else {
            update(dt);
        }
        drawScene();

        if (state === 'dead' && deathTimer <= 0) {
            state = 'gameover';
            showGameOver();
            ['score-display-wrap', 'pause-btn-wrap'].forEach(hideScreen);
        }
    }
    if (state === 'paused') drawScene();
    requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
// DÉMARRAGE DU SYSTÈME
// ─────────────────────────────────────────────

async function bootGame() {
    // 1. Sécuriser les sauvegardes via Capacitor Preferences
    const Prefs = window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.Preferences : null;

    if (Prefs) {
        // Liste exhaustive de toutes les clés utilisées dans votre jeu
        const keysToSync = ['px_stats', 'fb_coins', 'fb_unlocked', 'fb_skin', 'px_lb_mario', 'px_lb_classic', 'fb_best_classic', 'fb_best_mario'];
        
        // A. Restaurer les données depuis le stockage natif vers le localStorage
        for (const k of keysToSync) {
            const { value } = await Prefs.get({ key: k });
            if (value !== null) localStorage.setItem(k, value);
        }

        // B. Surcharger localStorage.setItem pour faire un backup automatique
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            originalSetItem.call(localStorage, key, value); // Sauvegarde web normale
            if (keysToSync.includes(key)) {
                Prefs.set({ key, value: String(value) }); // Backup natif silencieux
            }
        };
    }

    // 2. Initialiser l'interface et le jeu
    initStars(canvas.width, canvas.height);
    initShootingStars();
    initPlanets(canvas.width, canvas.height);
    showScreen('mainmenu-screen');
    updateCoinDisplay();
    if (typeof initDailyChallenge    === 'function') initDailyChallenge();
    if (typeof updateMenuProgression === 'function') updateMenuProgression();
    if (typeof initAds === 'function') initAds();

    requestAnimationFrame(loop);
}

// Lancer le démarrage
bootGame();

// ─────────────────────────────────────────────
// SURCHARGE DU DESSIN : TUYAUX -> CLÔTURES BLANCHES
// ─────────────────────────────────────────────
window.drawPipe = function(ctx, x, y, h, isTop) {
    if (h <= 0) return;
    ctx.save();
    const capH = 16; // Hauteur de la pointe
    
    ctx.fillStyle = '#ffffff'; 
    
    if (isTop) {
        ctx.fillRect(x, y, PIPE_W, h - capH);
        ctx.beginPath();
        ctx.moveTo(x, y + h - capH);
        ctx.lineTo(x + PIPE_W / 2, y + h);
        ctx.lineTo(x + PIPE_W, y + h - capH);
        ctx.fill();
        
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + PIPE_W - 4, y, 4, h - capH);
        ctx.beginPath();
        ctx.moveTo(x + PIPE_W / 2, y + h);
        ctx.lineTo(x + PIPE_W, y + h - capH);
        ctx.lineTo(x + PIPE_W - 4, y + h - capH);
        ctx.lineTo(x + PIPE_W / 2, y + h - 4);
        ctx.fill();
    } else {
        ctx.fillRect(x, y + capH, PIPE_W, h - capH);
        ctx.beginPath();
        ctx.moveTo(x, y + capH);
        ctx.lineTo(x + PIPE_W / 2, y);
        ctx.lineTo(x + PIPE_W, y + capH);
        ctx.fill();
        
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + PIPE_W - 4, y + capH, 4, h - capH);
        ctx.beginPath();
        ctx.moveTo(x + PIPE_W / 2, y);
        ctx.lineTo(x + PIPE_W, y + capH);
        ctx.lineTo(x + PIPE_W - 4, y + capH);
        ctx.lineTo(x + PIPE_W / 2, y + 4);
        ctx.fill();
    }
    
    // Planches horizontales
    ctx.fillStyle = '#ffffff';
    if (h > 50) {
        ctx.fillRect(x - 2, isTop ? y + h - 50 : y + 30, PIPE_W + 4, 8);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x - 2, isTop ? y + h - 42 : y + 38, PIPE_W + 4, 2);
    }
    if (h > 100) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, isTop ? y + h - 100 : y + 80, PIPE_W + 4, 8);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(x - 2, isTop ? y + h - 92 : y + 88, PIPE_W + 4, 2);
    }
    
    ctx.restore();
};