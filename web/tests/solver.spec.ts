import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/auth';

const problemSlug = 'two-sum';

const correctCode = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
}
`;

test('User can solve a problem', async ({ page }) => {
  test.setTimeout(60000);

  await registerAndLogin(page);

  await page.goto(`/problems/${problemSlug}`);

  await page.locator('.monaco-editor').first().click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(correctCode);

  await page.getByRole('button', { name: 'Submit' }).click();

  await page.locator('text=Test Result').click();

  await expect(page.getByText('ACCEPTED').first()).toBeVisible({
    timeout: 30000,
  });
});
