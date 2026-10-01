/**
 * Portfolio OS boot fail-safe.
 *
 * The normal boot controller is part of the ES module graph. If a later module
 * fails to load, the browser can otherwise leave the boot overlay covering the
 * entire application forever. This small classic script guarantees the shell
 * becomes usable within a few seconds even when optional initialization fails.
 */
(() => {
    const BOOT_TIMEOUT_MS = 4000;
    let fallbackInstalled = false;

    const installFallbackLockScreen = () => {
        if (fallbackInstalled || window.__PORTFOLIO_OS_READY__) return;
        const lockScreen = document.getElementById('lock-screen');
        if (!lockScreen) return;

        fallbackInstalled = true;

        const showSignIn = () => {
            lockScreen.classList.add('sign-in-mode');
        };

        const unlock = () => {
            if (!lockScreen.classList.contains('sign-in-mode')) {
                showSignIn();
                return;
            }

            lockScreen.classList.add('unlocked');
            window.setTimeout(() => {
                lockScreen.style.display = 'none';
            }, 700);
        };

        lockScreen.addEventListener('click', showSignIn);
        document.getElementById('unlock-btn')?.addEventListener('click', (event) => {
            event.stopPropagation();
            unlock();
        });

        document.addEventListener('keydown', (event) => {
            if (lockScreen.classList.contains('unlocked')) return;
            if (!lockScreen.classList.contains('sign-in-mode')) {
                showSignIn();
            } else if (event.key === 'Enter') {
                unlock();
            }
        });
    };

    window.setTimeout(() => {
        const bootScreen = document.getElementById('boot-screen');

        if (bootScreen) {
            bootScreen.classList.add('fade-out');
            window.setTimeout(() => bootScreen.remove(), 850);
        }

        // Normal ES-module initialization has completed; do not install fallback handlers.
        if (window.__PORTFOLIO_OS_READY__) return;

        console.error('[BootFailSafe] Main application initialization did not complete within 4 seconds.');
        installFallbackLockScreen();
    }, BOOT_TIMEOUT_MS);
})();
