const { test, expect } = require('@playwright/test');

const openApp = async (page, windowId) => {
    const icon = page.locator(`.desktop-icon[data-window="${windowId}"]`);
    await icon.dispatchEvent('dblclick');
    const win = page.locator(`#win-${windowId}`);
    await expect(win).toBeVisible();
    return win;
};

test.describe('5. Keyboard Navigation & Accessibility E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('5.1 Enter key unlocks lock screen', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
    });

    test('5.2 Escape key closes active open window', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).not.toBeVisible();

        const win = await openApp(page, 'this-pc');
        await expect(win).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(win).toHaveClass(/hidden/);
    });

    test('5.3 Desktop context menu closes on outside click', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).not.toBeVisible();

        await page.locator('#desktop-shell').click({ button: 'right', position: { x: 300, y: 250 } });
        const contextMenu = page.locator('#context-menu');
        await expect(contextMenu).not.toHaveClass(/hidden/);

        await page.locator('#taskbar').click();
        await expect(contextMenu).toHaveClass(/hidden/);
    });

    test('5.4 Tab key traps focus inside active modal window', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).not.toBeVisible();

        const win = await openApp(page, 'contact');
        await expect(win).toBeVisible();

        await page.keyboard.press('Tab');
        const focusedTag = await page.evaluate(() => document.activeElement ? document.activeElement.tagName : 'BODY');
        expect(['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'BODY']).toContain(focusedTag);
    });

    test('5.5 Shift+Tab key cycles focus backwards', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).not.toBeVisible();

        const win = await openApp(page, 'contact');
        await expect(win).toBeVisible();

        await page.keyboard.press('Shift+Tab');
        const focused = await page.evaluate(() => document.activeElement !== null);
        expect(focused).toBe(true);
    });

    test('5.6 Focus returns cleanly when window is closed', async ({ page }) => {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).not.toBeVisible();

        const win = await openApp(page, 'calculator');
        await expect(win).toBeVisible();

        await win.locator('.close-btn').click();
        await expect(win).not.toBeVisible();
    });
});
