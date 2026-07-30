import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();

  const investmentsPage = factory.investments();
  await investmentsPage.navigate();
});

// Happy Path — Select funds on Fund Cards tab and view comparison chart
test('selecting funds on Fund Cards then switching to Compare renders the chart', async ({ page }) => {
  const investmentsPage = new PageFactory(page).investments();

  // All fund cards should be visible on load
  await expect(investmentsPage.fundCards.first()).toBeVisible();

  // Select the first two fund cards
  await investmentsPage.selectFundCard(0);
  await investmentsPage.selectFundCard(1);

  // Both should now show the "Selected" badge
  await expect(investmentsPage.selectedBadges).toHaveCount(2);

  // Navigate to the Compare sub-tab
  await investmentsPage.goToSubTab('Compare');

  // The empty-state message should NOT be shown
  await expect(investmentsPage.compareEmptyState).not.toBeVisible();

  // The comparison chart should be rendered
  await expect(investmentsPage.comparisonChart).toBeVisible();
});
