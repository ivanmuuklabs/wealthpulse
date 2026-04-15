import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await factory.budgets().navigate();
});

test('category spending above budget shows red progress bar', async ({ page }) => {
  const budgetsPage = new PageFactory(page).budgets();

  // Set the Housing budget to $1 so it is guaranteed to be exceeded
  // by the seeded demo data (~$1,200–$1,800 rent transaction)
  await budgetsPage.setBudgetForCategory('Housing', 1);

  const progressBarClass = await budgetsPage.getProgressBarClass('Housing');

  // The progress bar should turn red when spending exceeds the budget
  expect(progressBarClass).toContain('bg-red-500');
});

test('category spending within budget shows green progress bar', async ({ page }) => {
  const budgetsPage = new PageFactory(page).budgets();

  // Set the Housing budget very high so spending is well within limits
  await budgetsPage.setBudgetForCategory('Housing', 99999);

  const progressBarClass = await budgetsPage.getProgressBarClass('Housing');

  // The progress bar should be green when spending is within budget
  expect(progressBarClass).toContain('bg-emerald-500');
});
