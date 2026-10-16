const { test, expect } = require('@playwright/test');

test.describe('12. Contact Form', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).not.toBeVisible();
        await page.locator('.desktop-icon[data-window="contact"]').dblclick();
        await expect(page.locator('#win-contact')).toBeVisible();
    });

    test('12.1 Clear button resets the form without submitting it', async ({ page }) => {
        await page.locator('#sender-name').fill('Test Visitor');
        await page.locator('#sender-email').fill('visitor@example.com');
        await page.locator('#sender-subject').fill('Test subject');
        await page.locator('#sender-message').fill('Test message');

        await page.locator('#clear-mail-btn').click();

        await expect(page.locator('#sender-name')).toHaveValue('');
        await expect(page.locator('#sender-email')).toHaveValue('');
        await expect(page.locator('#sender-subject')).toHaveValue('');
        await expect(page.locator('#sender-message')).toHaveValue('');
        await expect(page.locator('.toast-notification').filter({ hasText: 'Validation Error' })).toHaveCount(0);
    });

    test('12.2 Valid message is saved and the form resets', async ({ page }) => {
        await page.locator('#sender-name').fill('Playwright Test');
        await page.locator('#sender-email').fill('playwright@example.com');
        await page.locator('#sender-subject').fill('Contact form smoke test');
        await page.locator('#sender-message').fill('Verifying the portfolio contact flow.');

        await page.locator('#send-mail-btn').click();

        const toast = page.locator('.toast-notification').last();
        await expect(toast).toContainText('Message Saved', { timeout: 10000 });
        await expect(toast).toContainText('not emailed automatically');
        await expect(page.locator('#sender-name')).toHaveValue('');
        await expect(page.locator('#sender-email')).toHaveValue('');
        await expect(page.locator('#sender-subject')).toHaveValue('');
        await expect(page.locator('#sender-message')).toHaveValue('');
    });
});
