import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Sidebar navigation — new tab destinations.
 *
 * The existing sidebar.navigation.spec.ts only tests the Charts (Dashboard) tab.
 * The PR introduces page objects for Expenses, Budgets, and Settings. These tests
 * verify that the sidebar navigation items for each new tab work correctly:
 * clicking the nav item loads the correct heading and the tab remains accessible
 * via round-trip navigation.
 */

test.describe('Sidebar navigation — Expenses, Budgets, Settings tabs', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('clicking Expenses nav item loads the Expenses heading', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  test('clicking Budgets nav item loads the Budgets heading', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('clicking Settings nav item loads the Settings heading', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('navigating Charts → Expenses → Budgets → Settings → Charts completes without errors', async ({ page }) => {
    const factory = new PageFactory(page);

    // Charts is default — navigate through each new tab in sequence
    await factory.expenses().navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    await factory.budgets().navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();

    await factory.settings().navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Navigate back to Charts (Dashboard) via the sidebar
    await factory.dashboard().navigate();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Expenses tab renders the transaction table and Add Expense button', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // The table and the primary action button must be present
    await expect(expenses.addExpenseButton).toBeVisible();
    // At least one row of seeded data should appear in March (default month)
    await expect(expenses.tableRows.first()).toBeVisible();
  });

  test('Budgets tab renders the three KPI cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();
    await budgets.navigate();

    // All three KPI cards must render
    await expect(page.getByText('Total Budget').first()).toBeVisible();
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Remaining').first()).toBeVisible();
  });
});
