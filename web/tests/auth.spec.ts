import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/auth';

test.describe('Authentication Flow', () => {
  test('Should register, login and see profile', async ({ page }) => {
    const user = await registerAndLogin(page);

    await page.goto('/profile');
    await expect(page.getByText(user.email)).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).click();

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
