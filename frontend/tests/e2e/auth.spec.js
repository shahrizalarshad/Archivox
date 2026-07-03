import { test, expect } from '@playwright/test';

test.describe('ArchiVox Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.btn-auth-trigger');
  });

  test('should open auth modal, register, and close it', async ({ page }) => {
    // 1. Click 'Log Masuk / Daftar Arkitek'
    const authTrigger = page.locator('.btn-auth-trigger');
    await authTrigger.click();

    // 2. Verify modal opens
    const modal = page.locator('.auth-modal');
    await expect(modal).toBeVisible();

    // 3. Switch to Register mode
    const registerSwitch = page.locator('.btn-auth-switch', { hasText: 'Daftar Sekarang' });
    await registerSwitch.click();
    await expect(page.locator('.auth-header h2')).toHaveText('Daftar Akaun Arkitek');

    // 4. Fill form (we can intercept network requests here so it doesn't hit real DB, or just test UI)
    await page.route('**/api/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Test Architect', email: 'test@archivox.com' },
          access_token: 'fake-token-123'
        })
      });
    });

    await page.fill('input[placeholder="Masukkan nama penuh..."]', 'Test Architect');
    await page.fill('input[type="email"]', 'test@archivox.com');
    await page.fill('input[type="password"]', 'secretpassword');

    // 5. Submit form
    const submitBtn = page.locator('.btn-auth-submit');
    await submitBtn.click();

    // 6. Verify success toast and modal closes
    const toast = page.locator('.go3958317564'); // react-hot-toast class
    // Or just check if the user name appears in sidebar
    await expect(modal).toBeHidden();
    
    const userInfo = page.locator('.user-info-box');
    await expect(userInfo).toContainText('Halo, Test Architect!');
  });
});
