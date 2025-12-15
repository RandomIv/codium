import { test, expect } from '@playwright/test';

const adminUser = {
  email: 'john@gmail.com',
  password: '12345678',
};

const problemData = {
  title: `Auto Test Problem ${Date.now()}`,
  description: '# Test Description\nAutomatically generated.',
  input: '[[1, 2], 3]',
  output: '[0, 1]',
};

test.describe('Admin Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(adminUser.email);
    await page.getByLabel('Password').fill(adminUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/problems/);
  });

  test('Create a new problem', async ({ page }) => {
    await page.goto('/admin/problems/create');

    await page.getByLabel('Problem Title').fill(problemData.title);
    await page.locator('textarea#description').fill(problemData.description);
    await page.getByLabel('JavaScript Template').fill('function solution() {}');
    await page.getByLabel('Python Template').fill('def solution(): pass');

    await page
      .locator('input[placeholder="e.g., [[2,7,11,15], 9]"]')
      .fill(problemData.input);
    await page
      .locator('input[placeholder="e.g., [0,1]"]')
      .fill(problemData.output);

    await page.getByRole('button', { name: 'Create Problem' }).click();

    await expect(page).toHaveURL(/\/problems/);

    await page.getByPlaceholder('Search problems...').fill(problemData.title);
    await expect(page.getByText(problemData.title)).toBeVisible();
  });
});
