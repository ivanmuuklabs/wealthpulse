import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Budgets category search + budget edit — negative tests (companion to
 * budget.transport.search.interaction.happy.spec.ts).
 *
 * Math.random is stubbed to 0 (same as the other Transport specs) so Transport seeds as
 * $10.00 against the default $300 budget.
 *
 * App behavior relied on (src/App.jsx, BudgetsTab):
 *  - Cards are filtered with `cat.toLowerCase().includes(search.toLowerCase())` (no trim).
 *  - Total Budget sums all budgets, independent of the search filter.
 *  - `pct = budget ? spent/budget*100 : 0`; remaining = budget - spent ("over" when negative).
 *  - Search state is local to BudgetsTab, so it resets when the tab is left.
 */
test.describe('Budget — category search interaction negative tests', () => {
  let budgets: BudgetsPage;
  let expenses: ExpensesPage;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });

    const factory = new PageFactory(page);
    budgets = factory.budgets();
    expenses = factory.expenses();

    await factory.login().goto();
    await factory.login().loginAsDemo();
    await budgets.navigate();
  });

  test('a non-matching term leaves no budget input to edit and Total Budget unchanged', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.searchCategories('zzzz-no-such-category');

    await expect(budgets.transportCard).toHaveCount(0);
    await expect(budgets.transportBudgetInput).toHaveCount(0);
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore, 2);
  });

  test('a whitespace-only term matches no category (search is not trimmed)', async () => {
    await budgets.searchCategories('   ');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('a term with a trailing space ("Transport ") does not match the Transport card', async () => {
    await budgets.searchCategories('Transport ');

    await expect(budgets.transportCard).toHaveCount(0);
  });

  test('setting the Transport budget to 0 during a search shows over-budget, not a healthy state', async () => {
    await budgets.searchCategories('Transport');
    await expect(budgets.transportCard).toBeVisible();

    await budgets.setTransportBudget('0'); // spent $10.00 vs budget $0.00

    await expect(budgets.transportRemaining).toHaveText('$10.00 over');
    await expect(budgets.transportBar).not.toHaveClass(/\bbg-red-500\b/.source ? /\bbg-emerald-500\b/ : /x/);
  });

  test('the search term is not kept after leaving the Budgets tab and coming back', async () => {
    await budgets.searchCategories('zzzz-no-such-category');
    await expect(budgets.transportCard).toHaveCount(0);

    await expenses.navigate();
    await budgets.navigate();

    await expect(budgets.searchInput).toHaveValue('');
    await expect(budgets.transportCard).toBeVisible();
  });
});
