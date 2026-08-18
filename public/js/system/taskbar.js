import { state } from '../core/state.js';
import { openWindow, minimizeWindow, closeWindow } from '../core/window-manager.js';
import { setText } from '../utils/dom.js';

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

export function updateTaskbarPills() {
    const taskbarAppsContainer = document.getElementById('taskbar-apps-container');
    if (!taskbarAppsContainer) return;
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
        tile.innerHTML = `<i class="${meta.icon}"></i>`;

        tile.addEventListener('click', () => {
            if (isActive) {
                minimizeWindow(winId);
            } else {
                openWindow(winId);
            }
            if (previewPopover) previewPopover.classList.add('hidden');
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

export function initTaskbar() {
    setInterval(updateClocks, 1000);
    updateClocks();
    updateTaskbarPills();
}
