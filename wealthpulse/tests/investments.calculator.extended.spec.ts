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

// ─── Calculator — switching the selected fund rerenders the chart ──────────────

// The Calculator defaults to "US Large Cap Index".  Changing to a fund with
// a different return profile (e.g. "Tech Growth") should produce different
// Y-axis values, confirming the chart rerenders with the new fund's data.
test('switching the fund dropdown to Tech Growth rerenders the projection chart', async ({ page }) => {
  const investments = new PageFactory(page).investments();

  // Confirm the chart is visible with default fund
  await expect(investments.calculatorYAxisTicks.first()).toBeVisible();

  // Capture first Y-axis tick text with the default fund (US Large Cap Index)
  const tickBefore = await investments.calculatorYAxisTicks.first().textContent();

  // Change fund to Tech Growth
  const fundSelect = page.locator('select').first();
  await expect(fundSelect).toBeVisible();
  await fundSelect.selectOption({ label: 'Tech Growth' });

  // Chart should still render after fund change
  await expect(investments.calculatorYAxisTicks.first()).toBeVisible();

  // The tick values should differ because Tech Growth has different monthly returns
  const tickAfter = await investments.calculatorYAxisTicks.first().textContent();
  expect(tickAfter).not.toBe(tickBefore);
});

// ─── Calculator — adjusting the time horizon slider changes the projection ─────

// Dragging the "Time Horizon (years)" range slider from its default of 5 years
// to 10 years should extend the X-axis (more data points) and change the final
// projected value — confirmed via Y-axis tick change.
test('moving the time horizon slider to 10 years rerenders the projection', async ({ page }) => {
  const investments = new PageFactory(page).investments();

  // Wait for the chart to render at the default 5-year horizon
  await expect(investments.calculatorYAxisTicks.first()).toBeVisible();
  const tickBefore = await investments.calculatorYAxisTicks.first().textContent();

  // The time horizon slider is the range input in the Calculator section
  const horizonSlider = page.locator('input[type="range"]').first();
  await expect(horizonSlider).toBeVisible();

  // Set to maximum (10 years)
  await horizonSlider.fill('10');
  await horizonSlider.dispatchEvent('input');

  // The year label should now confirm 10 years
  const yearLabel = page.locator('p').filter({ hasText: /10 year/i }).first();
  await expect(yearLabel).toBeVisible();

  // The chart should still be visible (not replaced by an empty state)
  await expect(investments.calculatorYAxisTicks.first()).toBeVisible();

  // The projection at 10 years should differ from the 5-year projection
  const tickAfter = await investments.calculatorYAxisTicks.first().textContent();
  expect(tickAfter).not.toBe(tickBefore);
});
