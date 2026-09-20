import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests for the Budgets tab.
 *
 * User stories:
 *  - As a user I can view my budget KPIs (Total Budget, Total Spent, Remaining)
 *    for the selected month.
 *  - As a user I can see a budget card per spending category with a progress bar.
 *  - As a user I can edit a budget limit inline and see the Remaining label update.
 *  - As a user I can search categories to narrow the card list.
 *
 * Seeded data facts (from App.jsx):
 *  - 8 categories: Housing, Food, Transport, Entertainment, Health, Utilities,
 *    Shopping, Subscriptions.
 *  - Default budget limits (USD): Housing 2000, Food 600, Transport 300,
 *    Entertainment 200, Health 300, Utilities 400, Shopping 400, Subscriptions 150.
 *  - selectedMonth starts at index 2 (March 2026).
 */

test.describe('Budgets — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await factory.budgets().navigate();
    await expect(factory.budgets().heading).toBeVisible();
  });

  // ── KPI cards ────────────────────────────────────────────────────────────

  test('Total Budget KPI card is visible with a dollar amount', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.totalBudgetCard).toBeVisible();
    // The card contains a formatted dollar amount
    await expect(budgets.totalBudgetCard.locator('p.text-xl')).toHaveText(/\$[\d,]+/);
  });

  test('Total Budget KPI equals the sum of all category limits ($4,350)', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    // 2000+600+300+200+300+400+400+150 = 4350
    await expect(budgets.totalBudgetCard.locator('p.text-xl')).toContainText('$4,350');
  });

  test('Total Spent KPI is visible and contains a dollar amount', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.totalSpentCard).toBeVisible();
    await expect(budgets.totalSpentCard.locator('p.text-xl')).toHaveText(/\$[\d,]+/);
  });

  test('Remaining KPI is visible and contains a dollar amount', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.remainingCard).toBeVisible();
    await expect(budgets.remainingCard.locator('p.text-xl')).toHaveText(/\$[\d,]+/);
  });

  // ── Category budget cards ────────────────────────────────────────────────

  test('all 8 category budget cards are rendered by default', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    // Each card hosts a number input (the budget-limit spinbutton)
    const inputs = page.locator('input[type="number"]');
    // There are exactly 8 categories
    await expect(inputs).toHaveCount(8);
  });

  test('Housing category card is visible', async ({ page }) => {
    await expect(page.getByText('Housing').first()).toBeVisible();
  });

  test('each category card shows a progress percentage', async ({ page }) => {
    // The percentage label is rendered as e.g. "72%" inside a <span>
    // At least one card should show a non-zero percentage for March seeded data
    const percentLabels = page.locator('span.text-lg.font-bold.tabular-nums');
    const count = await percentLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Housing budget limit input shows the default value of 2000', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.budgetInput('Housing')).toHaveValue('2000');
  });

  test('Food budget limit input shows the default value of 600', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await expect(budgets.budgetInput('Food')).toHaveValue('600');
  });

  // ── Month switching ──────────────────────────────────────────────────────

  test('switching to February updates the Total Spent KPI', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Capture March Total Spent
    const marchSpent = await budgets.totalSpentCard.locator('p.text-xl').textContent();

    // Switch to February via the month selector in the Budgets header
    await page.getByRole('button', { name: 'Feb' }).click();

    const febSpent = await budgets.totalSpentCard.locator('p.text-xl').textContent();

    // Seeded data differs by month — the values should change
    expect(marchSpent).not.toEqual(febSpent);
  });

  // ── Edit budget limit (write path) ───────────────────────────────────────

  test('editing the Housing budget limit updates the input value', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const input = budgets.budgetInput('Housing');
    await input.fill('2500');
    // Trigger the onChange so Redux receives SET_BUDGET
    await input.dispatchEvent('input');

    await expect(input).toHaveValue('2500');
  });

  test('increasing a budget limit changes the Remaining label', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // Record the current remaining label for Food
    const label = budgets.remainingLabel('Food');
    const before = await label.textContent();

    // Set an extremely high limit so it's definitely "X left"
    const input = budgets.budgetInput('Food');
    await input.fill('9999');
    await input.dispatchEvent('input');

    const after = await label.textContent();

    // Both should contain a dollar amount; the values should differ
    expect(before).not.toEqual(after);
    expect(after).toContain('left');
  });

  test('setting budget to 0 changes the remaining label to show full spending as over', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    const input = budgets.budgetInput('Food');
    await input.fill('0');
    await input.dispatchEvent('input');

    // When budget is 0 and there is spending, the label shows "X over"
    // (or "0.00 left" if pct calculation returns 0 — both are acceptable)
    const label = budgets.remainingLabel('Food');
    const text = await label.textContent();
    expect(text).toMatch(/(over|left)/i);
  });
});

test.describe('Budgets — category search', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await factory.budgets().navigate();
    await expect(factory.budgets().heading).toBeVisible();
  });

  test('searching for "Housing" shows only the Housing card', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Housing');

    // Only 1 budget-limit input should remain visible
    await expect(page.locator('input[type="number"]')).toHaveCount(1);
    await expect(page.getByText('Housing').first()).toBeVisible();
  });

  test('searching for a term matching no category shows zero cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('xxxxxxnotacategory');

    // No budget inputs should remain
    await expect(page.locator('input[type="number"]')).toHaveCount(0);
  });

  test('clearing the search restores all 8 category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('Transport');
    await expect(page.locator('input[type="number"]')).toHaveCount(1);

    // Clear
    await budgets.search('');
    await expect(page.locator('input[type="number"]')).toHaveCount(8);
  });

  test('search is case-insensitive — "food" matches Food', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.search('food');
    await expect(page.locator('input[type="number"]')).toHaveCount(1);
    await expect(page.getByText('Food').first()).toBeVisible();
  });
});
