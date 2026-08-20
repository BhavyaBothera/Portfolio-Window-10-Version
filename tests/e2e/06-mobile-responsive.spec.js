const { test, expect } = require('@playwright/test');

const openMobileApp = async (page, windowId) => {
    const icon = page.locator(`.desktop-icon[data-window="${windowId}"]`);
    await icon.dispatchEvent('dblclick');
    const win = page.locator(`#win-${windowId}`);
    await expect(win).toBeVisible();
    return win;
};

test.describe('6. Mobile Responsive & Touch UI E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    });

    test('6.1 Mobile viewport renders desktop shell cleanly', async ({ page }) => {
        const desktop = page.locator('#desktop-shell');
        await expect(desktop).toBeVisible();

        const taskbar = page.locator('#taskbar');
        await expect(taskbar).toBeVisible();
    });

    test('6.2 Tapping app icon opens window on mobile view', async ({ page }) => {
        const win = await openMobileApp(page, 'this-pc');
        await expect(win).toBeVisible();
    });

    test('6.3 Mobile task-switcher bar displays running app pills', async ({ page }) => {
        await openMobileApp(page, 'skills');
        const pill = page.locator('#taskbar-apps-container .taskbar-app-tile[title="Skills"]');
        await expect(pill).toBeVisible();
    });

    test('6.4 Tapping mobile task-switcher pill switches active app', async ({ page }) => {
        await openMobileApp(page, 'skills');
        await openMobileApp(page, 'calculator');

        const skillsPill = page.locator('#taskbar-apps-container .taskbar-app-tile[title="Skills"]');
        await skillsPill.click();

        const skillsWin = page.locator('#win-skills');
        await expect(skillsWin).toHaveClass(/active/);
    });

    test('6.5 Tapping window close button closes window on mobile', async ({ page }) => {
        const win = await openMobileApp(page, 'calculator');
        await win.locator('.close-btn').click();
        await expect(win).not.toBeVisible();
    });

    test('6.6 Start button opens Start menu on mobile view', async ({ page }) => {
        await page.locator('#start-btn').click();
        const startMenu = page.locator('#start-menu');
        await expect(startMenu).not.toHaveClass(/hidden/);
    });
});
