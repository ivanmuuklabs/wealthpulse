import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Dashboard KPI cards', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    const loginPage = factory.login();
    await loginPage.goto();
    await loginPage.loginAsDemo();
  });

  test('Total Spent appears before Monthly Income in the KPI row', async ({ page }) => {
    // Assert DOM order by comparing horizontal positions of the two cards
    const totalSpent = page.getByText('Total Spent').first();
    const monthlyIncome = page.getByText('Monthly Income').first();

    const totalSpentBox = await totalSpent.boundingBox();
    const monthlyIncomeBox = await monthlyIncome.boundingBox();

    expect(totalSpentBox!.x).toBeLessThan(monthlyIncomeBox!.x);
  });

  test('all four KPI cards are present on the Dashboard', async ({ page }) => {
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('Total Spent card shows a month-over-month change indicator', async ({ page }) => {
    // The card closest to the "Total Spent" label should contain a delta vs last month
    const totalSpentCard = page.getByText('Total Spent').locator('../..');
    await expect(totalSpentCard.getByText(/vs last month/i)).toBeVisible();
  });

  test('Monthly Income is fixed at $6,500 regardless of selected month', async ({ page }) => {
    // Income is static across all three available months
    for (const month of ['Jan', 'Feb', 'Mar']) {
      await page.getByRole('button', { name: month }).click();
      await expect(page.getByText('$6,500')).toBeVisible();
    }
  });
});
