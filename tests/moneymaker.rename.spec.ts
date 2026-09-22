import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Regression tests for the Investments → MoneyMaker rename (PR #56).
 *
 * Changes covered:
 *  - Sidebar nav button label changed from "Investments" to "MoneyMaker"
 *  - InvestmentsTab <h2> heading changed from "Investments" to "MoneyMaker"
 *  - InvestmentsPage.navigate() now targets the "MoneyMaker" button
 */

test.describe('MoneyMaker rename — sidebar & heading', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
    // Wait until the app shell is ready
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  // ─── Happy-path tests ────────────────────────────────────────────────────────

  test('HP-1 | sidebar shows a "MoneyMaker" nav button after login', async ({ page }) => {
    // The renamed sidebar item must be immediately visible without any click
    const moneyMakerButton = page.getByRole('button', { name: /moneymaker/i });
    await expect(moneyMakerButton).toBeVisible();
  });

  test('HP-2 | clicking MoneyMaker in the sidebar loads the MoneyMaker heading', async ({ page }) => {
    // Navigate using the page object (which already targets the renamed button)
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.navigate();

    // The tab heading must display "MoneyMaker", confirming both sidebar click
    // and JSX heading were updated consistently
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('HP-3 | MoneyMaker sidebar button becomes active (highlighted) when the tab is open', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.navigate();

    // Active sidebar items carry the emerald text highlight class
    const moneyMakerButton = page.getByRole('button', { name: /moneymaker/i });
    await expect(moneyMakerButton).toHaveClass(/text-emerald-400/);
  });

  // ─── Negative tests ──────────────────────────────────────────────────────────

  test('NEG-1 | no sidebar button labelled "Investments" exists after the rename', async ({ page }) => {
    // The old label must be completely absent — a stale "Investments" button would
    // mean the rename did not propagate to the sidebar items array
    await expect(page.getByRole('button', { name: 'Investments' })).toHaveCount(0);
  });

  test('NEG-2 | the MoneyMaker tab heading does NOT contain the old "Investments" text', async ({ page }) => {
    const investmentsPage = new PageFactory(page).investments();
    await investmentsPage.navigate();

    // The <h2> must show "MoneyMaker"; the old "Investments" h2 must be gone
    await expect(page.getByRole('heading', { name: 'Investments', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });

  test('NEG-3 | "Investments" label stays absent even after navigating away and back', async ({ page }) => {
    const factory = new PageFactory(page);
    const investmentsPage = factory.investments();

    // Navigate to MoneyMaker, then leave to another tab
    await investmentsPage.navigate();
    await page.getByRole('button', { name: 'Expenses' }).click();

    // Return to MoneyMaker via the renamed button
    await page.getByRole('button', { name: /moneymaker/i }).click();

    // After the round-trip the stale label must still not appear
    await expect(page.getByRole('button', { name: 'Investments' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'MoneyMaker' })).toBeVisible();
  });
});
