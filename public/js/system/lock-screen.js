import { playSound } from '../core/audio.js';
import { showToast } from '../core/notifications.js';

export function initLockScreen() {
    const lockScreen = document.getElementById('lock-screen');
    if (!lockScreen) return;

    // A tiny classic-script fallback initializes before the module graph so the
    // visitor can never be stranded. Do not register duplicate handlers when it
    // has already taken ownership of the lock screen.
    if (window.__PORTFOLIO_OS_LOCKSCREEN_FALLBACK__) return;

    const showSignInStage = () => {
        if (!lockScreen.classList.contains('sign-in-mode')) {
            lockScreen.classList.add('sign-in-mode');
            playSound('click');
        }
    };

    const unlockOS = () => {
        if (!lockScreen.classList.contains('sign-in-mode')) {
            showSignInStage();
            return;
        }
        if (!lockScreen.classList.contains('unlocked')) {
            lockScreen.classList.add('unlocked');
            playSound('startup');
            setTimeout(() => {
                lockScreen.style.display = 'none';
                showToast('Welcome Back, Bhavy!', 'Your Windows Portfolio OS is ready. Explore desktop icons, apps, and tools!', 'fa-solid fa-laptop-code', 'Windows OS');
            }, 700);
        }
    };

    const lockOS = () => {
        lockScreen.style.display = 'flex';
        void lockScreen.offsetWidth;
        lockScreen.classList.remove('unlocked', 'sign-in-mode');
        showToast('Screen Locked', 'Press any key or click to sign in.', 'fa-solid fa-lock', 'System');
    };

    window.lockOS = lockOS;
    window.unlockOS = unlockOS;

    lockScreen.addEventListener('click', () => {
        if (!lockScreen.classList.contains('sign-in-mode')) {
            showSignInStage();
        }
    });

    document.getElementById('unlock-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        unlockOS();
    });

    document.addEventListener('keydown', (e) => {
        if (!lockScreen.classList.contains('unlocked')) {
            if (!lockScreen.classList.contains('sign-in-mode')) {
                showSignInStage();
            } else if (e.key === 'Enter') {
                unlockOS();
            }
        }
    });
}
