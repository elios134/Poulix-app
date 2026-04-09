// ─────────────────────────────────────────────
// PARTICULES — Explosions, étoiles, planètes, flammes
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// EXPLOSIONS PIXEL
// ─────────────────────────────────────────────

let particles = [];

function spawnExplosion(cx, cy, color, count = 14) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 3.5;
        particles.push({
            x: cx, y: cy,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            size: 2 + Math.random() * 3,
            life: 1,
            decay: 0.035 + Math.random() * 0.04,
            color,
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= p.decay;
        return p.life > 0;
    });
}

function drawParticles(ctx) {
    particles.forEach(p => {
        ctx.globalAlpha = p.life * p.life;
        ctx.fillStyle   = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────
// ÉTOILES CLASSIQUES — fond défilant vertical
// ─────────────────────────────────────────────

let stars = [];

function initStars(width, height) {
    stars = Array.from({ length: 90 }, () => ({
        x:     Math.random() * width,
        y:     Math.random() * height,
        speed: 0.15 + Math.random() * 0.6,
        size:  Math.random() < 0.25 ? 2 : 1,
        bri:   0.2 + Math.random() * 0.8,
    }));
}

function updateStars(height, width) {
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });
}

function drawStars(ctx) {
    stars.forEach(s => {
        ctx.globalAlpha = s.bri;
        ctx.fillStyle   = '#fff';
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────
// ÉTOILES FILANTES — traversent l'écran en diagonale
// ─────────────────────────────────────────────

let shootingStars = [];
let shootingStarTimer = 0;

function initShootingStars() {
    shootingStars = [];
    shootingStarTimer = 0;
}

function updateShootingStars(dt, width, height) {
    shootingStarTimer += dt;

    // Spawn aléatoire toutes les 2-5 secondes
    if (shootingStarTimer > 800 + Math.random() * 3000) {
        shootingStarTimer = 0;
        shootingStars.push({
            x:     Math.random() * width,
            y:     Math.random() * height * 0.5,
            vx:    3 + Math.random() * 4,
            vy:    1 + Math.random() * 2,
            len:   40 + Math.random() * 60,
            life:  1,
            decay: 0.02 + Math.random() * 0.015,
        });
    }

    shootingStars = shootingStars.filter(s => {
        s.x    += s.vx;
        s.y    += s.vy;
        s.life -= s.decay;
        return s.life > 0 && s.x < width + s.len;
    });
}

function drawShootingStars(ctx) {
    shootingStars.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.life * 0.8;
        const grad = ctx.createLinearGradient(
            s.x - s.vx * s.len / 4, s.y - s.vy * s.len / 4,
            s.x, s.y
        );
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,1)');
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * s.len / 4, s.y - s.vy * s.len / 4);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        // Point brillant à la tête
        ctx.globalAlpha = s.life;
        ctx.fillStyle   = '#ffffff';
        ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
        ctx.restore();
    });
}

// ─────────────────────────────────────────────
// PLANÈTES — défilent lentement en arrière-plan
// ─────────────────────────────────────────────

const PLANET_DEFS = [
    { color: '#e87040', ring: false, size: 18 }, // Mars
    { color: '#c8a060', ring: true,  size: 24 }, // Saturne
    { color: '#4080e8', ring: false, size: 14 }, // Neptune
    { color: '#60c8a0', ring: false, size: 10 }, // Uranus
];

let planets = [];

function initPlanets(width, height) {
    planets = PLANET_DEFS.map((def, i) => ({
        x:     (width * (i + 1)) / (PLANET_DEFS.length + 1),
        y:     height * (0.15 + Math.random() * 0.45),
        speed: 0.05 + Math.random() * 0.08,
        ...def,
    }));
}

function updatePlanets(width) {
    planets.forEach(p => {
        p.x -= p.speed;
        if (p.x + p.size < 0) {
            p.x = width + p.size;
            p.y = window.innerHeight * (0.15 + Math.random() * 0.45);
        }
    });
}

function drawPlanets(ctx) {
    planets.forEach(p => {
        ctx.save();
        ctx.globalAlpha = 0.7;

        // Ombre planète
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(p.x + 2, p.y + 2, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Corps planète
        const grad = ctx.createRadialGradient(
            p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.1,
            p.x, p.y, p.size
        );
        grad.addColorStop(0, lightenColor(p.color, 40));
        grad.addColorStop(1, darkenColor(p.color, 40));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Anneau (Saturne)
        if (p.ring) {
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = lightenColor(p.color, 20);
            ctx.lineWidth   = 3;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.size * 1.8, p.size * 0.5, -0.3, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    });
}

function lightenColor(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amount) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `rgb(${r},${g},${b})`;
}

// ─────────────────────────────────────────────
// TRAÎNÉE DE FLAMMES — skin feu uniquement
// ─────────────────────────────────────────────

let flameTrail = [];

function spawnFlame(birdX, birdY) {
    flameTrail.push({
        x:    birdX - 4 + (Math.random() - 0.5) * 6,
        y:    birdY + (Math.random() - 0.5) * 8,
        vx:   -(0.5 + Math.random() * 1.5),
        vy:   (Math.random() - 0.5) * 1.5,
        size: 3 + Math.random() * 5,
        life: 1,
        decay: 0.06 + Math.random() * 0.05,
        color: Math.random() < 0.5 ? '#ff4400' : '#ffaa00',
    });
}

function updateFlameTrail() {
    flameTrail = flameTrail.filter(f => {
        f.x    += f.vx;
        f.y    += f.vy;
        f.size *= 0.92;
        f.life -= f.decay;
        return f.life > 0;
    });
}

function drawFlameTrail(ctx) {
    flameTrail.forEach(f => {
        ctx.globalAlpha = f.life * 0.8;
        ctx.fillStyle   = f.color;
        ctx.fillRect(
            Math.floor(f.x - f.size / 2),
            Math.floor(f.y - f.size / 2),
            Math.ceil(f.size),
            Math.ceil(f.size)
        );
    });
    ctx.globalAlpha = 1;
}

function resetFlameTrail() {
    flameTrail = [];
}