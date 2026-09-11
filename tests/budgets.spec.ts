import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Budgets tab.
 *
 * Coverage gap addressed: editing an individual category budget limit and
 * verifying the KPI cards recalculate accordingly — completely untested
 * before this spec (existing budget tests only cover month-switching KPI
 * comparisons between February and March, not the edit flow).
 */

test.describe('Budgets — edit budget limit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    // Navigate to Budgets tab
    await new PageFactory(page).budgets().navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  // ─── Test 4: Edit Budget Limit ────────────────────────────────────────────
  test('changing the Housing budget limit updates the Total Budget KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Use March data (default selected month is index 2)
    await budgets.selectMonth('Mar');

    // Read the current Total Budget KPI before editing
    const before = await page
      .getByText('Total Budget')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    const beforeAmount = parseFloat((before ?? '0').replace(/[$,]/g, ''));

    // Housing default budget is $2,000. Set it to $3,000 (+$1,000 delta).
    const newLimit = 3000;
    const housingInput = page
      .locator('div', { hasText: /^Housing/ })
      .filter({ has: page.getByRole('spinbutton') })
      .getByRole('spinbutton');

    await housingInput.fill(String(newLimit));
    await housingInput.press('Tab'); // commit the change to React state

    // Read the updated Total Budget KPI
    const after = await page
      .getByText('Total Budget')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();

    const afterAmount = parseFloat((after ?? '0').replace(/[$,]/g, ''));

    // The total should have increased by $1,000 (within $5 rounding tolerance)
    expect(Math.abs(afterAmount - beforeAmount - 1000)).toBeLessThanOrEqual(5);
  });
});
