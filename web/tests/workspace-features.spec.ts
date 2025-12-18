import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/auth';

const problemSlug = 'two-sum';

test.describe('Workspace UI Features', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('Language switcher changes syntax highlighting', async ({ page }) => {
    await page.goto(`/problems/${problemSlug}`);

    const editorLines = page.locator('.monaco-editor .view-lines');

    await expect(editorLines).toContainText('var solution = function');

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Python' }).click();

    await expect(editorLines).toContainText('def solution');
  });

  test('Reset code button restores starter template', async ({ page }) => {
    await page.goto(`/problems/${problemSlug}`);

    const editorLines = page.locator('.monaco-editor .view-lines');

    await editorLines.first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.insertText('console.log("Broken code");');

    await expect(editorLines).not.toContainText('var solution = function');

    page.on('dialog', (dialog) => dialog.accept());

    await page.locator('button:has(.lucide-rotate-ccw)').click();

    await expect(editorLines).toContainText('var solution = function');
  });
});
