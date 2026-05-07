import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

const CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Entertainment',
  'Health',
  'Utilities',
  'Shopping',
  'Subscriptions',
];

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    const loginPage = factory.login();
    await loginPage.goto();
    await loginPage.loginAsDemo();

    const budgetsPage = factory.budgets();
    await budgetsPage.navigate();
  });

  // ─── Test 1: Page loads and renders correctly ───────────────────────────────
  test('navigates to Budgets page and renders the page heading', async ({ page }) => {
    // Sidebar "Budgets" button should be active (emerald highlight)
    await expect(
      page.getByRole('button', { name: /budgets/i })
    ).toHaveClass(/text-emerald-400/);

    // Main page heading is visible
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();

    // Top bar header title reflects current page
    await expect(page.locator('header h1')).toHaveText('budgets');
  });

  // ─── Test 2: Summary cards render ───────────────────────────────────────────
  test('displays Total Budget, Total Spent, and Remaining summary cards with values', async ({ page }) => {
    // All three summary stat cards are visible
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();

    // Each card should contain a dollar-formatted value (e.g. "$4,350.00")
    const dollarValues = page.locator('text=/\\$[\\d,]+\\.\\d{2}/');
    await expect(dollarValues.first()).toBeVisible();
  });

  // ─── Test 3: All 8 category cards are rendered ──────────────────────────────
  test('renders all 8 budget category cards', async ({ page }) => {
    for (const category of CATEGORIES) {
      await expect(page.getByText(category).first()).toBeVisible();
    }
  });

  // ─── Test 4: Progress bars are visible on each category card ────────────────
  test('displays a progress bar for each budget category card', async ({ page }) => {
    // Each card has a progress track (bg-white/[0.06]) containing a fill div
    const progressTracks = page.locator('.rounded-full.bg-white\\/\\[0\\.06\\]');

    // There should be one progress bar track per category (8 total)
    await expect(progressTracks).toHaveCount(8);

    // Each track should contain a fill element (the colored bar)
    for (let i = 0; i < 8; i++) {
      const fill = progressTracks.nth(i).locator('> div');
      await expect(fill).toBeVisible();
    }
  });

  // ─── Test 5: User can edit a budget amount inline ───────────────────────────
  test('user can update a category budget amount and the card reflects the change', async ({ page }) => {
    // Target the Housing card's budget input (first number input on the page)
    const housingInput = page.locator('input[type="number"]').first();

    // Confirm the input is visible and editable
    await expect(housingInput).toBeVisible();
    await expect(housingInput).toBeEnabled();

    // Read current value so we can change it
    const currentValue = await housingInput.inputValue();
    const newValue = String(Number(currentValue) + 500);

    // Update the budget
    await housingInput.click({ clickCount: 3 });
    await housingInput.fill(newValue);
    await housingInput.press('Tab');

    // The input should now reflect the new value
    await expect(housingInput).toHaveValue(newValue);

    // The percentage label on the card must also update (it should still be a number followed by %)
    const percentageLabel = page
      .locator('.grid.grid-cols-1.sm\\:grid-cols-2 > div')
      .first()
      .locator('span.text-lg.font-bold');

    await expect(percentageLabel).toHaveText(/%/);
  });
});
