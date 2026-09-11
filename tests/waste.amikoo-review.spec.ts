import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Amikoo QA review — gap tests for PR #13 ("Rename Expenses section to Waste").
 *
 * The existing waste.*.spec.ts suites give excellent coverage of the rename,
 * month selector, navigation, sorting, filtering, and form submission flows.
 *
 * This file targets three specific behavioral gaps that remain uncovered:
 *
 *  GAP 1 — fDate stickiness when the form is open across a month switch
 *    The add-expense form captures `selectedMonth` via `useState` initial value
 *    at component mount. Once the form is visible, switching months does NOT
 *    update `fDate`. If a user opens the form in January, switches to April, and
 *    clicks Save — the expense will be filed for January (because fDate still
 *    holds "2026-01-15"). This is a real UX gotcha introduced by the new April
 *    month button.
 *
 *  GAP 2 — Search matches transaction descriptions (not just category names)
 *    The filter function searches `t.description.toLowerCase().includes(q)` as
 *    well as category and date. The existing search tests only verify category-
 *    name matching (e.g. "Food"). Description-based search is untested.
 *
 *  GAP 3 — Search matches dates (ISO string substring match)
 *    The filter also checks `t.date.includes(q)`, so typing "2026-04" into the
 *    search box filters to April transactions. This is a non-obvious behaviour
 *    not documented by any existing test.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared login helper
// ─────────────────────────────────────────────────────────────────────────────

async function loginAndGoToWaste(page: Parameters<typeof PageFactory>[0]) {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await factory.waste().navigate();
  await expect(factory.waste().heading).toBeVisible();
  return factory;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAP 1 — fDate stickiness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — fDate stickiness (GAP 1, PR #13)', () => {
  /**
   * The ExpensesTab component initialises fDate with:
   *   useState(`2026-${String(selectedMonth+1).padStart(2,"0")}-15`)
   *
   * Because `useState` captures the initial value only once (at component
   * mount), fDate does NOT change when `selectedMonth` is later updated via
   * a MonthButton click. This means:
   *
   *  - Open the form in January → fDate = "2026-01-15"
   *  - Switch to April (form stays open) → fDate is still "2026-01-15"
   *  - Submitting saves the expense in January, not April.
   *
   * This suite documents the current (sticky) behaviour. If the product later
   * adds a useEffect to sync fDate with selectedMonth, these tests will catch
   * the change.
   */

  test('fDate retains its original value when the month is switched while the form is open', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // Open the form in January (switch to Jan first to ensure a known month)
    await waste.selectMonth('Jan');
    await expect(page.getByRole('button', { name: 'Jan', exact: true })).toHaveClass(/text-emerald-400/);

    await waste.openAddExpenseForm();

    const dateInput = page.locator('input[type="date"]');
    const initialDate = await dateInput.inputValue();

    // Date should be in January
    expect(initialDate).toMatch(/^2026-01-/);

    // Now switch to April — the form stays open (already tested elsewhere)
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    // fDate is still "2026-01-*" because useState does not re-run
    const dateAfterSwitch = await dateInput.inputValue();
    expect(dateAfterSwitch).toEqual(initialDate);
  });

  test('expense submitted while form was opened in Jan but month is Apr is filed in January', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // Open the form in January
    await waste.selectMonth('Jan');
    await waste.openAddExpenseForm();

    // Switch to April — form stays open, fDate still January
    await waste.selectMonth('Apr');

    // Record how many April rows exist before the submit
    const aprBaseCount = await waste.tableRows.count();

    // Submit the form without manually changing the date
    const uniqueDesc = 'AmikooStickyDateTest';
    await waste.addExpense(uniqueDesc, '25.00', 'Food');

    // The expense is dated January — so April count must NOT increase
    await expect(waste.tableRows).toHaveCount(aprBaseCount);

    // Switch to January — the expense should appear there
    await waste.selectMonth('Jan');
    await waste.search(uniqueDesc);
    // The row must be found in January (where fDate pointed)
    await expect(waste.tableRows).toHaveCount(1);
    await expect(waste.tableRows.first()).toContainText(uniqueDesc);

    // Clean up
    await waste.search('');
  });

  test('closing and reopening the form after a month switch picks up the new month in fDate', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // Open the form in January → fDate = 2026-01-15
    await waste.selectMonth('Jan');
    await waste.openAddExpenseForm();
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveValue(/^2026-01-/);

    // Close the form (toggle off)
    await waste.addExpenseButton.click();
    await expect(page.getByText('New Expense')).not.toBeVisible();

    // Switch to April
    await waste.selectMonth('Apr');

    // Reopen the form — the component re-mounts and picks up April as the
    // new selectedMonth initial value
    await waste.openAddExpenseForm();
    const dateAfterReopen = await dateInput.inputValue();
    expect(dateAfterReopen).toMatch(/^2026-04-/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GAP 2 — Search matches descriptions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — description-based search (GAP 2, PR #13)', () => {
  /**
   * The filter function in ExpensesTab also checks t.description:
   *   list = list.filter(t =>
   *     t.description.toLowerCase().includes(q) ||
   *     t.category.toLowerCase().includes(q) ||
   *     t.date.includes(q)
   *   );
   *
   * Existing tests only exercise category-name matching (e.g. "Food").
   * These tests exercise description-based filtering.
   */

  test('searching by a description substring filters rows to matching transactions only', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // First, add a transaction with a unique description so we can search for it
    await waste.openAddExpenseForm();
    const uniqueDesc = 'CoffeeBeanDescSearch';
    await waste.addExpense(uniqueDesc, '7.50', 'Food');

    // Now search for the unique description
    await waste.search('CoffeeBeanDescSearch');

    const filteredCount = await waste.tableRows.count();
    expect(filteredCount).toBe(1);
    await expect(waste.tableRows.first()).toContainText(uniqueDesc);
  });

  test('description search is case-insensitive', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // Add a transaction with a mixed-case description
    await waste.openAddExpenseForm();
    const desc = 'MixedCaseDescTest';
    await waste.addExpense(desc, '10.00', 'Shopping');

    // Search with all-lowercase
    await waste.search('mixedcasedesctest');

    const count = await waste.tableRows.count();
    expect(count).toBe(1);
    await expect(waste.tableRows.first()).toContainText(desc);
  });

  test('a description search term that does not match any transaction shows the empty state', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // A unique description string that cannot appear in seeded data
    await waste.search('ZZZ_NO_DESC_MATCH_99999');

    await expect(waste.emptyState).toBeVisible();
    await expect(waste.tableRows).toHaveCount(1); // empty-state row counts as 1 <tr>
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GAP 3 — Search matches dates (ISO substring)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — date-based search (GAP 3, PR #13)', () => {
  /**
   * The filter checks `t.date.includes(q)` (plain string contains).
   * Seeded transaction dates are in YYYY-MM-DD format. Typing "2026-04"
   * into the search box therefore matches only April transactions (month 3).
   *
   * This is a non-obvious feature that is completely untested. It gives users
   * a way to filter by month/date without using the month-selector buttons.
   */

  test('typing a year-month prefix into the search box filters to that month\'s transactions', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // Start on April (seeded data for month index 3)
    await waste.selectMonth('Apr');
    const aprNaturalCount = await waste.tableRows.count();
    expect(aprNaturalCount).toBeGreaterThan(0);

    // Switch to January so all 4 months' data is technically accessible via search
    // (search is applied to the ACTIVE month's transactions only, not all months)
    // This confirms the search is scoped to the current month filter.
    await waste.selectMonth('Jan');
    const janNaturalCount = await waste.tableRows.count();
    expect(janNaturalCount).toBeGreaterThan(0);

    // Search for "2026-01" — should match January transactions only (current month)
    await waste.search('2026-01');

    const searchCount = await waste.tableRows.count();
    expect(searchCount).toBeGreaterThan(0);

    // Every visible row must have a date in January 2026
    const allRows = await waste.tableRows.all();
    for (const row of allRows) {
      const dateCellText = await row.locator('td').first().textContent();
      expect(dateCellText?.trim()).toMatch(/^2026-01-/);
    }
  });

  test('date search term "2026-04" on the April view matches all visible transactions', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // Navigate to April and count rows
    await waste.selectMonth('Apr');
    const aprCount = await waste.tableRows.count();
    expect(aprCount).toBeGreaterThan(0);

    // Search for the April year-month prefix
    await waste.search('2026-04');

    // All April rows have dates starting with "2026-04", so count should be unchanged
    const filteredCount = await waste.tableRows.count();
    expect(filteredCount).toBe(aprCount);

    // Confirm every row is in April
    const allRows = await waste.tableRows.all();
    for (const row of allRows) {
      const dateCellText = await row.locator('td').first().textContent();
      expect(dateCellText?.trim()).toMatch(/^2026-04-/);
    }
  });

  test('date search term "2026-03" on the April view shows the empty state (cross-month isolation)', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    // Navigate to April
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    // Search for March — no April transaction dates start with "2026-03"
    await waste.search('2026-03');

    // All April rows are dated 2026-04-*, so none should match
    await expect(waste.emptyState).toBeVisible();
  });

  test('clearing a date search string restores the full transaction list', async ({ page }) => {
    const factory = await loginAndGoToWaste(page);
    const waste = factory.waste();

    await waste.selectMonth('Jan');
    const baseCount = await waste.tableRows.count();

    // Apply a date search
    await waste.search('2026-01');

    // Clear it
    await waste.search('');

    // Full list is restored
    await expect(waste.tableRows).toHaveCount(baseCount);
  });
});
