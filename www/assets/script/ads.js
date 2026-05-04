// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DU BRIDGE CAPACITOR
// ─────────────────────────────────────────────────────────────────────────────
const AdMob = window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.AdMob : null;
const REWARD_AD_ID_FALLBACK = 'ca-app-pub-3940256099942544/5224354917';

function readMetaConfig(name, fallback = '') {
    const tag = document.querySelector(`meta[name="${name}"]`);
    const value = tag && typeof tag.content === 'string' ? tag.content.trim() : '';
    return value || fallback;
}

const REWARD_AD_ID = readMetaConfig('poulpix-admob-reward-id', REWARD_AD_ID_FALLBACK);
const AD_IS_TESTING = readMetaConfig('poulpix-admob-testing', 'true') === 'true';

let adLoaded = false;
let hasRevived = false;
let isShowingAd = false;

async function initAds() {
    if (!AdMob) {
        console.error("F.R.I.D.A.Y. : Bridge AdMob manquant.");
        return;
    }

    try {
        await AdMob.initialize({
            requestTrackingAuthorization: true,
            testingDevices: ['EMULATOR'],
            initializeForTesting: AD_IS_TESTING,
        });

        // --- Listeners ---

        AdMob.addListener('rewardVideoAdLoaded', () => {
            adLoaded = true;
            console.log('F.R.I.D.A.Y. : Publicité prête.');
            // Vous pourriez déclencher une notification visuelle personnalisée ici si besoin.
        });

        AdMob.addListener('rewardVideoAdFailedToLoad', (error) => {
            adLoaded = false;
            console.log('F.R.I.D.A.Y. : Échec chargement pub - Code:', error.code);
            // Nouvelle tentative automatique après 15 secondes
            setTimeout(() => preloadRewardAd(), 15000);
        });

        AdMob.addListener('rewardVideoAdDismissed', () => {
            adLoaded = false;
            isShowingAd = false;
            preloadRewardAd(); // Recharge une pub immédiatement après la fermeture
        });

        preloadRewardAd();

    } catch (e) {
        console.error('F.R.I.D.A.Y. : Erreur initialisation AdMob -', e);
    }
}

async function preloadRewardAd() {
    if (isShowingAd || !AdMob) return;

    try {
        await AdMob.prepareRewardVideoAd({
            adId: REWARD_AD_ID,
            isTesting: AD_IS_TESTING,
        });
    } catch (e) {
        adLoaded = false;
        console.log('F.R.I.D.A.Y. : Erreur Preload -', e);
    }
}

async function showGenericRewardAd(isRevive, onSuccess) {
    if ((isRevive && hasRevived) || !adLoaded || isShowingAd || !AdMob) {
        onSuccess(false);
        return;
    }

    isShowingAd = true;
    try {
        const result = await AdMob.showRewardVideoAd();
        if (result && result.type === 'rewarded') {
            if (isRevive) hasRevived = true;
            onSuccess(true);
        } else {
            onSuccess(false);
        }
    } catch (e) {
        console.error(`F.R.I.D.A.Y. : Erreur affichage pub (Revive: ${isRevive}) -`, e);
        onSuccess(false);
    } finally {
        isShowingAd = false;
        adLoaded = false; // Reset pour forcer le prochain preload
    }
}

// --- API Publique appelée par game.js ---
function showReviveAd(onSuccess) {
    return showGenericRewardAd(true, onSuccess);
}
function showDoubleCoinsAd(onSuccess) {
    return showGenericRewardAd(false, onSuccess);
}

function resetRevive() {
    hasRevived = false;
}