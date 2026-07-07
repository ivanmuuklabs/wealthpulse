import { test, expect } from '@playwright/test';
import { PageFactory } from './pages/PageFactory';

test('contact form requires email and shows 48 years on valid submission', async ({ page }) => {
  const factory = new PageFactory(page);
  const candyMapper = factory.candyMapper();

  // 1. Navigate to the website
  await candyMapper.goto();

  // 2. Close the pop-up modal using the "X" button
  await candyMapper.closeModal();

  // 3. Enter a name into the contact field
  await candyMapper.fillName('John Doe');

  // 4. Click Submit without an email
  await candyMapper.clickSubmit();

  // 5. Verify that an email is required
  await expect(page.getByText(/email.*required/i)).toBeVisible();

  // 6. Enter a valid email address
  await candyMapper.fillEmail('johndoe@example.com');

  // 7. Click Submit again
  await candyMapper.clickSubmit();

  // 8. Verify "48 years" appears on screen
  await expect(page.getByText(/48 years/i)).toBeVisible();
});
