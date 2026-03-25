// ─────────────────────────────────────────────
// GAME — Flappy Bird avec menus, pièces, 2 modes
// Dépend de : audio.js, sprites.js, skins.js, mario.js, particles.js, ads.js
// ─────────────────────────────────────────────

'use strict';

window.onerror = function (msg, src, line) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;font-size:12px;padding:8px;z-index:9999;word-break:break-all;';
    div.textContent = `ERREUR ligne ${line}: ${msg}`;
    document.body.appendChild(div);
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const GROUND_H = 80;
const PIPE_W = 8 * PX;
const PIPE_GAP = 160;
const PIPE_SPD = 3.2;
const GRAVITY = 0.42;
const FLAP_PWR = -7.5;
const BIRD_W = 8 * PX;
const BIRD_H = 8 * PX;
const PIPE_INTERVAL = 1000;

let state = 'mainmenu';
let gameMode = 'classic';
let score = 0;
let best = parseInt(localStorage.getItem('fb_best') || '0');

let bird, pipes;
let groundOffset = 0;
let birdFrame = 0;
let birdFrameTimer = 0;
let screenShake = 0;
let deathTimer = 0;
let pipeTimer = 0;
let bobTimer = 0;

function initGame() {
    bird = { x: canvas.width * 0.25, y: canvas.height * 0.45, vy: 0, rot: 0 };
    pipes = []; score = 0; groundOffset = 0; birdFrame = 0;
    screenShake = 0; deathTimer = 0; pipeTimer = 0; bobTimer = 0;
    resetFireballs();
    if (gameMode === 'mario') initMarioPipe(canvas.height);
    updateScoreDOM();
}

function spawnPipe() {
    const groundY = canvas.height - GROUND_H;
    const topH = 80 + Math.random() * (groundY - PIPE_GAP - 160);
    pipes.push({ x: canvas.width + PIPE_W, topH, botY: topH + PIPE_GAP, botH: groundY - (topH + PIPE_GAP), scored: false });
}

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

function checkCollisions() {
    const groundY = canvas.height - GROUND_H;
    const bx = bird.x - BIRD_W * 0.35, by = bird.y - BIRD_H * 0.35;
    const bw = BIRD_W * 0.7, bh = BIRD_H * 0.7;
    if (bird.y + BIRD_H / 2 >= groundY || bird.y - BIRD_H / 2 <= 0) return true;
    if (gameMode === 'classic') {
        for (const p of pipes) {
            const px = p.x - 2, pw = PIPE_W + 4;
            if (bx < px + pw && bx + bw > px && by < p.topH) return true;
            if (bx < px + pw && bx + bw > px && by + bh > p.botY) return true;
        }
    }
    if (gameMode === 'mario' && checkFireballCollision(bird.x, bird.y, BIRD_W, BIRD_H)) return true;
    return false;
}

function update(dt) {
    if (state === 'ready') {
        bobTimer += 0.05;
        bird.y = canvas.height * 0.45 + Math.sin(bobTimer) * 6;
        bird.rot = 0;
        groundOffset += PIPE_SPD;
        birdFrameTimer += dt;
        if (birdFrameTimer > 120) { birdFrameTimer = 0; birdFrame = (birdFrame + 1) % BIRD_FRAMES.length; }
        return;
    }
    if (state !== 'playing') return;

    bird.vy += GRAVITY;
    bird.vy = Math.min(bird.vy, 12);
    bird.y += bird.vy;
    bird.rot = Math.max(-25, Math.min(90, bird.vy * 4.5));
    birdFrameTimer += dt;
    if (birdFrameTimer > 100) { birdFrameTimer = 0; birdFrame = (birdFrame + 1) % BIRD_FRAMES.length; }
    groundOffset += PIPE_SPD;

    if (gameMode === 'classic') {
        pipeTimer += dt;
        if (pipeTimer >= PIPE_INTERVAL) { pipeTimer = 0; spawnPipe(); }
        pipes.forEach(p => { p.x -= PIPE_SPD; });
        pipes = pipes.filter(p => p.x + PIPE_W > -50);
        pipes.forEach(p => {
            if (!p.scored && p.x + PIPE_W < bird.x) {
                p.scored = true; score++;
                if (score > best) { best = score; localStorage.setItem('fb_best', best); }
                updateScoreDOM(); SFX.score();
            }
        });
    }

    if (gameMode === 'mario') {
        updateMarioPipe(dt, score);
        updateFireballs(dt, score, canvas.width, canvas.height, bird, () => {
            score++;
            if (score > best) { best = score; localStorage.setItem('fb_best', best); }
            updateScoreDOM(); SFX.score();
        });
    }

    if (checkCollisions()) {
        state = 'dead'; screenShake = 10; deathTimer = 60;
        SFX.hit();
        setTimeout(() => SFX.die(), 200);
        if (gameMode === 'mario') setTimeout(() => SFX.marioLaugh(), 500);
    }

    if (screenShake > 0) screenShake = Math.max(0, screenShake - 0.6);
}

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height - GROUND_H);
    grad.addColorStop(0, '#010a1a'); grad.addColorStop(0.6, '#020f28'); grad.addColorStop(1, '#051830');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBird() {
    const pal = getActivePal();
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.rot * Math.PI) / 180);
    drawSprite(ctx, BIRD_FRAMES[birdFrame], -BIRD_W / 2, -BIRD_H / 2, pal);
    ctx.restore();
}

function drawScene() {
    if (screenShake > 0) { ctx.save(); ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake); }
    if (gameMode === 'mario') {
        drawMarioBackground(ctx, canvas.width, canvas.height, groundOffset);
    } else {
        drawBackground();
        drawStars(ctx);
    }
    if (gameMode === 'classic') {
        pipes.forEach(p => {
            if (p.topH > 0) drawPipe(ctx, p.x, 0, p.topH, true);
            drawPipe(ctx, p.x, p.botY, p.botH, false);
        });
    }
    if (gameMode === 'mario') { drawMarioPipe(ctx, canvas.width, canvas.height); drawFireballs(ctx); }
    drawGround(ctx, canvas.width, canvas.height - GROUND_H, groundOffset);
    drawBird();
    if (screenShake > 0) ctx.restore();
}

function showScreen(id) { document.getElementById(id).classList.add('visible'); }
function hideScreen(id) { document.getElementById(id).classList.remove('visible'); }
function updateScoreDOM() { document.getElementById('score-display').textContent = score; }

function showGameOver() {
    const coinMult = gameMode === 'mario' ? 2 : 1;
    const earned = score * coinMult;
    window._pendingEarned = earned;
    addCoins(earned);
    updateCoinDisplay();

    document.getElementById('go-score').textContent = score;
    document.getElementById('go-best').textContent = best;
    document.getElementById('go-earned').textContent = `+${earned} 🪙`;
    document.getElementById('go-mult').textContent = gameMode === 'mario' ? '× 2 (MODE MARIO)' : '× 1';
    document.getElementById('medal').textContent = getMedal(score);

    const btnRevive = document.getElementById('btn-revive');
    btnRevive.style.display = hasRevived ? 'none' : 'inline-block';

    const btnDouble = document.getElementById('btn-double');
    btnDouble.disabled = false; btnDouble.style.opacity = '1';
    btnDouble.textContent = `▶ DOUBLER (${earned * 2} 🪙)`;

    showScreen('gameover-screen');
}

function getMedal(s) {
    if (s >= 40) return '🥇';
    if (s >= 20) return '🥈';
    if (s >= 10) return '🥉';
    return '💀';
}

function goToMainMenu() {
    state = 'mainmenu';
    ['gameover-screen', 'modeselect-screen', 'shop-screen', 'score-display-wrap',
        'pause-screen', 'pause-btn-wrap', 'ready-screen'].forEach(hideScreen);
    showScreen('mainmenu-screen');
    updateCoinDisplay();
}

function goToModeSelect() { hideScreen('mainmenu-screen'); showScreen('modeselect-screen'); }

function goToShop() {
    hideScreen('mainmenu-screen'); renderShop(); showScreen('shop-screen'); updateCoinDisplay();
}

function startGameMode(mode) {
    gameMode = mode;
    resetRevive();
    ['modeselect-screen', 'mainmenu-screen'].forEach(hideScreen);
    ['score-display-wrap', 'pause-btn-wrap', 'ready-screen'].forEach(showScreen);
    initGame();
    state = 'ready';
    SFX.ready();
}

document.getElementById('btn-play').addEventListener('click', () => { initAudio(); goToModeSelect(); });
document.getElementById('btn-shop').addEventListener('click', () => { initAudio(); goToShop(); });
document.getElementById('btn-back-shop').addEventListener('click', goToMainMenu);
document.getElementById('btn-back-mode').addEventListener('click', goToMainMenu);
document.getElementById('btn-classic').addEventListener('click', () => startGameMode('classic'));
document.getElementById('btn-mario').addEventListener('click', () => startGameMode('mario'));
document.getElementById('btn-menu').addEventListener('click', goToMainMenu);
document.getElementById('btn-replay').addEventListener('click', () => { hideScreen('gameover-screen'); startGameMode(gameMode); });
document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-resume').addEventListener('click', togglePause);
document.getElementById('btn-pause-menu').addEventListener('click', goToMainMenu);

document.getElementById('btn-revive').addEventListener('click', () => {
    showReviveAd(success => {
        if (!success) return;
        hideScreen('gameover-screen');
        ['score-display-wrap', 'pause-btn-wrap', 'ready-screen'].forEach(showScreen);
        bird.y = canvas.height * 0.45; bird.vy = 0; bird.rot = 0;
        screenShake = 0; bobTimer = 0;
        resetFireballs();
        state = 'ready';
    });
});

document.getElementById('btn-double').addEventListener('click', () => {
    showDoubleCoinsAd(success => {
        if (!success) return;
        const earned = window._pendingEarned * 2;
        addCoins(earned);
        updateCoinDisplay();
        document.getElementById('go-earned').textContent = `+${earned} 🪙 ✓`;
        const btn = document.getElementById('btn-double');
        btn.disabled = true; btn.style.opacity = '0.4';
    });
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

let lastT = 0;

function loop(t) {
    const dt = Math.min(t - lastT, 50);
    lastT = t;

    ctx.fillStyle = '#010a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (state !== 'paused') updateStars(canvas.height, canvas.width);
    drawStars(ctx);

    if (state === 'ready' || state === 'playing' || state === 'dead') {
        if (state === 'dead') {
            deathTimer--;
            bird.vy += GRAVITY; bird.y += bird.vy; bird.rot = 90;
            groundOffset += PIPE_SPD;
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

initStars(canvas.width, canvas.height);
showScreen('mainmenu-screen');
updateCoinDisplay();
initAds();
requestAnimationFrame(loop);
