const { test, expect } = require('@playwright/test');

test.describe('3. Start Menu & Search E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    });

    test('3.1 Clicking Start button toggles Start menu', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        const startMenu = page.locator('#start-menu');

        await expect(startMenu).toHaveClass(/hidden/);
        await startBtn.click();
        await expect(startMenu).not.toHaveClass(/hidden/);

        await startBtn.click();
        await expect(startMenu).toHaveClass(/hidden/);
    });

    test('3.2 Clicking desktop background closes open Start menu', async ({ page }) => {
        await page.locator('#start-btn').click();
        const startMenu = page.locator('#start-menu');
        await expect(startMenu).not.toHaveClass(/hidden/);

        await page.locator('#desktop-shell').click({ position: { x: 500, y: 300 } });
        await expect(startMenu).toHaveClass(/hidden/);
    });

    test('3.3 Start menu app list renders interactive items', async ({ page }) => {
        await page.locator('#start-btn').click();
        const startMenu = page.locator('#start-menu');
        await expect(startMenu).not.toHaveClass(/hidden/);

        const calcItem = page.locator('.start-app-item[data-window="calculator"]');
        await expect(calcItem).toBeVisible();
    });

    test('3.4 Launching app from Start menu opens window and closes menu', async ({ page }) => {
        await page.locator('#start-btn').click();
        const startMenu = page.locator('#start-menu');
        await expect(startMenu).not.toHaveClass(/hidden/);

        const item = page.locator('.start-app-item[data-window="vscode"]');
        await item.scrollIntoViewIfNeeded();
        await item.click();
        await expect(startMenu).toHaveClass(/hidden/);
        await expect(page.locator('#win-vscode')).toBeVisible();
    });

    test('3.5 Launching app from Start menu items opens app window', async ({ page }) => {
        await page.locator('#start-btn').click();
        const paintItem = page.locator('.start-app-item[data-window="paint"]');
        await paintItem.click();
        await expect(page.locator('#win-paint')).toBeVisible();
    });

    test('3.6 Start menu user profile button displays developer profile title', async ({ page }) => {
        await page.locator('#start-btn').click();
        const userBtn = page.locator('#start-btn-user');
        await expect(userBtn).toBeVisible();
        await expect(userBtn).toHaveAttribute('title', 'Bhavy Profile');
    });
});
