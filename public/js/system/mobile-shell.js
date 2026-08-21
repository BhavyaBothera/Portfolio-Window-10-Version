import { state } from '../core/state.js';
import { openWindow, closeWindow } from '../core/window-manager.js';
import { playSound } from '../core/audio.js';
import { createElement } from '../utils/dom.js';

const APPS_LIST = [
    { id: 'this-pc', name: 'This PC', icon: 'fa-solid fa-desktop', color: 'tile-blue' },
    { id: 'projects', name: 'Projects Explorer', icon: 'fa-solid fa-code', color: 'tile-purple' },
    { id: 'skills', name: 'Skills & Stack', icon: 'fa-solid fa-layer-group', color: 'tile-cyan' },
    { id: 'experience', name: 'Experience Timeline', icon: 'fa-solid fa-briefcase', color: 'tile-green' },
    { id: 'architecture', name: 'System Architecture', icon: 'fa-solid fa-sitemap', color: 'tile-blue' },
    { id: 'cortana', name: 'Cortana AI', icon: 'fa-regular fa-circle', color: 'tile-dark' },
    { id: 'vscode', name: 'VS Code Viewer', icon: 'fa-solid fa-file-code', color: 'tile-blue' },
    { id: 'paint', name: 'MS Paint', icon: 'fa-solid fa-palette', color: 'tile-orange' },
    { id: 'calculator', name: 'Calculator', icon: 'fa-solid fa-calculator', color: 'tile-dark' },
    { id: 'minesweeper', name: 'Minesweeper', icon: 'fa-solid fa-land-mine-on', color: 'tile-green' },
    { id: 'solitaire', name: 'Solitaire', icon: 'fa-solid fa-spade', color: 'tile-purple' },
    { id: 'stickynotes', name: 'Sticky Notes', icon: 'fa-solid fa-note-sticky', color: 'tile-yellow' },
    { id: 'notepad', name: 'Notepad', icon: 'fa-solid fa-file-lines', color: 'tile-cyan' },
    { id: 'contact', name: 'Windows Mail', icon: 'fa-solid fa-envelope', color: 'tile-blue' },
    { id: 'settings', name: 'Settings', icon: 'fa-solid fa-gear', color: 'tile-dark' },
    { id: 'edge', name: 'Microsoft Edge', icon: 'fa-brands fa-edge', color: 'tile-blue' },
    { id: 'cmd', name: 'Command Prompt', icon: 'fa-solid fa-terminal', color: 'tile-dark' },
    { id: 'mediaplayer', name: 'Groove Music', icon: 'fa-solid fa-compact-disc', color: 'tile-orange' },
    { id: 'taskmgr', name: 'Task Manager', icon: 'fa-solid fa-chart-line', color: 'tile-dark' }
];

export function isMobileViewport() {
    return window.innerWidth <= 768;
}

export function initMobileShell() {
    const launcher = document.getElementById('mobile-app-launcher');
    const switcher = document.getElementById('mobile-task-switcher');
    const backBtn = document.getElementById('mobile-back-btn');
    const homeBtn = document.getElementById('mobile-home-btn');
    const switcherBtn = document.getElementById('mobile-switcher-btn');
    const searchInput = document.getElementById('mobile-launcher-search-input');
    const gridContainer = document.getElementById('mobile-launcher-grid');
    const closeAllBtn = document.getElementById('mobile-switcher-close-all');

    if (!launcher || !switcher || !backBtn || !homeBtn || !switcherBtn) return;

    // 1. Render Mobile Launcher App Grid
    renderLauncherTiles(APPS_LIST);

    // Search filter listener
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = APPS_LIST.filter(app => app.name.toLowerCase().includes(query) || app.id.toLowerCase().includes(query));
        renderLauncherTiles(filtered);
    });

    function renderLauncherTiles(apps) {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';

        apps.forEach(app => {
            const tile = createElement('div', { className: `mobile-tile ${app.color}`, dataset: { window: app.id } }, [
                createElement('i', { className: app.icon }),
                createElement('span', { className: 'mobile-tile-label', textContent: app.name })
            ]);

            tile.addEventListener('click', () => {
                hideMobileOverlays();
                openWindow(app.id);
                playSound('click');
            });

            gridContainer.appendChild(tile);
        });
    }

    // 2. Bottom Nav Bar Actions
    backBtn.addEventListener('click', () => {
        playSound('click');
        if (!launcher.classList.contains('hidden') || !switcher.classList.contains('hidden')) {
            hideMobileOverlays();
            return;
        }

        if (state.activeWindow) {
            closeWindow(state.activeWindow);
        } else {
            showLauncher();
        }
    });

    homeBtn.addEventListener('click', () => {
        playSound('click');
        if (!launcher.classList.contains('hidden')) {
            hideMobileOverlays();
        } else {
            showLauncher();
        }
    });

    switcherBtn.addEventListener('click', () => {
        playSound('click');
        if (!switcher.classList.contains('hidden')) {
            hideMobileOverlays();
        } else {
            showSwitcher();
        }
    });

    closeAllBtn?.addEventListener('click', () => {
        playSound('click');
        const openIds = [...state.openWindows];
        openIds.forEach(id => closeWindow(id));
        renderTaskSwitcherCards();
    });

    function showLauncher() {
        switcher.classList.add('hidden');
        launcher.classList.remove('hidden');
        if (searchInput) searchInput.value = '';
        renderLauncherTiles(APPS_LIST);
    }

    function showSwitcher() {
        launcher.classList.add('hidden');
        renderTaskSwitcherCards();
        switcher.classList.remove('hidden');
    }

    function hideMobileOverlays() {
        launcher.classList.add('hidden');
        switcher.classList.add('hidden');
    }

    // 3. Render Task Switcher Cards
    function renderTaskSwitcherCards() {
        const cardsContainer = document.getElementById('mobile-switcher-cards-container');
        if (!cardsContainer) return;
        cardsContainer.innerHTML = '';

        if (state.openWindows.length === 0) {
            cardsContainer.appendChild(createElement('div', {
                className: 'mobile-switcher-empty',
                textContent: 'No open applications.'
            }));
            return;
        }

        state.openWindows.forEach(winId => {
            const appMeta = APPS_LIST.find(a => a.id === winId) || { name: winId, icon: 'fa-solid fa-window-maximize' };
            const isActive = state.activeWindow === winId;

            const card = createElement('div', { className: `mobile-switcher-card ${isActive ? 'active' : ''}` }, [
                createElement('div', { className: 'mobile-switcher-card-header' }, [
                    createElement('span', {}, [
                        createElement('i', { className: appMeta.icon }),
                        createElement('span', { textContent: ` ${appMeta.name}` })
                    ]),
                    createElement('button', { className: 'mobile-switcher-card-close', title: 'Close' }, [
                        createElement('i', { className: 'fa-solid fa-xmark' })
                    ])
                ]),
                createElement('div', { className: 'mobile-switcher-card-body', textContent: `Tap to switch to ${appMeta.name}` })
            ]);

            // Tap card body to activate window
            card.querySelector('.mobile-switcher-card-body').addEventListener('click', () => {
                hideMobileOverlays();
                openWindow(winId);
                playSound('click');
            });

            // Tap close button to close app
            card.querySelector('.mobile-switcher-card-close').addEventListener('click', (e) => {
                e.stopPropagation();
                closeWindow(winId);
                playSound('close');
                renderTaskSwitcherCards();
            });

            cardsContainer.appendChild(card);
        });
    }

    // Export helpers on window for global access
    window.hideMobileOverlays = hideMobileOverlays;
}
