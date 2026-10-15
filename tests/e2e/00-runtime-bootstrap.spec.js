const { test, expect } = require('@playwright/test');

test('runtime bootstrap diagnostics expose module startup failures', async ({ page }) => {
    const pageErrors = [];
    const consoleErrors = [];
    const failedRequests = [];

    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', request => {
        failedRequests.push({
            url: request.url(),
            error: request.failure()?.errorText || 'unknown request failure',
        });
    });

    await page.goto('/');
    await page.waitForTimeout(4500);

    const runtime = await page.evaluate(() => ({
        ready: window.__PORTFOLIO_OS_READY__ === true,
        bootstrapFailures: window.__PORTFOLIO_OS_BOOTSTRAP_FAILURES__ || null,
        desktopIconCount: document.querySelectorAll('.desktop-icon').length,
        startButtonHasClickHandlerSignal: document.getElementById('start-btn')?.getAttribute('aria-controls') === 'start-menu',
    }));

    expect(runtime.ready, JSON.stringify({
        runtime,
        pageErrors,
        consoleErrors,
        failedRequests,
    }, null, 2)).toBe(true);
});
