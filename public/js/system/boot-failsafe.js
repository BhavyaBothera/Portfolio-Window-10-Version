/**
 * Portfolio OS boot fail-safe.
 *
 * This classic script runs before the ES module graph and provides a minimal,
 * idempotent lock-screen controller. It keeps the visitor from being stranded
 * if the main module graph fails to evaluate. The full module implementation
 * takes over only when it successfully initializes.
 */
(() => {
    const BOOT_TIMEOUT_MS = 4000;
    let fallbackInstalled = false;

    const getLockScreen = () => document.getElementById('lock-screen');

    const showSignIn = () => {
        const lockScreen = getLockScreen();
        if (!lockScreen || lockScreen.classList.contains('unlocked')) return;
        lockScreen.classList.add('sign-in-mode');
    };

    const showWelcomeToast = () => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-header"><span>Windows OS</span></div>
            <div class="toast-title">Welcome Back, Bhavy!</div>
            <div class="toast-body">Your Windows Portfolio OS is ready. Explore desktop icons, apps, and tools!</div>
        `;
        container.appendChild(toast);
        window.setTimeout(() => toast.remove(), 5000);
    };

    const unlock = () => {
        const lockScreen = getLockScreen();
        if (!lockScreen) return;

        if (!lockScreen.classList.contains('sign-in-mode')) {
            showSignIn();
            return;
        }

        if (lockScreen.classList.contains('unlocked')) return;

        lockScreen.classList.add('unlocked');
        window.setTimeout(() => {
            lockScreen.style.display = 'none';
            showWelcomeToast();
        }, 700);
    };

    const installFallbackLockScreen = () => {
        if (fallbackInstalled) return;
        const lockScreen = getLockScreen();
        if (!lockScreen) return;

        fallbackInstalled = true;
        window.__PORTFOLIO_OS_LOCKSCREEN_FALLBACK__ = true;
        window.unlockOS = unlock;
        window.lockOS = () => {
            lockScreen.style.display = 'flex';
            lockScreen.classList.remove('unlocked', 'sign-in-mode');
        };

        lockScreen.addEventListener('click', (event) => {
            if (event.target.closest('#unlock-btn')) return;
            showSignIn();
        });

        document.getElementById('unlock-btn')?.addEventListener('click', (event) => {
            event.stopPropagation();
            unlock();
        });

        document.addEventListener('keydown', (event) => {
            const current = getLockScreen();
            if (!current || current.classList.contains('unlocked')) return;
            if (!current.classList.contains('sign-in-mode')) {
                showSignIn();
            } else if (event.key === 'Enter') {
                unlock();
            }
        });
    };

    // Install immediately so the critical lock-screen interaction is never
    // dependent on the ES module graph finishing evaluation first.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installFallbackLockScreen, { once: true });
    } else {
        installFallbackLockScreen();
    }

    window.setTimeout(() => {
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen) {
            bootScreen.classList.add('fade-out');
            window.setTimeout(() => bootScreen.remove(), 850);
        }

        if (window.__PORTFOLIO_OS_READY__) return;
        console.error('[BootFailSafe] Main application initialization did not complete within 4 seconds.');
        installFallbackLockScreen();
    }, BOOT_TIMEOUT_MS);
})();
