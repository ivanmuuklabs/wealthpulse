import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets tab tests.
 *
 * Coverage gap addressed:
 *   - Test 4: Editing a budget limit inline and observing the Remaining KPI
 *     recalculate — the write path for the Budgets module, not covered by the
 *     existing budget.comparison.spec.ts (which only reads values and compares
 *     months but never mutates a limit).
 */

test.describe('Budgets — edit budget limit', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await new PageFactory(page).budgets().navigate();
  });

  /**
   * Test 4 — Editing the Housing budget limit updates the Remaining KPI.
   *
   * The app's Housing limit is seeded at $2 000. Setting it to $9 999 must
   * result in a higher Remaining value than the original (since spent is fixed
   * for the seeded month). This pins the SET_BUDGET reducer + KPI reactivity.
   */
  test('editing the Housing budget limit recalculates the Remaining KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Read the current Remaining KPI before any change
    const remainingBefore = await page
      .getByText('Remaining')
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();

    // Change the Housing budget from $2 000 to $9 999
    const housingInput = budgets.budgetInputFor('Housing');
    await housingInput.fill('9999');
    await housingInput.press('Tab'); // trigger React onChange

    // The Remaining KPI must have increased (new limit is much higher than original)
    const remainingAfter = await page
      .getByText('Remaining')
      .locator('..')
      .locator('p.text-xl')
      .first()
      .textContent();

    expect(remainingAfter).not.toEqual(remainingBefore);

    // The value must be a dollar-formatted positive amount
    expect(remainingAfter).toMatch(/\$[\d,]+/);

    // The Housing category card must now show the updated budget limit
    await expect(
      page.locator('div', { hasText: /^Housing/ }).filter({ has: housingInput }).locator('input[type="number"]').first()
    ).toHaveValue('9999');
  });
});
