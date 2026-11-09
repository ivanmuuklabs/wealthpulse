import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';

/**
 * Budgets category search — negative tests for the Transport card.
 *
 * Covers the search behavior exercised by PR #66 / BudgetsPage.searchCategories().
 * App behavior relied on (src/App.jsx, BudgetsTab): cards are filtered with
 * `cat.toLowerCase().includes(search.toLowerCase())` (literal substring match on the category
 * name only); the top KPI cards (Total Budget / Total Spent / Remaining) are NOT filtered.
 *
 * Math.random is stubbed to 0 (same as the other Transport specs) for deterministic seeding.
 */
test.describe('Budget — category search negative tests', () => {
  let budgets: BudgetsPage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });

    const factory = new PageFactory(page);
    budgets = factory.budgets();

    await factory.login().goto();
    await factory.login().loginAsDemo();
    await budgets.navigate();
  });

  test('searching for a different category name hides the Transport card', async () => {
    await budgets.searchCategories('Food');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('a whitespace-only search does not match any category', async () => {
    // " " is truthy in the filter and no category name contains a space.
    await budgets.searchCategories(' ');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('regex wildcard characters are treated literally and match nothing', async () => {
    await budgets.searchCategories('.*');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('searching by an expense description (not a category name) does not show Transport', async () => {
    // Search matches category names only, not transaction descriptions such as "Uber ride".
    await budgets.searchCategories('Uber');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('a non-matching search does not alter the overall budget KPIs', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');
    const spentBefore = await budgets.kpi('Total Spent');

    await budgets.searchCategories('zzzz-no-such-category');
    await expect(budgets.transportCard).toHaveCount(0);

    // KPIs are computed from all budgets/transactions, not from the filtered cards.
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore, 2);
    expect(await budgets.kpi('Total Spent')).toBeCloseTo(spentBefore, 2);
  });
});
