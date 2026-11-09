import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';

/**
 * Budgets category search — matching happy paths complementing
 * budget.transport.search.happy.spec.ts (exact name + clear).
 *
 * App behavior relied on (per PR #67 description, BudgetsTab in src/App.jsx): the filter is
 * `cat.toLowerCase().includes(search.toLowerCase())`, i.e. case-insensitive substring match.
 * Math.random is stubbed to 0 (same as the other Transport specs) for deterministic seeding.
 */
test.describe('Budget — category search matching happy path', () => {
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

  test('search is case-insensitive: "transport" keeps the Transport card visible', async () => {
    await budgets.searchCategories('transport');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });

  test('a partial term ("trans") keeps the Transport card visible', async () => {
    await budgets.searchCategories('trans');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportPercent).toHaveText('3%');
  });

  test('searching does not alter the overall budget KPIs', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');
    const spentBefore = await budgets.kpi('Total Spent');

    await budgets.searchCategories('Transport');
    await expect(budgets.transportCard).toBeVisible();

    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore, 2);
    expect(await budgets.kpi('Total Spent')).toBeCloseTo(spentBefore, 2);
  });
});
