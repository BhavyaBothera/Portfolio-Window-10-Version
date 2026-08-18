import { playSound } from '../core/audio.js';
import { openWindow } from '../core/window-manager.js';

export function initStartMenu() {
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');

    const toggleStartMenu = () => {
        if (!startMenu) return;
        startMenu.classList.toggle('hidden');
        playSound('click');
    };

    startBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStartMenu();
    });

    document.addEventListener('click', (e) => {
        if (startMenu && !startMenu.classList.contains('hidden')) {
            if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
                startMenu.classList.add('hidden');
            }
        }
    });

    // Start menu item listeners
    document.querySelectorAll('#start-menu [data-window]').forEach(item => {
        item.addEventListener('click', () => {
            const winId = item.dataset.window;
            if (winId) {
                openWindow(winId);
                startMenu?.classList.add('hidden');
            }
        });
    });
}
