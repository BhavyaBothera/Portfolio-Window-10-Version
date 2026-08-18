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
import { initWindowManager, openWindow } from './core/window-manager.js';
import { playSound } from './core/audio.js';

// Import App Initializers
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

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Core Systems
    initBootScreen();
    initLockScreen();
    initTaskbar();
    initStartMenu();
    initSettings();
    initContextMenu();
    initWindowManager();

    // 2. Initialize App Functionality
    initCalculator();
    initEdgeBrowser();
    initCmdTerminal();
    initVsCode();
    initNotepad();
    initPaintCanvas();
    initMinesweeper();
    initSolitaireGame();
    initCortana();
    initThisPC();
    initProjectsExplorer();
    initExperienceTimeline();
    initContactForm();
    initStickyNotes();
    initGrooveMusic();

    // 3. Desktop Icons Interaction & Accessibility
    const desktopIcons = Array.from(document.querySelectorAll('.desktop-icon'));

    desktopIcons.forEach(icon => {
        const winId = icon.dataset.window;
        if (!winId) return;

        icon.addEventListener('dblclick', () => {
            openWindow(winId);
        });

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            desktopIcons.forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
            playSound('click');
        });
    });

    // Delegated click handler for non-inline data-window triggers (e.g. ribbon, tree, folder cards)
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-window]');
        if (trigger && !trigger.classList.contains('desktop-icon')) {
            const winId = trigger.dataset.window;
            if (winId) openWindow(winId);
        }
    });

    // Keyboard Accessibility for Desktop Icons (Enter, Space, Arrow Navigation)
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

    // Deselect icons when clicking desktop background
    document.getElementById('desktop-shell')?.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-icon')) {
            desktopIcons.forEach(i => i.classList.remove('selected'));
        }
    });

    console.log('🚀 Windows 10 Portfolio OS ES Module System Initialized');
});
