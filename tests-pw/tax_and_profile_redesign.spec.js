import { test, expect } from '@playwright/test';

test.use({ channel: 'msedge' });

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzkyNjE3MTAyfQ.FVYmKeQuBnqOrUghZIXhOgqjJA5s1FJ_XN-kcp7jnBI';

test('Verify Simplified Profile Expenses & Redesigned Tax Calculator', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // --- PART 1: Profile Page Simplified Expenses & Currency Dropdown ---
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto(`http://localhost:3000/dashboard/profile?token=${token}`);
  await page.waitForTimeout(2500);

  // Take screenshot of simplified expenses and incomes
  await page.screenshot({
    path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/profile_simplified_expenses.png'
  });

  const cashFlowCard = page.locator('text=Cash Flow').locator('..').locator('..').first();
  if (await cashFlowCard.isVisible()) {
    await cashFlowCard.screenshot({
      path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/profile_cashflow_closeup.png'
    });
  }

  // Open Currency dropdown in header to verify no search box and no status footer
  const currencyBtn = page.getByTitle('Change Global Display Currency');
  if (await currencyBtn.isVisible()) {
    await currencyBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/currency_dropdown_no_search_no_footer.png'
    });
    // Click again to close
    await currencyBtn.click();
    await page.waitForTimeout(300);
  }

  // --- PART 2: Tax Calculator Desktop Layout ---
  await page.goto(`http://localhost:3000/dashboard/tax?token=${token}`);
  await page.waitForTimeout(2500);

  // Desktop view screenshot
  await page.screenshot({
    path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/tax_calculator_desktop.png',
    fullPage: true
  });

  // Test recalculation flow with a custom salary
  const salaryInput = page.getByPlaceholder('e.g. 1500000');
  await expect(salaryInput).toBeVisible();
  await salaryInput.fill('2200000');
  
  const recalculateBtn = page.getByRole('button', { name: 'Recalculate Tax' });
  await recalculateBtn.click();
  await page.waitForTimeout(1500);

  // Verify recalculated desktop view screenshot
  await page.screenshot({
    path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/tax_calculator_recalculated_desktop.png',
    fullPage: true
  });

  // Test Capital Gains Drawdown Tab (Budget 2024)
  const drawdownTab = page.getByRole('button', { name: /Capital Gains Drawdown/i });
  await expect(drawdownTab).toBeVisible();
  await drawdownTab.click();
  await page.waitForTimeout(1500);

  // Verify Drawdown tab renders with no errors
  await page.screenshot({
    path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/tax_drawdown_tab_verified.png',
    fullPage: true
  });

  // --- PART 3: Tax Calculator Tablet Layout (768px) ---
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/tax_calculator_tablet.png',
    fullPage: true
  });

  // --- PART 4: Tax Calculator Mobile Layout (375px) ---
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/tax_calculator_mobile.png',
    fullPage: true
  });
});
