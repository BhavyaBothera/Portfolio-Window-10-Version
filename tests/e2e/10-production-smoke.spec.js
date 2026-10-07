const { test, expect } = require('@playwright/test');

test.describe('10. Production Build Smoke Tests', () => {

    async function unlockPortfolio(page) {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    }

    test('10.1 Production build serves critical bootstrap assets', async ({ page }) => {
        expect((await page.request.get('/js/system/boot-failsafe.js')).ok()).toBe(true);
        expect((await page.request.get('/css/fonts.css')).ok()).toBe(true);
        expect((await page.request.get('/js/bundle.min.js')).ok()).toBe(true);
    });

    test('10.2 Production Desktop Shell renders cleanly', async ({ page }) => {
        await unlockPortfolio(page);
        const desktop = page.locator('#desktop-shell');
        await expect(desktop).toBeVisible();

        const taskbar = page.locator('#taskbar');
        await expect(taskbar).toBeVisible();
    });

    test('10.3 Production REST API /api/system/stats returns valid telemetry payload', async ({ request }) => {
        const res = await request.get('/api/system/stats');
        expect(res.status()).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.cpu).toBeDefined();
        expect(json.memory).toBeDefined();
        expect(json.telemetry).toBeDefined();
    });

    test('10.4 Opening app in production build mode operates window controls', async ({ page }) => {
        await unlockPortfolio(page);
        const icon = page.locator('.desktop-icon[data-window="calculator"]');
        await icon.dispatchEvent('dblclick');

        const win = page.locator('#win-calculator');
        await expect(win).toBeVisible();

        // Maximize window
        await win.locator('.max-btn').click();
        await expect(win).toHaveClass(/maximized/);

        // Restore window
        await win.locator('.max-btn').click();
        await expect(win).not.toHaveClass(/maximized/);

        // Close window
        await win.locator('.close-btn').click();
        await expect(win).not.toBeVisible();
    });

    test('10.5 Developer Mode (Ctrl + Shift + D) activates in production build', async ({ page }) => {
        await unlockPortfolio(page);
        const hud = page.locator('#dev-tools-hud');
        await page.keyboard.press('Control+Shift+KeyD');
        await expect(hud).toBeVisible();
        await expect(hud).toContainText('BhavyaOS DevTools');
    });
});
