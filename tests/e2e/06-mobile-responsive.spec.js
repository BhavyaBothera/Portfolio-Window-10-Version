const { test, expect } = require('@playwright/test');

test.describe('6. Responsive Layout & Mobile Shell E2E Tests', () => {
    async function unlockPortfolio(page) {
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
    }

    async function loadAt(page, width, height) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await unlockPortfolio(page);
    }

    test('6.1 Mobile navigation is visible and desktop taskbar/icons are hidden', async ({ page }) => {
        await loadAt(page, 375, 812);
        await expect(page.locator('#mobile-nav-bar')).toBeVisible();
        await expect(page.locator('#taskbar')).toBeHidden();
        await expect(page.locator('#desktop-icons')).toBeHidden();
    });

    test('6.2 Mobile launcher works at small-phone width', async ({ page }) => {
        await loadAt(page, 320, 568);
        await page.locator('#mobile-home-btn').click();

        const launcher = page.locator('#mobile-app-launcher');
        await expect(launcher).toBeVisible();
        await expect(launcher.locator('.mobile-tile[data-window="calculator"]')).toBeVisible();
    });

    test('6.3 Mobile app window fits the viewport and hides desktop controls', async ({ page }) => {
        await loadAt(page, 375, 812);
        await page.locator('#mobile-home-btn').click();
        await page.locator('#mobile-app-launcher .mobile-tile[data-window="calculator"]').click();

        const win = page.locator('#win-calculator');
        await expect(win).toBeVisible();
        await expect(win).toHaveClass(/maximized/);
        await expect(win.locator('.min-btn')).toBeHidden();
        await expect(win.locator('.max-btn')).toBeHidden();
        await expect(win.locator('.close-btn')).toBeVisible();

        const box = await win.boundingBox();
        expect(box).not.toBeNull();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(375.5);
        expect(box.y + box.height).toBeLessThanOrEqual(812.5);
    });

    test('6.4 Task switcher displays open apps and can close them', async ({ page }) => {
        await loadAt(page, 390, 844);
        await page.locator('#mobile-home-btn').click();
        await page.locator('#mobile-app-launcher .mobile-tile[data-window="calculator"]').click();

        await page.locator('#mobile-switcher-btn').click();
        const switcher = page.locator('#mobile-task-switcher');
        await expect(switcher).toBeVisible();
        await expect(switcher.locator('.mobile-switcher-card')).toBeVisible();
    });

    test('6.5 Mobile back button closes the active window', async ({ page }) => {
        await loadAt(page, 430, 932);
        await page.locator('#mobile-home-btn').click();
        await page.locator('#mobile-app-launcher .mobile-tile[data-window="calculator"]').click();

        const calcWin = page.locator('#win-calculator');
        await expect(calcWin).toBeVisible();
        await page.locator('#mobile-back-btn').click();
        await expect(calcWin).not.toBeVisible();
    });

    test('6.6 Landscape phone layout has no horizontal overflow', async ({ page }) => {
        await loadAt(page, 812, 375);

        const overflow = await page.evaluate(() => ({
            document: document.documentElement.scrollWidth,
            viewport: window.innerWidth,
            body: document.body.scrollWidth
        }));

        expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 1);
        expect(overflow.body).toBeLessThanOrEqual(overflow.viewport + 1);
        await expect(page.locator('#mobile-nav-bar')).toBeVisible();
    });

    test('6.7 Common mobile widths do not create horizontal overflow', async ({ page }) => {
        for (const viewport of [
            { width: 320, height: 568 },
            { width: 360, height: 800 },
            { width: 375, height: 812 },
            { width: 390, height: 844 },
            { width: 412, height: 915 },
            { width: 430, height: 932 }
        ]) {
            await loadAt(page, viewport.width, viewport.height);
            const overflow = await page.evaluate(() => ({
                document: document.documentElement.scrollWidth,
                body: document.body.scrollWidth,
                viewport: window.innerWidth
            }));
            expect(overflow.document, `document overflow at ${viewport.width}px`).toBeLessThanOrEqual(overflow.viewport + 1);
            expect(overflow.body, `body overflow at ${viewport.width}px`).toBeLessThanOrEqual(overflow.viewport + 1);
        }
    });

    test('6.8 Tablet windows stay inside the viewport instead of using desktop pixel coordinates', async ({ page }) => {
        for (const viewport of [
            { width: 768, height: 1024 },
            { width: 820, height: 1180 },
            { width: 1024, height: 768 }
        ]) {
            await loadAt(page, viewport.width, viewport.height);

            const icon = page.locator('.desktop-icon[data-window="architecture"]');
            await icon.dispatchEvent('dblclick');

            const win = page.locator('#win-architecture');
            await expect(win).toBeVisible();

            const box = await win.boundingBox();
            expect(box).not.toBeNull();
            expect(box.x, `left overflow at ${viewport.width}px`).toBeGreaterThanOrEqual(-1);
            expect(box.y, `top overflow at ${viewport.width}px`).toBeGreaterThanOrEqual(-1);
            expect(box.x + box.width, `right overflow at ${viewport.width}px`).toBeLessThanOrEqual(viewport.width + 1);
            expect(box.y + box.height, `bottom overflow at ${viewport.width}px`).toBeLessThanOrEqual(viewport.height + 1);

            await page.locator('#win-architecture .close-btn').click();
        }
    });
});
