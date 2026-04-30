let adLoaded = false;
let hasRevived = false;
let isShowingAd = false; // Verrou pour éviter les doubles clics/crashs

async function initAds() {
    console.log("CHECKPOINT_ADMOB_START");
    try {
        // Alerte de diagnostic 1
        alert("F.R.I.D.A.Y. : Tentative d'initialisation AdMob...");

        await AdMob.initialize({
            requestTrackingAuthorization: true,
            testingDevices: ['EMULATOR'],
            initializeForTesting: true,
        });

        // Alerte de diagnostic 2
        alert("F.R.I.D.A.Y. : Initialisation réussie. Configuration des listeners...");

        AdMob.addListener('rewardVideoAdLoaded', () => {
            adLoaded = true;
            alert('F.R.I.D.A.Y. : Publicité prête !'); // Alerte de succès
            console.log('F.R.I.D.A.Y. : Publicité Reward prête en mémoire.');
        });

        AdMob.addListener('rewardVideoAdFailedToLoad', (error) => {
            adLoaded = false;
            alert('F.R.I.D.A.Y. : Échec chargement pub - ' + JSON.stringify(error));
            setTimeout(() => preloadRewardAd(), 15000);
        });

        AdMob.addListener('rewardVideoAdDismissed', () => {
            adLoaded = false;
            isShowingAd = false;
            preloadRewardAd();
        });

        preloadRewardAd();
    } catch (e) {
        alert('F.R.I.D.A.Y. : Erreur critique INIT - ' + e.message);
        console.log('AdMob init failed:', e);
    }
}

async function preloadRewardAd() {
    // Si déjà en train de montrer une pub, on n'essaie pas d'en charger une autre
    if (isShowingAd) return;

    try {
        await AdMob.prepareRewardVideoAd({
            adId: 'ca-app-pub-3940256099942544/5224354917', // ID test Google
            isTesting: true,
        });
    } catch (e) {
        adLoaded = false;
        console.log('Preload failed:', e);
    }
}

// Revive — disponible une seule fois par partie
async function showReviveAd(onSuccess) {
    // Sécurités contre les crashs de l'interface
    if (hasRevived || !adLoaded || isShowingAd) {
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
        console.log('showReviveAd error:', e);
        onSuccess(false);
    } finally {
        isShowingAd = false;
    }
}

// Double pièces — toujours disponible
async function showDoubleCoinsAd(onSuccess) {
    if (!adLoaded || isShowingAd) {
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
        console.log('showDoubleCoinsAd error:', e);
        onSuccess(false);
    } finally {
        isShowingAd = false;
    }
}

function resetRevive() {
    hasRevived = false;
}