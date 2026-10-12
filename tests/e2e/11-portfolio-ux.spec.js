const { test, expect } = require('@playwright/test');

test.describe('11. Portfolio Discovery & Interaction UX', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const lockScreen = page.locator('#lock-screen');
        await lockScreen.click();
        await page.keyboard.press('Enter');
        await expect(lockScreen).toHaveClass(/unlocked/);
        await expect(lockScreen).not.toBeVisible();
        await page.locator('.desktop-icon[data-window="projects"]').dblclick();
        await expect(page.locator('#win-projects')).toBeVisible();
    });

    test('11.1 Project category and text search filters combine', async ({ page }) => {
        const aiFilter = page.locator('#win-projects .sidebar-menu li[data-filter="ai"]');
        await aiFilter.click();

        const visibleAiCards = page.locator('#win-projects .project-item-card:visible');
        const countBeforeSearch = await visibleAiCards.count();
        expect(countBeforeSearch).toBeGreaterThan(0);

        const firstTitle = (await visibleAiCards.first().locator('h3').textContent()).trim();
        const query = firstTitle.split(/\\s+/)[0];
        await page.locator('#project-search-input').fill(query);

        await expect(page.locator('#win-projects .projects-filter-status')).toContainText('Showing');
        const visibleAfterSearch = page.locator('#win-projects .project-item-card:visible');
        expect(await visibleAfterSearch.count()).toBeGreaterThan(0);
        await expect(visibleAfterSearch.first().locator('h3')).toContainText(new RegExp(query, 'i'));
        await expect(aiFilter).toHaveAttribute('aria-pressed', 'true');
    });

    test('11.2 Search provides a clear empty state and recovers when cleared', async ({ page }) => {
        const search = page.locator('#project-search-input');
        await search.fill('no-project-should-match-this-query-987654');
        await expect(page.locator('#win-projects .projects-empty-state')).toBeVisible();
        await expect(page.locator('#win-projects .projects-filter-status')).toContainText('Showing 0');

        await search.fill('');
        await expect(page.locator('#win-projects .projects-empty-state')).toBeHidden();
        await expect(page.locator('#win-projects .project-item-card:visible').first()).toBeVisible();
    });

    test('11.3 Project filters are keyboard operable', async ({ page }) => {
        const webFilter = page.locator('#win-projects .sidebar-menu li[data-filter="web"]');
        await expect(webFilter).toHaveAttribute('role', 'button');
        await webFilter.focus();
        await page.keyboard.press('Enter');
        await expect(webFilter).toHaveAttribute('aria-pressed', 'true');
        await expect(webFilter).toHaveClass(/active/);
    });
});
