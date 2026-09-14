import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Test 2 — Expenses: add expense form
 *
 * Gap addressed: The Expenses tab has a prominent "Add Expense" button and form
 * that allows users to log new spending. No existing test exercises this core
 * user action. This test verifies that submitting the form adds a new row to
 * the transaction table and that the row is immediately visible.
 */
test.describe('Expenses — add expense', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  test('adding a new expense appends it to the transaction table', async ({ page }) => {
    const expenses = new PageFactory(page).expenses();
    await expenses.navigate();

    // Count how many rows exist before we add one
    const rowsBefore = await page.locator('table tbody tr').count();

    // Open the add form and fill in a unique description so we can assert its presence
    await expenses.openAddForm();
    await expect(page.getByPlaceholder('Description')).toBeVisible();

    await page.getByPlaceholder('Description').fill('Test Grocery Run');
    await page.getByPlaceholder('Amount').fill('42.50');
    // Leave category at its default (Food) and click Save
    await page.getByRole('button', { name: 'Save' }).click();

    // The form should close (Save button no longer visible at top of page)
    await expect(page.getByPlaceholder('Description')).not.toBeVisible();

    // The new row should appear in the table
    await expect(page.getByText('Test Grocery Run')).toBeVisible();

    // Row count should have increased by exactly 1
    const rowsAfter = await page.locator('table tbody tr').count();
    expect(rowsAfter).toBe(rowsBefore + 1);
  });
});
