// ─────────────────────────────────────────────
// AUDIO — Sons 8-bit générés via Web Audio API
// ─────────────────────────────────────────────

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function beep(freq, dur, type = 'square', vol = 0.25, freqEnd = null) {
    if (!audioCtx) return;
    try {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (freqEnd) osc.frequency.linearRampToValueAtTime(freqEnd, audioCtx.currentTime + dur);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
}

function noise(dur, vol = 0.2) {
    if (!audioCtx) return;
    try {
        const n   = Math.floor(audioCtx.sampleRate * dur);
        const buf = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        const src  = audioCtx.createBufferSource();
        const gain = audioCtx.createGain();
        src.buffer = buf;
        src.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        src.start();
    } catch (e) {}
}

const SFX = {
    // ─── Sons de base ───
    flap:     () => { beep(600, 0.06, 'square', 0.18, 900); },
    score:    () => { beep(880, 0.06, 'square', 0.2); beep(1100, 0.08, 'square', 0.2); },
    hit:      () => { noise(0.15, 0.5); beep(150, 0.15, 'sawtooth', 0.4, 80); },
    die:      () => { [440, 330, 220, 110].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'sawtooth', 0.35), i * 120)); },
    ready:    () => { beep(660, 0.08, 'square', 0.15); beep(880, 0.1, 'square', 0.15); },

    // ─── Sons mode Mario ───
    fbBounce:   () => { beep(300, 0.05, 'square', 0.1, 200); },
    marioLaugh: () => {
        [330, 392, 330, 392, 523].forEach((f, i) =>
            setTimeout(() => beep(f, 0.1, 'square', 0.15), i * 100));
    },

    // ─── Sons progression ───
    newRecord: () => {
        [523, 659, 784, 1047, 1318].forEach((f, i) =>
            setTimeout(() => beep(f, 0.12, 'square', 0.25), i * 80));
    },
    levelUp: () => {
        [392, 523, 659, 784, 1047].forEach((f, i) =>
            setTimeout(() => beep(f, 0.15, 'square', 0.3), i * 90));
        setTimeout(() => beep(1047, 0.3, 'square', 0.35), 500);
    },
    achievement: () => {
        beep(880, 0.08, 'square', 0.2);
        setTimeout(() => beep(1100, 0.08, 'square', 0.2), 80);
        setTimeout(() => beep(1320, 0.15, 'square', 0.25), 160);
    },

    // ─── Combo Mario ───
    combo: (count) => {
        const freq = Math.min(400 + count * 100, 1200);
        beep(freq, 0.06, 'square', 0.2);
        setTimeout(() => beep(freq * 1.25, 0.08, 'square', 0.2), 60);
    },
};