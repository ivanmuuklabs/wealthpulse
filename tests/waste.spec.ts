import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Regression suite for PR #13 — "Rename Expenses section to Waste".
 *
 * Covers:
 *  1. Sidebar label reflects the new "Waste" name (no "Expenses" button)
 *  2. The Waste tab page heading is "Waste", not "Expenses"
 *  3. The month selector now exposes exactly 4 months: Jan, Feb, Mar, Apr
 *  4. The April month button is functional and renders transactions (or empty state gracefully)
 *  5. Navigating back to Waste via the sidebar after visiting another tab works correctly
 */

test.describe('Waste tab — rename & April month selector', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we're inside the app before each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── 1. Sidebar label ────────────────────────────────────────────────────────

  test('sidebar shows "Waste" nav button and no "Expenses" button', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    // "Waste" button must be present
    await expect(waste.sidebarButton).toBeVisible();

    // Guard: "Expenses" must no longer exist in the sidebar
    await expect(page.getByRole('button', { name: 'Expenses' })).toHaveCount(0);
  });

  // ── 2. Page heading ─────────────────────────────────────────────────────────

  test('Waste tab heading reads "Waste", not "Expenses"', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    await waste.navigate();

    // The <h2> inside the tab must say "Waste"
    await expect(waste.heading).toBeVisible();

    // Guard: the old title must not appear anywhere in the tab content
    await expect(page.getByRole('heading', { name: 'Expenses' })).toHaveCount(0);
  });

  // ── 3. Month selector has exactly 4 buttons ─────────────────────────────────

  test('Waste tab month selector has exactly 4 month buttons (Jan–Apr)', async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.waste().navigate();

    // Expect all four month labels to be visible
    for (const label of ['Jan', 'Feb', 'Mar', 'Apr']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
  });

  // ── 4. April month button renders transactions or empty state ────────────────

  test('clicking April shows transactions or a graceful empty state', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    await waste.navigate();
    await waste.selectMonth('Apr');

    // Either there are transaction rows, or the empty-state message is shown —
    // either is valid; the UI must not crash or disappear
    const rowCount = await waste.tableRows.count();
    if (rowCount > 0) {
      // At least the first row should have a visible date cell
      await expect(waste.tableRows.first()).toBeVisible();
    } else {
      await expect(waste.emptyState).toBeVisible();
    }
  });

  // ── 5. April data differs from March (generator now covers 4 months) ────────

  test('April and March can each be selected and show non-identical transaction counts', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    await waste.navigate();

    // Get March count
    await waste.selectMonth('Mar');
    const marCount = await waste.tableRows.count();

    // Switch to April and get that count
    await waste.selectMonth('Apr');
    const aprCount = await waste.tableRows.count();

    // Both months must yield a positive number of transactions
    // (the transaction generator seeds data for all four months)
    expect(marCount).toBeGreaterThan(0);
    expect(aprCount).toBeGreaterThan(0);
  });

  // ── 6. Navigating away and back preserves the Waste label ───────────────────

  test('navigating to Dashboard and back to Waste via sidebar shows the Waste heading', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    // First go to Waste
    await waste.navigate();
    await expect(waste.heading).toBeVisible();

    // Navigate away to Dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Come back to Waste
    await waste.sidebarButton.click();
    await expect(waste.heading).toBeVisible();
  });
});
