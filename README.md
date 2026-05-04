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
2. Configure les APP_ID natifs Android par type de build via `android/gradle.properties` :

```properties
ADMOB_APP_ID_DEBUG=ca-app-pub-3940256099942544~3347511713
ADMOB_APP_ID_RELEASE=ca-app-pub-XXXXXXXXXXXXXXX~YYYYYYYYYY
```

3. (Optionnel) Override ponctuel en CI ou local :

```bash
set ADMOB_APP_ID_RELEASE=ca-app-pub-XXXXXXXXXXXXXXX~YYYYYYYYYY
npx cap sync
```

4. Configure l'ID Reward web via les meta tags dans `www/index.html` :

```html
<meta name="poulpix-admob-reward-id" content="ca-app-pub-XXXXXXXXXXXXXXX/ZZZZZZZZZZ">
<meta name="poulpix-admob-testing" content="false">
```

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="${ADMOB_APP_ID}"/>
```

## Checklist Release Android

1. Mettre `ADMOB_APP_ID_RELEASE` avec ton vrai App ID dans `android/gradle.properties` (ou via CI).
2. Mettre `poulpix-admob-reward-id` avec ton vrai Reward ID dans `www/index.html`.
3. Vérifier `poulpix-admob-testing="false"` pour la release.
4. Gérer la version :
   - local : `APP_VERSION_CODE` / `APP_VERSION_NAME` dans `android/gradle.properties`
   - CI : fournir `CI_BUILD_NUMBER` (prioritaire, utilisé automatiquement comme `versionCode`)
5. Lancer :

```bash
npx cap sync
cd android
.\gradlew.bat assembleRelease
```

Exemple CI (Windows) :

```bash
set CI_BUILD_NUMBER=123
.\gradlew.bat assembleRelease
```
