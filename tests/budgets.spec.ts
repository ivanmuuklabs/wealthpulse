import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets tab — happy path and negative tests.
 *
 * User story: As a logged-in user I can view my spending vs budget limits for
 * each category, edit those limits inline, search/filter categories, and
 * switch months — so that I can manage my finances proactively.
 *
 * Covers:
 *  Happy path — navigating to the tab, KPI card values, progress bars, inline
 *               budget editing, category search, and month switching.
 *  Negative  — search with no match, editing budget to a lower value showing
 *               an "over" indicator, and verifying limits are shared across months.
 */

test.describe('Budgets tab — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Navigate to the Budgets tab
    await page.getByRole('button', { name: /budgets/i }).click();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('Budgets tab is reachable and displays the Budgets heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('three KPI cards are visible: Total Budget, Total Spent, Remaining', async ({ page }) => {
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
  });

  test('Total Budget KPI shows a positive dollar amount', async ({ page }) => {
    const budgetCard = page.getByText('Total Budget').locator('..');
    const valueText = await budgetCard.locator('p.text-xl').textContent();
    // Seeded budgets sum to $4,350 — ensure it is a non-zero dollar amount
    expect(valueText).toMatch(/\$[1-9]/);
  });

  test('all eight category budget cards are rendered', async ({ page }) => {
    // Each category card contains a "Budget:" label and a spinner input
    const budgetCards = page.locator('div.grid > div').filter({ hasText: /Budget:/ });
    const count = await budgetCards.count();
    // 8 categories: Housing, Food, Transport, Entertainment, Health, Utilities, Shopping, Subscriptions
    expect(count).toBe(8);
  });

  test('each category budget card shows a progress bar', async ({ page }) => {
    // Progress bars are the coloured inner divs inside the track div
    const progressBars = page.locator('div.h-2.rounded-full.bg-white\\/\\[0\\.06\\] > div');
    const count = await progressBars.count();
    expect(count).toBe(8);
  });

  test('Housing budget card shows the inline spinner with its seeded limit', async ({ page }) => {
    const housingCard = page
      .locator('div.grid > div')
      .filter({ hasText: /Housing/ })
      .filter({ hasText: /Budget:/ })
      .first();

    const spinner = housingCard.getByRole('spinbutton');
    await expect(spinner).toBeVisible();

    // Seeded Housing budget is $2,000
    const value = await spinner.inputValue();
    expect(parseFloat(value)).toBe(2000);
  });

  test('editing the Housing budget spinner updates the Remaining KPI', async ({ page }) => {
    const housingCard = page
      .locator('div.grid > div')
      .filter({ hasText: /Housing/ })
      .filter({ hasText: /Budget:/ })
      .first();

    // Read the current Remaining KPI
    const remainingCard = page.getByText('Remaining').locator('..');
    const remainingBefore = await remainingCard.locator('p.text-xl').textContent();

    // Increase Housing budget by $500 — triggers SET_BUDGET reducer
    const spinner = housingCard.getByRole('spinbutton');
    await spinner.click({ clickCount: 3 });
    await spinner.fill('2500');
    await spinner.dispatchEvent('change');

    // Remaining must now differ (budget increased → more remaining)
    const remainingAfter = await remainingCard.locator('p.text-xl').textContent();
    expect(remainingAfter).not.toEqual(remainingBefore);
  });

  test('category search narrows the visible budget cards', async ({ page }) => {
    // Type "Housing" — only the Housing card should remain
    await page.getByPlaceholder('Search categories…').fill('Housing');

    const budgetCards = page.locator('div.grid > div').filter({ hasText: /Budget:/ });
    await expect(budgetCards).toHaveCount(1);
    await expect(budgetCards.first()).toContainText('Housing');
  });

  test('switching to January month still shows all budget categories', async ({ page }) => {
    await page.getByRole('button', { name: 'Jan' }).click();

    // All 8 category cards should still render
    const budgetCards = page.locator('div.grid > div').filter({ hasText: /Budget:/ });
    await expect(budgetCards).toHaveCount(8);
  });

  test('Total Spent differs between January and March', async ({ page }) => {
    const totalSpentCard = page.getByText('Total Spent').locator('..');

    // Read March (default, index 2)
    const marchSpent = await totalSpentCard.locator('p.text-xl').textContent();

    await page.getByRole('button', { name: 'Jan' }).click();
    const janSpent = await totalSpentCard.locator('p.text-xl').textContent();

    // Seeded data produces different spending per month
    expect(marchSpent).not.toEqual(janSpent);
  });
});

test.describe('Budgets tab — negative tests', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await page.getByRole('button', { name: /budgets/i }).click();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('category search with no match hides all budget cards', async ({ page }) => {
    await page.getByPlaceholder('Search categories…').fill('ZZZNOMATCH999');

    const budgetCards = page.locator('div.grid > div').filter({ hasText: /Budget:/ });
    await expect(budgetCards).toHaveCount(0);
  });

  test('setting a budget lower than spent shows an "over" indicator on the card', async ({ page }) => {
    // Food has seeded transactions; set its budget to $1 so it will be "over"
    const foodCard = page
      .locator('div.grid > div')
      .filter({ hasText: /^🍽️/ })
      .filter({ hasText: /Budget:/ })
      .first();

    const spinner = foodCard.getByRole('spinbutton');
    await spinner.click({ clickCount: 3 });
    await spinner.fill('1');
    await spinner.dispatchEvent('change');

    // The card should now show "over" text
    await expect(foodCard.getByText(/over/)).toBeVisible();
  });

  test('budget limits are identical for February and March (shared state)', async ({ page }) => {
    // Read Housing budget in March (default)
    const housingCard = page
      .locator('div.grid > div')
      .filter({ hasText: /Housing/ })
      .filter({ hasText: /Budget:/ })
      .first();

    const marchLimit = await housingCard.getByRole('spinbutton').inputValue();

    await page.getByRole('button', { name: 'Feb' }).click();
    const febLimit = await housingCard.getByRole('spinbutton').inputValue();

    // Budget limits are shared across months — only spending differs
    expect(marchLimit).toEqual(febLimit);
  });

  test('clearing the category search restores all eight cards', async ({ page }) => {
    // Filter, then clear
    await page.getByPlaceholder('Search categories…').fill('Housing');
    await page.getByPlaceholder('Search categories…').fill('');

    const budgetCards = page.locator('div.grid > div').filter({ hasText: /Budget:/ });
    await expect(budgetCards).toHaveCount(8);
  });
});
