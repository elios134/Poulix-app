let adLoaded = false;
let hasRevived = false;
let isShowingAd = false; // Verrou pour éviter les doubles clics/crashs

async function initAds() {
    try {
        await AdMob.initialize({
            requestTrackingAuthorization: false,
            testingDevices: ['EMULATOR'],
            initializeForTesting: true,
        });

        // --- Configuration des Listeners (Sécurité Google Play) ---
        
        // Se déclenche quand une pub est prête
        AdMob.addListener('rewardVideoAdLoaded', () => {
            adLoaded = true;
            console.log('F.R.I.D.A.Y. : Publicité Reward prête en mémoire.');
        });

        // Se déclenche si le chargement échoue
        AdMob.addListener('rewardVideoAdFailedToLoad', (error) => {
            adLoaded = false;
            console.log('F.R.I.D.A.Y. : Échec chargement pub. Tentative de reconnexion dans 15s.');
            // Auto-retry après 15 secondes pour ne pas rester bloqué
            setTimeout(() => preloadRewardAd(), 15000);
        });

        // Se déclenche quand la pub est fermée (réussite ou abandon)
        AdMob.addListener('rewardVideoAdDismissed', () => {
            adLoaded = false;
            isShowingAd = false;
            preloadRewardAd(); // On prépare la suivante immédiatement
        });

        preloadRewardAd();
    } catch(e) {
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
    } catch(e) {
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
    } catch(e) {
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
    } catch(e) {
        console.log('showDoubleCoinsAd error:', e);
        onSuccess(false);
    } finally {
        isShowingAd = false;
    }
}

function resetRevive() {
    hasRevived = false;
}