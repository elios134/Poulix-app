// ─────────────────────────────────────────────
// POWER-UPS — Ralenti + Double Score
// Mode classique uniquement, apparition aléatoire
// ─────────────────────────────────────────────

const POWERUP_TYPES = {
    slow:   { id: 'slow',   color: '#00aaff', dark: '#004488', label: '»»', duration: 5000  },
    double: { id: 'double', color: '#ffdd00', dark: '#886600', label: '×2', duration: 10000 },
};

const PU_SIZE    = 6 * PX; // taille du power-up
const PU_SPD_BASE = 3.2;   // suit la vitesse de base
const PU_SPAWN_CHANCE = 0.004; // probabilité par frame (~1 toutes les 8s)
const PU_MIN_INTERVAL = 8000;  // min 8s entre deux power-ups

let powerups        = [];
let puLastSpawn     = 0;     // timestamp dernier spawn
let puTimer         = 0;     // timer depuis début de partie

// États actifs
let activeSlow      = false;
let activeDouble    = false;
let slowTimer       = 0;
let doubleTimer     = 0;

function resetPowerups() {
    powerups    = [];
    puLastSpawn = 0;
    puTimer     = 0;
    activeSlow  = false;
    activeDouble = false;
    slowTimer   = 0;
    doubleTimer = 0;
}

// ─── Spawn ───
function trySpawnPowerup(dt, score, canvasW, canvasH) {
    puTimer += dt;

    // Pas de spawn si un est déjà actif ou trop tôt
    if (puTimer - puLastSpawn < PU_MIN_INTERVAL) return;
    if (powerups.length > 0) return;

    if (Math.random() < PU_SPAWN_CHANCE) {
        const groundY = canvasH - GROUND_H;
        const type    = Math.random() < 0.5 ? 'slow' : 'double';
        const y       = 60 + Math.random() * (groundY - PU_SIZE - 120);
        powerups.push({
            type,
            x: canvasW + PU_SIZE,
            y,
            rot: 0,
            bobOffset: Math.random() * Math.PI * 2,
        });
        puLastSpawn = puTimer;
    }
}

// ─── Update ───
function updatePowerups(dt, score, bird, onCollect) {
    const spd = getPipeSpeed(score);

    powerups.forEach(p => {
        p.x   -= spd;
        p.rot += 0.04;
        p.bobOffset += 0.06;
    });

    powerups = powerups.filter(p => p.x + PU_SIZE > -20);

    // Collision avec le joueur
    const bx = bird.x - BIRD_W * 0.4;
    const by = bird.y - BIRD_H * 0.4;
    const bw = BIRD_W * 0.8;
    const bh = BIRD_H * 0.8;

    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        const py = p.y + Math.sin(p.bobOffset) * 5; // bobbing
        if (bx < p.x + PU_SIZE && bx + bw > p.x &&
            by < py + PU_SIZE   && by + bh > py) {
            powerups.splice(i, 1);
            activatePowerup(p.type);
            onCollect(p.type);
        }
    }

    // Timers actifs
    if (activeSlow) {
        slowTimer -= dt;
        if (slowTimer <= 0) { activeSlow = false; slowTimer = 0; }
    }
    if (activeDouble) {
        doubleTimer -= dt;
        if (doubleTimer <= 0) { activeDouble = false; doubleTimer = 0; }
    }
}

function activatePowerup(type) {
    if (type === 'slow')   { activeSlow   = true; slowTimer   = POWERUP_TYPES.slow.duration;   }
    if (type === 'double') { activeDouble = true; doubleTimer = POWERUP_TYPES.double.duration; }
}

// Retourne le multiplicateur de vitesse actuel
function getSlowMult() { return activeSlow ? 0.45 : 1; }

// Retourne le multiplicateur de score actuel
function getScoreMult() { return activeDouble ? 2 : 1; }

// ─── Dessin power-ups ───
function drawPowerups(ctx) {
    powerups.forEach(p => {
        const def = POWERUP_TYPES[p.type];
        const py  = p.y + Math.sin(p.bobOffset) * 5;

        ctx.save();
        ctx.translate(p.x + PU_SIZE / 2, py + PU_SIZE / 2);
        ctx.rotate(p.rot);

        // Lueur
        ctx.globalAlpha = 0.2;
        ctx.fillStyle   = def.color;
        ctx.fillRect(-PU_SIZE / 2 - 4, -PU_SIZE / 2 - 4, PU_SIZE + 8, PU_SIZE + 8);

        // Fond
        ctx.globalAlpha = 1;
        ctx.fillStyle   = def.dark;
        ctx.fillRect(-PU_SIZE / 2, -PU_SIZE / 2, PU_SIZE, PU_SIZE);

        // Bordure
        ctx.strokeStyle = def.color;
        ctx.lineWidth   = 2;
        ctx.strokeRect(-PU_SIZE / 2 + 1, -PU_SIZE / 2 + 1, PU_SIZE - 2, PU_SIZE - 2);

        // Label pixel
        ctx.globalAlpha = 1;
        ctx.fillStyle   = def.color;
        ctx.font        = `bold ${PX * 2}px "Courier New", monospace`;
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.label, 0, 0);

        ctx.restore();
    });
}

// ─── Dessin HUD power-ups actifs ───
function drawPowerupHUD(ctx, canvasW) {
    const items = [];
    if (activeSlow)   items.push({ label: '»» SLOW',  color: '#00aaff', pct: slowTimer   / POWERUP_TYPES.slow.duration   });
    if (activeDouble) items.push({ label: '×2 SCORE', color: '#ffdd00', pct: doubleTimer / POWERUP_TYPES.double.duration  });

    items.forEach((item, i) => {
        const x   = canvasW / 2 - 60;
        const y   = 56 + i * 22;
        const w   = 120;

        // Barre de durée
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, y, w, 12);
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, w * item.pct, 12);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(x, y, w, 12);
        ctx.globalAlpha = 1;

        // Label
        ctx.font      = `bold 8px "Courier New", monospace`;
        ctx.fillStyle = item.color;
        ctx.textAlign = 'center';
        ctx.fillText(item.label, canvasW / 2, y + 9);
    });
}
