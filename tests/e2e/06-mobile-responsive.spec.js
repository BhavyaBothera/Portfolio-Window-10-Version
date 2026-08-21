const { test, expect } = require('@playwright/test');

test.describe('6. Mobile Responsive & Deliberate Mobile Shell E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    });

    test('6.1 Mobile viewport renders Mobile Navigation Bar', async ({ page }) => {
        // Set mobile viewport width <= 768px
        await page.setViewportSize({ width: 375, height: 812 });
        const navBar = page.locator('#mobile-nav-bar');
        await expect(navBar).toBeVisible();
    });

    test('6.2 Home button opens Mobile App Launcher Grid', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.locator('#mobile-home-btn').click();

        const launcher = page.locator('#mobile-app-launcher');
        await expect(launcher).toBeVisible();

        const tile = launcher.locator('.mobile-tile[data-window="calculator"]');
        await expect(tile).toBeVisible();
    });

    test('6.3 Opening an app from Mobile Launcher displays single window fullscreen', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.locator('#mobile-home-btn').click();

        const tile = page.locator('#mobile-app-launcher .mobile-tile[data-window="calculator"]');
        await tile.click();

        const calcWin = page.locator('#win-calculator');
        await expect(calcWin).toBeVisible();
        await expect(calcWin).toHaveClass(/maximized/);
    });

    test('6.4 Task Switcher button displays open apps overlay', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });

        // Open Calculator via Home launcher
        await page.locator('#mobile-home-btn').click();
        await page.locator('#mobile-app-launcher .mobile-tile[data-window="calculator"]').click();

        // Open Task Switcher
        await page.locator('#mobile-switcher-btn').click();
        const switcher = page.locator('#mobile-task-switcher');
        await expect(switcher).toBeVisible();

        const card = switcher.locator('.mobile-switcher-card');
        await expect(card).toBeVisible();
    });

    test('6.5 Mobile back button closes active window', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });

        await page.locator('#mobile-home-btn').click();
        await page.locator('#mobile-app-launcher .mobile-tile[data-window="calculator"]').click();

        const calcWin = page.locator('#win-calculator');
        await expect(calcWin).toBeVisible();

        // Click Back button
        await page.locator('#mobile-back-btn').click();
        await expect(calcWin).not.toBeVisible();
    });

    test('6.6 Tapping window close button closes active app on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.locator('#mobile-home-btn').click();
        await page.locator('#mobile-app-launcher .mobile-tile[data-window="calculator"]').click();

        const win = page.locator('#win-calculator');
        await win.locator('.close-btn').click();
        await expect(win).not.toBeVisible();
    });
});
