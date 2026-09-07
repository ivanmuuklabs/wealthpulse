import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets tab — happy path and negative tests.
 *
 * User stories covered:
 *   WP-201  As a user I can view KPI cards (Total Budget, Total Spent, Remaining)
 *           so I understand my financial position at a glance.
 *   WP-202  As a user I can update a category budget limit so my targets stay current.
 *   WP-203  As a user I can switch months to compare budget usage across periods.
 *   WP-204  As a user I can search budget categories to quickly find a specific one.
 */

test.describe('Budgets — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  // WP-201: KPI cards render correctly
  test('Budgets page shows Total Budget, Total Spent and Remaining KPI cards', async ({ page }) => {
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
  });

  // WP-201: Remaining = Total Budget − Total Spent (within $1 rounding)
  test('Remaining KPI equals Total Budget minus Total Spent', async ({ page }) => {
    const parseAmt = (s: string | null) =>
      parseFloat((s ?? '0').replace(/[$,]/g, ''));

    const budgetText = await page
      .getByText('Total Budget')
      .locator('..')
      .locator('text=/\\$[\\d,]+/')
      .first()
      .textContent();
    const spentText = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('text=/\\$[\\d,]+/')
      .first()
      .textContent();
    const remainingText = await page
      .getByText('Remaining')
      .locator('..')
      .locator('text=/\\$[\\d,]+/')
      .first()
      .textContent();

    const budget = parseAmt(budgetText);
    const spent = parseAmt(spentText);
    const remaining = parseAmt(remainingText);

    expect(Math.abs(remaining - (budget - spent))).toBeLessThanOrEqual(1);
  });

  // WP-202: Updating a budget limit persists in the input
  test('changing Housing budget limit to 2500 reflects the new value in the input', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    await budgetsPage.setBudgetLimit('Housing', 2500);

    // The input value should now read 2500
    await expect(budgetsPage.getBudgetInput('Housing')).toHaveValue('2500');
  });

  // WP-203: Month switching shows different spending figures
  test('switching between February and March updates Total Spent KPI', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    await budgetsPage.selectMonth('Mar');
    const marText = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('text=/\\$[\\d,]+/')
      .first()
      .textContent();

    await budgetsPage.selectMonth('Feb');
    const febText = await page
      .getByText('Total Spent')
      .locator('..')
      .locator('text=/\\$[\\d,]+/')
      .first()
      .textContent();

    // Seeded data produces different spending per month
    expect(marText).not.toEqual(febText);
  });

  // WP-204: Category search
  test('searching for "food" narrows the budget cards to only Food', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    await budgetsPage.searchCategory('food');

    // Housing card should be hidden
    await expect(page.getByText('Housing').first()).not.toBeVisible();
    // Food card should be visible
    await expect(page.getByText('Food').first()).toBeVisible();
  });

  // WP-201: All 8 budget category cards render
  test('all 8 spending category cards are displayed by default', async ({ page }) => {
    const categories = [
      'Housing', 'Food', 'Transport', 'Entertainment',
      'Health', 'Utilities', 'Shopping', 'Subscriptions',
    ];
    for (const cat of categories) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }
  });
});

test.describe('Budgets — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await factory.budgets().navigate();
  });

  // WP-204: Search with no match collapses the card grid
  test('searching for a non-existent category hides all budget cards', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    await budgetsPage.searchCategory('zzznotacategory');

    // None of the known categories should be visible
    await expect(page.getByText('Housing').first()).not.toBeVisible();
    await expect(page.getByText('Food').first()).not.toBeVisible();
  });

  // WP-202: Setting budget to 0 makes spending exceed it (progress turns red / over label)
  test('setting Housing budget to 0 causes it to show the "over" state', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    await budgetsPage.setBudgetLimit('Housing', 0);

    // With any actual spending, "over" text should appear in the Housing card
    const housingCard = page
      .locator('div', { hasText: /^Housing/ })
      .filter({ has: page.locator('input[type="number"]') })
      .first();

    await expect(housingCard.getByText(/over/i)).toBeVisible();
  });

  // WP-203: Switching months and back preserves budget limits
  test('budget limits are the same after switching months and returning', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    // Read current Food budget
    const initialValue = await budgetsPage.getBudgetInput('Food').inputValue();

    // Switch months and come back
    await budgetsPage.selectMonth('Feb');
    await budgetsPage.selectMonth('Mar');

    // Value should be unchanged (budgets are global, not per-month)
    await expect(budgetsPage.getBudgetInput('Food')).toHaveValue(initialValue);
  });

  // WP-204: Clearing the search input restores all category cards
  test('clearing the category search input brings all budget cards back', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    await budgetsPage.searchCategory('food');
    await expect(page.getByText('Housing').first()).not.toBeVisible();

    // Clear
    await budgetsPage.searchCategory('');
    await expect(page.getByText('Housing').first()).toBeVisible();
  });

  // WP-201: Total Spent never exceeds Total Budget label color consistency
  test('Total Spent card label is always visible regardless of the selected month', async ({ page }) => {
    const budgetsPage = new PageFactory(page).budgets();

    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await budgetsPage.selectMonth(month);
      await expect(page.getByText('Total Spent')).toBeVisible();
    }
  });
});
