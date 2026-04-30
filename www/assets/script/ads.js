// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DU BRIDGE CAPACITOR
// ─────────────────────────────────────────────────────────────────────────────
const AdMob = window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.AdMob : null;

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
            initializeForTesting: false, // Désactivé pour la mise en production
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
            adId: 'ca-app-pub-1547050289305054/8364297093', // ⚠️ À REMPLACER : Mettez votre véritable ID AdMob
            isTesting: false, // Désactivé pour la mise en production
        });
    } catch (e) {
        adLoaded = false;
        console.log('F.R.I.D.A.Y. : Erreur Preload -', e);
    }
}

async function showReviveAd(onSuccess) {
    // Sécurité : On ne lance rien si la pub n'est pas chargée ou déjà utilisée
    if (hasRevived || !adLoaded || isShowingAd || !AdMob) {
        onSuccess(false);
        return;
    }

    isShowingAd = true;
    try {
        const result = await AdMob.showRewardVideoAd();
        if (result && result.type === 'rewarded') {
            hasRevived = true;
            onSuccess(true);
        } else {
            onSuccess(false);
        }
    } catch (e) {
        console.error('F.R.I.D.A.Y. : Erreur affichage Revive -', e);
        onSuccess(false);
    } finally {
        isShowingAd = false;
        adLoaded = false; // Reset pour forcer le prochain preload
    }
}

async function showDoubleCoinsAd(onSuccess) {
    if (!adLoaded || isShowingAd || !AdMob) {
        onSuccess(false);
        return;
    }

    isShowingAd = true;
    try {
        const result = await AdMob.showRewardVideoAd();
        if (result && result.type === 'rewarded') {
            onSuccess(true);
        } else {
            onSuccess(false);
        }
    } catch (e) {
        console.error('F.R.I.D.A.Y. : Erreur affichage DoubleCoins -', e);
        onSuccess(false);
    } finally {
        isShowingAd = false;
        adLoaded = false; // Reset pour forcer le prochain preload
    }
}

function resetRevive() {
    hasRevived = false;
}