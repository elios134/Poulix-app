// ─────────────────────────────────────────────
// MARIO MODE — Boss avec 4 phases selon le score
// ─────────────────────────────────────────────

// ─── Phases du boss ───
const MARIO_PHASES = [
    { minScore: 0,  color: '#cc2200', label: 'NORMAL',    shootInterval: 1200, burstCount: 1, spreadAngle: 0    },
    { minScore: 10, color: '#cc6600', label: 'ÉNERVÉ',    shootInterval: 950, burstCount: 1, spreadAngle: 0.3  },
    { minScore: 25, color: '#cc0066', label: 'EN COLÈRE', shootInterval: 750,  burstCount: 2, spreadAngle: 0.4  },
    { minScore: 40, color: '#6600cc', label: 'RAGE',      shootInterval: 500,  burstCount: 3, spreadAngle: 0.45 },
];

function getMarioPhase(score) {
    let phase = MARIO_PHASES[0];
    for (const p of MARIO_PHASES) {
        if (score >= p.minScore) phase = p;
    }
    return phase;
}

// ─── Sprite Mario ───
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

const MARIO_PX = 5;
const MARIO_W  = 10 * MARIO_PX;
const MARIO_H  = 12 * MARIO_PX;

const PIPE_MARIO_W   = 60;
const PIPE_MARIO_CAP = 16;

const PIPE_MARGIN_TOP    = 120;
const PIPE_MARGIN_BOTTOM = 120;

let marioPipe     = { y: 0, vy: 1.2, minY: 0, maxY: 0 };
let marioRageAura = 0;

function initMarioPipe(canvasH) {
    const GH       = typeof GROUND_H !== 'undefined' ? GROUND_H : 80;
    const groundY  = canvasH - GH;
    marioPipe.minY = PIPE_MARGIN_TOP;
    marioPipe.maxY = groundY - PIPE_MARGIN_BOTTOM;
    marioPipe.y    = (marioPipe.minY + marioPipe.maxY) / 2;
    marioPipe.vy   = 1.2;
    marioRageAura  = 0;
}

function updateMarioPipe(dt, score) {
    const phase    = getMarioPhase(score);
    const phaseIdx = MARIO_PHASES.indexOf(phase);
    const spd      = 1.2 + score * 0.04 + phaseIdx * 0.3;
    marioPipe.y   += marioPipe.vy * spd;
    if (marioPipe.y <= marioPipe.minY) { marioPipe.y = marioPipe.minY; marioPipe.vy =  Math.abs(marioPipe.vy); }
    if (marioPipe.y >= marioPipe.maxY) { marioPipe.y = marioPipe.maxY; marioPipe.vy = -Math.abs(marioPipe.vy); }
    marioRageAura = (marioRageAura + 0.08) % (Math.PI * 2);
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
// FOND MARIO — couleur du ciel change selon la phase
// ─────────────────────────────────────────────

const CLOUDS = [
    { xp: 0.08, yp: 0.10, s: 1.2 },
    { xp: 0.28, yp: 0.18, s: 0.9 },
    { xp: 0.50, yp: 0.08, s: 1.5 },
    { xp: 0.70, yp: 0.20, s: 1.0 },
    { xp: 0.88, yp: 0.13, s: 1.3 },
];

const HILLS = [
    { xp: 0.05, rp: 0.14 },
    { xp: 0.35, rp: 0.10 },
    { xp: 0.62, rp: 0.16 },
];

const BRICKS = [
    { xp: 0.10, yp: 0.55 },
    { xp: 0.22, yp: 0.38 },
    { xp: 0.42, yp: 0.62 },
    { xp: 0.60, yp: 0.42 },
];

// Couleurs du ciel par phase (index 0→3)
const PHASE_SKIES = [
    { top: '#5cc8f8', bot: '#aeeaff' }, // Phase 1 — bleu normal
    { top: '#f8a020', bot: '#ffd080' }, // Phase 2 — orange
    { top: '#c030c0', bot: '#f090f0' }, // Phase 3 — rose/violet
    { top: '#1a0a2e', bot: '#3a1060' }, // Phase 4 — noir/violet sombre
];

function drawMarioBackground(ctx, canvasW, canvasH, offset, score) {
    const GH       = typeof GROUND_H !== 'undefined' ? GROUND_H : 80;
    const groundY  = canvasH - GH;
    const phase    = getMarioPhase(score || 0);
    const phaseIdx = MARIO_PHASES.indexOf(phase);
    const sky      = PHASE_SKIES[phaseIdx] || PHASE_SKIES[0];

    // Ciel — couleur selon la phase
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, sky.top);
    grad.addColorStop(1, sky.bot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, groundY);

    // Collines
    HILLS.forEach(h => {
        const cx = ((h.xp * canvasW - offset * 0.2) % (canvasW + 200)) - 100;
        const r  = h.rp * canvasW;
        ctx.fillStyle = '#3aaa3a';
        ctx.beginPath(); ctx.arc(cx, groundY, r, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#4cc44c';
        ctx.beginPath(); ctx.arc(cx, groundY - 6, r - 4, Math.PI, 0); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc(cx - r * 0.3, groundY - r * 0.5, r * 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r * 0.1, groundY - r * 0.65, r * 0.05, 0, Math.PI * 2); ctx.fill();
    });

    // Nuages
    CLOUDS.forEach(c => {
        const cx = ((c.xp * canvasW - offset * 0.3) % (canvasW + 200) + canvasW + 200) % (canvasW + 200) - 100;
        drawCloud(ctx, cx, c.yp * groundY, c.s * 28);
    });

    // Briques
    BRICKS.forEach(b => {
        const bx = ((b.xp * canvasW - offset * 0.6) % (canvasW + 100) + canvasW + 100) % (canvasW + 100) - 50;
        drawBrickBlock(ctx, bx, b.yp * groundY);
    });

    // Sol
    ctx.fillStyle = '#6ac832';
    ctx.fillRect(0, groundY, canvasW, GH);
    ctx.fillStyle = '#4a9818';
    ctx.fillRect(0, groundY, canvasW, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    const tileW = 32;
    for (let x = -tileW + (offset * 0.8 % tileW); x < canvasW + tileW; x += tileW) {
        ctx.fillRect(x, groundY + 8, 1, GH - 8);
    }
    for (let y = groundY + 16; y < groundY + GH; y += 16) {
        ctx.fillRect(0, y, canvasW, 1);
    }
}

function drawCloud(ctx, cx, cy, s) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - s, cy + s * 0.4, s * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s, cy + s * 0.4, s * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - s * 0.4, cy + s * 0.8, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s * 0.4, cy + s * 0.8, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,230,255,0.5)';
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.3, s * 0.6, 0, Math.PI * 2); ctx.fill();
}

function drawBrickBlock(ctx, x, y) {
    const bw = 28, bh = 28;
    ctx.fillStyle = '#c84c0c'; ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = '#e86010'; ctx.fillRect(x + 2, y + 2, bw - 4, 10); ctx.fillRect(x + 2, y + 2, 10, bh - 4);
    ctx.fillStyle = '#8c3008';
    ctx.fillRect(x + bw - 3, y, 3, bh);
    ctx.fillRect(x, y + bh - 3, bw, 3);
    ctx.fillRect(x, y + bh / 2, bw, 2);
    ctx.fillRect(x + bw / 2, y, 2, bh / 2);
    ctx.fillRect(x + bw / 4, y + bh / 2, 2, bh / 2);
    ctx.fillRect(x + 3 * bw / 4, y + bh / 2, 2, bh / 2);
}

// ─────────────────────────────────────────────
// TUYAU + MARIO (sans aura)
// ─────────────────────────────────────────────

function drawMarioPipe(ctx, canvasW, canvasH, score) {
    const GH      = typeof GROUND_H !== 'undefined' ? GROUND_H : 80;
    const groundY = canvasH - GH;
    const pipeX   = canvasW - PIPE_MARIO_W - 10;
    const pipeTop = marioPipe.y;
    const phase    = getMarioPhase(score || 0);
    const phaseIdx = MARIO_PHASES.indexOf(phase);

    // Corps tuyau
    ctx.fillStyle = '#e8c800';
    ctx.fillRect(pipeX + 4, pipeTop + PIPE_MARIO_CAP, PIPE_MARIO_W - 8, groundY - pipeTop - PIPE_MARIO_CAP);
    ctx.fillStyle = '#b89800';
    ctx.fillRect(pipeX + 10, pipeTop + PIPE_MARIO_CAP, 6, groundY - pipeTop - PIPE_MARIO_CAP);
    ctx.fillRect(pipeX + PIPE_MARIO_W - 16, pipeTop + PIPE_MARIO_CAP, 6, groundY - pipeTop - PIPE_MARIO_CAP);

    // Chapeau
    ctx.fillStyle = '#f0d000';
    ctx.fillRect(pipeX, pipeTop, PIPE_MARIO_W, PIPE_MARIO_CAP);
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

    // Label de phase (phases 2+)
    if (phaseIdx >= 1) {
        ctx.font      = `bold 9px "Courier New", monospace`;
        ctx.fillStyle = phase.color;
        ctx.textAlign = 'center';
        ctx.fillText(phase.label + ' !', pipeX + PIPE_MARIO_W / 2, pipeTop - MARIO_H - 6);
    }
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

function spawnFireball(canvasW, score, vyOverride) {
    const marioX = getMarioX(canvasW);
    const marioY = getMarioY() + MARIO_H / 2;
    const phase  = getMarioPhase(score);
    const spd    = 4 + score * 0.08 + MARIO_PHASES.indexOf(phase) * 0.5;
    const vy     = vyOverride !== undefined ? vyOverride : (Math.random() - 0.3) * 2.5;
    fireballs.push({ id: fbIdCounter++, x: marioX - FB_W, y: marioY - FB_H / 2, vy, rot: 0, spd });
}

function updateFireballs(dt, score, canvasW, canvasH, bird, onDodge) {
    const phase    = getMarioPhase(score);
    const interval = phase.shootInterval;

    fbTimer += dt;
    if (fbTimer >= interval) {
        fbTimer = 0;
        if (phase.burstCount === 1) {
            spawnFireball(canvasW, score);
        } else if (phase.burstCount === 2) {
            spawnFireball(canvasW, score, -phase.spreadAngle);
            spawnFireball(canvasW, score,  phase.spreadAngle);
        } else {
            spawnFireball(canvasW, score, -phase.spreadAngle);
            spawnFireball(canvasW, score,  0);
            spawnFireball(canvasW, score,  phase.spreadAngle);
        }
    }

    const groundY = canvasH - (typeof GROUND_H !== 'undefined' ? GROUND_H : 80);
    fireballs.forEach(fb => {
        fb.x   -= fb.spd;
        fb.y   += fb.vy;
        fb.vy  += 0.12;
        fb.rot += 0.15;
        if (fb.y + FB_H >= groundY) {
            fb.y  = groundY - FB_H;
            fb.vy = -(Math.abs(fb.vy) * 0.55);
            if (typeof SFX !== 'undefined') SFX.fbBounce();
        }
        if (fb.y <= 0) { fb.y = 0; fb.vy = Math.abs(fb.vy); }
        if (!fbDodged.has(fb.id) && fb.x + FB_W < bird.x - 10) {
            fbDodged.add(fb.id);
            onDodge();
        }
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
    ctx.fillStyle   = '#ff8800';
    ctx.fillRect(-FB_W / 2 - 3, -FB_H / 2 - 3, FB_W + 6, FB_H + 6);
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawFireballs(ctx) { fireballs.forEach(fb => drawFireball(ctx, fb)); }

function checkFireballCollision(birdX, birdY, birdW, birdH) {
    const bx = birdX - birdW * 0.35, by = birdY - birdH * 0.35;
    const bw = birdW * 0.7, bh = birdH * 0.7;
    for (const fb of fireballs) {
        if (bx < fb.x + FB_W && bx + bw > fb.x && by < fb.y + FB_H && by + bh > fb.y) return true;
    }
    return false;
}