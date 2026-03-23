# 測試初次使用者流程

## 📋 測試目標

確認初次使用者選擇版本後，**冊次和課次選單是否會立即顯示**，不需要重新選擇版本。

## 🧪 測試步驟

### 步驟 1：清除所有快取

在瀏覽器控制台執行：

```javascript
// 清除所有 WordGym 資料
async function clearAll() {
  // 清除 IndexedDB
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('wordgym-vocabulary');
    req.onsuccess = () => { console.log('✅ IndexedDB 已清除'); resolve(); };
    req.onerror = () => { console.log('⚠️ IndexedDB 清除失敗'); resolve(); };
  });
  
  // 清除 LocalStorage
  const keys = Object.keys(localStorage);
  keys.forEach(k => {
    if (k.includes('wordgym') || k.includes('mvp_vocab')) {
      localStorage.removeItem(k);
    }
  });
  console.log('✅ LocalStorage 已清除');
  
  // 清除 SessionStorage
  sessionStorage.clear();
  console.log('✅ SessionStorage 已清除');
  
  console.log('✨ 完成！請重新整理頁面');
}

clearAll();
```

### 步驟 2：重新整理頁面

按 `F5` 或 `Cmd+R` 重新整理頁面。

### 步驟 3：選擇版本

1. 應該會看到 **WelcomeModal**（選擇學程和版本）
2. 選擇學程：**高中**
3. 選擇版本：**龍騰**
4. 點擊確認

### 步驟 4：檢查選單是否顯示

選擇版本後，立即檢查：

1. **視覺檢查**：
   - ✅ 是否看到「冊次」選單？
   - ✅ 是否看到「課次（可複選）」選單？
   - ❌ 是否看到「資料建置中...」訊息？

2. **控制台檢查**：
   在瀏覽器控制台執行測試腳本：

```javascript
// 檢查關鍵狀態
function checkFilters() {
  console.log('🔍 檢查選單狀態...\n');
  
  // 1. 檢查用戶設定
  const settings = JSON.parse(localStorage.getItem('wordgym_user_settings_v1') || '{}');
  console.log('用戶設定:', settings);
  
  // 2. 檢查選單元素
  const volLabel = Array.from(document.querySelectorAll('label')).find(el => el.textContent.includes('冊次'));
  const lessonLabel = Array.from(document.querySelectorAll('label')).find(el => el.textContent.includes('課次'));
  
  console.log('冊次標籤:', volLabel ? '✅ 存在' : '❌ 不存在');
  console.log('課次標籤:', lessonLabel ? '✅ 存在' : '❌ 不存在');
  
  // 3. 檢查選單內容
  if (volLabel) {
    const volSelect = volLabel.parentElement?.querySelector('select, button');
    const volOptions = volSelect?.querySelectorAll('option, button') || [];
    console.log('冊次選項數:', volOptions.length);
    if (volOptions.length > 0) {
      console.log('冊次選項:', Array.from(volOptions).map(opt => opt.textContent || opt.value));
    }
  }
  
  if (lessonLabel) {
    const lessonGrid = lessonLabel.parentElement?.querySelector('[class*="grid"]');
    const lessonButtons = lessonGrid?.querySelectorAll('button') || [];
    console.log('課次選項數:', lessonButtons.length);
    if (lessonButtons.length > 0) {
      console.log('課次選項:', Array.from(lessonButtons).slice(0, 5).map(btn => btn.textContent));
    }
  }
  
  // 4. 檢查錯誤訊息
  const errorMsg = document.querySelector('[class*="資料建置中"]');
  if (errorMsg) {
    console.log('⚠️ 顯示錯誤訊息:', errorMsg.textContent);
  }
  
  // 5. 總結
  const hasVolMenu = volLabel && volLabel.parentElement?.querySelector('select, button');
  const hasLessonMenu = lessonLabel && lessonLabel.parentElement?.querySelector('[class*="grid"]');
  
  console.log('\n📊 測試結果:');
  if (hasVolMenu && hasLessonMenu) {
    console.log('✅ 選單正常顯示！');
  } else {
    console.log('❌ 選單未顯示！');
    console.log('💡 請檢查：');
    console.log('   - 是否有錯誤訊息');
    console.log('   - 瀏覽器控制台是否有錯誤');
    console.log('   - 資料是否正在載入');
  }
}

checkFilters();
```

## ✅ 預期結果

### 正常情況（應該發生）

1. ✅ 選擇版本後，**立即**看到冊次和課次選單
2. ✅ 冊次選單顯示選項（例如：B1(第一冊), B2(第二冊)...）
3. ✅ 課次選單顯示選項（例如：U1, U2, U3...）
4. ✅ 不需要重新選擇版本

### 異常情況（不應該發生）

1. ❌ 選擇版本後，看不到冊次和課次選單
2. ❌ 顯示「資料建置中...」訊息
3. ❌ 需要重新選擇版本才能看到選單

## 🐛 如果發現問題

如果選單未顯示，請提供：

1. **瀏覽器控制台的錯誤訊息**
2. **執行檢查腳本後的輸出**
3. **選擇的版本名稱**（例如：「龍騰」或「龍騰版」）
4. **是否有顯示「資料建置中...」訊息**

## 📝 測試記錄

請記錄測試結果：

- [ ] 測試日期：___________
- [ ] 瀏覽器：___________
- [ ] 選擇的版本：___________
- [ ] 選單是否立即顯示：是 / 否
- [ ] 如果否，問題描述：___________
