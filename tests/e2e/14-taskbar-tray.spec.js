const { test, expect } = require('@playwright/test');

test.describe('14. Taskbar Tray Controls', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).not.toBeVisible();
    });

    test('14.1 Calendar opens with the current month and working navigation', async ({ page }) => {
        await page.locator('#taskbar-clock').click();
        const calendar = page.locator('#calendar-popover');
        await expect(calendar).toBeVisible();

        const expectedMonth = await page.evaluate(() => new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        }));
        await expect(page.locator('#cal-month-name')).toHaveText(expectedMonth);
        await expect(page.locator('#cal-days-grid .cal-day')).toHaveCount(42);

        await page.locator('#cal-prev-month').click();
        await expect(page.locator('#cal-month-name')).not.toHaveText(expectedMonth);
        await page.locator('#cal-next-month').click();
        await expect(page.locator('#cal-month-name')).toHaveText(expectedMonth);
    });

    test('14.2 Tray controls support keyboard activation and update volume state', async ({ page }) => {
        const volumeButton = page.locator('#tray-volume');
        await expect(volumeButton).toHaveAttribute('role', 'button');
        await volumeButton.focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#volume-popover')).toBeVisible();

        await page.locator('#tray-volume-slider').evaluate(element => {
            element.value = '0';
            element.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await expect(page.locator('#tray-volume-percent')).toHaveText('0%');
        await expect(page.locator('#volume-icon-tray')).toHaveClass(/fa-volume-xmark/);
    });
});
