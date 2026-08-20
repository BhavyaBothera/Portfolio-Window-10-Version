import { state } from './state.js';
import { playSound } from './audio.js';
import { updateTaskbarPills } from '../system/taskbar.js';

let lastFocusedElement = null;

const appInitializers = new Map();

export function registerAppInitializer(windowId, fn) {
    appInitializers.set(windowId, fn);
}

function triggerAppInit(windowId) {
    if (appInitializers.has(windowId)) {
        const initFn = appInitializers.get(windowId);
        if (typeof initFn === 'function') {
            try {
                initFn();
            } catch (err) {
                console.error(`Error initializing app '${windowId}':`, err);
            }
        }
    }
}

export function openWindow(windowId) {
    let winEl = document.getElementById(`win-${windowId}`);

    // Lazy Template Instantiation if element is not in DOM
    if (!winEl) {
        const tpl = document.getElementById(`tpl-win-${windowId}`);
        if (tpl && tpl.content) {
            const container = document.getElementById('windows-container');
            if (container) {
                container.appendChild(tpl.content.cloneNode(true));
                winEl = document.getElementById(`win-${windowId}`);
                if (winEl) {
                    attachWindowEvents(winEl);
                    triggerAppInit(windowId);
                }
            }
        }
    }

    if (!winEl) return;

    if (document.activeElement && document.activeElement !== document.body) {
        lastFocusedElement = document.activeElement;
    }

    winEl.classList.remove('win-closing');

    if (winEl.classList.contains('hidden')) {
        winEl.classList.remove('hidden');
        winEl.classList.remove('minimized');
        winEl.classList.add('win-opening');
        winEl.addEventListener('animationend', () => winEl.classList.remove('win-opening'), { once: true });

        state.zIndexCounter++;
        winEl.style.zIndex = state.zIndexCounter;
        playSound('open');

        if (!state.openWindows.includes(windowId)) {
            state.openWindows.push(windowId);
        }

        // Mobile auto-fullscreen for small screens <= 768px
        if (window.innerWidth <= 768) {
            winEl.classList.add('maximized');
        }
    } else if (winEl.classList.contains('minimized')) {
        winEl.classList.remove('minimized');
        winEl.classList.add('win-opening');
        winEl.addEventListener('animationend', () => winEl.classList.remove('win-opening'), { once: true });

        state.zIndexCounter++;
        winEl.style.zIndex = state.zIndexCounter;
        playSound('open');
    } else {
        // Already open, focus window
        state.zIndexCounter++;
        winEl.style.zIndex = state.zIndexCounter;
    }

    focusWindow(windowId);
    updateTaskbarPills();
}

export function focusWindow(windowId) {
    document.querySelectorAll('.win-window').forEach(w => w.classList.remove('active'));
    const winEl = document.getElementById(`win-${windowId}`);
    if (winEl) {
        winEl.classList.add('active');
        state.activeWindow = windowId;
        state.zIndexCounter++;
        winEl.style.zIndex = state.zIndexCounter;

        // Focus first focusable element inside the window for accessibility
        const focusable = winEl.querySelector('input:not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]');
        if (focusable) {
            focusable.focus();
        } else {
            winEl.setAttribute('tabindex', '-1');
            winEl.focus();
        }
    }
    updateTaskbarPills();
}

export function closeWindow(windowId) {
    const winEl = document.getElementById(`win-${windowId}`);
    if (!winEl) return;

    winEl.classList.remove('win-opening');
    winEl.classList.add('win-closing');

    const onCloseEnd = () => {
        winEl.classList.add('hidden');
        winEl.classList.remove('win-closing', 'active', 'maximized', 'minimized');
        state.openWindows = state.openWindows.filter(id => id !== windowId);

        if (state.activeWindow === windowId) state.activeWindow = null;

        // Cleanup registered app resources (intervals, audio, canvas animations)
        if (state.activeAppCleanups.has(windowId)) {
            const cleanupFn = state.activeAppCleanups.get(windowId);
            if (typeof cleanupFn === 'function') cleanupFn();
            state.activeAppCleanups.delete(windowId);
        }

        updateTaskbarPills();

        // Restore focus to element focused before window opened
        if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
            try { lastFocusedElement.focus(); } catch (e) {}
        }
    };

    winEl.addEventListener('animationend', onCloseEnd, { once: true });
    playSound('close');
}

export function minimizeWindow(windowId) {
    const winEl = document.getElementById(`win-${windowId}`);
    if (!winEl) return;
    winEl.classList.add('minimized');
    winEl.classList.remove('active');
    if (state.activeWindow === windowId) state.activeWindow = null;
    playSound('minimize');
    updateTaskbarPills();
}

export function maximizeWindow(windowId) {
    const winEl = document.getElementById(`win-${windowId}`);
    if (!winEl) return;
    winEl.classList.toggle('maximized');
    playSound('click');
}

export function attachWindowEvents(winEl) {
    if (!winEl || winEl.dataset.eventsAttached === 'true') return;
    winEl.dataset.eventsAttached = 'true';
    const windowId = winEl.dataset.id;
    if (!windowId) return;

    // Accessibility attributes
    winEl.setAttribute('role', 'dialog');
    winEl.setAttribute('aria-modal', 'false');
    const titleText = winEl.querySelector('.win-title')?.textContent?.trim() || windowId;
    winEl.setAttribute('aria-label', titleText);

    // Titlebar buttons
    winEl.querySelector('.min-btn')?.addEventListener('click', (e) => { e.stopPropagation(); minimizeWindow(windowId); });
    winEl.querySelector('.max-btn')?.addEventListener('click', (e) => { e.stopPropagation(); maximizeWindow(windowId); });
    winEl.querySelector('.close-btn')?.addEventListener('click', (e) => { e.stopPropagation(); closeWindow(windowId); });

    // Double-click titlebar to maximize
    const titlebar = winEl.querySelector('.win-titlebar');
    titlebar?.addEventListener('dblclick', () => maximizeWindow(windowId));

    // Click anywhere on window to focus
    winEl.addEventListener('mousedown', () => focusWindow(windowId));

    // 8-Axis Resize Handles
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

    // Window Dragging & Aero Snap
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

        const snapPreview = document.getElementById('snap-preview-box');
        if (snapPreview) {
            const taskbarH = 40;
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            if (e.clientX <= 15 && e.clientY <= 15) {
                snapPreview.classList.remove('hidden');
                Object.assign(snapPreview.style, { left: '0', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
            } else if (e.clientX >= winW - 15 && e.clientY <= 15) {
                snapPreview.classList.remove('hidden');
                Object.assign(snapPreview.style, { left: '50vw', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
            } else if (e.clientX <= 15 && e.clientY >= winH - 60) {
                snapPreview.classList.remove('hidden');
                Object.assign(snapPreview.style, { left: '0', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
            } else if (e.clientX >= winW - 15 && e.clientY >= winH - 60) {
                snapPreview.classList.remove('hidden');
                Object.assign(snapPreview.style, { left: '50vw', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
            } else if (e.clientX <= 5) {
                snapPreview.classList.remove('hidden');
                Object.assign(snapPreview.style, { left: '0', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
            } else if (e.clientX >= winW - 5) {
                snapPreview.classList.remove('hidden');
                Object.assign(snapPreview.style, { left: '50vw', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
            } else if (e.clientY <= 3) {
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
            Object.assign(winEl.style, { left: '0', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
        } else if (e.clientX >= winW - 15 && e.clientY <= 15) {
            Object.assign(winEl.style, { left: '50vw', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
        } else if (e.clientX <= 15 && e.clientY >= winH - 60) {
            Object.assign(winEl.style, { left: '0', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
        } else if (e.clientX >= winW - 15 && e.clientY >= winH - 60) {
            Object.assign(winEl.style, { left: '50vw', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
        } else if (e.clientX <= 5) {
            Object.assign(winEl.style, { left: '0', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
        } else if (e.clientX >= winW - 5) {
            Object.assign(winEl.style, { left: '50vw', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
        } else if (e.clientY <= 3) {
            maximizeWindow(windowId);
        }

        const snapPreview = document.getElementById('snap-preview-box');
        if (snapPreview) snapPreview.classList.add('hidden');
    });
}

export function initWindowManager() {
    window.openWindow = openWindow;
    window.closeWindow = closeWindow;
    window.minimizeWindow = minimizeWindow;
    window.maximizeWindow = maximizeWindow;

    // Attach controls to all existing windows in DOM
    document.querySelectorAll('.win-window').forEach(winEl => attachWindowEvents(winEl));

    // Escape key closes active top window
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.activeWindow) {
            closeWindow(state.activeWindow);
        }
    });

    // Tab key focus trapping for active dialog windows
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && state.activeWindow) {
            const activeWinEl = document.getElementById(`win-${state.activeWindow}`);
            if (!activeWinEl || activeWinEl.classList.contains('hidden') || activeWinEl.classList.contains('minimized')) return;

            const focusables = Array.from(activeWinEl.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
            if (focusables.length === 0) return;

            const firstEl = focusables[0];
            const lastEl = focusables[focusables.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstEl || !activeWinEl.contains(document.activeElement)) {
                    e.preventDefault();
                    lastEl.focus();
                }
            } else {
                if (document.activeElement === lastEl || !activeWinEl.contains(document.activeElement)) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        }
    });
}
