import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/auth';

test.describe('Security & Access Control', () => {
  test('Regular user cannot access Admin pages', async ({ page }) => {
    await registerAndLogin(page);

    await page.goto('/admin/problems/create');

    await expect(page).toHaveURL(/\/problems/);
    await expect(page.getByText('Create New Problem')).not.toBeVisible();
  });

  test('Guest cannot access protected routes', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
