import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.expenses().navigate();
});

test('adding a new expense shows it in the transaction list', async ({ page }) => {
  const expensesPage = new PageFactory(page).expenses();

  await expensesPage.openAddExpenseForm();
  await expensesPage.fillExpenseForm('Supermarket run', '87.50', 'Food');
  await expensesPage.saveExpense();

  // The new transaction description must appear in the table
  await expect(page.getByRole('cell', { name: 'Supermarket run' })).toBeVisible();

  // The amount must appear formatted as a negative dollar value
  await expect(page.getByText('-$87.50')).toBeVisible();
});
