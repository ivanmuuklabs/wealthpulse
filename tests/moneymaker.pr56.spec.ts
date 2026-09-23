import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Tests generated for PR #56 — "Rename Investments section to MoneyMaker".
 *
 * Two changes were introduced:
 *   1. Sidebar button label: "Investments" → "MoneyMaker"  (App.jsx ~L257)
 *   2. Tab <h2> heading:    "Investments" → "MoneyMaker"  (App.jsx ~L711)
 *
 * 3 happy-path tests confirm the primary success flows work under the new name.
 * 3 negative tests confirm the old "Investments" label is completely gone and
 * that the section cannot be reached via the stale label.
 */

// ---------------------------------------------------------------------------
// Shared setup — log in before each test
// ---------------------------------------------------------------------------
test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  // Guard: we are inside the app
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

// ===========================================================================
// HAPPY-PATH TESTS
// ===========================================================================

test.describe('MoneyMaker rename — happy-path', () => {
  test(
    'HP-1: sidebar shows "MoneyMaker" button and navigating to it renders the section heading',
    async ({ page }) => {
      const factory = new PageFactory(page);
      const moneyMakerBtn = page.getByRole('button', { name: 'MoneyMaker' });

      // The renamed sidebar button must be visible and clickable
      await expect(moneyMakerBtn).toBeVisible();
      await factory.investments().navigate(); // uses /moneymaker/i internally

      // The section heading must reflect the new name
      await expect(
        page.getByRole('heading', { name: 'MoneyMaker' })
      ).toBeVisible();
    }
  );

  test(
    'HP-2: fund search still works after the rename — matching cards are shown',
    async ({ page }) => {
      const factory = new PageFactory(page);
      const investments = factory.investments();

      // Navigate via the renamed sidebar button
      await investments.navigate();

      // Default Fund Cards sub-tab should load with at least one card
      await expect(investments.fundCards.first()).toBeVisible();

      // Searching for a common fund keyword should return ≥1 result
      await investments.searchFunds('fund');
      await expect(investments.fundCards).not.toHaveCount(0);
    }
  );

  test(
    'HP-3: MoneyMaker sidebar button becomes active after navigation and is correctly highlighted',
    async ({ page }) => {
      const factory = new PageFactory(page);
      await factory.investments().navigate();

      const moneyMakerBtn = page.getByRole('button', { name: 'MoneyMaker' });

      // Active sidebar item must carry the emerald highlight class
      await expect(moneyMakerBtn).toHaveClass(/text-emerald-400/);

      // The section heading must be visible — confirming navigation succeeded
      await expect(
        page.getByRole('heading', { name: 'MoneyMaker' })
      ).toBeVisible();
    }
  );
});

// ===========================================================================
// NEGATIVE TESTS
// ===========================================================================

test.describe('MoneyMaker rename — negative / regression', () => {
  test(
    'NEG-1: no sidebar button labelled "Investments" exists after the rename',
    async ({ page }) => {
      // The old label must have been completely removed from the sidebar.
      // Using exact: false so we also catch partial matches like "My Investments".
      const oldLabel = page.getByRole('button', { name: /investments/i });
      await expect(oldLabel).toHaveCount(0);
    }
  );

  test(
    'NEG-2: no page heading labelled "Investments" appears anywhere after navigating to MoneyMaker',
    async ({ page }) => {
      const factory = new PageFactory(page);
      await factory.investments().navigate();

      // Neither the sidebar nor the tab heading should contain the old name
      await expect(
        page.getByRole('heading', { name: /investments/i })
      ).toHaveCount(0);

      // Double-check the h2 specifically shows the new name
      await expect(
        page.getByRole('heading', { name: 'MoneyMaker' })
      ).toBeVisible();
    }
  );

  test(
    'NEG-3: searching for "Investments" as a fund term returns no fund cards (old label is gone)',
    async ({ page }) => {
      const factory = new PageFactory(page);
      const investments = factory.investments();

      await investments.navigate();

      // "Investments" should not be present as a fund name either —
      // verifying the rename did not leave stale text that could confuse users.
      await investments.searchFunds('Investments');
      await expect(investments.fundCards).toHaveCount(0);
    }
  );
});
