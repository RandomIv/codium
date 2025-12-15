import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/auth';

test.describe('Problems List Functionality', () => {
  test('User can search and filter problems', async ({ page }) => {
    await registerAndLogin(page);

    await expect(page).toHaveURL(/\/problems/);
    await expect(page.getByText('Two Sum')).toBeVisible();

    await page
      .getByPlaceholder('Search problems...')
      .fill('Super Mario Algorithm');
    await expect(
      page.getByText('No problems found matching your search'),
    ).toBeVisible();

    await page.getByPlaceholder('Search problems...').fill('Two Sum');
    await expect(page.getByText('Two Sum')).toBeVisible();
    await expect(page.getByText('No problems found')).not.toBeVisible();
  });
});
