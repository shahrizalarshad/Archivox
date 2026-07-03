# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: selection.spec.js >> ArchiVox Tool Selection >> should select blocks and update UI counter
- Location: tests/e2e/selection.spec.js:13:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.overlay-instructions')
Expected substring: "1 blok dipilih"
Received string:    "Panduan Navigasi🔲 Klik 2 blok berlainan untuk pilih rantau (Bounding Box)Status: 0 blok dipilih"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('.overlay-instructions')

```

```yaml
- heading "Panduan Navigasi" [level=3]
- paragraph: 🔲 Klik 2 blok berlainan untuk pilih rantau (Bounding Box)
- paragraph: "Status: 0 blok dipilih"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('ArchiVox Tool Selection', () => {
  4  |   
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Navigate to the app
  7  |     await page.goto('/');
  8  |     
  9  |     // Wait for canvas to load
  10 |     await page.waitForSelector('canvas');
  11 |   });
  12 | 
  13 |   test('should select blocks and update UI counter', async ({ page }) => {
  14 |     // 1. Find and click the 'Pilih' tool
  15 |     const selectTool = page.locator('.btn-tool', { hasText: 'Pilih' });
  16 |     await expect(selectTool).toBeVisible();
  17 |     await selectTool.click();
  18 |     
  19 |     // Check if the 'Pilih' tool is active
  20 |     await expect(selectTool).toHaveClass(/active/);
  21 | 
  22 |     // Verify instruction overlay updates
  23 |     const instructions = page.locator('.overlay-instructions');
  24 |     await expect(instructions).toContainText('Klik 2 blok berlainan untuk pilih rantau (Bounding Box)');
  25 | 
  26 |     // 2. Click the center of the main 3D canvas
  27 |     const canvas = page.locator('canvas').nth(1);
  28 |     const box = await canvas.boundingBox();
  29 |     
  30 |     // Click center
  31 |     await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  32 |     
  33 |     // Allow React state to update
  34 |     await page.waitForTimeout(500);
  35 | 
  36 |     // 3. Verify status counter updates to "1 blok dipilih"
> 37 |     await expect(instructions).toContainText('1 blok dipilih');
     |                                ^ Error: expect(locator).toContainText(expected) failed
  38 |     
  39 |     // 4. Click slightly to the right to select another block (Bounding Box mode)
  40 |     await page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2);
  41 |     
  42 |     await page.waitForTimeout(500);
  43 |     
  44 |     // Since it's bounding box, it should have > 1 blocks selected
  45 |     const statusText = await instructions.innerText();
  46 |     const match = statusText.match(/Status: (\d+) blok dipilih/);
  47 |     expect(match).not.toBeNull();
  48 |     
  49 |     const count = parseInt(match[1]);
  50 |     expect(count).toBeGreaterThan(1);
  51 |   });
  52 | });
  53 | 
```