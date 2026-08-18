import { state } from './state.js';

let audioCtx = null;

export const ensureAudioCtx = () => {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            /* Web Audio not supported */
        }
    }
    return audioCtx;
};

export const playSound = (type) => {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.12, now);

        switch (type) {
            case 'click':
                osc.frequency.setValueAtTime(1200, now);
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
                break;
            case 'open':
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
                osc.type = 'triangle';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
                break;
            case 'close':
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
                osc.type = 'triangle';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now); osc.stop(now + 0.15);
                break;
            case 'minimize':
                osc.frequency.setValueAtTime(700, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.start(now); osc.stop(now + 0.12);
                break;
            case 'error':
                osc.frequency.setValueAtTime(250, now);
                osc.type = 'square';
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
                break;
            case 'notify':
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(1000, now + 0.08);
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now); osc.stop(now + 0.2);
                break;
            case 'startup':
                gain.gain.setValueAtTime(0.08, now);
                osc.type = 'sine';
                [523, 659, 784, 1047].forEach((freq, i) => {
                    osc.frequency.setValueAtTime(freq, now + i * 0.18);
                });
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.start(now); osc.stop(now + 0.8);
                break;
            case 'solitaire-victory': {
                gain.gain.setValueAtTime(0.07, now);
                osc.type = 'sine';
                const melody = [523, 659, 784, 1047, 784, 1047, 1319];
                melody.forEach((freq, i) => {
                    osc.frequency.setValueAtTime(freq, now + i * 0.12);
                });
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
                osc.start(now); osc.stop(now + 1.0);
                break;
            }
            default:
                osc.frequency.setValueAtTime(600, now);
                osc.type = 'sine';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now); osc.stop(now + 0.08);
        }
    } catch (e) {
        /* Graceful audio fail */
    }
};
