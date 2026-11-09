import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';
import { BudgetsPage } from './pages/BudgetsPage';
import { ExpensesPage } from './pages/ExpensesPage';

/**
 * Transport budget — edge cases (P1).
 *
 * Determinism: the app seeds transactions with Math.random(). We stub it to 0 before the app
 * loads, which makes every category generate its minimum number of transactions at its minimum
 * amount. For Transport that is 2 x $5.00 = $10.00 in every month. March is the month selected
 * by default, and the default Transport budget is $300, so:
 *   - adding a $290.00 expense  => spent == budget (100%)
 *   - adding a $260.00 expense  => spent == 90% of budget
 *   - adding a $200.00 expense  => spent == 70% of budget
 */
const SEEDED_TRANSPORT_SPENT = 10;

test.describe('Budget — Transport edge cases', () => {
  let page: import('@playwright/test').Page;
  let budgets: BudgetsPage;
  let expenses: ExpensesPage;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.addInitScript(() => {
      Math.random = () => 0;
    });

    const factory = new PageFactory(page);
    budgets = factory.budgets();
    expenses = factory.expenses();

    await factory.login().goto();
    await factory.login().loginAsDemo();
    await budgets.navigate();

    // Sanity check on the deterministic baseline: $10.00 spent of the default $300.00 budget.
    await expect(budgets.transportRemaining).toHaveText('$290.00 left');
  });

  /** Adds a Transport expense in the selected month and returns to the Budgets tab. */
  async function addTransportExpense(amount: string) {
    await expenses.navigate();
    await expenses.addExpense('Transport', `Edge case ${amount}`, amount);
    await budgets.navigate();
  }

  test('spend exactly equal to the budget shows 100%, $0.00 left and not the over-budget style', async () => {
    const spentBefore = await budgets.kpi('Total Spent');

    await addTransportExpense('290.00'); // 10 + 290 = 300 = budget

    await expect(budgets.transportPercent).toHaveText('100%');
    await expect(budgets.transportRemaining).toHaveText('$0.00 left');
    // At exactly 100% the over-budget state (pct > 100) must NOT be active...
    await expect(budgets.transportBar).not.toHaveClass(/\bbg-red-500\b/);
    // ...but the "> 90%" warning gradient is.
    await expect(budgets.transportBar).toHaveClass(/from-amber-500/);
    await expect(budgets.transportPercent).toHaveClass(/text-amber-400/);
    await expect(budgets.transportBar).toHaveAttribute('style', /width:\s*100%/);

    // KPI cards stay consistent: spent grew by exactly the added amount.
    expect(await budgets.kpi('Total Spent')).toBeCloseTo(spentBefore + 290, 2);
    const budget = await budgets.kpi('Total Budget');
    const spent = await budgets.kpi('Total Spent');
    expect(await budgets.kpi('Remaining')).toBeCloseTo(budget - spent, 2);
  });

  test('spend slightly over the budget shows the over amount, red style and a bar capped at 100%', async () => {
    await addTransportExpense('290.40'); // spent = 300.40 vs budget 300.00

    await expect(budgets.transportRemaining).toHaveText('$0.40 over');
    await expect(budgets.transportBar).toHaveClass(/\bbg-red-500\b/);
    await expect(budgets.transportPercent).toHaveClass(/text-red-400/);
    // Bar width is capped even though the real percentage is above 100.
    await expect(budgets.transportBar).toHaveAttribute('style', /width:\s*100%/);
    // Current behavior: the label is rounded with toFixed(0), so 100.13% is displayed as "100%"
    // while the card is already red. Documented here so a change in rounding is noticed.
    await expect(budgets.transportPercent).toHaveText('100%');
  });

  test('90% threshold: exactly 90% is not in the warning band, just above 90% is', async () => {
    await addTransportExpense('260.00'); // spent = 270 = exactly 90% of 300

    await expect(budgets.transportPercent).toHaveText('90%');
    // pct > 90 is false at exactly 90: plain amber bar (> 70) and green percentage text.
    await expect(budgets.transportBar).toHaveClass(/\bbg-amber-500\b/);
    await expect(budgets.transportBar).not.toHaveClass(/from-amber-500/);
    await expect(budgets.transportPercent).toHaveClass(/text-emerald-400/);

    await addTransportExpense('0.30'); // spent = 270.30 => 90.1%

    await expect(budgets.transportPercent).toHaveText('90%');
    await expect(budgets.transportBar).toHaveClass(/from-amber-500/);
    await expect(budgets.transportPercent).toHaveClass(/text-amber-400/);
  });

  test('70% threshold: exactly 70% keeps the healthy bar, just above 70% turns amber', async () => {
    await addTransportExpense('200.00'); // spent = 210 = exactly 70% of 300

    await expect(budgets.transportPercent).toHaveText('70%');
    await expect(budgets.transportBar).toHaveClass(/\bbg-emerald-500\b/);

    await addTransportExpense('0.30'); // spent = 210.30 => 70.1%

    await expect(budgets.transportPercent).toHaveText('70%');
    await expect(budgets.transportBar).toHaveClass(/\bbg-amber-500\b/);
    await expect(budgets.transportBar).not.toHaveClass(/\bbg-emerald-500\b/);
  });

  test('Transport budget set to 0 with existing spend reports the spend as over budget', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.setTransportBudget('0');

    await expect(budgets.transportRemaining).toHaveText(
      `$${SEEDED_TRANSPORT_SPENT.toFixed(2)} over`
    );
    // Total Budget drops by exactly the old Transport limit ($300).
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore - 300, 2);
    const budget = await budgets.kpi('Total Budget');
    const spent = await budgets.kpi('Total Spent');
    expect(await budgets.kpi('Remaining')).toBeCloseTo(budget - spent, 2);
  });

  // Likely to FAIL against the current app: BudgetsTab computes `pct = budget ? spent/budget*100 : 0`,
  // so a $0 budget with $10 spent renders "0%" with the healthy (green) style next to "$10.00 over".
  // Kept as a regular assertion because the intended behavior is "not shown as healthy".
  // Confirm the intended behavior with the product owner before changing this test.
  test('Transport budget of 0 with spend is not presented as a healthy 0%', async () => {
    await budgets.setTransportBudget('0');

    await expect(budgets.transportRemaining).toContainText('over');
    await expect(budgets.transportPercent).not.toHaveClass(/text-emerald-400/);
  });

  test('clearing the Transport budget input does not break the KPIs or show NaN', async () => {
    const budgetBefore = await budgets.kpi('Total Budget');

    await budgets.transportBudgetInput.fill('');

    // An empty field is treated as 0 by the app: spend is reported as over budget.
    await expect(budgets.transportRemaining).toHaveText(
      `$${SEEDED_TRANSPORT_SPENT.toFixed(2)} over`
    );
    await expect(page.locator('body')).not.toContainText('NaN');
    expect(await budgets.kpi('Total Budget')).toBeCloseTo(budgetBefore - 300, 2);
    const budget = await budgets.kpi('Total Budget');
    const spent = await budgets.kpi('Total Spent');
    expect(await budgets.kpi('Remaining')).toBeCloseTo(budget - spent, 2);
  });
});
