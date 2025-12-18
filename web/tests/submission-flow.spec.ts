import { test, expect } from '@playwright/test';
import { registerAndLogin } from './utils/auth';

const problemSlug = 'two-sum';

test.describe('Submission & Judge Flow', () => {
  test.slow();

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(`/problems/${problemSlug}`);
    await page.locator('.monaco-editor').waitFor();
  });

  test('Should execute correct solution and display "Accepted"', async ({
    page,
  }) => {
    const editorLines = page.locator('.monaco-editor .view-lines');
    await editorLines.first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace', { delay: 1000 });

    const correctCode = `var solution = function(nums, target) {
      return [0, 1];
  `;
    await page.keyboard.insertText(correctCode);

    const runButton = page.getByRole('button', { name: /Submit/i });
    await runButton.click();

    const resultTabTrigger = page.getByRole('tab', { name: /Test Result/i });
    await resultTabTrigger.click();

    const activePanel = page.locator('[role="tabpanel"][data-state="active"]');
    await expect(activePanel).toContainText('ACCEPTED', { timeout: 30000 });
    await expect(activePanel).toContainText(/ms/);
  });

  test('Should handle compilation errors gracefully', async ({ page }) => {
    const editorLines = page.locator('.monaco-editor .view-lines');
    await editorLines.first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace', { delay: 1000 });
    await page.keyboard.insertText(
      'function solution( { return "syntax error"}',
    );

    const runButton = page.getByRole('button', { name: /Submit/i });
    await runButton.click();

    const resultTabTrigger = page.getByRole('tab', { name: /Test Result/i });
    await resultTabTrigger.click();

    const activePanel = page.locator('[role="tabpanel"][data-state="active"]');
    await expect(activePanel).toContainText(/SyntaxError|Unexpected|Error/i, {
      timeout: 20000,
    });
  });

  test('Test Console Tabs interaction', async ({ page }) => {
    const casesTabTrigger = page.getByRole('tab', { name: /Test Cases/i });
    await expect(casesTabTrigger).toBeVisible();
    await casesTabTrigger.click();

    const case1Tab = page.getByRole('tab', { name: 'Case 1' });
    const case2Tab = page.getByRole('tab', { name: 'Case 2' });

    if (await case1Tab.isVisible()) {
      await case1Tab.click();
      const activePanel = page.locator(
        '[role="tabpanel"][data-state="active"]',
      );
      await expect(activePanel).toContainText('Input:');
    }

    if (await case2Tab.isVisible()) {
      await case2Tab.click();
      await expect(case2Tab).toHaveAttribute('data-state', 'active');
    }
  });
});
