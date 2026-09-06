import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.describe('Budgets', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  /**
   * Test 4 — Editing a category's budget limit updates the Total Budget KPI card in real time.
   *
   * The Budgets module exposes an inline number input on each category card.
   * Changing the value must immediately recalculate the Total Budget KPI at the
   * top of the page. This test validates the reactive data flow between the
   * per-category input and the aggregate summary card, which is the core
   * business logic of the Budgets module.
   */
  test('editing the Housing budget limit recalculates the Total Budget KPI card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Start in January (predictable seeded data)
    await budgets.selectMonth('Jan');

    // Read the current Total Budget value
    const parseAmount = (str: string | null) =>
      parseFloat((str ?? '0').replace(/[$,]/g, ''));

    const initialTotalBudgetText = await budgets.getKpiValue(budgets.totalBudgetCard);
    const initialTotal = parseAmount(initialTotalBudgetText);

    // The Housing budget input — increase it by 500
    const housingInput = budgets.categoryBudgetInput('Housing');
    await expect(housingInput).toBeVisible();

    const currentValueStr = await housingInput.inputValue();
    const currentValue = parseFloat(currentValueStr) || 0;
    const newValue = currentValue + 500;

    await housingInput.triple_click?.() ?? await housingInput.click({ clickCount: 3 });
    await housingInput.fill(String(newValue));
    // Trigger the change event so React state updates
    await housingInput.press('Tab');

    // The Total Budget KPI must increase by the same delta (real-time update)
    const updatedTotalBudgetText = await budgets.getKpiValue(budgets.totalBudgetCard);
    const updatedTotal = parseAmount(updatedTotalBudgetText);

    expect(updatedTotal).toBeCloseTo(initialTotal + 500, 0);
  });

});
