import { test, expect } from '@playwright/test';

test.describe('ArchiVox Tool Selection', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for canvas to load
    await page.waitForSelector('canvas');
  });

  test('should select blocks and update UI counter', async ({ page }) => {
    // 1. Find and click the 'Pilih' tool
    const selectTool = page.locator('.btn-tool', { hasText: 'Pilih' });
    await expect(selectTool).toBeVisible();
    await selectTool.click();
    
    // Check if the 'Pilih' tool is active
    await expect(selectTool).toHaveClass(/active/);

    // Verify instruction overlay updates
    const instructions = page.locator('.overlay-instructions');
    await expect(instructions).toContainText('Klik 2 blok berlainan untuk pilih rantau (Bounding Box)');

    // 2. Click the center of the main 3D canvas
    const canvas = page.locator('canvas').nth(1);
    const box = await canvas.boundingBox();
    
    // Click center
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    
    // Allow React state to update
    await page.waitForTimeout(500);

    // 3. Verify status counter updates to "1 blok dipilih"
    await expect(instructions).toContainText('1 blok dipilih');
    
    // 4. Click slightly to the right to select another block (Bounding Box mode)
    await page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2);
    
    await page.waitForTimeout(500);
    
    // Since it's bounding box, it should have > 1 blocks selected
    const statusText = await instructions.innerText();
    const match = statusText.match(/Status: (\d+) blok dipilih/);
    expect(match).not.toBeNull();
    
    const count = parseInt(match[1]);
    expect(count).toBeGreaterThan(1);
  });
});
