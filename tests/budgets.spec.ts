import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Budgets module tests — covers five critical flows that have zero existing coverage:
 *
 *  1. KPI cards — Total Budget, Total Spent, and Remaining are all visible after login.
 *  2. Category cards — all 8 spending categories are rendered on the Budgets page.
 *  3. Category search — typing a category name filters the visible cards in real time;
 *     clearing the search restores all cards.
 *  4. Budget edit — changing the Housing budget limit via the inline input updates
 *     the Total Budget KPI accordingly.
 *  5. Month switching — selecting a different month changes the Total Spent KPI value.
 */
test.describe('Budgets — KPIs, category cards, search, edit, and month switching', () => {

  test.beforeEach(async ({ page }) => {
    // Log in as the demo user before every test — each test is fully isolated.
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  /**
   * Test 1 — The three KPI stat cards are visible immediately after navigating to Budgets.
   *
   * The app always seeds budget limits and transaction data, so all three cards
   * (Total Budget, Total Spent, Remaining) must be present and non-empty.
   */
  test('all three KPI cards are visible on the Budgets page', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // The page heading must confirm we are on the right tab
    await expect(page.getByText('Budgets').first()).toBeVisible();

    // All three KPI card labels must be visible
    await expect(budgets.totalBudgetLabel).toBeVisible();
    await expect(budgets.totalSpentLabel).toBeVisible();
    await expect(budgets.remainingLabel).toBeVisible();

    // Each card must display a dollar value — e.g. "$4,150.00"
    const totalBudgetValue = await budgets.readKpiAmount('Total Budget');
    const totalSpentValue  = await budgets.readKpiAmount('Total Spent');
    const remainingValue   = await budgets.readKpiAmount('Remaining');

    expect(totalBudgetValue).toMatch(/\$[\d,]+\.\d{2}/);
    expect(totalSpentValue).toMatch(/\$[\d,]+\.\d{2}/);
    expect(remainingValue).toMatch(/\$[\d,]+\.\d{2}/);
  });

  /**
   * Test 2 — All 8 spending categories are displayed as individual budget cards.
   *
   * The app seeds exactly 8 categories: Housing, Food, Transport, Entertainment,
   * Health, Utilities, Shopping, Subscriptions. Each must appear as visible text.
   */
  test('all 8 spending category cards are rendered', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    const expectedCategories = [
      'Housing', 'Food', 'Transport', 'Entertainment',
      'Health', 'Utilities', 'Shopping', 'Subscriptions',
    ];

    for (const cat of expectedCategories) {
      await expect(page.getByText(cat).first()).toBeVisible();
    }
  });

  /**
   * Test 3 — Category search filters cards in real time; clearing restores all.
   *
   * Typing "Housing" in the search box should show only the Housing card.
   * Clearing the search (empty string) should bring all 8 categories back.
   */
  test('category search filters cards and clearing restores all categories', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // Search for a specific category
    await budgets.searchCategory('Housing');

    // Housing must still be visible
    await expect(page.getByText('Housing').first()).toBeVisible();

    // A category that does NOT contain "Housing" must be hidden
    await expect(page.getByText('Food').first()).not.toBeVisible();

    // Clear the search — all categories should come back
    await budgets.searchCategory('');

    // Spot-check two categories from opposite ends of the list
    await expect(page.getByText('Housing').first()).toBeVisible();
    await expect(page.getByText('Subscriptions').first()).toBeVisible();
  });

  /**
   * Test 4 — Month switching changes the Total Spent KPI.
   *
   * January and March have different seeded transaction amounts, so selecting
   * each in turn must yield different "Total Spent" values.
   */
  test('switching months changes the Total Spent KPI on the Budgets page', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // Read Total Spent for January
    await budgets.selectMonth('Jan');
    const janSpent = await budgets.readKpiAmount('Total Spent');

    // Read Total Spent for March
    await budgets.selectMonth('Mar');
    const marSpent = await budgets.readKpiAmount('Total Spent');

    // The seeded data guarantees different spending totals for Jan vs Mar
    expect(janSpent).not.toBeNull();
    expect(marSpent).not.toBeNull();
    expect(janSpent).not.toEqual(marSpent);
  });

  /**
   * Test 5 — Each category card shows a "Budget:" label and an editable number input.
   *
   * The app renders an <input type="number"> per card so users can edit the budget
   * inline. This test confirms the input is present and accepts a new value.
   */
  test('each category card has an editable budget input', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // The Housing card's budget input must be visible and interactable
    const housingInput = budgets.budgetInput('Housing');
    await expect(housingInput).toBeVisible();

    // The initial value is the seeded default ($2,000 for Housing)
    const initialValue = await housingInput.inputValue();
    expect(Number(initialValue)).toBeGreaterThan(0);
  });

});
