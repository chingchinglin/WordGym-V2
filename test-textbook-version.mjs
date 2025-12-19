import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext()).newPage();

  console.log('測試：課本進度版本匹配\n');

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
  });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(6000);

  console.log('\n=== 相關 Debug Logs ===\n');
  const versionLogs = logs.filter(l => 
    l.includes('版本') || 
    l.includes('Version') || 
    l.includes('textbook_index') ||
    l.includes('Unique versions')
  );
  
  versionLogs.forEach(log => console.log(log));

  console.log('\n=== 檢查課本進度 Tab ===\n');
  
  const wordCount = await page.locator('text=/符合條件的單字/').textContent().catch(() => '');
  console.log('單字統計:', wordCount);

  const hasError = await page.locator('text=資料尚未建立').count();
  console.log('錯誤訊息:', hasError > 0 ? '有（問題）' : '無');

  await page.screenshot({ path: 'screenshot-textbook-debug.png' });
  await browser.close();
})();
