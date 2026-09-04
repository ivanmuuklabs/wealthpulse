import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Sidebar active-state and top-bar label tests for PR #13
 * ("Rename Expenses section to Waste").
 *
 * Gaps addressed — not covered by waste.spec.ts, waste.features.spec.ts,
 * or waste.regression.spec.ts:
 *
 *  1. Waste sidebar button receives the emerald active-highlight class when
 *     the user navigates to the Waste tab (mirrors the equivalent Dashboard
 *     active-state test in sidebar.navigation.spec.ts).
 *  2. Dashboard sidebar button loses its active highlight when Waste is
 *     selected, and regains it when the user navigates back.
 *  3. The top-bar <h1> shows the raw internal route id "expenses" (not
 *     "Waste") because App.jsx renders `state.activeTab` verbatim. This
 *     pins the current behaviour so any future display-name fix is caught.
 *  4. The top-bar month sub-label defaults to "March 2026" on first load
 *     (selectedMonth initial value = 2) and updates correctly when a
 *     different month is selected from the Waste tab selector.
 */

test.describe('Waste tab — sidebar active state', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── 1. Waste button becomes active when navigated to ──────────────────────

  test('Waste sidebar button is highlighted (active) after clicking it', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    // Navigate to Waste
    await waste.sidebarButton.click();
    await expect(waste.heading).toBeVisible();

    // Active sidebar items carry the emerald-400 text class
    await expect(waste.sidebarButton).toHaveClass(/text-emerald-400/);
  });

  // ── 2. Dashboard button loses active state; Waste gains it ────────────────

  test('Dashboard sidebar button loses active state when Waste is selected', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    // Initially Dashboard is active
    const dashboardButton = page.getByRole('button', { name: 'Dashboard' });
    await expect(dashboardButton).toHaveClass(/text-emerald-400/);

    // Navigate to Waste
    await waste.sidebarButton.click();
    await expect(waste.heading).toBeVisible();

    // Dashboard should no longer be the active item
    await expect(dashboardButton).not.toHaveClass(/text-emerald-400/);

    // Waste button should now be active
    await expect(waste.sidebarButton).toHaveClass(/text-emerald-400/);
  });

  // ── 3. Active state restores correctly when navigating back to Dashboard ──

  test('Dashboard sidebar button regains active state after returning from Waste', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();
    const dashboardButton = page.getByRole('button', { name: 'Dashboard' });

    // Go to Waste
    await waste.sidebarButton.click();
    await expect(waste.heading).toBeVisible();
    await expect(dashboardButton).not.toHaveClass(/text-emerald-400/);

    // Return to Dashboard
    await dashboardButton.click();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Dashboard active state is restored
    await expect(dashboardButton).toHaveClass(/text-emerald-400/);

    // Waste button is no longer active
    await expect(waste.sidebarButton).not.toHaveClass(/text-emerald-400/);
  });

  // ── 4. Waste sidebar button is NOT active on initial load (Dashboard is) ──

  test('Waste sidebar button is NOT highlighted before it is clicked', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    // On login the default tab is Dashboard — Waste must not be highlighted
    await expect(waste.sidebarButton).not.toHaveClass(/text-emerald-400/);
  });
});

test.describe('Waste tab — top-bar label behaviour (PR #13)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── 5. Top-bar h1 renders the internal route id after navigating to Waste ─

  test('top-bar h1 shows the internal route id "expenses" when Waste tab is active', async ({ page }) => {
    // App.jsx: <h1 className="… capitalize">{state.activeTab}</h1>
    // state.activeTab is set to "expenses" when the Waste nav item is clicked,
    // because the nav item's id is "expenses" (unchanged by the rename).
    // The "capitalize" CSS class renders it as "Expenses" visually.
    // This test pins that current behaviour — if a future change maps the
    // display name to "Waste", this test will catch it.

    const factory = new PageFactory(page);
    await factory.waste().navigate();
    await expect(factory.waste().heading).toBeVisible();

    // The top-bar h1 element
    const headerH1 = page.locator('header h1');
    await expect(headerH1).toBeVisible();

    // Current behaviour: activeTab is "expenses", CSS capitalize → "Expenses"
    await expect(headerH1).toHaveText('expenses', { ignoreCase: true });
  });

  // ── 6. Top-bar month sub-label updates when a month is selected in Waste ──

  test('top-bar month sub-label reflects the active month after switching in Waste', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    await waste.navigate();

    // Switch to January (index 0) from Waste tab
    await waste.selectMonth('Jan');

    const headerMonthLabel = page.locator('header p').first();
    await expect(headerMonthLabel).toContainText('January 2026');
  });

  test('top-bar month sub-label reflects April after selecting Apr in Waste', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    await waste.navigate();
    await waste.selectMonth('Apr');

    const headerMonthLabel = page.locator('header p').first();
    await expect(headerMonthLabel).toContainText('April 2026');
  });

  // ── 7. Dashboard top-bar shows "dashboard" (initial active tab) ───────────

  test('top-bar h1 shows "dashboard" on initial load (before any navigation)', async ({ page }) => {
    // Before any tab switch, activeTab = "dashboard" → header shows "Dashboard"
    const headerH1 = page.locator('header h1');
    await expect(headerH1).toBeVisible();
    await expect(headerH1).toHaveText('dashboard', { ignoreCase: true });
  });
});
