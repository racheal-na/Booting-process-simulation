export const playBeep = (freq = 440, duration = 100, type = 'square') => {
    if (typeof window === 'undefined') return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
};

export const playPostBeep = () => playBeep(880, 200, 'square'); // High pitch short beep
export const playErrorBeep = () => {
    // Sequence of beeps for error
    playBeep(200, 500, 'sawtooth');
    setTimeout(() => playBeep(200, 500, 'sawtooth'), 600);
    setTimeout(() => playBeep(200, 500, 'sawtooth'), 1200);
};
