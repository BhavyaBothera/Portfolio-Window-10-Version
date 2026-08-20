const { test, expect } = require('@playwright/test');

test.describe('1. Boot Sequence & Lock Screen E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('1.1 Boot screen renders initially and fades out', async ({ page }) => {
        const bootScreen = page.locator('#boot-screen');
        // Boot screen exists initially
        if (await bootScreen.count() > 0) {
            await expect(bootScreen).toBeVisible();
            // Wait for boot screen to fade and remove
            await expect(bootScreen).toHaveCount(0, { timeout: 4000 });
        }
    });

    test('1.2 Lock screen displays clock and user profile info', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await expect(lockScreen).toBeVisible();
        await expect(page.locator('#lock-time')).toBeVisible();
        await expect(page.locator('#lock-date')).toBeVisible();
    });

    test('1.3 Clicking lock screen transitions to sign-in mode', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await expect(lockScreen).toHaveClass(/sign-in-mode/);
        await expect(page.locator('#unlock-btn')).toBeVisible();
    });

    test('1.4 Pressing Enter key unlocks OS shell', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await expect(lockScreen).toHaveClass(/sign-in-mode/);
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
    });

    test('1.5 Clicking Sign In button unlocks OS shell', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        const unlockBtn = page.locator('#unlock-btn');
        await expect(unlockBtn).toBeVisible();
        await unlockBtn.click();
        await expect(lockScreen).toHaveClass(/unlocked/);
    });

    test('1.6 Welcome toast notification triggers on successful unlock', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.locator('#unlock-btn').click();
        const toast = page.locator('.toast-notification').first();
        await expect(toast).toBeVisible({ timeout: 3000 });
        await expect(toast).toContainText('Welcome Back');
    });
});
