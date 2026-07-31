/* ==========================================================================
   WINDOWS 10 DESKTOP PORTFOLIO — SYSTEM LOGIC & WINDOW MANAGER
   Features: Lock Screen, Window Manager, Taskbar, Start Menu, Minesweeper, CMD, Search
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
                // Windows 10 style soft synth chime
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
            console.log('Web Audio API initialized on user interaction.');
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

    window.addEventListener('keydown', (e) => {
        if (!lockScreen.classList.contains('unlocked')) {
            unlockOS();
        }
    });

    // ==========================================================================
    // 3. WINDOW MANAGER (OPEN, CLOSE, MINIMIZE, MAXIMIZE, FOCUS, DRAG)
    // ==========================================================================
    const windowsContainer = document.getElementById('windows-container');
    const taskbarAppsContainer = document.getElementById('taskbar-apps-container');

    const openWindow = (windowId) => {
        const win = document.getElementById(`win-${windowId}`);
        if (!win) return;

        // If window is already open and minimized, restore it
        if (win.classList.contains('minimized')) {
            win.classList.remove('minimized');
        }

        win.classList.remove('hidden');
        state.openWindows.add(windowId);
        focusWindow(windowId);
        updateTaskbarPills();
        playSound('click');
    };

    const focusWindow = (windowId) => {
        const win = document.getElementById(`win-${windowId}`);
        if (!win) return;

        // Remove active class from all windows
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

    // Update Taskbar App Pills
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

    // Make Windows Draggable
    document.querySelectorAll('.win-window').forEach(win => {
        const titlebar = win.querySelector('.win-titlebar');
        const winId = win.dataset.id;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.win-controls')) return; // Don't drag when clicking buttons
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
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        // Window Control Buttons
        win.querySelector('.min-btn')?.addEventListener('click', () => minimizeWindow(winId));
        win.querySelector('.max-btn')?.addEventListener('click', () => toggleMaximizeWindow(winId));
        win.querySelector('.close-btn')?.addEventListener('click', () => closeWindow(winId));

        // Click window to focus
        win.addEventListener('mousedown', () => focusWindow(winId));
    });

    // ==========================================================================
    // 4. DESKTOP SHORTCUTS & SELECTION
    // ==========================================================================
    const desktopIcons = document.querySelectorAll('.desktop-icon');

    desktopIcons.forEach(icon => {
        const winId = icon.dataset.window;

        // Single click selects
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            desktopIcons.forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });

        // Double click opens window
        icon.addEventListener('dblclick', () => {
            openWindow(winId);
        });
    });

    // Deselect desktop icons when clicking desktop wallpaper
    document.getElementById('desktop-wallpaper').addEventListener('click', () => {
        desktopIcons.forEach(i => i.classList.remove('selected'));
        closeStartMenu();
        closeActionCenter();
        closeContextMenu();
        closeSearchPopover();
    });

    // ==========================================================================
    // 5. START MENU & POWER OPTIONS
    // ==========================================================================
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');

    const toggleStartMenu = () => {
        startMenu.classList.toggle('hidden');
        startBtn.classList.toggle('active');
        playSound('click');
    };

    const closeStartMenu = () => {
        startMenu.classList.add('hidden');
        startBtn.classList.remove('active');
    };

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStartMenu();
    });

    // Start Menu Items Click -> Open Window
    document.querySelectorAll('.start-app-item, .start-tile').forEach(item => {
        item.addEventListener('click', () => {
            const winId = item.dataset.window;
            if (winId) {
                openWindow(winId);
                closeStartMenu();
            }
        });
    });

    // Triggers inside "About Me"
    document.querySelector('.open-proj-trigger')?.addEventListener('click', () => openWindow('projects'));
    document.querySelector('.open-contact-trigger')?.addEventListener('click', () => openWindow('contact'));

    // Power Modal
    const powerModal = document.getElementById('power-modal');
    document.getElementById('start-btn-power')?.addEventListener('click', () => {
        powerModal.classList.remove('hidden');
        closeStartMenu();
    });

    document.getElementById('close-power-modal')?.addEventListener('click', () => {
        powerModal.classList.add('hidden');
    });

    document.getElementById('power-lock-btn')?.addEventListener('click', () => {
        powerModal.classList.add('hidden');
        lockScreen.classList.remove('unlocked', 'sign-in-mode');
    });

    document.getElementById('power-restart-btn')?.addEventListener('click', () => {
        location.reload();
    });

    document.getElementById('power-shutdown-btn')?.addEventListener('click', () => {
        document.body.innerHTML = `
            <div style="background:#000; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-family:'Segoe UI', sans-serif;">
                <h1 style="font-size:2.5rem; margin-bottom:15px;"><i class="fa-solid fa-power-off" style="color:#0078d7;"></i> System Shut Down</h1>
                <p style="color:#aaa; margin-bottom:25px;">Windows Portfolio OS has been shut down safely.</p>
                <button onclick="location.reload()" style="background:#0078d7; color:#fff; border:none; padding:10px 25px; border-radius:4px; font-size:1rem; cursor:pointer;">Turn On PC</button>
            </div>
        `;
    });

    // ==========================================================================
    // 6. TASKBAR SEARCH & LIVE FILTER
    // ==========================================================================
    const searchInput = document.getElementById('taskbar-search-input');
    const searchPopover = document.getElementById('search-popover');
    const searchResultsList = document.getElementById('search-results-list');

    const searchableItems = [
        { title: 'About Bhavy (This PC)', icon: 'fa-desktop text-blue', winId: 'this-pc' },
        { title: 'Projects Explorer', icon: 'fa-folder-open text-gold', winId: 'projects' },
        { title: 'Technical Skills (Control Panel)', icon: 'fa-sliders text-cyan', winId: 'skills' },
        { title: 'Experience & Career Timeline', icon: 'fa-briefcase text-purple', winId: 'experience' },
        { title: 'Contact Me (Mail)', icon: 'fa-envelope text-blue', winId: 'contact' },
        { title: 'Resume.pdf Reader', icon: 'fa-file-pdf text-red', winId: 'resume' },
        { title: 'Command Prompt (cmd.exe)', icon: 'fa-terminal text-green', winId: 'cmd' },
        { title: 'Minesweeper Game', icon: 'fa-bomb text-red', winId: 'minesweeper' },
        { title: 'Recycle Bin', icon: 'fa-trash-can text-orange', winId: 'recycle-bin' }
    ];

    const closeSearchPopover = () => {
        searchPopover.classList.add('hidden');
    };

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
    // 7. ACTION CENTER & SYSTEM TRAY
    // ==========================================================================
    const actionCenter = document.getElementById('action-center');
    const trayActionBtn = document.getElementById('tray-action-center');

    const toggleActionCenter = () => {
        actionCenter.classList.toggle('hidden');
    };

    const closeActionCenter = () => {
        actionCenter.classList.add('hidden');
    };

    trayActionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleActionCenter();
    });

    document.getElementById('toggle-wallpaper').addEventListener('click', () => {
        state.currentWallpaperIdx = (state.currentWallpaperIdx + 1) % state.wallpapers.length;
        document.getElementById('desktop-wallpaper').style.backgroundImage = `url('${state.wallpapers[state.currentWallpaperIdx]}')`;
    });

    document.getElementById('toggle-sound').addEventListener('click', (e) => {
        state.soundEnabled = !state.soundEnabled;
        e.currentTarget.classList.toggle('active', state.soundEnabled);
        e.currentTarget.querySelector('span').textContent = `Sound: ${state.soundEnabled ? 'ON' : 'OFF'}`;
    });

    document.getElementById('toggle-fullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    document.getElementById('peek-desktop').addEventListener('click', () => {
        // Minimize all open windows
        document.querySelectorAll('.win-window').forEach(win => {
            win.classList.add('minimized');
        });
        updateTaskbarPills();
    });

    // ==========================================================================
    // 8. DESKTOP CONTEXT MENU (RIGHT CLICK)
    // ==========================================================================
    const contextMenu = document.getElementById('context-menu');

    const closeContextMenu = () => contextMenu.classList.add('hidden');

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const x = Math.min(e.clientX, window.innerWidth - 220);
        const y = Math.min(e.clientY, window.innerHeight - 200);
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');
    });

    document.addEventListener('click', closeContextMenu);

    document.getElementById('ctx-refresh').addEventListener('click', () => {
        desktopIcons.forEach(icon => {
            icon.style.animation = 'none';
            setTimeout(() => icon.style.animation = 'fadeInUp 0.3s ease', 10);
        });
        playSound('click');
    });

    document.getElementById('ctx-next-wallpaper').addEventListener('click', () => {
        document.getElementById('toggle-wallpaper').click();
    });

    document.getElementById('ctx-open-terminal').addEventListener('click', () => {
        openWindow('cmd');
    });

    document.getElementById('ctx-about-os').addEventListener('click', () => {
        openWindow('this-pc');
    });

    // ==========================================================================
    // 9. COMMAND PROMPT (CMD.EXE) INTERACTIVE ENGINE
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
    // 10. MINESWEEPER CLASSIC GAME ENGINE
    // ==========================================================================
    const msGridContainer = document.getElementById('ms-grid-container');
    const msMinesCount = document.getElementById('ms-mines-count');
    const msTimer = document.getElementById('ms-timer');
    const msResetBtn = document.getElementById('ms-reset-btn');

    let msBoard = [];
    let msRows = 9;
    let msCols = 9;
    let msMinesNum = 10;
    let msTimerInterval = null;
    let msSeconds = 0;
    let msGameOver = false;

    const initMinesweeper = () => {
        clearInterval(msTimerInterval);
        msSeconds = 0;
        msGameOver = false;
        msTimer.textContent = '000';
        msMinesCount.textContent = '010';
        msResetBtn.textContent = '🙂';
        msGridContainer.innerHTML = '';
        msBoard = [];

        // Create empty grid
        for (let r = 0; r < msRows; r++) {
            msBoard[r] = [];
            for (let c = 0; c < msCols; c++) {
                msBoard[r][c] = { mine: false, revealed: false, flagged: false, count: 0 };
            }
        }

        // Place mines randomly
        let minesPlaced = 0;
        while (minesPlaced < msMinesNum) {
            let r = Math.floor(Math.random() * msRows);
            let c = Math.floor(Math.random() * msCols);
            if (!msBoard[r][c].mine) {
                msBoard[r][c].mine = true;
                minesPlaced++;
            }
        }

        // Calculate counts
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

        // Render DOM cells
        for (let r = 0; r < msRows; r++) {
            for (let c = 0; c < msCols; c++) {
                const cell = document.createElement('div');
                cell.className = 'ms-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

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
            // Game Over
            msGameOver = true;
            clearInterval(msTimerInterval);
            cell.classList.add('mine');
            cell.textContent = '💣';
            msResetBtn.textContent = '😵';

            // Reveal all mines
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
            // Flood fill blank cells
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

    // ==========================================================================
    // 11. RECYCLE BIN INTERACTION
    // ==========================================================================
    document.getElementById('empty-bin-btn')?.addEventListener('click', () => {
        const binArea = document.getElementById('bin-content-area');
        binArea.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">Recycle Bin is empty</div>`;
        document.querySelector('.icon-bin')?.classList.replace('fa-trash-can', 'fa-trash-can-arrow-up');
        playSound('bin');
    });

    document.getElementById('restore-bin-btn')?.addEventListener('click', () => {
        location.reload();
    });

    // ==========================================================================
    // 12. PROJECT EXPLORER CATEGORY FILTERING
    // ==========================================================================
    const projectCards = document.querySelectorAll('.project-item-card');
    document.querySelectorAll('.explorer-sidebar .sidebar-menu li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.explorer-sidebar .sidebar-menu li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const filter = item.dataset.filter;
            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Contact Form submit demo
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
