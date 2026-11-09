import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Budgets search + budget edit persistence — negative / boundary tests (companion to
 * budget.transport.search.edit.persistence.happy.spec.ts from PR #74).
 *
 * Math.random is stubbed to 0 (same as the other Transport specs) so Transport seeds as
 * $10.00 against the default $300 budget.
 *
 * App behavior relied on (src/App.jsx on main, BudgetsTab):
 *  - The budget input is <input type="number" min="0"> and dispatches SET_BUDGET with `+e.target.value`
 *    (an empty value becomes 0; negatives are not clamped).
 *  - pct = budget ? spent/budget*100 : 0; remaining = budget - spent, rendered as "<amt> over" when negative.
 *  - Budgets live in the global reducer, so they survive tab changes; search state is local to BudgetsTab.
 */
test.describe('Budget — search + edit persistence negative tests', () => {
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

  test('clearing the Transport budget input during a search shows over-budget, not a healthy state', async () => {
    await budgets.searchCategories('Transport');
    await expect(budgets.transportCard).toBeVisible();

    await budgets.setTransportBudget(''); // empty input is coerced to a $0 budget

    await expect(budgets.transportRemaining).toHaveText('$10.00 over');
    await expect(budgets.transportPercent).toHaveText('0%');
  });

  test('a negative Transport budget is never presented as money left', async () => {
    await budgets.searchCategories('Transport');

    await expect(budgets.transportBudgetInput).toHaveAttribute('min', '0');

    await budgets.setTransportBudget('-50');

    await expect(budgets.transportRemaining).toHaveText(/ over$/);
    await expect(budgets.transportRemaining).not.toHaveText(/ left$/);
  });

  test('a budget equal to the seeded spend is not flagged as over-budget', async () => {
    await budgets.searchCategories('Transport');

    await budgets.setTransportBudget('10'); // spent $10.00 of $10.00

    await expect(budgets.transportRemaining).toHaveText('$0.00 left');
    await expect(budgets.transportPercent).toHaveText('100%');
    await expect(budgets.transportBar).not.toHaveClass(/\bbg-red-500\b/);
  });

  test('an over-budget edit made during a search is not reset after leaving and returning to Budgets', async () => {
    await budgets.searchCategories('Transport');
    await budgets.setTransportBudget('5');
    await expect(budgets.transportRemaining).toHaveText('$5.00 over');

    await expenses.navigate();
    await budgets.navigate();

    await expect(budgets.transportBudgetInput).toHaveValue('5');
    await expect(budgets.transportRemaining).toHaveText('$5.00 over');
    await expect(budgets.transportBar).not.toHaveClass(/\bbg-emerald-500\b/);
  });

  test('hiding the edited card with a non-matching search and clearing it does not restore the old budget', async () => {
    await budgets.searchCategories('Transport');
    await budgets.setTransportBudget('5');

    await budgets.searchCategories('zzzz-no-such-category');
    await expect(budgets.transportCard).toHaveCount(0);

    await budgets.searchCategories('');

    await expect(budgets.transportBudgetInput).toHaveValue('5');
    await expect(budgets.transportRemaining).toHaveText('$5.00 over');
    await expect(budgets.transportPercent).toHaveText('200%');
  });
});
