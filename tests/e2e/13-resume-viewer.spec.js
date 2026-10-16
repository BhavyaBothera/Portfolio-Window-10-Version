const { test, expect } = require('@playwright/test');

test.describe('13. Resume Viewer', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).not.toBeVisible();
        await page.locator('.desktop-icon[data-window="resume"]').dblclick();
        await expect(page.locator('#win-resume')).toBeVisible();
    });

    test('13.1 Zoom controls adjust the resume preview within bounds', async ({ page }) => {
        const documentPage = page.locator('#pdf-document');
        await page.locator('#zoom-in-pdf').click();
        await expect(documentPage).toHaveAttribute('data-zoom', '1.10');

        await page.locator('#zoom-out-pdf').click();
        await expect(documentPage).toHaveAttribute('data-zoom', '1.00');
    });

    test('13.2 Print action targets the resume and restores page state', async ({ page }) => {
        await page.evaluate(() => {
            window.print = () => { window.__resumePrintCalled = true; };
        });

        await page.locator('#print-resume-btn').click();
        await expect.poll(() => page.evaluate(() => window.__resumePrintCalled === true)).toBe(true);
        await expect(page.locator('body')).toHaveClass(/resume-print-mode/);

        await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
        await expect(page.locator('body')).not.toHaveClass(/resume-print-mode/);
    });
});
