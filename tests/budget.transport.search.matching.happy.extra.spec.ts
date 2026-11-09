import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';

/**
 * Budgets category search — additional matching happy paths, complementing
 * budget.transport.search.matching.happy.spec.ts ("transport", "trans", KPIs unchanged).
 *
 * App behavior relied on (per PR #69 description, BudgetsTab in src/App.jsx): cards are filtered with
 * `!search || b.cat.toLowerCase().includes(search.toLowerCase())` (case-insensitive substring on
 * the category name). Math.random is stubbed to 0 (same as the other Transport specs) so
 * Transport seeds as $10.00 against the default $300 budget.
 */
test.describe('Budget — category search matching extra happy paths', () => {
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

  test('an upper-case term ("TRANSPORT") keeps the Transport card visible', async () => {
    await budgets.searchCategories('TRANSPORT');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });

  test('a mixed-case term ("tRaNsPoRt") keeps the Transport card visible', async () => {
    await budgets.searchCategories('tRaNsPoRt');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportPercent).toHaveText('3%');
  });

  test('a term from the end of the name ("port") matches anywhere in the name', async () => {
    await budgets.searchCategories('port');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });

  test('refining the term step by step keeps Transport visible, and clearing restores it', async () => {
    for (const term of ['t', 'tr', 'tran', 'transp', 'Transport']) {
      await budgets.searchCategories(term);
      await expect(budgets.transportCard).toBeVisible();
    }

    await budgets.searchCategories('');

    await expect(budgets.transportCard).toBeVisible();
    await expect(budgets.transportBudgetInput).toBeVisible();
  });
});
