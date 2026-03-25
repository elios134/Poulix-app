// ─────────────────────────────────────────────
// SPRITES — Pixel art (1 = couleur, 2 = sombre, 3 = clair, 0 = vide)
// ─────────────────────────────────────────────

const PX = 4; // taille d'un "pixel" en pixels canvas

// Oiseau — 8x8 pixels
const BIRD_FRAMES = [
    // Frame 0 — ailes neutres
    [
        [0, 0, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 3, 0, 0],
        [1, 1, 1, 1, 1, 1, 2, 0],
        [1, 2, 1, 1, 3, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 2, 0],
        [0, 1, 2, 1, 1, 2, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 2, 0, 0, 0, 0],
    ],
    // Frame 1 — ailes hautes
    [
        [0, 1, 2, 2, 0, 0, 0, 0],
        [1, 2, 1, 1, 3, 0, 0, 0],
        [1, 1, 1, 1, 1, 3, 2, 0],
        [1, 2, 1, 1, 3, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 2, 0],
        [0, 0, 1, 2, 1, 2, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 2, 0, 0, 0, 0],
    ],
    // Frame 2 — ailes basses
    [
        [0, 0, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 3, 0, 0],
        [1, 1, 1, 1, 1, 1, 2, 0],
        [1, 2, 1, 1, 3, 1, 1, 1],
        [0, 1, 2, 1, 1, 2, 0, 0],
        [0, 1, 2, 2, 2, 0, 0, 0],
        [0, 1, 2, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ],
];

// Tuyau — section de 8px de large, répétée en hauteur
const PIPE_COL  = [
    [2, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 3, 1, 1, 1, 1, 2],
    [2, 1, 1, 1, 1, 3, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 2],
];

// Chapeau du tuyau — 10px de large
const PIPE_CAP = [
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 1, 3, 1, 1, 1, 1, 3, 1, 2],
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
];

// Palettes
const BIRD_PAL  = ['#ffdd00', '#b8860b', '#fff9cc']; // [main, dark, light]
const PIPE_PAL  = ['#22cc44', '#145c22', '#66ff88']; // [main, dark, light]
const GROUND_PAL = '#c8a84b';

function drawSprite(ctx, spr, x, y, pal) {
    spr.forEach((row, ry) => {
        row.forEach((px, rx) => {
            if (!px) return;
            ctx.fillStyle = px === 2 ? pal[1] : px === 3 ? pal[2] : pal[0];
            ctx.fillRect(Math.floor(x + rx * PX), Math.floor(y + ry * PX), PX, PX);
        });
    });
}

// Dessine un tuyau complet (haut ou bas)
function drawPipe(ctx, x, y, height, isTop) {
    const capH  = PIPE_CAP.length * PX;   // 16px
    const colW  = PIPE_COL[0].length * PX; // 32px
    const capW  = PIPE_CAP[0].length * PX; // 40px
    const capOX = (capW - colW) / 2;       // décalage chapeau centré

    if (isTop) {
        // Corps du tuyau depuis le haut
        for (let py = 0; py < height - capH; py += PIPE_COL.length * PX) {
            const rows = Math.min(PIPE_COL.length, Math.ceil((height - capH - py) / PX));
            for (let r = 0; r < rows; r++) {
                PIPE_COL[r % PIPE_COL.length].forEach((cell, rx) => {
                    if (!cell) return;
                    ctx.fillStyle = cell === 2 ? PIPE_PAL[1] : cell === 3 ? PIPE_PAL[2] : PIPE_PAL[0];
                    ctx.fillRect(Math.floor(x + rx * PX), Math.floor(y + py + r * PX), PX, PX);
                });
            }
        }
        // Chapeau en bas du tuyau top
        drawSprite(ctx, PIPE_CAP, x - capOX, y + height - capH, PIPE_PAL);
    } else {
        // Chapeau en haut du tuyau bottom
        drawSprite(ctx, PIPE_CAP, x - capOX, y, PIPE_PAL);
        // Corps du tuyau vers le bas
        for (let py = capH; py < height; py += PIPE_COL.length * PX) {
            const rows = Math.min(PIPE_COL.length, Math.ceil((height - py) / PX));
            for (let r = 0; r < rows; r++) {
                PIPE_COL[r % PIPE_COL.length].forEach((cell, rx) => {
                    if (!cell) return;
                    ctx.fillStyle = cell === 2 ? PIPE_PAL[1] : cell === 3 ? PIPE_PAL[2] : PIPE_PAL[0];
                    ctx.fillRect(Math.floor(x + rx * PX), Math.floor(y + py + r * PX), PX, PX);
                });
            }
        }
    }
}

// Sol pixelisé défilant
function drawGround(ctx, canvasW, groundY, offset) {
    const tileW = 16;
    ctx.fillStyle = GROUND_PAL;
    ctx.fillRect(0, groundY, canvasW, 20);

    ctx.fillStyle = '#a07830';
    for (let x = -tileW + (offset % tileW); x < canvasW + tileW; x += tileW) {
        ctx.fillRect(x, groundY, tileW - 2, 4);
    }
    ctx.fillStyle = '#e8c870';
    for (let x = -tileW + (offset % tileW); x < canvasW + tileW; x += tileW) {
        ctx.fillRect(x + 2, groundY + 5, tileW - 4, 2);
    }
}
