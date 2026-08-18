import { playSound } from '../core/audio.js';
import { openWindow } from '../core/window-manager.js';

export function initContextMenu() {
    const contextMenu = document.getElementById('desktop-context-menu');

    document.getElementById('desktop-shell')?.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.win-window')) return; // Allow normal window right-clicks
        e.preventDefault();
        if (!contextMenu) return;

        contextMenu.style.left = `${Math.min(e.clientX, window.innerWidth - 220)}px`;
        contextMenu.style.top = `${Math.min(e.clientY, window.innerHeight - 300)}px`;
        contextMenu.classList.remove('hidden');
        playSound('click');
    });

    document.addEventListener('click', () => {
        contextMenu?.classList.add('hidden');
    });

    // Context menu actions
    contextMenu?.querySelectorAll('.context-item')?.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'refresh') {
                location.reload();
            } else if (action === 'terminal') {
                openWindow('cmd');
            } else if (action === 'settings') {
                openWindow('settings');
            } else if (action === 'projects') {
                openWindow('projects');
            }
            contextMenu.classList.add('hidden');
        });
    });
}
