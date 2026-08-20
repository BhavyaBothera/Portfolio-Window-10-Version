import { getItem } from './storage.js';

export const state = {
    openWindows: [],
    activeWindow: null,
    zIndexCounter: 10,
    soundEnabled: getItem('win10-sound') !== '0',
    accentColor: getItem('win10-accent', '#0078d7'),
    currentWallpaperIdx: 0,
    wallpapers: [
        'assets/wallpaper.webp',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80'
    ],
    notifCount: 0,
    tmProcesses: [],
    tmCpuData: new Array(40).fill(5),
    tmRamData: new Array(40).fill(26),
    tmIntervalId: null,
    activeAppCleanups: new Map() // Stores cleanup functions for window apps
};

// Initial theme check
if (getItem('win10-theme') === 'light') {
    document.body.classList.add('light-mode');
}
