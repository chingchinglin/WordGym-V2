/**
 * 清除 WordGym 快取腳本
 * 
 * 使用方法：
 * 1. 在瀏覽器中開啟應用程式
 * 2. 開啟開發者工具（F12）
 * 3. 切換到 Console 標籤
 * 4. 複製並貼上此腳本執行
 * 
 * 或直接在控制台執行：
 *   indexedDB.deleteDatabase('wordgym-vocabulary')
 */

// 清除 IndexedDB 快取
async function clearWordGymCache() {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase('wordgym-vocabulary');
    
    deleteRequest.onsuccess = () => {
      console.log('✅ 快取已清除！請重新整理頁面以載入最新資料。');
      resolve();
    };
    
    deleteRequest.onerror = () => {
      console.error('❌ 清除快取失敗:', deleteRequest.error);
      reject(deleteRequest.error);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('⚠️ 快取正在使用中，請關閉其他標籤頁後重試');
    };
  });
}

// 執行清除
clearWordGymCache()
  .then(() => {
    console.log('💡 提示：請重新整理頁面（F5 或 Cmd/Ctrl+R）以載入最新資料');
  })
  .catch((error) => {
    console.error('清除失敗:', error);
  });
