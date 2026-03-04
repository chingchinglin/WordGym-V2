/**
 * 測試初次使用者流程
 * 檢查選擇版本後，冊次和課次選單是否會立即顯示
 * 
 * 使用方法：
 * 1. 清除所有快取（使用 clear-all-cache.js）
 * 2. 重新整理頁面
 * 3. 在瀏覽器控制台執行此腳本
 */

console.log('🧪 開始測試初次使用者流程...\n');

// 檢查關鍵狀態
function checkFirstTimeUserFlow() {
  const results = {
    hasFallbackData: false,
    hasUserSettings: false,
    datasetTextbookIndexLength: 0,
    availableVols: [],
    filtersVisible: false,
    issues: []
  };

  // 1. 檢查是否有 fallback 資料
  try {
    // 嘗試從 window 或 React DevTools 取得資料
    const data = window.__WORDGYM_DATA__ || [];
    results.hasFallbackData = data.length > 0;
    console.log(`1. Fallback 資料: ${results.hasFallbackData ? `✅ 有 (${data.length} 筆)` : '❌ 無'}`);
  } catch (e) {
    console.log('1. Fallback 資料: ⚠️ 無法檢查');
  }

  // 2. 檢查用戶設定
  try {
    const userSettings = localStorage.getItem('wordgym_user_settings_v1');
    if (userSettings) {
      const settings = JSON.parse(userSettings);
      results.hasUserSettings = !!(settings.version && settings.stage);
      console.log(`2. 用戶設定: ${results.hasUserSettings ? `✅ 已選擇 (${settings.stage} - ${settings.version})` : '❌ 未選擇'}`);
    } else {
      console.log('2. 用戶設定: ❌ 未選擇');
    }
  } catch (e) {
    console.log('2. 用戶設定: ⚠️ 無法檢查');
  }

  // 3. 檢查 DOM 中的選單元素
  try {
    const volSelect = document.querySelector('[class*="冊次"]')?.parentElement?.querySelector('select, button');
    const lessonGrid = document.querySelector('[class*="課次"]')?.parentElement?.querySelector('[class*="grid"]');
    
    results.filtersVisible = !!(volSelect || lessonGrid);
    console.log(`3. 選單顯示: ${results.filtersVisible ? '✅ 可見' : '❌ 不可見'}`);
    
    if (volSelect) {
      const options = volSelect.querySelectorAll('option, button');
      console.log(`   冊次選單選項數: ${options.length}`);
    }
    
    if (lessonGrid) {
      const lessons = lessonGrid.querySelectorAll('button');
      console.log(`   課次選單選項數: ${lessons.length}`);
    }
  } catch (e) {
    console.log('3. 選單顯示: ⚠️ 無法檢查');
  }

  // 4. 檢查是否有錯誤訊息
  try {
    const errorMessage = document.querySelector('[class*="資料建置中"]');
    if (errorMessage) {
      results.issues.push('顯示「資料建置中...」訊息');
      console.log('4. 錯誤訊息: ⚠️ 顯示「資料建置中...」');
    } else {
      console.log('4. 錯誤訊息: ✅ 無');
    }
  } catch (e) {
    console.log('4. 錯誤訊息: ⚠️ 無法檢查');
  }

  // 5. 檢查 React 組件狀態（如果可用）
  try {
    // 嘗試從 React DevTools 取得狀態
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('5. React DevTools: ✅ 可用（可手動檢查組件狀態）');
    } else {
      console.log('5. React DevTools: ℹ️ 未安裝（可選）');
    }
  } catch (e) {
    console.log('5. React DevTools: ⚠️ 無法檢查');
  }

  // 總結
  console.log('\n📊 測試結果總結:');
  console.log('─'.repeat(50));
  
  if (!results.hasUserSettings) {
    console.log('⚠️ 尚未選擇版本，請先選擇版本後再測試');
    console.log('💡 測試步驟：');
    console.log('   1. 點擊右上角的版本選擇');
    console.log('   2. 選擇學程（國中/高中）');
    console.log('   3. 選擇版本（例如：龍騰）');
    console.log('   4. 再次執行此測試腳本');
  } else if (!results.filtersVisible) {
    console.log('❌ 問題確認：選單未顯示！');
    console.log('🔍 可能原因：');
    console.log('   - dataset.textbook_index 為空');
    console.log('   - availableVols 為空');
    console.log('   - 版本名稱不匹配');
    console.log('💡 請檢查瀏覽器控制台的錯誤訊息');
  } else {
    console.log('✅ 選單正常顯示！');
  }
  
  console.log('─'.repeat(50));
  
  return results;
}

// 執行測試
const results = checkFirstTimeUserFlow();

// 提供手動檢查命令
console.log('\n🔧 手動檢查命令:');
console.log('─'.repeat(50));
console.log('// 檢查 localStorage 中的用戶設定');
console.log('JSON.parse(localStorage.getItem("wordgym_user_settings_v1"))');
console.log('');
console.log('// 檢查 IndexedDB 快取');
console.log('indexedDB.databases().then(dbs => console.log("Databases:", dbs))');
console.log('');
console.log('// 檢查頁面中的選單元素');
console.log('document.querySelectorAll("[class*=\\"冊次\\"], [class*=\\"課次\\"]")');
console.log('─'.repeat(50));
