/* ==========================================================================
   WINDOWS 10 DESKTOP PORTFOLIO — ADVANCED SYSTEM LOGIC & REALISM ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    const state = {
        soundEnabled: true,
        currentWallpaperIdx: 0,
        wallpapers: [
            'assets/wallpaper.png',
            'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80'
        ],
        accentColor: '#0078d7',
        highestZIndex: 100,
        openWindows: new Set(),
        activeWindowId: null
    };

    // --- AUDIO SYSTEM (Web Audio API Synthesizer) ---
    const playSound = (type = 'click') => {
        if (!state.soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
            } else if (type === 'startup') {
                const notes = [440, 554.37, 659.25, 880];
                notes.forEach((freq, idx) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    const startTime = ctx.currentTime + idx * 0.12;
                    g.gain.setValueAtTime(0.001, startTime);
                    g.gain.linearRampToValueAtTime(0.08, startTime + 0.05);
                    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
                    o.start(startTime);
                    o.stop(startTime + 0.45);
                });
            } else if (type === 'bin') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            console.log('Audio initialized.');
        }
    };

    // ==========================================================================
    // 1. CLOCK & DATE SYSTEM
    // ==========================================================================
    const updateClocks = () => {
        const now = new Date();
        
        // Lock screen format
        const hours24 = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const lockTimeStr = `${String(hours24).padStart(2, '0')}:${minutes}`;
        const lockDateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        const lockDateStr = now.toLocaleDateString('en-US', lockDateOptions);

        const lockTimeEl = document.getElementById('lock-time');
        const lockDateEl = document.getElementById('lock-date');
        if (lockTimeEl) lockTimeEl.textContent = lockTimeStr;
        if (lockDateEl) lockDateEl.textContent = lockDateStr;

        // Taskbar format (12-hour)
        let hours12 = now.getHours() % 12;
        hours12 = hours12 ? hours12 : 12;
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        const trayTimeStr = `${hours12}:${minutes} ${ampm}`;
        const trayDateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

        const trayTimeEl = document.getElementById('tray-time');
        const trayDateEl = document.getElementById('tray-date');
        if (trayTimeEl) trayTimeEl.textContent = trayTimeStr;
        if (trayDateEl) trayDateEl.textContent = trayDateStr;

        // Calendar Popover Clock
        const calTimeDisplay = document.getElementById('cal-time-display');
        const calDateDisplay = document.getElementById('cal-date-display');
        if (calTimeDisplay) calTimeDisplay.textContent = `${hours12}:${minutes}:${seconds} ${ampm}`;
        if (calDateDisplay) calDateDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    };

    updateClocks();
    setInterval(updateClocks, 1000);

    // ==========================================================================
    // 2. LOCK SCREEN UNLOCK
    // ==========================================================================
    const lockScreen = document.getElementById('lock-screen');
    const desktopShell = document.getElementById('desktop-shell');
    const unlockBtn = document.getElementById('unlock-btn');

    const unlockOS = () => {
        if (!lockScreen.classList.contains('unlocked')) {
            lockScreen.classList.add('unlocked');
            desktopShell.classList.remove('hidden');
            playSound('startup');
        }
    };

    if (unlockBtn) unlockBtn.addEventListener('click', unlockOS);
    if (lockScreen) {
        lockScreen.addEventListener('click', (e) => {
            if (e.target === lockScreen || e.target.classList.contains('lock-screen-bg')) {
                lockScreen.classList.add('sign-in-mode');
            }
        });
    }

    window.addEventListener('keydown', () => {
        if (!lockScreen.classList.contains('unlocked')) {
            unlockOS();
        }
    });

    // ==========================================================================
    // 3. WINDOW MANAGER (OPEN, CLOSE, MINIMIZE, MAXIMIZE, FOCUS, DRAG, AERO SNAP, RESIZE)
    // ==========================================================================
    const taskbarAppsContainer = document.getElementById('taskbar-apps-container');
    const snapPreviewBox = document.getElementById('snap-preview-box');

    const openWindow = (windowId) => {
        const win = document.getElementById(`win-${windowId}`);
        if (!win) return;

        if (win.classList.contains('minimized')) {
            win.classList.remove('minimized');
        }

        win.classList.remove('hidden');
        state.openWindows.add(windowId);
        focusWindow(windowId);
        updateTaskbarPills();
        playSound('click');

        // Lazy load VS Code content if opened
        if (windowId === 'vscode') loadVsCodeContent('index.html');
        // Lazy load Paint canvas if opened
        if (windowId === 'paint') initPaintCanvas();
    };

    const focusWindow = (windowId) => {
        const win = document.getElementById(`win-${windowId}`);
        if (!win) return;

        document.querySelectorAll('.win-window').forEach(w => w.classList.remove('active'));

        state.highestZIndex += 1;
        win.style.zIndex = state.highestZIndex;
        win.classList.add('active');
        state.activeWindowId = windowId;

        updateTaskbarPills();
    };

    const minimizeWindow = (windowId) => {
        const win = document.getElementById(`win-${windowId}`);
        if (!win) return;
        win.classList.add('minimized');
        win.classList.remove('active');
        updateTaskbarPills();
    };

    const toggleMaximizeWindow = (windowId) => {
        const win = document.getElementById(`win-${windowId}`);
        if (!win) return;
        win.classList.toggle('maximized');
        focusWindow(windowId);
    };

    const closeWindow = (windowId) => {
        const win = document.getElementById(`win-${windowId}`);
        if (!win) return;
        win.classList.add('hidden');
        win.classList.remove('maximized', 'minimized');
        state.openWindows.delete(windowId);
        updateTaskbarPills();
    };

    const updateTaskbarPills = () => {
        taskbarAppsContainer.innerHTML = '';

        state.openWindows.forEach(winId => {
            const win = document.getElementById(`win-${winId}`);
            if (!win) return;

            const titleText = win.querySelector('.win-title').textContent.trim();
            const iconHtml = win.querySelector('.win-title i')?.outerHTML || '<i class="fa-solid fa-window-maximize"></i>';

            const pill = document.createElement('div');
            pill.className = `taskbar-app-pill ${winId === state.activeWindowId && !win.classList.contains('minimized') ? 'active' : ''}`;
            pill.innerHTML = `${iconHtml} <span>${titleText}</span>`;

            pill.addEventListener('click', () => {
                if (win.classList.contains('minimized')) {
                    openWindow(winId);
                } else if (state.activeWindowId === winId) {
                    minimizeWindow(winId);
                } else {
                    focusWindow(winId);
                }
            });

            taskbarAppsContainer.appendChild(pill);
        });
    };

    // Make Windows Draggable with Aero Snap
    document.querySelectorAll('.win-window').forEach(win => {
        const titlebar = win.querySelector('.win-titlebar');
        const winId = win.dataset.id;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        let snapState = null; // 'left', 'right', 'top'

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.win-controls')) return;
            if (win.classList.contains('maximized')) return;

            focusWindow(winId);
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = win.offsetLeft;
            initialTop = win.offsetTop;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            win.style.left = `${initialLeft + dx}px`;
            win.style.top = `${initialTop + dy}px`;

            // Aero Snap Detection
            const taskbarHeight = 40;
            const screenW = window.innerWidth;
            const screenH = window.innerHeight - taskbarHeight;

            if (e.clientX < 20) {
                // Snap Left Preview
                snapState = 'left';
                snapPreviewBox.style.left = '0px';
                snapPreviewBox.style.top = '0px';
                snapPreviewBox.style.width = `${screenW / 2}px`;
                snapPreviewBox.style.height = `${screenH}px`;
                snapPreviewBox.classList.remove('hidden');
            } else if (e.clientX > screenW - 20) {
                // Snap Right Preview
                snapState = 'right';
                snapPreviewBox.style.left = `${screenW / 2}px`;
                snapPreviewBox.style.top = '0px';
                snapPreviewBox.style.width = `${screenW / 2}px`;
                snapPreviewBox.style.height = `${screenH}px`;
                snapPreviewBox.classList.remove('hidden');
            } else if (e.clientY < 20) {
                // Maximize Preview
                snapState = 'top';
                snapPreviewBox.style.left = '0px';
                snapPreviewBox.style.top = '0px';
                snapPreviewBox.style.width = `${screenW}px`;
                snapPreviewBox.style.height = `${screenH}px`;
                snapPreviewBox.classList.remove('hidden');
            } else {
                snapState = null;
                snapPreviewBox.classList.add('hidden');
            }
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                snapPreviewBox.classList.add('hidden');

                const taskbarHeight = 40;
                const screenW = window.innerWidth;
                const screenH = window.innerHeight - taskbarHeight;

                if (snapState === 'left') {
                    win.style.left = '0px';
                    win.style.top = '0px';
                    win.style.width = `${screenW / 2}px`;
                    win.style.height = `${screenH}px`;
                } else if (snapState === 'right') {
                    win.style.left = `${screenW / 2}px`;
                    win.style.top = '0px';
                    win.style.width = `${screenW / 2}px`;
                    win.style.height = `${screenH}px`;
                } else if (snapState === 'top') {
                    win.classList.add('maximized');
                }

                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        };

        // Window Controls
        win.querySelector('.min-btn')?.addEventListener('click', () => minimizeWindow(winId));
        win.querySelector('.max-btn')?.addEventListener('click', () => toggleMaximizeWindow(winId));
        win.querySelector('.close-btn')?.addEventListener('click', () => closeWindow(winId));

        win.addEventListener('mousedown', () => focusWindow(winId));
    });

    // ==========================================================================
    // 4. DESKTOP MARQUEE SELECTION BOX
    // ==========================================================================
    const selectionBox = document.getElementById('desktop-selection-box');
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    let isSelecting = false;
    let selStartX, selStartY;

    document.getElementById('desktop-wallpaper').addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Only left click
        isSelecting = true;
        selStartX = e.clientX;
        selStartY = e.clientY;

        selectionBox.style.left = `${selStartX}px`;
        selectionBox.style.top = `${selStartY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.classList.remove('hidden');

        desktopIcons.forEach(i => i.classList.remove('selected'));
        closeAllPopovers();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;
        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(selStartX, currentX);
        const top = Math.min(selStartY, currentY);
        const width = Math.abs(currentX - selStartX);
        const height = Math.abs(currentY - selStartY);

        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;

        // Check icon intersection
        const selRect = { left, top, right: left + width, bottom: top + height };
        desktopIcons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const intersect = !(rect.right < selRect.left || 
                                rect.left > selRect.right || 
                                rect.bottom < selRect.top || 
                                rect.top > selRect.bottom);
            icon.classList.toggle('selected', intersect);
        });
    });

    document.addEventListener('mouseup', () => {
        if (isSelecting) {
            isSelecting = false;
            selectionBox.classList.add('hidden');
        }
    });

    // Desktop Icon double click
    desktopIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            desktopIcons.forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
        icon.addEventListener('dblclick', () => {
            openWindow(icon.dataset.window);
        });
    });

    // Close all menus popovers helper
    const closeAllPopovers = () => {
        closeStartMenu();
        closeActionCenter();
        closeContextMenu();
        closeSearchPopover();
        document.querySelectorAll('.tray-popover').forEach(p => p.classList.add('hidden'));
    };

    // ==========================================================================
    // 5. START MENU & POWER OPTIONS
    // ==========================================================================
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');

    const toggleStartMenu = () => {
        const isHidden = startMenu.classList.contains('hidden');
        closeAllPopovers();
        if (isHidden) {
            startMenu.classList.remove('hidden');
            startBtn.classList.add('active');
            playSound('click');
        }
    };

    const closeStartMenu = () => {
        startMenu.classList.add('hidden');
        startBtn.classList.remove('active');
    };

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStartMenu();
    });

    document.querySelectorAll('.start-app-item, .start-tile').forEach(item => {
        item.addEventListener('click', () => {
            const winId = item.dataset.window;
            if (winId) {
                openWindow(winId);
                closeStartMenu();
            }
        });
    });

    // Power Options Modal
    const powerModal = document.getElementById('power-modal');
    document.getElementById('start-btn-power')?.addEventListener('click', () => {
        powerModal.classList.remove('hidden');
        closeStartMenu();
    });

    document.getElementById('close-power-modal')?.addEventListener('click', () => powerModal.classList.add('hidden'));
    document.getElementById('power-lock-btn')?.addEventListener('click', () => {
        powerModal.classList.add('hidden');
        lockScreen.classList.remove('unlocked', 'sign-in-mode');
    });
    document.getElementById('power-restart-btn')?.addEventListener('click', () => location.reload());
    document.getElementById('power-shutdown-btn')?.addEventListener('click', () => {
        document.body.innerHTML = `
            <div style="background:#000; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-family:'Segoe UI', sans-serif;">
                <h1 style="font-size:2.5rem; margin-bottom:15px;"><i class="fa-solid fa-power-off" style="color:${state.accentColor};"></i> System Shut Down</h1>
                <p style="color:#aaa; margin-bottom:25px;">Windows Portfolio OS has been shut down safely.</p>
                <button onclick="location.reload()" style="background:${state.accentColor}; color:#fff; border:none; padding:10px 25px; border-radius:4px; font-size:1rem; cursor:pointer;">Turn On PC</button>
            </div>
        `;
    });

    // ==========================================================================
    // 6. TASKBAR SEARCH
    // ==========================================================================
    const searchInput = document.getElementById('taskbar-search-input');
    const searchPopover = document.getElementById('search-popover');
    const searchResultsList = document.getElementById('search-results-list');

    const searchableItems = [
        { title: 'About Bhavy (This PC)', icon: 'fa-desktop text-blue', winId: 'this-pc' },
        { title: 'Projects Explorer', icon: 'fa-folder-open text-gold', winId: 'projects' },
        { title: 'Technical Skills (Control Panel)', icon: 'fa-sliders text-cyan', winId: 'skills' },
        { title: 'VS Code Editor', icon: 'fa-code text-cyan', winId: 'vscode' },
        { title: 'Microsoft Edge Browser', icon: 'fa-edge text-blue', winId: 'edge' },
        { title: 'Windows Settings', icon: 'fa-gear text-cyan', winId: 'settings' },
        { title: 'Notepad Text Editor', icon: 'fa-file-lines text-yellow', winId: 'notepad' },
        { title: 'Calculator', icon: 'fa-calculator text-blue', winId: 'calculator' },
        { title: 'Paint Sketch', icon: 'fa-palette text-pink', winId: 'paint' },
        { title: 'Experience & Timeline', icon: 'fa-briefcase text-purple', winId: 'experience' },
        { title: 'Contact Me (Mail)', icon: 'fa-envelope text-blue', winId: 'contact' },
        { title: 'Resume.pdf Reader', icon: 'fa-file-pdf text-red', winId: 'resume' },
        { title: 'Command Prompt (cmd.exe)', icon: 'fa-terminal text-green', winId: 'cmd' },
        { title: 'Minesweeper Game', icon: 'fa-bomb text-red', winId: 'minesweeper' },
        { title: 'Recycle Bin', icon: 'fa-trash-can text-orange', winId: 'recycle-bin' }
    ];

    const closeSearchPopover = () => searchPopover.classList.add('hidden');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            closeSearchPopover();
            return;
        }

        const filtered = searchableItems.filter(item => item.title.toLowerCase().includes(query));
        searchResultsList.innerHTML = '';

        if (filtered.length === 0) {
            searchResultsList.innerHTML = `<div style="padding:15px; color:#888; text-align:center;">No results found</div>`;
        } else {
            filtered.forEach(item => {
                const el = document.createElement('div');
                el.className = 'search-item';
                el.innerHTML = `<i class="fa-solid ${item.icon}"></i> <span>${item.title}</span>`;
                el.addEventListener('click', () => {
                    openWindow(item.winId);
                    closeSearchPopover();
                    searchInput.value = '';
                });
                searchResultsList.appendChild(el);
            });
        }

        searchPopover.classList.remove('hidden');
    });

    // ==========================================================================
    // 7. SYSTEM TRAY POPOVERS (CALENDAR, VOLUME, WIFI, BATTERY, ACTION CENTER)
    // ==========================================================================
    const calendarPopover = document.getElementById('calendar-popover');
    const volumePopover = document.getElementById('volume-popover');
    const wifiPopover = document.getElementById('wifi-popover');
    const batteryPopover = document.getElementById('battery-popover');
    const actionCenter = document.getElementById('action-center');

    const toggleTrayPopover = (popoverEl) => {
        const isHidden = popoverEl.classList.contains('hidden');
        closeAllPopovers();
        if (isHidden) popoverEl.classList.remove('hidden');
    };

    document.getElementById('taskbar-clock')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTrayPopover(calendarPopover);
        renderCalendarGrid();
    });

    document.getElementById('tray-volume')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTrayPopover(volumePopover);
    });

    document.getElementById('tray-wifi')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTrayPopover(wifiPopover);
    });

    document.getElementById('tray-battery')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTrayPopover(batteryPopover);
    });

    document.getElementById('tray-action-center')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTrayPopover(actionCenter);
    });

    const closeActionCenter = () => actionCenter.classList.add('hidden');

    // Calendar Days Generator
    const renderCalendarGrid = () => {
        const calGrid = document.getElementById('cal-days-grid');
        if (!calGrid) return;
        calGrid.innerHTML = '';

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Empty cells before month start
        for (let x = 0; x < firstDayIndex; x++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day other-month';
            emptyCell.textContent = '';
            calGrid.appendChild(emptyCell);
        }

        // Month days
        for (let day = 1; day <= totalDays; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = `cal-day ${day === now.getDate() ? 'today' : ''}`;
            dayCell.textContent = day;
            calGrid.appendChild(dayCell);
        }
    };

    // Volume Slider Control
    const volumeSlider = document.getElementById('tray-volume-slider');
    const volumePercent = document.getElementById('tray-volume-percent');
    volumeSlider?.addEventListener('input', (e) => {
        const val = e.target.value;
        volumePercent.textContent = `${val}%`;
        playSound('click');
    });

    // Action Center Quick Actions
    document.getElementById('toggle-wallpaper')?.addEventListener('click', () => {
        state.currentWallpaperIdx = (state.currentWallpaperIdx + 1) % state.wallpapers.length;
        document.getElementById('desktop-wallpaper').style.backgroundImage = `url('${state.wallpapers[state.currentWallpaperIdx]}')`;
    });

    document.getElementById('toggle-sound')?.addEventListener('click', (e) => {
        state.soundEnabled = !state.soundEnabled;
        e.currentTarget.classList.toggle('active', state.soundEnabled);
        e.currentTarget.querySelector('span').textContent = `Sound: ${state.soundEnabled ? 'ON' : 'OFF'}`;
    });

    document.getElementById('toggle-fullscreen')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    document.getElementById('peek-desktop')?.addEventListener('click', () => {
        document.querySelectorAll('.win-window').forEach(win => win.classList.add('minimized'));
        updateTaskbarPills();
    });

    // ==========================================================================
    // 8. DESKTOP CONTEXT MENU (RIGHT CLICK)
    // ==========================================================================
    const contextMenu = document.getElementById('context-menu');

    const closeContextMenu = () => contextMenu.classList.add('hidden');

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const x = Math.min(e.clientX, window.innerWidth - 230);
        const y = Math.min(e.clientY, window.innerHeight - 220);
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');
    });

    document.addEventListener('click', closeContextMenu);

    document.getElementById('ctx-refresh')?.addEventListener('click', () => {
        desktopIcons.forEach(icon => {
            icon.style.animation = 'none';
            setTimeout(() => icon.style.animation = 'fadeInUp 0.3s ease', 10);
        });
        playSound('click');
    });

    document.getElementById('ctx-next-wallpaper')?.addEventListener('click', () => {
        document.getElementById('toggle-wallpaper').click();
    });

    document.getElementById('ctx-open-terminal')?.addEventListener('click', () => openWindow('cmd'));
    document.getElementById('ctx-open-vscode')?.addEventListener('click', () => openWindow('vscode'));
    document.getElementById('ctx-personalize')?.addEventListener('click', () => openWindow('settings'));
    document.getElementById('ctx-about-os')?.addEventListener('click', () => openWindow('this-pc'));

    // ==========================================================================
    // 9. VS CODE CODE VIEWER
    // ==========================================================================
    const loadVsCodeContent = (fileName) => {
        const display = document.getElementById('vscode-code-display');
        if (!display) return;

        if (fileName === 'index.html') {
            display.textContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Bhavy | Windows 10 Portfolio OS</title>
</head>
<body>
    <div id="desktop-shell">
        <!-- Windows 10 Desktop Components -->
    </div>
</body>
</html>`;
        } else if (fileName === 'style.css') {
            display.textContent = `:root {
    --win-accent: ${state.accentColor};
    --win-window-bg: #1f1f23;
}
/* Authentic Windows 10 Glassmorphic Styling */`;
        } else if (fileName === 'script.js') {
            display.textContent = `// Windows 10 Portfolio OS Core Logic
const openWindow = (windowId) => { ... };
const focusWindow = (windowId) => { ... };`;
        } else {
            display.textContent = `{
  "name": "windows10-portfolio-os",
  "version": "1.0.0",
  "author": "Bhavy"
}`;
        }
    };

    document.querySelectorAll('.vscode-file-tree li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.vscode-file-tree li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const fileName = item.dataset.file;
            document.getElementById('vscode-tabs').innerHTML = `<div class="vscode-tab active">${item.innerHTML}</div>`;
            loadVsCodeContent(fileName);
        });
    });

    // ==========================================================================
    // 10. WINDOWS SETTINGS (COLOR PICKER & WALLPAPER)
    // ==========================================================================
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            const color = swatch.dataset.color;
            state.accentColor = color;
            document.documentElement.style.setProperty('--win-accent', color);
            playSound('click');
        });
    });

    document.querySelectorAll('.wallpaper-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            document.querySelectorAll('.wallpaper-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            const bg = thumb.dataset.bg;
            document.getElementById('desktop-wallpaper').style.backgroundImage = `url('${bg}')`;
            playSound('click');
        });
    });

    // ==========================================================================
    // 11. CALCULATOR ENGINE
    // ==========================================================================
    const calcDisplay = document.getElementById('calc-display');
    let calcExpression = '';

    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const txt = btn.textContent;

            if (txt === 'C') {
                calcExpression = '';
                calcDisplay.textContent = '0';
            } else if (txt === '⌫') {
                calcExpression = calcExpression.slice(0, -1);
                calcDisplay.textContent = calcExpression || '0';
            } else if (txt === '=') {
                try {
                    let sanitized = calcExpression.replace(/÷/g, '/').replace(/×/g, '*');
                    let result = eval(sanitized);
                    calcDisplay.textContent = result;
                    calcExpression = String(result);
                } catch (err) {
                    calcDisplay.textContent = 'Error';
                    calcExpression = '';
                }
            } else {
                if (calcDisplay.textContent === '0' && txt !== '.') {
                    calcExpression = txt;
                } else {
                    calcExpression += txt;
                }
                calcDisplay.textContent = calcExpression;
            }
            playSound('click');
        });
    });

    // ==========================================================================
    // 12. PAINT SKETCH ENGINE
    // ==========================================================================
    let paintCanvas, paintCtx, isDrawing = false;

    const initPaintCanvas = () => {
        paintCanvas = document.getElementById('paint-canvas');
        if (!paintCanvas) return;
        paintCtx = paintCanvas.getContext('2d');

        paintCanvas.width = paintCanvas.parentElement.clientWidth;
        paintCanvas.height = paintCanvas.parentElement.clientHeight;

        paintCtx.fillStyle = '#ffffff';
        paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);

        paintCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            paintCtx.beginPath();
            paintCtx.moveTo(e.offsetX, e.offsetY);
        });

        paintCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            paintCtx.lineTo(e.offsetX, e.offsetY);
            paintCtx.strokeStyle = document.getElementById('paint-color').value;
            paintCtx.lineWidth = document.getElementById('paint-size').value;
            paintCtx.lineCap = 'round';
            paintCtx.stroke();
        });

        paintCanvas.addEventListener('mouseup', () => isDrawing = false);
        paintCanvas.addEventListener('mouseleave', () => isDrawing = false);
    };

    document.getElementById('paint-clear')?.addEventListener('click', () => {
        if (paintCtx && paintCanvas) {
            paintCtx.fillStyle = '#ffffff';
            paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
        }
    });

    // ==========================================================================
    // 13. COMMAND PROMPT ENGINE
    // ==========================================================================
    const cmdInputField = document.getElementById('cmd-input-field');
    const cmdOutput = document.getElementById('cmd-output');
    const cmdBody = document.getElementById('cmd-body-container');

    const appendCmdText = (htmlContent) => {
        const div = document.createElement('div');
        div.className = 'cmd-text';
        div.innerHTML = htmlContent;
        cmdOutput.appendChild(div);
        cmdBody.scrollTop = cmdBody.scrollHeight;
    };

    cmdInputField?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const input = cmdInputField.value.trim();
            const cmd = input.toLowerCase();

            appendCmdText(`C:\\Users\\Bhavy&gt; ${input}`);
            cmdInputField.value = '';

            switch (cmd) {
                case 'help':
                    appendCmdText(`
                        <span class="text-gold">Available Commands:</span><br>
                        - <strong>about</strong>: View developer introduction<br>
                        - <strong>projects</strong>: List all portfolio projects<br>
                        - <strong>skills</strong>: Summary of technical stack<br>
                        - <strong>contact</strong>: Get email and social links<br>
                        - <strong>matrix</strong>: Run digital rain matrix simulation<br>
                        - <strong>clear / cls</strong>: Clear terminal screen<br>
                        - <strong>date / time</strong>: Display current timestamp<br>
                        - <strong>whoami</strong>: Display active user role
                    `);
                    break;
                case 'about':
                case 'whoami':
                    appendCmdText(`<span class="text-cyan">Bhavy — Full-Stack Software Engineer & Creative Developer.</span>`);
                    break;
                case 'projects':
                case 'dir':
                    appendCmdText(`
                        [DIR] Windows 10 Portfolio OS<br>
                        [DIR] AI Workspace Assistant<br>
                        [DIR] Real-Time Analytics Dashboard<br>
                        [DIR] Retro Arcade Engine
                    `);
                    break;
                case 'skills':
                    appendCmdText(`JavaScript (95%) | React/Next.js (90%) | HTML/CSS (98%) | Node.js (88%) | Python (85%)`);
                    break;
                case 'contact':
                    appendCmdText(`Email: bhavy@example.com | GitHub: github.com | LinkedIn: linkedin.com`);
                    break;
                case 'clear':
                case 'cls':
                    cmdOutput.innerHTML = '';
                    break;
                case 'date':
                case 'time':
                    appendCmdText(new Date().toString());
                    break;
                case 'matrix':
                    appendCmdText(`<span class="text-green">Wake up, Neo... The Matrix has you. 01000101 01101110 01110100 01100101 01110010</span>`);
                    break;
                case '':
                    break;
                default:
                    appendCmdText(`<span class="text-red">'${input}' is not recognized as an internal command. Type 'help' for assistance.</span>`);
                    break;
            }
        }
    });

    // ==========================================================================
    // 14. MINESWEEPER GAME ENGINE
    // ==========================================================================
    const msGridContainer = document.getElementById('ms-grid-container');
    const msMinesCount = document.getElementById('ms-mines-count');
    const msTimer = document.getElementById('ms-timer');
    const msResetBtn = document.getElementById('ms-reset-btn');

    let msBoard = [];
    let msRows = 9, msCols = 9, msMinesNum = 10;
    let msTimerInterval = null, msSeconds = 0, msGameOver = false;

    const initMinesweeper = () => {
        clearInterval(msTimerInterval);
        msSeconds = 0; msGameOver = false;
        msTimer.textContent = '000';
        msMinesCount.textContent = '010';
        msResetBtn.textContent = '🙂';
        msGridContainer.innerHTML = '';
        msBoard = [];

        for (let r = 0; r < msRows; r++) {
            msBoard[r] = [];
            for (let c = 0; c < msCols; c++) {
                msBoard[r][c] = { mine: false, revealed: false, flagged: false, count: 0 };
            }
        }

        let minesPlaced = 0;
        while (minesPlaced < msMinesNum) {
            let r = Math.floor(Math.random() * msRows);
            let c = Math.floor(Math.random() * msCols);
            if (!msBoard[r][c].mine) {
                msBoard[r][c].mine = true;
                minesPlaced++;
            }
        }

        for (let r = 0; r < msRows; r++) {
            for (let c = 0; c < msCols; c++) {
                if (msBoard[r][c].mine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < msRows && nc >= 0 && nc < msCols && msBoard[nr][nc].mine) {
                            count++;
                        }
                    }
                }
                msBoard[r][c].count = count;
            }
        }

        for (let r = 0; r < msRows; r++) {
            for (let c = 0; c < msCols; c++) {
                const cell = document.createElement('div');
                cell.className = 'ms-cell';
                cell.addEventListener('click', () => revealCell(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    flagCell(r, c);
                });
                msGridContainer.appendChild(cell);
            }
        }
    };

    const startMsTimer = () => {
        if (!msTimerInterval && !msGameOver) {
            msTimerInterval = setInterval(() => {
                msSeconds++;
                msTimer.textContent = String(msSeconds).padStart(3, '0');
            }, 1000);
        }
    };

    const revealCell = (r, c) => {
        if (msGameOver || msBoard[r][c].flagged || msBoard[r][c].revealed) return;
        startMsTimer();

        msBoard[r][c].revealed = true;
        const cell = msGridContainer.children[r * msCols + c];
        cell.classList.add('revealed');

        if (msBoard[r][c].mine) {
            msGameOver = true;
            clearInterval(msTimerInterval);
            cell.classList.add('mine');
            cell.textContent = '💣';
            msResetBtn.textContent = '😵';

            for (let i = 0; i < msRows; i++) {
                for (let j = 0; j < msCols; j++) {
                    if (msBoard[i][j].mine) {
                        const mCell = msGridContainer.children[i * msCols + j];
                        mCell.classList.add('revealed', 'mine');
                        mCell.textContent = '💣';
                    }
                }
            }
            return;
        }

        if (msBoard[r][c].count > 0) {
            cell.textContent = msBoard[r][c].count;
            const colors = ['', '#0000ff', '#007b00', '#ff0000', '#00007b', '#7b0000', '#007b7b', '#000000', '#7b7b7b'];
            cell.style.color = colors[msBoard[r][c].count];
        } else {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < msRows && nc >= 0 && nc < msCols) {
                        revealCell(nr, nc);
                    }
                }
            }
        }
    };

    const flagCell = (r, c) => {
        if (msGameOver || msBoard[r][c].revealed) return;
        msBoard[r][c].flagged = !msBoard[r][c].flagged;
        const cell = msGridContainer.children[r * msCols + c];
        cell.classList.toggle('flagged', msBoard[r][c].flagged);
    };

    msResetBtn?.addEventListener('click', initMinesweeper);
    initMinesweeper();

    // Recycle Bin Interactions
    document.getElementById('empty-bin-btn')?.addEventListener('click', () => {
        const binArea = document.getElementById('bin-content-area');
        binArea.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">Recycle Bin is empty</div>`;
        playSound('bin');
    });

    document.getElementById('restore-bin-btn')?.addEventListener('click', () => location.reload());

    // Project Explorer Categories
    const projectCards = document.querySelectorAll('.project-item-card');
    document.querySelectorAll('.explorer-sidebar .sidebar-menu li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.explorer-sidebar .sidebar-menu li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const filter = item.dataset.filter;
            projectCards.forEach(card => {
                card.style.display = (filter === 'all' || card.dataset.category === filter) ? 'block' : 'none';
            });
        });
    });

    // Mail Send Demo
    document.getElementById('send-mail-btn')?.addEventListener('click', () => {
        const name = document.getElementById('sender-name').value;
        if (name) {
            alert(`Thank you ${name}! Your message has been sent to Bhavy.`);
            closeWindow('contact');
        } else {
            alert('Please enter your name before sending.');
        }
    });

});
