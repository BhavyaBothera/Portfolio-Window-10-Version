import { state } from '../core/state.js';

let devToolsActive = false;
let updateIntervalId = null;
let eventIntervalId = null;
let animFrameId = null;

let frameCount = 0;
let lastFpsCheck = 0;
let currentFps = 60;

let longTaskCount = 0;

let eventCount = 0;
let eventsPerSec = 0;

const sampleEvents = () => {
    if (devToolsActive) {
        eventCount++;
    }
};

function startSampling() {
    // 1. FPS Loop
    frameCount = 0;
    lastFpsCheck = performance.now();
    const measureFps = () => {
        if (!devToolsActive) return;
        frameCount++;
        const now = performance.now();
        if (now - lastFpsCheck >= 1000) {
            currentFps = Math.round((frameCount * 1000) / (now - lastFpsCheck));
            frameCount = 0;
            lastFpsCheck = now;
        }
        animFrameId = requestAnimationFrame(measureFps);
    };
    animFrameId = requestAnimationFrame(measureFps);

    // 2. DOM Event Bus Listeners
    eventCount = 0;
    eventsPerSec = 0;
    window.addEventListener('click', sampleEvents, { capture: true, passive: true });
    window.addEventListener('keydown', sampleEvents, { capture: true, passive: true });

    if (!eventIntervalId) {
        eventIntervalId = setInterval(() => {
            if (devToolsActive) {
                eventsPerSec = eventCount;
                eventCount = 0;
            }
        }, 1000);
    }
}

function stopSampling() {
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
    window.removeEventListener('click', sampleEvents, { capture: true });
    window.removeEventListener('keydown', sampleEvents, { capture: true });

    if (eventIntervalId) {
        clearInterval(eventIntervalId);
        eventIntervalId = null;
    }
}

export function initDevTools() {
    // 1. Register Ctrl + Shift + D Shortcut
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
            e.preventDefault();
            toggleDevTools();
        }
    });

    // 2. Register Close Button Click
    const closeBtn = document.getElementById('dev-hud-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toggleDevTools(false);
        });
    }

    // 3. Register Long Tasks Observer if supported
    try {
        if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
            const observer = new PerformanceObserver((list) => {
                if (devToolsActive) {
                    longTaskCount += list.getEntries().length;
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        }
    } catch {
        /* Longtask observer fallback */
    }
}

export function toggleDevTools(forceState) {
    const hud = document.getElementById('dev-tools-hud');
    if (!hud) return;

    if (typeof forceState === 'boolean') {
        devToolsActive = forceState;
    } else {
        devToolsActive = !devToolsActive;
    }

    if (devToolsActive) {
        hud.classList.remove('hidden');
        startSampling();
        refreshDevToolsUI();
        if (!updateIntervalId) {
            updateIntervalId = setInterval(refreshDevToolsUI, 1000);
        }
    } else {
        hud.classList.add('hidden');
        stopSampling();
        if (updateIntervalId) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
        }
    }
}

async function refreshDevToolsUI() {
    if (!devToolsActive) return;

    // Window Manager
    const countEl = document.getElementById('dev-hud-open-count');
    if (countEl) countEl.textContent = String(state.openWindows.length);

    const focusedEl = document.getElementById('dev-hud-focused-win');
    if (focusedEl) focusedEl.textContent = state.activeWindow ? `#win-${state.activeWindow}` : 'Desktop Shell';

    const zIndexEl = document.getElementById('dev-hud-zindex');
    if (zIndexEl) zIndexEl.textContent = String(state.zIndexCounter);

    // Performance
    const fpsEl = document.getElementById('dev-hud-fps');
    if (fpsEl) {
        fpsEl.textContent = `${currentFps} FPS`;
        fpsEl.className = currentFps >= 45 ? 'dev-val text-green' : (currentFps >= 25 ? 'dev-val text-yellow' : 'dev-val text-red');
    }

    const longTasksEl = document.getElementById('dev-hud-long-tasks');
    if (longTasksEl) longTasksEl.textContent = String(longTaskCount);

    const eventRateEl = document.getElementById('dev-hud-event-rate');
    if (eventRateEl) eventRateEl.textContent = `${eventsPerSec} / sec`;

    // State & Storage
    try {
        const stateBytes = new Blob([JSON.stringify(state)]).size;
        const stateKbEl = document.getElementById('dev-hud-state-size');
        if (stateKbEl) stateKbEl.textContent = `${(stateBytes / 1024).toFixed(2)} KB`;

        let storageBytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            storageBytes += (k ? k.length : 0) + (localStorage.getItem(k) || '').length;
        }
        const storageKbEl = document.getElementById('dev-hud-storage-size');
        if (storageKbEl) storageKbEl.textContent = `${(storageBytes / 1024).toFixed(2)} KB`;
    } catch {
        /* Storage measurement catch */
    }

    // Backend Telemetry
    try {
        const res = await fetch('/api/system/stats');
        const json = await res.json();
        if (json.success && json.telemetry) {
            const reqEl = document.getElementById('dev-hud-requests');
            if (reqEl) reqEl.textContent = String(json.telemetry.total_requests || 0);

            const apiLatEl = document.getElementById('dev-hud-api-latency');
            if (apiLatEl) apiLatEl.textContent = `${json.telemetry.avg_api_latency_ms || 0} ms`;

            const dbLatEl = document.getElementById('dev-hud-db-latency');
            if (dbLatEl) dbLatEl.textContent = `${json.telemetry.avg_db_latency_ms || 0} ms`;

            const errRateEl = document.getElementById('dev-hud-error-rate');
            if (errRateEl) errRateEl.textContent = `${json.telemetry.error_rate_percent || 0}%`;
        }
    } catch {
        /* Fetch catch */
    }
}
