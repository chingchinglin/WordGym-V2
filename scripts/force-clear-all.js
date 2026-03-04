/**
 * 強制清除所有 WordGym 資料
 * 確保完全回到初始狀態
 * 
 * 使用方法：在瀏覽器控制台執行
 */

async function forceClearAll() {
  console.log('🧹 開始強制清除所有資料...\n');

  // 1. 強制清除 IndexedDB
  try {
    // 先列出所有資料庫
    const databases = await indexedDB.databases();
    console.log('找到的 IndexedDB 資料庫:', databases.map(db => db.name));
    
    // 刪除所有包含 wordgym 的資料庫
    for (const db of databases) {
      if (db.name.includes('wordgym') || db.name.includes('vocabulary')) {
        await new Promise((resolve, reject) => {
          const deleteReq = indexedDB.deleteDatabase(db.name);
          deleteReq.onsuccess = () => {
            console.log(`✅ 已刪除資料庫: ${db.name}`);
            resolve();
          };
          deleteReq.onerror = () => {
            console.warn(`⚠️ 無法刪除資料庫: ${db.name}`);
            resolve(); // 繼續執行
          };
          deleteReq.onblocked = () => {
            console.warn(`⚠️ 資料庫被占用: ${db.name}`);
            resolve(); // 繼續執行
          };
        });
      }
    }
  } catch (error) {
    console.error('清除 IndexedDB 時發生錯誤:', error);
  }

  // 2. 強制清除所有相關的 localStorage
  try {
    const allKeys = Object.keys(localStorage);
    const wordgymKeys = allKeys.filter(k => 
      k.includes('wordgym') || 
      k.includes('mvp_vocab') ||
      k.toLowerCase().includes('wordgym')
    );
    
    console.log('找到的 localStorage keys:', wordgymKeys);
    
    wordgymKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ 已清除: ${key}`);
    });
    
    // 特別檢查 userSettings
    const userSettingsKey = 'wordgym_user_settings_v1';
    if (localStorage.getItem(userSettingsKey)) {
      localStorage.removeItem(userSettingsKey);
      console.log(`✅ 已特別清除: ${userSettingsKey}`);
    }
    
    // 再次確認
    const remaining = Object.keys(localStorage).filter(k => 
      k.includes('wordgym') || k.includes('mvp_vocab')
    );
    if (remaining.length > 0) {
      console.warn('⚠️ 仍有殘留的 keys:', remaining);
      remaining.forEach(k => localStorage.removeItem(k));
    }
    
    console.log(`✅ LocalStorage 清除完成`);
  } catch (error) {
    console.error('清除 LocalStorage 時發生錯誤:', error);
  }

  // 3. 清除 SessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ SessionStorage 已清除');
  } catch (error) {
    console.error('清除 SessionStorage 時發生錯誤:', error);
  }

  // 4. 驗證清除結果
  console.log('\n📊 驗證清除結果:');
  const settings = localStorage.getItem('wordgym_user_settings_v1');
  console.log('userSettings:', settings ? '❌ 仍存在' : '✅ 已清除');
  
  const dbs = await indexedDB.databases();
  const hasWordGym = dbs.some(db => db.name.includes('wordgym'));
  console.log('IndexedDB:', hasWordGym ? '❌ 仍存在' : '✅ 已清除');

  console.log('\n✨ 清除完成！');
  console.log('💡 正在重新載入頁面（2 秒後）...');
  
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// 執行清除
forceClearAll().catch(error => {
  console.error('清除失敗:', error);
  console.log('💡 請手動重新整理頁面');
});
