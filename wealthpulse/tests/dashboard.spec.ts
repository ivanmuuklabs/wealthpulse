import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test.beforeEach(async ({ page }) => {
  const factory = new PageFactory(page);
  await factory.login().goto();
  await factory.login().loginAsDemo();
  // Dashboard is the default landing page after login — no extra navigation needed
});

// Happy Path — Switching months updates all KPI cards on the Dashboard
test('switching months on the Dashboard updates the KPI cards', async ({ page }) => {
  const dashboard = new PageFactory(page).dashboard();

  // Default landing month is March — confirm the KPI cards are visible
  await expect(dashboard.monthlyIncomeCard).toBeVisible();
  await expect(dashboard.totalSpentCard).toBeVisible();
  await expect(dashboard.netSavingsCard).toBeVisible();
  await expect(dashboard.transactionsCard).toBeVisible();

  // Capture March's Total Spent value
  const marchSpentText = await dashboard.getTotalSpentText();

  // Switch to January
  await dashboard.selectMonth('Jan');

  // All KPI cards remain visible after the switch
  await expect(dashboard.monthlyIncomeCard).toBeVisible();
  await expect(dashboard.totalSpentCard).toBeVisible();
  await expect(dashboard.netSavingsCard).toBeVisible();
  await expect(dashboard.transactionsCard).toBeVisible();

  // January's Total Spent value should differ from March's
  const janSpentText = await dashboard.getTotalSpentText();
  expect(janSpentText).not.toBe(marchSpentText);

  // Switch to February and verify cards still render
  await dashboard.selectMonth('Feb');
  await expect(dashboard.totalSpentCard).toBeVisible();

  // Switch back to March and confirm values match the original reading
  await dashboard.selectMonth('Mar');
  const marchAgainText = await dashboard.getTotalSpentText();
  expect(marchAgainText).toBe(marchSpentText);
});
