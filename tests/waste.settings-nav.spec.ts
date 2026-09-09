import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Settings → Waste navigation tests for PR #13 — "Rename Expenses section to Waste".
 *
 * waste.cross-tab-nav.spec.ts covers Investments→Waste and Budgets→Waste,
 * but the Settings tab was not exercised as a navigation source. These tests
 * fill that specific gap:
 *
 *  1. Navigating Settings → Waste shows the Waste heading correctly.
 *  2. The sidebar does not show an "Expenses" button when Settings is active.
 *  3. Navigating Waste → Settings → Waste round-trip preserves the Waste heading.
 */

test.describe('Waste tab — navigation from Settings tab (PR #13)', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Confirm we are inside the app before running each test
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ── 1. Settings → Waste navigation ──────────────────────────────────────────

  test('navigating Settings → Waste shows the Waste heading and transaction table', async ({ page }) => {
    const factory = new PageFactory(page);

    // Navigate to Settings first
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();

    // Navigate to Waste via the sidebar
    await factory.waste().sidebarButton.click();

    // Waste heading must render correctly after coming from Settings
    await expect(factory.waste().heading).toBeVisible();
    await expect(factory.waste().heading).toHaveText('Waste');

    // Transaction table must be populated (January is the default month)
    const rowCount = await factory.waste().tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  // ── 2. "Expenses" button is absent from sidebar when Settings is active ──────

  test('"Expenses" sidebar button is absent when the Settings tab is active', async ({ page }) => {
    // Navigate to Settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();

    // The old "Expenses" label must not exist in the sidebar in any tab context
    await expect(page.getByRole('button', { name: 'Expenses', exact: true })).toHaveCount(0);
  });

  // ── 3. Waste → Settings → Waste round-trip preserves the Waste heading ───────

  test('navigating Waste → Settings → Waste round-trip preserves the Waste heading', async ({ page }) => {
    const factory = new PageFactory(page);
    const waste = factory.waste();

    // Go to Waste first
    await waste.sidebarButton.click();
    await expect(waste.heading).toBeVisible();

    // Navigate to Settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings', level: 2 })).toBeVisible();

    // Navigate back to Waste
    await waste.sidebarButton.click();

    // The Waste heading must still be correct after the round-trip
    await expect(waste.heading).toBeVisible();
    await expect(waste.heading).toHaveText('Waste');

    // "Expenses" must not have reappeared
    await expect(page.getByRole('heading', { name: 'Expenses' })).toHaveCount(0);
  });
});
