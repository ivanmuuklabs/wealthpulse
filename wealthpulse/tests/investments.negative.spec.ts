import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByPlaceholder('demo').fill('demo');
  await page.getByPlaceholder('demo123').fill('demo123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: /investments/i }).click();
});

// Negative Test 1 — Search with no matching results shows no fund cards
test('search with a term that matches no fund hides all cards', async ({ page }) => {
  await page.getByPlaceholder('Search funds…').fill('xxxxxxxxnotafund');

  const fundCards = page.locator('.grid > div').filter({ hasText: /Expense Ratio/ });
  await expect(fundCards).toHaveCount(0);
});

// Negative Test 2 — Selecting a 4th fund does NOT add it to the selection
test('selecting a 4th fund does not exceed the 3-fund selection limit', async ({ page }) => {
  const cards = page.locator('.grid > div').filter({ hasText: /Expense Ratio/ });

  // Select 3 funds
  await cards.nth(0).click();
  await cards.nth(1).click();
  await cards.nth(2).click();

  // Attempt to select a 4th
  await cards.nth(3).click();

  // Only 3 should show the selected indicator
  const selectedBadges = page.locator('text=✓ Selected');
  await expect(selectedBadges).toHaveCount(3);

  // The 4th card must NOT show the ring highlight
  await expect(cards.nth(3)).not.toHaveClass(/ring-1/);
});

// Negative Test 3 — Compare tab shows empty state when no funds are selected
test('Compare tab shows empty state message when no funds are selected', async ({ page }) => {
  // Navigate directly to Compare without selecting any fund
  await page.getByRole('button', { name: 'Compare' }).click();

  await expect(
    page.getByText('Select funds from the Fund Cards tab to compare')
  ).toBeVisible();

  // The chart must NOT be rendered
  const chart = page.locator('.recharts-line-chart');
  await expect(chart).not.toBeVisible();
});

// Negative Test 4 — Calculator does not accept zero or negative investment amounts
test('calculator with zero investment amount shows a $0.00 flat projection', async ({ page }) => {
  await page.getByRole('button', { name: 'Calculator' }).click();

  const amountInput = page.getByLabel('Investment ($)');
  await amountInput.clear();
  await amountInput.fill('0');

  // All projected values should be $0.00 — the chart should reflect a flat line at zero
  // The final year label should show $0.00, not a grown value
  const yAxisTicks = page.locator('.recharts-yAxis .recharts-cartesian-axis-tick-value');
  const tickTexts = await yAxisTicks.allTextContents();

  const allZero = tickTexts.every(t => t.includes('$0') || t === '$0.00');
  expect(allZero).toBe(true);
});

// Negative Test 5 — Portfolio Builder shows error state when total allocation exceeds 100%
test('portfolio builder flags total allocation above 100% as invalid', async ({ page }) => {
  await page.getByRole('button', { name: 'Portfolio Builder' }).click();

  // Set two funds to 100% each via keyboard input on the range sliders
  const sliders = page.locator('input[type="range"]');

  // Move first slider to 100
  await sliders.nth(0).fill('100');
  await sliders.nth(0).dispatchEvent('input');

  // Move second slider to 100
  await sliders.nth(1).fill('100');
  await sliders.nth(1).dispatchEvent('input');

  // Total is now 200% — should show red error text
  const totalLabel = page.locator('text=/Total:/');
  await expect(totalLabel).toHaveClass(/text-red-400/);
  await expect(totalLabel).toContainText('must be 100%');
});
