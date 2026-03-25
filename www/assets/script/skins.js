// ─────────────────────────────────────────────
// SKINS — Définitions et système de boutique
// ─────────────────────────────────────────────

// Palette : [couleur principale, couleur sombre, couleur claire]
const SKINS = [
    {
        id:     'classic',
        name:   'CLASSIQUE',
        price:  0,
        emoji:  '🐔',
        pal:    ['#ffdd00', '#b8860b', '#fff9cc'],
    },
    {
        id:     'gold',
        name:   'OR',
        price:  80,
        emoji:  '✨',
        pal:    ['#ffd700', '#8b6914', '#fffacd'],
    },
    {
        id:     'zombie',
        name:   'ZOMBIE',
        price:  150,
        emoji:  '🧟',
        pal:    ['#7ec850', '#3a6020', '#d4f0a0'],
    },
    {
        id:     'ninja',
        name:   'NINJA',
        price:  250,
        emoji:  '🥷',
        pal:    ['#222222', '#000000', '#555555'],
    },
    {
        id:     'royal',
        name:   'ROYAL',
        price:  400,
        emoji:  '👑',
        pal:    ['#cc44ff', '#660099', '#eeaaff'],
    },
    {
        id:     'fire',
        name:   'FEU',
        price:  600,
        emoji:  '🔥',
        pal:    ['#ff4400', '#881100', '#ffaa44'],
    },
];

// ─── Persistance ───
function getCoins()       { return parseInt(localStorage.getItem('fb_coins') || '0'); }
function setCoins(n)      { localStorage.setItem('fb_coins', Math.max(0, n)); }
function addCoins(n)      { setCoins(getCoins() + n); }

function getUnlocked()    { return JSON.parse(localStorage.getItem('fb_unlocked') || '["classic"]'); }
function unlockSkin(id)   {
    const u = getUnlocked();
    if (!u.includes(id)) { u.push(id); localStorage.setItem('fb_unlocked', JSON.stringify(u)); }
}
function isSkinUnlocked(id) { return getUnlocked().includes(id); }

function getActiveSkin()  { return localStorage.getItem('fb_skin') || 'classic'; }
function setActiveSkin(id){ localStorage.setItem('fb_skin', id); }

function getSkin(id)      { return SKINS.find(s => s.id === id) || SKINS[0]; }
function getActivePal()   { return getSkin(getActiveSkin()).pal; }

// ─── Boutique DOM ───
function renderShop() {
    const grid    = document.getElementById('shop-grid');
    const coins   = getCoins();
    const unlocked = getUnlocked();
    const active  = getActiveSkin();
    grid.innerHTML = '';

    SKINS.forEach(skin => {
        const isUnlocked = unlocked.includes(skin.id);
        const isActive   = skin.id === active;
        const canBuy     = !isUnlocked && coins >= skin.price;

        const card = document.createElement('div');
        card.className = 'skin-card' + (isActive ? ' active' : '') + (isUnlocked ? ' owned' : '');

        card.innerHTML = `
            <div class="skin-emoji">${skin.emoji}</div>
            <div class="skin-name">${skin.name}</div>
            ${isActive
                ? '<div class="skin-status equipped">✔ ÉQUIPÉ</div>'
                : isUnlocked
                    ? '<button class="skin-btn equip-btn">ÉQUIPER</button>'
                    : `<button class="skin-btn buy-btn ${canBuy ? '' : 'locked'}" data-price="${skin.price}">
                            🪙 ${skin.price}
                       </button>`
            }
        `;

        // Équiper
        const equipBtn = card.querySelector('.equip-btn');
        if (equipBtn) {
            equipBtn.addEventListener('click', () => {
                setActiveSkin(skin.id);
                renderShop();
            });
        }

        // Acheter
        const buyBtn = card.querySelector('.buy-btn');
        if (buyBtn && canBuy) {
            buyBtn.addEventListener('click', () => {
                if (getCoins() >= skin.price) {
                    setCoins(getCoins() - skin.price);
                    unlockSkin(skin.id);
                    setActiveSkin(skin.id);
                    renderShop();
                    updateCoinDisplay();
                }
            });
        }

        grid.appendChild(card);
    });
}

function updateCoinDisplay() {
    document.querySelectorAll('.coin-count').forEach(el => {
        el.textContent = getCoins();
    });
}
