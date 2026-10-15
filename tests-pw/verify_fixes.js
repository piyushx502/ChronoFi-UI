const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzkyNjE3MTAyfQ.FVYmKeQuBnqOrUghZIXhOgqjJA5s1FJ_XN-kcp7jnBI';
  await page.goto(`http://localhost:3000/dashboard/profile?token=${token}`);
  await page.waitForTimeout(2500);

  // 1. Test header currency dropdown (top right)
  const headerCurrencyBtn = page.getByTitle('Change Global Display Currency');
  if (await headerCurrencyBtn.isVisible()) {
    await headerCurrencyBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/currency_header_no_search.png'
    });
    // Close it
    await headerCurrencyBtn.click();
    await page.waitForTimeout(300);
  }

  // 2. Test Occupation dropdown
  const occCard = page.getByTitle('Click to select occupation');
  if (await occCard.isVisible()) {
    await occCard.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/occupation_dropdown_clean.png'
    });
    // Close it
    await page.keyboard.press('Escape');
    await occCard.click();
    await page.waitForTimeout(300);
  }

  // 3. Test Retirement Age dropdown
  const retCard = page.getByTitle('Click to select retirement age');
  if (await retCard.isVisible()) {
    await retCard.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'C:/Users/Carcass/.gemini/antigravity/brain/fe015e67-885f-4259-a8c2-a0017472eeb6/retirement_age_dropdown_clean.png'
    });
  }

  await browser.close();
  console.log("All screenshots captured successfully.");
})();
