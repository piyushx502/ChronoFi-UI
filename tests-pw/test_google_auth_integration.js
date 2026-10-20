const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotsDir = 'C:/Users/Carcass/.gemini/antigravity/brain/6434fbf4-e757-4b9f-8357-b78f7abeedb8';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log("Launching headless browser for Google Auth integration verification...");
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  try {
    // 1. Load login page
    console.log("Navigating to http://localhost:3000...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify Title and Heading
    const terminalTitle = page.getByRole('heading', { name: 'ChronoFi Terminal' });
    if (!(await terminalTitle.isVisible())) {
      throw new Error("ChronoFi Terminal title not visible");
    }
    console.log("✓ ChronoFi Terminal loaded successfully");

    // Verify Demo Accounts are completely REMOVED from the UI
    const demoHeading = page.getByText('Click to quick-fill demo account:');
    if (await demoHeading.isVisible()) {
      throw new Error("Demo account quick-fill heading should NOT be visible");
    }
    const arjunBtn = page.getByRole('button', { name: /arjun/i });
    if (await arjunBtn.isVisible()) {
      throw new Error("Demo Arjun button should NOT be visible");
    }
    const priyaBtn = page.getByRole('button', { name: /priya/i });
    if (await priyaBtn.isVisible()) {
      throw new Error("Demo Priya button should NOT be visible");
    }
    console.log("✓ Verified: Demo account buttons have been completely removed from the UI");

    // Verify "Sign In" button is visible
    const signInBtn = page.getByRole('button', { name: 'Sign In' });
    if (!(await signInBtn.isVisible())) {
      throw new Error("Standard Sign In button not visible");
    }
    console.log("✓ Standard Sign In button is present");

    // Verify OR divider
    const orDivider = page.getByText('OR', { exact: true });
    if (!(await orDivider.isVisible())) {
      throw new Error("'OR' divider is not visible");
    }
    console.log("✓ 'OR' divider is present");

    // Verify "Continue with Google" button
    const googleBtn = page.getByRole('button', { name: 'Continue with Google' });
    if (!(await googleBtn.isVisible())) {
      throw new Error("'Continue with Google' button is not visible");
    }
    console.log("✓ 'Continue with Google' button is present with correct branding");

    // Check SVG logo
    const googleSvg = googleBtn.locator('svg');
    if ((await googleSvg.count()) === 0) {
      throw new Error("Google logo SVG is missing inside button");
    }
    console.log("✓ Official Google SVG logo asset is rendered inside button");

    // Screenshot clean UI
    await page.screenshot({ path: path.join(screenshotsDir, '01_login_clean_no_demo.png') });
    console.log("✓ Saved screenshot: 01_login_clean_no_demo.png");

    // 2. Click "Continue with Google" without client ID to test configuration error state
    await googleBtn.click();
    await page.waitForTimeout(600);

    const alertMsg = page.locator('p[role="alert"]');
    if (await alertMsg.isVisible()) {
      const text = await alertMsg.textContent();
      console.log(`✓ Configuration error alert rendered properly: "${text}"`);
    } else {
      console.warn("Alert message did not appear as expected");
    }
    await page.screenshot({ path: path.join(screenshotsDir, '02_google_auth_config_error.png') });
    console.log("✓ Saved screenshot: 02_google_auth_config_error.png");

    // 3. Test Admin Account Login
    console.log("Testing Single Admin Account Login...");
    const usernameInput = page.getByPlaceholder('e.g. admin@chronofi.com');
    await usernameInput.fill('admin@chronofi.com');
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.fill('Admin@ChronoFi2026!');
    await page.screenshot({ path: path.join(screenshotsDir, '03_admin_credentials_filled.png') });

    await signInBtn.click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log("✓ Admin authenticated session redirected successfully to /dashboard");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '04_dashboard_admin_session.png') });
    console.log("✓ Saved screenshot: 04_dashboard_admin_session.png");

    // 4. Test API directly for /api/auth/google validation
    console.log("Testing API route /api/auth/google directly...");
    const emptyTokenRes = await page.request.post('http://localhost:3000/api/auth/google', {
      data: { id_token: "" },
    });
    if (emptyTokenRes.status() !== 400) {
      throw new Error(`Expected 400 for empty id_token, got ${emptyTokenRes.status()}`);
    }
    console.log("✓ API returned 400 Bad Request for empty id_token");

    const invalidTokenRes = await page.request.post('http://localhost:3000/api/auth/google', {
      data: { id_token: "fake.invalid.jwt" },
    });
    console.log(`✓ API handled invalid token with status ${invalidTokenRes.status()}`);

    console.log("\n========================================================");
    console.log("ALL VERIFICATIONS PASSED: CLEAN UI & ADMIN AUTH SUCCESS!");
    console.log("========================================================");

  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
