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

// ─── Sprite Renard ───
const MARIO_SPR = [
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0], // Pointes des oreilles
    [0, 1, 2, 1, 0, 0, 1, 2, 1, 0], // Intérieur blanc
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0], // Haut du crâne
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Tête
    [1, 2, 2, 1, 1, 1, 1, 2, 2, 1], // Dessus des yeux
    [1, 2, 3, 2, 1, 1, 2, 3, 2, 1], // Yeux (3 = noir)
    [1, 2, 2, 2, 3, 3, 2, 2, 2, 1], // Museau avec truffe
    [0, 1, 2, 2, 2, 2, 2, 2, 1, 0], // Bas du museau
    [0, 0, 1, 1, 2, 2, 1, 1, 0, 0], // Cou
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0], // Corps
    [1, 1, 4, 4, 0, 0, 4, 4, 1, 1], // Pattes
    [1, 1, 4, 4, 0, 0, 4, 4, 1, 1], // Pattes
];

const MARIO_PAL = { 1: '#e66a00', 2: '#ffffff', 3: '#111111', 4: '#8c3d00' };

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

const TREES = [
    { xp: 0.15, s: 1.2 },
    { xp: 0.35, s: 0.9 },
    { xp: 0.55, s: 1.4 },
    { xp: 0.85, s: 1.1 },
];

// Couleurs du ciel par phase (index 0→3)
const PHASE_SKIES = [
    { top: '#6bc3d6', bot: '#a8e6cf' }, // Phase 1 — Matin en forêt (bleu et vert clair)
    { top: '#d2691e', bot: '#f4a460' }, // Phase 2 — Automne / Fin de journée (ocre et brun)
    { top: '#2f4f4f', bot: '#556b2f' }, // Phase 3 — Forêt brumeuse (gris ardoise et vert olive)
    { top: '#0a110a', bot: '#1b3b22' }, // Phase 4 — Nuit noire (noir et vert sapin profond)
];

function drawMarioBackground(ctx, canvasW, canvasH, offset, score) {
    const GH       = typeof GROUND_H !== 'undefined' ? GROUND_H : 80;
    const groundY  = canvasH - GH;
    const phase    = getMarioPhase(score || 0);
    const phaseIdx = MARIO_PHASES.indexOf(phase);
    const sky      = PHASE_SKIES[phaseIdx] || PHASE_SKIES[0];
    const isNight  = phaseIdx === 3;

    // Ciel — couleur selon la phase
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, sky.top);
    grad.addColorStop(1, sky.bot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, groundY);

    // Collines
    const hillColor1 = isNight ? '#0b1a10' : '#3aaa3a';
    const hillColor2 = isNight ? '#132b18' : '#4cc44c';
    const hillSpots  = isNight ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.25)';

    HILLS.forEach(h => {
        const cx = ((h.xp * canvasW - offset * 0.2) % (canvasW + 200)) - 100;
        const r  = h.rp * canvasW;
        ctx.fillStyle = hillColor1;
        ctx.beginPath(); ctx.arc(cx, groundY, r, Math.PI, 0); ctx.fill();
        ctx.fillStyle = hillColor2;
        ctx.beginPath(); ctx.arc(cx, groundY - 6, r - 4, Math.PI, 0); ctx.fill();
        ctx.fillStyle = hillSpots;
        ctx.beginPath(); ctx.arc(cx - r * 0.3, groundY - r * 0.5, r * 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + r * 0.1, groundY - r * 0.65, r * 0.05, 0, Math.PI * 2); ctx.fill();
    });

    // Nuages
    CLOUDS.forEach(c => {
        const cx = ((c.xp * canvasW - offset * 0.3) % (canvasW + 200) + canvasW + 200) % (canvasW + 200) - 100;
        drawCloud(ctx, cx, c.yp * groundY, c.s * 28, isNight);
    });

    // Arbres (forêt)
    TREES.forEach(t => {
        const tx = ((t.xp * canvasW - offset * 0.5) % (canvasW + 150) + canvasW + 150) % (canvasW + 150) - 75;
        drawTree(ctx, tx, groundY, t.s, isNight);
    });

    // Sol
    ctx.fillStyle = isNight ? '#122616' : '#6ac832';
    ctx.fillRect(0, groundY, canvasW, GH);
    ctx.fillStyle = isNight ? '#0a170c' : '#4a9818';
    ctx.fillRect(0, groundY, canvasW, 8);
    ctx.fillStyle = isNight ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)';
    const tileW = 32;
    for (let x = -tileW + (offset * 0.8 % tileW); x < canvasW + tileW; x += tileW) {
        ctx.fillRect(x, groundY + 8, 1, GH - 8);
    }
    for (let y = groundY + 16; y < groundY + GH; y += 16) {
        ctx.fillRect(0, y, canvasW, 1);
    }
}

function drawCloud(ctx, cx, cy, s, isNight = false) {
    ctx.fillStyle = isNight ? '#182b1c' : '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - s, cy + s * 0.4, s * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s, cy + s * 0.4, s * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - s * 0.4, cy + s * 0.8, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s * 0.4, cy + s * 0.8, s * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isNight ? 'rgba(0,0,0,0.3)' : 'rgba(200,230,255,0.5)';
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.3, s * 0.6, 0, Math.PI * 2); ctx.fill();
}

function drawTree(ctx, x, y, scale, isNight = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Tronc
    ctx.fillStyle = isNight ? '#1f1311' : '#6b4226';
    ctx.fillRect(-5, -30, 10, 30);

    // Feuillage en 3 couches pour faire un joli sapin
    ctx.fillStyle = isNight ? '#0d1f13' : '#2d7a3e';
    
    ctx.beginPath();
    ctx.moveTo(-25, -20); ctx.lineTo(0, -55); ctx.lineTo(25, -20); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-20, -40); ctx.lineTo(0, -70); ctx.lineTo(20, -40); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-15, -55); ctx.lineTo(0, -85); ctx.lineTo(15, -55); ctx.fill();

    ctx.restore();
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

    // --- NOUVEAU DESIGN : CLÔTURE BLANCHE ---
    const capH = 20; // Hauteur de la pointe de la clôture

    // Pointe de la clôture
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(pipeX, pipeTop + capH);
    ctx.lineTo(pipeX + PIPE_MARIO_W / 2, pipeTop);
    ctx.lineTo(pipeX + PIPE_MARIO_W, pipeTop + capH);
    ctx.fill();

    // Ombre de la pointe
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(pipeX + PIPE_MARIO_W / 2, pipeTop);
    ctx.lineTo(pipeX + PIPE_MARIO_W, pipeTop + capH);
    ctx.lineTo(pipeX + PIPE_MARIO_W - 6, pipeTop + capH);
    ctx.lineTo(pipeX + PIPE_MARIO_W / 2, pipeTop + 6);
    ctx.fill();

    // Corps du poteau principal
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pipeX, pipeTop + capH, PIPE_MARIO_W, groundY - pipeTop - capH);

    // Ombre côté droit du poteau
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(pipeX + PIPE_MARIO_W - 8, pipeTop + capH, 8, groundY - pipeTop - capH);

    // Lignes de bois verticales
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(pipeX + 15, pipeTop + capH, 2, groundY - pipeTop - capH);
    ctx.fillRect(pipeX + 30, pipeTop + capH, 2, groundY - pipeTop - capH);
    ctx.fillRect(pipeX + 45, pipeTop + capH, 2, groundY - pipeTop - capH);

    // Traverse horizontale
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pipeX - 6, pipeTop + capH + 20, PIPE_MARIO_W + 12, 14);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(pipeX - 6, pipeTop + capH + 32, PIPE_MARIO_W + 12, 2);

    // Boss Renard (miroir vers la gauche)
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
    // Hitbox réduite à 50% pour la cohérence avec le mode classique
    const bx = birdX - birdW * 0.25, by = birdY - birdH * 0.25;
    const bw = birdW * 0.5, bh = birdH * 0.5;
    for (const fb of fireballs) {
        if (bx < fb.x + FB_W && bx + bw > fb.x && by < fb.y + FB_H && by + bh > fb.y) return true;
    }
    return false;
}