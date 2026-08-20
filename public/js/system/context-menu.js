import { playSound } from '../core/audio.js';
import { openWindow } from '../core/window-manager.js';

export function initContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;

    // Accessibility ARIA attributes
    contextMenu.setAttribute('role', 'menu');
    contextMenu.setAttribute('aria-label', 'Desktop Context Menu');
    contextMenu.setAttribute('aria-hidden', 'true');

    const getItems = () => Array.from(contextMenu.querySelectorAll('.context-item'));

    getItems().forEach(item => {
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', '0');
    });

    const openContextMenu = (x, y) => {
        contextMenu.style.left = `${Math.min(x, window.innerWidth - 220)}px`;
        contextMenu.style.top = `${Math.min(y, window.innerHeight - 300)}px`;
        contextMenu.classList.remove('hidden');
        contextMenu.setAttribute('aria-hidden', 'false');
        playSound('click');

        // Focus first context menu item for keyboard users
        const items = getItems();
        if (items.length > 0) {
            try { items[0].focus(); } catch (e) {}
        }
    };

    const closeContextMenu = () => {
        contextMenu.classList.add('hidden');
        contextMenu.setAttribute('aria-hidden', 'true');
    };

    document.getElementById('desktop-shell')?.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.win-window')) return; // Allow normal window right-clicks
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', () => {
        closeContextMenu();
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

    // Keyboard Navigation & Shortcuts for Context Menu
    contextMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeContextMenu();
            return;
        }

        const items = getItems();
        const currentIndex = items.indexOf(document.activeElement);

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (document.activeElement && typeof document.activeElement.click === 'function') {
                document.activeElement.click();
            }
            closeContextMenu();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIdx = (currentIndex + 1) % items.length;
            items[nextIdx]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIdx = (currentIndex - 1 + items.length) % items.length;
            items[prevIdx]?.focus();
        }
    });
}
