const { test, expect } = require('@playwright/test');

const openApp = async (page, windowId) => {
    const icon = page.locator(`.desktop-icon[data-window="${windowId}"]`);
    await icon.dispatchEvent('dblclick');
    const win = page.locator(`#win-${windowId}`);
    await expect(win).toBeVisible();
    return win;
};

test.describe('4. Taskbar & Context Menu E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    });

    test('4.1 Opening app creates active taskbar pill', async ({ page }) => {
        await openApp(page, 'this-pc');
        const pill = page.locator('#taskbar-apps-container .taskbar-app-tile[title="This PC"]');
        await expect(pill).toBeVisible();
        await expect(pill).toHaveClass(/active/);
    });

    test('4.2 Clicking taskbar pill minimizes open window', async ({ page }) => {
        const win = await openApp(page, 'this-pc');
        const pill = page.locator('#taskbar-apps-container .taskbar-app-tile[title="This PC"]');
        await pill.click();
        await expect(win).toHaveClass(/minimized/);
    });

    test('4.3 Clicking taskbar pill of minimized window restores it', async ({ page }) => {
        const win = await openApp(page, 'this-pc');
        const pill = page.locator('#taskbar-apps-container .taskbar-app-tile[title="This PC"]');

        await pill.click(); // Minimize
        await expect(win).toHaveClass(/minimized/);

        await pill.click(); // Restore
        await expect(win).not.toHaveClass(/minimized/);
        await expect(win).toHaveClass(/active/);
    });

    test('4.4 Right-clicking desktop opens context menu at pointer location', async ({ page }) => {
        const desktop = page.locator('#desktop-shell');
        await desktop.click({ button: 'right', position: { x: 300, y: 250 } });

        const contextMenu = page.locator('#context-menu');
        await expect(contextMenu).not.toHaveClass(/hidden/);
        await expect(contextMenu).toHaveCSS('left', '300px');
    });

    test('4.5 Context menu Open Command Prompt launches cmd window', async ({ page }) => {
        await page.locator('#desktop-shell').click({ button: 'right', position: { x: 300, y: 250 } });
        await page.locator('#ctx-open-terminal').click();

        await expect(page.locator('#win-cmd')).toBeVisible();
    });

    test('4.6 Context menu Personalize launches Settings window', async ({ page }) => {
        await page.locator('#desktop-shell').click({ button: 'right', position: { x: 300, y: 250 } });
        await page.locator('#ctx-personalize').click();

        await expect(page.locator('#win-settings')).toBeVisible();
    });

    test('4.7 Context menu Next Wallpaper toggles desktop wallpaper', async ({ page }) => {
        await page.locator('#desktop-shell').click({ button: 'right', position: { x: 300, y: 250 } });
        await page.locator('#ctx-next-wallpaper').click();

        const desktop = page.locator('#desktop-shell');
        await expect(desktop).toBeVisible();
    });

    test('4.8 Context menu closes on outside desktop click', async ({ page }) => {
        await page.locator('#desktop-shell').click({ button: 'right', position: { x: 300, y: 250 } });
        const contextMenu = page.locator('#context-menu');
        await expect(contextMenu).not.toHaveClass(/hidden/);

        await page.locator('#taskbar').click();
        await expect(contextMenu).toHaveClass(/hidden/);
    });
});
