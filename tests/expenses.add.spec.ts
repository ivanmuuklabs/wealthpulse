import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

// NOTE: seeded transactions are randomised on every page load (Math.random),
// so these tests never assert fixed seeded totals. They read a "before" value,
// perform the action and assert the delta caused by a uniquely named expense.

test.beforeEach(async ({ page }) => {
  const loginPage = new PageFactory(page).login();
  await loginPage.goto();
  await loginPage.loginAsDemo();
});

test.describe('Expenses — add expense', () => {

  test('adding an expense lists it and updates the transaction count and total', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    const description = 'QA Automation Checkup';
    const amount = 12.34;

    await expenses.navigate();
    const countBefore = await expenses.getCount();
    const totalBefore = await expenses.getTotal();

    await expenses.addExpense({ description, amount, category: 'Health' });

    // The new row appears with the right category and amount, and the form closes
    const newRow = expenses.rowByDescription(description);
    await expect(newRow).toHaveCount(1);
    await expect(newRow).toContainText('Health');
    await expect(newRow).toContainText('-$12.34');
    await expect(expenses.formHeading).toBeHidden();

    // Footer count and total reflect exactly the one new expense
    await expect(expenses.countLabel).toHaveText(`${countBefore + 1} transactions`);
    await expect.poll(() => expenses.getTotal()).toBeCloseTo(totalBefore + amount, 2);
  });

  test('an added expense is reflected on the Dashboard and Budgets screens', async ({ page }) => {
    const factory = new PageFactory(page);
    const expenses = factory.expenses();
    const dashboard = factory.dashboard();
    const budgets = factory.budgets();
    const amount = 50;

    // Capture "before" values on both screens (March is selected by default,
    // and the add form defaults to the 15th of the selected month)
    await dashboard.navigate();
    const dashSpentBefore = await dashboard.getTotalSpent();
    const dashCountBefore = await dashboard.getTransactionCount();

    await budgets.navigate();
    const budgetSpentBefore = await budgets.getTotalSpent();
    const remainingBefore = await budgets.getRemaining();

    // Add the expense through the UI
    await expenses.navigate();
    await expenses.addExpense({ description: 'QA Cross Screen Expense', amount, category: 'Food' });
    await expect(expenses.rowByDescription('QA Cross Screen Expense')).toHaveCount(1);

    // Dashboard: Total Spent grows by the amount and the transaction count by one
    await dashboard.navigate();
    await expect.poll(() => dashboard.getTotalSpent()).toBeCloseTo(dashSpentBefore + amount, 2);
    await expect.poll(() => dashboard.getTransactionCount()).toBe(dashCountBefore + 1);

    // Budgets: Total Spent grows and Remaining shrinks by the same amount
    await budgets.navigate();
    await expect.poll(() => budgets.getTotalSpent()).toBeCloseTo(budgetSpentBefore + amount, 2);
    await expect.poll(() => budgets.getRemaining()).toBeCloseTo(remainingBefore - amount, 2);
  });

  test('saving with a missing description or amount does not add an expense', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.navigate();
    const countBefore = await expenses.getCount();
    const totalBefore = await expenses.getTotal();

    // The app ignores invalid submissions silently (no error message),
    // so we assert the form stays open and nothing is added.
    await expenses.openForm();

    // 1) Both fields empty
    await expenses.saveButton.click();
    await expect(expenses.formHeading).toBeVisible();

    // 2) Description only
    await expenses.descriptionInput.fill('QA Missing Amount');
    await expenses.saveButton.click();
    await expect(expenses.formHeading).toBeVisible();

    // 3) Amount only
    await expenses.descriptionInput.clear();
    await expenses.amountInput.fill('25');
    await expenses.saveButton.click();
    await expect(expenses.formHeading).toBeVisible();

    await expect(expenses.rowByDescription('QA Missing Amount')).toHaveCount(0);
    await expect(expenses.countLabel).toHaveText(`${countBefore} transaction${countBefore !== 1 ? 's' : ''}`);
    expect(await expenses.getTotal()).toBeCloseTo(totalBefore, 2);
  });

});
