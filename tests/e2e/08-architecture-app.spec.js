const { test, expect } = require('@playwright/test');

test.describe('8. System Architecture App E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    });

    test('8.1 Launching System Architecture app opens window and displays flow diagram', async ({ page }) => {
        const icon = page.locator('.desktop-icon[data-window="architecture"]');
        await icon.dispatchEvent('dblclick');

        const win = page.locator('#win-architecture');
        await expect(win).toBeVisible();

        // Verify flow chart diagram rendered
        const flowGrid = win.locator('.arch-flow-grid');
        await expect(flowGrid).toBeVisible();

        // Verify nodes
        await expect(win.locator('.node-client')).toBeVisible();
        await expect(win.locator('.node-wm')).toBeVisible();
        await expect(win.locator('.node-api')).toBeVisible();
        await expect(win.locator('.node-db')).toBeVisible();
    });

    test('8.2 Tab navigation switches between Frontend, Backend, and Metrics panes', async ({ page }) => {
        const icon = page.locator('.desktop-icon[data-window="architecture"]');
        await icon.dispatchEvent('dblclick');

        const win = page.locator('#win-architecture');
        await expect(win).toBeVisible();

        // Switch to Frontend Mechanics pane
        const frontendTab = win.locator('.arch-nav-tab[data-pane="pane-arch-frontend"]');
        await frontendTab.click();
        await expect(frontendTab).toHaveClass(/active/);
        await expect(win.locator('#pane-arch-frontend')).not.toHaveClass(/hidden/);
        await expect(win.locator('#pane-arch-overview')).toHaveClass(/hidden/);

        // Switch to Express & Security pane
        const backendTab = win.locator('.arch-nav-tab[data-pane="pane-arch-backend"]');
        await backendTab.click();
        await expect(backendTab).toHaveClass(/active/);
        await expect(win.locator('#pane-arch-backend')).not.toHaveClass(/hidden/);

        // Switch to Metrics & Quality pane
        const metricsTab = win.locator('.arch-nav-tab[data-pane="pane-arch-metrics"]');
        await metricsTab.click();
        await expect(metricsTab).toHaveClass(/active/);
        await expect(win.locator('#pane-arch-metrics')).not.toHaveClass(/hidden/);
    });

    test('8.3 Closing System Architecture window removes it from DOM state', async ({ page }) => {
        const icon = page.locator('.desktop-icon[data-window="architecture"]');
        await icon.dispatchEvent('dblclick');

        const win = page.locator('#win-architecture');
        await expect(win).toBeVisible();

        await win.locator('.close-btn').click();
        await expect(win).not.toBeVisible();
    });
});
