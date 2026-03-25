

let adLoaded   = false;
let hasRevived = false;

async function initAds() {
    try {
        await AdMob.initialize({
            requestTrackingAuthorization: false,
            testingDevices: ['EMULATOR'],
            initializeForTesting: true,
        });
        preloadRewardAd();
    } catch(e) {
        console.log('AdMob init failed:', e);
    }
}

async function preloadRewardAd() {
    try {
        await AdMob.prepareRewardVideoAd({
            adId: 'ca-app-pub-3940256099942544/5224354917', // ID reward test Google
            isTesting: true,
        });
        adLoaded = true;
        console.log('Ad loaded');
    } catch(e) {
        adLoaded = false;
        console.log('Ad load failed:', e);
    }
}

// Revive — disponible une seule fois par partie
async function showReviveAd(onSuccess) {
    if (hasRevived) { onSuccess(false); return; }
    if (!adLoaded)  { onSuccess(false); return; }
    try {
        const result = await AdMob.showRewardVideoAd();
        if (result && result.type === 'rewarded') {
            hasRevived = true;
            onSuccess(true);
            preloadRewardAd();
        } else {
            onSuccess(false);
        }
    } catch(e) {
        console.log('showReviveAd error:', e);
        onSuccess(false);
    }
}

// Double pièces — toujours disponible
async function showDoubleCoinsAd(onSuccess) {
    if (!adLoaded) { onSuccess(false); return; }
    try {
        const result = await AdMob.showRewardVideoAd();
        if (result && result.type === 'rewarded') {
            onSuccess(true);
            preloadRewardAd();
        } else {
            onSuccess(false);
        }
    } catch(e) {
        console.log('showDoubleCoinsAd error:', e);
        onSuccess(false);
    }
}

function resetRevive() {
    hasRevived = false;
}