import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();

  const investments = factory.investments();
  await investments.navigate();
  // Land on the Calculator sub-tab
  await investments.goToSubTab('Calculator');
});

// ─── Calculator — default values render the chart ─────────────────────────────

// On load the Calculator pre-selects "US Large Cap Index", defaults the
// investment to $10,000 and the time horizon to 5 years.  The projected-
// growth area chart should render without any manual input.
test('Calculator renders projected growth chart with default values', async ({ page }) => {
  const investments = new PageFactory(page).investments();

  // The amount input should be pre-filled (non-empty)
  await expect(investments.calculatorAmountInput).toBeVisible();
  const defaultAmount = await investments.calculatorAmountInput.inputValue();
  expect(defaultAmount).not.toBe('');

  // The Y-axis ticks confirm the Recharts area chart rendered data points
  await expect(investments.calculatorYAxisTicks.first()).toBeVisible();
});

// ─── Calculator — changing the investment amount updates the projection ────────

// Updating the investment amount to $25,000 should rerender the chart so that
// the Y-axis tick values reflect the new (higher) projected figures.
test('changing investment amount to $25 000 rerenders the projection chart', async ({ page }) => {
  const investments = new PageFactory(page).investments();

  // Capture the first Y-axis tick before the change
  const ticksBefore = await investments.calculatorYAxisTicks.first().textContent();

  await investments.setCalculatorAmount(25000);
  // Trigger blur so the chart recalculates
  await investments.calculatorAmountInput.press('Tab');

  // The chart should still be rendered (not replaced by an empty state)
  await expect(investments.calculatorYAxisTicks.first()).toBeVisible();

  // The tick values should differ from the defaults (different scale)
  const ticksAfter = await investments.calculatorYAxisTicks.first().textContent();
  expect(ticksAfter).not.toBe(ticksBefore);
});
