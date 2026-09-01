import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Budget — February vs March comparison', () => {

  test('Total Spent KPI differs between February and March', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await page.getByRole('button', { name: /budgets/i }).click();

    // Read Total Spent in February
    await page.getByRole('button', { name: 'Feb' }).click();
    const febSpent = await page
      .getByText('Total Spent')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    // Switch to March and read again
    await page.getByRole('button', { name: 'Mar' }).click();
    const marSpent = await page
      .getByText('Total Spent')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    // Seeded data produces different spending each month
    expect(febSpent).not.toEqual(marSpent);
  });

  test('budget limits are identical for February and March', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await page.getByRole('button', { name: /budgets/i }).click();

    const getBudgetInputValue = async (month: 'Feb' | 'Mar') => {
      await page.getByRole('button', { name: month }).click();
      // Read the inline budget input value for the Housing category
      return page
        .locator('div', { hasText: /^Housing/ })
        .getByRole('spinbutton')
        .inputValue();
    };

    const febLimit = await getBudgetInputValue('Feb');
    const marLimit = await getBudgetInputValue('Mar');

    expect(febLimit).toEqual(marLimit);
  });

  test('Remaining KPI recalculates correctly when switching from February to March', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await page.getByRole('button', { name: /budgets/i }).click();

    const parseAmount = (str: string | null) =>
      parseFloat((str ?? '0').replace(/[$,]/g, ''));

    const getKPIs = async (month: 'Feb' | 'Mar') => {
      await page.getByRole('button', { name: month }).click();
      const budget = parseAmount(
        await page
          .getByText('Total Budget')
          .locator('..')
          .locator('text=/\\$[\\d,]+/')
          .first()
          .textContent()
      );
      const spent = parseAmount(
        await page
          .getByText('Total Spent')
          .locator('..')
          .locator('text=/\\$[\\d,]+/')
          .first()
          .textContent()
      );
      const remaining = parseAmount(
        await page
          .getByText('Remaining')
          .locator('..')
          .locator('text=/\\$[\\d,]+/')
          .first()
          .textContent()
      );
      return { budget, spent, remaining };
    };

    const feb = await getKPIs('Feb');
    const mar = await getKPIs('Mar');

    // Remaining must equal Budget − Spent for each month (allow $1 rounding tolerance)
    expect(Math.abs(feb.remaining - (feb.budget - feb.spent))).toBeLessThanOrEqual(1);
    expect(Math.abs(mar.remaining - (mar.budget - mar.spent))).toBeLessThanOrEqual(1);

    // And the two months must differ in spent/remaining (data actually changed)
    expect(feb.spent).not.toEqual(mar.spent);
    expect(feb.remaining).not.toEqual(mar.remaining);
  });

});
