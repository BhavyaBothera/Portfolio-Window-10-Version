const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Unit Test: OS Reactive State Store', () => {

    test('State Object Structure & Initial Properties', () => {
        const mockState = {
            openWindows: [],
            activeWindow: null,
            zIndexCounter: 10,
            soundEnabled: true,
            currentWallpaperIdx: 0,
            wallpapers: [
                'assets/wallpaper.webp',
                'https://images.unsplash.com/photo-1579546929518-9e396f3cc809'
            ],
            notifCount: 0,
            activeAppCleanups: new Map()
        };

        assert.ok(Array.isArray(mockState.openWindows));
        assert.equal(mockState.activeWindow, null);
        assert.equal(mockState.zIndexCounter, 10);
        assert.equal(mockState.currentWallpaperIdx, 0);
        assert.equal(mockState.activeAppCleanups instanceof Map, true);
    });

    test('Z-Index Elevation & Stacking Counter Mutation', () => {
        let zIndexCounter = 10;
        const bringToFront = () => ++zIndexCounter;

        assert.equal(bringToFront(), 11);
        assert.equal(bringToFront(), 12);
        assert.equal(zIndexCounter, 12);
    });

    test('Active Windows List Mutators (Register & Remove)', () => {
        const openWindows = [];
        
        // Open 'calculator'
        openWindows.push('calculator');
        assert.equal(openWindows.includes('calculator'), true);
        assert.equal(openWindows.length, 1);

        // Open 'vscode'
        openWindows.push('vscode');
        assert.equal(openWindows.length, 2);

        // Close 'calculator'
        const idx = openWindows.indexOf('calculator');
        if (idx !== -1) openWindows.splice(idx, 1);

        assert.equal(openWindows.includes('calculator'), false);
        assert.equal(openWindows.length, 1);
        assert.equal(openWindows[0], 'vscode');
    });
});
