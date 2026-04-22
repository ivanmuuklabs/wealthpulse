import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Dashboard — reporting', () => {
  test('Net Savings equals Monthly Income minus Total Spent', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    const incomeCard  = page.locator('div', { has: page.getByText('Monthly Income') });
    const spentCard   = page.locator('div', { has: page.getByText('Total Spent') });
    const savingsCard = page.locator('div', { has: page.getByText('Net Savings') });

    const incomeText  = await incomeCard.locator('p.text-xl').textContent();
    const spentText   = await spentCard.locator('p.text-xl').textContent();
    const savingsText = await savingsCard.locator('p.text-xl').textContent();

    const parse = (s: string) => parseFloat(s!.replace(/[$,]/g, ''));
    const income  = parse(incomeText!);
    const spent   = parse(spentText!);
    const savings = parse(savingsText!);

    // Net Savings must equal income − spent within $0.01 rounding tolerance
    expect(Math.abs(savings - (income - spent))).toBeLessThanOrEqual(0.01);
  });
});
