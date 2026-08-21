import { state } from './state.js';
import { playSound } from './audio.js';
import { showToast } from './notifications.js';
import { updateTaskbarPills } from '../system/taskbar.js';

/**
 * ============================================================================
 * BROWSER-BASED WINDOW MANAGEMENT SYSTEM (ARCHITECTURAL ENGINE)
 * ============================================================================
 * Architecture Overview:
 * WindowManager
 * │
 * ├── WindowRegistry       (Template instantiation & App Initializers)
 * ├── ZIndexManager        (Stacking counter & Integer overflow protection)
 * ├── FocusManager         (Focus entering, Shift-Tab cycling & restoration)
 * ├── DragController       (Hardware-accelerated titlebar drag & rAF throttling)
 * ├── ResizeController     (8-axis resizing & min dimensions constraints)
 * ├── SnapController       (Aero Snap preview box & window geometry snap)
 * ├── MobileAdaptation     (Viewport detection <= 768px & touch adapters)
 * └── LifecycleManager     (Open, Close, Minimize, Maximize, Restore & Cleanup)
 */

// ----------------------------------------------------------------------------
// 1. WINDOW REGISTRY (LAZY TEMPLATE ENGINE)
// ----------------------------------------------------------------------------
export const WindowRegistry = {
    initializers: new Map(),

    registerInitializer(windowId, fn) {
        this.initializers.set(windowId, fn);
    },

    triggerInit(windowId) {
        if (this.initializers.has(windowId)) {
            const initFn = this.initializers.get(windowId);
            if (typeof initFn === 'function') {
                try {
                    initFn();
                } catch (err) {
                    console.error(`[WindowRegistry] Error initializing '${windowId}':`, err);
                }
            }
        }
    },

    getOrInstantiate(windowId) {
        let winEl = document.getElementById(`win-${windowId}`);
        if (!winEl) {
            const tpl = document.getElementById(`tpl-win-${windowId}`);
            if (tpl && tpl.content) {
                const container = document.getElementById('windows-container');
                if (container) {
                    container.appendChild(tpl.content.cloneNode(true));
                    winEl = document.getElementById(`win-${windowId}`);
                    if (winEl) {
                        attachWindowEvents(winEl);
                        this.triggerInit(windowId);
                    }
                }
            }
        }
        return winEl;
    }
};

// ----------------------------------------------------------------------------
// 2. Z-INDEX MANAGER (STACKING LAYERING & OVERFLOW GUARD)
// ----------------------------------------------------------------------------
export const ZIndexManager = {
    bringToFront(winEl) {
        if (!winEl) return;
        state.zIndexCounter++;
        winEl.style.zIndex = state.zIndexCounter;

        // Normalize z-index stack if counter reaches threshold to prevent integer overflow
        if (state.zIndexCounter > 10000) {
            this.normalize();
        }
    },

    normalize() {
        const windows = Array.from(document.querySelectorAll('.win-window'))
            .filter(w => !w.classList.contains('hidden'))
            .sort((a, b) => (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0));

        let baseZ = 10;
        windows.forEach(w => {
            w.style.zIndex = baseZ++;
        });
        state.zIndexCounter = baseZ;
    }
};

// ----------------------------------------------------------------------------
// 3. FOCUS MANAGER (ACCESSIBILITY & FOCUS TRAPPING)
// ----------------------------------------------------------------------------
export const FocusManager = {
    lastFocusedElement: null,

    saveActiveElement() {
        if (document.activeElement && document.activeElement !== document.body) {
            this.lastFocusedElement = document.activeElement;
        }
    },

    restoreFocus() {
        if (this.lastFocusedElement && document.body.contains(this.lastFocusedElement)) {
            try {
                this.lastFocusedElement.focus();
            } catch (e) {}
        }
    },

    focusWindow(windowId) {
        document.querySelectorAll('.win-window').forEach(w => w.classList.remove('active'));
        const winEl = document.getElementById(`win-${windowId}`);
        if (winEl) {
            winEl.classList.add('active');
            state.activeWindow = windowId;
            ZIndexManager.bringToFront(winEl);

            // Focus first interactive element inside window for accessibility
            const focusable = winEl.querySelector('input:not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]');
            if (focusable) {
                try { focusable.focus(); } catch (e) {}
            } else {
                winEl.setAttribute('tabindex', '-1');
                try { winEl.focus(); } catch (e) {}
            }
        }
        updateTaskbarPills();
    },

    trapFocus(e, activeWindowId) {
        if (e.key !== 'Tab' || !activeWindowId) return;
        const activeWinEl = document.getElementById(`win-${activeWindowId}`);
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
};

// ----------------------------------------------------------------------------
// 4. SNAP CONTROLLER (AERO SNAP PREVIEW & SNAP ZONES)
// ----------------------------------------------------------------------------
export const SnapController = {
    previewBox: null,

    getPreviewBox() {
        if (!this.previewBox) {
            this.previewBox = document.getElementById('snap-preview-box');
        }
        return this.previewBox;
    },

    checkPreview(clientX, clientY) {
        const box = this.getPreviewBox();
        if (!box) return;

        const taskbarH = 40;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (clientX <= 15 && clientY <= 15) {
            box.classList.remove('hidden');
            Object.assign(box.style, { left: '0', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
        } else if (clientX >= winW - 15 && clientY <= 15) {
            box.classList.remove('hidden');
            Object.assign(box.style, { left: '50vw', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
        } else if (clientX <= 15 && clientY >= winH - 60) {
            box.classList.remove('hidden');
            Object.assign(box.style, { left: '0', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
        } else if (clientX >= winW - 15 && clientY >= winH - 60) {
            box.classList.remove('hidden');
            Object.assign(box.style, { left: '50vw', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
        } else if (clientX <= 5) {
            box.classList.remove('hidden');
            Object.assign(box.style, { left: '0', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
        } else if (clientX >= winW - 5) {
            box.classList.remove('hidden');
            Object.assign(box.style, { left: '50vw', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
        } else if (clientY <= 3) {
            box.classList.remove('hidden');
            Object.assign(box.style, { left: '0', top: '0', width: '100vw', height: `calc(100vh - ${taskbarH}px)` });
        } else {
            box.classList.add('hidden');
        }
    },

    applySnap(winEl, clientX, clientY, windowId) {
        const taskbarH = 40;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (clientX <= 15 && clientY <= 15) {
            Object.assign(winEl.style, { left: '0', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
        } else if (clientX >= winW - 15 && clientY <= 15) {
            Object.assign(winEl.style, { left: '50vw', top: '0', width: '50vw', height: `calc(50vh - ${taskbarH/2}px)` });
        } else if (clientX <= 15 && clientY >= winH - 60) {
            Object.assign(winEl.style, { left: '0', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
        } else if (clientX >= winW - 15 && clientY >= winH - 60) {
            Object.assign(winEl.style, { left: '50vw', top: '50vh', width: '50vw', height: `calc(50vh - ${taskbarH}px)` });
        } else if (clientX <= 5) {
            Object.assign(winEl.style, { left: '0', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
        } else if (clientX >= winW - 5) {
            Object.assign(winEl.style, { left: '50vw', top: '0', width: '50vw', height: `calc(100vh - ${taskbarH}px)` });
        } else if (clientY <= 3) {
            LifecycleManager.maximize(windowId);
        }

        const box = this.getPreviewBox();
        if (box) box.classList.add('hidden');
    }
};

// ----------------------------------------------------------------------------
// 5. DRAG CONTROLLER (GPU HARDWARE ACCELERATED MOUSE & TOUCH DRAGGING)
// ----------------------------------------------------------------------------
export const DragController = {
    attach(winEl, titlebar, windowId) {
        if (!titlebar) return;
        let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
        let dragFrameId = null;

        const startDrag = (clientX, clientY, target) => {
            if (target.closest('.win-controls')) return;
            if (winEl.classList.contains('maximized')) return;
            isDragging = true;
            dragOffsetX = clientX - winEl.offsetLeft;
            dragOffsetY = clientY - winEl.offsetTop;
            winEl.style.transition = 'none';
            winEl.style.willChange = 'left, top';
            FocusManager.focusWindow(windowId);
        };

        const moveDrag = (clientX, clientY) => {
            if (!isDragging) return;
            const newX = clientX - dragOffsetX;
            const newY = clientY - dragOffsetY;

            if (dragFrameId) cancelAnimationFrame(dragFrameId);
            dragFrameId = requestAnimationFrame(() => {
                winEl.style.left = `${newX}px`;
                winEl.style.top = `${Math.max(0, newY)}px`;
            });

            SnapController.checkPreview(clientX, clientY);
        };

        const endDrag = (clientX, clientY) => {
            if (!isDragging) return;
            isDragging = false;
            winEl.style.transition = '';
            winEl.style.willChange = 'auto';
            SnapController.applySnap(winEl, clientX, clientY, windowId);
        };

        // Mouse Events
        titlebar.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY, e.target));
        document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', (e) => endDrag(e.clientX, e.clientY));

        // Touch Events for Mobile Adaptation
        titlebar.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            if (touch) startDrag(touch.clientX, touch.clientY, e.target);
        }, { passive: true });
        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            if (touch) moveDrag(touch.clientX, touch.clientY);
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            if (touch) endDrag(touch.clientX, touch.clientY);
        });
    }
};

// ----------------------------------------------------------------------------
// 6. RESIZE CONTROLLER (8-AXIS RESIZING CONTROLLER)
// ----------------------------------------------------------------------------
export const ResizeController = {
    attach(winEl, windowId) {
        const handleTypes = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
        handleTypes.forEach(type => {
            const h = document.createElement('div');
            h.className = `win-resize-handle win-resize-${type}`;
            h.dataset.type = type;
            winEl.appendChild(h);

            const startResize = (e, clientX, clientY) => {
                e.stopPropagation();
                if (winEl.classList.contains('maximized')) return;

                let startX = clientX, startY = clientY;
                let startW = winEl.offsetWidth, startH = winEl.offsetHeight;
                let startL = winEl.offsetLeft, startT = winEl.offsetTop;
                FocusManager.focusWindow(windowId);

                const onMove = (meX, meY) => {
                    const dx = meX - startX;
                    const dy = meY - startY;

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

                const onMouseMove = (me) => onMove(me.clientX, me.clientY);
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };

            h.addEventListener('mousedown', (e) => startResize(e, e.clientX, e.clientY));
        });
    }
};

// ----------------------------------------------------------------------------
// 7. MOBILE ADAPTATION CONTROLLER
// ----------------------------------------------------------------------------
export const MobileAdaptation = {
    checkAutoMaximize(winEl) {
        if (window.innerWidth <= 768 && winEl) {
            winEl.classList.add('maximized');
        }
    }
};

// ----------------------------------------------------------------------------
// 8. LIFECYCLE MANAGER (OPEN, CLOSE, MINIMIZE, MAXIMIZE, RESTORE & CLEANUP)
// ----------------------------------------------------------------------------
export const LifecycleManager = {
    open(windowId) {
        const winEl = WindowRegistry.getOrInstantiate(windowId);
        if (!winEl) {
            playSound('error');
            showToast(
                'Application Not Found',
                `The application "${windowId}" is not installed on this system.`,
                'fa-solid fa-circle-exclamation',
                'Windows OS'
            );
            return;
        }

        FocusManager.saveActiveElement();
        winEl.classList.remove('win-closing');

        if (winEl.classList.contains('hidden')) {
            winEl.classList.remove('hidden', 'minimized');
            winEl.classList.add('win-opening');
            winEl.addEventListener('animationend', () => winEl.classList.remove('win-opening'), { once: true });

            ZIndexManager.bringToFront(winEl);
            playSound('open');

            if (!state.openWindows.includes(windowId)) {
                state.openWindows.push(windowId);
            }
            MobileAdaptation.checkAutoMaximize(winEl);
        } else if (winEl.classList.contains('minimized')) {
            winEl.classList.remove('minimized');
            winEl.classList.add('win-opening');
            winEl.addEventListener('animationend', () => winEl.classList.remove('win-opening'), { once: true });

            ZIndexManager.bringToFront(winEl);
            playSound('open');
        } else {
            ZIndexManager.bringToFront(winEl);
        }

        FocusManager.focusWindow(windowId);
        updateTaskbarPills();
    },

    close(windowId) {
        const winEl = document.getElementById(`win-${windowId}`);
        if (!winEl) return;

        winEl.classList.remove('win-opening');
        winEl.classList.add('win-closing');

        const onCloseEnd = () => {
            winEl.classList.add('hidden');
            winEl.classList.remove('win-closing', 'active', 'maximized', 'minimized');
            state.openWindows = state.openWindows.filter(id => id !== windowId);

            if (state.activeWindow === windowId) state.activeWindow = null;

            // Execute registered app cleanup callbacks
            if (state.activeAppCleanups.has(windowId)) {
                const cleanupFn = state.activeAppCleanups.get(windowId);
                if (typeof cleanupFn === 'function') cleanupFn();
                state.activeAppCleanups.delete(windowId);
            }

            updateTaskbarPills();
            FocusManager.restoreFocus();
        };

        winEl.addEventListener('animationend', onCloseEnd, { once: true });
        playSound('close');
    },

    minimize(windowId) {
        const winEl = document.getElementById(`win-${windowId}`);
        if (!winEl) return;
        winEl.classList.add('minimized');
        winEl.classList.remove('active');
        if (state.activeWindow === windowId) state.activeWindow = null;
        playSound('minimize');
        updateTaskbarPills();
    },

    maximize(windowId) {
        const winEl = document.getElementById(`win-${windowId}`);
        if (!winEl) return;
        winEl.classList.toggle('maximized');
        playSound('click');
    }
};

// ----------------------------------------------------------------------------
// PUBLIC BACKWARD-COMPATIBLE API EXPORTS
// ----------------------------------------------------------------------------
export function registerAppInitializer(windowId, fn) {
    WindowRegistry.registerInitializer(windowId, fn);
}

export function openWindow(windowId) {
    LifecycleManager.open(windowId);
}

export function focusWindow(windowId) {
    FocusManager.focusWindow(windowId);
}

export function closeWindow(windowId) {
    LifecycleManager.close(windowId);
}

export function minimizeWindow(windowId) {
    LifecycleManager.minimize(windowId);
}

export function maximizeWindow(windowId) {
    LifecycleManager.maximize(windowId);
}

export function attachWindowEvents(winEl) {
    if (!winEl || winEl.dataset.eventsAttached === 'true') return;
    winEl.dataset.eventsAttached = 'true';
    const windowId = winEl.dataset.id;
    if (!windowId) return;

    // Accessibility ARIA Setup
    winEl.setAttribute('role', 'dialog');
    winEl.setAttribute('aria-modal', 'false');
    const titleText = winEl.querySelector('.win-title')?.textContent?.trim() || windowId;
    winEl.setAttribute('aria-label', titleText);

    // Titlebar Window Controls
    winEl.querySelector('.min-btn')?.addEventListener('click', (e) => { e.stopPropagation(); minimizeWindow(windowId); });
    winEl.querySelector('.max-btn')?.addEventListener('click', (e) => { e.stopPropagation(); maximizeWindow(windowId); });
    winEl.querySelector('.close-btn')?.addEventListener('click', (e) => { e.stopPropagation(); closeWindow(windowId); });

    // Double-click titlebar to toggle maximize
    const titlebar = winEl.querySelector('.win-titlebar');
    titlebar?.addEventListener('dblclick', () => maximizeWindow(windowId));

    // Click anywhere on window to focus
    winEl.addEventListener('mousedown', () => focusWindow(windowId));

    // Attach Sub-System Controllers
    ResizeController.attach(winEl, windowId);
    DragController.attach(winEl, titlebar, windowId);
}

export function initWindowManager() {
    window.openWindow = openWindow;
    window.closeWindow = closeWindow;
    window.minimizeWindow = minimizeWindow;
    window.maximizeWindow = maximizeWindow;

    // Attach controls to all existing pre-rendered windows in DOM
    document.querySelectorAll('.win-window').forEach(winEl => attachWindowEvents(winEl));

    // Keyboard Shortcuts (Escape closes active window)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.activeWindow) {
            closeWindow(state.activeWindow);
        }
    });

    // Accessibility Tab Key Focus Trapping inside active window
    document.addEventListener('keydown', (e) => {
        if (state.activeWindow) {
            FocusManager.trapFocus(e, state.activeWindow);
        }
    });
}
