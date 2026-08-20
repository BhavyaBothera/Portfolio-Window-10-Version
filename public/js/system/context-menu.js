import { playSound } from '../core/audio.js';
import { openWindow } from '../core/window-manager.js';

export function initContextMenu() {
    const contextMenu = document.getElementById('context-menu');

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

    // Context menu actions mapped to exact HTML element IDs
    document.getElementById('ctx-refresh')?.addEventListener('click', () => location.reload());
    document.getElementById('ctx-open-terminal')?.addEventListener('click', () => openWindow('cmd'));
    document.getElementById('ctx-open-vscode')?.addEventListener('click', () => openWindow('vscode'));
    document.getElementById('ctx-personalize')?.addEventListener('click', () => openWindow('settings'));
    document.getElementById('ctx-about-os')?.addEventListener('click', () => openWindow('this-pc'));
    document.getElementById('ctx-next-wallpaper')?.addEventListener('click', () => {
        document.getElementById('toggle-wallpaper')?.click();
    });
}
