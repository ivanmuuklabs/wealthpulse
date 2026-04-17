import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.expenses().navigate();
});

test('add an expense with all fields filled appears in the table', async ({ page }) => {
  const expenses = new PageFactory(page).expenses();

  await expenses.clickAddExpense();
  await expenses.fillForm({
    date: '2024-01-15',
    description: 'Grocery run',
    amount: 75,
    category: 'Food',
  });
  await expenses.save();

  // The new expense row must appear in the table
  await expect(page.getByRole('cell', { name: 'Grocery run' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Food' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '75' })).toBeVisible();
});
