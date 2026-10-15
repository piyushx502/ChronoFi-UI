import { test, expect } from '@playwright/test';

test('Verify simplified titles and monochrome styling on Profile tab', async ({ page }) => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzkyNjE3MTAyfQ.FVYmKeQuBnqOrUghZIXhOgqjJA5s1FJ_XN-kcp7jnBI';
  await page.setViewportSize({ width: 1440, height: 1080 });

  // Load Profile page
  await page.goto(`http://localhost:3000/dashboard/profile?token=${token}`);
  await page.waitForTimeout(2500);

  // Verify header has single word 'Profile'
  const header = page.locator('h1');
  await expect(header).toHaveText('Profile');

  // Verify section headers have single words
  await expect(page.getByRole('heading', { name: 'Personal', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Income', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Expenses', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assets', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Liabilities', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Goals', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Assumptions', exact: true })).toBeVisible();

  // Take viewport screenshot
  await page.screenshot({
    path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/profile_simplified_monochrome.png',
  });

  // Take full page screenshot
  await page.screenshot({
    path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/profile_simplified_monochrome_full.png',
    fullPage: true,
  });
});
