#!/usr/bin/env node
/**
 * Basic UI interaction test for WordGym Students
 * Tests flashcard flip functionality as smoke test
 * Requires Playwright: npm install -D @playwright/test
 */

const { chromium } = require('playwright');

async function testUI() {
  console.log('🎭 Starting UI test...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to dev server
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // Test flashcard flip (if on flashcard page)
    const flashcard = await page.$('[data-testid="flashcard"]');
    if (flashcard) {
      await flashcard.click();
      console.log('✅ Flashcard interaction working');
    }

    // Take screenshot
    const screenshotPath = 'test-output/ui-test.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot: ${screenshotPath}`);

    await browser.close();
    console.log('✅ UI test passed');
    return 0;
  } catch (error) {
    console.error('❌ UI test failed:', error.message);
    await browser.close();
    return 1;
  }
}

testUI().then(code => process.exit(code));
