// ─────────────────────────────────────────────
// PARTICULES — Explosions pixel
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
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────
// ÉTOILES — Fond défilant
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
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1;
}
