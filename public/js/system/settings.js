import { state } from '../core/state.js';
import { setItem } from '../core/storage.js';
import { playSound } from '../core/audio.js';

export function initSettings() {
    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
        soundToggle.checked = state.soundEnabled;
        soundToggle.addEventListener('change', (e) => {
            state.soundEnabled = e.target.checked;
            setItem('win10-sound', state.soundEnabled ? '1' : '0');
            playSound('click');
        });
    }

    const themeToggle = document.getElementById('setting-theme-toggle');
    if (themeToggle) {
        themeToggle.checked = document.body.classList.contains('light-mode');
        themeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('light-mode');
                setItem('win10-theme', 'light');
            } else {
                document.body.classList.remove('light-mode');
                setItem('win10-theme', 'dark');
            }
            playSound('click');
        });
    }

    // Wallpaper options
    let wallpaperRequestId = 0;
    document.querySelectorAll('.wallpaper-option-card').forEach((card, idx) => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.wallpaper-option-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            const wpUrl = card.dataset.wallpaper;
            const desktopWp = document.getElementById('desktop-wallpaper');
            if (desktopWp && wpUrl) {
                const requestId = ++wallpaperRequestId;
                const img = new Image();
                img.onload = () => {
                    if (requestId !== wallpaperRequestId) return;
                    desktopWp.style.backgroundImage = `url('${wpUrl}')`;
                    state.currentWallpaperIdx = idx;
                    setItem('win10-wallpaper', wpUrl);
                };
                img.onerror = () => {
                    if (requestId !== wallpaperRequestId) return;
                    const fallback = state.wallpapers[0];
                    desktopWp.style.backgroundImage = `url('${fallback}')`;
                    state.currentWallpaperIdx = 0;
                    setItem('win10-wallpaper', fallback);
                    document.querySelectorAll('.wallpaper-option-card').forEach((option, optionIndex) => {
                        option.classList.toggle('active', optionIndex === 0);
                    });
                };
                img.src = wpUrl;
            }
            playSound('click');
        });
    });
}
