// ─────────────────────────────────────────────
// MARIO MODE — Mario sur tuyau mobile, tire vers la gauche
// ─────────────────────────────────────────────

const MARIO_SPR = [
    [0, 0, 2, 2, 2, 2, 2, 0, 0, 0],
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 0],
    [0, 3, 3, 1, 3, 1, 1, 1, 0, 0],
    [3, 3, 1, 3, 1, 1, 1, 3, 3, 0],
    [3, 3, 1, 1, 1, 1, 1, 3, 3, 0],
    [0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 4, 4, 2, 4, 4, 4, 0, 0, 0],
    [4, 4, 4, 2, 4, 4, 4, 4, 4, 0],
    [4, 4, 4, 2, 2, 2, 2, 4, 4, 0],
    [0, 4, 0, 2, 2, 2, 2, 0, 4, 0],
    [0, 4, 4, 4, 0, 0, 4, 4, 4, 0],
    [0, 4, 4, 4, 0, 0, 4, 4, 4, 0],
];

const MARIO_PAL = { 1: '#f4a460', 2: '#cc2200', 3: '#8b4513', 4: '#0066cc' };
const MARIO_PX  = 5;
const MARIO_W   = 10 * MARIO_PX;
const MARIO_H   = 12 * MARIO_PX;

const PIPE_MARIO_W   = 60;
const PIPE_MARIO_CAP = 16;

// Marge haute et basse du tuyau (px)
const PIPE_MARGIN_TOP    = 120;
const PIPE_MARGIN_BOTTOM = 120;

let marioPipe = { y: 0, vy: 1.2, minY: 0, maxY: 0 };

function initMarioPipe(canvasH) {
    const groundY    = canvasH - GROUND_H;
    marioPipe.minY   = PIPE_MARGIN_TOP;
    marioPipe.maxY   = groundY - PIPE_MARGIN_BOTTOM;
    marioPipe.y      = (marioPipe.minY + marioPipe.maxY) / 2;
    marioPipe.vy     = 1.2;
}

function updateMarioPipe(dt, score) {
    const spd = 1.2 + score * 0.04;
    marioPipe.y += marioPipe.vy * spd;
    if (marioPipe.y <= marioPipe.minY) { marioPipe.y = marioPipe.minY; marioPipe.vy =  Math.abs(marioPipe.vy); }
    if (marioPipe.y >= marioPipe.maxY) { marioPipe.y = marioPipe.maxY; marioPipe.vy = -Math.abs(marioPipe.vy); }
}

function drawMario(ctx, x, y, px) {
    MARIO_SPR.forEach((row, ry) => {
        row.forEach((cell, rx) => {
            if (!cell) return;
            ctx.fillStyle = MARIO_PAL[cell];
            ctx.fillRect(Math.floor(x + rx * px), Math.floor(y + ry * px), px, px);
        });
    });
}

function getMarioX(canvasW) {
    return canvasW - PIPE_MARIO_W - 10 + (PIPE_MARIO_W - MARIO_W) / 2;
}

function getMarioY() {
    return marioPipe.y - MARIO_H;
}

// ─────────────────────────────────────────────
// FOND MARIO — nuages, collines, briques
// ─────────────────────────────────────────────

// Nuages pré-générés (positions fixes relatives en %)
const CLOUDS = [
    { xp: 0.08, yp: 0.10, s: 1.2 },
    { xp: 0.28, yp: 0.18, s: 0.9 },
    { xp: 0.50, yp: 0.08, s: 1.5 },
    { xp: 0.70, yp: 0.20, s: 1.0 },
    { xp: 0.88, yp: 0.13, s: 1.3 },
];

// Collines (positions en %)
const HILLS = [
    { xp: 0.05, rp: 0.14 },
    { xp: 0.35, rp: 0.10 },
    { xp: 0.62, rp: 0.16 },
];

// Briques décoratives en fond (positions en %)
const BRICKS = [
    { xp: 0.10, yp: 0.55 },
    { xp: 0.22, yp: 0.38 },
    { xp: 0.42, yp: 0.62 },
    { xp: 0.60, yp: 0.42 },
];

let bgOffset = 0; // défilement lent du fond

function drawMarioBackground(ctx, canvasW, canvasH, offset) {
    const groundY = canvasH - GROUND_H;
    bgOffset = offset;

    // Ciel dégradé
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, '#5cc8f8');
    grad.addColorStop(1, '#aeeaff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, groundY);

    // ─── Collines vertes en arrière-plan ───
    HILLS.forEach(h => {
        const cx = ((h.xp * canvasW - offset * 0.2) % (canvasW + 200)) - 100;
        const r  = h.rp * canvasW;
        const cy = groundY;

        // Ombre colline
        ctx.fillStyle = '#3aaa3a';
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, 0);
        ctx.fill();

        // Surface colline
        ctx.fillStyle = '#4cc44c';
        ctx.beginPath();
        ctx.arc(cx, cy - 6, r - 4, Math.PI, 0);
        ctx.fill();

        // Points blancs décoratifs
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy - r * 0.5, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.1, cy - r * 0.65, r * 0.05, 0, Math.PI * 2);
        ctx.fill();
    });

    // ─── Nuages ───
    CLOUDS.forEach(c => {
        const cx = ((c.xp * canvasW - offset * 0.3) % (canvasW + 200) + canvasW + 200) % (canvasW + 200) - 100;
        const cy = c.yp * groundY;
        const s  = c.s * 28;
        drawCloud(ctx, cx, cy, s);
    });

    // ─── Briques flottantes (pixel art) ───
    BRICKS.forEach(b => {
        const bx = ((b.xp * canvasW - offset * 0.6) % (canvasW + 100) + canvasW + 100) % (canvasW + 100) - 50;
        const by = b.yp * groundY;
        drawBrickBlock(ctx, bx, by);
    });

    // ─── Sol Mario (vert avec lignes) ───
    ctx.fillStyle = '#6ac832';
    ctx.fillRect(0, groundY, canvasW, GROUND_H);
    ctx.fillStyle = '#4a9818';
    ctx.fillRect(0, groundY, canvasW, 8);

    // Carreaux sol
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    const tileW = 32;
    for (let x = -tileW + (offset * 0.8 % tileW); x < canvasW + tileW; x += tileW) {
        ctx.fillRect(x, groundY + 8, 1, GROUND_H - 8);
    }
    for (let y = groundY + 16; y < groundY + GROUND_H; y += 16) {
        ctx.fillRect(0, y, canvasW, 1);
    }
}

function drawCloud(ctx, cx, cy, s) {
    ctx.fillStyle = '#ffffff';
    // Forme nuage : 3 cercles
    ctx.beginPath(); ctx.arc(cx,        cy,     s,       0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - s,    cy + s * 0.4, s * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s,    cy + s * 0.4, s * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - s * 0.4, cy + s * 0.8, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s * 0.4, cy + s * 0.8, s * 0.9, 0, Math.PI * 2); ctx.fill();

    // Ombre légère
    ctx.fillStyle = 'rgba(200,230,255,0.5)';
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.3, s * 0.6, 0, Math.PI * 2); ctx.fill();
}

function drawBrickBlock(ctx, x, y) {
    const bw = 28, bh = 28;
    // Fond brique
    ctx.fillStyle = '#c84c0c';
    ctx.fillRect(x, y, bw, bh);
    // Highlight
    ctx.fillStyle = '#e86010';
    ctx.fillRect(x + 2, y + 2, bw - 4, 10);
    ctx.fillRect(x + 2, y + 2, 10, bh - 4);
    // Ombre
    ctx.fillStyle = '#8c3008';
    ctx.fillRect(x + bw - 3, y, 3, bh);
    ctx.fillRect(x, y + bh - 3, bw, 3);
    // Joints
    ctx.fillStyle = '#8c3008';
    ctx.fillRect(x, y + bh / 2, bw, 2);
    ctx.fillRect(x + bw / 2, y, 2, bh / 2);
    ctx.fillRect(x + bw / 4, y + bh / 2, 2, bh / 2);
    ctx.fillRect(x + 3 * bw / 4, y + bh / 2, 2, bh / 2);
}

// ─────────────────────────────────────────────
// TUYAU MARIO
// ─────────────────────────────────────────────

function drawMarioPipe(ctx, canvasW, canvasH) {
    const groundY    = canvasH - GROUND_H;
    const pipeX      = canvasW - PIPE_MARIO_W - 10;
    const pipeTop    = marioPipe.y;
    const pipeBottom = groundY;

    // Corps
    ctx.fillStyle = '#e8c800';
    ctx.fillRect(pipeX + 4, pipeTop + PIPE_MARIO_CAP, PIPE_MARIO_W - 8, pipeBottom - pipeTop - PIPE_MARIO_CAP);
    // Lignes décoratives
    ctx.fillStyle = '#b89800';
    ctx.fillRect(pipeX + 10, pipeTop + PIPE_MARIO_CAP, 6, pipeBottom - pipeTop - PIPE_MARIO_CAP);
    ctx.fillRect(pipeX + PIPE_MARIO_W - 16, pipeTop + PIPE_MARIO_CAP, 6, pipeBottom - pipeTop - PIPE_MARIO_CAP);
    // Chapeau
    ctx.fillStyle = '#f0d000';
    ctx.fillRect(pipeX, pipeTop, PIPE_MARIO_W, PIPE_MARIO_CAP);
    // Bords chapeau
    ctx.fillStyle = '#a07800';
    ctx.fillRect(pipeX, pipeTop + PIPE_MARIO_CAP - 3, PIPE_MARIO_W, 3);
    ctx.fillRect(pipeX, pipeTop, 3, PIPE_MARIO_CAP);
    ctx.fillRect(pipeX + PIPE_MARIO_W - 3, pipeTop, 3, PIPE_MARIO_CAP);

    // Mario (miroir vers la gauche)
    const mx = pipeX + (PIPE_MARIO_W - MARIO_W) / 2;
    const my = pipeTop - MARIO_H;
    ctx.save();
    ctx.translate(mx + MARIO_W, my);
    ctx.scale(-1, 1);
    drawMario(ctx, 0, 0, MARIO_PX);
    ctx.restore();
}

// ─────────────────────────────────────────────
// BOULES DE FEU
// ─────────────────────────────────────────────

const FIREBALL_SPR = [
    [0, 1, 1, 0, 0],
    [1, 2, 1, 1, 0],
    [1, 2, 2, 1, 1],
    [1, 2, 1, 1, 0],
    [0, 1, 1, 0, 0],
];
const FB_PAL = ['#ff6600', '#ffdd00'];
const FB_PX  = 4;
const FB_W   = 5 * FB_PX;
const FB_H   = 5 * FB_PX;

let fireballs   = [];
let fbTimer     = 0;
let fbDodged    = new Set();
let fbIdCounter = 0;

function resetFireballs() {
    fireballs   = [];
    fbTimer     = 0;
    fbDodged    = new Set();
    fbIdCounter = 0;
}

function fbShootInterval(score) {
    return Math.max(500, 1800 - score * 40);
}

function spawnFireball(canvasW, score) {
    const marioX = getMarioX(canvasW);
    const marioY = getMarioY() + MARIO_H / 2;
    const spd    = 4 + score * 0.1;
    const vy     = (Math.random() - 0.3) * 2.5;
    fireballs.push({ id: fbIdCounter++, x: marioX - FB_W, y: marioY - FB_H / 2, vy, rot: 0, spd });
}

function updateFireballs(dt, score, canvasW, canvasH, bird, onDodge) {
    fbTimer += dt;
    if (fbTimer >= fbShootInterval(score)) { fbTimer = 0; spawnFireball(canvasW, score); }

    const groundY = canvasH - GROUND_H;
    fireballs.forEach(fb => {
        fb.x   -= fb.spd;
        fb.y   += fb.vy;
        fb.vy  += 0.12;
        fb.rot += 0.15;
        if (fb.y + FB_H >= groundY) { fb.y = groundY - FB_H; fb.vy = -(Math.abs(fb.vy) * 0.55); SFX.fbBounce(); }
        if (fb.y <= 0)              { fb.y = 0;               fb.vy =  Math.abs(fb.vy); }
        if (!fbDodged.has(fb.id) && fb.x + FB_W < bird.x - 10) { fbDodged.add(fb.id); onDodge(); }
    });
    fireballs = fireballs.filter(fb => fb.x + FB_W > -30);
}

function drawFireball(ctx, fb) {
    ctx.save();
    ctx.translate(fb.x + FB_W / 2, fb.y + FB_H / 2);
    ctx.rotate(fb.rot);
    FIREBALL_SPR.forEach((row, ry) => {
        row.forEach((cell, rx) => {
            if (!cell) return;
            ctx.fillStyle = FB_PAL[cell - 1];
            ctx.fillRect(Math.floor(-FB_W / 2 + rx * FB_PX), Math.floor(-FB_H / 2 + ry * FB_PX), FB_PX, FB_PX);
        });
    });
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(-FB_W / 2 - 3, -FB_H / 2 - 3, FB_W + 6, FB_H + 6);
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawFireballs(ctx) { fireballs.forEach(fb => drawFireball(ctx, fb)); }

function checkFireballCollision(birdX, birdY, birdW, birdH) {
    const bx = birdX - birdW * 0.35, by = birdY - birdH * 0.35;
    const bw = birdW * 0.7,          bh = birdH * 0.7;
    for (const fb of fireballs) {
        if (bx < fb.x + FB_W && bx + bw > fb.x && by < fb.y + FB_H && by + bh > fb.y) return true;
    }
    return false;
}
