import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

/**
 * Functional tests for the Settings tab.
 *
 * The "Save Changes" button persists the user's profile information to
 * the in-memory app state and shows a transient confirmation label.
 * This test covers the previously untested save-profile flow.
 */

test.describe('Settings — profile management', () => {
  test.beforeEach(async ({ page }) => {
    const factory = new PageFactory(page);
    await factory.login().goto();
    await factory.login().loginAsDemo();
  });

  // Test (counted as test 5 for this day's run — see also dashboard & expenses specs)
  // Note: index numbering continues from the worker plan; this is the 5th new test
  test('saving an updated display name shows the confirmation and reflects in the header avatar', async ({ page }) => {
    const settings = new PageFactory(page).settings();
    await settings.navigate();

    // Clear and update the Full Name field
    await settings.fullNameInput.fill('');
    await settings.fullNameInput.fill('Jordan Lee');

    // Save
    await settings.saveButton.click();

    // The button text transitions to "✓ Saved!" briefly, confirming persistence
    await expect(settings.savedConfirmation).toBeVisible();

    // The avatar in the top-right of the header should now show "JL" (initials)
    await expect(page.locator('header button').filter({ hasText: /^JL$/ })).toBeVisible();
  });
});
