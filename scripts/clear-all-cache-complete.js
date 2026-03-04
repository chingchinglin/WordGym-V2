/**
 * 完整清除 WordGym 所有快取和本地儲存
 * 確保回到完全初始狀態
 * 
 * 使用方法：
 * 1. 在瀏覽器中開啟應用程式 (http://localhost:5173)
 * 2. 開啟開發者工具（F12 或 Cmd+Option+I）
 * 3. 切換到 Console 標籤
 * 4. 複製並貼上此腳本執行
 * 5. 頁面會自動重新載入
 */

async function clearAllWordGymDataComplete() {
  console.log('🧹 開始完整清除 WordGym 所有資料...\n');

  // 1. 清除 IndexedDB 快取
  try {
    const deleteRequest = indexedDB.deleteDatabase('wordgym-vocabulary');
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => {
        console.log('✅ IndexedDB 快取已清除');
        resolve();
      };
      deleteRequest.onerror = () => {
        console.error('❌ IndexedDB 清除失敗:', deleteRequest.error);
        reject(deleteRequest.error);
      };
      deleteRequest.onblocked = () => {
        console.warn('⚠️ IndexedDB 正在使用中，請關閉其他標籤頁後重試');
        resolve(); // 繼續執行其他清除
      };
    });
  } catch (error) {
    console.error('清除 IndexedDB 時發生錯誤:', error);
  }

  // 2. 清除所有 LocalStorage（使用更徹底的方法）
  try {
    const allKeys = Object.keys(localStorage);
    let clearedCount = 0;
    allKeys.forEach(key => {
      if (key.includes('wordgym') || 
          key.includes('mvp_vocab') || 
          key.includes('wordgym') ||
          key.toLowerCase().includes('wordgym')) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });
    console.log(`✅ LocalStorage 已清除 ${clearedCount} 個項目`);
    
    // 特別檢查並清除 userSettings
    const userSettingsKey = 'wordgym_user_settings_v1';
    if (localStorage.getItem(userSettingsKey)) {
      localStorage.removeItem(userSettingsKey);
      console.log('✅ 已特別清除 userSettings');
    }
  } catch (error) {
    console.error('清除 LocalStorage 時發生錯誤:', error);
  }

  // 3. 清除所有 SessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ SessionStorage 已清除');
  } catch (error) {
    console.error('清除 SessionStorage 時發生錯誤:', error);
  }

  // 4. 清除所有 Cookies（如果有）
  try {
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      if (name.includes('wordgym') || name.includes('mvp_vocab')) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    });
    console.log('✅ Cookies 已清除');
  } catch (error) {
    console.error('清除 Cookies 時發生錯誤:', error);
  }

  console.log('\n✨ 所有資料已清除完成！');
  console.log('💡 正在重新載入頁面（3 秒後）...');
  console.log('📝 重新載入後，您應該會看到 WelcomeModal 選擇版本');
  
  // 等待一下讓用戶看到訊息，然後自動重新載入
  setTimeout(() => {
    console.log('🔄 重新載入頁面...');
    window.location.reload();
  }, 3000);
}

// 執行清除
clearAllWordGymDataComplete()
  .catch((error) => {
    console.error('清除過程中發生錯誤:', error);
    console.log('💡 請手動重新整理頁面（F5 或 Cmd+R）');
  });
