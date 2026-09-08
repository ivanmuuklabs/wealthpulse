import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Waste tab — add-expense form validation and month data isolation.
 *
 * Gaps not covered by the other waste.*.spec.ts files:
 *
 *  1. Partial form guard: submitting with description filled but amount
 *     empty must not add a new row (handleAdd checks !fDesc || !fAmt).
 *  2. Partial form guard: submitting with amount filled but description
 *     empty must not add a new row.
 *  3. Month data isolation: a transaction added in January must NOT
 *     appear when the view is switched to April.
 *  4. Month data isolation: a transaction added in April must NOT
 *     appear when the view is switched to January.
 *
 * These tests complement waste.features.spec.ts (which tests the fully-empty
 * form case) and waste.cross-tab-nav.spec.ts (which tests April count but
 * not cross-month visibility).
 */

test.describe('Waste tab — add-expense partial form validation', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.waste().navigate();
    await expect(factory.waste().heading).toBeVisible();
  });

  // ── 1. Description filled, amount empty ───────────────────────────────────

  test('submitting with description filled but amount empty does not add a row', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    const baseCount = await waste.tableRows.count();

    // Open the form, fill description but leave amount empty
    await waste.openAddExpenseForm();
    await waste.formDescriptionInput.fill('Partial entry — no amount');
    // Ensure amount is truly empty (clear in case of a default)
    await waste.formAmountInput.clear();

    await waste.formSaveButton.click();

    // Row count must not increase — the guard should reject the submission
    await expect(waste.tableRows).toHaveCount(baseCount);

    // Form should stay open (no successful save)
    await expect(page.getByText('New Expense')).toBeVisible();
  });

  // ── 2. Amount filled, description empty ───────────────────────────────────

  test('submitting with amount filled but description empty does not add a row', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    const baseCount = await waste.tableRows.count();

    // Open form, fill amount but leave description blank
    await waste.openAddExpenseForm();
    await waste.formDescriptionInput.clear();
    await waste.formAmountInput.fill('99.99');

    await waste.formSaveButton.click();

    // Row count must remain the same
    await expect(waste.tableRows).toHaveCount(baseCount);

    // Form stays open
    await expect(page.getByText('New Expense')).toBeVisible();
  });
});

test.describe('Waste tab — month data isolation (PR #13)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.waste().navigate();
    await expect(factory.waste().heading).toBeVisible();
  });

  // ── 3. January transaction does not appear in April ───────────────────────

  test('a transaction added in January does not appear in the April view', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Switch to January and record the baseline count
    await waste.selectMonth('Jan');
    await expect(page.getByRole('button', { name: 'Jan', exact: true })).toHaveClass(/text-emerald-400/);
    const janBaseline = await waste.tableRows.count();

    // Add a uniquely-named transaction for January
    const uniqueDesc = 'Amikoo Jan Isolation Test';
    await waste.openAddExpenseForm();
    // Ensure the date is in January
    await page.locator('input[type="date"]').fill('2026-01-20');
    await waste.addExpense(uniqueDesc, '15.00', 'Food');

    // The new row appears in January
    await expect(waste.tableRows).toHaveCount(janBaseline + 1);

    // Switch to April — the Jan-dated row must NOT appear there
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    // Search for the unique description to confirm it is absent
    await waste.search(uniqueDesc);
    await expect(waste.emptyState).toBeVisible();

    // Clear search before test ends
    await waste.search('');
  });

  // ── 4. April transaction does not appear in January ───────────────────────

  test('a transaction added in April does not appear in the January view', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Switch to April and record the baseline count
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);
    const aprBaseline = await waste.tableRows.count();

    // Add a uniquely-named transaction for April
    const uniqueDesc = 'Amikoo Apr Isolation Test';
    await waste.openAddExpenseForm();
    // Ensure the date is in April
    await page.locator('input[type="date"]').fill('2026-04-15');
    await waste.addExpense(uniqueDesc, '42.00', 'Entertainment');

    // The new row appears in April
    await expect(waste.tableRows).toHaveCount(aprBaseline + 1);

    // Switch to January — the Apr-dated row must NOT appear there
    await waste.selectMonth('Jan');
    await expect(page.getByRole('button', { name: 'Jan', exact: true })).toHaveClass(/text-emerald-400/);

    // Search for the unique description to confirm it is absent in January
    await waste.search(uniqueDesc);
    await expect(waste.emptyState).toBeVisible();

    // Clear search
    await waste.search('');
  });

  // ── 5. Seeded April data is present (generator regression guard) ──────────

  test('April has seeded transactions from the transaction generator', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Switch to April — the generator now produces data for month index 3
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    // The seeded data covers all 8 categories × at least 1 transaction each
    // so the total count must be well above 0
    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Each visible row must have a date in April 2026
    // (spot-check the first row to confirm the month filter is working)
    const firstRowDate = await waste.tableRows.first().locator('td').first().textContent();
    expect(firstRowDate?.trim()).toMatch(/^2026-04-/);
  });
});
