import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests generated from Jira tickets moved to Done — 2026-09-18
 *
 * Tickets covered:
 *  - Rename Dashboard section to Charts (PR #14)
 *  - Changed dashboard order of Total Spent and Monthly Income KPI cards
 *
 * Happy path: Charts section is reachable, correctly named, and shows KPI
 *             cards in the specified order after login.
 * Negative path: Old sidebar labels no longer exist; navigating away and back
 *                preserves state; invalid month selections are not rendered.
 */

test.describe('Charts Overview — happy path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we landed in the app
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('sidebar contains "Charts" navigation item that is active after login', async ({ page }) => {
    const chartsBtn = page.getByRole('button', { name: 'Charts' });
    await expect(chartsBtn).toBeVisible();
    // Active items carry the emerald text class
    await expect(chartsBtn).toHaveClass(/text-emerald-400/);
  });

  test('Charts section heading "Overview" is visible after login', async ({ page }) => {
    const factory = new PageFactory(page);
    const chartsPage = factory.charts();
    await expect(chartsPage.heading).toBeVisible();
  });

  test('all four KPI cards are visible on the Charts overview page', async ({ page }) => {
    // Per the latest KPI order: Monthly Income, Total Spent, Net Savings, Transactions
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('Monthly Income KPI card appears before Total Spent (KPI reorder ticket)', async ({ page }) => {
    // After the reorder commit, Monthly Income must precede Total Spent in the DOM
    const incomePos = await page.getByText('Monthly Income').boundingBox();
    const spentPos = await page.getByText('Total Spent').first().boundingBox();

    // Monthly Income card should start to the left of (or above) Total Spent
    expect(incomePos).not.toBeNull();
    expect(spentPos).not.toBeNull();
    // On a wide viewport the cards are in a row — income x < spent x
    // On narrow they stack — income y < spent y. Either condition confirms order.
    const isOrdered = (incomePos!.x < spentPos!.x) || (incomePos!.y < spentPos!.y);
    expect(isOrdered).toBe(true);
  });

  test('month selector changes from Mar to Jan and back, and KPI values update', async ({ page }) => {
    const factory = new PageFactory(page);
    const chartsPage = factory.charts();

    // Default is March — record Total Spent value
    const marSpent = await page.getByText('Total Spent').first().locator('..').locator('p.text-xl').textContent();

    // Switch to January
    await chartsPage.selectMonth('Jan');
    const janSpent = await page.getByText('Total Spent').first().locator('..').locator('p.text-xl').textContent();

    // Seeded data produces different totals per month
    expect(janSpent).not.toEqual(marSpent);

    // Switch back to March — value must match the original
    await chartsPage.selectMonth('Mar');
    const marSpentAgain = await page.getByText('Total Spent').first().locator('..').locator('p.text-xl').textContent();
    expect(marSpentAgain).toEqual(marSpent);
  });

  test('header top-bar shows "dashboard" as the current page title', async ({ page }) => {
    // The top bar <header h1> still reads "dashboard" (internal tab id) after rename
    await expect(page.locator('header h1')).toHaveText('dashboard');
  });

  test('navigating to Expenses and back to Charts restores the Overview heading', async ({ page }) => {
    // Go to another tab
    await page.getByRole('button', { name: 'Expenses' }).click();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // Return to Charts
    await page.getByRole('button', { name: 'Charts' }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });
});

test.describe('Charts Overview — negative path', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('no sidebar button labelled "Dashboard" exists after the rename', async ({ page }) => {
    // Guard against regression: the old "Dashboard" label must be gone
    await expect(page.getByRole('button', { name: 'Dashboard' })).toHaveCount(0);
  });

  test('no sidebar button labelled "Reports" exists (earlier stale label)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Reports' })).toHaveCount(0);
  });

  test('only one active sidebar item exists at a time (Charts active, others inactive)', async ({ page }) => {
    // Only the Charts button should carry the active emerald class
    const activeItems = page.locator('nav button.text-emerald-400');
    await expect(activeItems).toHaveCount(1);
    await expect(activeItems.first()).toHaveText(/Charts/i);
  });

  test('switching to Expenses deactivates Charts in the sidebar', async ({ page }) => {
    await page.getByRole('button', { name: 'Expenses' }).click();
    const chartsBtn = page.getByRole('button', { name: 'Charts' });
    await expect(chartsBtn).not.toHaveClass(/text-emerald-400/);
  });

  test('Overview heading is not visible when on the Budgets tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Budgets' }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).not.toBeVisible();
  });
});
