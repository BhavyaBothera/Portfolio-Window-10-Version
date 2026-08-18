import { playSound } from '../core/audio.js';

export function initGrooveMusic() {
    const playBtn = document.getElementById('music-play-btn');
    const titleEl = document.getElementById('music-track-title');
    const artistEl = document.getElementById('music-track-artist');
    const canvas = document.getElementById('music-vis-canvas');

    let isPlaying = false;
    let animId = null;

    function renderVisualizer() {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, w, h);

        const bars = 30;
        const barW = w / bars;

        for (let i = 0; i < bars; i++) {
            const barH = isPlaying ? Math.random() * (h * 0.8) + 10 : 6;
            ctx.fillStyle = `hsl(${i * 12 + 180}, 80%, 60%)`;
            ctx.fillRect(i * barW, h - barH, barW - 2, barH);
        }

        if (isPlaying) {
            animId = requestAnimationFrame(renderVisualizer);
        }
    }

    playBtn?.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (playBtn) playBtn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
        if (titleEl) titleEl.textContent = isPlaying ? 'Synthwave Odyssey' : 'Select a Track';
        if (artistEl) artistEl.textContent = isPlaying ? 'Bhavy Sound System' : 'Groove Music';

        playSound('click');
        if (isPlaying) {
            renderVisualizer();
        } else {
            if (animId) cancelAnimationFrame(animId);
            renderVisualizer();
        }
    });

    renderVisualizer();
}
