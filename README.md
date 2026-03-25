# Poulpix — Pixel Edition

Jeu mobile Flappy Bird style pixel art avec 2 modes de jeu, boutique de skins et publicités reward.

## Structure

```
poulpix/
├── capacitor.config.ts
├── package.json
└── www/
    ├── index.html
    └── assets/
        ├── css/
        │   └── style.css
        └── script/
            ├── audio.js      → Sons 8-bit (Web Audio API)
            ├── sprites.js    → Pixel art oiseau, tuyaux, sol
            ├── particles.js  → Étoiles + explosions
            ├── skins.js      → 6 skins + boutique + pièces
            ├── mario.js      → Mode Boss Mario (tuyau + boules de feu + fond)
            ├── ads.js        → Publicités reward AdMob
            └── game.js       → Boucle principale + menus + états
```

## Modes de jeu

- **Classique** — évite les tuyaux, 🪙 ×1 par point
- **Boss Mario** — esquive les boules de feu lancées par Mario, 🪙 ×2 par esquive

## Skins disponibles

| Skin     | Prix  |
|----------|-------|
| Classique | Gratuit |
| Or        | 80 🪙  |
| Zombie    | 150 🪙 |
| Ninja     | 250 🪙 |
| Royal     | 400 🪙 |
| Feu       | 600 🪙 |

## Installation

```bash
npm install
npx cap add android
npx cap sync
npx cap open android
```

## AdMob

1. Crée un compte sur admob.google.com
2. Remplace les IDs dans `www/assets/script/ads.js`
3. Remplace l'APP_ID dans `android/app/src/main/AndroidManifest.xml`

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXX~XXXXXXXXXX"/>
```
