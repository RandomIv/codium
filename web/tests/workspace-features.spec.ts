import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/auth';

const problemSlug = 'two-sum';

test.describe('Workspace UI Features', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('Language switcher changes syntax highlighting', async ({ page }) => {
    await page.goto(`/problems/${problemSlug}`);

    await expect(page.locator('.monaco-editor')).toContainText(
      'function twoSum',
    );

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Python' }).click();

    await expect(page.locator('.monaco-editor')).toContainText('def twoSum');
  });

  test('Reset code button restores starter template', async ({ page }) => {
    await page.goto(`/problems/${problemSlug}`);

    await page.locator('.monaco-editor').first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.insertText('console.log("Broken code");');

    await expect(page.locator('.monaco-editor')).not.toContainText(
      'function twoSum',
    );

    page.on('dialog', (dialog) => dialog.accept());

    await page.locator('button:has(.lucide-rotate-ccw)').click();

    await expect(page.locator('.monaco-editor')).toContainText(
      'function twoSum',
    );
  });
});
