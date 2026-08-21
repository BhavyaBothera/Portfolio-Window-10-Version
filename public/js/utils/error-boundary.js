import { showToast } from '../core/notifications.js';

const FALLBACK_IMAGE = 'assets/icons/file.png';

export function handleImageError(imgEl) {
    if (!imgEl || imgEl.dataset.fallbackApplied) return;
    imgEl.dataset.fallbackApplied = 'true';
    imgEl.src = FALLBACK_IMAGE;
}

export function initErrorBoundary() {
    // 1. Global JS Runtime Error & Asset Load Error Listener
    window.addEventListener('error', (event) => {
        const target = event.target;
        if (target && (target.tagName === 'IMG' || target.tagName === 'AUDIO')) {
            if (target.tagName === 'IMG') {
                handleImageError(target);
            }
            // Prevent noisy console logs for asset missing failures
            event.preventDefault();
            return;
        }

        const message = event.message || 'An unexpected runtime error occurred.';
        console.error('[Error Boundary] Unhandled Runtime Exception:', event.error || message);

        showToast(
            'System Error',
            `An unexpected error occurred: ${message}`,
            'fa-solid fa-triangle-exclamation',
            'Windows OS'
        );
    }, true);

    // 2. Global Unhandled Promise Rejection Listener
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const msg = (reason && reason.message) ? reason.message : String(reason);
        console.warn('[Error Boundary] Unhandled Promise Rejection:', msg);

        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
            showToast(
                'Network Request Failed',
                'Unable to reach server. Working in offline fallback mode.',
                'fa-solid fa-wifi-slash',
                'Network'
            );
        }

        event.preventDefault();
    });

    // 3. Network Offline / Online State Listener
    window.addEventListener('offline', () => {
        showToast(
            'Network Offline',
            'Internet connection lost. OS apps are operating in offline mode.',
            'fa-solid fa-wifi',
            'System'
        );
    });

    window.addEventListener('online', () => {
        showToast(
            'Network Connected',
            'Internet connection re-established.',
            'fa-solid fa-wifi',
            'System'
        );
    });
}
