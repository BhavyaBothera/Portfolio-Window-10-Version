// ==========================================================================
// WINDOWS 10 PORTFOLIO OS — COMPLETE JAVASCRIPT ENGINE
// Author: Bhavy | Full Rebuild (Clean Modular Architecture)
// ==========================================================================

(() => {
    'use strict';

    // ==========================================================================
    // 1. STATE MANAGEMENT
    // ==========================================================================
    const state = {
        openWindows: [],
        activeWindow: null,
        zIndexCounter: 10,
        soundEnabled: localStorage.getItem('win10-sound') !== '0',
        accentColor: '#0078d7',
        currentWallpaperIdx: 0,
        wallpapers: [
            'assets/wallpaper.png',
            'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80'
        ],
        notifCount: 0,
        tmProcesses: [],
        tmCpuData: new Array(40).fill(5),
        tmRamData: new Array(40).fill(26),
        tmIntervalId: null,
    };

    // Load persisted theme
    if (localStorage.getItem('win10-theme') === 'light') {
        document.body.classList.add('light-mode');
    }

    let calendarDisplayDate = new Date();

    // ==========================================================================
    // 2. WEB AUDIO SYNTHESIZER ENGINE
    // ==========================================================================
    let audioCtx = null;

    const ensureAudioCtx = () => {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { /* Audio not available */ }
        }
        return audioCtx;
    };

    const playSound = (type) => {
        if (!state.soundEnabled) return;
        const ctx = ensureAudioCtx();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            gain.gain.setValueAtTime(0.12, now);

            switch (type) {
                case 'click':
                    osc.frequency.setValueAtTime(1200, now);
                    osc.type = 'sine';
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now); osc.stop(now + 0.08);
                    break;
                case 'open':
                    osc.frequency.setValueAtTime(500, now);
                    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
                    osc.type = 'triangle';
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now); osc.stop(now + 0.15);
                    break;
                case 'close':
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
                    osc.type = 'triangle';
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now); osc.stop(now + 0.15);
                    break;
                case 'minimize':
                    osc.frequency.setValueAtTime(700, now);
                    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                    osc.type = 'sine';
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                    osc.start(now); osc.stop(now + 0.12);
                    break;
                case 'error':
                    osc.frequency.setValueAtTime(250, now);
                    osc.type = 'square';
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.start(now); osc.stop(now + 0.3);
                    break;
                case 'notify':
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.setValueAtTime(1000, now + 0.08);
                    osc.type = 'sine';
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.start(now); osc.stop(now + 0.2);
                    break;
                case 'startup':
                    gain.gain.setValueAtTime(0.08, now);
                    osc.type = 'sine';
                    [523, 659, 784, 1047].forEach((freq, i) => {
                        osc.frequency.setValueAtTime(freq, now + i * 0.18);
                    });
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                    osc.start(now); osc.stop(now + 0.8);
                    break;
                default:
                    osc.frequency.setValueAtTime(600, now);
                    osc.type = 'sine';
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now); osc.stop(now + 0.08);
            }
        } catch (e) { /* Gracefully fail */ }
    };

    // ==========================================================================
    // 3. TOAST NOTIFICATION SYSTEM
    // ==========================================================================
    const toastContainer = document.getElementById('toast-container');

    const showToast = (title, body, icon = 'fa-solid fa-bell', source = 'System') => {
        if (!toastContainer) return;
        playSound('notify');

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-header"><i class="${icon}"></i> <span>${source}</span></div>
            <div class="toast-title">${title}</div>
            <div class="toast-body">${body}</div>
            <div class="toast-progress"><div class="toast-progress-bar"></div></div>
        `;

        toast.addEventListener('click', () => {
            toast.classList.add('toast-dismiss');
            setTimeout(() => toast.remove(), 350);
        });

        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-dismiss');
            setTimeout(() => toast.remove(), 350);
        }, 5000);

        // Update notification badge
        state.notifCount++;
        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.textContent = state.notifCount;
            badge.classList.remove('hidden');
        }
    };

    // ==========================================================================
    // 4. CLOCK SYSTEM (Lock screen + Taskbar + Calendar)
    // ==========================================================================
    const updateClocks = () => {
        const now = new Date();
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        const timeStr = now.toLocaleTimeString('en-US', timeOptions);
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const shortDateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const fullTimeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

        // Lock screen
        const lockTime = document.getElementById('lock-time');
        const lockDate = document.getElementById('lock-date');
        if (lockTime) lockTime.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
        if (lockDate) lockDate.textContent = dateStr;

        // Taskbar
        const trayTime = document.getElementById('tray-time');
        const trayDate = document.getElementById('tray-date');
        if (trayTime) trayTime.textContent = timeStr;
        if (trayDate) trayDate.textContent = shortDateStr;

        // Calendar popover
        const calTime = document.getElementById('cal-time-display');
        const calDate = document.getElementById('cal-date-display');
        if (calTime) calTime.textContent = fullTimeStr;
        if (calDate) calDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    setInterval(updateClocks, 1000);
    updateClocks();

    // ==========================================================================
    // 5. BOOT SCREEN & LOCK SCREEN
    // ==========================================================================
    const bootScreen = document.getElementById('boot-screen');
    const lockScreen = document.getElementById('lock-screen');

    const unlockOS = () => {
        if (lockScreen && !lockScreen.classList.contains('unlocked')) {
            lockScreen.classList.add('unlocked');
            playSound('startup');
            setTimeout(() => {
                showToast('Welcome Back, Bhavy!', 'Your Windows Portfolio OS is ready. Explore desktop icons, apps, and tools!', 'fa-solid fa-laptop-code', 'Windows OS');
            }, 800);
        }
    };

    // Boot sequence: boot screen → lock screen → desktop
    if (bootScreen) {
        setTimeout(() => {
            bootScreen.classList.add('fade-out');
            setTimeout(() => {
                bootScreen.remove();
                // After boot screen fades, lock screen is visible. Show sign-in mode.
                if (lockScreen) lockScreen.classList.add('sign-in-mode');
            }, 800);
        }, 2800);
    }

    // Lock screen click or keypress to unlock
    document.getElementById('unlock-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        unlockOS();
    });

    lockScreen?.addEventListener('click', () => unlockOS());
    document.addEventListener('keydown', (e) => {
        if (lockScreen && !lockScreen.classList.contains('unlocked')) {
            unlockOS();
        }
    });

    // ==========================================================================
    // 6. WINDOW MANAGER
    // ==========================================================================
    // Make openWindow globally accessible (used in inline handlers)
    window.openWindow = openWindow;

    function openWindow(windowId) {
        const winEl = document.getElementById(`win-${windowId}`);
        if (!winEl) return;

        if (winEl.classList.contains('hidden')) {
            winEl.classList.remove('hidden');
            winEl.classList.remove('minimized');
            state.zIndexCounter++;
            winEl.style.zIndex = state.zIndexCounter;
            playSound('open');

            if (!state.openWindows.includes(windowId)) {
                state.openWindows.push(windowId);
            }

            // Init special apps
            if (windowId === 'paint') initPaintCanvas();
            if (windowId === 'minesweeper') initMinesweeper();
            if (windowId === 'vscode') loadVsCodeContent('index.html');
            if (windowId === 'taskmgr') startTaskManagerUpdates();
        } else if (winEl.classList.contains('minimized')) {
            winEl.classList.remove('minimized');
            state.zIndexCounter++;
            winEl.style.zIndex = state.zIndexCounter;
            playSound('open');
        } else {
            // Already open, just focus
            state.zIndexCounter++;
            winEl.style.zIndex = state.zIndexCounter;
        }

        focusWindow(windowId);
        updateTaskbarPills();
    }

    function focusWindow(windowId) {
        document.querySelectorAll('.win-window').forEach(w => w.classList.remove('active'));
        const winEl = document.getElementById(`win-${windowId}`);
        if (winEl) {
            winEl.classList.add('active');
            state.activeWindow = windowId;
            state.zIndexCounter++;
            winEl.style.zIndex = state.zIndexCounter;
        }
        updateTaskbarPills();
    }

    function closeWindow(windowId) {
        const winEl = document.getElementById(`win-${windowId}`);
        if (!winEl) return;

        winEl.classList.add('hidden');
        winEl.classList.remove('active', 'maximized', 'minimized');
        state.openWindows = state.openWindows.filter(id => id !== windowId);

        if (state.activeWindow === windowId) state.activeWindow = null;
        playSound('close');

        if (windowId === 'taskmgr') stopTaskManagerUpdates();

        updateTaskbarPills();
    }

    function minimizeWindow(windowId) {
        const winEl = document.getElementById(`win-${windowId}`);
        if (!winEl) return;
        winEl.classList.add('minimized');
        winEl.classList.remove('active');
        if (state.activeWindow === windowId) state.activeWindow = null;
        playSound('minimize');
        updateTaskbarPills();
    }

    function maximizeWindow(windowId) {
        const winEl = document.getElementById(`win-${windowId}`);
        if (!winEl) return;
        winEl.classList.toggle('maximized');
        playSound('click');
    }

    // --- Attach controls to ALL windows ---
    document.querySelectorAll('.win-window').forEach(winEl => {
        const windowId = winEl.dataset.id;
        if (!windowId) return;

        // Title bar buttons
        winEl.querySelector('.min-btn')?.addEventListener('click', (e) => { e.stopPropagation(); minimizeWindow(windowId); });
        winEl.querySelector('.max-btn')?.addEventListener('click', (e) => { e.stopPropagation(); maximizeWindow(windowId); });
        winEl.querySelector('.close-btn')?.addEventListener('click', (e) => { e.stopPropagation(); closeWindow(windowId); });

        // Double-click titlebar to maximize
        const titlebar = winEl.querySelector('.win-titlebar');
        titlebar?.addEventListener('dblclick', () => maximizeWindow(windowId));

        // Click anywhere on window to focus
        winEl.addEventListener('mousedown', () => focusWindow(windowId));

        // --- 8-AXIS RESIZE HANDLES INJECTION ---
        const handleTypes = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
        handleTypes.forEach(type => {
            const h = document.createElement('div');
            h.className = `win-resize-handle win-resize-${type}`;
            h.dataset.type = type;
            winEl.appendChild(h);

            h.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (winEl.classList.contains('maximized')) return;

                let startX = e.clientX, startY = e.clientY;
                let startW = winEl.offsetWidth, startH = winEl.offsetHeight;
                let startL = winEl.offsetLeft, startT = winEl.offsetTop;
                focusWindow(windowId);

                const onMouseMove = (me) => {
                    const dx = me.clientX - startX;
                    const dy = me.clientY - startY;

                    if (type.includes('e')) winEl.style.width = `${Math.max(320, startW + dx)}px`;
                    if (type.includes('s')) winEl.style.height = `${Math.max(200, startH + dy)}px`;

                    if (type.includes('w')) {
                        const newW = Math.max(320, startW - dx);
                        if (newW > 320) {
                            winEl.style.width = `${newW}px`;
                            winEl.style.left = `${startL + dx}px`;
                        }
                    }

                    if (type.includes('n')) {
                        const newH = Math.max(200, startH - dy);
                        if (newH > 200) {
                            winEl.style.height = `${newH}px`;
                            winEl.style.top = `${Math.max(0, startT + dy)}px`;
                        }
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });

        // --- WINDOW DRAGGING & QUADRANT AERO SNAP ---
        let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;

        titlebar?.addEventListener('mousedown', (e) => {
            if (e.target.closest('.win-controls')) return;
            if (winEl.classList.contains('maximized')) return;
            isDragging = true;
            dragOffsetX = e.clientX - winEl.offsetLeft;
            dragOffsetY = e.clientY - winEl.offsetTop;
            winEl.style.transition = 'none';
            focusWindow(windowId);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const newX = e.clientX - dragOffsetX;
            const newY = e.clientY - dragOffsetY;
            winEl.style.left = `${newX}px`;
            winEl.style.top = `${Math.max(0, newY)}px`;

            // Show Aero Snap preview (Side, Maximize, and 4 Quadrants)
            const snapPreview = document.getElementById('snap-preview-box');
            if (snapPreview) {
                const taskbarH = 40;
                const winW = window.innerWidth;
                const winH = window.innerHeight;

                if (e.clientX <= 15 && e.clientY <= 15) {
                    // Top-Left Quadrant
                    snapPreview.classList.remove('hidden');
                    Object.assign(snapPreview.style, { left: '0', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
                } else if (e.clientX >= winW - 15 && e.clientY <= 15) {
                    // Top-Right Quadrant
                    snapPreview.classList.remove('hidden');
                    Object.assign(snapPreview.style, { left: '50vw', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
                } else if (e.clientX <= 15 && e.clientY >= winH - 60) {
                    // Bottom-Left Quadrant
                    snapPreview.classList.remove('hidden');
                    Object.assign(snapPreview.style, { left: '0', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
                } else if (e.clientX >= winW - 15 && e.clientY >= winH - 60) {
                    // Bottom-Right Quadrant
                    snapPreview.classList.remove('hidden');
                    Object.assign(snapPreview.style, { left: '50vw', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
                } else if (e.clientX <= 5) {
                    // Left 50%
                    snapPreview.classList.remove('hidden');
                    Object.assign(snapPreview.style, { left: '0', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
                } else if (e.clientX >= winW - 5) {
                    // Right 50%
                    snapPreview.classList.remove('hidden');
                    Object.assign(snapPreview.style, { left: '50vw', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
                } else if (e.clientY <= 3) {
                    // Top Maximize
                    snapPreview.classList.remove('hidden');
                    Object.assign(snapPreview.style, { left: '0', top: '0', width: '100vw', height: `calc(100vh - ${taskbarH}px)` });
                } else {
                    snapPreview.classList.add('hidden');
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            winEl.style.transition = '';

            const taskbarH = 40;
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            if (e.clientX <= 15 && e.clientY <= 15) {
                // Top-Left Quadrant Snap
                Object.assign(winEl.style, { left: '0', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
            } else if (e.clientX >= winW - 15 && e.clientY <= 15) {
                // Top-Right Quadrant Snap
                Object.assign(winEl.style, { left: '50vw', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
            } else if (e.clientX <= 15 && e.clientY >= winH - 60) {
                // Bottom-Left Quadrant Snap
                Object.assign(winEl.style, { left: '0', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
            } else if (e.clientX >= winW - 15 && e.clientY >= winH - 60) {
                // Bottom-Right Quadrant Snap
                Object.assign(winEl.style, { left: '50vw', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
            } else if (e.clientX <= 5) {
                // Snap left 50%
                Object.assign(winEl.style, { left: '0', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
            } else if (e.clientX >= winW - 5) {
                // Snap right 50%
                Object.assign(winEl.style, { left: '50vw', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
            } else if (e.clientY <= 3) {
                // Snap maximize
                maximizeWindow(windowId);
            }

            const snapPreview = document.getElementById('snap-preview-box');
            if (snapPreview) snapPreview.classList.add('hidden');
        });
    });

    // ==========================================================================
    // 7. TASKBAR APP PILLS
    // ==========================================================================
    const taskbarAppsContainer = document.getElementById('taskbar-apps-container');

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
        'mediaplayer': { icon: 'fa-solid fa-compact-disc text-purple', label: 'Groove Music' }
    };

    const previewPopover = document.getElementById('taskbar-preview-popover');
    let previewTimeout = null;

    function updateTaskbarPills() {
        if (!taskbarAppsContainer) return;
        taskbarAppsContainer.innerHTML = '';

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

            // Live Thumbnail Hover Preview
            tile.addEventListener('mouseenter', () => {
                if (!previewPopover) return;
                clearTimeout(previewTimeout);
                const rect = tile.getBoundingClientRect();
                previewPopover.style.left = `${Math.max(10, rect.left - 80)}px`;

                const titleText = document.getElementById('tp-title-text');
                if (titleText) titleText.innerHTML = `<i class="${meta.icon}"></i> ${meta.label}`;

                const iconPreview = document.getElementById('tp-icon-preview');
                if (iconPreview) iconPreview.className = meta.icon;

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

        // Keep preview visible when mouse is over the popover
        if (previewPopover) {
            previewPopover.onmouseenter = () => clearTimeout(previewTimeout);
            previewPopover.onmouseleave = () => {
                previewTimeout = setTimeout(() => previewPopover.classList.add('hidden'), 300);
            };
        }

        updateTaskManagerProcessList();
    }

    // ==========================================================================
    // 8. DESKTOP ICONS (click to select, dblclick to open)
    // ==========================================================================
    const desktopIcons = document.querySelectorAll('.desktop-icon');

    desktopIcons.forEach(icon => {
        // Single click to select
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            desktopIcons.forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
            playSound('click');
        });

        // Double click to open
        icon.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const winId = icon.dataset.window;
            if (winId) openWindow(winId);
        });
    });

    // Click on empty desktop to deselect icons
    const wallpaperEl = document.getElementById('desktop-wallpaper');
    const selectionBox = document.getElementById('desktop-selection-box');
    let isSelecting = false, selectStartX = 0, selectStartY = 0;

    wallpaperEl?.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || e.target !== wallpaperEl) return;
        isSelecting = true;
        selectStartX = e.clientX;
        selectStartY = e.clientY;
        if (selectionBox) {
            selectionBox.style.left = `${selectStartX}px`;
            selectionBox.style.top = `${selectStartY}px`;
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.classList.remove('hidden');
        }
        desktopIcons.forEach(i => i.classList.remove('selected'));
        closeAllPopovers();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isSelecting || !selectionBox) return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        const left = Math.min(selectStartX, currentX);
        const top = Math.min(selectStartY, currentY);
        const width = Math.abs(currentX - selectStartX);
        const height = Math.abs(currentY - selectStartY);

        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;

        const boxRect = { left, top, right: left + width, bottom: top + height };
        desktopIcons.forEach(icon => {
            const iconRect = icon.getBoundingClientRect();
            const isIntersecting = !(iconRect.right < boxRect.left || iconRect.left > boxRect.right || iconRect.bottom < boxRect.top || iconRect.top > boxRect.bottom);
            icon.classList.toggle('selected', isIntersecting);
        });
    });

    document.addEventListener('mouseup', () => {
        if (isSelecting) {
            isSelecting = false;
            if (selectionBox) selectionBox.classList.add('hidden');
        }
    });

    // ==========================================================================
    // 9. TASK VIEW OVERLAY
    // ==========================================================================
    const taskViewOverlay = document.getElementById('task-view-overlay');
    const taskViewGrid = document.getElementById('task-view-grid');

    const toggleTaskView = () => {
        if (!taskViewOverlay) return;
        const isHidden = taskViewOverlay.classList.contains('hidden');
        if (isHidden) {
            renderTaskViewGrid();
            taskViewOverlay.classList.remove('hidden');
            playSound('click');
        } else {
            taskViewOverlay.classList.add('hidden');
        }
    };

    const renderTaskViewGrid = () => {
        if (!taskViewGrid) return;
        taskViewGrid.innerHTML = '';

        state.openWindows.forEach(winId => {
            const meta = windowMeta[winId] || { icon: 'fa-solid fa-window-maximize', label: winId };
            const card = document.createElement('div');
            card.className = 'tv-card';
            card.innerHTML = `
                <div class="tv-card-header">
                    <span><i class="${meta.icon}"></i> ${meta.label}</span>
                    <button class="tv-card-close" data-win="${winId}"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="tv-card-preview"><i class="${meta.icon}"></i></div>
            `;
            card.addEventListener('click', (e) => {
                if (e.target.closest('.tv-card-close')) return;
                openWindow(winId);
                taskViewOverlay.classList.add('hidden');
            });
            card.querySelector('.tv-card-close')?.addEventListener('click', (e) => {
                e.stopPropagation();
                closeWindow(winId);
                renderTaskViewGrid();
            });
            taskViewGrid.appendChild(card);
        });
    };

    document.getElementById('task-view-btn')?.addEventListener('click', toggleTaskView);
    document.getElementById('close-task-view-btn')?.addEventListener('click', () => taskViewOverlay?.classList.add('hidden'));

    // ==========================================================================
    // 10. START MENU & POWER OPTIONS
    // ==========================================================================
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');

    const toggleStartMenu = () => {
        const isHidden = startMenu?.classList.contains('hidden');
        closeAllPopovers();
        if (isHidden) {
            startMenu.classList.remove('hidden');
            startBtn?.classList.add('active');
            playSound('click');
        }
    };

    const closeStartMenu = () => {
        startMenu?.classList.add('hidden');
        startBtn?.classList.remove('active');
    };

    startBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleStartMenu(); });

    // Start rail hamburger toggle
    document.getElementById('start-btn-hamburger')?.addEventListener('click', () => {
        document.querySelector('.start-sidebar')?.classList.toggle('expanded');
        playSound('click');
    });

    // Start menu app items
    document.querySelectorAll('.start-app-item, .start-tile').forEach(item => {
        item.addEventListener('click', () => {
            const winId = item.dataset.window;
            if (winId) { openWindow(winId); closeStartMenu(); }
        });
    });

    // Start sidebar buttons
    document.getElementById('start-btn-settings')?.addEventListener('click', () => { openWindow('settings'); closeStartMenu(); });
    document.getElementById('start-btn-docs')?.addEventListener('click', () => { openWindow('projects'); closeStartMenu(); });
    document.getElementById('start-btn-user')?.addEventListener('click', () => { openWindow('this-pc'); closeStartMenu(); });

    // --- Power Modal ---
    const powerModal = document.getElementById('power-modal');
    document.getElementById('start-btn-power')?.addEventListener('click', () => { powerModal?.classList.remove('hidden'); closeStartMenu(); });
    document.getElementById('close-power-modal')?.addEventListener('click', () => powerModal?.classList.add('hidden'));

    document.getElementById('power-lock-btn')?.addEventListener('click', () => {
        powerModal?.classList.add('hidden');
        lockScreen?.classList.remove('unlocked', 'sign-in-mode');
    });

    document.getElementById('power-restart-btn')?.addEventListener('click', () => {
        powerModal?.classList.add('hidden');
        const overlay = document.createElement('div');
        overlay.className = 'shutdown-overlay';
        overlay.innerHTML = `<h2>Restarting...</h2><p>Please wait while Windows Portfolio OS restarts.</p><div class="boot-spinner"><div class="spinner-dot"></div><div class="spinner-dot"></div><div class="spinner-dot"></div><div class="spinner-dot"></div><div class="spinner-dot"></div></div>`;
        document.body.appendChild(overlay);
        setTimeout(() => location.reload(), 2500);
    });

    document.getElementById('power-shutdown-btn')?.addEventListener('click', () => {
        powerModal?.classList.add('hidden');
        const overlay = document.createElement('div');
        overlay.className = 'shutdown-overlay';
        overlay.innerHTML = `<h2>Shutting down...</h2><p>Windows Portfolio OS is shutting down safely.</p><div class="boot-spinner"><div class="spinner-dot"></div><div class="spinner-dot"></div><div class="spinner-dot"></div><div class="spinner-dot"></div><div class="spinner-dot"></div></div>`;
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.innerHTML = `<div style="text-align:center;"><i class="fa-solid fa-power-off" style="font-size:3.5rem;color:var(--win-accent);margin-bottom:20px;"></i><h2 style="font-weight:300;font-size:2rem;">System Powered Off</h2><p style="color:#888;margin-bottom:25px;">Windows Portfolio OS has been shut down safely.</p><button onclick="location.reload()" style="background:var(--win-accent);color:#fff;border:none;padding:12px 30px;border-radius:4px;font-size:1rem;cursor:pointer;font-family:var(--win-font);">⏻ Turn On PC</button></div>`;
        }, 3000);
    });

    // ==========================================================================
    // 11. CLOSE ALL POPOVERS UTILITY
    // ==========================================================================
    function closeAllPopovers() {
        closeStartMenu();
        document.getElementById('calendar-popover')?.classList.add('hidden');
        document.getElementById('volume-popover')?.classList.add('hidden');
        document.getElementById('wifi-popover')?.classList.add('hidden');
        document.getElementById('battery-popover')?.classList.add('hidden');
        document.getElementById('action-center')?.classList.add('hidden');
        document.getElementById('search-popover')?.classList.add('hidden');
        document.getElementById('context-menu')?.classList.add('hidden');
    }

    // Click on desktop dismisses everything
    document.addEventListener('click', (e) => {
        // Don't close if clicking inside a popover or start menu
        if (e.target.closest('.start-menu, .tray-popover, .action-center, .search-popover, .context-menu, .taskbar-btn, .tray-icon, .tray-clock, .taskbar-search-container')) return;
        closeAllPopovers();
    });

    // ==========================================================================
    // 12. TASKBAR SEARCH
    // ==========================================================================
    const searchInput = document.getElementById('taskbar-search-input');
    const searchPopover = document.getElementById('search-popover');
    const searchResultsList = document.getElementById('search-results-list');

    const searchableItems = [
        { title: 'About Bhavy (This PC)', icon: 'fa-solid fa-desktop text-blue', winId: 'this-pc' },
        { title: 'Projects Explorer', icon: 'fa-solid fa-folder-open text-gold', winId: 'projects' },
        { title: 'Technical Skills (Control Panel)', icon: 'fa-solid fa-sliders text-cyan', winId: 'skills' },
        { title: 'VS Code Editor', icon: 'fa-solid fa-code text-cyan', winId: 'vscode' },
        { title: 'Microsoft Edge Browser', icon: 'fa-brands fa-edge text-blue', winId: 'edge' },
        { title: 'Windows Settings', icon: 'fa-solid fa-gear text-cyan', winId: 'settings' },
        { title: 'Notepad Text Editor', icon: 'fa-solid fa-file-lines text-yellow', winId: 'notepad' },
        { title: 'Calculator', icon: 'fa-solid fa-calculator text-blue', winId: 'calculator' },
        { title: 'Paint Sketch Pro', icon: 'fa-solid fa-palette text-pink', winId: 'paint' },
        { title: 'Experience & Timeline', icon: 'fa-solid fa-briefcase text-purple', winId: 'experience' },
        { title: 'Contact Me (Mail)', icon: 'fa-solid fa-envelope text-blue', winId: 'contact' },
        { title: 'Resume.pdf Reader', icon: 'fa-solid fa-file-pdf text-red', winId: 'resume' },
        { title: 'Command Prompt (cmd.exe)', icon: 'fa-solid fa-terminal text-green', winId: 'cmd' },
        { title: 'Minesweeper Game', icon: 'fa-solid fa-bomb text-red', winId: 'minesweeper' },
        { title: 'Recycle Bin', icon: 'fa-solid fa-trash-can text-orange', winId: 'recycle-bin' },
        { title: 'Cortana AI Assistant', icon: 'fa-regular fa-circle text-cyan', winId: 'cortana' },
        { title: 'Task Manager', icon: 'fa-solid fa-chart-line text-green', winId: 'taskmgr' },
    ];

    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) { searchPopover?.classList.add('hidden'); return; }

        const filtered = searchableItems.filter(item => item.title.toLowerCase().includes(query));
        if (searchResultsList) {
            searchResultsList.innerHTML = '';
            if (filtered.length === 0) {
                searchResultsList.innerHTML = `<div style="padding:15px;color:#888;text-align:center;">No results found</div>`;
            } else {
                filtered.forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'search-item';
                    el.innerHTML = `<i class="${item.icon}"></i> <span>${item.title}</span>`;
                    el.addEventListener('click', () => {
                        openWindow(item.winId);
                        searchPopover?.classList.add('hidden');
                        if (searchInput) searchInput.value = '';
                    });
                    searchResultsList.appendChild(el);
                });
            }
        }
        searchPopover?.classList.remove('hidden');
    });

    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) return;
            const filtered = searchableItems.filter(item => item.title.toLowerCase().includes(query));
            if (filtered.length > 0) {
                openWindow(filtered[0].winId);
                searchPopover?.classList.add('hidden');
                searchInput.value = '';
            }
        }
    });

    searchInput?.addEventListener('click', (e) => e.stopPropagation());

    // ==========================================================================
    // 13. SYSTEM TRAY POPOVERS
    // ==========================================================================
    const toggleTrayPopover = (popoverEl) => {
        if (!popoverEl) return;
        const isHidden = popoverEl.classList.contains('hidden');
        closeAllPopovers();
        if (isHidden) popoverEl.classList.remove('hidden');
    };

    document.getElementById('taskbar-clock')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTrayPopover(document.getElementById('calendar-popover'));
        renderCalendarGrid();
    });
    document.getElementById('tray-volume')?.addEventListener('click', (e) => { e.stopPropagation(); toggleTrayPopover(document.getElementById('volume-popover')); });
    document.getElementById('tray-wifi')?.addEventListener('click', (e) => { e.stopPropagation(); toggleTrayPopover(document.getElementById('wifi-popover')); });
    document.getElementById('tray-battery')?.addEventListener('click', (e) => { e.stopPropagation(); toggleTrayPopover(document.getElementById('battery-popover')); });
    document.getElementById('tray-action-center')?.addEventListener('click', (e) => { e.stopPropagation(); toggleTrayPopover(document.getElementById('action-center')); });

    // Cortana button opens Cortana window
    document.getElementById('cortana-btn')?.addEventListener('click', () => openWindow('cortana'));

    // Volume slider
    const volumeSlider = document.getElementById('tray-volume-slider');
    const volumePercent = document.getElementById('tray-volume-percent');
    volumeSlider?.addEventListener('input', (e) => {
        if (volumePercent) volumePercent.textContent = `${e.target.value}%`;
    });

    // Volume mute toggle
    const volumeIconTray = document.getElementById('volume-icon-tray');
    volumeIconTray?.parentElement?.addEventListener('dblclick', () => {
        state.soundEnabled = !state.soundEnabled;
        if (volumeIconTray) volumeIconTray.className = state.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        showToast('Volume Toggle', `Sound effects are now ${state.soundEnabled ? 'ENABLED' : 'MUTED'}.`, 'fa-solid fa-volume-high', 'Volume');
    });

    // Calendar
    const renderCalendarGrid = () => {
        const calGrid = document.getElementById('cal-days-grid');
        const monthNameEl = document.getElementById('cal-month-name');
        if (!calGrid) return;
        calGrid.innerHTML = '';

        const year = calendarDisplayDate.getFullYear();
        const month = calendarDisplayDate.getMonth();
        if (monthNameEl) monthNameEl.textContent = calendarDisplayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        for (let x = 0; x < firstDayIndex; x++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day other-month';
            calGrid.appendChild(emptyCell);
        }
        for (let day = 1; day <= totalDays; day++) {
            const dayCell = document.createElement('div');
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            dayCell.className = `cal-day${isToday ? ' today' : ''}`;
            dayCell.textContent = day;
            calGrid.appendChild(dayCell);
        }
    };

    document.getElementById('cal-prev-month')?.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1); renderCalendarGrid(); });
    document.getElementById('cal-next-month')?.addEventListener('click', () => { calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1); renderCalendarGrid(); });

    // ==========================================================================
    // 14. ACTION CENTER QUICK ACTIONS
    // ==========================================================================
    document.getElementById('toggle-wallpaper')?.addEventListener('click', () => {
        state.currentWallpaperIdx = (state.currentWallpaperIdx + 1) % state.wallpapers.length;
        const newWp = state.wallpapers[state.currentWallpaperIdx];
        const wp = document.getElementById('desktop-wallpaper');
        if (wp) wp.style.backgroundImage = `url('${newWp}')`;
        localStorage.setItem('win10-wallpaper', newWp);
        playSound('click');
    });

    document.getElementById('toggle-sound')?.addEventListener('click', (e) => {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem('win10-sound', state.soundEnabled ? '1' : '0');
        e.currentTarget.classList.toggle('active', state.soundEnabled);
        const label = e.currentTarget.querySelector('span');
        if (label) label.textContent = `Sound: ${state.soundEnabled ? 'ON' : 'OFF'}`;
        if (volumeIconTray) volumeIconTray.className = state.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        playSound('click');
    });

    document.getElementById('toggle-dark-mode')?.addEventListener('click', (e) => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('win10-theme', isLight ? 'light' : 'dark');
        e.currentTarget.classList.toggle('active', !isLight);
        const label = e.currentTarget.querySelector('span');
        if (label) label.textContent = isLight ? 'Light Mode' : 'Dark Mode';
        playSound('click');
    });

    document.getElementById('toggle-fullscreen')?.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    });

    document.getElementById('peek-desktop')?.addEventListener('click', () => {
        document.querySelectorAll('.win-window').forEach(win => win.classList.add('minimized'));
        updateTaskbarPills();
    });

    document.getElementById('clear-notifications')?.addEventListener('click', () => {
        const list = document.querySelector('.notifications-list');
        if (list) list.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">No notifications</div>';
    });

    // ==========================================================================
    // 15. CONTEXT MENU (RIGHT CLICK)
    // ==========================================================================
    const contextMenu = document.getElementById('context-menu');

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        closeAllPopovers();
        if (contextMenu) {
            const x = Math.min(e.clientX, window.innerWidth - 230);
            const y = Math.min(e.clientY, window.innerHeight - 250);
            contextMenu.style.left = `${x}px`;
            contextMenu.style.top = `${y}px`;
            contextMenu.classList.remove('hidden');
        }
    });

    document.getElementById('ctx-refresh')?.addEventListener('click', () => {
        desktopIcons.forEach(icon => { icon.style.animation = 'none'; setTimeout(() => icon.style.animation = 'fadeInUp 0.3s ease', 10); });
        playSound('click');
    });
    document.getElementById('ctx-next-wallpaper')?.addEventListener('click', () => document.getElementById('toggle-wallpaper')?.click());
    document.getElementById('ctx-open-terminal')?.addEventListener('click', () => openWindow('cmd'));
    document.getElementById('ctx-open-vscode')?.addEventListener('click', () => openWindow('vscode'));
    document.getElementById('ctx-personalize')?.addEventListener('click', () => openWindow('settings'));
    document.getElementById('ctx-about-os')?.addEventListener('click', () => openWindow('this-pc'));

    // Settings 13-category grid card clicks
    document.querySelectorAll('.settings-category-card').forEach(card => {
        card.addEventListener('click', () => {
            const section = card.dataset.section;
            const title = card.querySelector('.settings-category-title')?.textContent || 'Settings';
            showToast(`Windows Settings — ${title}`, `Managing ${title.toLowerCase()} preferences and options.`, 'fa-solid fa-gear', 'Settings');
            playSound('click');
        });
    });
    // Load persisted accent color
    const savedAccent = localStorage.getItem('win10-accent');
    if (savedAccent) {
        state.accentColor = savedAccent;
        document.documentElement.style.setProperty('--win-accent', savedAccent);
        document.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.toggle('active', s.dataset.color === savedAccent);
        });
    }

    // Load persisted wallpaper
    const savedWallpaper = localStorage.getItem('win10-wallpaper');
    if (savedWallpaper) {
        const wp = document.getElementById('desktop-wallpaper');
        if (wp) wp.style.backgroundImage = `url('${savedWallpaper}')`;
    }

    // Accent color picker
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            const color = swatch.dataset.color;
            state.accentColor = color;
            document.documentElement.style.setProperty('--win-accent', color);
            localStorage.setItem('win10-accent', color);
            playSound('click');
        });
    });

    // Wallpaper thumbs
    document.querySelectorAll('.wallpaper-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            document.querySelectorAll('.wallpaper-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            const bg = thumb.dataset.bg;
            const wp = document.getElementById('desktop-wallpaper');
            if (wp) wp.style.backgroundImage = `url('${bg}')`;
            localStorage.setItem('win10-wallpaper', bg);
            playSound('click');
        });
    });

    // Settings sound toggle
    const soundToggle = document.getElementById('settings-sound-toggle');
    if (soundToggle) {
        soundToggle.checked = state.soundEnabled;
        soundToggle.addEventListener('change', () => {
            state.soundEnabled = soundToggle.checked;
            if (volumeIconTray) volumeIconTray.className = state.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            showToast('Audio Settings', `Sound effects are now ${state.soundEnabled ? 'ENABLED' : 'MUTED'}.`, 'fa-solid fa-volume-high', 'Settings');
        });
    }

    // ==========================================================================
    // 17. VS CODE FILE VIEWER
    // ==========================================================================
    function loadVsCodeContent(fileName) {
        const display = document.getElementById('vscode-code-display');
        if (!display) return;

        const files = {
            'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Bhavy | Windows 10 Portfolio OS</title>
</head>
<body>
    <div id="desktop-shell">
        <!-- Windows 10 Desktop OS Shell & 17 System Apps -->
        <!-- Boot Screen -> Lock Screen -> Desktop -->
        <!-- 15 Desktop Icons with drag support -->
        <!-- 17 App Windows with full management -->
    </div>
</body>
</html>`,
            'style.css': `:root {
    --win-accent: #0078d7;
    --win-window-bg: #1f1f23;
}
/* Fluent Design Glassmorphism & Translucent Layers */
/* Clean z-index hierarchy: desktop -> windows -> taskbar -> modals -> boot */
/* Acrylic material effects with backdrop-filter */`,
            'script.js': `// Windows 10 Portfolio OS Core Realism Engine
// Modules: State, Audio, Clock, Boot, WindowManager,
//   DesktopIcons, Taskbar, StartMenu, Settings,
//   Calculator, Paint, CMD, Minesweeper, Cortana,
//   TaskManager, Toast Notifications

const openWindow = (windowId) => { /* ... */ };
const focusWindow = (windowId) => { /* ... */ };
const showToast = (title, body) => { /* ... */ };`,
            'package.json': `{
  "name": "windows10-portfolio-os",
  "version": "3.0.0",
  "description": "Interactive Windows 10 Desktop Portfolio",
  "author": "Bhavy",
  "license": "MIT"
}`
        };

        display.textContent = files[fileName] || `// File: ${fileName}\n// Content not available`;
    }

    document.querySelectorAll('.vscode-file-tree li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.vscode-file-tree li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const fileName = item.dataset.file;
            const tabsEl = document.getElementById('vscode-tabs');
            if (tabsEl) tabsEl.innerHTML = `<div class="vscode-tab active">${item.innerHTML}</div>`;
            loadVsCodeContent(fileName);
            playSound('click');
        });
    });

    // ==========================================================================
    // 18. EDGE BROWSER SIMULATOR
    // ==========================================================================
    const edgeUrlInput = document.getElementById('edge-url-input');
    const edgeViewport = document.getElementById('edge-viewport-content');

    const navigateEdge = (url) => {
        if (!edgeViewport || !edgeUrlInput) return;
        edgeUrlInput.value = url;
        playSound('click');

        if (url.includes('github.com')) {
            edgeViewport.innerHTML = `<div style="padding:40px;text-align:center;color:#fff;"><i class="fa-brands fa-github" style="font-size:4rem;color:#0078d7;margin-bottom:15px;"></i><h2>Bhavy's GitHub Profile</h2><p style="color:#aaa;max-width:500px;margin:10px auto 20px;">Explore open-source repositories, system architecture projects, and frontend experiments.</p><a href="https://github.com" target="_blank" style="background:#0078d7;color:#fff;padding:10px 24px;text-decoration:none;border-radius:4px;font-weight:600;display:inline-block;">Open External GitHub ↗</a></div>`;
        } else if (url.includes('linkedin.com')) {
            edgeViewport.innerHTML = `<div style="padding:40px;text-align:center;color:#fff;"><i class="fa-brands fa-linkedin" style="font-size:4rem;color:#0a66c2;margin-bottom:15px;"></i><h2>Bhavy's LinkedIn Network</h2><p style="color:#aaa;max-width:500px;margin:10px auto 20px;">Connect professionally, view endorsement badges, and explore career history.</p><a href="https://linkedin.com" target="_blank" style="background:#0a66c2;color:#fff;padding:10px 24px;text-decoration:none;border-radius:4px;font-weight:600;display:inline-block;">Open External LinkedIn ↗</a></div>`;
        } else {
            const displayUrl = url.replace(/^https?:\/\//, '');
            edgeViewport.innerHTML = `<div style="padding:30px;color:#fff;"><div style="font-size:0.85rem;color:#888;margin-bottom:10px;"><i class="fa-solid fa-globe"></i> Results for: <strong>${displayUrl}</strong></div><div style="background:#141418;padding:20px;border-radius:6px;border:1px solid var(--win-border);"><h3 style="color:#60a5fa;margin-bottom:6px;">Bhavy — Full-Stack Software Engineer</h3><p style="color:#ccc;font-size:0.9rem;line-height:1.5;">Welcome to Bhavy's Web Application OS. Experienced in building high-performance web apps, responsive designs, complex UI systems, and interactive portfolio experiences.</p><div style="margin-top:15px;display:flex;gap:10px;"><button onclick="openWindow('projects')" style="background:#0078d7;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Explore Projects</button><button onclick="openWindow('contact')" style="background:rgba(255,255,255,0.1);color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">Contact Me</button></div></div></div>`;
        }
    };

    document.getElementById('edge-go')?.addEventListener('click', () => navigateEdge(edgeUrlInput?.value || ''));
    edgeUrlInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigateEdge(edgeUrlInput.value); });
    document.getElementById('edge-refresh')?.addEventListener('click', () => navigateEdge(edgeUrlInput?.value || ''));
    document.getElementById('edge-back')?.addEventListener('click', () => navigateEdge('https://bhavy-portfolio.dev/welcome'));
    document.getElementById('edge-forward')?.addEventListener('click', () => navigateEdge('https://github.com'));

    document.querySelectorAll('.edge-bookmark-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateEdge(btn.dataset.url));
    });

    // ==========================================================================
    // 19. NOTEPAD (status bar + save)
    // ==========================================================================
    const notepadTextarea = document.getElementById('notepad-textarea');

    const updateNotepadStatusBar = () => {
        if (!notepadTextarea) return;
        const text = notepadTextarea.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text.split('\n').length;

        let sb = document.getElementById('notepad-status-bar');
        if (!sb) {
            sb = document.createElement('div');
            sb.id = 'notepad-status-bar';
            sb.className = 'notepad-status-bar';
            document.getElementById('win-notepad')?.appendChild(sb);
        }
        sb.textContent = `Lines: ${lines}  |  Words: ${words}  |  Characters: ${chars}  |  UTF-8`;
    };

    if (notepadTextarea) {
        const savedNote = localStorage.getItem('win10-notepad');
        if (savedNote !== null) notepadTextarea.value = savedNote;
        updateNotepadStatusBar();
        notepadTextarea.addEventListener('input', () => {
            localStorage.setItem('win10-notepad', notepadTextarea.value);
            updateNotepadStatusBar();
        });
    }

    document.getElementById('notepad-save-btn')?.addEventListener('click', () => {
        if (!notepadTextarea) return;
        const blob = new Blob([notepadTextarea.value], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'README.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('File Saved', 'Downloaded README.txt to your device.', 'fa-solid fa-floppy-disk', 'Notepad');
    });

    // ==========================================================================
    // 20. CALCULATOR ENGINE
    // ==========================================================================
    const calcDisplay = document.getElementById('calc-display');
    let calcExpression = '';

    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const val = btn.dataset.val;

            if (action === 'clear') {
                calcExpression = '';
                if (calcDisplay) calcDisplay.textContent = '0';
            } else if (action === 'backspace') {
                calcExpression = calcExpression.slice(0, -1);
                if (calcDisplay) calcDisplay.textContent = calcExpression || '0';
            } else if (action === 'percent') {
                calcExpression += '%';
                if (calcDisplay) calcDisplay.textContent = calcExpression;
            } else if (action === 'op') {
                calcExpression += btn.textContent.trim();
                if (calcDisplay) calcDisplay.textContent = calcExpression;
            } else if (action === 'equals') {
                if (!calcExpression || calcExpression.trim() === '') {
                    if (calcDisplay) calcDisplay.textContent = '0';
                    calcExpression = '';
                    playSound('click');
                    return;
                }
                try {
                    let sanitized = calcExpression.replace(/÷/g, '/').replace(/×/g, '*');
                    sanitized = sanitized.replace(/(\d+\.?\d*)\s*([+\-])\s*(\d+\.?\d*)%/g, '$1 $2 ($1 * $3 / 100)');
                    sanitized = sanitized.replace(/(\d+\.?\d*)%/g, '($1/100)');
                    let result = Function('"use strict"; return (' + sanitized + ')')();
                    if (result === undefined || isNaN(result)) {
                        if (calcDisplay) calcDisplay.textContent = '0';
                        calcExpression = '';
                    } else {
                        if (calcDisplay) calcDisplay.textContent = result;
                        calcExpression = String(result);
                    }
                } catch (err) {
                    if (calcDisplay) calcDisplay.textContent = 'Error';
                    calcExpression = '';
                }
            } else if (val !== undefined) {
                if (calcExpression === '' && val !== '.') {
                    calcExpression = val;
                } else {
                    calcExpression += val;
                }
                if (calcDisplay) calcDisplay.textContent = calcExpression;
            }

            playSound('click');
        });
    });

    // ==========================================================================
    // 21. PAINT ENGINE
    // ==========================================================================
    let paintCanvas, paintCtx, isDrawing = false;
    let strokeHistory = [];
    let currentPaintTool = 'pencil';
    let startX, startY;

    function initPaintCanvas() {
        paintCanvas = document.getElementById('paint-canvas');
        if (!paintCanvas) return;
        paintCtx = paintCanvas.getContext('2d');

        const parentW = paintCanvas.parentElement.clientWidth || 740;
        const parentH = paintCanvas.parentElement.clientHeight || 440;

        if (paintCanvas.width !== parentW || paintCanvas.height !== parentH) {
            paintCanvas.width = parentW;
            paintCanvas.height = parentH;
            paintCtx.fillStyle = '#ffffff';
            paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
            savePaintState();
        }

        // Remove old listeners to avoid duplicates
        paintCanvas.onmousedown = (e) => {
            isDrawing = true;
            startX = e.offsetX;
            startY = e.offsetY;
            if (currentPaintTool === 'pencil' || currentPaintTool === 'eraser') {
                paintCtx.beginPath();
                paintCtx.moveTo(startX, startY);
            }
        };

        paintCanvas.onmousemove = (e) => {
            if (!isDrawing) return;
            if (currentPaintTool === 'pencil' || currentPaintTool === 'eraser') {
                paintCtx.lineTo(e.offsetX, e.offsetY);
                paintCtx.strokeStyle = currentPaintTool === 'eraser' ? '#ffffff' : (document.getElementById('paint-color')?.value || '#000');
                paintCtx.lineWidth = document.getElementById('paint-size')?.value || 5;
                paintCtx.lineCap = 'round';
                paintCtx.stroke();
            }
        };

        paintCanvas.onmouseup = (e) => {
            if (!isDrawing) return;
            isDrawing = false;
            const endX = e.offsetX;
            const endY = e.offsetY;
            const color = document.getElementById('paint-color')?.value || '#000';
            const size = document.getElementById('paint-size')?.value || 5;

            paintCtx.strokeStyle = color;
            paintCtx.fillStyle = color;
            paintCtx.lineWidth = size;

            if (currentPaintTool === 'fill') {
                paintCtx.fillStyle = color;
                paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
            } else if (currentPaintTool === 'line') {
                paintCtx.beginPath();
                paintCtx.moveTo(startX, startY);
                paintCtx.lineTo(endX, endY);
                paintCtx.stroke();
            } else if (currentPaintTool === 'rect') {
                paintCtx.strokeRect(startX, startY, endX - startX, endY - startY);
            } else if (currentPaintTool === 'circle') {
                paintCtx.beginPath();
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                paintCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
                paintCtx.stroke();
            }
            savePaintState();
        };

        paintCanvas.onmouseleave = () => isDrawing = false;
    }

    function savePaintState() {
        if (!paintCtx || !paintCanvas) return;
        if (strokeHistory.length > 15) strokeHistory.shift();
        strokeHistory.push(paintCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
    }

    ['pencil', 'eraser', 'fill', 'line', 'rect', 'circle'].forEach(tool => {
        document.getElementById(`paint-tool-${tool}`)?.addEventListener('click', (e) => {
            document.querySelectorAll('.paint-tool-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentPaintTool = tool;
            playSound('click');
        });
    });

    document.getElementById('paint-undo')?.addEventListener('click', () => {
        if (strokeHistory.length > 1 && paintCtx && paintCanvas) {
            strokeHistory.pop();
            const prevState = strokeHistory[strokeHistory.length - 1];
            paintCtx.putImageData(prevState, 0, 0);
            playSound('click');
        }
    });

    document.getElementById('paint-clear')?.addEventListener('click', () => {
        if (paintCtx && paintCanvas) {
            paintCtx.fillStyle = '#ffffff';
            paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
            savePaintState();
            playSound('click');
        }
    });

    document.getElementById('paint-save-png')?.addEventListener('click', () => {
        if (!paintCanvas) return;
        const link = document.createElement('a');
        link.download = 'bhavy_portfolio_artwork.png';
        link.href = paintCanvas.toDataURL('image/png');
        link.click();
        showToast('Artwork Saved!', 'Downloaded drawing as PNG', 'fa-solid fa-download', 'Paint');
    });

    // ==========================================================================
    // 22. COMMAND PROMPT
    // ==========================================================================
    const cmdInputField = document.getElementById('cmd-input-field');
    const cmdOutput = document.getElementById('cmd-output');
    const cmdBody = document.getElementById('cmd-body-container');

    const appendCmdText = (html, color) => {
        const div = document.createElement('div');
        div.className = 'cmd-text';
        if (color) div.style.color = color;
        div.innerHTML = html;
        cmdOutput?.appendChild(div);
        if (cmdBody) cmdBody.scrollTop = cmdBody.scrollHeight;
    };

    const cmdCommands = {
        help: () => {
            appendCmdText(`<br><strong style="color:#60a5fa;">AVAILABLE COMMANDS:</strong>
<br>  <span class="text-gold">help</span>         — Show this help menu
<br>  <span class="text-gold">about</span>        — About this system and developer
<br>  <span class="text-gold">skills</span>       — List technical skills
<br>  <span class="text-gold">projects</span>     — Open the Projects Explorer
<br>  <span class="text-gold">contact</span>      — Open the Contact / Mail app
<br>  <span class="text-gold">resume</span>       — View resume
<br>  <span class="text-gold">date</span>         — Show current date and time
<br>  <span class="text-gold">whoami</span>       — Display current user
<br>  <span class="text-gold">hostname</span>     — Display hostname
<br>  <span class="text-gold">matrix</span>       — Enter the Matrix...
<br>  <span class="text-gold">cls / clear</span>  — Clear screen
<br>  <span class="text-gold">exit</span>         — Close terminal
<br>`);
        },
        about: () => appendCmdText(`<br>  <strong>Windows 10 Portfolio OS</strong> v3.0<br>  Full-Stack Developer: Bhavy<br>  Built with: HTML5, CSS3, Vanilla JavaScript<br>  Architecture: Single-page, state-managed, Web Audio API<br>`),
        skills: () => appendCmdText(`<br>  <span class="text-cyan">Frontend:</span> JavaScript, TypeScript, React, Next.js, HTML5, CSS3<br>  <span class="text-cyan">Backend:</span> Node.js, Express, Python, FastAPI<br>  <span class="text-cyan">Database:</span> PostgreSQL, MongoDB, Redis<br>  <span class="text-cyan">Tools:</span> Git, Docker, Vercel, AWS, VS Code, Linux<br>`),
        projects: () => { openWindow('projects'); appendCmdText(`<br>  <span class="text-green">Opening File Explorer → Projects...</span><br>`); },
        contact: () => { openWindow('contact'); appendCmdText(`<br>  <span class="text-green">Opening Mail App...</span><br>`); },
        resume: () => { openWindow('resume'); appendCmdText(`<br>  <span class="text-green">Opening Resume.pdf viewer...</span><br>`); },
        date: () => appendCmdText(`<br>  <span class="text-cyan">${new Date().toLocaleString()}</span><br>`),
        whoami: () => appendCmdText(`<br>  bhavy@portfolio-os<br>`),
        hostname: () => appendCmdText(`<br>  BHAVY-PORTFOLIO-OS<br>`),
        matrix: () => {
            appendCmdText('<br>');
            let lines = 0;
            const interval = setInterval(() => {
                const chars = Array.from({ length: 60 }, () => String.fromCharCode(0x30A0 + Math.random() * 96)).join('');
                appendCmdText(`<span style="color:#00ff00;font-size:0.7rem;">${chars}</span>`);
                lines++;
                if (lines > 20) { clearInterval(interval); appendCmdText('<br>  <span class="text-gold">You are the One, Neo.</span><br>'); }
            }, 80);
        },
        cls: () => { if (cmdOutput) cmdOutput.innerHTML = ''; },
        clear: () => { if (cmdOutput) cmdOutput.innerHTML = ''; },
        exit: () => closeWindow('cmd'),
    };

    let cmdHistory = [];
    let cmdHistoryIdx = -1;

    document.getElementById('win-cmd')?.addEventListener('click', () => {
        cmdInputField?.focus();
    });

    cmdInputField?.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdHistory.length > 0) {
                if (cmdHistoryIdx > 0) cmdHistoryIdx--;
                else if (cmdHistoryIdx === -1) cmdHistoryIdx = cmdHistory.length - 1;
                cmdInputField.value = cmdHistory[cmdHistoryIdx] || '';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (cmdHistoryIdx !== -1 && cmdHistoryIdx < cmdHistory.length - 1) {
                cmdHistoryIdx++;
                cmdInputField.value = cmdHistory[cmdHistoryIdx];
            } else {
                cmdHistoryIdx = -1;
                cmdInputField.value = '';
            }
        } else if (e.key === 'Enter') {
            const rawVal = cmdInputField.value.trim();
            const input = rawVal.toLowerCase();
            appendCmdText(`<br><span class="cmd-prompt-str">C:\\Users\\Bhavy&gt;</span> <span style="color:#fff;">${cmdInputField.value}</span>`);
            cmdInputField.value = '';

            if (rawVal) {
                cmdHistory.push(rawVal);
                cmdHistoryIdx = -1;
            }

            if (input === '') return;
            if (cmdCommands[input]) {
                cmdCommands[input]();
            } else {
                appendCmdText(`<br>  <span class="text-red">'${input}' is not recognized as a command.</span><br>  Type <span class="text-gold">'help'</span> for a list of available commands.<br>`);
                playSound('error');
            }
        }
    });

    // ==========================================================================
    // 23. MINESWEEPER ENGINE
    // ==========================================================================
    const MS_ROWS = 9, MS_COLS = 9, MS_MINES = 10;
    let msGrid = [], msMinePositions = [], msRevealed = 0, msGameOver = false, msFlagged = 0;
    let msTimerId = null, msSeconds = 0;

    function initMinesweeper() {
        const container = document.getElementById('ms-grid-container');
        if (!container) return;
        container.innerHTML = '';
        msGrid = []; msMinePositions = []; msRevealed = 0; msGameOver = false; msFlagged = 0; msSeconds = 0;

        // Reset timer
        clearInterval(msTimerId);
        const timerEl = document.getElementById('ms-timer');
        if (timerEl) timerEl.textContent = '000';
        const minesEl = document.getElementById('ms-mines-count');
        if (minesEl) minesEl.textContent = String(MS_MINES).padStart(3, '0');
        const faceBtn = document.getElementById('ms-reset-btn');
        if (faceBtn) faceBtn.textContent = '🙂';

        // Generate empty grid
        for (let r = 0; r < MS_ROWS; r++) {
            msGrid[r] = [];
            for (let c = 0; c < MS_COLS; c++) {
                msGrid[r][c] = { mine: false, revealed: false, flagged: false, adjacent: 0 };
            }
        }

        // Place mines
        let placed = 0;
        while (placed < MS_MINES) {
            const r = Math.floor(Math.random() * MS_ROWS);
            const c = Math.floor(Math.random() * MS_COLS);
            if (!msGrid[r][c].mine) {
                msGrid[r][c].mine = true;
                msMinePositions.push([r, c]);
                placed++;
            }
        }

        // Calculate adjacency counts
        for (let r = 0; r < MS_ROWS; r++) {
            for (let c = 0; c < MS_COLS; c++) {
                if (msGrid[r][c].mine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < MS_ROWS && nc >= 0 && nc < MS_COLS && msGrid[nr][nc].mine) count++;
                    }
                }
                msGrid[r][c].adjacent = count;
            }
        }

        // Create cells
        for (let r = 0; r < MS_ROWS; r++) {
            for (let c = 0; c < MS_COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'ms-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener('click', () => msRevealCell(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    msFlagCell(r, c, cell);
                });

                container.appendChild(cell);
            }
        }

        // Start timer on first click
        msTimerId = setInterval(() => {
            if (!msGameOver) {
                msSeconds++;
                const timerEl = document.getElementById('ms-timer');
                if (timerEl) timerEl.textContent = String(msSeconds).padStart(3, '0');
            }
        }, 1000);
    }

    const msColors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000', '#808080'];

    function msRevealCell(r, c) {
        if (msGameOver) return;
        const cell = msGrid[r][c];
        if (cell.revealed || cell.flagged) return;

        cell.revealed = true;
        msRevealed++;
        const cellEl = document.querySelector(`.ms-cell[data-row="${r}"][data-col="${c}"]`);
        if (!cellEl) return;

        cellEl.classList.add('revealed');

        if (cell.mine) {
            cellEl.classList.add('mine');
            cellEl.textContent = '💣';
            msGameOver = true;
            clearInterval(msTimerId);
            const faceBtn = document.getElementById('ms-reset-btn');
            if (faceBtn) faceBtn.textContent = '😵';
            playSound('error');
            // Reveal all mines
            msMinePositions.forEach(([mr, mc]) => {
                const mineEl = document.querySelector(`.ms-cell[data-row="${mr}"][data-col="${mc}"]`);
                if (mineEl && !msGrid[mr][mc].revealed) {
                    mineEl.classList.add('revealed', 'mine');
                    mineEl.textContent = '💣';
                }
            });
            return;
        }

        if (cell.adjacent > 0) {
            cellEl.textContent = cell.adjacent;
            cellEl.style.color = msColors[cell.adjacent] || '#000';
        } else {
            // Flood fill for empty cells
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < MS_ROWS && nc >= 0 && nc < MS_COLS) msRevealCell(nr, nc);
                }
            }
        }

        // Win check
        if (msRevealed === MS_ROWS * MS_COLS - MS_MINES) {
            msGameOver = true;
            clearInterval(msTimerId);
            const faceBtn = document.getElementById('ms-reset-btn');
            if (faceBtn) faceBtn.textContent = '😎';
            showToast('🎉 Minesweeper Victory!', `You cleared the board in ${msSeconds} seconds!`, 'fa-solid fa-trophy', 'Minesweeper');
        }
    }

    function msFlagCell(r, c, cellEl) {
        if (msGameOver) return;
        const cell = msGrid[r][c];
        if (cell.revealed) return;

        cell.flagged = !cell.flagged;
        cellEl.classList.toggle('flagged', cell.flagged);
        msFlagged += cell.flagged ? 1 : -1;

        const minesEl = document.getElementById('ms-mines-count');
        if (minesEl) minesEl.textContent = String(MS_MINES - msFlagged).padStart(3, '0');
    }

    document.getElementById('ms-reset-btn')?.addEventListener('click', initMinesweeper);

    // ==========================================================================
    // 24. RECYCLE BIN
    // ==========================================================================
    document.getElementById('empty-bin-btn')?.addEventListener('click', () => {
        const binArea = document.getElementById('bin-content-area');
        if (binArea) binArea.innerHTML = '<div style="padding:40px;text-align:center;color:#888;"><i class="fa-regular fa-trash-can" style="font-size:3rem;margin-bottom:10px;opacity:0.4;"></i><p>Recycle Bin is empty.</p></div>';
        showToast('Recycle Bin Emptied', 'All deleted items have been permanently removed.', 'fa-solid fa-trash-can', 'Recycle Bin');
    });

    document.getElementById('restore-bin-btn')?.addEventListener('click', () => {
        showToast('Items Restored', 'All items have been restored to their original locations.', 'fa-solid fa-rotate-left', 'Recycle Bin');
    });

    // ==========================================================================
    // 25. CORTANA CHATBOT (INTELLIGENT RESPONSES & SPEECH SYNTHESIS)
    // ==========================================================================
    const cortanaChatList = document.getElementById('cortana-chat-list');
    const cortanaInput = document.getElementById('cortana-input');

    const getCortanaResponse = (query) => {
        const q = query.toLowerCase();

        // 1. App Launch Triggers
        const appTriggers = [
            { keys: ['project', 'folder', 'work'], winId: 'projects', name: 'Projects Explorer' },
            { keys: ['skill', 'ability', 'control panel'], winId: 'skills', name: 'Control Panel (Skills)' },
            { keys: ['contact', 'mail', 'email', 'message', 'send'], winId: 'contact', name: 'Contact Mail' },
            { keys: ['resume', 'cv', 'pdf'], winId: 'resume', name: 'Resume PDF Reader' },
            { keys: ['paint', 'draw', 'sketch'], winId: 'paint', name: 'MS Paint' },
            { keys: ['code', 'vscode', 'source'], winId: 'vscode', name: 'VS Code' },
            { keys: ['cmd', 'terminal', 'command prompt', 'cli'], winId: 'cmd', name: 'Command Prompt' },
            { keys: ['edge', 'browser', 'web', 'internet'], winId: 'edge', name: 'Microsoft Edge' },
            { keys: ['setting', 'theme', 'wallpaper', 'personalize'], winId: 'settings', name: 'Settings' },
            { keys: ['calc', 'calculator', 'math'], winId: 'calculator', name: 'Calculator' },
            { keys: ['minesweeper', 'game', 'play'], winId: 'minesweeper', name: 'Minesweeper' },
            { keys: ['task manager', 'cpu', 'ram', 'process'], winId: 'taskmgr', name: 'Task Manager' },
            { keys: ['music', 'song', 'groove', 'player', 'lofi'], winId: 'mediaplayer', name: 'Groove Music' },
            { keys: ['sticky', 'note'], winId: 'stickynotes', name: 'Sticky Notes' },
            { keys: ['about', 'who is', 'this pc'], winId: 'this-pc', name: 'About Bhavy' }
        ];

        if (q.includes('open') || q.includes('launch') || q.includes('show') || q.includes('go to') || q.includes('start') || q.includes('run')) {
            for (const item of appTriggers) {
                if (item.keys.some(k => q.includes(k))) {
                    openWindow(item.winId);
                    return `🚀 Opening <strong>${item.name}</strong> for you right now!`;
                }
            }
        }

        // 2. Specific Topic Answers
        if (q.includes('skill') || q.includes('know') || q.includes('tech stack')) {
            return 'Bhavy is proficient in <strong>JavaScript (ES6+)</strong>, <strong>React / Next.js</strong>, <strong>Node.js</strong>, <strong>Python</strong>, <strong>HTML5/CSS3</strong>, <strong>PostgreSQL</strong>, <strong>MongoDB</strong>, and <strong>Docker</strong>!';
        }
        if (q.includes('project') || q.includes('portfolio') || q.includes('apps')) {
            return 'Bhavy built the <strong>Windows 10 Portfolio OS</strong>, an <strong>AI Workspace Suite</strong>, a <strong>Real-Time Analytics Dashboard</strong>, and an <strong>Arcade Engine</strong>! Opening Projects Explorer...';
        }
        if (q.includes('resume') || q.includes('cv')) {
            openWindow('resume');
            return 'Opening Bhavy\'s official <strong>Resume.pdf</strong> for you!';
        }
        if (q.includes('contact') || q.includes('hire') || q.includes('email') || q.includes('reach')) {
            openWindow('contact');
            return 'Bhavy is <strong style="color:#10b981;">available for hire</strong>! You can send an email via Windows Mail or connect on GitHub/LinkedIn.';
        }
        if (q.includes('experience') || q.includes('job') || q.includes('work history')) {
            openWindow('experience');
            return 'Bhavy has worked as a <strong>Senior Full-Stack Developer</strong> at Tech Innovations Lab and <strong>Frontend Web Developer</strong> at Digital Solutions Inc.';
        }
        if (q.includes('education') || q.includes('degree') || q.includes('college') || q.includes('university')) {
            return 'Bhavy holds a <strong>B.S. in Computer Science</strong> with Honors from University of Technology, specializing in Software Engineering and HCI.';
        }
        if (q.includes('how are you') || q.includes('how\'s it going') || q.includes('whats up')) {
            return 'I\'m running at 100% efficiency! Thanks for asking. How can I help you explore Bhavy\'s portfolio today?';
        }
        if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('greetings')) {
            return 'Hello! 👋 I\'m Cortana, Bhavy\'s virtual assistant. Feel free to ask about skills, projects, experience, or tell me to open any app!';
        }
        if (q.includes('who are you') || q.includes('what are you') || q.includes('name')) {
            return 'I am <strong>Cortana</strong>, your AI guide inside Bhavy\'s Windows 10 Portfolio OS!';
        }
        if (q.includes('who is bhavy') || q.includes('about bhavy') || q.includes('creator') || q.includes('developer')) {
            return 'Bhavy is a passionate Full-Stack Software Engineer who crafts high-performance web applications and interactive digital experiences!';
        }
        if (q.includes('joke') || q.includes('funny')) {
            return 'Why do programmers prefer dark mode? Because light attracts bugs! 🐛';
        }
        if (q.includes('thanks') || q.includes('thank you')) {
            return 'You\'re very welcome! Let me know if you need anything else.';
        }
        if (q.includes('bye') || q.includes('goodbye')) {
            return 'Goodbye! Have a great time exploring the portfolio desktop.';
        }

        // Default Fallback
        return 'I can help you explore Bhavy\'s portfolio! Try asking me to open <strong>projects</strong>, <strong>skills</strong>, <strong>resume</strong>, or <strong>contact info</strong>.';
    };

    const sendCortanaMessage = (queryText) => {
        if (!cortanaChatList) return;
        const query = queryText || cortanaInput?.value?.trim();
        if (!query) return;

        // User message
        const userMsg = document.createElement('div');
        userMsg.className = 'cortana-msg user';
        userMsg.textContent = query;
        cortanaChatList.appendChild(userMsg);

        if (cortanaInput) cortanaInput.value = '';

        // Assistant response (with typing delay)
        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'cortana-msg assistant';
            const replyHtml = getCortanaResponse(query);
            botMsg.innerHTML = replyHtml;
            cortanaChatList.appendChild(botMsg);
            cortanaChatList.scrollTop = cortanaChatList.scrollHeight;

            // Cortana speaks text
            if (typeof speakCortanaText === 'function') {
                speakCortanaText(replyHtml);
            }
        }, 500);

        cortanaChatList.scrollTop = cortanaChatList.scrollHeight;
        playSound('click');
    };

    document.getElementById('cortana-send-btn')?.addEventListener('click', () => sendCortanaMessage());
    cortanaInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendCortanaMessage(); });

    document.querySelectorAll('.cortana-chip').forEach(chip => {
        chip.addEventListener('click', () => sendCortanaMessage(chip.dataset.query));
    });

    // ==========================================================================
    // 26. TASK MANAGER (Live Graphs + Process List)
    // ==========================================================================
    function startTaskManagerUpdates() {
        if (state.tmIntervalId) return;
        state.tmIntervalId = setInterval(() => {
            // Update CPU
            const cpuVal = Math.floor(12 + Math.random() * 20);
            state.tmCpuData.push(cpuVal);
            if (state.tmCpuData.length > 40) state.tmCpuData.shift();
            document.getElementById('cpu-percent-val').textContent = `${cpuVal}%`;

            // Update RAM
            const ramVal = Math.floor(22 + Math.random() * 10);
            state.tmRamData.push(ramVal);
            if (state.tmRamData.length > 40) state.tmRamData.shift();
            const ramGB = (ramVal / 100 * 16).toFixed(1);
            document.getElementById('ram-percent-val').textContent = `${ramGB} / 16.0 GB (${ramVal}%)`;

            drawGraph('cpu-graph-canvas', state.tmCpuData, '#06b6d4');
            drawGraph('ram-graph-canvas', state.tmRamData, '#a855f7');
        }, 1500);
    }

    function stopTaskManagerUpdates() {
        if (state.tmIntervalId) {
            clearInterval(state.tmIntervalId);
            state.tmIntervalId = null;
        }
    }

    function drawGraph(canvasId, dataArray, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.parentElement.clientWidth;
        const h = canvas.height || 120;

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = (h / 5) * i;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Line graph
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        const step = w / (dataArray.length - 1);
        dataArray.forEach((val, i) => {
            const x = i * step;
            const y = h - (val / 100) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill gradient below line
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '05');
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Task Manager tabs
    document.querySelectorAll('.taskmgr-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.taskmgr-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.taskmgr-pane').forEach(p => p.classList.add('hidden'));
            const target = tab.dataset.tab;
            document.getElementById(`taskmgr-tab-${target}`)?.classList.remove('hidden');
        });
    });

    function updateTaskManagerProcessList() {
        const tbody = document.getElementById('taskmgr-process-rows');
        if (!tbody) return;
        tbody.innerHTML = '';

        state.openWindows.forEach(winId => {
            const meta = windowMeta[winId] || { icon: 'fa-solid fa-window-maximize', label: winId };
            const cpu = (Math.random() * 5).toFixed(1);
            const mem = (Math.random() * 50 + 10).toFixed(0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><i class="${meta.icon}" style="margin-right:8px;"></i>${meta.label}</td>
                <td><span class="text-green">Running</span></td>
                <td>${cpu}%</td>
                <td>${mem} MB</td>
                <td><button class="end-task-btn" data-winid="${winId}">End Task</button></td>
            `;
            tr.querySelector('.end-task-btn')?.addEventListener('click', () => {
                closeWindow(winId);
                showToast('Task Ended', `${meta.label} process has been terminated.`, 'fa-solid fa-circle-xmark', 'Task Manager');
            });
            tbody.appendChild(tr);
        });

        if (state.openWindows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">No active processes.</td></tr>';
        }
    }

    // ==========================================================================
    // 27. RESUME PDF VIEWER (Zoom)
    // ==========================================================================
    let pdfZoom = 1;
    document.getElementById('zoom-in-pdf')?.addEventListener('click', () => {
        pdfZoom = Math.min(pdfZoom + 0.15, 1.6);
        const doc = document.getElementById('pdf-document');
        if (doc) doc.style.transform = `scale(${pdfZoom})`;
    });
    document.getElementById('zoom-out-pdf')?.addEventListener('click', () => {
        pdfZoom = Math.max(pdfZoom - 0.15, 0.6);
        const doc = document.getElementById('pdf-document');
        if (doc) doc.style.transform = `scale(${pdfZoom})`;
    });

    // ==========================================================================
    // 28. CONTACT FORM
    // ==========================================================================
    document.getElementById('send-mail-btn')?.addEventListener('click', () => {
        const name = document.getElementById('sender-name')?.value?.trim();
        const email = document.getElementById('sender-email')?.value?.trim();
        const subject = document.getElementById('sender-subject')?.value?.trim();
        const message = document.getElementById('sender-message')?.value?.trim();

        if (!name || !email || !subject || !message) {
            showToast('Missing Fields', 'Please fill out all required fields before sending.', 'fa-solid fa-triangle-exclamation', 'Mail');
            playSound('error');
            return;
        }

        showToast('Message Sent! ✉️', `Thanks ${name}! Your message about "${subject}" has been sent successfully.`, 'fa-solid fa-check-circle', 'Windows Mail');
        playSound('notify');
    });

    document.getElementById('clear-mail-btn')?.addEventListener('click', () => {
        ['sender-name', 'sender-email', 'sender-subject', 'sender-message'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    });

    // ==========================================================================
    // 29. PROJECT FILTERING
    // ==========================================================================
    document.querySelectorAll('.explorer-sidebar .sidebar-menu li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.explorer-sidebar .sidebar-menu li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const filter = item.dataset.filter;

            document.querySelectorAll('.project-item-card').forEach(card => {
                if (filter === 'all') {
                    card.style.display = '';
                } else {
                    card.style.display = card.dataset.category === filter ? '' : 'none';
                }
            });
        });
    });

    // Project search
    document.getElementById('project-search-input')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.project-item-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    });

    // ==========================================================================
    // 30. KEYBOARD SHORTCUTS
    // ==========================================================================
    document.addEventListener('keydown', (e) => {
        // Windows key = toggle start menu
        if (e.key === 'Meta' || e.key === 'OS') {
            e.preventDefault();
            toggleStartMenu();
        }
        // Escape = close focused window or overlays
        if (e.key === 'Escape') {
            if (!taskViewOverlay?.classList.contains('hidden')) {
                taskViewOverlay.classList.add('hidden');
            } else if (!powerModal?.classList.contains('hidden')) {
                powerModal.classList.add('hidden');
            } else if (state.activeWindow) {
                closeWindow(state.activeWindow);
            }
        }
    });

    // ==========================================================================
    // 31. STICKY NOTES ENGINE
    // ==========================================================================
    const stickyTextarea = document.getElementById('sticky-note-input');
    const stickyWin = document.getElementById('win-stickynotes');

    if (stickyTextarea) {
        const savedStickyText = localStorage.getItem('win10-sticky-text');
        const savedStickyColor = localStorage.getItem('win10-sticky-color');
        if (savedStickyText !== null) stickyTextarea.value = savedStickyText;
        if (savedStickyColor && stickyWin) {
            stickyWin.className = `win-window sticky-note sticky-${savedStickyColor}`;
        }

        stickyTextarea.addEventListener('input', () => {
            localStorage.setItem('win10-sticky-text', stickyTextarea.value);
        });
    }

    document.querySelectorAll('.sticky-color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.dataset.color;
            if (stickyWin) stickyWin.className = `win-window sticky-note sticky-${color}`;
            localStorage.setItem('win10-sticky-color', color);
            playSound('click');
        });
    });

    // ==========================================================================
    // 32. GROOVE MUSIC PLAYER & CANVAS VISUALIZER
    // ==========================================================================
    let mpPlaying = false;
    let mpCurrentTrack = 0;
    let mpAnimId = null;

    const mpTracks = [
        { name: '1. Synthwave Horizon', freq: 440 },
        { name: '2. Chill Lo-Fi Chillbeats', freq: 330 },
        { name: '3. Cyberpunk Retrowave', freq: 554 }
    ];

    const drawMediaPlayerSpectrum = () => {
        const canvas = document.getElementById('mediaplayer-visualizer');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.parentElement.clientWidth || 480;
        const h = canvas.height = 140;

        ctx.clearRect(0, 0, w, h);
        const bars = 32;
        const barW = w / bars;

        for (let i = 0; i < bars; i++) {
            const barH = mpPlaying ? Math.random() * (h * 0.8) + 10 : 4;
            const x = i * barW;
            const y = h - barH;

            const grad = ctx.createLinearGradient(0, y, 0, h);
            grad.addColorStop(0, '#a855f7');
            grad.addColorStop(1, '#0078d7');
            ctx.fillStyle = grad;
            ctx.fillRect(x + 2, y, barW - 4, barH);
        }

        if (mpPlaying) {
            mpAnimId = requestAnimationFrame(drawMediaPlayerSpectrum);
        }
    };

    const toggleMusicPlay = () => {
        mpPlaying = !mpPlaying;
        const icon = document.getElementById('mp-play-icon');
        if (icon) icon.className = mpPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';

        if (mpPlaying) {
            playSound('open');
            drawMediaPlayerSpectrum();
            showToast('Now Playing 🎵', mpTracks[mpCurrentTrack].name, 'fa-solid fa-compact-disc', 'Groove Music');
        } else {
            if (mpAnimId) cancelAnimationFrame(mpAnimId);
            drawMediaPlayerSpectrum();
        }
    };

    document.getElementById('mp-play-btn')?.addEventListener('click', toggleMusicPlay);
    document.getElementById('mp-next-btn')?.addEventListener('click', () => {
        mpCurrentTrack = (mpCurrentTrack + 1) % mpTracks.length;
        document.querySelectorAll('.track-list-item').forEach((item, idx) => {
            item.classList.toggle('active', idx === mpCurrentTrack);
        });
        if (mpPlaying) playSound('click');
    });

    document.getElementById('mp-prev-btn')?.addEventListener('click', () => {
        mpCurrentTrack = (mpCurrentTrack - 1 + mpTracks.length) % mpTracks.length;
        document.querySelectorAll('.track-list-item').forEach((item, idx) => {
            item.classList.toggle('active', idx === mpCurrentTrack);
        });
        if (mpPlaying) playSound('click');
    });

    // ==========================================================================
    // 33. BSOD EASTER EGG
    // ==========================================================================
    function triggerBSOD() {
        const bsod = document.getElementById('bsod-overlay');
        const percentEl = document.getElementById('bsod-percent');
        if (!bsod) return;

        bsod.classList.remove('hidden');
        playSound('error');

        let pct = 0;
        const interval = setInterval(() => {
            pct += Math.floor(Math.random() * 25) + 10;
            if (pct > 100) pct = 100;
            if (percentEl) percentEl.textContent = pct;
            if (pct >= 100) {
                clearInterval(interval);
                setTimeout(() => location.reload(), 1500);
            }
        }, 500);
    }

    // Add bsod & crash commands to CMD
    cmdCommands.bsod = triggerBSOD;
    cmdCommands.crash = triggerBSOD;

    // ==========================================================================
    // 34. CORTANA VOICE SPEECH SYNTHESIS & MICROPHONE RECOGNITION
    // ==========================================================================
    let cortanaSpeechEnabled = true;

    function speakCortanaText(text) {
        if (!cortanaSpeechEnabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const plainText = text.replace(/<[^>]*>?/gm, ''); // strip HTML tags
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    }

    document.getElementById('cortana-speech-toggle')?.addEventListener('click', (e) => {
        cortanaSpeechEnabled = !cortanaSpeechEnabled;
        const icon = document.getElementById('cortana-speech-icon');
        if (icon) icon.className = cortanaSpeechEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        showToast('Cortana Voice Speech', `Cortana text-to-speech is now ${cortanaSpeechEnabled ? 'ENABLED' : 'MUTED'}.`, 'fa-solid fa-volume-high', 'Cortana');
    });

    // Microphone speech recognition
    const micBtn = document.getElementById('cortana-mic-btn');
    if (micBtn && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognizer = new SpeechRec();
        recognizer.continuous = false;
        recognizer.interimResults = false;

        micBtn.addEventListener('click', () => {
            try {
                recognizer.start();
                micBtn.style.color = '#ef4444';
                showToast('Listening...', 'Speak now into your microphone...', 'fa-solid fa-microphone', 'Cortana');
            } catch (err) {
                /* Recognition active */
            }
        });

        recognizer.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            micBtn.style.color = '';
            sendCortanaMessage(transcript);
        };

        recognizer.onend = () => { micBtn.style.color = ''; };
    }

    // Trigger Cortana speech when assistant responds
    const origSendCortanaMsg = sendCortanaMessage;

    // ==========================================================================
    // 35. LIVE ANIMATED CANVAS WALLPAPERS (MATRIX & STARFIELD)
    // ==========================================================================
    let liveWpMode = localStorage.getItem('win10-live-wp') || 'none';
    let liveWpAnimId = null;

    function initLiveWallpaperCanvas() {
        const canvas = document.getElementById('live-canvas-wallpaper');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Matrix variables
        const matrixChars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const fontSize = 14;
        let columns = Math.floor(canvas.width / fontSize);
        let drops = new Array(columns).fill(1);

        // Starfield variables
        const stars = Array.from({ length: 150 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.5 + 0.2
        }));

        function animate() {
            if (liveWpMode === 'matrix') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#0f0';
                ctx.font = `${fontSize}px monospace`;

                for (let i = 0; i < drops.length; i++) {
                    const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                    ctx.fillText(char, i * fontSize, drops[i] * fontSize);
                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                }
            } else if (liveWpMode === 'starfield') {
                ctx.fillStyle = 'rgba(10, 10, 20, 0.2)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';

                stars.forEach(star => {
                    star.y += star.speed;
                    if (star.y > canvas.height) star.y = 0;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            liveWpAnimId = requestAnimationFrame(animate);
        }

        if (liveWpMode !== 'none') animate();
    }

    initLiveWallpaperCanvas();

    // ==========================================================================
    // 27. VIRTUAL FILE SYSTEM (VFS) MODULE
    // ==========================================================================
    const defaultVFS = {
        "C:": {
            type: "dir",
            children: {
                "Users": {
                    type: "dir",
                    children: {
                        "Bhavy": {
                            type: "dir",
                            children: {
                                "Desktop": {
                                    type: "dir",
                                    children: {
                                        "Welcome.txt": { type: "file", content: "Welcome to Windows 10 Portfolio OS!\nFeel free to explore projects, apps, and games." }
                                    }
                                },
                                "Documents": {
                                    type: "dir",
                                    children: {
                                        "Resume_Summary.txt": { type: "file", content: "Bhavy — Full-Stack Software Engineer\nSpecialized in React, Node.js, Python, and Web Systems." }
                                    }
                                },
                                "Downloads": { type: "dir", children: {} },
                                "Pictures": { type: "dir", children: {} }
                            }
                        }
                    }
                }
            }
        }
    };

    window.VFS = {
        data: JSON.parse(localStorage.getItem('win10-vfs') || JSON.stringify(defaultVFS)),
        save() {
            localStorage.setItem('win10-vfs', JSON.stringify(this.data));
        },
        resolvePath(pathStr) {
            const parts = pathStr.replace(/\\/g, '/').split('/').filter(Boolean);
            let current = this.data;
            for (const part of parts) {
                if (current && current.type === 'dir' && current.children[part]) {
                    current = current.children[part];
                } else {
                    return null;
                }
            }
            return current;
        },
        createFile(pathStr, fileName, content = '') {
            const dir = this.resolvePath(pathStr);
            if (dir && dir.type === 'dir') {
                dir.children[fileName] = { type: 'file', content };
                this.save();
                return true;
            }
            return false;
        },
        createDir(pathStr, dirName) {
            const dir = this.resolvePath(pathStr);
            if (dir && dir.type === 'dir') {
                dir.children[dirName] = { type: 'dir', children: {} };
                this.save();
                return true;
            }
            return false;
        },
        deletePath(pathStr, name) {
            const dir = this.resolvePath(pathStr);
            if (dir && dir.type === 'dir' && dir.children[name]) {
                delete dir.children[name];
                this.save();
                return true;
            }
            return false;
        }
    };

    // ==========================================================================
    // INITIALIZATION COMPLETE
    // ==========================================================================
    console.log('%c Windows 10 Portfolio OS v5.0 — Module 1 AAA Upgrades Active ', 'background:#0078d7;color:#fff;padding:8px;border-radius:4px;font-size:1rem;font-weight:bold;');

})();

