import { state } from '../core/state.js';
import { openWindow, minimizeWindow, closeWindow } from '../core/window-manager.js';
import { setText } from '../utils/dom.js';
import { setItem } from '../core/storage.js';
import { playSound } from '../core/audio.js';

const windowMeta = {
    'this-pc': { icon: 'fa-solid fa-desktop text-blue', label: 'This PC' },
    'projects': { icon: 'fa-solid fa-folder-open text-gold', label: 'Projects' },
    'skills': { icon: 'fa-solid fa-sliders text-cyan', label: 'Skills' },
    'vscode': { icon: 'fa-solid fa-code text-cyan', label: 'VS Code' },
    'edge': { icon: 'fa-brands fa-edge text-blue', label: 'Edge' },
    'settings': { icon: 'fa-solid fa-gear text-cyan', label: 'Settings' },
    'notepad': { icon: 'fa-solid fa-file-lines text-yellow', label: 'Notepad' },
    'calculator': { icon: 'fa-solid fa-calculator text-blue', label: 'Calculator' },
    'paint': { icon: 'fa-solid fa-palette text-pink', label: 'Paint' },
    'experience': { icon: 'fa-solid fa-briefcase text-purple', label: 'Experience' },
    'contact': { icon: 'fa-solid fa-envelope text-blue', label: 'Contact' },
    'resume': { icon: 'fa-solid fa-file-pdf text-red', label: 'Resume' },
    'cmd': { icon: 'fa-solid fa-terminal text-green', label: 'CMD' },
    'minesweeper': { icon: 'fa-solid fa-bomb text-red', label: 'Minesweeper' },
    'recycle-bin': { icon: 'fa-solid fa-trash-can text-orange', label: 'Recycle Bin' },
    'cortana': { icon: 'fa-regular fa-circle text-cyan', label: 'Cortana' },
    'taskmgr': { icon: 'fa-solid fa-chart-line text-green', label: 'Task Manager' },
    'stickynotes': { icon: 'fa-solid fa-note-sticky text-yellow', label: 'Sticky Notes' },
    'mediaplayer': { icon: 'fa-solid fa-compact-disc text-purple', label: 'Groove Music' },
    'architecture': { icon: 'fa-solid fa-sitemap text-cyan', label: 'System Architecture' },
    'solitaire': { icon: 'fa-solid fa-heart text-red', label: 'Solitaire' }
};

export function updateClocks() {
    const now = new Date();
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeStr = now.toLocaleTimeString('en-US', timeOptions);
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const shortDateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const fullTimeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

    setText('lock-time', now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
    setText('lock-date', dateStr);
    setText('tray-time', timeStr);
    setText('tray-date', shortDateStr);
    setText('cal-time-display', fullTimeStr);
    setText('cal-date-display', now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
}

let previewTimeout = null;
let clockInterval = null;
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = new Date();
let calendarInitialized = false;

export function updateTaskbarPills() {
    const taskbarAppsContainer = document.getElementById('taskbar-apps-container');
    if (!taskbarAppsContainer) return;

    taskbarAppsContainer.setAttribute('role', 'toolbar');
    taskbarAppsContainer.setAttribute('aria-label', 'Active Applications');
    taskbarAppsContainer.innerHTML = '';

    const previewPopover = document.getElementById('taskbar-preview-popover');

    state.openWindows.forEach(winId => {
        const meta = windowMeta[winId] || { icon: 'fa-solid fa-window-maximize', label: winId };
        const winEl = document.getElementById(`win-${winId}`);
        const isMinimized = winEl?.classList.contains('minimized');
        const isActive = state.activeWindow === winId && !isMinimized;

        const tile = document.createElement('div');
        tile.className = `taskbar-app-tile${isActive ? ' active' : ''}${isMinimized ? ' minimized' : ''}`;
        tile.title = meta.label;
        tile.setAttribute('role', 'button');
        tile.setAttribute('tabindex', '0');
        tile.setAttribute('aria-selected', isActive ? 'true' : 'false');
        tile.setAttribute('aria-label', `${meta.label} Window (${isActive ? 'Active' : isMinimized ? 'Minimized' : 'Open'})`);
        tile.innerHTML = `<i class="${meta.icon}"></i>`;

        const onTileClick = () => {
            if (isActive) {
                minimizeWindow(winId);
            } else {
                openWindow(winId);
            }
            if (previewPopover) previewPopover.classList.add('hidden');
        };

        tile.addEventListener('click', onTileClick);
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTileClick();
            }
        });

        tile.addEventListener('mouseenter', () => {
            if (!previewPopover) return;
            clearTimeout(previewTimeout);
            const rect = tile.getBoundingClientRect();
            previewPopover.style.left = `${Math.max(10, rect.left - 80)}px`;

            const titleText = document.getElementById('tp-title-text');
            if (titleText) titleText.textContent = meta.label;

            const iconPreview = document.getElementById('tp-icon-preview');
            if (iconPreview) iconPreview.className = meta.icon;

            const cvs = document.getElementById('tp-canvas-preview');
            if (cvs && winEl) {
                const ctx = cvs.getContext('2d');
                ctx.fillStyle = '#1c1c20';
                ctx.fillRect(0, 0, cvs.width, cvs.height);
                ctx.fillStyle = '#2d2d32';
                ctx.fillRect(0, 0, cvs.width, 22);
                ctx.fillStyle = '#0078d7';
                ctx.fillRect(8, 6, 10, 10);
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px Segoe UI, sans-serif';
                ctx.fillText(meta.label.slice(0, 18), 24, 14);
            }

            const closeBtn = document.getElementById('tp-close-btn');
            if (closeBtn) {
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    closeWindow(winId);
                    previewPopover.classList.add('hidden');
                };
            }

            previewPopover.classList.remove('hidden');
        });

        tile.addEventListener('mouseleave', () => {
            previewTimeout = setTimeout(() => {
                if (previewPopover) previewPopover.classList.add('hidden');
            }, 300);
        });

        taskbarAppsContainer.appendChild(tile);
    });

    if (previewPopover) {
        previewPopover.onmouseenter = () => clearTimeout(previewTimeout);
        previewPopover.onmouseleave = () => {
            previewTimeout = setTimeout(() => previewPopover.classList.add('hidden'), 300);
        };
    }
}



function renderCalendarMonth() {
    const monthLabel = document.getElementById('cal-month-name');
    const daysGrid = document.getElementById('cal-days-grid');
    if (!monthLabel || !daysGrid) return;

    monthLabel.textContent = calendarMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
    daysGrid.replaceChildren();

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();
    const today = new Date();

    for (let index = 0; index < 42; index += 1) {
        const dayNumber = index - firstWeekday + 1;
        const date = new Date(year, month, dayNumber);
        const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
        const isToday = date.getFullYear() === today.getFullYear()
            && date.getMonth() === today.getMonth()
            && date.getDate() === today.getDate();
        const isSelected = date.getFullYear() === selectedCalendarDate.getFullYear()
            && date.getMonth() === selectedCalendarDate.getMonth()
            && date.getDate() === selectedCalendarDate.getDate();

        const dayButton = document.createElement('button');
        dayButton.type = 'button';
        dayButton.className = 'cal-day';
        dayButton.textContent = String(isCurrentMonth
            ? dayNumber
            : dayNumber < 1
                ? previousMonthDays + dayNumber
                : dayNumber - daysInMonth);
        dayButton.setAttribute('aria-label', date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }));
        dayButton.setAttribute('aria-pressed', String(isSelected));
        dayButton.classList.toggle('other-month', !isCurrentMonth);
        dayButton.classList.toggle('today', isToday);
        dayButton.classList.toggle('selected', isSelected);

        dayButton.addEventListener('click', () => {
            selectedCalendarDate = date;
            if (!isCurrentMonth) {
                calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            }
            renderCalendarMonth();
        });

        daysGrid.appendChild(dayButton);
    }

    calendarInitialized = true;
}

function initTrayControls() {
    const popoverIds = ['calendar-popover', 'volume-popover', 'wifi-popover', 'battery-popover', 'action-center'];
    const getPopover = id => document.getElementById(id);

    const closePopovers = () => {
        popoverIds.forEach(id => {
            const popover = getPopover(id);
            if (popover) popover.classList.add('hidden');
        });
        ['taskbar-clock', 'tray-volume', 'tray-wifi', 'tray-battery', 'tray-action-center'].forEach(id => {
            const trigger = document.getElementById(id);
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    };

    const togglePopover = (triggerId, popoverId) => {
        const trigger = document.getElementById(triggerId);
        const popover = getPopover(popoverId);
        if (!trigger || !popover) return;

        const shouldOpen = popover.classList.contains('hidden');
        closePopovers();
        if (shouldOpen) {
            popover.classList.remove('hidden');
            trigger.setAttribute('aria-expanded', 'true');
        }
    };

    const controls = [
        ['taskbar-clock', 'calendar-popover', 'Show calendar'],
        ['tray-volume', 'volume-popover', 'Volume control'],
        ['tray-wifi', 'wifi-popover', 'Wi-Fi networks'],
        ['tray-battery', 'battery-popover', 'Battery status'],
        ['tray-action-center', 'action-center', 'Notifications and quick settings']
    ];

    controls.forEach(([triggerId, popoverId, label]) => {
        const trigger = document.getElementById(triggerId);
        if (!trigger) return;

        trigger.setAttribute('role', 'button');
        trigger.setAttribute('tabindex', '0');
        trigger.setAttribute('aria-label', label);
        trigger.setAttribute('aria-controls', popoverId);
        trigger.setAttribute('aria-expanded', 'false');

        const activate = event => {
            if (event.type === 'keydown') {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
            }
            if (triggerId === 'taskbar-clock' && !calendarInitialized) renderCalendarMonth();
            togglePopover(triggerId, popoverId);
        };

        trigger.addEventListener('click', activate);
        trigger.addEventListener('keydown', activate);
    });

    document.getElementById('cal-prev-month')?.addEventListener('click', () => {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        renderCalendarMonth();
    });
    document.getElementById('cal-next-month')?.addEventListener('click', () => {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        renderCalendarMonth();
    });

    const volumeSlider = document.getElementById('tray-volume-slider');
    const volumePercent = document.getElementById('tray-volume-percent');
    const volumeIcons = [
        document.getElementById('volume-icon-tray'),
        document.getElementById('volume-icon-pop')
    ];
    const updateVolume = () => {
        if (!volumeSlider) return;
        const value = Number(volumeSlider.value);
        if (volumePercent) volumePercent.textContent = value + '%';
        const iconClass = value === 0
            ? 'fa-solid fa-volume-xmark'
            : value < 35
                ? 'fa-solid fa-volume-low'
                : 'fa-solid fa-volume-high';
        volumeIcons.forEach(icon => {
            if (icon) icon.className = iconClass;
        });
        const trigger = document.getElementById('tray-volume');
        if (trigger) trigger.setAttribute('aria-label', 'Volume ' + value + ' percent');
    };
    volumeSlider?.addEventListener('input', updateVolume);
    updateVolume();

    document.getElementById('tray-lang')?.setAttribute('role', 'img');
    document.getElementById('tray-lang')?.setAttribute('aria-label', 'Keyboard language: English (United States)');


    const quickActions = [
        document.getElementById('toggle-dark-mode'),
        document.getElementById('toggle-wallpaper'),
        document.getElementById('toggle-sound'),
        document.getElementById('toggle-night-light'),
        document.getElementById('toggle-fullscreen')
    ].filter(Boolean);

    const updateToggleTile = (tile, active) => {
        tile.classList.toggle('active', active);
        tile.setAttribute('aria-pressed', String(active));
    };

    const themeTile = document.getElementById('toggle-dark-mode');
    if (themeTile) {
        updateToggleTile(themeTile, !document.body.classList.contains('light-mode'));
    }

    const soundTile = document.getElementById('toggle-sound');
    if (soundTile) {
        updateToggleTile(soundTile, state.soundEnabled);
        const label = soundTile.querySelector('span');
        if (label) label.textContent = state.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
        const icon = soundTile.querySelector('i');
        if (icon) icon.className = state.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    }

    const nightLightTile = document.getElementById('toggle-night-light');
    if (nightLightTile) updateToggleTile(nightLightTile, document.body.classList.contains('night-light-active'));

    const fullscreenTile = document.getElementById('toggle-fullscreen');
    if (fullscreenTile) updateToggleTile(fullscreenTile, Boolean(document.fullscreenElement));

    const actions = new Map([
        ['toggle-dark-mode', tile => {
            const lightMode = !document.body.classList.contains('light-mode');
            document.body.classList.toggle('light-mode', lightMode);
            setItem('win10-theme', lightMode ? 'light' : 'dark');
            updateToggleTile(tile, !lightMode);
        }],
        ['toggle-wallpaper', () => {
            if (!state.wallpapers.length) return;
            state.currentWallpaperIdx = (state.currentWallpaperIdx + 1) % state.wallpapers.length;
            const wallpaper = state.wallpapers[state.currentWallpaperIdx];
            const desktop = document.getElementById('desktop-wallpaper');
            if (desktop && wallpaper) {
                desktop.style.backgroundImage = 'url("' + wallpaper.replace(/"/g, '%22') + '")';
                setItem('win10-wallpaper', wallpaper);
            }
            document.querySelectorAll('.wallpaper-option-card').forEach(card => {
                card.classList.toggle('active', card.dataset.wallpaper === wallpaper);
            });
        }],
        ['toggle-sound', tile => {
            state.soundEnabled = !state.soundEnabled;
            setItem('win10-sound', state.soundEnabled ? '1' : '0');
            updateToggleTile(tile, state.soundEnabled);
            const label = tile.querySelector('span');
            if (label) label.textContent = state.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
            const icon = tile.querySelector('i');
            if (icon) icon.className = state.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        }],
        ['toggle-night-light', tile => {
            const enabled = !document.body.classList.contains('night-light-active');
            document.body.classList.toggle('night-light-active', enabled);
            setItem('win10-night-light', enabled ? '1' : '0');
            updateToggleTile(tile, enabled);
        }],
        ['toggle-fullscreen', async tile => {
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                } else {
                    await document.documentElement.requestFullscreen();
                }
                updateToggleTile(tile, Boolean(document.fullscreenElement));
            } catch {
                /* Fullscreen may be unavailable in embedded or restricted contexts. */
            }
        }]
    ]);

    const toggleActionIds = new Set([
        'toggle-dark-mode',
        'toggle-sound',
        'toggle-night-light',
        'toggle-fullscreen'
    ]);

    quickActions.forEach(tile => {
        tile.setAttribute('role', 'button');
        tile.setAttribute('tabindex', '0');
        if (toggleActionIds.has(tile.id)) {
            if (!tile.hasAttribute('aria-pressed')) {
                tile.setAttribute('aria-pressed', String(tile.classList.contains('active')));
            }
        } else {
            tile.removeAttribute('aria-pressed');
        }
        const activate = event => {
            if (event.type === 'keydown') {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
            }
            const action = actions.get(tile.id);
            if (!action) return;
            playSound('click');
            void action(tile);
        };
        tile.addEventListener('click', activate);
        tile.addEventListener('keydown', activate);
    });

    document.getElementById('clear-notifications')?.addEventListener('click', () => {
        document.querySelector('#action-center .notifications-list')?.replaceChildren();
        state.notifCount = 0;
        document.getElementById('notif-badge')?.classList.add('hidden');
        document.getElementById('notif-badge')?.replaceChildren(document.createTextNode('0'));
    });

    document.querySelectorAll('#wifi-popover .wifi-item').forEach(item => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-pressed', String(item.classList.contains('active')));
        const activate = event => {
            if (event.type === 'keydown') {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
            }
            document.querySelectorAll('#wifi-popover .wifi-item').forEach(network => {
                const selected = network === item;
                network.classList.toggle('active', selected);
                network.setAttribute('aria-pressed', String(selected));
                const status = network.querySelector('.wifi-status');
                if (status) status.textContent = selected ? 'Selected network · secured' : 'Secured';
            });
            playSound('click');
        };
        item.addEventListener('click', activate);
        item.addEventListener('keydown', activate);
    });

    const peekDesktop = document.getElementById('peek-desktop');
    if (peekDesktop) {
        peekDesktop.setAttribute('role', 'button');
        peekDesktop.setAttribute('tabindex', '0');
        peekDesktop.setAttribute('aria-label', 'Show desktop');
        let desktopShown = false;
        const toggleDesktop = () => {
            desktopShown = !desktopShown;
            if (desktopShown) {
                [...state.openWindows].forEach(id => minimizeWindow(id));
                peekDesktop.setAttribute('aria-label', 'Restore windows');
            } else {
                [...state.openWindows].forEach(id => openWindow(id));
                peekDesktop.setAttribute('aria-label', 'Show desktop');
            }
        };
        peekDesktop.addEventListener('click', toggleDesktop);
        peekDesktop.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleDesktop();
            }
        });
    }

    document.addEventListener('click', event => {
        if (!event.target.closest('.system-tray') && !event.target.closest('.tray-popover') && !event.target.closest('#action-center')) {
            closePopovers();
        }
    });
}

export function initTaskbar() {
    if (!clockInterval) {
        clockInterval = setInterval(updateClocks, 1000);
        clockInterval.unref?.();
    }
    updateClocks();
    initTrayControls();
    updateTaskbarPills();
}
