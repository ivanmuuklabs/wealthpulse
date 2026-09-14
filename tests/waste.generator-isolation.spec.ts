import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Transaction generator isolation tests for PR #13
 * ("Rename Expenses section to Waste").
 *
 * PR #13 expands the transaction generator from [0,1,2] to [0,1,2,3], adding
 * April data. This suite verifies:
 *
 *  1. Jan, Feb, and Mar each still have transactions — the generator expansion
 *     did not inadvertently wipe or corrupt existing month data.
 *  2. All four months contain only transactions dated within that month —
 *     the month filter correctly isolates data (no April transactions bleed
 *     into Jan/Feb/Mar, and no Jan/Feb/Mar transactions bleed into April).
 *  3. The Waste tab total shown in the footer is a positive dollar amount for
 *     every month — confirming seeded amounts are non-zero across all 4 months.
 *  4. Switching through all 4 months in sequence does not crash the UI and
 *     keeps the Waste heading visible throughout.
 *
 * These tests complement waste.form-validation.spec.ts (which verifies April
 * has seeded data) by also guarding the existing months.
 */

/**
 * Login and navigate to the Waste tab.
 * Returns the WastePage instance for use in tests.
 */
async function loginAndGoToWaste(page: Parameters<typeof PageFactory>[0]) {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  const waste = factory.waste();
  await waste.navigate();
  await expect(waste.heading).toBeVisible();
  return waste;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. All four months have seeded transactions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — generator produces data for all 4 months (PR #13)', () => {
  test('January still has seeded transactions after the April addition', async ({ page }) => {
    const waste = await loginAndGoToWaste(page);

    await waste.selectMonth('Jan');
    await expect(page.getByRole('button', { name: 'Jan', exact: true })).toHaveClass(/text-emerald-400/);

    // The generator seeds at least 1 transaction per category per month (Housing=1)
    // so January must have well above 0 rows
    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('February still has seeded transactions after the April addition', async ({ page }) => {
    const waste = await loginAndGoToWaste(page);

    await waste.selectMonth('Feb');
    await expect(page.getByRole('button', { name: 'Feb', exact: true })).toHaveClass(/text-emerald-400/);

    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('March still has seeded transactions after the April addition', async ({ page }) => {
    const waste = await loginAndGoToWaste(page);

    await waste.selectMonth('Mar');
    await expect(page.getByRole('button', { name: 'Mar', exact: true })).toHaveClass(/text-emerald-400/);

    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('April has seeded transactions from the expanded generator', async ({ page }) => {
    const waste = await loginAndGoToWaste(page);

    await waste.selectMonth('Apr');
    await expect(page.getByRole('button', { name: 'Apr', exact: true })).toHaveClass(/text-emerald-400/);

    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Each month's rows contain only dates within that month
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — month filter shows only dates for the selected month', () => {
  /**
   * The generator sorts all transactions by date descending. The Waste tab
   * filters them by `t.date.startsWith(`2026-${pad(selectedMonth+1)}-`)`.
   * This suite verifies that no cross-month data leaks through.
   */

  for (const [label, prefix] of [
    ['Jan', '2026-01-'],
    ['Feb', '2026-02-'],
    ['Mar', '2026-03-'],
    ['Apr', '2026-04-'],
  ] as const) {
    test(`all visible rows in the ${label} view have dates starting with "${prefix}"`, async ({ page }) => {
      const waste = await loginAndGoToWaste(page);

      await waste.selectMonth(label);
      await expect(page.getByRole('button', { name: label, exact: true })).toHaveClass(/text-emerald-400/);

      const rowCount = await waste.tableRows.count();
      expect(rowCount).toBeGreaterThan(0);

      // Spot-check: every visible row's first <td> must start with the expected prefix
      const allRows = await waste.tableRows.all();
      for (const row of allRows) {
        const dateText = await row.locator('td').first().textContent();
        expect(dateText?.trim()).toMatch(new RegExp(`^${prefix.replace('-', '\\-')}`));
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Footer total is a positive dollar amount for every month
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — footer shows a positive total for all 4 months (PR #13)', () => {
  test('footer displays a non-zero dollar total for each of the 4 months', async ({ page }) => {
    const waste = await loginAndGoToWaste(page);

    const getFooterTotal = async (): Promise<number> => {
      const footer = page.locator('div').filter({ hasText: /transaction/ }).last();
      const text = await footer.textContent() ?? '';
      const match = text.match(/\$([\d,]+\.\d{2})/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    };

    for (const label of ['Jan', 'Feb', 'Mar', 'Apr'] as const) {
      await waste.selectMonth(label);
      await expect(page.getByRole('button', { name: label, exact: true })).toHaveClass(/text-emerald-400/);

      const total = await getFooterTotal();
      // Each month must have a positive spending total
      expect(total).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Cycling through all 4 months does not crash the UI
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Waste tab — cycling through all 4 months is stable (PR #13)', () => {
  test('switching Jan → Feb → Mar → Apr → Jan in sequence keeps the UI stable', async ({ page }) => {
    const waste = await loginAndGoToWaste(page);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Jan'] as const;

    for (const month of months) {
      await waste.selectMonth(month);
      await expect(page.getByRole('button', { name: month, exact: true })).toHaveClass(/text-emerald-400/);

      // The Waste heading must remain visible throughout
      await expect(waste.heading).toBeVisible();

      // The table must contain at least one row (seeded data guarantees this)
      const rowCount = await waste.tableRows.count();
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test('rapidly switching months does not leave a stale empty state', async ({ page }) => {
    const waste = await loginAndGoToWaste(page);

    // Click through all months quickly
    await waste.selectMonth('Apr');
    await waste.selectMonth('Jan');
    await waste.selectMonth('Mar');
    await waste.selectMonth('Feb');
    await waste.selectMonth('Apr');

    // After rapid switching, the UI must still be functional
    await expect(waste.heading).toBeVisible();
    await expect(waste.emptyState).not.toBeVisible();

    // The current month (Apr) must show its transactions
    const rowCount = await waste.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
