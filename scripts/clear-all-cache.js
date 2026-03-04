/**
 * 清除 WordGym 所有快取和本地儲存
 * 讓環境回到第一次使用的狀態
 * 
 * 使用方法：
 * 1. 在瀏覽器中開啟應用程式 (http://localhost:5173)
 * 2. 開啟開發者工具（F12 或 Cmd+Option+I）
 * 3. 切換到 Console 標籤
 * 4. 複製並貼上此腳本執行
 * 5. 重新整理頁面（F5 或 Cmd+R）
 */

async function clearAllWordGymData() {
  console.log('🧹 開始清除 WordGym 所有資料...\n');

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

  // 2. 清除 LocalStorage
  const localStorageKeys = [
    'mvp_vocab_favorites',
    'mvp_vocab_dataset_v36',
    'mvp_vocab_preset_applied_v36',
    'mvp_home_filters_v1',
    'mvp_vocab_user_examples_v1',
    'mvp_vocab_quiz_history_v1',
    'mvp_vocab_user_name_v1',
    'wordgym_user_settings_v1',
    'wordgym_current_tab_v1',
    'wordgym_filters_v1',
    'wordgym_quick_filter_pos_v1',
  ];

  let clearedLocalStorage = 0;
  localStorageKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedLocalStorage++;
    }
  });
  console.log(`✅ LocalStorage 已清除 ${clearedLocalStorage} 個項目`);

  // 3. 清除所有 LocalStorage（以防遺漏）
  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('wordgym') || key.includes('mvp_vocab')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('清除 LocalStorage 時發生錯誤:', error);
  }

  // 4. 清除 SessionStorage
  try {
    const sessionKeys = [
      'wordgym_quiz_range_v1',
    ];
    let clearedSession = 0;
    sessionKeys.forEach(key => {
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
        clearedSession++;
      }
    });
    console.log(`✅ SessionStorage 已清除 ${clearedSession} 個項目`);
    
    // 清除所有 SessionStorage（以防遺漏）
    sessionStorage.clear();
  } catch (error) {
    console.error('清除 SessionStorage 時發生錯誤:', error);
  }

  console.log('\n✨ 所有資料已清除完成！');
  console.log('💡 正在重新載入頁面...');
  console.log('📝 清除後，您需要重新選擇學程和課本版本');
  
  // 等待一下讓用戶看到訊息，然後自動重新載入
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

// 執行清除
clearAllWordGymData()
  .catch((error) => {
    console.error('清除過程中發生錯誤:', error);
    console.log('💡 請手動重新整理頁面（F5 或 Cmd+R）');
  });
