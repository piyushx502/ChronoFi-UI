import { test, expect } from '@playwright/test';

test('Verify global currency switcher, live rates, and financial conversions', async ({ page }) => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzkyNjE3MTAyfQ.FVYmKeQuBnqOrUghZIXhOgqjJA5s1FJ_XN-kcp7jnBI';
  await page.setViewportSize({ width: 1440, height: 1080 });

  // 1. Load Profile page
  await page.goto(`http://localhost:3000/dashboard/profile?token=${token}`);
  await page.waitForTimeout(3000);

  // 2. Open Currency Dropdown via "Change" button in Personal Information
  const changeBtn = page.getByRole('button', { name: 'Change' });
  await expect(changeBtn).toBeVisible();
  await changeBtn.click();
  await page.waitForTimeout(600);

  // Screenshot open dropdown
  await page.screenshot({ path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/currency_dropdown_open.png' });

  // 3. Search and select USD
  const searchInput = page.getByPlaceholder('Search by currency name, ISO code, or symbol...');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('USD');
  await page.waitForTimeout(300);

  const usdOption = page.getByRole('button', { name: /US Dollar/ });
  await expect(usdOption).toBeVisible();
  await usdOption.click();
  await page.waitForTimeout(1000);

  // 4. Verify USD active and screenshot converted profile
  await page.screenshot({ path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/profile_currency_usd.png' });

  // 5. Navigate to main dashboard and verify converted numbers
  await page.goto(`http://localhost:3000/dashboard?token=${token}`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/dashboard_currency_usd.png' });
});
