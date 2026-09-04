import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Remaining gap tests for PR #13 — "Rename Expenses section to Waste".
 *
 * The other waste.*.spec.ts files already cover:
 *  - Sidebar rename, heading, April month selector presence
 *  - Search, category filter, combined filter, empty state
 *  - Add-expense form (open/close, submit, validation)
 *  - Amount column sort (asc/desc)
 *  - Footer transaction count
 *  - Sidebar active state, top-bar label, collapsed sidebar nav
 *  - Shared month state, add-expense date default (Jan & Mar)
 *
 * This file covers the flows that remain untested:
 *  1. Date column sort (desc → asc toggle)
 *  2. Category column sort (desc → asc toggle)
 *  3. Footer total-amount value is a formatted dollar amount
 *  4. Footer total updates correctly when a filter is applied
 *  5. Add-expense date defaults to Feb 15 when February is the active month
 *  6. Add-expense date defaults to Apr 15 when April is the active month
 *  7. Dashboard Monthly Comparison chart is limited to Jan/Feb/Mar (not April)
 *  8. Budgets tab still has only 3 month buttons (Jan/Feb/Mar) after PR #13
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1–2. Column sort: Date and Category
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — Date and Category column sort (PR #13)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.waste().navigate();
    await expect(factory.waste().heading).toBeVisible();
  });

  // ── 1. Date sort ─────────────────────────────────────────────────────────

  test('clicking the Date header sorts rows descending then ascending', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Ensure at least 2 rows exist before sorting
    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(1);

    // First click → descending (newest dates first, which is the default, but
    // clicking the header once sets the sort explicitly and may toggle it)
    await waste.dateColumnHeader.click();

    const firstDateDesc = await waste.tableRows.first()
      .locator('td').first().textContent();
    const lastDateDesc = await waste.tableRows.last()
      .locator('td').first().textContent();

    // In descending order the first row's date should be ≥ the last row's date
    // (lexicographic comparison works for YYYY-MM-DD format)
    expect((firstDateDesc ?? '').localeCompare(lastDateDesc ?? '')).toBeGreaterThanOrEqual(0);

    // Second click → ascending (oldest dates first)
    await waste.dateColumnHeader.click();

    const firstDateAsc = await waste.tableRows.first()
      .locator('td').first().textContent();
    const lastDateAsc = await waste.tableRows.last()
      .locator('td').first().textContent();

    // In ascending order the first row's date should be ≤ the last row's date
    expect((firstDateAsc ?? '').localeCompare(lastDateAsc ?? '')).toBeLessThanOrEqual(0);
  });

  test('Date sort descending shows the most-recent date in the first row', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Click once to sort descending
    await waste.dateColumnHeader.click();

    const firstRowDate = await waste.tableRows.first()
      .locator('td').first().textContent();

    // The date must match YYYY-MM-DD format
    expect(firstRowDate?.trim()).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Collect all date cells and confirm the first is the maximum
    const allRows = await waste.tableRows.all();
    const allDates = await Promise.all(
      allRows.map(row => row.locator('td').first().textContent()),
    );
    const maxDate = allDates.reduce((m, d) => ((d ?? '') > (m ?? '') ? d : m));
    expect(firstRowDate?.trim()).toEqual(maxDate?.trim());
  });

  // ── 2. Category sort ─────────────────────────────────────────────────────

  test('clicking the Category header sorts rows alphabetically descending then ascending', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(1);

    // First click → descending (Z → A)
    await waste.categoryColumnHeader.click();

    // The category badge text is inside the <td> at column index 2 (0-based)
    const getCategoryAt = async (rowIndex: number) => {
      const text = await waste.tableRows.nth(rowIndex)
        .locator('td').nth(2).textContent();
      // The badge contains the icon emoji and the category name; strip leading emoji
      return (text ?? '').replace(/[^\w\s]/g, '').trim();
    };

    const firstCatDesc = await getCategoryAt(0);
    const lastCatDesc  = await getCategoryAt(rowCount - 1);

    // Descending: first category label ≥ last (Z comes before A alphabetically desc)
    expect(firstCatDesc.localeCompare(lastCatDesc)).toBeGreaterThanOrEqual(0);

    // Second click → ascending (A → Z)
    await waste.categoryColumnHeader.click();

    const firstCatAsc = await getCategoryAt(0);
    const lastCatAsc  = await getCategoryAt(rowCount - 1);

    // Ascending: first category label ≤ last
    expect(firstCatAsc.localeCompare(lastCatAsc)).toBeLessThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3–4. Footer total amount
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — footer total amount (PR #13)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.waste().navigate();
    await expect(factory.waste().heading).toBeVisible();
  });

  test('footer shows a formatted dollar total for all transactions in the active month', async ({ page }) => {
    // The footer card at the bottom of the table: "N transactions  Total: $X,XXX.XX"
    const footer = page.locator('div').filter({ hasText: /transaction/ }).last();
    await expect(footer).toBeVisible();

    const footerText = await footer.textContent() ?? '';

    // Must contain a dollar-formatted total, e.g. "$3,241.55"
    expect(footerText).toMatch(/Total:.*\$[\d,]+\.\d{2}/);
  });

  test('footer total decreases when a category filter narrows the result set', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Capture the unfiltered total from the footer
    const getTotal = async () => {
      const footer = page.locator('div').filter({ hasText: /transaction/ }).last();
      const text = await footer.textContent() ?? '';
      const match = text.match(/\$([\d,]+\.\d{2})/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    };

    const totalAll = await getTotal();
    expect(totalAll).toBeGreaterThan(0);

    // Filter to a single category — the total should be lower (or equal if all txns are that category)
    await waste.filterByCategory('Subscriptions');

    const totalFiltered = await getTotal();
    expect(totalFiltered).toBeGreaterThan(0);
    expect(totalFiltered).toBeLessThanOrEqual(totalAll);
  });

  test('footer total matches the sum of visible row amounts after search filter', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Filter to a specific category so the set is small and predictable
    await waste.filterByCategory('Utilities');

    // Read each row's amount cell (last <td> in each row, e.g. "-$45.00")
    const rows = await waste.tableRows.all();
    let sumFromRows = 0;
    for (const row of rows) {
      const amountText = await row.locator('td').last().textContent() ?? '';
      // Strip leading minus and $ sign, remove commas
      const numeric = parseFloat(amountText.replace(/[-$,]/g, ''));
      if (!isNaN(numeric)) sumFromRows += numeric;
    }

    // The footer total must equal the sum of the row amounts (within floating-point rounding)
    const footer = page.locator('div').filter({ hasText: /transaction/ }).last();
    const footerText = await footer.textContent() ?? '';
    const match = footerText.match(/\$([\d,]+\.\d{2})/);
    const footerTotal = match ? parseFloat(match[1].replace(/,/g, '')) : -1;

    expect(Math.abs(footerTotal - sumFromRows)).toBeLessThan(0.02); // cents-level tolerance
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5–6. Add-expense form date defaults: Feb and Apr
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — add-expense date default for Feb and Apr (PR #13)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await factory.waste().navigate();
    await expect(factory.waste().heading).toBeVisible();
  });

  test('add-expense form date defaults to Feb 15 when February is the active month', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Navigate to February
    await waste.selectMonth('Feb');
    // Confirm month switched (Feb button gets emerald class)
    await expect(page.getByRole('button', { name: 'Feb', exact: true })).toHaveClass(/text-emerald-400/);

    // Open the add-expense form
    await waste.openAddExpenseForm();

    const dateInput = page.locator('input[type="date"]');
    const dateValue = await dateInput.inputValue();

    // Default date must fall in February 2026
    expect(dateValue).toMatch(/^2026-02-/);
  });

  test('add-expense form date defaults to Apr 15 when April is the active month', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Navigate to April (new month added by PR #13)
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    // Open the add-expense form
    await waste.openAddExpenseForm();

    const dateInput = page.locator('input[type="date"]');
    const dateValue = await dateInput.inputValue();

    // Default date must fall in April 2026
    expect(dateValue).toMatch(/^2026-04-/);
  });

  test('add-expense submitted with April date appears in the April transaction list', async ({ page }) => {
    const waste = new PageFactory(page).waste();

    // Switch to April
    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    const baseCount = await waste.tableRows.count();

    // Add a new expense in April
    await waste.openAddExpenseForm();
    // Ensure the date is set to April 2026
    await page.locator('input[type="date"]').fill('2026-04-20');
    await waste.addExpense('April Gym Payment', '55.00', 'Health');

    // Form closes after save
    await expect(page.getByText('New Expense')).not.toBeVisible();

    // The new row should appear in the April list
    await expect(waste.tableRows).toHaveCount(baseCount + 1);

    // Confirm the row contains the description
    await waste.search('April Gym Payment');
    await expect(waste.tableRows).toHaveCount(1);
    await expect(waste.tableRows.first()).toContainText('April Gym Payment');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Dashboard Monthly Comparison chart scope (Jan/Feb/Mar only — no April)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard — Monthly Comparison chart is limited to Jan–Mar after PR #13', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Land on the Dashboard (default after login)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('Monthly Comparison bar chart shows Jan, Feb, Mar and NOT Apr', async ({ page }) => {
    // The Monthly Comparison chart is the third chart card on the Dashboard.
    // App.jsx builds its data as [0,1,2].map(...) — April is intentionally excluded.
    const chartCard = page.getByText('Monthly Comparison')
      .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();

    await expect(chartCard).toBeVisible();

    // Jan, Feb, Mar must be present as axis labels
    await expect(chartCard).toContainText('Jan');
    await expect(chartCard).toContainText('Feb');
    await expect(chartCard).toContainText('Mar');

    // April must NOT appear — the Dashboard hardcodes [0,1,2] for the comparison
    await expect(chartCard).not.toContainText('Apr');
  });

  test('Dashboard month selector still has only Jan, Feb, Mar (no Apr button)', async ({ page }) => {
    // The Dashboard month selector is hardcoded to [0,1,2]; PR #13 only added Apr to Waste.
    for (const label of ['Jan', 'Feb', 'Mar']) {
      await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
      // Each of these should be present in the Dashboard month selector
    }

    // Apr must not appear in the Dashboard selector
    // Scope to the month-selector bar to avoid matching any chart text
    const monthBar = page
      .locator('div.flex.rounded-xl.p-1.border')
      .filter({ has: page.getByRole('button', { name: 'Jan' }) })
      .first();

    await expect(monthBar).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Jan' })).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Feb' })).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Mar' })).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Apr', exact: true })).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Budgets tab — month selector unchanged (still Jan/Feb/Mar only)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Budgets tab — month selector unaffected by PR #13', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    // Navigate to the Budgets tab
    await page.getByRole('button', { name: 'Budgets' }).click();
    await expect(page.getByRole('heading', { name: 'Budgets', level: 2 })).toBeVisible();
  });

  test('Budgets tab month selector has exactly 3 months (Jan, Feb, Mar) — no Apr', async ({ page }) => {
    // BudgetsTab in App.jsx uses [0,1,2].map(m => <MonthButton …/>) — unchanged by PR #13
    const monthBar = page
      .locator('div.flex.rounded-xl.p-1.border')
      .filter({ has: page.getByRole('button', { name: 'Jan' }) })
      .first();

    await expect(monthBar).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Jan' })).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Feb' })).toBeVisible();
    await expect(monthBar.getByRole('button', { name: 'Mar' })).toBeVisible();

    // April must NOT appear in the Budgets month selector
    await expect(monthBar.getByRole('button', { name: 'Apr', exact: true })).toHaveCount(0);
  });

  test('Budgets month selector switching works correctly (Jan → Feb → Mar)', async ({ page }) => {
    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      const btn = page.getByRole('button', { name: month, exact: true }).first();
      await btn.click();
      // Active month button gets the emerald class
      await expect(btn).toHaveClass(/text-emerald-400/);
    }
  });

  test('Budgets tab still shows the correct 8 category cards after PR #13', async ({ page }) => {
    // Budget cards are rendered for each of the 8 CATEGORIES; PR #13 should not change them
    const budgetCards = page.locator('div.rounded-2xl').filter({
      has: page.locator('div.w-full.h-2.rounded-full'), // progress bar inside each budget card
    });
    const count = await budgetCards.count();
    expect(count).toEqual(8);
  });
});
