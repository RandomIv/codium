import { Page, expect } from '@playwright/test';

export const generateUser = () => {
  const uniqueId = Date.now();
  return {
    name: `TestUser_${uniqueId}`,
    email: `user_${uniqueId}@test.com`,
    password: 'Password123!',
  };
};

export async function registerAndLogin(page: Page) {
  const user = generateUser();

  await page.goto('/register');
  await page.getByLabel('Username').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/problems/);

  return user;
}
