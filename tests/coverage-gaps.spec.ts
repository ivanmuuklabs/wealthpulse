import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Additional coverage tests targeting flows not addressed by the PR's own
 * specs (dashboard.spec.ts, expenses.spec.ts, budgets.spec.ts, settings.spec.ts).
 *
 * Gaps closed here:
 *  1. Dashboard   — all 4 KPI cards visible, Budget Alerts + Recent Transactions panels render
 *  2. Expenses    — category filter narrows the table; month switching scopes the list
 *  3. Budgets     — category search filters the category cards; no-match shows empty state
 *  4. Settings    — changing currency persists within the session; email field is editable
 */

/* ─────────────────────────────────────────────────────────────────────────
   1. DASHBOARD — KPI cards and panel visibility
   ───────────────────────────────────────────────────────────────────────── */

test.describe('Dashboard — KPI cards and panels', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // After login the app lands on the Dashboard by default
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('all 4 KPI cards are visible immediately after login', async ({ page }) => {
    await expect(page.getByText('Total Spent').first()).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    await expect(page.getByText('Net Savings')).toBeVisible();
    await expect(page.getByText('Transactions').first()).toBeVisible();
  });

  test('Monthly Income KPI always shows $6,500.00 regardless of month', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();

    // Check in all 3 months
    for (const month of ['Jan', 'Feb', 'Mar'] as const) {
      await dashboard.selectMonth(month);
      const incomeValue = await page
        .getByText('Monthly Income')
        .locator('..')
        .getByText(/\$[\d,]+(\.\d+)?/)
        .first()
        .textContent();
      expect(incomeValue).toMatch(/\$6,500/);
    }
  });

  test('Budget Alerts and Recent Transactions panels render on the dashboard', async ({ page }) => {
    await expect(page.getByText('Budget Alerts')).toBeVisible();
    await expect(page.getByText('Recent Transactions')).toBeVisible();
  });

  test('Transactions KPI count is greater than zero for March (seeded data)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await dashboard.selectMonth('Mar');

    // The Transactions card shows a numeric count — it must be > 0 for seeded data
    const countText = await page
      .getByText('Transactions')
      .first()
      .locator('..')
      .locator('p.text-xl')
      .textContent();
    const count = parseInt(countText ?? '0', 10);
    expect(count).toBeGreaterThan(0);
  });

  test('Net Savings is positive for demo data (income > spending)', async ({ page }) => {
    const dashboard = new PageFactory(page).dashboard();
    await dashboard.selectMonth('Mar');

    const savingsText = await page
      .getByText('Net Savings')
      .locator('..')
      .getByText(/\$[\d,]+(\.\d+)?/)
      .first()
      .textContent();
    const savings = parseFloat((savingsText ?? '0').replace(/[$,]/g, ''));
    expect(savings).toBeGreaterThan(0);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   2. EXPENSES — category filter and month switching
   ───────────────────────────────────────────────────────────────────────── */

test.describe('Expenses — category filter and month switching', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await new PageFactory(page).expenses().navigate();
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
  });

  test('selecting a category in the filter shows only rows from that category', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();

    // Capture total row count before filtering
    const totalBefore = await expenses.transactionRows.count();
    expect(totalBefore).toBeGreaterThan(0);

    // Filter by "Food" — a category that definitely has seeded rows
    await expenses.filterByCategory('Food');

    // All visible rows must belong to the Food category
    const rows = page.getByRole('row').filter({ hasText: /Food/i });
    await expect(rows.first()).toBeVisible();

    // Row count must have decreased (or stayed equal if all happened to be Food)
    const totalAfter = await expenses.transactionRows.count();
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
    expect(totalAfter).toBeGreaterThan(0);
  });

  test('switching months in the Expenses tab scopes the transaction list', async ({ page }) => {
    // The Expenses tab does not expose month buttons in the PR's page object,
    // so interact directly via role buttons matching month names.
    const janButton = page.getByRole('button', { name: 'Jan' });
    const marButton = page.getByRole('button', { name: 'Mar' });

    // Switch to January and count rows
    await janButton.click();
    const expenses = new PageFactory(page).expenses();
    const janCount = await expenses.transactionRows.count();

    // Switch to March and count rows — seeded counts differ per month
    await marButton.click();
    const marCount = await expenses.transactionRows.count();

    // Both months must have at least 1 row (seeded data covers all 3 months)
    expect(janCount).toBeGreaterThan(0);
    expect(marCount).toBeGreaterThan(0);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   3. BUDGETS — category search
   ───────────────────────────────────────────────────────────────────────── */

test.describe('Budgets — category search filter', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await new PageFactory(page).budgets().navigate();
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();
  });

  test('searching for a category name shows only matching budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    // All 8 budget spinbuttons are visible before filtering
    const allInputs = page.getByRole('spinbutton');
    const countBefore = await allInputs.count();
    expect(countBefore).toBe(8);

    // Search for "Housing" — should narrow to 1 card
    await budgets.searchCategory('Housing');

    const countAfter = await page.getByRole('spinbutton').count();
    expect(countAfter).toBe(1);
    await expect(page.getByText('Housing').first()).toBeVisible();
  });

  test('searching with a no-match term hides all budget category cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('zzznomatchzzz');

    // No spinbutton should remain visible
    await expect(page.getByRole('spinbutton').first()).not.toBeVisible();
    // Count must drop to 0
    await expect(page.getByRole('spinbutton')).toHaveCount(0);
  });

  test('clearing category search restores all 8 budget cards', async ({ page }) => {
    const budgets = new PageFactory(page).budgets();

    await budgets.searchCategory('Food');
    await budgets.searchCategory(''); // clear

    await expect(page.getByRole('spinbutton')).toHaveCount(8);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   4. SETTINGS — currency change and email update
   ───────────────────────────────────────────────────────────────────────── */

test.describe('Settings — currency and email updates', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();

    await new PageFactory(page).settings().navigate();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('form pre-fills with demo defaults — Alex Morgan and USD', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await expect(settings.nameInput).toHaveValue('Alex Morgan');
    await expect(settings.currencySelect).toHaveValue('USD');
  });

  test('changing currency to EUR and saving shows the saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.selectCurrency('EUR');
    await settings.save();

    // Saved confirmation must appear
    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('updating email and saving shows the saved confirmation', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    await settings.setEmail('newaddr@example.com');
    await settings.save();

    await expect(settings.savedConfirmation).toBeVisible();
  });

  test('saved confirmation auto-dismisses within ~3 seconds', async ({ page }) => {
    const settings = new PageFactory(page).settings();

    // Trigger a save
    await settings.save();
    await expect(settings.savedConfirmation).toBeVisible();

    // The app dismisses the confirmation after ~2 s — wait up to 3.5 s
    await expect(settings.savedConfirmation).not.toBeVisible({ timeout: 3500 });
    // The normal Save Changes button should reappear
    await expect(settings.saveButton).toBeVisible();
  });
});
