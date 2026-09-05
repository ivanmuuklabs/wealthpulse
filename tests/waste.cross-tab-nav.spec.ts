import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Cross-tab navigation and form-state edge-case tests for PR #13
 * ("Rename Expenses section to Waste").
 *
 * All other waste.*.spec.ts files cover navigation to Waste from the Dashboard.
 * This suite covers flows that remain untested:
 *
 *  1. Navigating to Waste from Investments — sidebar rename is consistent from non-Dashboard tabs
 *  2. Navigating to Waste from Budgets — sidebar rename is consistent from non-Dashboard tabs
 *  3. fDate state initialisation — form date re-initialises to the selected month when the
 *     form is opened after a month switch (verifies `useState` initial value logic)
 *  4. Waste tab search is case-insensitive (e.g. "FOOD" matches "Food" category rows)
 *  5. Month-switching while the add-expense form is open keeps the form visible
 *  6. The sidebar "Expenses" button is absent from every tab (not just Dashboard)
 */

test.describe('Waste tab — navigation from non-Dashboard tabs', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── 1. Investments → Waste ────────────────────────────────────────────────

  test('navigating Investments → Waste shows the Waste heading correctly', async ({ page }) => {
    const factory = new PageFactory(page);

    // Go to Investments first
    await page.getByRole('button', { name: 'Investments' }).click();
    await expect(page.getByRole('heading', { name: 'Investments', level: 2 })).toBeVisible();

    // Now navigate to Waste via the sidebar
    await factory.waste().sidebarButton.click();

    // The Waste tab must render correctly
    await expect(factory.waste().heading).toBeVisible();
    await expect(factory.waste().heading).toHaveText('Waste');

    // Transaction table must be populated (January is default month)
    const rowCount = await factory.waste().tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  // ── 2. Budgets → Waste ────────────────────────────────────────────────────

  test('navigating Budgets → Waste shows the Waste heading and all 4 month buttons', async ({ page }) => {
    const factory = new PageFactory(page);

    // Go to Budgets
    await page.getByRole('button', { name: 'Budgets' }).click();
    await expect(page.getByRole('heading', { name: 'Budgets', level: 2 })).toBeVisible();

    // Navigate to Waste
    await factory.waste().sidebarButton.click();
    await expect(factory.waste().heading).toBeVisible();

    // All 4 month buttons must be present in the Waste tab (Jan, Feb, Mar, Apr)
    for (const label of ['Jan', 'Feb', 'Mar', 'Apr']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
  });

  // ── 3. "Expenses" sidebar button is absent from Investments and Budgets tabs ──

  test('"Expenses" button is absent from the sidebar when Investments tab is active', async ({ page }) => {
    await page.getByRole('button', { name: 'Investments' }).click();
    await expect(page.getByRole('heading', { name: 'Investments', level: 2 })).toBeVisible();

    // The old "Expenses" label must not exist anywhere in the sidebar
    await expect(page.getByRole('button', { name: 'Expenses', exact: true })).toHaveCount(0);
  });

  test('"Expenses" button is absent from the sidebar when Budgets tab is active', async ({ page }) => {
    await page.getByRole('button', { name: 'Budgets' }).click();
    await expect(page.getByRole('heading', { name: 'Budgets', level: 2 })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Expenses', exact: true })).toHaveCount(0);
  });
});

test.describe('Waste tab — form state and search edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.waste().navigate();
    await expect(factory.waste().heading).toBeVisible();
  });

  // ── 4. Search is case-insensitive ─────────────────────────────────────────

  test('search input is case-insensitive — uppercase query matches rows', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Search with all-uppercase category name
    await waste.search('FOOD');

    const filteredCount = await waste.tableRows.count();
    expect(filteredCount).toBeGreaterThan(0);

    // Every visible row should contain "Food" (case-insensitive match)
    for (let i = 0; i < filteredCount; i++) {
      await expect(waste.tableRows.nth(i)).toContainText('Food');
    }
  });

  // ── 5. Month switch while add-expense form is open ────────────────────────

  test('switching months while the add-expense form is open keeps the form visible', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Open the form
    await waste.openAddExpenseForm();
    await expect(page.getByText('New Expense')).toBeVisible();

    // Switch to March — form should stay open
    await waste.selectMonth('Mar');

    // The form must still be visible after the month switch
    await expect(page.getByText('New Expense')).toBeVisible();
    await expect(waste.formDescriptionInput).toBeVisible();
    await expect(waste.formAmountInput).toBeVisible();
  });

  // ── 6. fDate re-initialises to the selected month when form is opened ──────

  test('add-expense form date defaults to selected month when form is first opened', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Switch to March before opening the form
    await waste.selectMonth('Mar');
    await expect(page.getByRole('button', { name: 'Mar', exact: true })).toHaveClass(/text-emerald-400/);

    // Open the form — the initial fDate is set from selectedMonth at render time
    await waste.openAddExpenseForm();

    const dateInput = page.locator('input[type="date"]');
    const dateValue = await dateInput.inputValue();

    // The date must be in March 2026 (initial useState value uses selectedMonth)
    expect(dateValue).toMatch(/^2026-03-/);
  });

  // ── 7. Submitting an expense in April updates the April transaction list ───

  test('adding an expense in April increases the April row count by 1', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Switch to April
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    const baseCount = await waste.tableRows.count();
    expect(baseCount).toBeGreaterThan(0);

    // Submit a new expense for April
    await waste.openAddExpenseForm();
    await page.locator('input[type="date"]').fill('2026-04-12');
    await waste.addExpense('April Test Expense', '29.99', 'Entertainment');

    // Form closes after save
    await expect(page.getByText('New Expense')).not.toBeVisible();

    // April list must have one more row
    await expect(waste.tableRows).toHaveCount(baseCount + 1);
  });
});
