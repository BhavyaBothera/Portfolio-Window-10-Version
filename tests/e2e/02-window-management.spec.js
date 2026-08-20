const { test, expect } = require('@playwright/test');

const openApp = async (page, windowId) => {
    const icon = page.locator(`.desktop-icon[data-window="${windowId}"]`);
    await icon.dispatchEvent('dblclick');
    const win = page.locator(`#win-${windowId}`);
    await expect(win).toBeVisible();
    return win;
};

test.describe('2. Window Management E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    });

    test('2.1 Double-clicking This PC icon opens window', async ({ page }) => {
        const win = await openApp(page, 'this-pc');
        await expect(win.locator('.win-title')).toContainText('This PC');
    });

    test('2.2 Double-clicking Control Panel icon opens Skills window', async ({ page }) => {
        await openApp(page, 'skills');
    });

    test('2.3 Double-clicking Calculator icon opens Calculator app', async ({ page }) => {
        const win = await openApp(page, 'calculator');
        await expect(win.locator('.calc-display')).toHaveText('0');
    });

    test('2.4 Minimize button hides active window', async ({ page }) => {
        const win = await openApp(page, 'this-pc');
        await win.locator('.min-btn').click();
        await expect(win).toHaveClass(/minimized/);
    });

    test('2.5 Maximize button expands window full-screen', async ({ page }) => {
        const win = await openApp(page, 'this-pc');
        await win.locator('.max-btn').click();
        await expect(win).toHaveClass(/maximized/);
    });

    test('2.6 Restore button returns window to normal dimensions', async ({ page }) => {
        const win = await openApp(page, 'this-pc');
        await win.locator('.max-btn').click();
        await expect(win).toHaveClass(/maximized/);

        await win.locator('.max-btn').click();
        await expect(win).not.toHaveClass(/maximized/);
    });

    test('2.7 Close button closes open window', async ({ page }) => {
        const win = await openApp(page, 'this-pc');
        await win.locator('.close-btn').click();
        await expect(win).not.toBeVisible();
    });

    test('2.8 Clicking back window focuses and brings to front', async ({ page }) => {
        const winThisPc = await openApp(page, 'this-pc');
        const winCalc = await openApp(page, 'calculator');
        
        await expect(winCalc).toHaveClass(/active/);
        await winThisPc.locator('.win-titlebar').click();
        await expect(winThisPc).toHaveClass(/active/);
    });
});
