/**
 * Windows 10 Portfolio OS — Main Bootstrap Module
 * Clean modular architecture using ES Modules.
 */

import { initBootScreen } from './system/boot.js';
import { initLockScreen } from './system/lock-screen.js';
import { initTaskbar } from './system/taskbar.js';
import { initStartMenu } from './system/start-menu.js';
import { initSettings } from './system/settings.js';
import { initContextMenu } from './system/context-menu.js';
import { initWindowManager, openWindow, registerAppInitializer } from './core/window-manager.js';
import { playSound } from './core/audio.js';
import { initErrorBoundary } from './utils/error-boundary.js';
import { initMobileShell } from './system/mobile-shell.js';
import { initDevTools } from './system/dev-tools.js';

import { initCalculator } from './apps/calculator.js';
import { initEdgeBrowser } from './apps/edge.js';
import { initCmdTerminal } from './apps/cmd.js';
import { initVsCode } from './apps/vscode.js';
import { initNotepad } from './apps/notepad.js';
import { initPaintCanvas } from './apps/paint.js';
import { initMinesweeper } from './apps/minesweeper.js';
import { initSolitaireGame } from './apps/solitaire.js';
import { initCortana } from './apps/cortana.js';
import { initThisPC } from './apps/thispc.js';
import { initProjectsExplorer } from './apps/projects.js';
import { animateSkillsBars } from './apps/skills.js';
import { initExperienceTimeline } from './apps/experience.js';
import { initContactForm } from './apps/contact.js';
import { initStickyNotes } from './apps/stickynotes.js';
import { initGrooveMusic } from './apps/mediaplayer.js';
import { startTaskManagerUpdates } from './apps/task-manager.js';
import { initArchitectureApp } from './apps/architecture.js';

const bootstrapFailures = [];

function safeInit(name, initializer) {
    try {
        initializer();
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        bootstrapFailures.push({ name, message });
        console.error(`[Bootstrap] ${name} failed:`, error);
        return false;
    }
}

function safeRegisterApp(name, initializer) {
    try {
        registerAppInitializer(name, initializer);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        bootstrapFailures.push({ name: `register:${name}`, message });
        console.error(`[Bootstrap] Failed to register ${name}:`, error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    safeInit('error-boundary', initErrorBoundary);

    // Critical boot + lock-screen controls are initialized first so a failure in
    // a secondary subsystem can never strand the visitor on the lock screen.
    safeInit('boot-screen', initBootScreen);
    safeInit('lock-screen', initLockScreen);

    safeInit('taskbar', initTaskbar);
    safeInit('start-menu', initStartMenu);
    safeInit('settings', initSettings);
    safeInit('context-menu', initContextMenu);
    safeInit('window-manager', initWindowManager);
    safeInit('mobile-shell', initMobileShell);
    safeInit('dev-tools', initDevTools);

    safeRegisterApp('calculator', initCalculator);
    safeRegisterApp('edge', initEdgeBrowser);
    safeRegisterApp('cmd', initCmdTerminal);
    safeRegisterApp('vscode', initVsCode);
    safeRegisterApp('notepad', initNotepad);
    safeRegisterApp('paint', initPaintCanvas);
    safeRegisterApp('minesweeper', initMinesweeper);
    safeRegisterApp('solitaire', initSolitaireGame);
    safeRegisterApp('cortana', initCortana);
    safeRegisterApp('this-pc', initThisPC);
    safeRegisterApp('projects', initProjectsExplorer);
    safeRegisterApp('skills', animateSkillsBars);
    safeRegisterApp('experience', initExperienceTimeline);
    safeRegisterApp('contact', initContactForm);
    safeRegisterApp('stickynotes', initStickyNotes);
    safeRegisterApp('mediaplayer', initGrooveMusic);
    safeRegisterApp('taskmgr', startTaskManagerUpdates);
    safeRegisterApp('architecture', initArchitectureApp);

    safeInit('preloaded-this-pc', () => {
        if (document.getElementById('win-this-pc')) initThisPC();
    });
    safeInit('preloaded-projects', () => {
        if (document.getElementById('win-projects')) initProjectsExplorer();
    });
    safeInit('preloaded-calculator', () => {
        if (document.getElementById('win-calculator')) initCalculator();
    });
    safeInit('preloaded-notepad', () => {
        if (document.getElementById('win-notepad')) initNotepad();
    });

    const desktopIcons = Array.from(document.querySelectorAll('.desktop-icon'));

    document.addEventListener('dblclick', (e) => {
        const icon = e.target.closest('.desktop-icon');
        if (icon) {
            const winId = icon.dataset.window;
            if (winId) openWindow(winId);
        }
    });

    document.addEventListener('click', (e) => {
        const icon = e.target.closest('.desktop-icon');
        if (icon) {
            e.stopPropagation();
            desktopIcons.forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
            playSound('click');
            return;
        }
    });

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-window]');
        if (trigger && !trigger.classList.contains('desktop-icon')) {
            const winId = trigger.dataset.window;
            if (winId) openWindow(winId);
        }
    });

    document.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        if (!active || !active.classList.contains('desktop-icon')) return;

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const winId = active.dataset.window;
            if (winId) openWindow(winId);
            return;
        }

        const currentIndex = desktopIcons.indexOf(active);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % desktopIcons.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            nextIndex = (currentIndex - 1 + desktopIcons.length) % desktopIcons.length;
        }

        if (nextIndex !== currentIndex && desktopIcons[nextIndex]) {
            desktopIcons[nextIndex].focus();
            desktopIcons.forEach(i => i.classList.remove('selected'));
            desktopIcons[nextIndex].classList.add('selected');
        }
    });

    document.getElementById('desktop-shell')?.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-icon')) {
            desktopIcons.forEach(i => i.classList.remove('selected'));
        }
    });

    window.__PORTFOLIO_OS_BOOTSTRAP_FAILURES__ = bootstrapFailures;
    window.__PORTFOLIO_OS_READY__ = true;

    console.log('🚀 Windows 10 Portfolio OS ES Module System Initialized',
        bootstrapFailures.length ? bootstrapFailures : 'all bootstrap stages completed');
});
