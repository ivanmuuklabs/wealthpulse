import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Post-login sidebar smoke tests for PR #13 — "Rename Expenses section to Waste".
 *
 * auth.spec.ts verifies KPI cards after login but does not enumerate the sidebar
 * nav labels. This suite fills that gap: after login the sidebar must show the
 * five correct labels — Dashboard, Waste, Investments, Budgets, Settings — and
 * must NOT contain the old "Expenses" label anywhere.
 *
 * This is the most important regression guard for the rename: if a future change
 * reintroduces "Expenses" in the sidebar this test will catch it immediately.
 */

test.describe('Post-login sidebar — correct nav labels after PR #13 rename', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are inside the app before checking the sidebar
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── 1. All 5 expected nav labels are present ──────────────────────────────

  test('sidebar shows all 5 correct nav labels after login', async ({ page }) => {
    // Every expected nav item must be visible in the sidebar
    for (const label of ['Dashboard', 'Waste', 'Investments', 'Budgets', 'Settings']) {
      await expect(
        page.getByRole('button', { name: label, exact: true }),
      ).toBeVisible();
    }
  });

  // ── 2. "Expenses" label is completely absent ──────────────────────────────

  test('sidebar does NOT contain an "Expenses" button after the rename', async ({ page }) => {
    // The old label "Expenses" must no longer exist as a sidebar nav button
    await expect(
      page.getByRole('button', { name: 'Expenses', exact: true }),
    ).toHaveCount(0);
  });

  // ── 3. "Waste" is the second nav item (preserving the original position) ──

  test('"Waste" nav button appears in the second position in the sidebar', async ({ page }) => {
    // Sidebar buttons: Dashboard(0), Waste(1), Investments(2), Budgets(3), Settings(4)
    // We identify position by querying all sidebar nav buttons in DOM order.
    const sidebar = page.locator('aside');
    const navButtons = sidebar.getByRole('button').filter({
      // Exclude utility buttons (Collapse, Sign Out) by matching only known nav labels
      hasText: /^(Dashboard|Waste|Investments|Budgets|Settings)$/,
    });

    await expect(navButtons).toHaveCount(5);
    // The second button (index 1) must be "Waste"
    await expect(navButtons.nth(1)).toHaveText('Waste');
  });

  // ── 4. Navigating to each tab from the new sidebar labels works ───────────

  test('each renamed sidebar label navigates to the correct tab', async ({ page }) => {
    const expectedHeadings: Record<string, string> = {
      Waste:       'Waste',
      Investments: 'Investments',
      Budgets:     'Budgets',
      Settings:    'Settings',
    };

    for (const [label, heading] of Object.entries(expectedHeadings)) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(
        page.getByRole('heading', { name: heading, level: 2 }),
      ).toBeVisible();
    }

    // Return to Dashboard and confirm the Overview heading
    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── 5. Sidebar is consistent across page refreshes (state reset) ──────────

  test('after sign-out and sign-in the sidebar still shows "Waste" not "Expenses"', async ({ page }) => {
    const factory = new PageFactory(page);

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(factory.login().signInButton).toBeVisible();

    // Sign back in
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Sidebar must still use the renamed label
    await expect(
      page.getByRole('button', { name: 'Waste', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Expenses', exact: true }),
    ).toHaveCount(0);
  });
});
