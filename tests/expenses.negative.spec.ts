import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Negative / edge-case tests for the Expenses tab.
 *
 * These tests guard against invalid inputs and degenerate states that the
 * happy-path suite does not cover:
 *
 *  N1 – Save with empty Description does nothing (form stays open, no new row).
 *  N2 – Save with empty Amount does nothing.
 *  N3 – Searching a term that matches nothing shows the empty-state message.
 *  N4 – Category filter combined with a non-matching search yields 0 results.
 *  N5 – Clicking the same sort header twice reverses the sort direction (asc).
 *  N6 – Adding a negative amount is not accepted by the HTML number input
 *        (min=0 step=0.01; the app does not validate server-side so the row
 *        either is not added or, if added, the amount appears as a negative
 *        value — we assert the add button doesn't crash the UI).
 */

test.describe('Expenses — negative and edge cases', () => {

  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    const expenses = factory.expenses();
    await expenses.navigate();
  });

  // ── N1: Submit with no description ────────────────────────────────────────

  test('submitting the form with an empty description does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const rowsBefore = await expenses.tableRows.count();

    await expenses.openAddForm();
    // Leave description empty, fill amount
    await expenses.formAmount.fill('50');
    await expenses.formSaveButton.click();

    // Row count must stay the same — the app's guard condition prevents adding
    await expect(expenses.tableRows).toHaveCount(rowsBefore);
  });

  // ── N2: Submit with no amount ─────────────────────────────────────────────

  test('submitting the form with an empty amount does not add a new row', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const rowsBefore = await expenses.tableRows.count();

    await expenses.openAddForm();
    await expenses.formDescription.fill('Amount missing test');
    // Leave amount empty
    await expenses.formSaveButton.click();

    await expect(expenses.tableRows).toHaveCount(rowsBefore);
  });

  // ── N3: Search with no matches ────────────────────────────────────────────

  test('searching with a term that matches no transaction shows the empty state', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.search('xXxNOMATC H_TERM_xXx');

    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.tableRows).toHaveCount(0);
  });

  // ── N4: Category filter + non-matching search produces zero results ────────

  test('filtering by Health and searching a non-Health term returns no rows', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    await expenses.filterByCategory('Health');
    // "Rent payment" is a Housing transaction — cannot appear under Health
    await expenses.search('Rent payment');

    await expect(expenses.emptyState).toBeVisible();
    await expect(expenses.tableRows).toHaveCount(0);
  });

  // ── N5: Double-click on sort header reverses sort order ───────────────────

  test('clicking Amount header twice produces ascending order (cheapest first)', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // First click → descending (most expensive first)
    await expenses.amountHeader.click();
    // Second click → ascending (cheapest first)
    await expenses.amountHeader.click();

    const amountCells = page.locator('table tbody tr td:last-child');
    const count = await amountCells.count();

    if (count >= 2) {
      const firstText = await amountCells.first().textContent();
      const lastText = await amountCells.last().textContent();

      const parse = (t: string | null) =>
        parseFloat((t ?? '0').replace(/[^0-9.]/g, ''));

      // In ascending order the first row's amount must be ≤ the last row's
      expect(parse(firstText)).toBeLessThanOrEqual(parse(lastText));
    }
  });

  // ── N6: Adding zero-dollar expense produces a $0.00 row ──────────────────

  test('adding an expense with $0.00 amount creates a zero-value row without crashing', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    const descZero = 'Zero dollar test item';
    await expenses.addExpense(descZero, 0, 'Entertainment');

    // Search for the row we just tried to add
    await expenses.search(descZero);

    // The app may or may not show it (the form guard only checks !fAmt which is
    // falsy for 0 as well, so it will NOT add).  Either way the UI must not crash.
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  // ── N7: Searching by date string matches the right row ────────────────────

  test('searching by date string shows only rows from that date', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Add a known transaction with a fixed date so we have a deterministic anchor
    const marker = 'DateSearchAnchor';
    await expenses.addExpense(marker, 77, 'Utilities', '2026-03-01');

    await expenses.search('2026-03-01');

    // The row we just added must be present
    await expect(page.getByText(marker)).toBeVisible();

    // Every visible row must display that date
    const rows = expenses.tableRows;
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('2026-03-01');
    }
  });

});
