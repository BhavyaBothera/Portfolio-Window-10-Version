const { test, expect } = require('@playwright/test');

test.describe('7. Accessibility & Keyboard Navigation E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    });

    test('7.1 Opening Start Menu sets aria-expanded="true" and moves focus inside', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        await expect(startBtn).toHaveAttribute('aria-expanded', 'false');

        await startBtn.click();
        const startMenu = page.locator('#start-menu');
        await expect(startMenu).not.toHaveClass(/hidden/);
        await expect(startBtn).toHaveAttribute('aria-expanded', 'true');

        // Verify focus moved into search input or Start menu item
        const isFocusedInStart = await page.evaluate(() => {
            const active = document.activeElement;
            return active && (active.id === 'taskbar-search-input' || active.closest('#start-menu') !== null);
        });
        expect(isFocusedInStart).toBe(true);
    });

    test('7.2 Closing Start Menu returns focus to Start button and sets aria-expanded="false"', async ({ page }) => {
        const startBtn = page.locator('#start-btn');
        await startBtn.click();
        await expect(startBtn).toHaveAttribute('aria-expanded', 'true');

        await page.keyboard.press('Escape');
        const startMenu = page.locator('#start-menu');
        await expect(startMenu).toHaveClass(/hidden/);
        await expect(startBtn).toHaveAttribute('aria-expanded', 'false');

        // Verify focus returned to Start button
        const focusedId = await page.evaluate(() => document.activeElement ? document.activeElement.id : '');
        expect(focusedId).toBe('start-btn');
    });

    test('7.3 Opening window moves focus into window', async ({ page }) => {
        const icon = page.locator('.desktop-icon[data-window="calculator"]');
        await icon.dispatchEvent('dblclick');

        const win = page.locator('#win-calculator');
        await expect(win).toBeVisible();

        // Verify focus entered the window
        const isFocusedInWindow = await page.evaluate(() => {
            const active = document.activeElement;
            return active && active.closest('#win-calculator') !== null;
        });
        expect(isFocusedInWindow).toBe(true);
    });

    test('7.4 Closing window returns focus to trigger element', async ({ page }) => {
        const icon = page.locator('.desktop-icon[data-window="calculator"]');
        await icon.focus();
        await page.keyboard.press('Enter');

        const win = page.locator('#win-calculator');
        await expect(win).toBeVisible();

        await win.locator('.close-btn').click();
        await expect(win).not.toBeVisible();

        // Verify focus returned to desktop icon
        const focusedDataWindow = await page.evaluate(() => document.activeElement ? document.activeElement.dataset.window : '');
        expect(focusedDataWindow).toBe('calculator');
    });

    test('7.5 Desktop context menu has role="menu", role="menuitem", and closes on Escape', async ({ page }) => {
        const desktop = page.locator('#desktop-shell');
        await desktop.click({ button: 'right', position: { x: 300, y: 250 } });

        const contextMenu = page.locator('#context-menu');
        await expect(contextMenu).not.toHaveClass(/hidden/);
        await expect(contextMenu).toHaveAttribute('role', 'menu');

        const item = contextMenu.locator('.context-item').first();
        await expect(item).toHaveAttribute('role', 'menuitem');

        await page.keyboard.press('Escape');
        await expect(contextMenu).toHaveClass(/hidden/);
    });

    test('7.6 Taskbar container has role="toolbar" and app pills have role="button" & aria-selected', async ({ page }) => {
        const icon = page.locator('.desktop-icon[data-window="this-pc"]');
        await icon.dispatchEvent('dblclick');

        const taskbarContainer = page.locator('#taskbar-apps-container');
        await expect(taskbarContainer).toHaveAttribute('role', 'toolbar');

        const pill = taskbarContainer.locator('.taskbar-app-tile').first();
        await expect(pill).toHaveAttribute('role', 'button');
        await expect(pill).toHaveAttribute('aria-selected', 'true');
    });

    test('7.7 prefers-reduced-motion CSS block is defined in stylesheet', async ({ page }) => {
        const hasReducedMotionRule = await page.evaluate(() => {
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule.conditionText && rule.conditionText.includes('prefers-reduced-motion')) {
                            return true;
                        }
                    }
                } catch (e) {}
            }
            return false;
        });
        expect(hasReducedMotionRule).toBe(true);
    });
});
