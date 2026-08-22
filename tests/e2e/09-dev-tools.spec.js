const { test, expect } = require('@playwright/test');

test.describe('9. Developer Mode (Ctrl + Shift + D) DevTools HUD E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    });

    test('9.1 DevTools HUD is hidden by default', async ({ page }) => {
        const hud = page.locator('#dev-tools-hud');
        await expect(hud).toHaveClass(/hidden/);
        await expect(hud).not.toBeVisible();
    });

    test('9.2 Pressing Ctrl + Shift + D opens DevTools HUD overlay', async ({ page }) => {
        const hud = page.locator('#dev-tools-hud');
        await page.keyboard.press('Control+Shift+KeyD');
        await expect(hud).not.toHaveClass(/hidden/);
        await expect(hud).toBeVisible();

        const title = page.locator('.dev-hud-title');
        await expect(title).toContainText('BhavyaOS DevTools');
    });

    test('9.3 DevTools HUD displays live Window Manager and performance metrics', async ({ page }) => {
        await page.keyboard.press('Control+Shift+KeyD');
        const hud = page.locator('#dev-tools-hud');
        await expect(hud).toBeVisible();

        // Check Window Manager metric tile
        const openCount = page.locator('#dev-hud-open-count');
        await expect(openCount).toBeVisible();

        // Check FPS metric
        const fpsVal = page.locator('#dev-hud-fps');
        await expect(fpsVal).toBeVisible();
        await expect(fpsVal).toContainText('FPS');

        // Check Server API Requests
        const reqVal = page.locator('#dev-hud-requests');
        await expect(reqVal).toBeVisible();
    });

    test('9.4 Pressing Ctrl + Shift + D again closes DevTools HUD overlay', async ({ page }) => {
        const hud = page.locator('#dev-tools-hud');
        await page.keyboard.press('Control+Shift+KeyD');
        await expect(hud).toBeVisible();

        await page.keyboard.press('Control+Shift+KeyD');
        await expect(hud).not.toBeVisible();
    });

    test('9.5 Clicking close button closes DevTools HUD overlay', async ({ page }) => {
        const hud = page.locator('#dev-tools-hud');
        await page.keyboard.press('Control+Shift+KeyD');
        await expect(hud).toBeVisible();

        await page.locator('#dev-hud-close-btn').click();
        await expect(hud).not.toBeVisible();
    });
});
