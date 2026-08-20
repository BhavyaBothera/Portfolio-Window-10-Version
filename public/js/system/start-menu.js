import { playSound } from '../core/audio.js';
import { openWindow } from '../core/window-manager.js';

export function initStartMenu() {
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    if (!startBtn || !startMenu) return;

    // Set initial ARIA accessibility attributes
    startBtn.setAttribute('aria-expanded', 'false');
    startBtn.setAttribute('aria-controls', 'start-menu');
    startBtn.setAttribute('aria-haspopup', 'true');
    startMenu.setAttribute('role', 'menu');
    startMenu.setAttribute('aria-label', 'Start Menu');
    startMenu.setAttribute('aria-hidden', 'true');

    const getStartMenuItems = () => {
        return Array.from(startMenu.querySelectorAll('[data-window], button, input, [tabindex="0"]'));
    };

    getStartMenuItems().forEach(item => {
        if (!item.hasAttribute('role') && !item.matches('input')) {
            item.setAttribute('role', 'menuitem');
        }
        if (!item.hasAttribute('tabindex')) {
            item.setAttribute('tabindex', '0');
        }
    });

    const openStartMenu = () => {
        startMenu.classList.remove('hidden');
        startBtn.setAttribute('aria-expanded', 'true');
        startMenu.setAttribute('aria-hidden', 'false');
        playSound('click');

        // Focus first focusable start menu item
        const firstItem = startMenu.querySelector('[data-window], button, [tabindex="0"]');
        if (firstItem) {
            try { firstItem.focus(); } catch (e) {}
        }
    };

    const closeStartMenu = (restoreFocus = true) => {
        const wasOpen = !startMenu.classList.contains('hidden');
        startMenu.classList.add('hidden');
        startBtn.setAttribute('aria-expanded', 'false');
        startMenu.setAttribute('aria-hidden', 'true');

        if (wasOpen && restoreFocus) {
            try { startBtn.focus(); } catch (e) {}
        }
    };

    const toggleStartMenu = () => {
        if (startMenu.classList.contains('hidden')) {
            openStartMenu();
        } else {
            closeStartMenu(true);
        }
    };

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStartMenu();
    });

    document.addEventListener('click', (e) => {
        if (!startMenu.classList.contains('hidden')) {
            if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
                closeStartMenu(false);
            }
        }
    });

    // Start menu item click listeners
    getStartMenuItems().forEach(item => {
        item.addEventListener('click', () => {
            const winId = item.dataset.window;
            if (winId) {
                openWindow(winId);
                closeStartMenu(false);
            }
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
    });

    // Global & Keyboard Navigation inside Start Menu
    document.addEventListener('keydown', (e) => {
        if (startMenu.classList.contains('hidden')) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            closeStartMenu(true);
            return;
        }

        const items = getStartMenuItems();
        const currentIndex = items.indexOf(document.activeElement);

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
