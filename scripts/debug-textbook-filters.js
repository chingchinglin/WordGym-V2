/**
 * 除錯 TextbookFilters 組件
 * 檢查為什麼選單沒有顯示
 * 
 * 使用方法：
 * 1. 選擇版本後
 * 2. 在瀏覽器控制台執行此腳本
 */

console.log('🔍 除錯 TextbookFilters 組件...\n');

// 1. 檢查 userSettings
try {
  const userSettings = JSON.parse(localStorage.getItem('wordgym_user_settings_v1') || '{}');
  console.log('1. userSettings:', userSettings);
  console.log('   - version:', userSettings.version);
  console.log('   - stage:', userSettings.stage);
  console.log('   - hasUserVersion:', !!(userSettings.version && userSettings.stage));
} catch (e) {
  console.error('1. 無法讀取 userSettings:', e);
}

// 2. 檢查 dataset.textbook_index（從 words 中提取）
console.log('\n2. 檢查 dataset.textbook_index:');
console.log('   ⚠️ 需要從 React 組件中取得，請在 React DevTools 中檢查');
console.log('   💡 或檢查 words 資料：');

// 3. 檢查版本匹配
try {
  const userSettings = JSON.parse(localStorage.getItem('wordgym_user_settings_v1') || '{}');
  if (userSettings.version) {
    console.log('\n3. 版本匹配檢查:');
    console.log('   選擇的版本:', userSettings.version);
    console.log('   標準化後:', userSettings.version.replace('版', '').trim());
    console.log('   💡 資料中的版本應該是: 三民、南一、康軒、翰林、龍騰');
  }
} catch (e) {
  console.error('3. 版本匹配檢查失敗:', e);
}

// 4. 檢查 DOM 元素
console.log('\n4. 檢查 DOM 元素:');
const volLabel = Array.from(document.querySelectorAll('label')).find(el => el.textContent.includes('冊次'));
const lessonLabel = Array.from(document.querySelectorAll('label')).find(el => el.textContent.includes('課次'));
const errorMsg = document.querySelector('[class*="資料建置中"]');

console.log('   冊次標籤:', volLabel ? '✅ 存在' : '❌ 不存在');
console.log('   課次標籤:', lessonLabel ? '✅ 存在' : '❌ 不存在');
console.log('   錯誤訊息:', errorMsg ? '⚠️ ' + errorMsg.textContent : '✅ 無');

// 5. 檢查條件
console.log('\n5. 可能的原因:');
if (!volLabel && !lessonLabel) {
  console.log('   ❌ 選單完全沒有渲染');
  console.log('   可能原因：');
  console.log('     1. hasUserVersion = false（userSettings 未正確讀取）');
  console.log('     2. TextbookFilters 返回了 null');
  console.log('     3. currentTab !== "textbook"');
} else if (volLabel && !volLabel.parentElement?.querySelector('select, button')) {
  console.log('   ⚠️ 標籤存在但選單元素不存在');
  console.log('   可能原因：');
  console.log('     1. availableVols 為空');
  console.log('     2. 版本名稱不匹配');
  console.log('     3. dataset.textbook_index 為空');
}

console.log('\n💡 建議：');
console.log('   1. 安裝 React DevTools 擴充功能');
console.log('   2. 檢查 TextbookFilters 組件的 props 和 state');
console.log('   3. 檢查 availableVols 的值');
console.log('   4. 檢查 dataset.textbook_index 的內容');
